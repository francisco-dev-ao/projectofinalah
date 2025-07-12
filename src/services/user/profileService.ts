import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/admin-auth";

export const getUserProfile = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return { success: false, error };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { success: false, error };
  }
};

export const updateUserProfile = async (userId: string, profileData: {
  name?: string;
  phone?: string;
  address?: string;
  role?: UserRole;
  company_name?: string;
  nif?: string;
  phone_invoice?: string;
  city?: string;
  postal_code?: string;
}) => {
  try {
    // Make a copy of the data to avoid modifying the input
    const data = { ...profileData };
    
    console.log('Updating profile with data:', data);
    
    // Convert role if necessary - ensure we're using types compatible with the database
    if (data.role && data.role === 'suporte') {
      // No need to convert 'suporte' as it's already a valid UserRole
    }
    
    // The database expects only specific role values, so we need to ensure compatibility
    // by using the 'as any' cast to bypass TypeScript's strict checking here
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(data as any)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }

    console.log('Profile updated successfully:', profile);
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
};

export const updateFiscalData = async (userId: string, fiscalData: {
  company_name?: string;
  nif?: string;
  address?: string;
  phone_invoice?: string;
  city?: string;
  postal_code?: string;
}) => {
  try {
    console.log('Updating fiscal data:', fiscalData);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(fiscalData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating fiscal data:', error);
      return { success: false, error };
    }

    console.log('Fiscal data updated successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error updating fiscal data:', error);
    return { success: false, error };
  }
};

export const getAllUserProfiles = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');
  
      if (error) {
        console.error('Error fetching all profiles:', error);
        return { success: false, error };
      }
  
      return { success: true, profiles };
    } catch (error) {
      console.error('Error fetching all profiles:', error);
      return { success: false, error };
    }
  };

export const createUserProfileWithRole = async (userId: string, profileData: {
  name: string;
  email?: string;
  role?: UserRole;
}) => {
  try {
    // Prepare data and handle role mapping
    const data = { 
      id: userId,
      name: profileData.name,
      // Using the correct UserRole type - no need to convert 'suporte' since it's already valid
      role: profileData.role || 'cliente' as UserRole
    };

    // Use 'as any' to bypass TypeScript's strict checking during insert
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert([data as any])
      .select();

    if (error) {
      console.error('Error creating profile:', error);
      return { success: false, error };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Error creating profile:', error);
    return { success: false, error };
  }
};
