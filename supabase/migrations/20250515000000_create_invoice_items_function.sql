-- Create function to get invoice items
CREATE OR REPLACE FUNCTION get_invoice_items(invoice_id UUID)
RETURNS TABLE (
  id UUID,
  invoice_id UUID,
  service_name TEXT,
  service_description TEXT,
  quantity INTEGER,
  unit_price NUMERIC,
  subtotal NUMERIC,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.id, 
    inv.id AS invoice_id,
    p.name AS service_name,
    p.description AS service_description,
    oi.quantity,
    oi.price AS unit_price,
    (oi.quantity * oi.price) AS subtotal,
    s.start_date,
    s.end_date
  FROM 
    invoices inv
    JOIN orders o ON inv.order_id = o.id
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN services s ON s.order_item_id = oi.id
  WHERE 
    inv.id = invoice_id;
END;
$$;

-- Create function to setup invoice bucket policies
CREATE OR REPLACE FUNCTION setup_invoice_bucket_policies()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a placeholder function that would set up storage bucket policies
  -- In a real implementation, this would use RLS to set up bucket policies
  
  -- Ensure we have storage bucket for invoices
  BEGIN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection)
    VALUES ('invoices', 'invoices', true, false)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors
    NULL;
  END;
  
  RETURN TRUE;
END;
$$;
