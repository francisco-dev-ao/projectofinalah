
import { supabase } from "@/integrations/supabase/client";
import { Order, OrdersResult } from "@/types/order";
import { calculateOffset, formatOrdersResult, handleOrderQueryError } from "./orderQueryBase";

/**
 * Get orders for a specific user with pagination
 * @param userId User ID
 * @param page Page number (1-based)
 * @param limit Number of orders per page
 * @returns Array of orders and pagination info
 */
export const getUserOrders = async (userId: string, page = 1, limit = 10): Promise<OrdersResult> => {
  try {
    const offset = calculateOffset(page, limit);
    
    // Get count of total orders for the user
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Get user orders with pagination
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, payments (*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching user orders:', error);
      return handleOrderQueryError(error, page, limit);
    }

    return formatOrdersResult(orders as Order[], count, page, limit);
  } catch (error) {
    return handleOrderQueryError(error, page, limit);
  }
};
