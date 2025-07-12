
-- Function to get pending wallet deposits
CREATE OR REPLACE FUNCTION get_pending_wallet_deposits(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'count', COUNT(i.id),
    'total_amount', COALESCE(SUM((i.metadata->>'amount')::numeric), 0)
  ) INTO v_result
  FROM invoices i
  WHERE i.user_id = p_user_id
  AND i.status = 'issued'
  AND i.notes ILIKE '%carteira%';
  
  RETURN v_result;
END;
$$;

-- Function to get or create a user wallet
CREATE OR REPLACE FUNCTION get_or_create_user_wallet(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_wallet_balance NUMERIC;
  v_result JSON;
BEGIN
  -- Check if wallet exists
  SELECT id, balance INTO v_wallet_id, v_wallet_balance
  FROM user_wallets
  WHERE user_id = p_user_id;
  
  -- If not, create one
  IF v_wallet_id IS NULL THEN
    INSERT INTO user_wallets (user_id, balance, currency, created_at, updated_at)
    VALUES (p_user_id, 0, 'AOA', NOW(), NOW())
    RETURNING id, balance INTO v_wallet_id, v_wallet_balance;
  END IF;
  
  -- Return wallet info
  SELECT json_build_object(
    'id', v_wallet_id,
    'user_id', p_user_id,
    'balance', v_wallet_balance
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to create a wallet deposit invoice
CREATE OR REPLACE FUNCTION create_wallet_deposit_invoice(
  p_invoice_number TEXT,
  p_user_id UUID,
  p_due_date TIMESTAMP WITH TIME ZONE,
  p_order_id TEXT,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
  v_result JSON;
BEGIN
  -- Create the invoice
  INSERT INTO invoices (
    invoice_number,
    user_id,
    status,
    created_at,
    updated_at,
    due_date,
    company_details,
    payment_instructions,
    is_public,
    public_token,
    order_id,
    notes,
    metadata
  )
  VALUES (
    p_invoice_number,
    p_user_id,
    'draft',
    NOW(),
    NOW(),
    p_due_date,
    'AngoHost - Prestação de Serviços, LDA',
    CASE 
      WHEN p_payment_method = 'multicaixa' THEN 'Pagamento via Multicaixa Express'
      ELSE 'Pagamento via Transferência Bancária'
    END,
    TRUE,
    uuid_generate_v4(),
    p_order_id,
    'Adição de fundos à carteira',
    jsonb_build_object('description', 'Depósito na carteira', 'amount', p_amount)
  )
  RETURNING id INTO v_invoice_id;

  -- Create order item
  INSERT INTO order_items (
    order_id,
    name,
    description,
    quantity,
    unit_price,
    total
  )
  VALUES (
    p_order_id,
    'Adição de Fundos à Carteira',
    'Depósito na carteira',
    1,
    p_amount,
    p_amount
  );

  -- Create payment reference
  INSERT INTO payment_references (
    invoice_id,
    reference,
    amount,
    status,
    payment_method,
    token,
    order_id
  )
  VALUES (
    v_invoice_id,
    'WALLET-' || substring(v_invoice_id::text, 1, 8),
    p_amount,
    'pending',
    p_payment_method,
    p_token,
    p_order_id
  );

  -- Update invoice status to issued
  UPDATE invoices
  SET status = 'issued'
  WHERE id = v_invoice_id;

  -- Return invoice info
  SELECT json_build_object(
    'id', v_invoice_id,
    'invoice_number', p_invoice_number
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to credit wallet from invoice
CREATE OR REPLACE FUNCTION credit_wallet_from_invoice(p_invoice_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice RECORD;
  v_wallet RECORD;
  v_amount NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Get invoice details
  SELECT i.id, i.user_id, i.status, (i.metadata->>'amount')::numeric AS amount
  INTO v_invoice
  FROM invoices i
  WHERE i.id = p_invoice_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- If no amount in metadata or already paid, exit
  IF v_invoice.amount IS NULL OR v_invoice.amount <= 0 OR v_invoice.status = 'paid' THEN
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
  IF NOT FOUND THEN
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
    p_invoice_id,
    'invoice',
    'completed',
    NOW()
  );

  RETURN TRUE;
END;
$$;

-- Function to check pending wallet deposits for a user
CREATE OR REPLACE FUNCTION check_pending_wallet_deposits(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed INTEGER := 0;
  v_invoice_record RECORD;
  v_result BOOLEAN;
BEGIN
  -- For each pending invoice related to wallet
  FOR v_invoice_record IN 
    SELECT i.id
    FROM invoices i
    JOIN payment_references pr ON pr.invoice_id = i.id
    WHERE i.user_id = p_user_id
    AND i.status = 'issued'
    AND i.notes ILIKE '%carteira%'
    AND pr.status = 'paid'
  LOOP
    -- Credit the wallet
    SELECT credit_wallet_from_invoice(v_invoice_record.id) INTO v_result;
    
    IF v_result THEN
      v_processed := v_processed + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object('processed', v_processed);
END;
$$;

-- Function to process wallet payment webhook
CREATE OR REPLACE FUNCTION process_wallet_payment_webhook(
  p_payment_reference TEXT,
  p_status TEXT,
  p_transaction_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_ref RECORD;
  v_result BOOLEAN;
BEGIN
  -- Find the payment reference
  SELECT *
  INTO v_payment_ref
  FROM payment_references
  WHERE reference = p_payment_reference;

  IF NOT FOUND THEN
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
$$;
