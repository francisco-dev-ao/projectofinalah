
import { supabase } from '@/integrations/supabase/client';
import { OrderData, OrderResult, PaymentData } from '@/types/order';
import { ensureValidProductId, isValidUUID, extractServiceInfo } from '@/utils/productIdHelpers';

/**
 * Create a new order with proper error handling
 */
export const createOrder = async (orderData: OrderData): Promise<any> => {
  try {
    console.log("Creating order with data:", orderData);

    // Validate required data
    if (!orderData.userId) {
      throw new Error('User ID is required');
    }

    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order items are required');
    }

    // Validate product IDs but don't fail for dynamic IDs
    for (const item of orderData.items) {
      const productId = item.product_id || item.productId || item.productName;
      if (productId) {
        ensureValidProductId(productId); // This won't throw errors anymore
      }
    }

    // Create the order record
    const orderRecord = {
      user_id: orderData.userId,
      status: orderData.status || 'pending',
      total_amount: orderData.totalAmount || orderData.total || 0,
      payment_method: orderData.paymentMethod,
      notes: orderData.notes,
      cart_items: orderData.cartItems || orderData.items,
      created_at: new Date().toISOString()
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log("Order created with ID:", order.id);

    // Process order items with better service information extraction
    if (orderData.items && orderData.items.length > 0) {
      console.log("Inserting order items:", orderData.items);

      const orderItems = orderData.items.map((item: any) => {
        const serviceInfo = extractServiceInfo(item);
        
        const orderItem: any = {
          order_id: order.id,
          name: serviceInfo.name,
          description: serviceInfo.description,
          unit_price: serviceInfo.unit_price,
          quantity: serviceInfo.quantity,
          duration: serviceInfo.duration,
          duration_unit: serviceInfo.duration_unit
        };

        // Only add product_id if it's a valid UUID (not dynamic ID)
        const productId = item.product_id || item.productId || item.productName;
        if (productId && isValidUUID(productId)) {
          orderItem.product_id = productId;
        }

        return orderItem;
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Don't fail the entire order if items fail
      }
    }

    // === FLUXO AUTOMÁTICO: Gera fatura, referência, PDF e envia email ===
    try {
      const { generateInvoice } = await import('./invoice/generator');
      const { generatePaymentReference } = await import('./appyPayReferenceService');
      const { success: invoiceSuccess, invoice } = await generateInvoice(order.id);
      if (invoiceSuccess && invoice) {
        await generatePaymentReference({
          orderId: order.id,
          amount: order.total_amount,
          description: 'Pagamento do pedido ' + order.id
        });
      }
    } catch (autoFlowError) {
      console.error('Erro no fluxo automático pós-pedido:', autoFlowError);
    }

    return {
      success: true,
      order,
      orderId: order.id
    };

  } catch (error: any) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Get order by ID
 */
export const getOrder = async (orderId: string): Promise<OrderResult> => {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return { order: null, success: false };
    }

    return { order, success: true };
  } catch (error) {
    console.error('Error getting order:', error);
    return { order: null, success: false };
  }
};

/**
 * Get all orders with pagination
 */
export const getAllOrders = async (page: number, limit: number): Promise<any> => {
  try {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit - 1;

    const { data, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .range(startIndex, endIndex)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return { orders: [], pagination: { total: 0, page, limit, pages: 0 }, success: false };
    }

    const total = count || 0;
    const pages = Math.ceil(total / limit);

    return {
      orders: data || [],
      pagination: { total, page, limit, pages },
      success: true
    };
  } catch (error) {
    console.error('Error getting all orders:', error);
    return { orders: [], pagination: { total: 0, page, limit, pages: 0 }, success: false };
  }
};

/**
 * Get orders by user ID
 */
export const getOrdersByUserId = async (userId: string): Promise<any> => {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return { orders: [], success: false };
    }

    return { orders: orders || [], success: true };
  } catch (error) {
    console.error('Error getting orders by user ID:', error);
    return { orders: [], success: false };
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId: string, status: string): Promise<OrderResult> => {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (orderError) {
      console.error('Error updating order status:', orderError);
      return { order: null, success: false };
    }

    return { order, success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { order: null, success: false };
  }
};

/**
 * Delete order
 */
export const deleteOrder = async (orderId: string): Promise<any> => {
  try {
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (orderError) {
      console.error('Error deleting order:', orderError);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false };
  }
};

/**
 * Record payment for an order
 */
export const recordPayment = async (paymentData: PaymentData): Promise<any> => {
  try {
    // Validate required data
    if (!paymentData.orderId) {
      throw new Error('Order ID is required');
    }

    if (!paymentData.method) {
      throw new Error('Payment method is required');
    }

    if (!paymentData.amount) {
      throw new Error('Payment amount is required');
    }

    // Create the payment record
    const paymentRecord = {
      order_id: paymentData.orderId,
      method: paymentData.method,
      amount_paid: paymentData.amount,
      notes: paymentData.notes,
      receipt_url: paymentData.receiptUrl,
      transaction_id: paymentData.transactionId,
      payment_date: new Date().toISOString(),
      status: paymentData.status || 'confirmed',
      payment_method: paymentData.paymentMethod
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single();

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      throw new Error(`Failed to record payment: ${paymentError.message}`);
    }

    return {
      success: true,
      payment
    };

  } catch (error: any) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

/**
 * Register payment for an order (alias for recordPayment)
 */
export const registerPayment = async (paymentData: PaymentData): Promise<any> => {
  return recordPayment(paymentData);
};
