-- ============================================
-- CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS
-- Sistema de Faturação e Gestão de Domínios
-- ============================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CRIAÇÃO DE TABELAS PRINCIPAIS
-- ============================================

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'suporte')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de empresas
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

-- Tabela de clientes
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

-- Tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  multicaixa_express_config JSONB DEFAULT '{"frametoken": "a53787fd-b49e-4469-a6ab-fa6acf19db48", "callback": "", "success": "", "error": ""}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de faturas
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number SERIAL NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  organization_id UUID,
  company_id UUID REFERENCES companies(id),
  customer_id UUID REFERENCES customers(id),
  issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  reference TEXT,
  bank_details TEXT,
  notes TEXT,
  renewal_notes TEXT,
  cancellation_policy TEXT,
  support_instructions TEXT,
  legal_notes TEXT,
  pdf_generation_attempts INTEGER DEFAULT 0,
  last_pdf_generation_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens da fatura
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de métodos de pagamento
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  requires_reference BOOLEAN DEFAULT FALSE,
  requires_bank_details BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de referências de pagamento
CREATE TABLE IF NOT EXISTS public.payment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  reference TEXT NOT NULL UNIQUE,
  token TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'multicaixa',
  phone_number TEXT,
  appypay_response JSONB,
  webhook_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approved_by UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CARTEIRAS E TRANSAÇÕES
-- ============================================

-- Tabela de carteiras de usuários
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Alias para compatibilidade
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela de transações de carteira
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

-- Tabela de transferências entre carteiras
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

-- Tabela de preferências de notificação de carteira
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

-- ============================================
-- SERVIÇOS E PRODUTOS
-- ============================================

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  recurring BOOLEAN DEFAULT FALSE,
  billing_cycle TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price NUMERIC NOT NULL,
  stock_quantity INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de serviços de clientes
CREATE TABLE IF NOT EXISTS public.customer_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_invoice_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  price_at_purchase NUMERIC NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GESTÃO DE DOMÍNIOS
-- ============================================

-- Tabela de pedidos de domínios
CREATE TABLE IF NOT EXISTS public.domain_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name TEXT NOT NULL,
  tld_type TEXT NOT NULL DEFAULT 'ao',
  price DECIMAL(10,2) DEFAULT 0,
  duration INTEGER DEFAULT 12,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de domínios
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  tld TEXT NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE,
  expiration_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired', 'transferred', 'cancelled')),
  nameservers TEXT[] DEFAULT ARRAY['ns1.angohost.co.ao', 'ns2.angohost.co.ao'],
  privacy_protection BOOLEAN DEFAULT FALSE,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  auth_code TEXT,
  notes TEXT,
  service_id UUID REFERENCES services(id)
);

-- ============================================
-- PERFIS DE CONTATO
-- ============================================

-- Tabela de perfis de contato
CREATE TABLE IF NOT EXISTS public.contact_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_foreigner BOOLEAN DEFAULT FALSE,
  nif TEXT NOT NULL,
  is_individual_company BOOLEAN DEFAULT FALSE,
  domain_owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Angola',
  state TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- TEMPLATES E LEMBRETES
-- ============================================

-- Tabela de templates de fatura
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de lembretes de fatura
CREATE TABLE IF NOT EXISTS public.invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  reminder_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de taxas
CREATE TABLE IF NOT EXISTS public.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOGS E AUDITORIA
-- ============================================

-- Tabela de logs de webhook
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type TEXT NOT NULL,
  status TEXT NOT NULL,
  reference TEXT,
  transaction_id TEXT,
  invoice_id UUID,
  order_id UUID,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de callbacks do Multicaixa
CREATE TABLE IF NOT EXISTS public.multicaixa_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  reference TEXT,
  invoice_id UUID,
  order_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs de teste do Multicaixa
CREATE TABLE IF NOT EXISTS public.multicaixa_test_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  status TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CRIAÇÃO DE ÍNDICES
-- ============================================

-- Índices para faturas
CREATE INDEX IF NOT EXISTS idx_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_dates ON public.invoices(issue_date, due_date);

