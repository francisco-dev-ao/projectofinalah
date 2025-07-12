
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { getInvoiceById } from './retrieval';
import { generateInvoiceNumber } from './utils';
import { sendAutomaticInvoiceEmail } from './emailService';

// Generate invoice from order data
export const generateInvoice = async (orderId: string) => {
  try {
    // Check if invoice already exists for this order
    const { data: existingInvoice, error: checkError } = await supabase
      .from('invoices')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing invoice:', checkError);
      return { success: false, error: checkError };
    }

    if (existingInvoice) {
      // Invoice already exists, fetch it
      const { data } = await getInvoiceById(existingInvoice.id);
      return { success: true, invoice: data, message: 'Invoice already exists' };
    }

    // Get the order details to create a new invoice
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order for invoice generation:', orderError);
      return { success: false, error: orderError || 'Order not found' };
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();
    
    // Calculate the total amount from order items
    const totalAmount = order.order_items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;

    // Create the invoice record - set status as 'pending' instead of 'draft'
    const { data: invoice, error: createError } = await supabase
      .from('invoices')
      .insert([
        {
          invoice_number: invoiceNumber,
          order_id: orderId,
          status: 'pending',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          public_token: uuidv4(),
          is_public: false,
          company_details: '',
          payment_instructions: '',
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating invoice:', createError);
      return { success: false, error: createError };
    }

    // Send automatic email if enabled
    if (invoice?.id) {
      try {
        await sendAutomaticInvoiceEmail(invoice.id);
      } catch (emailError) {
        console.error('Error sending automatic invoice email:', emailError);
        // Don't fail the invoice creation if email fails
      }
    }

    return { success: true, invoice };
  } catch (error) {
    console.error('Error generating invoice:', error);
    return { success: false, error };
  }
};
