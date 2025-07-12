-- Fix para políticas de RLS do bucket de invoices no Supabase
-- Esse script corrige o problema "new row violates row-level security policy"
-- durante o upload de PDFs de fatura para o bucket 'invoices'

-- Primeiro remover políticas existentes que possam estar conflitantes
DROP POLICY IF EXISTS "Service role can upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de PDFs de fatura" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view their invoices" ON storage.objects;
DROP POLICY IF EXISTS "Administrators can manage all invoices" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all invoices" ON storage.objects;erificar se a função setup_invoice_bucket_policies existe e atualizá-la
DROP FUNCTION IF EXISTS public.setup_invoice_bucket_policies();

CREATE OR REPLACE FUNCTION public.setup_invoice_bucket_policies()
DROP FUNCTION IF EXISTS public.setup_invoice_bucket_policies();

-- Agora criamos a função novamente
-- Primeiro remover a função se já existir
DROP FUNCTION IF EXISTS public.setup_invoice_bucket_policies();

-- Recriar a função
CREATE FUNCTION public.setup_invoice_bucket_policies()
RETURNS booleanl
SECURITY DEFINER
AS $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- Check if the bucket exists already
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'invoices'
  -- Já removemos as políticas conflitantes no início do script
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('invoices', 'invoices', true);
  END IF;

  -- Habilitar RLS na tabela de objetos
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- As políticas conflitantes já foram removidas no início do script
  -- 1. Usuários autenticados podem visualizar e fazer upload
  BEGIN
    CREATE POLICY "Allow authenticated users to upload invoices"
  -- 1. Usuários autenticados podem fazer upload
  CREATE POLICY "Allow authenticated users to upload invoices"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'invoices' AND 
      auth.role() IN ('authenticated', 'service_role')
    );ON storage.objects FOR SELECT
      USING (
        bucket_id = 'invoices' AND (
          auth.role() IN ('authenticated', 'service_role') OR
          position('.pdf' in name) > 0 -- Allow public access to PDF files
        )
    -- 2. Permitir visualização de faturas para usuários autenticados
  CREATE POLICY "Authenticated users can view their invoices"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'invoices' AND (
        auth.role() IN ('authenticated', 'service_role') OR
        position('.pdf' in name) > 0 -- Allow public access to PDF files
      )
    );    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        bucket_id = 'invoices' AND
  -- 3. Administradores têm acesso completo
  CREATE POLICY "Administrators can manage all invoices"
    ON storage.objects FOR ALL
    USING (
      bucket_id = 'invoices' AND
      auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
    WITH CHECK (
      bucket_id = 'invoices' AND
      auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
      )
    ););
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  RETURN true;
EN  -- 4. Service role tem acesso completo 
  CREATE POLICY "Service role can manage all invoices"
    ON storage.objects FOR ALL
    USING (
      bucket_id = 'invoices' AND 
      auth.role() = 'service_role'
    )
    WITH CHECK (
      bucket_id = 'invoices' AND
      auth.role() = 'service_role'
    );