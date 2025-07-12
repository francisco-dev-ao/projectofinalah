-- Function to safely get table names from the database
CREATE OR REPLACE FUNCTION get_table_names()
RETURNS TABLE (tablename text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.tablename::text
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_table_names() TO authenticated;

-- Function to generate a new invoice token
CREATE OR REPLACE FUNCTION generate_new_invoice_token(invoice_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
BEGIN
  new_token := gen_random_uuid();
  
  UPDATE invoices
  SET share_token = new_token
  WHERE id = invoice_id;
  
  RETURN new_token::text;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_new_invoice_token TO authenticated;

-- Function to setup invoice bucket storage policies
CREATE OR REPLACE FUNCTION setup_invoice_bucket_policies()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure we have storage bucket for invoices
  INSERT INTO storage.buckets (id, name, public, avif_autodetection)
  VALUES ('invoices', 'invoices', true, false)
  ON CONFLICT (id) DO NOTHING;
  
  -- Ensure public can download invoices
  INSERT INTO storage.policies (name, bucket_id, resource, action, definition)
  VALUES (
    'Give public users access to invoice PDFs',
    'invoices',
    'object',
    'select',
    '(bucket_id = ''invoices'')'
  )
  ON CONFLICT (name, bucket_id, resource) DO NOTHING;
  
  -- Allow authenticated users to upload invoices
  INSERT INTO storage.policies (name, bucket_id, resource, action, definition)
  VALUES (
    'Allow authenticated users to upload invoice PDFs',
    'invoices',
    'object',
    'insert',
    '(bucket_id = ''invoices'' AND auth.role() = ''authenticated'')'
  )
  ON CONFLICT (name, bucket_id, resource) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION setup_invoice_bucket_policies TO authenticated;
