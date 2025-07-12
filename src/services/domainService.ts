
import { supabase } from '@/integrations/supabase/client';
import { generateProductId } from '@/utils/product/productIdValidator';
import { v4 as uuidv4 } from 'uuid';

// Types for domain status
type DomainStatus = 'active' | 'pending' | 'expired' | 'transferred';

// Function to create a new domain
export const createDomain = async (domainData: {
  domain_name: string;
  tld: string;
  user_id: string;
  order_id?: string;
  registration_date?: string;
  expiration_date?: string;
  status?: DomainStatus;
  is_locked?: boolean;
  auto_renew?: boolean;
  nameservers?: string[];
  auth_code?: string;
}) => {
  try {
    const domain = {
      ...domainData,
      id: uuidv4(),
      status: domainData.status || 'pending',
      is_locked: domainData.is_locked || false,
      auto_renew: domainData.auto_renew || true,
      nameservers: domainData.nameservers || []
    };
    
    const { data, error } = await supabase
      .from('domains')
      .insert(domain)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating domain:', error);
      return { success: false, error };
    }
    
    return { success: true, domain: data };
  } catch (error) {
    console.error('Error in createDomain:', error);
    return { success: false, error };
  }
};

// Function to get domains by user ID
export const getDomainsByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching domains:', error);
      return { success: false, error };
    }
    
    return { success: true, domains: data };
  } catch (error) {
    console.error('Error in getDomainsByUserId:', error);
    return { success: false, error };
  }
};

// Function to get a single domain by ID
export const getDomainById = async (domainId: string) => {
  try {
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('id', domainId)
      .single();
    
    if (error) {
      console.error('Error fetching domain:', error);
      return { success: false, error };
    }
    
    return { success: true, domain: data };
  } catch (error) {
    console.error('Error in getDomainById:', error);
    return { success: false, error };
  }
};

// Function to update a domain
export const updateDomain = async (domainId: string, updateData: {
  domain_name?: string;
  tld?: string;
  status?: DomainStatus;
  auto_renew?: boolean;
  is_locked?: boolean;
  nameservers?: string[];
  registration_date?: string;
  expiration_date?: string;
  auth_code?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('domains')
      .update(updateData)
      .eq('id', domainId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating domain:', error);
      return { success: false, error };
    }
    
    return { success: true, domain: data };
  } catch (error) {
    console.error('Error in updateDomain:', error);
    return { success: false, error };
  }
};

// Function to delete a domain
export const deleteDomain = async (domainId: string) => {
  try {
    const { error } = await supabase
      .from('domains')
      .delete()
      .eq('id', domainId);
    
    if (error) {
      console.error('Error deleting domain:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteDomain:', error);
    return { success: false, error };
  }
};

// Function to get all domains (admin)
export const getAllDomains = async () => {
  try {
    const { data, error } = await supabase
      .from('domains')
      .select(`
        *,
        profiles (
          name,
          email,
          company_name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all domains:', error);
      return { success: false, error };
    }
    
    return { success: true, domains: data };
  } catch (error) {
    console.error('Error in getAllDomains:', error);
    return { success: false, error };
  }
};
