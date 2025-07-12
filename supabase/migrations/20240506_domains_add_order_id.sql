
-- Add order_id column to domains table
ALTER TABLE public.domains
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);

-- Add index on order_id for better query performance
CREATE INDEX IF NOT EXISTS domains_order_id_idx ON public.domains(order_id);
