-- ============================================
-- DIAGNÓSTICO DO PROBLEMA "permission denied for table users"
-- Execute este SQL na sua instância Supabase para diagnosticar
-- ============================================

-- 1. Verificar se existe alguma tabela users
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE tablename LIKE '%users%';

-- 2. Verificar policies que referenciam users
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
WHERE definition LIKE '%users%' OR qual LIKE '%users%' OR with_check LIKE '%users%';

-- 3. Verificar triggers que podem referenciar users
SELECT 
    trigger_name,
    trigger_schema,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%users%';

-- 4. Verificar funções que podem referenciar users
SELECT 
    routine_name,
    routine_schema,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%users%' 
  AND routine_schema = 'public';

-- 5. Verificar se a tabela profiles existe e tem a estrutura correta
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar RLS habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'domains', 'domain_orders', 'orders', 'order_items', 'services', 'payment_references');

-- 7. Verificar se existem views ou tabelas materializadas que podem referenciar users
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition LIKE '%users%' 
  AND schemaname = 'public';

-- 8. Verificar se há foreign keys ou constraints que referenciam users
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND (ccu.table_name = 'users' OR tc.table_name = 'users');

-- 9. Verificar configuração RLS da tabela profiles especificamente
SELECT pol.polname AS policy_name,
       pol.polcmd AS policy_command,
       pol.polpermissive AS policy_permissive,
       pol.polroles AS policy_roles,
       pol.polqual AS policy_qual,
       pol.polwithcheck AS policy_with_check
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' AND pc.relname = 'profiles';