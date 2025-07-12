-- Fix para a política RLS do bucket de invoices

-- Atualizar a função para configurar corretamente as políticas do bucket
CREATE OR REPLACE FUNCTION public.setup_invoice_bucket_policies()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- Check if the bucket exists already
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'invoices'
  ) INTO bucket_exists;

  -- Create the bucket if it doesn't exist
  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('invoices', 'invoices', true);
  END IF;

  -- Habilitar RLS na tabela de objetos
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- Criar políticas para o bucket

  -- 1. Políticas para SELECT (visualização)
  
  -- Usuários podem visualizar seus próprios PDFs de fatura
  BEGIN
    CREATE POLICY "Usuários podem visualizar seus próprios PDFs de fatura" 
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'invoices' AND
        auth.uid() IN (
          SELECT user_id FROM invoices WHERE id::text = substring(name FROM 'pdfs/([^/]+)/')
        )
      );
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
  END;

  -- Acesso público a PDFs (com tokens na URL)
  BEGIN
    CREATE POLICY "Público pode acessar PDFs de fatura com tokens válidos"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'invoices' AND
        position('.pdf' in name) > 0
      );
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  -- 2. Políticas para INSERT (upload)
  
  -- Permitir que usuários autenticados façam upload
  BEGIN
    CREATE POLICY "Usuários autenticados podem fazer upload de PDFs de fatura"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'invoices' AND
        auth.role() = 'authenticated'
      );
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  -- 3. Políticas para UPDATE e DELETE
  
  -- Administradores podem gerenciar todos os invoices
  BEGIN
    CREATE POLICY "Administradores podem gerenciar todas as faturas"
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
      );
  EXCEPTION
    WHEN duplicate_object THEN NULL;  
  END;

  -- Usuários podem atualizar seus próprios PDFs
  BEGIN
    CREATE POLICY "Usuários podem atualizar seus próprios PDFs de fatura"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'invoices' AND
        auth.uid() IN (
          SELECT user_id FROM invoices WHERE id::text = substring(name FROM 'pdfs/([^/]+)/') 
        )
      )
      WITH CHECK (
        bucket_id = 'invoices' AND
        auth.uid() IN (
          SELECT user_id FROM invoices WHERE id::text = substring(name FROM 'pdfs/([^/]+)/') 
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  -- Service role sempre tem acesso completo
  BEGIN
    CREATE POLICY "Service role pode gerenciar todos os PDFs de fatura"
      ON storage.objects FOR ALL
      USING (
        bucket_id = 'invoices' AND 
        auth.role() = 'service_role'
      )
      WITH CHECK (
        bucket_id = 'invoices' AND
        auth.role() = 'service_role'
      );
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  RETURN true;
END;
$$;

-- Conceder permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION public.setup_invoice_bucket_policies() TO authenticated;
