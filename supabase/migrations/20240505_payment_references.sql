
-- Criar a tabela payment_references para rastrear referências de pagamento do Multicaixa Express
CREATE TABLE IF NOT EXISTS public.payment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura por administradores
CREATE POLICY "Allow admins to read payment_references"
  ON public.payment_references
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Criar política para permitir leitura pelo próprio usuário que fez a ordem
CREATE POLICY "Allow users to read their own payment_references"
  ON public.payment_references
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payment_references.order_id AND orders.user_id = auth.uid()
    )
  );

-- Criar política para permitir inserção pelo serviço
CREATE POLICY "Allow service to insert into payment_references"
  ON public.payment_references
  FOR INSERT
  WITH CHECK (true);

-- Criar política para permitir atualização pelo serviço
CREATE POLICY "Allow service to update payment_references"
  ON public.payment_references
  FOR UPDATE
  USING (true);

-- Criar índice para facilitar buscas por order_id
CREATE INDEX IF NOT EXISTS payment_references_order_id_idx ON public.payment_references (order_id);

-- Criar índice para facilitar buscas por reference
CREATE INDEX IF NOT EXISTS payment_references_reference_idx ON public.payment_references (reference);

-- Adicionar coluna multicaixa_express_config à tabela company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS multicaixa_express_config JSONB DEFAULT '{"frametoken": "a53787fd-b49e-4469-a6ab-fa6acf19db48", "callback": "", "success": "", "error": ""}';
