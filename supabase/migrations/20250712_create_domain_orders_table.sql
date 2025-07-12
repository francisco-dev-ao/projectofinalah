-- Create domain_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.domain_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name TEXT NOT NULL,
  tld_type TEXT NOT NULL DEFAULT 'ao',
  price DECIMAL(10,2) DEFAULT 0,
  duration INTEGER DEFAULT 12,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.domain_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for domain_orders
CREATE POLICY IF NOT EXISTS "Users can view their own domain orders"
  ON public.domain_orders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert their own domain orders"
  ON public.domain_orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update their own domain orders"
  ON public.domain_orders
  FOR UPDATE
  USING (user_id = auth.uid());

-- Create policy for admins to manage all domain orders
CREATE POLICY IF NOT EXISTS "Admins can manage all domain orders"
  ON public.domain_orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_domain_orders_user_id ON public.domain_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_order_id ON public.domain_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_status ON public.domain_orders(status);
CREATE INDEX IF NOT EXISTS idx_domain_orders_domain_name ON public.domain_orders(domain_name);

-- Add comment for documentation
COMMENT ON TABLE public.domain_orders IS 'Table to store domain orders placed by users';