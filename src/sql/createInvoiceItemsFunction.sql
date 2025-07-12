
-- Function to get invoice items
CREATE OR REPLACE FUNCTION get_invoice_items(invoice_id uuid)
RETURNS TABLE (
  id uuid,
  invoice_id uuid,
  service_name text,
  service_description text,
  quantity int,
  unit_price numeric,
  subtotal numeric,
  start_date text,
  end_date text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- First try to get items from invoice_items table if it exists
  RETURN QUERY
  SELECT 
    ii.id,
    ii.invoice_id,
    ii.name as service_name,
    ii.description as service_description,
    ii.quantity,
    ii.unit_price,
    ii.total as subtotal,
    ii.start_date::text,
    ii.end_date::text
  FROM invoice_items ii
  WHERE ii.invoice_id = $1;
  
  -- If no results, fallback to getting data from order_items related to this invoice's order
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      oi.id,
      $1 as invoice_id,
      oi.name as service_name,
      oi.description as service_description,
      1 as quantity,
      oi.price as unit_price,
      oi.price as subtotal,
      oi.start_date::text,
      oi.end_date::text
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN invoices i ON i.order_id = o.id
    WHERE i.id = $1;
  END IF;
  
  RETURN;
END;
$$;

-- Function to create the get_invoice_items function
CREATE OR REPLACE FUNCTION create_get_invoice_items_function()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create the function
  EXECUTE '
  CREATE OR REPLACE FUNCTION get_invoice_items(invoice_id uuid)
  RETURNS TABLE (
    id uuid,
    invoice_id uuid,
    service_name text,
    service_description text,
    quantity int,
    unit_price numeric,
    subtotal numeric,
    start_date text,
    end_date text
  ) 
  LANGUAGE plpgsql
  AS $func$
  BEGIN
    -- First try to get items from invoice_items table if it exists
    BEGIN
      RETURN QUERY
      SELECT 
        ii.id,
        ii.invoice_id,
        ii.name as service_name,
        ii.description as service_description,
        ii.quantity,
        ii.unit_price,
        ii.total as subtotal,
        ii.start_date::text,
        ii.end_date::text
      FROM invoice_items ii
      WHERE ii.invoice_id = $1;
    EXCEPTION WHEN undefined_table THEN
      -- Table does not exist, continue
    END;
    
    -- If no results, fallback to getting data from order_items related to this invoice''s order
    RETURN QUERY
    SELECT 
      oi.id,
      $1 as invoice_id,
      p.name as service_name,
      p.description as service_description,
      1 as quantity,
      oi.price as unit_price,
      oi.price as subtotal,
      oi.start_date::text,
      oi.end_date::text
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    JOIN invoices i ON i.order_id = o.id
    WHERE i.id = $1;
    
    RETURN;
  END;
  $func$;
  ';
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;
