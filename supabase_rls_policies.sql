-- ============================================
-- ROW LEVEL SECURITY (RLS) PARA APPYPAY
-- Execute este SQL na sua instância Supabase
-- ============================================

-- 1. Habilitar RLS nas tabelas
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REMOVE TODAS AS POLÍTICAS EXISTENTES
-- ============================================

-- Remove políticas antigas que podem estar causando conflitos
DROP POLICY IF EXISTS "Users can view their own payment references" ON public.payment_references;
DROP POLICY IF EXISTS "Users can insert their own payment references" ON public.payment_references;
DROP POLICY IF EXISTS "Users can update their own payment references" ON public.payment_references;
DROP POLICY IF EXISTS "Service role can manage payment references" ON public.payment_references;
DROP POLICY IF EXISTS "Admins can view all payment references" ON public.payment_references;
DROP POLICY IF EXISTS "Admins can manage all payment references" ON public.payment_references;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert invoices for their orders" ON public.invoices;
DROP POLICY IF EXISTS "Service role can manage invoices" ON public.invoices;

-- ============================================
-- POLÍTICAS RLS PARA PAYMENT_REFERENCES  
-- ============================================

-- Política: Usuários podem ver suas próprias referências de pagamento
CREATE POLICY "Users can view their own payment references" ON public.payment_references
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Política: Usuários podem inserir referências para seus próprios pedidos
DROP POLICY IF EXISTS "Users can insert their own payment references" ON public.payment_references;
CREATE POLICY "Users can insert their own payment references" ON public.payment_references
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Política: Usuários podem atualizar suas próprias referências
DROP POLICY IF EXISTS "Users can update their own payment references" ON public.payment_references;
CREATE POLICY "Users can update their own payment references" ON public.payment_references
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

-- Política: Service role pode gerenciar todas as referências (para Edge Functions)
DROP POLICY IF EXISTS "Service role can manage payment references" ON public.payment_references;
CREATE POLICY "Service role can manage payment references" ON public.payment_references
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS RLS PARA ORDERS
-- ============================================

-- Política: Usuários podem ver seus próprios pedidos
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política: Usuários podem inserir seus próprios pedidos
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política: Usuários podem atualizar seus próprios pedidos
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Política: Service role pode gerenciar todos os pedidos
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
CREATE POLICY "Service role can manage orders" ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS RLS PARA INVOICES
-- ============================================

-- Política: Usuários podem ver suas próprias faturas
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Política: Usuários podem inserir faturas para seus pedidos
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

-- Política: Service role pode gerenciar todas as faturas
DROP POLICY IF EXISTS "Service role can manage invoices" ON public.invoices;
CREATE POLICY "Service role can manage invoices" ON public.invoices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS ESPECIAIS PARA ADMIN
-- ============================================

-- Política: Admins podem ver todas as referências de pagamento
DROP POLICY IF EXISTS "Admins can view all payment references" ON public.payment_references;
CREATE POLICY "Admins can view all payment references" ON public.payment_references
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Política: Admins podem gerenciar todas as referências
DROP POLICY IF EXISTS "Admins can manage all payment references" ON public.payment_references;
CREATE POLICY "Admins can manage all payment references" ON public.payment_references
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

-- Política: Admins podem ver todos os pedidos
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

-- ============================================
-- POLÍTICAS PARA VIEW DE RELATÓRIOS
-- ============================================

-- Configurar security invoker para a view
ALTER VIEW IF EXISTS payment_references_report SET (security_invoker = on);

-- Grants para a view
GRANT SELECT ON payment_references_report TO authenticated;
GRANT ALL ON payment_references_report TO service_role;

-- ============================================
-- FUNÇÃO DE VERIFICAÇÃO DE PERMISSÕES
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

-- ============================================
-- VERIFICAÇÃO FINAL DAS POLÍTICAS
-- ============================================

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('payment_references', 'orders', 'invoices')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('payment_references', 'orders', 'invoices');

-- ============================================
-- TESTE DE PERMISSÕES (OPCIONAL)
-- ============================================

-- Para testar as políticas, você pode usar:
-- SELECT * FROM payment_references; -- Como usuário normal
-- SELECT * FROM payment_references; -- Como admin
-- SELECT can_access_order('uuid-do-pedido'); -- Verificar acesso