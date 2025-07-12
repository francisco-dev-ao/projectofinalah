import { useCallback } from 'react';
import { sendAutomaticOrderEmail } from '@/services/order/emailService';
import { toast } from 'sonner';

/**
 * Hook para gerenciar envio automático de emails de pedidos
 */
export const useOrderEmail = () => {
  const sendOrderEmail = useCallback(async (
    orderId: string,
    customerEmail?: string,
    customerName?: string,
    showToast: boolean = false
  ) => {
    try {
      const result = await sendAutomaticOrderEmail(orderId, customerEmail, customerName);
      
      if (result.success) {
        console.log('Order confirmation email sent successfully:', orderId);
        if (showToast) {
          toast.success('Email de confirmação enviado com sucesso!');
        }
        return { success: true };
      } else {
        console.error('Failed to send order email:', result.error);
        if (showToast) {
          toast.error('Erro ao enviar email de confirmação');
        }
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error in sendOrderEmail:', error);
      if (showToast) {
        toast.error('Erro ao enviar email de confirmação');
      }
      return { success: false, error: error.message };
    }
  }, []);

  return {
    sendOrderEmail
  };
};