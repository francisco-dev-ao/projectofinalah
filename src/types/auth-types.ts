
import { Session } from '@supabase/supabase-js';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string, nif: string, company_name?: string, address?: string) => Promise<{ error: any | null }>;
  updateUser: (updates: any) => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
  isLoading: boolean;
  profile: any;
  isAdmin: () => boolean;
  isSupport: () => boolean;
}

export interface UserProfile {
  id: string;
  name?: string;
  role?: 'admin' | 'suporte' | 'cliente' | 'super_admin';
  nif?: string;
  company_name?: string;
  phone?: string;
  address?: string;
  phone_invoice?: string;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
