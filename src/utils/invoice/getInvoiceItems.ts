
import { supabase } from "@/integrations/supabase/client";
import { InvoiceItem } from "@/types/invoice";

/**
 * Get invoice items for a specific invoice
 * @param invoiceId The invoice ID
 * @returns Array of invoice items
 */
export const getInvoiceItems = async (invoiceId: string): Promise<InvoiceItem[]> => {
  try {
    // Use the RPC function designed to get invoice items
    const { data, error } = await supabase.rpc('get_invoice_items', { invoice_id: invoiceId });
    
    if (error) {
      console.error("Error fetching invoice items:", error);
      throw error;
    }
    
    // Map the data to the expected format
    return (data || []).map(item => ({
      id: item.id,
      invoice_id: item.invoice_id,
      service_name: item.service_name,
      service_description: item.service_description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.subtotal
    }));
    
  } catch (error) {
    console.error("Error in getInvoiceItems:", error);
    return [];
  }
};
