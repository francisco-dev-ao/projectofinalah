
import { supabase } from "@/integrations/supabase/client";

export interface ContactProfile {
  id?: string;
  user_id: string;
  name: string;
  is_foreigner: boolean;
  nif: string;
  is_individual_company: boolean;
  domain_owner_name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  created_at?: string;
  updated_at?: string;
}

export const createContactProfile = async (profileData: Omit<ContactProfile, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('contact_profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error('Error creating contact profile:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating contact profile:', error);
    return { success: false, error };
  }
};

export const getUserContactProfiles = async (userId: string) => {
  try {
    console.log('contactProfileService: Buscando perfis de contato para usuário:', userId);
    
    const { data, error } = await supabase
      .from('contact_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact profiles:', error);
      return { success: false, error };
    }

    console.log('contactProfileService: Perfis encontrados:', data?.length || 0);
    
    // Filtrar perfis de exemplo
    const filteredProfiles = (data || []).filter(profile => {
      // Verificar se não é um perfil de exemplo
      if (profile.name && (
        profile.name.includes('EXAMPLE') || 
        profile.name.includes('DEMO') || 
        profile.name.includes('TEST') ||
        profile.name.includes('Exemplo') ||
        profile.name.includes('Demo') ||
        profile.name.includes('Teste')
      )) {
        console.log('contactProfileService: Perfil de exemplo detectado:', profile.name);
        return false;
      }
      
      // Verificar se não é um perfil com email de exemplo
      if (profile.email && (
        profile.email.includes('example.com') ||
        profile.email.includes('demo.com') ||
        profile.email.includes('test.com') ||
        profile.email.includes('exemplo.com')
      )) {
        console.log('contactProfileService: Perfil com email de exemplo detectado:', profile.email);
        return false;
      }
      
      // Verificar se não é um perfil com NIF de exemplo
      if (profile.nif && (
        profile.nif.includes('EXAMPLE') ||
        profile.nif.includes('DEMO') ||
        profile.nif.includes('TEST') ||
        profile.nif === '000000000' ||
        profile.nif === '123456789'
      )) {
        console.log('contactProfileService: Perfil com NIF de exemplo detectado:', profile.nif);
        return false;
      }
      
      return true;
    });
    
    console.log('contactProfileService: Perfis filtrados:', filteredProfiles.length);

    return { success: true, data: filteredProfiles };
  } catch (error) {
    console.error('Error fetching contact profiles:', error);
    return { success: false, error };
  }
};

export const updateContactProfile = async (profileId: string, profileData: Partial<ContactProfile>) => {
  try {
    const { data, error } = await supabase
      .from('contact_profiles')
      .update(profileData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact profile:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating contact profile:', error);
    return { success: false, error };
  }
};

export const deleteContactProfile = async (profileId: string) => {
  try {
    const { error } = await supabase
      .from('contact_profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      console.error('Error deleting contact profile:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting contact profile:', error);
    return { success: false, error };
  }
};

// Função para limpar dados de exemplo (apenas para administradores)
export const clearDemoContactProfiles = async () => {
  try {
    console.log('contactProfileService: Limpando perfis de contato de exemplo...');
    
    // Deletar perfis com nomes de exemplo
    const { error: nameError } = await supabase
      .from('contact_profiles')
      .delete()
      .or('name.ilike.%EXAMPLE%,name.ilike.%DEMO%,name.ilike.%TEST%,name.ilike.%Exemplo%,name.ilike.%Demo%,name.ilike.%Teste%');
    
    if (nameError) {
      console.error('contactProfileService: Erro ao deletar perfis com nomes de exemplo:', nameError);
    }
    
    // Deletar perfis com emails de exemplo
    const { error: emailError } = await supabase
      .from('contact_profiles')
      .delete()
      .or('email.ilike.%example.com%,email.ilike.%demo.com%,email.ilike.%test.com%,email.ilike.%exemplo.com%');
    
    if (emailError) {
      console.error('contactProfileService: Erro ao deletar perfis com emails de exemplo:', emailError);
    }
    
    // Deletar perfis com NIFs de exemplo
    const { error: nifError } = await supabase
      .from('contact_profiles')
      .delete()
      .or('nif.ilike.%EXAMPLE%,nif.ilike.%DEMO%,nif.ilike.%TEST%,nif.eq.000000000,nif.eq.123456789');
    
    if (nifError) {
      console.error('contactProfileService: Erro ao deletar perfis com NIFs de exemplo:', nifError);
    }
    
    console.log('contactProfileService: Limpeza de perfis de exemplo concluída');
    return { success: true };
  } catch (error) {
    console.error('contactProfileService: Erro ao limpar perfis de exemplo:', error);
    return { success: false, error };
  }
};

// Função para verificar e analisar perfis de contato (apenas para administradores)
export const analyzeContactProfiles = async () => {
  try {
    console.log('contactProfileService: Analisando perfis de contato...');
    
    const { data: allProfiles, error } = await supabase
      .from('contact_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('contactProfileService: Erro ao buscar todos os perfis:', error);
      return { success: false, error };
    }
    
    console.log('contactProfileService: Total de perfis no sistema:', allProfiles?.length || 0);
    
    // Analisar perfis
    const demoProfiles = allProfiles?.filter(profile => 
      profile.name && (
        profile.name.includes('EXAMPLE') || 
        profile.name.includes('DEMO') || 
        profile.name.includes('TEST') ||
        profile.name.includes('Exemplo') ||
        profile.name.includes('Demo') ||
        profile.name.includes('Teste')
      )
    ) || [];
    
    const demoEmails = allProfiles?.filter(profile => 
      profile.email && (
        profile.email.includes('example.com') ||
        profile.email.includes('demo.com') ||
        profile.email.includes('test.com') ||
        profile.email.includes('exemplo.com')
      )
    ) || [];
    
    const demoNIFs = allProfiles?.filter(profile => 
      profile.nif && (
        profile.nif.includes('EXAMPLE') ||
        profile.nif.includes('DEMO') ||
        profile.nif.includes('TEST') ||
        profile.nif === '000000000' ||
        profile.nif === '123456789'
      )
    ) || [];
    
    const analysis = {
      total: allProfiles?.length || 0,
      demoNames: demoProfiles.length,
      demoEmails: demoEmails.length,
      demoNIFs: demoNIFs.length,
      totalDemo: Math.max(demoProfiles.length, demoEmails.length, demoNIFs.length)
    };
    
    console.log('contactProfileService: Análise dos perfis:', analysis);
    
    return { success: true, data: analysis };
  } catch (error) {
    console.error('contactProfileService: Erro ao analisar perfis:', error);
    return { success: false, error };
  }
};
