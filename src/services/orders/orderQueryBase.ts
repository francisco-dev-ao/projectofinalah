
import { supabase } from '@/integrations/supabase/client';

// Export query base function
export const getOrderQueryBase = () => {
  return supabase
    .from('orders')
    .select(`
      *,
      profiles: user_id (*),
      services (*),
      order_items (*),
      payment_references (*),
      invoices (*)
    `);
};

// Helper functions that need to be exported
export const calculateOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

export const formatOrdersResult = (orders: any[], count: number | null, page: number, limit: number) => {
  const total = count || 0;
  const pages = Math.ceil(total / limit);
  
  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      pages
    },
    success: true
  };
};

export const handleOrderQueryError = (error: any, page: number, limit: number) => {
  console.error('Error in order query:', error);
  return {
    orders: [],
    pagination: {
      total: 0,
      page,
      limit,
      pages: 0
    },
    success: false
  };
};

export default getOrderQueryBase;
