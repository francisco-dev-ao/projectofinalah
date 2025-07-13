
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/auth-types';
import { loadUserProfile } from '@/utils/auth-utils';

export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setSession(session);
      setIsAuthenticated(event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED');
      setUser(session?.user || null);
      
      if (session?.user) {
        // Use setTimeout to avoid potential deadlocks in auth callbacks
        setTimeout(() => {
          handleProfileLoad(session.user!.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    // Then load the session
    const loadSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setSession(session);
          setIsAuthenticated(true);
          setUser(session.user);
          
          // Load user profile
          if (session.user) {
            await handleProfileLoad(session.user.id);
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleProfileLoad = async (userId: string) => {
    const profileData = await loadUserProfile(userId);
    if (profileData) {
      setProfile(profileData);
    }
    setIsLoading(false);
  };

  const signIn = async (email: string, password: string): Promise<{ error: any | null }> => {
    setIsLoading(true);
    try {
      console.log("Attempting to sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Login error:", error);
        toast.error(`Erro ao fazer login: ${error.message}`);
        return { error };
      } else {
        return { error: null };
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Saiu da sua conta!');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string, nif: string, company_name?: string, address?: string): Promise<{ error: any | null }> => {
    console.log('useAuthState: signUp chamado com:', { email, name, phone, nif, company_name, address });
    setIsLoading(true);
    try {
      console.log('useAuthState: Chamando supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            nif,
            company_name,
            address,
          },
        },
      });

      console.log('useAuthState: Resultado do supabase.auth.signUp:', { data, error });

      if (error) {
        console.error('useAuthState: Erro no signUp:', error);
        toast.error(`Erro ao registrar: ${error.message}`);
        return { error };
      } else {
        console.log('useAuthState: SignUp bem-sucedido!');
        
        // Enviar email de boas-vindas automaticamente
        try {
          console.log('Enviando email de boas-vindas para:', email);
          const { EmailService } = await import('@/services/emailService');
          
          const welcomeEmailResult = await EmailService.sendWelcomeEmail(
            email,
            name || 'Cliente'
          );
          
          if (welcomeEmailResult.success) {
            console.log('Email de boas-vindas enviado com sucesso');
          } else {
            console.error('Erro ao enviar email de boas-vindas:', welcomeEmailResult.error);
          }
        } catch (emailError) {
          console.error('Erro crítico ao enviar email de boas-vindas:', emailError);
          // Não falha o registro se o email falhar
        }
        
        toast.success('Conta criada! Verifique seu email para confirmar.');
        return { error: null };
      }
    } catch (error) {
      console.error('useAuthState: Erro durante sign up:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: any): Promise<void> => {
    setIsLoading(true);
    try {
      if (!user) return;
      
      // Identificar campos alterados
      const updatedFields: string[] = [];
      if (updates.name && updates.name !== profile?.name) updatedFields.push('Nome');
      if (updates.email && updates.email !== user.email) updatedFields.push('Email');
      if (updates.phone && updates.phone !== profile?.phone) updatedFields.push('Telefone');
      if (updates.company_name && updates.company_name !== profile?.company_name) updatedFields.push('Nome da Empresa');
      if (updates.address && updates.address !== profile?.address) updatedFields.push('Endereço');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        toast.error(`Erro ao atualizar perfil: ${error.message}`);
      } else {
        setProfile(data);
        toast.success('Perfil atualizado com sucesso!');
        
        // Enviar email de confirmação se houver campos alterados
        if (updatedFields.length > 0) {
          try {
            const { EmailAutomationService } = await import('@/services/emailAutomationService');
            await EmailAutomationService.triggerDataUpdateConfirmation(
              user.email!,
              data.name || user.email!,
              updatedFields
            );
            console.log('Email de confirmação de atualização enviado');
          } catch (emailError) {
            console.error('Erro ao enviar email de confirmação:', emailError);
            // Não falha a operação se o email falhar
          }
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateProfile = async (updates: any): Promise<void> => {
    return updateUser(updates);
  };
  
  const isAdmin = () => {
    return profile?.role === 'admin';
  };
  
  const isSupport = () => {
    return profile?.role === 'suporte' || profile?.role === 'admin';
  };

  return {
    isAuthenticated,
    user,
    session,
    profile,
    signIn,
    signOut,
    signUp,
    updateUser,
    updateProfile,
    isLoading,
    isAdmin,
    isSupport
  };
};
