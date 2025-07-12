
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

export const useCheckoutContactProfile = () => {
  const { cartItems } = useCart();
  const [selectedContactProfileId, setSelectedContactProfileId] = useState<string>(() => {
    // Inicializar com valor do sessionStorage se existir
    return sessionStorage.getItem('selectedContactProfileId') || '';
  });
  const [isContactProfileRequired, setIsContactProfileRequired] = useState(false);

  // Verificar se há domínios no carrinho que requerem perfil de contacto
  useEffect(() => {
    // Só requer perfil para novos domínios (não para domínios existentes)
    const hasNewDomainItems = cartItems.some(item => 
      (item.type === 'domain' || 
       item.name.toLowerCase().includes('domínio') ||
       item.name.toLowerCase().includes('domain')) &&
      !(item as any).isExistingDomain // Excluir domínios existentes
    );
    
    setIsContactProfileRequired(hasNewDomainItems);
    
    // Se não há mais novos domínios, limpar a seleção
    if (!hasNewDomainItems) {
      setSelectedContactProfileId('');
      sessionStorage.removeItem('selectedContactProfileId');
    }
  }, [cartItems]);

  // Escutar mudanças no sessionStorage de outras instâncias
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedContactProfileId') {
        const newValue = e.newValue || '';
        setSelectedContactProfileId(newValue);
      }
    };

    // Também escutar mudanças manuais no sessionStorage
    const checkStorage = () => {
      const currentValue = sessionStorage.getItem('selectedContactProfileId') || '';
      setSelectedContactProfileId(prev => {
        if (prev !== currentValue) {
          return currentValue;
        }
        return prev;
      });
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkStorage, 100); // Check every 100ms

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleProfileSelected = (profileId: string) => {
    console.log('handleProfileSelected called with:', profileId);
    setSelectedContactProfileId(profileId);
    // Salvar no sessionStorage para persistir durante o checkout
    if (profileId) {
      sessionStorage.setItem('selectedContactProfileId', profileId);
    } else {
      sessionStorage.removeItem('selectedContactProfileId');
    }
  };

  const clearContactProfile = () => {
    setSelectedContactProfileId('');
    sessionStorage.removeItem('selectedContactProfileId');
  };

  // Validação obrigatória
  const isContactProfileValid = () => {
    if (!isContactProfileRequired) return true;
    const currentProfileId = selectedContactProfileId || sessionStorage.getItem('selectedContactProfileId') || '';
    return !!currentProfileId;
  };

  console.log('useCheckoutContactProfile state:', {
    selectedContactProfileId,
    isContactProfileRequired,
    isValid: isContactProfileValid()
  });

  return {
    selectedContactProfileId,
    isContactProfileRequired,
    isContactProfileValid,
    handleProfileSelected,
    clearContactProfile
  };
};
