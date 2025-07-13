
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRole, AdminUser } from '@/types/admin-auth';
import { hasPermission, Permission, Resource } from '@/services/permissions-service';
import { AuditLogService } from '@/services/audit-log-service';

type AdminRole = UserRole;

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AdminRole;
  hasPermission: (resource: Resource, requiredPermission: Permission) => boolean;
  addAuditLogEntry: (action: string, details?: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  role: 'cliente',
  hasPermission: () => false,
  addAuditLogEntry: async () => {},
  handleLogout: async () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AdminRole>('cliente');

  // Check if the user's role is admin
  const isAdmin = role === 'admin';
  const isSuperAdmin = false;
  
  // Function to check if user has a specific permission
  const checkPermission = (resource: Resource, requiredPermission: Permission): boolean => {
    if (!user) return false;
    
    // Admins have access to everything
    if (role === 'admin') return true;
    
    return hasPermission(role, resource, requiredPermission);
  };

  // Handle logout
  const handleLogout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erro ao sair da conta');
    }
  };

  // Adds an audit log entry
  const addAuditLogEntry = async (action: string, details?: string): Promise<void> => {
    if (!user) return;

    try {
      await AuditLogService.createAuditLog({
        user_id: user.id,
        action,
        details: details || ''
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  };

  // Load session and profile data
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!session || !session.user) {
          setUser(null);
          return;
        }
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          throw profileError;
        }
        
        // Get user role
        const userRole = profile?.role as AdminRole || 'cliente';
        setRole(userRole);
        
        // Set the user object
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: profile?.name || session.user.email?.split('@')[0] || 'User',
          role: userRole
        });
        
      } catch (error: any) {
        console.error('Error loading admin auth context:', error);
        toast.error(`Erro ao carregar perfil: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial load
    loadSession();
    
    // Setup auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole('cliente');
        } else if (session && event === 'SIGNED_IN') {
          loadSession();
        }
      }
    );
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);
  
  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isSuperAdmin,
        role,
        hasPermission: checkPermission,
        addAuditLogEntry,
        handleLogout
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
