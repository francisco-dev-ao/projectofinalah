
import { supabase } from '@/integrations/supabase/client';
import { generateInvoice } from '@/services/invoice';

export const createOrderService = {
  // Process order with proper foreign key handling
  processOrder: async (orderData: any) => {
    try {
      console.log("Processing order with data:", orderData);
      
      // Create order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: orderData.userId,
          status: orderData.status || 'pending',
          total_amount: orderData.totalAmount || orderData.total || 0,
          payment_method: orderData.paymentMethod,
          notes: orderData.notes,
          cart_items: orderData.cartItems || orderData.items
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      console.log("Order created successfully:", order);

      // Create order items with valid product references
      if (orderData.items && orderData.items.length > 0) {
        console.log("Creating order items:", orderData.items);
        
        for (const item of orderData.items) {
          // For domain items, use a default product or create without product_id
          const orderItemData: any = {
            order_id: order.id,
            name: item.name,
            unit_price: item.unit_price || item.unitPrice || 0,
            quantity: item.quantity || 1,
            duration: item.duration,
            duration_unit: item.duration_unit
          };

          // Only add product_id if it's a valid UUID and not a domain
          if (item.product_id && 
              item.product_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) &&
              !item.name.toLowerCase().includes('domínio') &&
              !item.name.toLowerCase().includes('domain')) {
            
            // Verify product exists before adding reference
            const { data: productExists } = await supabase
              .from('products')
              .select('id')
              .eq('id', item.product_id)
              .single();
              
            if (productExists) {
              orderItemData.product_id = item.product_id;
            }
          }

          const { error: itemError } = await supabase
            .from('order_items')
            .insert(orderItemData);

          if (itemError) {
            console.error('Error creating order item:', itemError);
            // Continue with other items
          }
        }
      }

      // Always try to generate invoice if requested or by default
      if (orderData.generateInvoice !== false) {
        try {
          console.log("Generating invoice for order:", order.id);
          const invoiceResult = await generateInvoice(order.id);
          if (invoiceResult?.success) {
            console.log("Invoice generated successfully in order service");
          } else {
            console.warn("Invoice generation failed in order service:", invoiceResult?.error);
          }
        } catch (invoiceError) {
          console.error('Error generating invoice in order service:', invoiceError);
          // Don't fail the order if invoice fails
        }
      }

      return { success: true, order, orderId: order.id };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error };
    }
  }
};
