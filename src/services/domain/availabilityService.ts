
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if a domain is available for registration
 * @param domainName Domain name to check
 * @returns Boolean indicating if domain is available
 */
export const checkDomainAvailability = async (domainName: string): Promise<boolean> => {
  try {
    // Simplified mock check (in production, this would call a domain registry API)
    const { data, error } = await supabase
      .from('domains')
      .select('domain_name')
      .ilike('domain_name', domainName)
      .limit(1);
    
    if (error) {
      console.error('Error checking domain availability:', error);
      return false;
    }
    
    return data.length === 0; // If no domain found, it's available
  } catch (error) {
    console.error('Error in checkDomainAvailability:', error);
    return false;
  }
};
