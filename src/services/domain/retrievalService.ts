
import { supabase } from "@/integrations/supabase/client";
import { Domain, DomainResult, DomainsResult } from './types';

/**
 * Get all domains for a specific user
 * @param userId User ID
 * @returns Array of user domains
 */
export const getUserDomains = async (userId: string): Promise<DomainsResult> => {
  try {
    console.log('getUserDomains called with userId:', userId);
    
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    console.log('getUserDomains query result:', { data, error });
    
    if (error) {
      console.error('Error fetching user domains:', error);
      return { domains: [], error };
    }
    
    // Return all domains found - no filtering
    const domains = data || [];
    console.log('Total domains found for user:', domains.length);
    console.log('Domain details:', domains);
    
    return { domains: domains as Domain[], error: null };
  } catch (error) {
    console.error('Error in getUserDomains:', error);
    return { domains: [], error };
  }
};

/**
 * Get domain by ID
 * @param domainId Domain ID
 * @param userId User ID for authorization
 * @returns Domain object or null if not found
 */
export const getDomainById = async (domainId: string, userId?: string): Promise<DomainResult> => {
  try {
    let query = supabase
      .from('domains')
      .select('*')
      .eq('id', domainId);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      console.error('Error fetching domain:', error);
      return { domain: null, error };
    }
    
    return { domain: data as Domain, error: null };
  } catch (error) {
    console.error('Error in getDomainById:', error);
    return { domain: null, error };
  }
};
