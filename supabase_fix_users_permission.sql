-- ============================================
-- CORREÇÃO URGENTE PARA ERRO "permission denied for table users"
-- Execute este SQL na sua instância Supabase
-- ============================================

-- 1. Remover DEFINITIVAMENTE qualquer tabela users que possa estar causando conflito
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Verificar e remover triggers ou funções que podem referenciar users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Garantir que todas as RLS policies estão corretas
-- Remover policies antigas que podem estar referenciando tabela users
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND definition LIKE '%users%'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 4. Recriar políticas corretas para profiles (sem referência à tabela users)
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

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- 5. Políticas para domains (sem referência à tabela users)
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

-- 6. Políticas para domain_orders (sem referência à tabela users)
DROP POLICY IF EXISTS "Users can view own domain orders" ON public.domain_orders;
CREATE POLICY "Users can view own domain orders"
  ON public.domain_orders FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own domain orders" ON public.domain_orders;
CREATE POLICY "Users can create own domain orders"
  ON public.domain_orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 7. Políticas para orders (sem referência à tabela users)
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

-- 8. Políticas para order_items (sem referência à tabela users)
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

-- 9. Políticas para services (sem referência à tabela users)
DROP POLICY IF EXISTS "Users can view own services" ON public.services;
CREATE POLICY "Users can view own services"
  ON public.services FOR SELECT
  USING (
    user_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'suporte')
    )
  );

DROP POLICY IF EXISTS "System can create services" ON public.services;
CREATE POLICY "System can create services"
  ON public.services FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 10. Verificar se a coluna entity existe na tabela payment_references
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

-- 11. Criar uma função para garantir perfil automaticamente quando necessário
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
    'cliente'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Criar trigger para novos usuários (se não existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_profile();

-- 13. Garantir que todos os usuários atuais tenham perfil
INSERT INTO public.profiles (id, name, role)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', au.email, 'Usuário'),
    'cliente'
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 14. Notificar que a configuração foi recarregada
NOTIFY pgrst, 'reload config';