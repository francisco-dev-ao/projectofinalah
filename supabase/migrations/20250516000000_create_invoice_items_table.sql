
-- Create invoice_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  service_description text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indices
CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON public.invoice_items (invoice_id);

-- Set up RLS
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policy for clients to view their own invoice items
CREATE POLICY "Clients can view their own invoice items"
  ON public.invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_id
      AND i.user_id = auth.uid()
    )
  );

-- Create policy for admins to view all invoice items
CREATE POLICY "Admins can view all invoice items"
  ON public.invoice_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );
