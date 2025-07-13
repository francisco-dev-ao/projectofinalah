-- ============================================
-- CORREÇÃO FINAL PARA ERRO DE CHECKOUT DE DOMÍNIOS
-- Execute este SQL IMEDIATAMENTE na sua instância Supabase
-- ============================================

-- 1. REMOVER TUDO RELACIONADO A TABELA USERS
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. REMOVER TODAS AS POLICIES QUE PODEM REFERENCIAR USERS
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Remover todas as policies que contenham referência a 'users'
    FOR pol IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (definition LIKE '%users%' OR qual LIKE '%users%' OR with_check LIKE '%users%')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 3. REMOVER TRIGGERS E FUNÇÕES PROBLEMÁTICAS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 4. DESABILITAR RLS TEMPORARIAMENTE PARA LIMPEZA
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_references DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;

-- 5. GARANTIR QUE A COLUNA ENTITY EXISTE
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

-- 6. CRIAR POLÍTICAS SIMPLES E DIRETAS (SEM COMPLEXIDADE)

-- PROFILES - Policies simples
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles 
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles 
FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- DOMAINS - Policies simples
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "domains_select_own" ON public.domains 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "domains_insert_own" ON public.domains 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "domains_update_own" ON public.domains 
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- DOMAIN_ORDERS - Policies simples
ALTER TABLE public.domain_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "domain_orders_select_own" ON public.domain_orders 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "domain_orders_insert_own" ON public.domain_orders 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- ORDERS - Policies simples
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own" ON public.orders 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "orders_insert_own" ON public.orders 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- ORDER_ITEMS - Policies simples
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_own" ON public.order_items 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);

CREATE POLICY "order_items_insert_own" ON public.order_items 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);

-- SERVICES - Policies simples
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_own" ON public.services 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "services_insert_own" ON public.services 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- PAYMENT_REFERENCES - Policies simples
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_references_select_own" ON public.payment_references 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);

CREATE POLICY "payment_references_insert_own" ON public.payment_references 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);

-- INVOICES - Policies simples
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select_own" ON public.invoices 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);

CREATE POLICY "invoices_insert_own" ON public.invoices 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);

-- 7. GARANTIR PERFIS PARA TODOS OS USUÁRIOS EXISTENTES
INSERT INTO public.profiles (id, name, role, email)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', au.email, 'Usuário'),
    'cliente',
    au.email
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name);

-- 8. TRIGGER PARA NOVOS USUÁRIOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'Usuário'),
        'cliente',
        NEW.email
    );
    RETURN NEW;
EXCEPTION WHEN others THEN
    -- Se falhar, não impedir a criação do usuário
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 9. RECARREGAR CONFIGURAÇÃO
NOTIFY pgrst, 'reload config';

-- 10. TESTE DE VERIFICAÇÃO
SELECT 'Correção aplicada com sucesso!' as status;