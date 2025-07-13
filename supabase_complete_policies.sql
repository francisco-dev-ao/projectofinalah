-- ============================================
-- POLÍTICAS COMPLETAS RLS PARA APPYPAY
-- Execute este SQL na sua instância Supabase
-- ============================================

-- 1. Habilitar RLS em todas as tabelas necessárias
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA PROFILES
-- ============================================

-- Usuários podem ver e atualizar apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admins podem ver e gerenciar todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Service role pode gerenciar todos os perfis
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
CREATE POLICY "Service role can manage profiles" ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS PARA DOMAINS
-- ============================================

-- Usuários podem ver seus próprios domínios
DROP POLICY IF EXISTS "Users can view own domains" ON public.domains;
CREATE POLICY "Users can view own domains" ON public.domains
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuários podem inserir domínios para si mesmos
DROP POLICY IF EXISTS "Users can insert own domains" ON public.domains;
CREATE POLICY "Users can insert own domains" ON public.domains
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios domínios
DROP POLICY IF EXISTS "Users can update own domains" ON public.domains;
CREATE POLICY "Users can update own domains" ON public.domains
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins podem ver todos os domínios
DROP POLICY IF EXISTS "Admins can view all domains" ON public.domains;
CREATE POLICY "Admins can view all domains" ON public.domains
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Service role pode gerenciar todos os domínios
DROP POLICY IF EXISTS "Service role can manage domains" ON public.domains;
CREATE POLICY "Service role can manage domains" ON public.domains
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS PARA DOMAIN_ORDERS
-- ============================================

-- Usuários podem ver seus próprios pedidos de domínio
DROP POLICY IF EXISTS "Users can view own domain orders" ON public.domain_orders;
CREATE POLICY "Users can view own domain orders" ON public.domain_orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuários podem inserir pedidos de domínio para si mesmos
DROP POLICY IF EXISTS "Users can insert own domain orders" ON public.domain_orders;
CREATE POLICY "Users can insert own domain orders" ON public.domain_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios pedidos de domínio
DROP POLICY IF EXISTS "Users can update own domain orders" ON public.domain_orders;
CREATE POLICY "Users can update own domain orders" ON public.domain_orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins podem ver todos os pedidos de domínio
DROP POLICY IF EXISTS "Admins can view all domain orders" ON public.domain_orders;
CREATE POLICY "Admins can view all domain orders" ON public.domain_orders
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Service role pode gerenciar todos os pedidos de domínio
DROP POLICY IF EXISTS "Service role can manage domain orders" ON public.domain_orders;
CREATE POLICY "Service role can manage domain orders" ON public.domain_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS PARA ORDERS
-- ============================================

-- Usuários podem ver seus próprios pedidos
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuários podem inserir seus próprios pedidos
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios pedidos
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins podem ver todos os pedidos
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Service role pode gerenciar todos os pedidos
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
CREATE POLICY "Service role can manage orders" ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS PARA ORDER_ITEMS
-- ============================================

-- Usuários podem ver itens de seus próprios pedidos
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Usuários podem inserir itens em seus próprios pedidos
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items" ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Usuários podem atualizar itens de seus próprios pedidos
DROP POLICY IF EXISTS "Users can update own order items" ON public.order_items;
CREATE POLICY "Users can update own order items" ON public.order_items
  FOR UPDATE
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Service role pode gerenciar todos os itens de pedido
DROP POLICY IF EXISTS "Service role can manage order items" ON public.order_items;
CREATE POLICY "Service role can manage order items" ON public.order_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS PARA INVOICES
-- ============================================

-- Usuários podem ver suas próprias faturas
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Usuários podem inserir faturas para seus pedidos
DROP POLICY IF EXISTS "Users can insert invoices for their orders" ON public.invoices;
CREATE POLICY "Users can insert invoices for their orders" ON public.invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Usuários podem atualizar suas próprias faturas
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
CREATE POLICY "Users can update own invoices" ON public.invoices
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Service role pode gerenciar todas as faturas
DROP POLICY IF EXISTS "Service role can manage invoices" ON public.invoices;
CREATE POLICY "Service role can manage invoices" ON public.invoices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS PARA PAYMENT_REFERENCES
-- ============================================

-- Usuários podem ver suas próprias referências de pagamento
DROP POLICY IF EXISTS "Users can view own payment references" ON public.payment_references;
CREATE POLICY "Users can view own payment references" ON public.payment_references
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Usuários podem inserir referências para seus próprios pedidos
DROP POLICY IF EXISTS "Users can insert own payment references" ON public.payment_references;
CREATE POLICY "Users can insert own payment references" ON public.payment_references
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Usuários podem atualizar suas próprias referências
DROP POLICY IF EXISTS "Users can update own payment references" ON public.payment_references;
CREATE POLICY "Users can update own payment references" ON public.payment_references
  FOR UPDATE
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Admins podem ver todas as referências de pagamento
DROP POLICY IF EXISTS "Admins can view all payment references" ON public.payment_references;
CREATE POLICY "Admins can view all payment references" ON public.payment_references
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Service role pode gerenciar todas as referências
DROP POLICY IF EXISTS "Service role can manage payment references" ON public.payment_references;
CREATE POLICY "Service role can manage payment references" ON public.payment_references
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

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

-- Função para verificar se usuário pode acessar pedido
CREATE OR REPLACE FUNCTION can_access_order(order_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_uuid 
    AND (user_id = auth.uid() OR is_admin())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário pode acessar domínio
CREATE OR REPLACE FUNCTION can_access_domain(domain_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.domains 
    WHERE id = domain_uuid 
    AND (user_id = auth.uid() OR is_admin())
  ) OR EXISTS (
    SELECT 1 FROM public.domain_orders 
    WHERE id = domain_uuid 
    AND (user_id = auth.uid() OR is_admin())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS PARA SERVICE ROLE
-- ============================================

-- Grants básicos para service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- VERIFICAÇÃO DAS POLÍTICAS
-- ============================================

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 
    'domains', 
    'domain_orders', 
    'orders', 
    'order_items', 
    'invoices', 
    'payment_references'
  )
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 
    'domains', 
    'domain_orders', 
    'orders', 
    'order_items', 
    'invoices', 
    'payment_references'
  );

-- ============================================
-- TESTE DE PERMISSÕES
-- ============================================

-- Para testar as políticas:
-- SELECT * FROM orders; -- Como usuário normal
-- SELECT * FROM orders; -- Como admin
-- SELECT can_access_order('uuid-do-pedido'); -- Verificar acesso a pedido
-- SELECT can_access_domain('uuid-do-dominio'); -- Verificar acesso a domínio
-- SELECT is_admin(); -- Verificar se é admin