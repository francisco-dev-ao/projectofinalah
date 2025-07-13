import { supabase } from '@/integrations/supabase/client';
// PDFGenerator removed - using print reference instead
import { InvoiceService } from '@/services/invoiceService';

export const testInvoiceWithReference = async () => {
  try {
    console.log('🧪 Iniciando teste de referência na fatura...');
    
    // 1. Buscar uma fatura existente com referência de pagamento
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        orders (
          *,
          payment_references (*),
          profiles:user_id (*)
        )
      `)
      .not('orders.payment_references', 'is', null)
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao buscar fatura:', error);
      return;
    }
    
    if (!invoices || invoices.length === 0) {
      console.log('⚠️ Nenhuma fatura com referência encontrada');
      return;
    }
    
    const invoice = invoices[0];
    console.log('✅ Fatura encontrada:', {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      payment_references: invoice.orders?.payment_references
    });
    
    // 2. Testar impressão de referência
    console.log('🔄 Preparando impressão de referência...');
    const paymentRef = invoice.orders?.payment_references?.[0];
    
    if (paymentRef) {
      // 3. Criar conteúdo para impressão da referência
      const printContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 400px;">
          <h2>Referência de Pagamento - TESTE</h2>
          <hr>
          <p><strong>Fatura:</strong> ${invoice.invoice_number}</p>
          <p><strong>Cliente:</strong> ${invoice.orders?.profiles?.name || 'N/A'}</p>
          <p><strong>Entidade:</strong> ${paymentRef.entity}</p>
          <p><strong>Referência:</strong> ${paymentRef.reference}</p>
          <p><strong>Valor:</strong> KZ ${invoice.amount?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
          <p><strong>Validade:</strong> ${new Date(paymentRef.expires_at).toLocaleDateString('pt-PT')}</p>
          <hr>
          <small>Pagamento via ATM, Internet Banking ou Multicaixa Express</small>
        </div>
      `;
      
      console.log('📄 Conteúdo da referência preparado:', printContent);
    }
    
    console.log('✅ Referência preparada com sucesso!');
    console.log('🔍 Verifique se a referência está correta no console');
    
    return {
      success: true,
      invoice,
      referenceCount: invoice.orders?.payment_references?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return { success: false, error };
  }
};

// Adicionar ao objeto global para uso no console
(window as any).testInvoiceReference = testInvoiceWithReference;