-- ============================================
-- CORREÇÃO FINAL DOS PROBLEMAS DE DOMÍNIOS E POLÍTICAS RLS
-- Execute este SQL na sua instância Supabase
-- ============================================

-- 1. Verificar e adicionar coluna entity se não existir
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

-- 2. Remover qualquer tabela users conflitante
DROP TABLE IF EXISTS public.users CASCADE;

-- 3. Corrigir domínios duplicados existentes (se houver)
-- Atualizar domínios onde domain_name contém TLD duplicado
UPDATE public.domains 
SET domain_name = SPLIT_PART(domain_name, '.', 1)
WHERE domain_name LIKE '%.co.ao%' 
  AND domain_name != SPLIT_PART(domain_name, '.', 1);

UPDATE public.domain_orders 
SET domain_name = SPLIT_PART(domain_name, '.', 1)
WHERE domain_name LIKE '%.co.ao%' 
  AND domain_name != SPLIT_PART(domain_name, '.', 1);

-- 4. Habilitar RLS nas tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para profiles (corrigir "permission denied")
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

-- 6. Políticas para domains
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

-- 7. Políticas para domain_orders
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

-- 8. Políticas para orders
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

-- 9. Políticas para order_items
DROP POLICY IF EXISTS "Users can view order items from own orders" ON public.order_items;
CREATE POLICY "Users can view order items from own orders"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'suporte')
    )
  );

DROP POLICY IF EXISTS "System can create order items" ON public.order_items;
CREATE POLICY "System can create order items"
  ON public.order_items FOR INSERT
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

-- 10. Políticas para invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'suporte')
    )
  );

DROP POLICY IF EXISTS "System can create invoices" ON public.invoices;
CREATE POLICY "System can create invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 11. Políticas para payment_references
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

-- 12. Garantir que todos os usuários tenham perfil
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

-- 13. Atualizar papéis para nova estrutura (apenas admin, cliente, suporte)
UPDATE public.profiles 
SET role = 'admin' 
WHERE role IN ('super_admin');

UPDATE public.profiles 
SET role = 'cliente' 
WHERE role NOT IN ('admin', 'cliente', 'suporte');

-- 14. Verificar estrutura da tabela domain_orders
DO $$ 
BEGIN
    -- Verificar se a coluna tld_type existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'domain_orders' 
        AND column_name = 'tld_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.domain_orders ADD COLUMN tld_type TEXT;
    END IF;
    
    -- Verificar se a coluna domain_name existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'domain_orders' 
        AND column_name = 'domain_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.domain_orders ADD COLUMN domain_name TEXT;
    END IF;
END $$;

-- 15. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain_name ON public.domains(domain_name);
CREATE INDEX IF NOT EXISTS idx_domain_orders_user_id ON public.domain_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_domain_name ON public.domain_orders(domain_name);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

NOTIFY pgrst, 'reload config';