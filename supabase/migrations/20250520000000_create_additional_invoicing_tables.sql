
-- Create services table for tracking services offered
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  recurring BOOLEAN DEFAULT false,
  billing_cycle TEXT, -- monthly, yearly, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create products table for physical product offerings
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price NUMERIC NOT NULL,
  stock_quantity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create customer_services table to track which services customers have
CREATE TABLE IF NOT EXISTS public.customer_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_invoice_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  price_at_purchase NUMERIC NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice_templates table for reusable invoice templates
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice_reminders table for tracking invoice reminders
CREATE TABLE IF NOT EXISTS public.invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  reminder_type TEXT NOT NULL, -- before_due, due, after_due
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tax_rates table for different tax configurations
CREATE TABLE IF NOT EXISTS public.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

-- Admin Policies
CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage customer services" ON public.customer_services
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage invoice templates" ON public.invoice_templates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage invoice reminders" ON public.invoice_reminders
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage tax rates" ON public.tax_rates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
  ));

-- User Policies
CREATE POLICY "Users can view their own services" ON public.customer_services
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view active services" ON public.services
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.customer_services
    WHERE customer_services.service_id = services.id AND customer_services.user_id = auth.uid()
  ));

CREATE POLICY "Users can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_customer_services_user_id ON public.customer_services (user_id);
CREATE INDEX IF NOT EXISTS idx_customer_services_service_id ON public.customer_services (service_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_invoice_id ON public.invoice_reminders (invoice_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services (is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active);

-- Create triggers to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_timestamp
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_products_timestamp
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_customer_services_timestamp
BEFORE UPDATE ON public.customer_services
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_invoice_templates_timestamp
BEFORE UPDATE ON public.invoice_templates
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
