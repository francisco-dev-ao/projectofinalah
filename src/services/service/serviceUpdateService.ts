
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ServiceStatus } from "@/types/service";

// Update service status
export const updateServiceStatus = async (serviceId: string, status: ServiceStatus) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating service status:', error);
      toast.error('Falha ao atualizar status do serviço');
      return { success: false };
    }

    toast.success('Status do serviço atualizado com sucesso');
    return { success: true, service: data };
  } catch (error) {
    console.error('Error updating service status:', error);
    toast.error('Erro ao atualizar status do serviço');
    return { success: false };
  }
};

// Delete service
export const deleteService = async (serviceId: string) => {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      console.error('Error deleting service:', error);
      toast.error('Falha ao excluir serviço');
      return { success: false };
    }

    toast.success('Serviço excluído com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Error deleting service:', error);
    toast.error('Erro ao excluir serviço');
    return { success: false };
  }
};
