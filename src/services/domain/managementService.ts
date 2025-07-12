
import { supabase } from "@/integrations/supabase/client";
import { Domain, DomainStatus } from './types';

/**
 * Update domain nameservers
 * @param domainId Domain ID
 * @param nameservers Array of nameserver strings
 * @param userId User ID for authorization
 * @returns Boolean indicating success
 */
export const updateDomainNameservers = async (
  domainId: string, 
  nameservers: string[],
  userId?: string
): Promise<boolean> => {
  try {
    let query = supabase
      .from('domains')
      .update({ nameservers })
      .eq('id', domainId);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error updating nameservers:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateDomainNameservers:', error);
    return false;
  }
};

/**
 * Set domain auto-renew preference
 * @param domainId Domain ID
 * @param autoRenew Boolean indicating if auto-renew should be enabled
 * @param userId User ID for authorization
 * @returns Boolean indicating success
 */
export const setDomainAutoRenew = async (
  domainId: string, 
  autoRenew: boolean,
  userId?: string
): Promise<boolean> => {
  try {
    let query = supabase
      .from('domains')
      .update({ auto_renew: autoRenew })
      .eq('id', domainId);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error updating auto-renew:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in setDomainAutoRenew:', error);
    return false;
  }
};

/**
 * Update domain status
 * @param domainId Domain ID
 * @param status New domain status (must be one of the valid statuses)
 * @returns Boolean indicating success
 */
export const updateDomainStatus = async (
  domainId: string, 
  status: DomainStatus
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('domains')
      .update({ status })
      .eq('id', domainId);
    
    if (error) {
      console.error('Error updating domain status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateDomainStatus:', error);
    return false;
  }
};

/**
 * Lock or unlock domain for transfer
 * @param domainId Domain ID
 * @param isLocked Boolean indicating if domain should be locked
 * @param userId User ID for authorization
 * @returns Boolean indicating success
 */
export const setDomainLock = async (
  domainId: string, 
  isLocked: boolean,
  userId?: string
): Promise<boolean> => {
  try {
    let query = supabase
      .from('domains')
      .update({ is_locked: isLocked })
      .eq('id', domainId);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error updating domain lock:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in setDomainLock:', error);
    return false;
  }
};
