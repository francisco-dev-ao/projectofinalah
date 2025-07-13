-- ============================================
-- CORREÇÃO DAS POLÍTICAS RLS 
-- Execute este SQL na sua instância Supabase
-- ============================================

-- 1. Verificar se a coluna entity existe na tabela payment_references
-- Se não existir, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_references' 
        AND column_name = 'entity'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payment_references ADD COLUMN entity TEXT DEFAULT '11333';
    END IF;
END $$;

-- 2. Habilitar RLS nas tabelas se ainda não estiver
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;

-- 3. Remover tabela users se existir (pode estar causando confusão)
DROP TABLE IF EXISTS public.users CASCADE;

-- 4. Políticas para domains
DROP POLICY IF EXISTS "Users can view own domains" ON public.domains;
CREATE POLICY "Users can view own domains"
  ON public.domains FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own domains" ON public.domains;
CREATE POLICY "Users can create own domains"
  ON public.domains FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own domains" ON public.domains;
CREATE POLICY "Users can update own domains"
  ON public.domains FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all domains" ON public.domains;
CREATE POLICY "Admins can manage all domains"
  ON public.domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 5. Políticas para domain_orders
DROP POLICY IF EXISTS "Users can view own domain orders" ON public.domain_orders;
CREATE POLICY "Users can view own domain orders"
  ON public.domain_orders FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own domain orders" ON public.domain_orders;
CREATE POLICY "Users can create own domain orders"
  ON public.domain_orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own domain orders" ON public.domain_orders;
CREATE POLICY "Users can update own domain orders"
  ON public.domain_orders FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all domain orders" ON public.domain_orders;
CREATE POLICY "Admins can manage all domain orders"
  ON public.domain_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'suporte')
    )
  );

-- 6. Política para profiles (corrigir o problema de permissão negada)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'suporte')
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND (
      role = OLD.role -- Cannot change own role
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.role = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- 7. Corrigir políticas de orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (
    user_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'suporte')
    )
  );

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'suporte')
    )
  );

-- 8. Políticas para payment_references
DROP POLICY IF EXISTS "Users can view own payment references" ON public.payment_references;
CREATE POLICY "Users can view own payment references"
  ON public.payment_references FOR SELECT
  USING (
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
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can create payment references" ON public.payment_references;
CREATE POLICY "System can create payment references"
  ON public.payment_references FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 9. Garantir que todos os usuários existentes tenham perfil
INSERT INTO public.profiles (id, name, role)
SELECT 
    au.id,
    COALESCE(au.email, 'Usuário'),
    'cliente'
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;