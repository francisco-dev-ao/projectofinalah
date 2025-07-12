
import { supabase } from "@/integrations/supabase/client";

interface CreateAuditLogParams {
  user_id: string;
  action: string;
  details?: string;
}

export const createAuditLog = async (
  user_id: string, 
  action: string, 
  details?: string
) => {
  return AuditLogService.createAuditLog({ user_id, action, details });
};

export const AuditLogService = {
  createAuditLog: async (params: CreateAuditLogParams) => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: params.user_id,
          action: params.action,
          details: params.details || '',
        });

      if (error) {
        console.error('Error creating audit log:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating audit log:', error);
      return { success: false, error };
    }
  },

  fetchAuditLogs: async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id(name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit logs:', error);
        return { success: false, error };
      }

      return { success: true, logs: data };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { success: false, error };
    }
  }
};

export const fetchAuditLogs = AuditLogService.fetchAuditLogs;
