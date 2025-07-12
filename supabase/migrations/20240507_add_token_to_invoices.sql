
-- Add sharing token field to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create index for faster lookups by token
CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON public.invoices (share_token);

-- Create a function to generate a new token
CREATE OR REPLACE FUNCTION public.generate_new_invoice_token(invoice_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
BEGIN
  new_token := gen_random_uuid();
  
  UPDATE public.invoices
  SET share_token = new_token
  WHERE id = invoice_id;
  
  RETURN new_token;
END;
$$;
