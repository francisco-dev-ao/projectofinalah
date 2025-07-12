import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentStatusCheck {
  orderId: string;
  paymentStatus: 'pending' | 'confirmed' | 'failed';
  invoiceStatus: 'draft' | 'issued' | 'paid' | 'canceled';
  reference: string;
  amount: number;
}

/**
 * Check payment status for a specific order
 */
export const checkPaymentStatus = async (orderId: string): Promise<PaymentStatusCheck | null> => {
  try {
    // Get order with payment references and invoice
    const { data: orderData, error } = await supabase
      .from('orders')
      .select(`
        *,
        payment_references (*),
        invoices (*)
      `)
      .eq('id', orderId)
      .single();

    if (error || !orderData) {
      console.error('Error fetching order:', error);
      return null;
    }

    const paymentReference = orderData.payment_references?.[0];
    const invoice = orderData.invoices?.[0];

    if (!paymentReference) {
      console.warn('No payment reference found for order:', orderId);
      return null;
    }

    return {
      orderId,
      paymentStatus: paymentReference.status || 'pending',
      invoiceStatus: invoice?.status || 'draft',
      reference: paymentReference.reference,
      amount: orderData.total_amount
    };

  } catch (error) {
    console.error('Error checking payment status:', error);
    return null;
  }
};

/**
 * Manually update invoice status to paid (admin function)
 */
export const markInvoiceAsPaid = async (invoiceId: string, transactionId?: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Erro ao atualizar status da fatura');
      return false;
    }

    // If we have a transaction ID, also record the payment
    if (transactionId) {
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('order_id, amount')
        .eq('id', invoiceId)
        .single();

      if (invoiceData) {
        await supabase
          .from('payments')
          .insert({
            order_id: invoiceData.order_id,
            amount_paid: invoiceData.amount,
            method: 'manual_confirmation',
            status: 'confirmed',
            transaction_id: transactionId,
            notes: 'Pagamento confirmado manualmente',
            payment_date: new Date().toISOString()
          });
      }
    }

    toast.success('Fatura marcada como paga');
    return true;

  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    toast.error('Erro ao marcar fatura como paga');
    return false;
  }
};

/**
 * Auto-check payment status with polling
 */
export const startPaymentStatusPolling = (
  orderId: string, 
  onStatusChange: (status: PaymentStatusCheck) => void,
  intervalMs: number = 30000 // 30 seconds
): () => void => {
  
  const checkStatus = async () => {
    const status = await checkPaymentStatus(orderId);
    if (status) {
      onStatusChange(status);
      
      // Stop polling if payment is confirmed or failed
      if (status.paymentStatus === 'confirmed' || status.paymentStatus === 'failed') {
        clearInterval(interval);
      }
    }
  };

  // Check immediately
  checkStatus();
  
  // Set up polling
  const interval = setInterval(checkStatus, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(interval);
};

/**
 * Service object for easy import
 */
export const PaymentStatusService = {
  checkPaymentStatus,
  markInvoiceAsPaid,
  startPaymentStatusPolling
};