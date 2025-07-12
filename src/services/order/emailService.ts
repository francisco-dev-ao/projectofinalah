import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    const { data: result, error } = await supabase.functions.invoke('send-order-email', {
      body: data
    });

    if (error) {
      console.error('Error sending order email:', error);
      return { success: false, error: error.message };
    }

    console.log('Order confirmation email sent successfully:', result);
    return { success: true, data: result };

  } catch (error) {
    console.error('Error in sendOrderConfirmationEmail:', error);
    return { success: false, error: error.message };
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
    return { success: false, error: error.message };
  }
};