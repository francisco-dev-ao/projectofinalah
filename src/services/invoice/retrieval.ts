
import { supabase } from '@/integrations/supabase/client';

// Get invoice by ID
export const getInvoiceById = async (invoiceId: string) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        orders:order_id (
          *,
          order_items(*),
          payment_references(*),
          profiles:user_id(*)
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getInvoiceById:', error);
    return { data: null, error };
  }
};

// Get invoice by order ID
export const getInvoiceByOrderId = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get invoices by user ID
export const getInvoicesByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        orders:order_id (
          *,
          user_id
        )
      `)
      .eq('orders.user_id', userId);

    if (error) {
      console.error('Error fetching user invoices:', error);
      return { invoices: [], error, success: false };
    }

    return { invoices: data || [], error: null, success: true };
  } catch (error) {
    console.error('Error in getInvoicesByUserId:', error);
    return { invoices: [], error, success: false };
  }
};

// Get invoice by public token
export const getInvoiceByPublicToken = async (token: string) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('public_token', token)
      .single();

    if (error) {
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get all invoices
export const getAllInvoices = async (
  page = 1,
  limit = 10,
  filters: Record<string, any> = {}
) => {
  try {
    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;

    // Create a query builder
    let query = supabase
      .from('invoices')
      .select('*, orders:order_id(*, profiles:user_id(*))', { count: 'exact' });

    // Apply filters if any
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (key === 'status') {
            query = query.eq(key, value);
          } else if (key === 'client_name' && typeof value === 'string') {
            query = query.ilike('orders.profiles.name', `%${value}%`);
          } else if (key === 'invoice_number' && typeof value === 'string') {
            query = query.ilike('invoice_number', `%${value}%`);
          } else if (key === 'date_range' && Array.isArray(value) && value.length === 2) {
            query = query.gte('created_at', value[0]).lte('created_at', value[1]);
          }
        }
      });
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      count: count || 0,
      error: null
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return {
      data: [],
      count: 0,
      error
    };
  }
};
