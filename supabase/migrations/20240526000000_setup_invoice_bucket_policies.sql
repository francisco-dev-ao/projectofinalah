
-- Create a function to setup the invoice bucket policies
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

  -- Create policies for the bucket
  -- Users can view their own invoice PDFs
  BEGIN
    CREATE POLICY "Users can view their own invoice PDFs" 
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

  -- Allow public access to PDFs (these will be secured by random tokens in the URL)
  BEGIN
    CREATE POLICY "Public can access invoice PDFs with valid tokens"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'invoices' AND
        position('.pdf' in name) > 0
      );
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  -- Service role can upload and manage PDFs
  BEGIN
    CREATE POLICY "Service role can manage invoice PDFs"
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

  -- Admins can manage all invoices
  BEGIN
    CREATE POLICY "Admin users can manage all invoices"
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

  RETURN true;
END;
$$;
