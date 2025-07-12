-- Add AppyPay payment references table
CREATE TABLE IF NOT EXISTS public.payment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  reference TEXT NOT NULL,
  token TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'multicaixa',
  phone_number TEXT,
  appypay_response JSONB,
  webhook_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_references_order_id ON public.payment_references(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_references_reference ON public.payment_references(reference);
CREATE INDEX IF NOT EXISTS idx_payment_references_token ON public.payment_references(token);
CREATE INDEX IF NOT EXISTS idx_payment_references_status ON public.payment_references(status);

-- Enable Row-Level Security
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own payment references
CREATE POLICY "Users can view their own payment references" ON public.payment_references
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Create policy for service role to insert/update payment references
CREATE POLICY "Service role can manage payment references" ON public.payment_references
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_references_updated_at 
  BEFORE UPDATE ON public.payment_references 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add AppyPay payment method to existing payment methods if not exists
DO $$
BEGIN
  -- Add new payment methods to orders table payment_method column if using enum
  -- This assumes payment_method is a text field, adjust as needed
  
  -- Update existing multicaixa payment method to be more specific
  UPDATE public.payment_references 
  SET payment_method = 'appypay_multicaixa' 
  WHERE payment_method = 'multicaixa';
  
EXCEPTION
  WHEN others THEN
    -- Table might not exist yet, ignore error
    NULL;
END
$$;