-- Function to get pending wallet deposits
CREATE OR REPLACE FUNCTION get_pending_wallet_deposits()
RETURNS TABLE (count bigint, total_amount numeric) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint, 
    COALESCE(SUM((metadata->>'amount')::numeric), 0)::numeric
  FROM invoices
  WHERE 
    user_id = auth.uid() AND 
    status = 'issued' AND 
    invoice_type = 'wallet_deposit';
END;
$$ LANGUAGE plpgsql;

-- Function to check and process pending wallet deposits
CREATE OR REPLACE FUNCTION check_pending_wallet_deposits()
RETURNS json
SECURITY DEFINER
AS $$
DECLARE
  processed_count integer := 0;
  processed_invoices json;
  invoice_record record;
  result boolean;
BEGIN
  -- Find pending invoices
  FOR invoice_record IN 
    SELECT i.id
    FROM invoices i
    WHERE i.user_id = auth.uid()
      AND i.status = 'issued'
      AND i.invoice_type = 'wallet_deposit'
  LOOP
    -- Update invoice status
    UPDATE invoices
    SET status = 'paid'
    WHERE id = invoice_record.id;
    
    -- Credit the wallet
    SELECT credit_wallet_from_invoice(invoice_record.id) INTO result;
    
    IF result THEN
      processed_count := processed_count + 1;
    END IF;
  END LOOP;
  
  -- Return result
  IF processed_count > 0 THEN
    SELECT json_agg(id) INTO processed_invoices
    FROM invoices
    WHERE user_id = auth.uid()
      AND status = 'paid'
      AND invoice_type = 'wallet_deposit'
      AND updated_at > NOW() - interval '1 minute';
    
    RETURN json_build_object(
      'processed', true,
      'count', processed_count,
      'invoices', processed_invoices
    );
  ELSE
    RETURN json_build_object('processed', false, 'count', 0);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create a user wallet
CREATE OR REPLACE FUNCTION get_or_create_user_wallet(p_user_id uuid)
RETURNS json
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_record record;
BEGIN
  -- First, try to get existing wallet
  SELECT * INTO wallet_record
  FROM user_wallets
  WHERE user_id = p_user_id;
  
  -- If wallet doesn't exist, create a new one
  IF wallet_record IS NULL THEN
    INSERT INTO user_wallets (user_id, balance, currency)
    VALUES (p_user_id, 0, 'AOA')
    RETURNING * INTO wallet_record;
  END IF;
  
  -- Return wallet data as JSON
  RETURN row_to_json(wallet_record);
END;
$$ LANGUAGE plpgsql;

-- Function to create a wallet deposit invoice
CREATE OR REPLACE FUNCTION create_wallet_deposit_invoice(
  p_user_id uuid,
  p_amount numeric,
  p_payment_method text
)
RETURNS json
SECURITY DEFINER
AS $$
DECLARE
  new_invoice_id uuid;
  new_invoice_number text;
  due_date timestamp with time zone;
  order_id text;
BEGIN
  -- Generate invoice number (simple example)
  new_invoice_number := 'WD-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 10000)::text;
  
  -- Set due date to 48 hours from now
  due_date := now() + interval '48 hours';
  
  -- Generate order ID
  order_id := 'wallet-deposit-' || substr(uuid_generate_v4()::text, 1, 8);
  
  -- Insert invoice
  INSERT INTO invoices (
    invoice_number,
    user_id,
    due_date,
    order_id,
    status,
    invoice_type,
    total_amount,
    currency,
    payment_method,
    token,
    metadata
  )
  VALUES (
    new_invoice_number,
    p_user_id,
    due_date,
    order_id,
    'issued',
    'wallet_deposit',
    p_amount,
    'AOA',
    p_payment_method,
    uuid_generate_v4(),
    jsonb_build_object('amount', p_amount, 'description', 'Depósito na carteira')
  )
  RETURNING id INTO new_invoice_id;
  
  -- Return the result
  RETURN json_build_object(
    'success', true,
    'invoice_id', new_invoice_id,
    'invoice_number', new_invoice_number
  );
END;
$$ LANGUAGE plpgsql;

-- Function to credit wallet from invoice
CREATE OR REPLACE FUNCTION credit_wallet_from_invoice(p_invoice_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice record;
  v_wallet record;
  v_amount numeric;
  v_new_balance numeric;
BEGIN
  -- Get invoice details
  SELECT i.id, i.user_id, i.status, (i.metadata->>'amount')::numeric AS amount
  INTO v_invoice
  FROM invoices i
  WHERE i.id = p_invoice_id;

  -- If invoice not found or already processed, exit
  IF v_invoice IS NULL OR v_invoice.amount IS NULL OR v_invoice.amount <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Set amount
  v_amount := v_invoice.amount;

  -- Update invoice status if not already paid
  UPDATE invoices
  SET status = 'paid'
  WHERE id = p_invoice_id AND status != 'paid';

  -- Find the user's wallet
  SELECT id, user_id, balance
  INTO v_wallet
  FROM user_wallets
  WHERE user_id = v_invoice.user_id;

  -- If wallet not found, create one
  IF v_wallet IS NULL THEN
    INSERT INTO user_wallets (user_id, balance, currency, created_at, updated_at)
    VALUES (v_invoice.user_id, v_amount, 'AOA', NOW(), NOW())
    RETURNING id, user_id, balance INTO v_wallet;
    
    v_new_balance := v_amount;
  ELSE
    -- Update existing wallet balance
    v_new_balance := v_wallet.balance + v_amount;
    
    UPDATE user_wallets
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE id = v_wallet.id;
  END IF;

  -- Create a transaction record
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    balance_after,
    type,
    category,
    description,
    reference_id,
    reference_type,
    status,
    created_at
  )
  VALUES (
    v_wallet.id,
    v_amount,
    v_new_balance,
    'credit',
    'deposit',
    'Depósito - Fatura #' || (SELECT invoice_number FROM invoices WHERE id = p_invoice_id),
    p_invoice_id::text,
    'invoice',
    'completed',
    NOW()
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to process wallet payment webhook
CREATE OR REPLACE FUNCTION process_wallet_payment_webhook(
  p_payment_reference text,
  p_status text,
  p_transaction_id text
)
RETURNS json
SECURITY DEFINER
AS $$
DECLARE
  v_payment_ref record;
  v_result boolean;
BEGIN
  -- Find the payment reference
  SELECT *
  INTO v_payment_ref
  FROM payment_references
  WHERE reference = p_payment_reference;

  IF v_payment_ref IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Payment reference not found');
  END IF;

  -- Update payment reference status
  UPDATE payment_references
  SET status = CASE WHEN p_status = 'ACCEPTED' THEN 'paid' ELSE 'failed' END,
      updated_at = NOW()
  WHERE id = v_payment_ref.id;

  -- If payment was successful, update invoice and credit wallet
  IF p_status = 'ACCEPTED' THEN
    -- Credit wallet through dedicated function
    SELECT credit_wallet_from_invoice(v_payment_ref.invoice_id) INTO v_result;
    
    IF NOT v_result THEN
      RETURN json_build_object('success', FALSE, 'error', 'Failed to credit wallet');
    END IF;
    
    RETURN json_build_object('success', TRUE);
  END IF;

  RETURN json_build_object('success', FALSE, 'error', 'Payment status not accepted');
END;
$$ LANGUAGE plpgsql;
</lov-write>