import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserRole, AdminUser } from "@/types/admin-auth";

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export const createUser = async (userData: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: userData
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateUser = async (userId: string, userData: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-update-user', {
      body: { userId, userData }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
