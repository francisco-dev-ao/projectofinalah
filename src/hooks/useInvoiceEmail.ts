import { useState } from 'react';
import { sendInvoiceViaEmail, sendAutomaticInvoiceEmail } from '@/services/invoice/emailService';
import { toast } from 'sonner';

export const useInvoiceEmail = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendEmail = async (invoiceId: string, email?: string) => {
    setIsLoading(true);
    try {
      const result = await sendInvoiceViaEmail(invoiceId, email);
      
      if (result.success) {
        toast.success('Email enviado com sucesso!');
        return { success: true };
      } else {
        toast.error(result.error || 'Erro ao enviar email');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao enviar email: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const sendAutomaticEmail = async (invoiceId: string) => {
    try {
      const result = await sendAutomaticInvoiceEmail(invoiceId);
      
      if (result.success) {
        toast.success('Email automático enviado!');
      } else if ('skipped' in result && result.skipped) {
        console.log('Auto-send disabled, skipping email');
      } else if ('error' in result) {
        console.error('Error sending automatic email:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error in sendAutomaticEmail:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return {
    sendEmail,
    sendAutomaticEmail,
    isLoading
  };
};