-- Índices para itens de fatura
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- Índices para carteiras
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_from_wallet_id ON public.wallet_transfers(from_wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_to_wallet_id ON public.wallet_transfers(to_wallet_id);

-- Índices para serviços
CREATE INDEX IF NOT EXISTS idx_customer_services_user_id ON public.customer_services(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_services_service_id ON public.customer_services(service_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Índices para domínios
CREATE INDEX IF NOT EXISTS idx_domain_orders_user_id ON public.domain_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_order_id ON public.domain_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_status ON public.domain_orders(status);
CREATE INDEX IF NOT EXISTS idx_domain_orders_domain_name ON public.domain_orders(domain_name);
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain_name ON public.domains(domain_name);

-- Índices para perfis de contato
CREATE INDEX IF NOT EXISTS idx_contact_profiles_user_id ON public.contact_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_profiles_nif ON public.contact_profiles(nif);

-- Índices para referências de pagamento
CREATE INDEX IF NOT EXISTS idx_payment_references_order_id ON public.payment_references(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_references_reference ON public.payment_references(reference);
CREATE INDEX IF NOT EXISTS idx_payment_references_token ON public.payment_references(token);
CREATE INDEX IF NOT EXISTS idx_payment_references_status ON public.payment_references(status);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_reference ON public.webhook_logs(reference);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_transaction_id ON public.webhook_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_invoice_id ON public.webhook_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_multicaixa_callbacks_reference ON public.multicaixa_callbacks(reference);
CREATE INDEX IF NOT EXISTS idx_multicaixa_callbacks_invoice_id ON public.multicaixa_callbacks(invoice_id);

-- ============================================
-- HABILITAÇÃO DE RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multicaixa_callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multicaixa_test_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- Políticas para perfis
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
    OR auth.jwt() ->> 'user_metadata' ->> 'role' = 'suporte'
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Políticas para carteiras
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all wallets" ON public.wallets
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Users can view own wallet" ON public.user_wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users cannot directly modify wallets" ON public.user_wallets
  FOR ALL USING (false);

CREATE POLICY "Admins can manage all wallets" ON public.user_wallets
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- Políticas para transações de carteira
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (
    (SELECT user_id FROM wallets WHERE id = wallet_id) = auth.uid()
  );

CREATE POLICY "Only system can create transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- Políticas para faturas
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
    OR 
    auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'suporte')
  );

CREATE POLICY "Only system can create invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- Políticas para itens de fatura
CREATE POLICY "Clients can view their own invoice items" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_id
      AND EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = i.order_id AND o.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can view all invoice items" ON public.invoice_items
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));

-- Políticas para pedidos
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    user_id = auth.uid()
    OR 
    auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'suporte')
  );

CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para referências de pagamento
CREATE POLICY "Users can view own payment references" ON public.payment_references
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN orders o ON i.order_id = o.id
      WHERE i.id = invoice_id AND o.user_id = auth.uid()
    )
    OR 
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Service role can manage payment references" ON public.payment_references
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para pedidos de domínios
CREATE POLICY "Users can view their own domain orders" ON public.domain_orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own domain orders" ON public.domain_orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own domain orders" ON public.domain_orders
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all domain orders" ON public.domain_orders
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));

-- Políticas para domínios
CREATE POLICY "Users can view their own domains" ON public.domains
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own domains" ON public.domains
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own domains" ON public.domains
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all domains" ON public.domains
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));

-- Políticas para perfis de contato
CREATE POLICY "Users can view their own contact profiles" ON public.contact_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact profiles" ON public.contact_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact profiles" ON public.contact_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact profiles" ON public.contact_profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all contact profiles" ON public.contact_profiles
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));

-- Políticas para serviços
CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));

CREATE POLICY "Users can view active services" ON public.services
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.customer_services
    WHERE customer_services.service_id = services.id AND customer_services.user_id = auth.uid()
  ));

-- Políticas para produtos
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));

CREATE POLICY "Users can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- Políticas para serviços de clientes
CREATE POLICY "Admins can manage customer services" ON public.customer_services
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));

CREATE POLICY "Users can view their own services" ON public.customer_services
  FOR SELECT USING (user_id = auth.uid());

-- Políticas para templates de fatura
CREATE POLICY "Admins can manage invoice templates" ON public.invoice_templates
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));

-- Políticas para lembretes de fatura
CREATE POLICY "Admins can manage invoice reminders" ON public.invoice_reminders
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));

-- Políticas para taxas
CREATE POLICY "Admins can manage tax rates" ON public.tax_rates
  FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));

-- Políticas para logs
CREATE POLICY "Admins can read webhook logs" ON public.webhook_logs
  FOR SELECT USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'suporte'));

CREATE POLICY "Service role can insert webhook logs" ON public.webhook_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read multicaixa callbacks" ON public.multicaixa_callbacks
  FOR SELECT USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'suporte'));

