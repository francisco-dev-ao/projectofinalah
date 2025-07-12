
-- Criar tabela para logs de webhooks se não existir
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type TEXT NOT NULL,
  status TEXT NOT NULL,
  reference TEXT,
  transaction_id TEXT,
  invoice_id UUID,
  order_id UUID,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela para logs de callbacks do Multicaixa se não existir
CREATE TABLE IF NOT EXISTS public.multicaixa_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  reference TEXT,
  invoice_id UUID,
  order_id UUID,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela para logs de teste do Multicaixa se não existir
CREATE TABLE IF NOT EXISTS public.multicaixa_test_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  request_payload JSONB NOT NULL,
  response_payload JSONB,
  status TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir que a coluna reference existe na tabela invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'reference'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN reference TEXT;
  END IF;
END $$;

-- Criar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_webhook_logs_reference ON public.webhook_logs (reference);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_transaction_id ON public.webhook_logs (transaction_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_invoice_id ON public.webhook_logs (invoice_id);
CREATE INDEX IF NOT EXISTS idx_multicaixa_callbacks_reference ON public.multicaixa_callbacks (reference);
CREATE INDEX IF NOT EXISTS idx_multicaixa_callbacks_invoice_id ON public.multicaixa_callbacks (invoice_id);

-- Permitir acesso aos admins
ALTER TABLE IF EXISTS public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.multicaixa_callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.multicaixa_test_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para webhook_logs
CREATE POLICY IF NOT EXISTS "Allow admins to read webhook_logs"
  ON public.webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'suporte')
    )
  );

-- Políticas para multicaixa_callbacks
CREATE POLICY IF NOT EXISTS "Allow admins to read multicaixa_callbacks"
  ON public.multicaixa_callbacks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'suporte')
    )
  );

-- Políticas para multicaixa_test_logs
CREATE POLICY IF NOT EXISTS "Allow admins to read multicaixa_test_logs"
  ON public.multicaixa_test_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'suporte')
    )
  );

-- Permitir inserção pelo service role
CREATE POLICY IF NOT EXISTS "Allow service to insert webhook_logs"
  ON public.webhook_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow service to insert multicaixa_callbacks"
  ON public.multicaixa_callbacks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow service to insert multicaixa_test_logs"
  ON public.multicaixa_test_logs
  FOR INSERT
  WITH CHECK (true);
