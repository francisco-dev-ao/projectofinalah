
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/auth-types';

export const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
        
    if (error) {
      console.error('Error loading user profile:', error);
      
      // If profile doesn't exist, create one
      if (error.code === 'PGRST116') {
        console.log("Creating new user profile as it doesn't exist");
        
        // Get user details
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const newProfile = {
            id: userId,
            name: authUser.user_metadata?.name || `User ${userId.substring(0, 8)}`,
            role: 'cliente' as 'admin' | 'suporte' | 'cliente',
            // Only include fields that exist in the profiles table
            nif: authUser.user_metadata?.nif || null,
            company_name: authUser.user_metadata?.company_name || null,
            phone: authUser.user_metadata?.phone || null,
            address: authUser.user_metadata?.address || null
          };
          
          const { error: createError } = await supabase
            .from('profiles')
            .insert(newProfile);
          
          if (createError) {
            console.error('Error creating user profile:', createError);
            toast.error('Erro ao criar perfil de usuário');
            return null;
          } else {
            console.log('Profile created successfully');
            return newProfile;
          }
        }
      }
      return null;
    } else {
      console.log('Profile loaded successfully:', data);
      return data;
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
};
