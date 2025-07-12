
-- Create extension for UUIDs if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create the wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  balance_after NUMERIC,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create the wallet_transfers table
CREATE TABLE IF NOT EXISTS wallet_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  to_wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create the wallet_notifications table
CREATE TABLE IF NOT EXISTS wallet_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_on_transaction BOOLEAN NOT NULL DEFAULT true,
  notify_on_low_balance BOOLEAN NOT NULL DEFAULT true,
  low_balance_threshold NUMERIC NOT NULL DEFAULT 5000,
  notify_via_email BOOLEAN NOT NULL DEFAULT true,
  notify_via_sms BOOLEAN NOT NULL DEFAULT false,
  notify_via_push BOOLEAN NOT NULL DEFAULT true,
  weekly_summary BOOLEAN NOT NULL DEFAULT true,
  monthly_summary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create stored procedures for wallet operations
CREATE OR REPLACE FUNCTION get_user_wallet(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', w.id,
    'user_id', w.user_id,
    'balance', w.balance,
    'currency', w.currency,
    'created_at', w.created_at,
    'updated_at', w.updated_at
  )
  INTO result
  FROM wallets w
  WHERE w.user_id = get_user_wallet.user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new wallet
CREATE OR REPLACE FUNCTION create_user_wallet(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  new_wallet_id UUID;
  result JSONB;
BEGIN
  INSERT INTO wallets (user_id)
  VALUES (create_user_wallet.user_id)
  RETURNING id INTO new_wallet_id;
  
  SELECT jsonb_build_object(
    'id', w.id,
    'user_id', w.user_id,
    'balance', w.balance,
    'currency', w.currency,
    'created_at', w.created_at,
    'updated_at', w.updated_at
  )
  INTO result
  FROM wallets w
  WHERE w.id = new_wallet_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get wallet transactions
CREATE OR REPLACE FUNCTION get_wallet_transactions(
  wallet_id UUID,
  page_number INT,
  page_size INT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_count INT;
BEGIN
  SELECT COUNT(*)
  INTO total_count
  FROM wallet_transactions
  WHERE wallet_transactions.wallet_id = get_wallet_transactions.wallet_id;
  
  SELECT jsonb_build_object(
    'transactions', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT *
        FROM wallet_transactions
        WHERE wallet_transactions.wallet_id = get_wallet_transactions.wallet_id
        ORDER BY created_at DESC
        LIMIT page_size
        OFFSET ((page_number - 1) * page_size)
      ) t
    ),
    'count', total_count
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process a deposit to a wallet
CREATE OR REPLACE FUNCTION deposit_to_wallet(
  wallet_id UUID,
  amount NUMERIC,
  payment_method TEXT,
  reference TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM wallets
  WHERE id = wallet_id;

  -- Create transaction
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
    metadata
  ) VALUES (
    wallet_id,
    amount,
    current_balance + amount,
    'credit',
    'deposit',
    'Depósito via ' || payment_method,
    reference,
    'payment',
    'completed',
    jsonb_build_object('payment_method', payment_method)
  );

  -- Update wallet balance
  UPDATE wallets
  SET 
    balance = current_balance + amount,
    updated_at = NOW()
  WHERE id = wallet_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process transfer between wallets
CREATE OR REPLACE FUNCTION transfer_between_wallets(
  from_wallet_id UUID,
  to_wallet_id UUID,
  amount NUMERIC,
  notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  transfer_id UUID;
  from_balance NUMERIC;
  to_balance NUMERIC;
BEGIN
  -- Check if sender has enough balance
  SELECT balance INTO from_balance
  FROM wallets
  WHERE id = from_wallet_id;
  
  IF from_balance < amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Get recipient balance
  SELECT balance INTO to_balance
  FROM wallets
  WHERE id = to_wallet_id;

  -- Create transfer record
  INSERT INTO wallet_transfers (
    from_wallet_id,
    to_wallet_id,
    amount,
    status,
    completed_at,
    notes
  ) VALUES (
    from_wallet_id,
    to_wallet_id,
    amount,
    'completed',
    NOW(),
    notes
  ) RETURNING id INTO transfer_id;

  -- Create debit transaction for sender
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    balance_after,
    type,
    category,
    description,
    reference_id,
    reference_type,
    status
  ) VALUES (
    from_wallet_id,
    amount,
    from_balance - amount,
    'debit',
    'transfer_out',
    'Transferência enviada',
    transfer_id::text,
    'transfer',
    'completed'
  );

  -- Create credit transaction for recipient
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    balance_after,
    type,
    category,
    description,
    reference_id,
    reference_type,
    status
  ) VALUES (
    to_wallet_id,
    amount,
    to_balance + amount,
    'credit',
    'transfer_in',
    'Transferência recebida',
    transfer_id::text,
    'transfer',
    'completed'
  );

  -- Update sender's balance
  UPDATE wallets
  SET 
    balance = from_balance - amount,
    updated_at = NOW()
  WHERE id = from_wallet_id;

  -- Update recipient's balance
  UPDATE wallets
  SET 
    balance = to_balance + amount,
    updated_at = NOW()
  WHERE id = to_wallet_id;

  RETURN transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage permissions
GRANT EXECUTE ON FUNCTION get_user_wallet TO public;
GRANT EXECUTE ON FUNCTION create_user_wallet TO public;
GRANT EXECUTE ON FUNCTION get_wallet_transactions TO public;
GRANT EXECUTE ON FUNCTION deposit_to_wallet TO public;
GRANT EXECUTE ON FUNCTION transfer_between_wallets TO public;

-- Create RLS policies
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for wallets - users can only see their own wallet
CREATE POLICY wallet_user_access ON wallets
  FOR ALL
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

-- Policy for wallet_transactions - users can only see their own transactions
CREATE POLICY transaction_user_access ON wallet_transactions
  FOR ALL
  USING (wallet_id IN (
    SELECT id FROM wallets WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

-- Policy for wallet_transfers - users can only see transfers they're involved in
CREATE POLICY transfer_user_access ON wallet_transfers
  FOR ALL
  USING (from_wallet_id IN (
    SELECT id FROM wallets WHERE user_id = auth.uid()
  ) OR to_wallet_id IN (
    SELECT id FROM wallets WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

-- Policy for wallet_notifications - users can only see their own notification settings
CREATE POLICY notification_user_access ON wallet_notifications
  FOR ALL
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));
