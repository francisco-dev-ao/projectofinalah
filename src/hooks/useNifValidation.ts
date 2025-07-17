
import { useState } from 'react';
import { validateNIF } from "@/services/nifService";

export const useNifValidation = () => {
  const [isValidatingNIF, setIsValidatingNIF] = useState(false);
  const [nifValidationResult, setNifValidationResult] = useState<{ isValid: boolean; message: string } | null>(null);

  const validateNIFField = async (nif: string) => {
    if (!nif) {
      setNifValidationResult({ isValid: false, message: 'NIF é obrigatório' });
      return;
    }

    // Limpar o NIF
    const cleanNIF = nif.replace(/[^a-zA-Z0-9]/g, '');
    
    // Só validar se o NIF tiver tamanho mínimo para ser válido
    if (cleanNIF.length < 9) {
      console.log('useNifValidation: NIF muito curto para validação:', cleanNIF.length);
      setNifValidationResult({ isValid: false, message: 'NIF muito curto' });
      return null;
    }
    
    // Verificar se é um NIF válido (pessoal ou empresarial)
    const isPersonalNIF = /^\d{9}[A-Z]{2}\d{3}$/.test(cleanNIF);
    const isBusinessNIF = /^\d{10}$/.test(cleanNIF); // Empresas devem ter 10 dígitos
    
    if (!isPersonalNIF && !isBusinessNIF) {
      setNifValidationResult({ 
        isValid: false, 
        message: 'Formato inválido. Empresa: 10 dígitos. Pessoa: 9 números + 2 letras + 3 números.' 
      });
      return null;
    }

    setIsValidatingNIF(true);
    try {
      const result = await validateNIF(nif);
      if (result.isValid) {
        const nifType = isPersonalNIF ? 'pessoal' : 'empresarial';
        
        // Mensagem mais detalhada baseada nos dados disponíveis
        const availableData = [];
        if (result.companyInfo?.name) availableData.push("nome");
        if (result.companyInfo?.address) availableData.push("endereço");
        if (result.companyInfo?.phone) availableData.push("telefone");
        
        const message = availableData.length > 0 
          ? `NIF ${nifType} válido. Dados disponíveis: ${availableData.join(", ")}`
          : `NIF ${nifType} válido`;
          
        setNifValidationResult({ isValid: true, message });
        return result.companyInfo;
      } else {
        // Disparar erro em tempo real quando NIF não encontrar informações na API
        setNifValidationResult({ 
          isValid: false, 
          message: 'NIF não encontrado na base de dados da API. Verifique se o número está correto.' 
        });
        return null;
      }
    } catch (error) {
      // Disparar erro em tempo real para problemas de API
      setNifValidationResult({ 
        isValid: false, 
        message: 'Erro ao consultar NIF na API. Tente novamente em alguns instantes.' 
      });
      return null;
    } finally {
      setIsValidatingNIF(false);
    }
  };

  // Validação automática quando o usuário terminar de digitar
  const handleNIFBlur = async (nif: string) => {
    const trimmedNif = nif.trim();
    
    // Se o campo não está vazio mas tem menos de 9 caracteres, mostrar erro
    if (trimmedNif && trimmedNif.length > 0 && trimmedNif.length < 9) {
      setNifValidationResult({ 
        isValid: false, 
        message: `NIF incompleto. Por favor, complete os dígitos (mínimo 9 caracteres). Atual: ${trimmedNif.length} dígitos.` 
      });
      return null;
    }
    
    // Se parece ser NIF empresarial (só números) mas não tem 10 dígitos, mostrar erro específico
    if (trimmedNif && /^\d+$/.test(trimmedNif) && trimmedNif.length > 0 && trimmedNif.length < 10) {
      setNifValidationResult({ 
        isValid: false, 
        message: `NIF empresarial incompleto. Empresas devem ter 10 dígitos. Atual: ${trimmedNif.length} dígitos.` 
      });
      return null;
    }
    
    // Só validar se o NIF tiver tamanho mínimo para ser válido
    if (trimmedNif && trimmedNif.length >= 9) {
      return await validateNIFField(trimmedNif);
    }
    return null;
  };

  const resetValidation = () => {
    setNifValidationResult(null);
  };

  return {
    isValidatingNIF,
    nifValidationResult,
    validateNIFField,
    handleNIFBlur,
    resetValidation
  };
};
