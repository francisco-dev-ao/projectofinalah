
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { AuditLogService } from "./audit-log-service";
import { OrderStatus, PaymentStatus } from "@/types/order";

// Export PaymentMethod enum for use in other files
export enum PaymentMethod {
  BANK_TRANSFER = "bank_transfer",
  MULTICAIXA = "multicaixa"
}

/**
 * Register a direct payment (legacy function name kept for backward compatibility)
 */
export const registerDirectPayment = async (paymentData: any) => {
  return createDirectPayment(paymentData, paymentData.userId);
};

/**
 * Record a payment in the database
 * @param payment Payment object with details
 * @param userId User ID making the payment
 * @returns The payment object or null if failed
 */
export const recordPayment = async (payment: any, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        id: uuidv4(),
        order_id: payment.orderId,
        amount_paid: payment.amount,
        method: payment.method,
        status: PaymentStatus.AWAITING,
        transaction_id: payment.transactionId || null,
        receipt_url: payment.receiptUrl || null,
        notes: payment.notes || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error recording payment:', error);
      return null;
    }

    // Log the payment action
    await AuditLogService.createAuditLog({
      user_id: userId,
      action: 'record_payment',
      details: `Payment of ${payment.amount} recorded for order ${payment.orderId} using ${payment.method}`
    });

    return data;
  } catch (error) {
    console.error('Error recording payment:', error);
    return null;
  }
};

/**
 * Confirm a payment in the database
 * @param paymentId Payment ID to confirm
 * @param adminId Admin user ID confirming the payment
 * @param notes Optional notes about the confirmation
 * @returns True if successful, false otherwise
 */
export const confirmPayment = async (paymentId: string, adminId: string, notes?: string) => {
  try {
    // First update the payment status
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: PaymentStatus.CONFIRMED,
        confirmed_by: adminId,
        notes: notes || null
      })
      .eq('id', paymentId)
      .select()
      .single();
    
    if (paymentError) {
      console.error('Error confirming payment:', paymentError);
      return { success: false, error: paymentError };
    }

    // Then update the order status to paid
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: OrderStatus.PAID
      })
      .eq('id', payment.order_id);
    
    if (orderError) {
      console.error('Error updating order status after payment confirmation:', orderError);
      return { success: false, error: orderError };
    }

    // Log the confirmation
    await AuditLogService.createAuditLog({
      user_id: adminId,
      action: 'confirm_payment',
      details: `Payment ${paymentId} confirmed for order ${payment.order_id}`
    });

    return { success: true };
  } catch (error) {
    console.error('Error confirming payment:', error);
    return { success: false, error };
  }
};

/**
 * Get payments for an order
 * @param orderId Order ID
 * @returns Array of payments
 */
export const getPaymentsForOrder = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching payments for order:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching payments for order:', error);
    return [];
  }
};

/**
 * Get all payments with pagination
 * @param page Page number (1-based)
 * @param limit Number of payments per page
 * @returns Array of payments and pagination info
 */
export const getAllPayments = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    // Get count of total payments
    const { count } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });
    
    // Get payments with pagination
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        orders (
          id, 
          user_id,
          total_amount,
          status,
          profiles:user_id (
            name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching payments:', error);
      return { 
        payments: [], 
        pagination: { 
          total: 0, 
          page, 
          limit,
          pages: 0
        } 
      };
    }

    return { 
      payments, 
      pagination: { 
        total: count || 0, 
        page, 
        limit,
        pages: count ? Math.ceil(count / limit) : 0
      } 
    };
  } catch (error) {
    console.error('Error fetching payments:', error);
    return { 
      payments: [], 
      pagination: { 
        total: 0, 
        page, 
        limit,
        pages: 0
      } 
    };
  }
};

/**
 * Mark a payment as failed
 * @param paymentId Payment ID
 * @param adminId Admin user ID marking the payment
 * @param reason Reason for failure
 * @returns True if successful, false otherwise
 */
