import { supabase } from '@/integrations/supabase/client';
import { PDFGenerator } from '@/utils/pdfGenerator';
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
    
    // 2. Testar geração de PDF com a referência
    console.log('🔄 Gerando PDF com referência...');
    const pdfBuffer = await PDFGenerator.generateInvoicePDF(invoice);
    
    // 3. Fazer download do PDF para verificar
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teste-fatura-${invoice.invoice_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ PDF gerado e baixado com sucesso!');
    console.log('🔍 Verifique se a referência aparece corretamente no PDF');
    
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