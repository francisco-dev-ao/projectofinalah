
-- Add missing columns to existing tables

-- Add organization_id to invoices (for multi-tenant support if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN organization_id UUID;
  END IF;
END $$;

-- Add approved_by column to payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN approved_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add pdf_generation_attempts column to invoices to track generation attempts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'pdf_generation_attempts'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN pdf_generation_attempts INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add last_pdf_generation_error column to invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'last_pdf_generation_error'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN last_pdf_generation_error TEXT;
  END IF;
END $$;

-- Create/update views for more convenient data access
CREATE OR REPLACE VIEW public.invoice_summary AS
SELECT 
  i.id,
  i.invoice_number,
  i.status,
  i.created_at,
  i.due_date,
  i.total_amount,
  i.pdf_url,
  u.email as client_email,
  p.full_name as client_name,
  (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) as item_count
FROM invoices i
LEFT JOIN orders o ON i.order_id = o.id
LEFT JOIN auth.users u ON o.user_id = u.id
LEFT JOIN profiles p ON u.id = p.id;

-- Create a function to get upcoming invoices for a customer
CREATE OR REPLACE FUNCTION get_upcoming_invoices(customer_id UUID)
RETURNS TABLE (
  service_name TEXT,
  next_invoice_date TIMESTAMPTZ,
  estimated_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.name as service_name,
    cs.next_invoice_date,
    cs.price_at_purchase as estimated_amount
  FROM customer_services cs
  JOIN services s ON cs.service_id = s.id
  WHERE cs.user_id = customer_id
  AND cs.status = 'active' 
  AND cs.next_invoice_date IS NOT NULL
  ORDER BY cs.next_invoice_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION get_upcoming_invoices TO public;
