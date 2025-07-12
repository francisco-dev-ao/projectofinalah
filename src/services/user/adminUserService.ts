
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserRole } from "@/types/admin-auth";

// Update or create a user by admin
export const updateUserByAdmin = async (userId: string, userData: {
  [key: string]: any;
  role?: UserRole;
  email?: string;
}): Promise<{ success: boolean; error?: any }> => {
  try {
    const updateData = { ...userData };
    if (userData.email) {
      updateData.email = userData.email;
    }
    const { error } = await supabase
      .from('profiles')
      .update(updateData as any)
      .eq('id', userId);
      
    if (error) {
      console.error("Error updating user:", error);
      toast.error("Erro ao atualizar usuário");
      return { success: false, error };
    }
    
    toast.success("Usuário atualizado com sucesso");
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    toast.error("Erro ao atualizar usuário");
    return { success: false, error };
  }
};

// Create a new user
export const createUser = async (email: string, password: string, userData: {
  name: string;
  role?: UserRole;
  [key: string]: any;
}): Promise<{ success: boolean; user?: any; error?: any }> => {
  try {
    // Create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error("Error creating user:", authError);
      toast.error("Erro ao criar usuário");
      return { success: false, error: authError };
    }

    // Update profile information
    if (authData.user) {
      const profileData = {
        id: authData.user.id,
        email: email,
        name: userData.name,
        role: userData.role || "cliente",
        ...userData
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([profileData as any]);
        
      if (profileError) {
        console.error("Error creating profile:", profileError);
        toast.error("Erro ao criar perfil do usuário");
        return { success: false, error: profileError };
      }

      return { success: true, user: authData.user };
    }
    
    return { success: false, error: "No user created" };
  } catch (error) {
    console.error("Error creating user:", error);
    toast.error("Erro ao criar usuário");
    return { success: false, error };
  }
};

export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return { success: false, error };
    }

    return { success: true, user: data };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error };
  }
};

export const getAllUsers = async () => {
  try {
    console.log('Fetching all users from profiles table...');
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        name,
        role,
        created_at,
        company_name,
        nif,
        phone,
        address
      `)
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      return { success: false, error: profileError };
    }

    console.log('Profiles fetched from database:', profiles);

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found in database');
      return { success: true, users: [] };
    }

    // Verificar se há emails vazios e buscar do auth se necessário
    const usersWithEmail = await Promise.all(
      profiles.map(async (profile) => {
        let email = profile.email;
        
        // Se não há email no profile, tentar buscar do auth
        if (!email && profile.id) {
          try {
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
            if (!authError && authUser.user) {
              email = authUser.user.email;
            }
          } catch (error) {
            console.log(`Could not fetch auth data for user ${profile.id}:`, error);
          }
        }
        
        return {
          ...profile,
          email: email || 'N/A'
        };
      })
    );

    console.log('Final users data:', usersWithEmail);
    
    return { success: true, users: usersWithEmail };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error };
  }
};

export const deleteUser = async (userId: string) => {
  try {
    console.log("Starting user deletion for ID:", userId);
    
    // Primeiro, deletar o perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error("Error deleting user profile:", profileError);
      // Continuar mesmo se houver erro no profile
    }

    // Deletar o usuário do auth usando admin
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error("Error deleting auth user:", authError);
      return { success: false, error: authError };
    }

    console.log("User deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error };
  }
};

// Update user role
export const updateUserRole = async (userId: string, role: UserRole): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: role as any })
      .eq('id', userId);
      
    if (error) {
      console.error("Error updating user role:", error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error };
  }
};

export const updateUser = async (userId: string, userData: {
  [key: string]: any;
  name?: string;
  role?: UserRole;
  email?: string;
}): Promise<{ success: boolean; error?: any }> => {
  try {
    const updateData = { ...userData };
    if (userData.email) {
      updateData.email = userData.email;
    }
    const { error } = await supabase
      .from('profiles')
      .update(updateData as any)
      .eq('id', userId);
      
    if (error) {
      console.error("Error updating user:", error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error };
  }
};
