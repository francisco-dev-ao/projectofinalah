
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Ensures a user profile exists in the database
 * If not, creates one using available user data
 * @param userId User ID to check/create profile for
 * @returns Boolean indicating if profile exists or was created successfully
 */
export const ensureUserProfile = async (userId: string): Promise<boolean> => {
  if (!userId) return false;

  try {
    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // If no profile found or there was an error, create the profile
    if (!existingProfile || profileError) {
      console.log("User profile not found, creating one...");
      
      // Get user metadata
      const { data: { user: authUser }, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError) {
        console.error("Error getting user details:", getUserError);
        toast.error("Erro ao obter detalhes do usuário");
        return false;
      }
      
      // Create a profile for the user with only fields that exist in the profiles table
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: authUser?.user_metadata?.name || `User ${userId.substring(0, 8)}`,
          role: 'cliente' as 'admin' | 'suporte' | 'cliente',
          nif: authUser?.user_metadata?.nif,
          company_name: authUser?.user_metadata?.company_name,
          phone: authUser?.user_metadata?.phone,
          address: authUser?.user_metadata?.address
        });
      
      if (createProfileError) {
        console.error("Error creating user profile:", createProfileError);
        toast.error("Erro ao criar perfil de usuário");
        return false;
      }
      
      console.log("Profile created successfully");
    }
    
    return true;
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    toast.error("Erro ao verificar perfil de usuário");
    return false;
  }
};
