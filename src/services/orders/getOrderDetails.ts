
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderResult } from "@/types/order";

/**
 * Get a specific order by ID with all related data
 * @param orderId Order ID
 * @returns The order object or null if not found
 */
export const getOrderById = async (orderId: string): Promise<OrderResult> => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        payments (*),
        profiles:user_id (
          id,
          name,
          company_name,
          phone,
          address,
          nif
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order by ID:', error);
      return { order: null, success: false };
    }

    return { order: order as Order, success: true };
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return { order: null, success: false };
  }
};

/**
 * Get a specific order by ID for customer view
 * @param orderId Order ID
 * @param userId User ID (for authorization)
 * @returns The order object or null if not found
 */
export const getOrder = async (orderId: string, userId?: string): Promise<OrderResult> => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        payments (*)
      `)
      .eq('id', orderId);
      
    // If userId is provided, only fetch orders for this user (for security)
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: order, error } = await query.single();
    
    if (error) {
      console.error('Error fetching order:', error);
      return { order: null, success: false };
    }
    
    return { order: order as Order, success: true };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { order: null, success: false };
  }
};

/**
 * Get order details including items, customer info, payments
 * @param orderId Order ID
 * @returns Order details object or null if not found
 */
export const getOrderDetails = async (orderId: string): Promise<OrderResult> => {
  try {
    // First get the order with basic info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (
          id, 
          name,
          company_name,
          phone,
          address,
          nif
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order details:', orderError);
      return { order: null, success: false };
    }

    // Then get all payments for this order
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching order payments:', paymentsError);
      return { order: { ...order, payments: [] } as Order, success: true };
    }

    return { order: { ...order, payments } as Order, success: true };
  } catch (error) {
    console.error('Error fetching order details:', error);
    return { order: null, success: false };
  }
};
