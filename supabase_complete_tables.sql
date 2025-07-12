-- ============================================
-- SCRIPT COMPLETO - TABELAS APPYPAY SISTEMA
-- Execute este SQL na sua instância Supabase
-- ============================================

-- 1. Criar/atualizar tabela de profiles (se não existir)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  nif TEXT,
  company_name TEXT,
  address TEXT,
  phone TEXT,
  phone_invoice TEXT,
  city TEXT,
  postal_code TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Criar/atualizar tabela de orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'pending_payment', 'paid', 'completed', 'cancelled', 'failed', 'processing')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  rf_tax DECIMAL(10,2) DEFAULT 0,
  cart_items JSONB,
  payment_method TEXT,
  invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar tabela de order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  product_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  duration INTEGER,
  duration_unit TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Criar tabela de invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'overdue')),
  due_date TIMESTAMPTZ,
  payment_method TEXT,
  payment_instructions TEXT,
  company_details TEXT,
  notes TEXT,
  pdf_url TEXT,
  share_token UUID DEFAULT gen_random_uuid(),
  public_token UUID DEFAULT gen_random_uuid(),
  token UUID DEFAULT gen_random_uuid(),
  reference UUID DEFAULT gen_random_uuid(),
  is_public BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  currency TEXT DEFAULT 'AOA',
  invoice_type TEXT DEFAULT 'deposit',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Criar tabela de payment_references (PRINCIPAL PARA APPYPAY)
CREATE TABLE IF NOT EXISTS public.payment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  reference TEXT NOT NULL UNIQUE,
  token TEXT,
  entity TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'expired')),
  payment_method TEXT DEFAULT 'appypay_reference',
  phone_number TEXT,
  description TEXT,
  validity_date TIMESTAMPTZ,
  appypay_response JSONB,
  webhook_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Criar tabela de company_settings
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  company_nif TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  bank_transfer_instructions TEXT,
  multicaixa_instructions TEXT,
  appypay_entity TEXT,
  appypay_client_id TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Criar tabela de domains (se necessário)
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  domain_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  expiry_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para payment_references
CREATE INDEX IF NOT EXISTS idx_payment_references_order_id ON public.payment_references(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_references_reference ON public.payment_references(reference);
CREATE INDEX IF NOT EXISTS idx_payment_references_entity ON public.payment_references(entity);
CREATE INDEX IF NOT EXISTS idx_payment_references_status ON public.payment_references(status);
CREATE INDEX IF NOT EXISTS idx_payment_references_validity_date ON public.payment_references(validity_date);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Índices para order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Índices para invoices
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Índices para domains
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_order_id ON public.domains(order_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain_name ON public.domains(domain_name);

-- ============================================
-- TRIGGERS E FUNÇÕES
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_items_updated_at ON public.order_items;
CREATE TRIGGER update_order_items_updated_at 
  BEFORE UPDATE ON public.order_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON public.invoices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_references_updated_at ON public.payment_references;
CREATE TRIGGER update_payment_references_updated_at 
  BEFORE UPDATE ON public.payment_references 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_settings_updated_at ON public.company_settings;
CREATE TRIGGER update_company_settings_updated_at 
  BEFORE UPDATE ON public.company_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at 
  BEFORE UPDATE ON public.domains 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÕES UTILITÁRIAS APPYPAY
-- ============================================

-- Função para buscar referências expiradas
CREATE OR REPLACE FUNCTION get_expired_references()
RETURNS TABLE (
  id UUID,
  reference TEXT,
  order_id UUID,
  amount DECIMAL,
  validity_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.reference,
    pr.order_id,
    pr.amount,
    pr.validity_date
  FROM public.payment_references pr
  WHERE pr.validity_date < now()
    AND pr.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar referências como expiradas
CREATE OR REPLACE FUNCTION mark_expired_references()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.payment_references 
  SET status = 'expired', updated_at = now()
  WHERE validity_date < now() 
    AND status = 'pending';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HABILITAR ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS BÁSICAS
-- ============================================

-- Profiles: usuários podem ver/editar seus próprios perfis
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Orders: usuários podem ver seus próprios pedidos
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid());

-- Payment References: usuários podem ver suas próprias referências
DROP POLICY IF EXISTS "Users can view own payment references" ON public.payment_references;
CREATE POLICY "Users can view own payment references" ON public.payment_references
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

-- Service role pode tudo
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;
CREATE POLICY "Service role full access profiles" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access orders" ON public.orders;
CREATE POLICY "Service role full access orders" ON public.orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access payment_references" ON public.payment_references;
CREATE POLICY "Service role full access payment_references" ON public.payment_references
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access invoices" ON public.invoices;
CREATE POLICY "Service role full access invoices" ON public.invoices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se todas as tabelas foram criadas
SELECT 
  table_name,
  'Criada' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'orders', 'order_items', 'invoices', 
    'payment_references', 'company_settings', 'domains'
  )
ORDER BY table_name;

-- Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'orders', 'order_items', 'invoices', 
    'payment_references', 'company_settings', 'domains'
  )
ORDER BY tablename;

-- ============================================
-- FIM DO SCRIPT
-- ============================================