export const markPaymentAsFailed = async (paymentId: string, adminId: string, reason: string) => {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: PaymentStatus.FAILED,
        confirmed_by: adminId,
        notes: reason || 'Marked as failed'
      })
      .eq('id', paymentId)
      .select()
      .single();
    
    if (error) {
      console.error('Error marking payment as failed:', error);
      return { success: false, error };
    }

    // Log the action
    await AuditLogService.createAuditLog({
      user_id: adminId,
      action: 'mark_payment_failed',
      details: `Payment ${paymentId} marked as failed. Reason: ${reason}`
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking payment as failed:', error);
    return { success: false, error };
  }
};

/**
 * Create a direct payment and mark order as paid
 * @param paymentData Payment data
 * @param adminId Admin user ID creating the payment
 * @returns True if successful, false otherwise
 */
export const createDirectPayment = async (paymentData: any, adminId: string = '') => {
  try {
    const userId = adminId || paymentData.userId || '';
    
    // First insert the payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        id: uuidv4(),
        order_id: paymentData.orderId,
        amount_paid: paymentData.amount,
        method: paymentData.method,
        status: PaymentStatus.CONFIRMED,
        confirmed_by: userId,
        transaction_id: paymentData.transactionId || null,
        receipt_url: paymentData.receiptUrl || null,
        notes: paymentData.notes || 'Direct payment by admin',
        payment_date: paymentData.paymentDate || new Date().toISOString()
      })
      .select()
      .single();
    
    if (paymentError) {
      console.error('Error creating direct payment:', paymentError);
      return { success: false, error: paymentError };
    }

    // Then update the order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: OrderStatus.PAID,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentData.orderId);
    
    if (orderError) {
      console.error('Error updating order status after direct payment:', orderError);
      return { success: false, error: orderError };
    }

    // Log the action if we have a userId
    if (userId) {
      await AuditLogService.createAuditLog({
        user_id: userId,
        action: 'create_direct_payment',
        details: `Direct payment of ${paymentData.amount} recorded for order ${paymentData.orderId} using ${paymentData.method}`
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating direct payment:', error);
    return { success: false, error };
  }
};

/**
 * Process multicaixa express payment callback
 * This would be used in an edge function
 * @param callbackData Data from Multicaixa Express callback
 * @returns True if successful, false otherwise
 */
export const processMulticaixaCallback = async (callbackData: any) => {
  try {
    // Extract reference from the callback data
    const paymentReference = callbackData.reference?.id;
    if (!paymentReference) {
      console.error('No payment reference in callback data');
      return { success: false, error: 'No payment reference provided' };
    }
    
    // Extract order ID from the reference (assuming format is orderId-...)
    const orderId = paymentReference.split('-')[0];
    if (!orderId) {
      console.error('Could not extract order ID from reference:', paymentReference);
      return { success: false, error: 'Invalid payment reference format' };
    }
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount, status')
      .eq('id', orderId)
      .single();
      
    if (orderError || !order) {
      console.error('Error fetching order or order not found:', orderError);
      return { success: false, error: 'Order not found' };
    }
    
    // Verify payment status and amount
    if (callbackData.status === 'ACCEPTED' && 
        parseFloat(callbackData.amount) >= parseFloat(order.total_amount.toString())) {
      
      // Update order status to paid
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: OrderStatus.PAID,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      if (updateError) {
        console.error('Error updating order status:', updateError);
        return { success: false, error: updateError };
      }
      
      // Record the payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          id: uuidv4(),
          order_id: orderId,
          amount_paid: callbackData.amount,
          method: PaymentMethod.MULTICAIXA,
          status: PaymentStatus.CONFIRMED,
          transaction_id: callbackData.transactionId || paymentReference,
          notes: 'Payment confirmed via Multicaixa Express callback',
          payment_date: new Date().toISOString()
        })
        .select()
        .single();
        
      if (paymentError) {
        console.error('Error recording payment:', paymentError);
        return { success: false, error: paymentError };
      }
      
      return { 
        success: true, 
        message: 'Payment processed successfully',
        data: { orderId, paymentId: payment.id }
      };
    } else {
      console.error('Payment not accepted or amount mismatch:', callbackData);
      return { 
        success: false, 
        error: 'Payment not accepted or amount mismatch' 
      };
    }
  } catch (error) {
    console.error('Error processing Multicaixa callback:', error);
    return { success: false, error };
  }
};
