import { supabase } from '@/lib/supabase';

/**
 * Substitui a chamada à função Supabase que não existe mais
 */
export async function getInvoiceItems(invoiceId: string) {
  console.log('Usando getInvoiceItems local em vez da função Supabase');
  
  // Buscar a fatura com seus itens
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      orders (
        order_items (*)
      )
    `)
    .eq('id', invoiceId)
    .single();
    
  if (error) {
    console.error('Erro ao buscar itens da fatura:', error);
    return { error };
  }
  
  // Extrair os itens da ordem
  const orderItems = data?.orders?.order_items || [];
  
  // Retornar no mesmo formato que a função do Supabase faria
  return { 
    data: orderItems, 
    error: null 
  };
}

// Adicionar ao objeto global para permitir interceptação
(window as any).getInvoiceItems = getInvoiceItems;