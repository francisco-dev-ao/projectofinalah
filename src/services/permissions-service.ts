
/**
 * Supabase integration for checking user permissions
 */
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/admin-auth";

export type Resource = 'tickets' | 'services' | 'domains' | 'invoices' | 'orders' | 'profiles' | 'users' | 'audit_logs';
export type Permission = 'read' | 'write' | 'delete' | '*';

/**
 * Check if a user has permission to access a resource
 */
export const checkPermission = async (userId: string, resource: Resource, action: Permission = 'read'): Promise<boolean> => {
  // If no user ID provided
  if (!userId) return false;

  try {
    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error checking user role:', userError);
      return false;
    }

    const role = userData.role as UserRole;


    // Regular admins have all permissions except some restricted actions
    if (role === 'admin') {
      // Admin can do everything except certain actions
      return true;
    }

    // Allow access to specific resources based on role
    if (role === 'cliente') {
      // Clients can only access certain resources
      if (['tickets', 'services', 'domains', 'invoices', 'orders'].includes(resource)) {
        if (action === 'read') return true;
        if (resource === 'tickets' && action === 'write') return true;
      }
    }

    if (role === 'suporte') {
      // Support can access customer resources (for helping customers)
      if (['tickets', 'services', 'domains', 'profiles'].includes(resource)) {
        return true; // Support can both read and write these resources
      }
      // Support can only view invoices and orders, but not modify them
      if (['invoices', 'orders'].includes(resource) && action === 'read') {
        return true;
      }
    }

    // For all other cases, check explicit permissions
    // This is where you might want to check a permissions table if you have one

    return false;
  } catch (err) {
    console.error('Error checking permissions:', err);
    return false;
  }
};

/**
 * Check if a user role has a specific permission for a resource
 */
export const hasPermission = (role: UserRole, resource: Resource, requiredPermission: Permission): boolean => {

  // Admins have all permissions
  if (role === 'admin') {
    return true;
  }

  // Role-based permissions
  switch (role) {
    case 'cliente':
      // Clients can only access certain resources
      if (['tickets', 'services', 'domains', 'invoices', 'orders'].includes(resource)) {
        if (requiredPermission === 'read') return true;
        if (resource === 'tickets' && requiredPermission === 'write') return true;
      }
      return false;
      
    case 'suporte':
      // Support can access customer resources (for helping customers)
      if (['tickets', 'services', 'domains', 'profiles'].includes(resource)) {
        return true; // Support can read and write these resources
      }
      // Support can only view invoices and orders, but not modify them
      if (['invoices', 'orders'].includes(resource) && requiredPermission === 'read') {
        return true;
      }
      return false;
      
      
    default:
      return false;
  }
};

/**
 * Get user permissions based on their role
 */
export const getUserPermissions = async (userId: string): Promise<string[]> => {
  if (!userId) return [];

  try {
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError);
      return [];
    }

    const permissions: string[] = [];
    const role = userData.role as UserRole;

    
    if (role === 'admin') {
      return ['*:*']; // Admin has all permissions
    }

    if (role === 'cliente') {
      permissions.push('tickets:read', 'tickets:write');
      permissions.push('services:read');
      permissions.push('domains:read');
      permissions.push('invoices:read');
      permissions.push('orders:read');
      permissions.push('profiles:read:own', 'profiles:write:own');
    }

    if (role === 'suporte') {
      permissions.push('tickets:*');
      permissions.push('services:*');
      permissions.push('domains:*');
      permissions.push('profiles:read');
      permissions.push('invoices:read');
      permissions.push('orders:read');
    }

    return permissions;
  } catch (err) {
    console.error('Error getting user permissions:', err);
    return [];
  }
};
