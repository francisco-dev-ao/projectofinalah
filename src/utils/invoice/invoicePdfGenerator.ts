
import { PDFGenerator } from '@/utils/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';

export const generateInvoicePdf = async (invoiceId: string, invoiceNumber: string): Promise<string> => {
  try {
    // Buscar dados básicos da fatura
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
      
    if (invoiceError) {
      console.error('Erro ao buscar fatura:', invoiceError);
      throw new Error(`Erro ao carregar fatura: ${invoiceError.message}`);
    }
    
    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }
    
    // Buscar dados do pedido separadamente se existir order_id
    let orderData = null;
    let profileData = null;
    let orderItems = [];
    
    if (invoice.order_id) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', invoice.order_id)
        .single();
        
      if (!orderError && order) {
        orderData = order;
        
        // Buscar perfil do usuário
        if (order.user_id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', order.user_id)
            .single();
            
          if (!profileError) {
            profileData = profile;
          }
        }
        
        // Buscar itens do pedido
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
          
        if (!itemsError && items) {
          orderItems = items;
        }
      }
    }
    
    // Montar estrutura de dados para o PDF
    const invoiceWithData = {
      ...invoice,
      orders: orderData ? {
        ...orderData,
        profiles: profileData,
        order_items: orderItems
      } : null
    };
    
    console.log('Dados da fatura carregados:', invoiceWithData);
    
    // Gerar PDF com dados reais
    const pdfBuffer = await PDFGenerator.generateInvoicePDF(invoiceWithData);
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};

export default generateInvoicePdf;
