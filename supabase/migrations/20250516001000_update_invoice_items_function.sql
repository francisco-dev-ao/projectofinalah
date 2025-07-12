
-- Update the get_invoice_items function to better handle item details
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
    COALESCE(ii.id, oi.id) AS id,
    inv.id AS invoice_id,
    COALESCE(ii.service_name, oi.name, p.name, 'Serviço') AS service_name,
    COALESCE(ii.service_description, oi.description, p.description, '') AS service_description,
    COALESCE(ii.quantity, oi.quantity, 1) AS quantity,
    COALESCE(ii.unit_price, oi.price, oi.unit_price, 0) AS unit_price,
    COALESCE(ii.subtotal, (oi.quantity * COALESCE(oi.price, oi.unit_price)), 0) AS subtotal,
    s.start_date,
    s.end_date
  FROM 
    invoices inv
    JOIN orders o ON inv.order_id = o.id
    LEFT JOIN invoice_items ii ON ii.invoice_id = inv.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN services s ON s.order_item_id = oi.id
  WHERE 
    inv.id = invoice_id;
END;
$$;
