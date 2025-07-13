import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Send payment reference email without PDF
 */
export const sendPaymentReferenceEmail = async (
  customerEmail: string,
  customerName: string,
  entity: string,
  reference: string,
  amount: string,
  description: string,
  validityDate: string,
  instructions: string[],
  orderData?: any
): Promise<{ success: boolean }> => {
  try {
    console.log('📧 Sending payment reference email to:', customerEmail);

    // Send email with payment reference data (without PDF)
    const response = await supabase.functions.invoke('send-payment-reference-email', {
      body: {
        to: customerEmail,
        customerName,
        entity,
        reference,
        amount,
        description,
        validityDate,
        instructions,
        orderData
      }
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to send email');
    }

    toast.success('Email enviado com sucesso!');
    return { success: true };
  } catch (error) {
    console.error('Error sending payment reference email:', error);
    toast.error('Erro ao enviar email: ' + (error as Error).message);
    return { success: false };
  }
};