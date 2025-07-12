
import { supabase } from '@/integrations/supabase/client';

export class InvoiceDataFetcher {
  public static async fetchInvoiceData(invoiceId: string) {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        orders (
          *,
          profiles:user_id (*),
          payment_references (*),
          order_items (
            *,
            products:product_id (*)
          )
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) {
      console.error("Error fetching invoice:", invoiceError);
      throw invoiceError;
    }

    return invoice;
  }

  public static async fetchInvoiceItems(invoiceId: string) {
    const { data: invoiceItems, error: itemsError } = await supabase.rpc(
      'get_invoice_items',
      { invoice_id: invoiceId }
    );
    
    if (itemsError) {
      console.error("Error fetching invoice items:", itemsError);
      return [];
    }
    
    return invoiceItems || [];
  }

  public static async fetchCompanySettings() {
    const { data: companySettings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error("Error fetching company settings:", settingsError);
      return null;
    }

    return companySettings;
  }
}
