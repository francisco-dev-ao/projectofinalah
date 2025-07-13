import { supabase } from '@/integrations/supabase/client';
import { EmailService } from '@/services/emailService';

interface OrderEmailData {
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  orderData?: any;
}

/**
 * Envia email automático de confirmação de pedido
 */
export const sendOrderConfirmationEmail = async (data: OrderEmailData) => {
  try {
    if (!data.customerEmail) {
      console.error('Customer email not provided for order confirmation');
      return { success: false, error: 'Customer email not provided' };
    }

    // Buscar dados completos do pedido se não fornecidos
    let orderData = data.orderData;
    if (!orderData && data.orderId) {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          profiles:user_id (name, email)
        `)
        .eq('id', data.orderId)
        .single();
        
      if (!error && order) {
        orderData = order;
      }
    }

    const result = await EmailService.sendOrderConfirmationEmail(
      data.customerEmail,
      data.customerName || orderData?.profiles?.name || 'Cliente',
      data.orderId,
      orderData
    );

    if (result.success) {
      console.log('Order confirmation email sent successfully:', result);
      return { success: true, data: result };
    } else {
      console.error('Error sending order email:', result.error);
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('Error in sendOrderConfirmationEmail:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Envia email automático quando um pedido é criado
 */
export const sendAutomaticOrderEmail = async (orderId: string, customerEmail?: string, customerName?: string) => {
  try {
    return await sendOrderConfirmationEmail({
      orderId,
      customerEmail,
      customerName
    });
  } catch (error) {
    console.error('Error in sendAutomaticOrderEmail:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};