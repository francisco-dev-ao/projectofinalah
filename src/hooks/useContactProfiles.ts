
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useAuthState } from "@/hooks/use-auth-state";
import { 
  createContactProfile, 
  getUserContactProfiles, 
  updateContactProfile,
  deleteContactProfile,
  ContactProfile 
} from "@/services/contactProfileService";

export interface ContactProfileForm {
  name: string;
  isForeigner: boolean;
  nif: string;
  isIndividualCompany: boolean;
  domainOwnerName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
}

export const useContactProfiles = () => {
  const { user } = useAuthState();
  const [contactProfiles, setContactProfiles] = useState<ContactProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadContactProfiles();
    }
  }, [user]);

  const loadContactProfiles = async () => {
    if (!user) return;
    
    console.log('useContactProfiles: Carregando perfis de contato para usuário:', user.id);
    setIsLoading(true);
    try {
      const result = await getUserContactProfiles(user.id);
      console.log('useContactProfiles: Resultado da busca:', result);
      
      if (result.success) {
        console.log('useContactProfiles: Perfis carregados com sucesso:', result.data?.length || 0);
        setContactProfiles(result.data || []);
      } else {
        console.error('useContactProfiles: Erro ao carregar perfis:', result.error);
        toast.error('Erro ao carregar perfis de contacto');
      }
    } catch (error) {
      console.error('Error loading contact profiles:', error);
      toast.error('Erro ao carregar perfis de contacto');
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (data: ContactProfileForm) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      const profileData = {
        user_id: user.id,
        name: data.name,
        is_foreigner: data.isForeigner,
        nif: data.nif,
        is_individual_company: data.isIndividualCompany,
        domain_owner_name: data.domainOwnerName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        country: data.country,
        state: data.state,
        city: data.city,
        postal_code: data.postalCode
      };

      const result = await createContactProfile(profileData);
      
      if (result.success) {
        await loadContactProfiles();
        toast.success('Perfil de contacto criado com sucesso!');
        return true;
      } else {
        toast.error('Erro ao criar perfil de contacto');
        return false;
      }
    } catch (error) {
      console.error('Error creating contact profile:', error);
      toast.error('Erro ao criar perfil de contacto');
      return false;
    }
  };

  const updateProfile = async (profileId: string, data: ContactProfileForm) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      const profileData = {
        name: data.name,
        is_foreigner: data.isForeigner,
        nif: data.nif,
        is_individual_company: data.isIndividualCompany,
        domain_owner_name: data.domainOwnerName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        country: data.country,
        state: data.state,
        city: data.city,
        postal_code: data.postalCode
      };

      const result = await updateContactProfile(profileId, profileData);
      
      if (result.success) {
        await loadContactProfiles();
        toast.success('Perfil de contacto atualizado com sucesso!');
        return true;
      } else {
        toast.error('Erro ao atualizar perfil de contacto');
        return false;
      }
    } catch (error) {
      console.error('Error updating contact profile:', error);
      toast.error('Erro ao atualizar perfil de contacto');
      return false;
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      const result = await deleteContactProfile(profileId);
      
      if (result.success) {
        await loadContactProfiles();
        toast.success('Perfil de contacto excluído com sucesso!');
        return true;
      } else {
        toast.error('Erro ao excluir perfil de contacto');
        return false;
      }
    } catch (error) {
      console.error('Error deleting contact profile:', error);
      toast.error('Erro ao excluir perfil de contacto');
      return false;
    }
  };

  return {
    contactProfiles,
    isLoading,
    createProfile,
    updateProfile,
    deleteProfile,
    loadContactProfiles
  };
};
