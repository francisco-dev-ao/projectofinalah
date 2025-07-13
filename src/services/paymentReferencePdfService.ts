import { supabase } from "@/integrations/supabase/client";

/**
 * Generates PDF for payment reference data
 * @param referenceData Payment reference data
 * @param orderData Order data
 * @returns PDF buffer
 */
export const generatePaymentReferencePDF = async (
  referenceData: {
    entity: string;
    reference: string;
    amount: string;
    description: string;
    validityDate: string;
    instructions: string[];
  },
  orderData: any
): Promise<Uint8Array> => {
  try {
    // Call Supabase Edge Function to generate PDF
    const { data, error } = await supabase.functions.invoke('generate-payment-reference-pdf', {
      body: {
        referenceData,
        orderData,
        customerData: {
          name: orderData?.profiles?.name || 'Cliente',
          email: orderData?.profiles?.email || '',
          company: orderData?.profiles?.company_name || ''
        }
      }
    });

    if (error) {
      console.error('Error generating payment reference PDF:', error);
      throw new Error('Erro ao gerar PDF dos dados de pagamento');
    }

    // Convert base64 to Uint8Array
    if (typeof data === 'string') {
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    return data;
  } catch (error) {
    console.error('Error in generatePaymentReferencePDF:', error);
    throw error;
  }
};

/**
 * Sends payment reference email with PDF attachment
 * @param customerEmail Customer email
 * @param customerName Customer name
 * @param entity Payment entity
 * @param reference Payment reference
 * @param amount Payment amount
 * @param description Payment description
 * @param validityDate Payment validity date
 * @param instructions Payment instructions
 * @param orderData Order data
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
) => {
  try {
    console.log('📧 Sending payment reference email to:', customerEmail);
    
    // Generate PDF
    const pdfBuffer = await generatePaymentReferencePDF(
      {
        entity,
        reference,
        amount,
        description,
        validityDate,
        instructions
      },
      orderData
    );

    // Send email with PDF attachment via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-payment-reference-email', {
      body: {
        to: customerEmail,
        customerName,
        entity,
        reference,
        amount,
        description,
        validityDate,
        instructions,
        orderData,
        attachPdf: true,
        pdfBuffer: Array.from(pdfBuffer) // Convert Uint8Array to regular array for JSON
      }
    });

    if (error) {
      console.error('Error sending payment reference email:', error);
      throw new Error('Erro ao enviar email com dados de pagamento');
    }

    console.log('✅ Payment reference email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in sendPaymentReferenceEmail:', error);
    throw error;
  }
};