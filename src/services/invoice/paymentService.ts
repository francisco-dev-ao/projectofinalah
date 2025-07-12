
import { supabase } from '@/integrations/supabase/client';
import { sendInvoiceViaEmail } from './emailService';

// Function to record invoice payment
export const recordInvoicePayment = async (invoiceId: string, paymentDetails: Record<string, any>) => {
  try {
    // Update invoice status to paid
    const { error } = await supabase
      .from('invoices')
      .update({ 
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_details: paymentDetails
      })
      .eq('id', invoiceId);

    if (error) {
      console.error('Error recording payment:', error);
      return { success: false, error: error.message };
    }

    // Send payment confirmation email
    try {
      await sendInvoiceViaEmail(invoiceId);
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
      // Don't fail the payment recording if email fails
    }

    console.log(`Payment recorded for invoice ${invoiceId} with details:`, paymentDetails);
    return { success: true, message: 'Payment recorded successfully' };
  } catch (error) {
    console.error('Error in recordInvoicePayment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Function to get public invoice URL
export const getPublicInvoiceURL = (invoiceId: string, publicToken: string) => {
  return `/invoices/${invoiceId}/public?token=${publicToken}`;
};
