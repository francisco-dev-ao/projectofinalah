
-- Create extension for UUIDs if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create wallet transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category TEXT NOT NULL CHECK (category IN ('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'payment', 'refund', 'admin_adjustment')),
  description TEXT NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Create wallet transfers table
CREATE TABLE IF NOT EXISTS public.wallet_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  to_wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Create wallet notification preferences table
CREATE TABLE IF NOT EXISTS public.wallet_notification_preferences (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create services table for tracking services offered
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  recurring BOOLEAN DEFAULT false,
  billing_cycle TEXT, -- monthly, yearly, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create products table for physical product offerings
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price NUMERIC NOT NULL,
  stock_quantity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create customer_services table to track which services customers have
CREATE TABLE IF NOT EXISTS public.customer_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_invoice_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  price_at_purchase NUMERIC NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice_templates table for reusable invoice templates
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice_reminders table for tracking invoice reminders
CREATE TABLE IF NOT EXISTS public.invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  reminder_type TEXT NOT NULL, -- before_due, due, after_due
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE
);

-- Create tax_rates table for different tax configurations
CREATE TABLE IF NOT EXISTS public.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  nif TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  nif TEXT NOT NULL,
  address TEXT,
  city TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  requires_reference BOOLEAN DEFAULT false,
  requires_bank_details BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_references table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create invoice_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  service_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wallets (users can access their own, admins can access all)
CREATE POLICY "Users can view their own wallets" 
  ON public.wallets FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage wallets" 
  ON public.wallets FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
  ));

-- Create RLS policies for wallet_transactions
CREATE POLICY "Users can view their own transactions" 
  ON public.wallet_transactions FOR SELECT 
  USING (wallet_id IN (
    SELECT id FROM public.wallets 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage wallet transactions" 
  ON public.wallet_transactions FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
  ));

-- Create RLS policies for other tables...
-- (Similar policies would be created for other tables)

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions (wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_from_wallet_id ON public.wallet_transfers (from_wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_to_wallet_id ON public.wallet_transfers (to_wallet_id);
CREATE INDEX IF NOT EXISTS idx_customer_services_user_id ON public.customer_services (user_id);
CREATE INDEX IF NOT EXISTS idx_customer_services_service_id ON public.customer_services (service_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items (invoice_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update timestamp for all tables with updated_at column
CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_notification_preferences_updated_at
    BEFORE UPDATE ON public.wallet_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_services_updated_at
    BEFORE UPDATE ON public.customer_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_templates_updated_at
    BEFORE UPDATE ON public.invoice_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_rates_updated_at
    BEFORE UPDATE ON public.tax_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create wallet management functions
CREATE OR REPLACE FUNCTION get_or_create_user_wallet(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_wallet_id UUID;
  v_wallet RECORD;
BEGIN
  -- Check if wallet exists
  SELECT id INTO v_wallet_id
  FROM wallets
  WHERE user_id = p_user_id;
  
  -- Create wallet if it doesn't exist
  IF v_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  -- Return wallet data
  SELECT * INTO v_wallet
  FROM wallets
  WHERE id = v_wallet_id;
  
  RETURN jsonb_build_object(
    'id', v_wallet.id,
    'user_id', v_wallet.user_id,
    'balance', v_wallet.balance,
    'currency', v_wallet.currency,
    'created_at', v_wallet.created_at,
    'updated_at', v_wallet.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_user_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column TO authenticated;
