
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function isValidOrder(order: any): order is {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  user_id?: string;
} {
  return (
    !!order &&
    typeof order === 'object' &&
    typeof order.id === 'string' &&
    typeof order.created_at === 'string' &&
    typeof order.status === 'string' &&
    typeof order.total_amount === 'number'
  );
}

interface DomainOrder {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  user_id?: string;
  profiles?: {
    name: string;
    email: string;
    company_name?: string;
  } | null;
  order_items: {
    id: string;
    name?: string;
    quantity: number;
    unit_price: number;
    start_date?: string;
    end_date?: string;
  }[];
}

export const useDomainOrders = (userId?: string, includeUserData = false) => {
  const [orders, setOrders] = useState<DomainOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDomainOrders = async () => {
    try {
      setLoading(true);

      let baseQuery = supabase
        .from('orders')
        .select(includeUserData ? 'id,created_at,status,total_amount,user_id' : 'id,created_at,status,total_amount')
        .in('status', ['pending', 'paid', 'processing'])
        .order('created_at', { ascending: false });

      if (userId) {
        baseQuery = baseQuery.eq('user_id', userId);
      }

      const { data: ordersDataOrig, error: ordersError } = await baseQuery;

      if (ordersError) {
        console.error('Supabase orders query error:', ordersError);
        throw ordersError;
      }

      let filteredOrdersData: any[] = [];
      if (Array.isArray(ordersDataOrig)) {
        filteredOrdersData = ordersDataOrig.filter(isValidOrder);
      }

      const orderIds: string[] = filteredOrdersData.length > 0
        ? filteredOrdersData.map((order) => order.id)
        : [];

      let orderItemsData: any[] = [];
      if (orderIds.length > 0) {
        // Use correct column names from order_items table
        const { data, error } = await supabase
          .from('order_items')
          .select('id,order_id,name,quantity,unit_price,start_date,end_date')
          .in('order_id', orderIds);

        if (error) {
          console.error('Supabase order items query error:', error);
          throw error;
        }
        orderItemsData = Array.isArray(data) ? data : [];
      }

      const ordersWithItems: DomainOrder[] = filteredOrdersData.map((order) => {
        if (!order || typeof order !== 'object') return null;
        const items = orderItemsData.filter(
          (item: any) =>
            item &&
            typeof item === 'object' &&
            'order_id' in item &&
            item.order_id === order.id
        );
        return {
          ...order,
          order_items: items,
        };
      }).filter((order): order is DomainOrder => !!order && typeof order === 'object');

      // Filter domain orders by checking both name and product_name fields
      const domainOrders = ordersWithItems.filter(order =>
        Array.isArray(order.order_items) &&
        order.order_items.some(item => {
          if (!item) return false;
          // Check name field (case-insensitive)
          const itemName = (item.name || '').toLowerCase();
          return (
            itemName.includes('dominio') ||
            itemName.includes('domain')
          );
        })
      );

      console.log('Domain orders found:', domainOrders);

      if (includeUserData && domainOrders.length > 0) {
        const ordersWithProfiles = await Promise.all(
          domainOrders.map(async (order) => {
            if (!order || !order.user_id) return order;
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, email, company_name')
              .eq('id', order.user_id)
              .single();
            return {
              ...order,
              profiles: profileData
            };
          })
        );
        setOrders(ordersWithProfiles as DomainOrder[]);
      } else {
        setOrders(domainOrders);
      }
    } catch (error) {
      console.error('Error loading domain orders:', error);
      toast.error('Erro ao carregar pedidos de domínios');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomainOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { orders, loading, loadDomainOrders };
};
