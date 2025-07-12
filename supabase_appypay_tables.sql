-- ============================================
-- TABELAS PARA SISTEMA APPYPAY PAGAMENTOS POR REFERÊNCIA
-- Execute este SQL na sua instância Supabase
-- ============================================

-- 1. Criar tabela payment_references (se não existir)
CREATE TABLE IF NOT EXISTS public.payment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  reference TEXT NOT NULL UNIQUE,
  token TEXT,
  entity TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'expired')),
  payment_method TEXT DEFAULT 'appypay_reference',
  phone_number TEXT,
  description TEXT,
  validity_date TIMESTAMPTZ,
  appypay_response JSONB,
  webhook_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Adicionar colunas na tabela orders (se não existirem)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Atualizar constraint de status se necessário
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.orders 
    ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('draft', 'pending', 'pending_payment', 'paid', 'completed', 'cancelled', 'failed', 'processing'));
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payment_references_order_id ON public.payment_references(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_references_reference ON public.payment_references(reference);
CREATE INDEX IF NOT EXISTS idx_payment_references_entity ON public.payment_references(entity);
CREATE INDEX IF NOT EXISTS idx_payment_references_status ON public.payment_references(status);
CREATE INDEX IF NOT EXISTS idx_payment_references_validity_date ON public.payment_references(validity_date);
CREATE INDEX IF NOT EXISTS idx_payment_references_created_at ON public.payment_references(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- 4. Habilitar Row Level Security
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para payment_references
DROP POLICY IF EXISTS "Users can view their own payment references" ON public.payment_references;
CREATE POLICY "Users can view their own payment references" ON public.payment_references
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage payment references" ON public.payment_references;
CREATE POLICY "Service role can manage payment references" ON public.payment_references
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para authenticated users poderem inserir suas próprias referências
DROP POLICY IF EXISTS "Users can insert their own payment references" ON public.payment_references;
CREATE POLICY "Users can insert their own payment references" ON public.payment_references
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- 6. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Trigger para payment_references
DROP TRIGGER IF EXISTS update_payment_references_updated_at ON public.payment_references;
CREATE TRIGGER update_payment_references_updated_at 
  BEFORE UPDATE ON public.payment_references 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Trigger para orders (se não existir)
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Função para buscar referências expiradas (útil para limpeza)
CREATE OR REPLACE FUNCTION get_expired_references()
RETURNS TABLE (
  id UUID,
  reference TEXT,
  order_id UUID,
  amount DECIMAL,
  validity_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.reference,
    pr.order_id,
    pr.amount,
    pr.validity_date
  FROM public.payment_references pr
  WHERE pr.validity_date < now()
    AND pr.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Função para marcar referências como expiradas
CREATE OR REPLACE FUNCTION mark_expired_references()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.payment_references 
  SET status = 'expired', updated_at = now()
  WHERE validity_date < now() 
    AND status = 'pending';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. View para relatórios de pagamentos (opcional)
CREATE OR REPLACE VIEW payment_references_report AS
SELECT 
  pr.id,
  pr.reference,
  pr.entity,
  pr.amount,
  pr.status,
  pr.payment_method,
  pr.validity_date,
  pr.created_at,
  o.id as order_id,
  o.user_id,
  o.total_amount as order_total,
  p.name as customer_name,
  p.email as customer_email
FROM public.payment_references pr
LEFT JOIN public.orders o ON pr.order_id = o.id
LEFT JOIN public.profiles p ON o.user_id = p.id
ORDER BY pr.created_at DESC;

-- 12. Grant permissions para a view
GRANT SELECT ON payment_references_report TO authenticated;
GRANT ALL ON payment_references_report TO service_role;

-- 13. Política RLS para a view
ALTER VIEW payment_references_report SET (security_invoker = on);

-- 14. Inserir dados de exemplo (opcional - remover em produção)
-- INSERT INTO public.payment_references (
--   order_id, 
--   reference, 
--   entity, 
--   amount, 
--   status, 
--   payment_method,
--   description,
--   validity_date
-- ) VALUES (
--   'order-uuid-here',
--   '1234-5678-9012',
--   '10559',
--   1500.00,
--   'pending',
--   'appypay_reference',
--   'Pagamento de teste',
--   now() + interval '7 days'
-- );

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Verificar se tudo foi criado corretamente
SELECT 
  'payment_references' as table_name,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'payment_references' 
  AND table_schema = 'public'

UNION ALL

SELECT 
  'Indexes on payment_references' as table_name,
  COUNT(*) as total_indexes
FROM pg_indexes 
WHERE tablename = 'payment_references' 
  AND schemaname = 'public'

UNION ALL

SELECT 
  'RLS Policies on payment_references' as table_name,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'payment_references' 
  AND schemaname = 'public';

-- Exibir estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'payment_references' 
  AND table_schema = 'public'
ORDER BY ordinal_position;