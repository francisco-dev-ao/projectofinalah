import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ServiceStatus } from "@/types/service";

/**
 * Create services from an order with proper error handling
 * 
 * @param orderId Order ID
 * @param userId User ID
 * @returns Object containing success status
 */
export async function createServicesFromOrder(orderId: string, userId: string) {
  try {
    // Get order items for the order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    
    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      return { success: false, error: itemsError };
    }

    // If no order items, return early
    if (!orderItems || orderItems.length === 0) {
      return { success: true };
    }

    console.log("Creating services from order items:", orderItems);

    // Create services from order items
    for (const item of orderItems) {
      // Skip domain items (they are handled separately)
      if (item.name.toLowerCase().includes('domínio') || 
          item.name.toLowerCase().includes('domain')) {
        continue;
      }

      // Calculate service dates
      let startDate = new Date();
      let endDate: Date | null = null;

      if (item.duration && item.duration_unit) {
        endDate = new Date(startDate);
        
        if (item.duration_unit === 'day') {
          endDate.setDate(endDate.getDate() + item.duration);
        } else if (item.duration_unit === 'month') {
          endDate.setMonth(endDate.getMonth() + item.duration);
        } else if (item.duration_unit === 'year') {
          endDate.setFullYear(endDate.getFullYear() + item.duration);
        }
      }

      // Create service data without problematic foreign keys
      const serviceData: any = {
        user_id: userId,
        order_item_id: item.id,
        name: item.name,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate ? endDate.toISOString() : null,
        auto_renew: false
      };

      // Only add product_id if it exists and is valid
      if (item.product_id) {
        const { data: productExists } = await supabase
          .from('products')
          .select('id')
          .eq('id', item.product_id)
          .single();
          
        if (productExists) {
          serviceData.product_id = item.product_id;
        }
      }

      const { data: service, error: serviceError } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();
      
      if (serviceError) {
        console.error("Error creating service:", serviceError);
        // Continue creating other services even if one fails
      } else {
        console.log("Service created successfully:", service);
      }
    }
    
    toast.success("Serviços criados com sucesso!");
    return { success: true };
  } catch (error) {
    console.error("Error in createServicesFromOrder:", error);
    toast.error("Erro ao criar serviços. Entre em contato com o suporte.");
    return { success: false, error };
  }
}

/**
 * Determina se um serviço é do tipo domínio com base em seu nome ou metadados
 * @param service Objeto de serviço
 * @returns Booleano indicando se o serviço é um domínio
 */
export function isDomainService(service: any): boolean {
  // Verificar pelo nome do serviço - nomes que contêm "domínio" ou "domain"
  if (service.name && (
    service.name.toLowerCase().includes('domínio') || 
    service.name.toLowerCase().includes('domain')
  )) {
    return true;
  }

  // Verificar pela existência de um TLD ou domain_name nos dados do serviço
  if (service.config) {
    if (service.config.tld || service.config.domain_name) {
      return true;
    }
  }

  // Verificar por um domain_id associado
  if (service.domain_id) {
    return true;
  }

  // Verificar se o nome tem formato de domínio (contém '.')
  if (service.name && service.name.includes('.')) {
    // Verificar se a parte após o ponto parece ser um TLD
    const parts = service.name.split('.');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1].toLowerCase();
      // Verificar TLDs comuns
      const commonTlds = ['ao', 'com', 'net', 'org', 'info', 'co'];
      if (commonTlds.includes(lastPart) || 
          (parts.length > 2 && lastPart === 'ao' && commonTlds.includes(parts[parts.length - 2].toLowerCase()))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Determina se um item de pedido é relacionado a serviços (hospedagem/email)
 * @param orderItem Item do pedido
 * @returns Booleano indicando se é um serviço
 */
export function isServiceOrder(orderItem: any): boolean {
  if (!orderItem.name) return false;
  
  const name = orderItem.name.toLowerCase();
  
  // Verificar se é hospedagem
  if (name.includes('hospedagem') || name.includes('hosting') || name.includes('shared')) {
    return true;
  }
  
  // Verificar se é email
  if (name.includes('email') || name.includes('e-mail') || name.includes('exchange')) {
    return true;
  }
  
  // Verificar outros tipos de serviços
  if (name.includes('ssl') || name.includes('certificado') || name.includes('backup')) {
    return true;
  }
  
  return false;
}

/**
 * Get services and service-related orders for a user
 * 
 * @param userId User ID
 * @param options Opções de filtro (tipo e status)
 * @returns Object containing services, orders and success status
 */
export async function getUserServices(
  userId: string, 
  options?: { 
    excludeDomains?: boolean, 
    status?: ServiceStatus[] | 'all'
  }
) {
  try {
    // Buscar serviços existentes
    let servicesQuery = supabase
      .from('services')
      .select(`
        *,
        products:product_id(*),
        order_items:order_item_id(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    const { data: services, error: servicesError } = await servicesQuery;
    
    if (servicesError) {
      console.error("Error fetching user services:", servicesError);
    }

    // Buscar orders com itens relacionados a serviços
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        payments(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error("Error fetching user orders:", ordersError);
    }

    let filteredServices = services || [];
    let serviceOrders: any[] = [];
    
    // Aplicar filtro para excluir domínios se solicitado
    if (options?.excludeDomains) {
      filteredServices = filteredServices.filter(service => !isDomainService(service));
    }
    
    // Filtrar orders que têm itens de serviços
    if (orders) {
      serviceOrders = orders.filter(order => {
        if (!order.order_items || order.order_items.length === 0) return false;
        
        return order.order_items.some((item: any) => {
          // Não incluir domínios se excludeDomains for true
          if (options?.excludeDomains && isDomainService(item)) {
            return false;
          }
          
          return isServiceOrder(item);
        });
      }).map(order => ({
        ...order,
        // Filtrar apenas os itens que são serviços
        order_items: order.order_items.filter((item: any) => {
          if (options?.excludeDomains && isDomainService(item)) {
            return false;
          }
          return isServiceOrder(item);
        })
      }));
    }
    
    // Aplicar filtro de status se fornecido
    if (options?.status && options.status !== 'all') {
      filteredServices = filteredServices.filter(service => 
        Array.isArray(options.status) && options.status.includes(service.status as ServiceStatus)
      );
      
      serviceOrders = serviceOrders.filter(order => 
        Array.isArray(options.status) && options.status.includes(order.status as ServiceStatus)
      );
    }
    
    return { 
      services: filteredServices, 
      orders: serviceOrders, 
      success: true 
    };
  } catch (error) {
    console.error("Error in getUserServices:", error);
    return { services: [], orders: [], success: false, error };
  }
}

/**
 * Update service status
 * 
 * @param serviceId Service ID
 * @param status New status
 * @returns Object containing success status
 */
export async function updateServiceStatus(serviceId: string, status: string) {
  try {
    const { error } = await supabase
      .from('services')
      .update({ status })
      .eq('id', serviceId);
    
    if (error) {
      console.error("Error updating service status:", error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in updateServiceStatus:", error);
    return { success: false, error };
  }
}

/**
 * Toggle service auto-renew
 * 
 * @param serviceId Service ID
 * @param autoRenew New auto-renew value
 * @returns Object containing success status
 */
export async function toggleServiceAutoRenew(serviceId: string, autoRenew: boolean) {
  try {
    const { error } = await supabase
      .from('services')
      .update({ auto_renew: autoRenew })
      .eq('id', serviceId);
    
    if (error) {
      console.error("Error toggling service auto-renew:", error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in toggleServiceAutoRenew:", error);
    return { success: false, error };
  }
}