CREATE POLICY "Service role can insert multicaixa callbacks" ON public.multicaixa_callbacks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read multicaixa test logs" ON public.multicaixa_test_logs
  FOR SELECT USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'suporte'));

CREATE POLICY "Service role can insert multicaixa test logs" ON public.multicaixa_test_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- CRIAÇÃO DE FUNÇÕES
-- ============================================

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para obter ou criar carteira do usuário
CREATE OR REPLACE FUNCTION get_or_create_user_wallet(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_wallet_id UUID;
  v_wallet RECORD;
BEGIN
  SELECT id INTO v_wallet_id
  FROM wallets
  WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_wallet_id;
  END IF;
  
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

-- Função para obter faturas futuras
CREATE OR REPLACE FUNCTION get_upcoming_invoices(customer_id UUID)
RETURNS TABLE(
  service_name TEXT,
  next_invoice_date TIMESTAMPTZ,
  estimated_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.service_id::TEXT,
    cs.next_invoice_date,
    cs.price_at_purchase
  FROM customer_services cs
  WHERE cs.user_id = customer_id
    AND cs.status = 'active'
    AND cs.next_invoice_date IS NOT NULL
    AND cs.next_invoice_date > NOW()
  ORDER BY cs.next_invoice_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se domínio é gerenciável
CREATE OR REPLACE FUNCTION is_domain_manageable(domain_status TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN domain_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Função para log de mudança de status de domínio
CREATE OR REPLACE FUNCTION log_domain_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_logs(user_id, action, details)
        VALUES (
            auth.uid(),
            'domain_status_change',
            format('Domain %s.%s status changed from %s to %s', 
                   NEW.domain_name, NEW.tld, OLD.status, NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CRIAÇÃO DE TRIGGERS
-- ============================================

-- Triggers para atualizar updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER update_contact_profiles_updated_at 
    BEFORE UPDATE ON public.contact_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_references_updated_at 
    BEFORE UPDATE ON public.payment_references 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para log de mudança de status de domínio
CREATE TRIGGER domain_status_change_trigger
    AFTER UPDATE OF status ON public.domains
    FOR EACH ROW
    EXECUTE FUNCTION log_domain_status_change();

-- ============================================
-- CONFIGURAÇÃO DO STORAGE BUCKET
-- ============================================

-- Criar bucket para faturas
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS no storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Políticas para o bucket de faturas
CREATE POLICY "Users can read their own invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    auth.uid() IN (
      SELECT o.user_id
      FROM orders o
      JOIN invoices i ON i.order_id = o.id
      WHERE i.id::text = substring(name from '^([^-]+)')
    )
  );

CREATE POLICY "Admins can read all invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Service role can upload invoices" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoices' AND
    auth.role() = 'service_role'
  );

CREATE POLICY "Service role can update invoices" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'invoices' AND
    auth.role() = 'service_role'
  ) WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Service role can delete invoices" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'invoices' AND
    auth.role() = 'service_role'
  );

CREATE POLICY "Public can read invoice PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    storage.extension(name) = 'pdf'
  );

-- ============================================
-- PERMISSÕES
-- ============================================

-- Conceder permissões de execução
GRANT EXECUTE ON FUNCTION get_or_create_user_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_invoices TO public;

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Inserir métodos de pagamento padrão
INSERT INTO public.payment_methods (name, description, is_active, requires_reference)
VALUES 
  ('Multicaixa Express', 'Pagamento via Multicaixa Express', true, true),
  ('AppyPay', 'Pagamento via AppyPay', true, true),
  ('Transferência Bancária', 'Transferência bancária tradicional', true, false),
  ('Dinheiro', 'Pagamento em dinheiro', true, false)
ON CONFLICT DO NOTHING;

-- Inserir taxa padrão
INSERT INTO public.tax_rates (name, rate, description, is_default, is_active)
VALUES ('IVA Padrão', 14.00, 'Imposto sobre Valor Acrescentado - Taxa padrão de Angola', true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE public.domain_orders IS 'Table to store domain orders placed by users';
COMMENT ON TABLE public.contact_profiles IS 'Contact profiles for domain registration';
COMMENT ON TABLE public.wallets IS 'User wallets for storing balance';
COMMENT ON TABLE public.invoices IS 'Invoice management system';
COMMENT ON TABLE public.payment_references IS 'Payment references for tracking payments';

-- ============================================
-- FIM DA CONFIGURAÇÃO
-- ============================================