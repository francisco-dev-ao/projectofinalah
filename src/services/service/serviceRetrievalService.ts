
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Get all services (for admin)
export const getServices = async () => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        profiles:user_id(id, name, email),
        order_items:order_item_id(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      toast.error('Falha ao carregar serviços');
      return { success: false, services: [] };
    }

    return { success: true, services: data };
  } catch (error) {
    console.error('Error fetching services:', error);
    toast.error('Erro ao carregar serviços');
    return { success: false, services: [] };
  }
};

// Get user services
export const getUserServices = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user services:', error);
      toast.error('Falha ao carregar serviços');
      return { success: false, services: [] };
    }

    return { success: true, services: data };
  } catch (error) {
    console.error('Error fetching user services:', error);
    toast.error('Erro ao carregar serviços');
    return { success: false, services: [] };
  }
};

// Get a specific service
export const getService = async (serviceId: string) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        profiles:user_id(id, name, email),
        order_items:order_item_id(*)
      `)
      .eq('id', serviceId)
      .single();

    if (error) {
      console.error('Error fetching service:', error);
      toast.error('Falha ao carregar serviço');
      return { success: false, service: null };
    }

    return { success: true, service: data };
  } catch (error) {
    console.error('Error fetching service:', error);
    toast.error('Erro ao carregar serviço');
    return { success: false, service: null };
  }
};

// Alias for getServices to maintain compatibility with existing code
export const getAllServices = getServices;
