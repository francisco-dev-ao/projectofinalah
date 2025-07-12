
-- Create extension for UUIDs if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create wallet_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category TEXT NOT NULL CHECK (category IN ('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'payment', 'refund', 'admin_adjustment')),
  description TEXT NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Modify invoices table if it exists
DO $$
BEGIN
  -- Add invoice_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'invoice_type'
  ) THEN
    ALTER TABLE invoices ADD COLUMN invoice_type TEXT;
  END IF;

  -- Add total_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE invoices ADD COLUMN total_amount NUMERIC(12,2);
  END IF;

  -- Add currency column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'currency'
  ) THEN
    ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'AOA';
  END IF;

  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE invoices ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Create wallet_transfers table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
  to_wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create wallet_notification_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_on_transaction BOOLEAN DEFAULT TRUE,
  notify_on_low_balance BOOLEAN DEFAULT TRUE,
  low_balance_threshold NUMERIC(12,2) DEFAULT 1000,
  notify_via_email BOOLEAN DEFAULT TRUE,
  notify_via_sms BOOLEAN DEFAULT FALSE,
  notify_via_push BOOLEAN DEFAULT TRUE,
  weekly_summary BOOLEAN DEFAULT FALSE,
  monthly_summary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add these tables to the public schema and enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transfers ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet access
-- Allow users to view their own wallets
CREATE POLICY IF NOT EXISTS user_wallets_select_policy
  ON user_wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to view their own wallet transactions
CREATE POLICY IF NOT EXISTS wallet_transactions_select_policy
  ON wallet_transactions FOR SELECT
  USING ((SELECT user_id FROM user_wallets WHERE id = wallet_id) = auth.uid());

-- Allow users to view their own wallet transfers
CREATE POLICY IF NOT EXISTS wallet_transfers_select_policy
  ON wallet_transfers FOR SELECT
  USING ((SELECT user_id FROM user_wallets WHERE id = from_wallet_id) = auth.uid() OR 
         (SELECT user_id FROM user_wallets WHERE id = to_wallet_id) = auth.uid());