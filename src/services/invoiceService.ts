import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem, InvoiceDetails } from '@/types/invoice';
import { toast } from 'sonner';

/**
 * Get invoice by ID with full details
 */
export const getInvoice = async (invoiceId: string): Promise<any> => {
  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        orders (
          *,
          profiles:user_id (*),
          payment_references (*),
          order_items (*)
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      throw new Error(`Erro ao buscar fatura: ${error.message}`);
    }

    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }

    return invoice;
  } catch (error) {
    console.error('Error in getInvoice:', error);
    throw error;
  }
};

/**
 * Get all invoices with pagination
 */
export const getAllInvoices = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    const { data: invoices, error, count } = await supabase
      .from('invoices')
      .select(`
        *,
        orders (
          profiles:user_id (name, email)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return {
      invoices: invoices || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: totalPages
      },
      success: true
    };
  } catch (error) {
    console.error('Error in getAllInvoices:', error);
    return {
      invoices: [],
      pagination: { total: 0, page, limit, pages: 0 },
      success: false,
      error
    };
  }
};

/**
 * Get invoices by user ID
 */
export const getUserInvoices = async (userId: string) => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        orders (
          profiles:user_id (name, email)
        )
      `)
      .eq('orders.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user invoices:', error);
      throw error;
    }

    return {
      invoices: invoices || [],
      success: true
    };
  } catch (error) {
    console.error('Error in getUserInvoices:', error);
    return {
      invoices: [],
      success: false,
      error
    };
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus = async (invoiceId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }

    return { invoice: data, success: true };
  } catch (error) {
    console.error('Error in updateInvoiceStatus:', error);
    return { invoice: null, success: false, error };
  }
};

/**
 * Create new invoice
 */
export const createInvoice = async (invoiceData: any) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }

    return { invoice: data, success: true };
  } catch (error) {
    console.error('Error in createInvoice:', error);
    return { invoice: null, success: false, error };
  }
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (invoiceId: string) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteInvoice:', error);
    return { success: false, error };
  }
};

/**
 * Get invoice by share token
 */
export const getInvoiceByShareToken = async (token: string) => {
  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        orders (
          *,
          profiles:user_id (*),
          order_items (*)
        )
      `)
      .eq('share_token', token)
      .single();

    if (error) {
      console.error('Error fetching invoice by token:', error);
      throw error;
    }

    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }

    return invoice;
  } catch (error) {
    console.error('Error in getInvoiceByShareToken:', error);
    throw error;
  }
};

/**
 * Process invoice for order - simplified version
 */
export const processInvoiceForOrder = async (orderId: string) => {
  try {
    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (existingInvoice) {
      return { invoice: existingInvoice, pdfUrl: existingInvoice.pdf_url };
    }

    // Create new invoice with 'pending' status instead of 'issued'
    const invoiceData = {
      order_id: orderId,
      invoice_number: `INV-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (error) throw error;

    return { invoice: newInvoice, pdfUrl: newInvoice?.pdf_url };
  } catch (error) {
    console.error('Error processing invoice for order:', error);
    throw error;
  }
};

// Export InvoiceService object for backward compatibility
export const InvoiceService = {
  getInvoice,
  getAllInvoices,
  getUserInvoices,
  updateInvoiceStatus,
  createInvoice,
  deleteInvoice,
  getInvoiceByShareToken,
  processInvoiceForOrder,
  
  // Alias methods for consistency
  listInvoices: getAllInvoices,
  updateInvoice: async (invoiceId: string, data: any) => {
    const { error } = await supabase
      .from('invoices')
      .update(data)
      .eq('id', invoiceId);
    
    if (error) throw error;
    return { success: true };
  }
};

// Export as lowercase for consistency with some imports
export const invoiceService = InvoiceService;

// Default export
export default InvoiceService;
