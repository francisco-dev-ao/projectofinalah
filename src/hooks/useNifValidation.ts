
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
    
    // Verificar se é um NIF válido (pessoal ou empresarial)
    const isPersonalNIF = /^\d{9}[A-Z]{2}\d{3}$/.test(cleanNIF);
    const isBusinessNIF = /^\d{9,10}$/.test(cleanNIF);
    
    if (!isPersonalNIF && !isBusinessNIF) {
      setNifValidationResult({ isValid: false, message: 'Formato de NIF inválido' });
      return null;
    }

    setIsValidatingNIF(true);
    try {
      const result = await validateNIF(nif);
      if (result.isValid) {
        const nifType = isPersonalNIF ? 'pessoal' : 'empresarial';
        setNifValidationResult({ isValid: true, message: `NIF ${nifType} válido` });
        return result.companyInfo?.name;
      } else {
        setNifValidationResult({ isValid: false, message: 'NIF inválido' });
        return null;
      }
    } catch (error) {
      setNifValidationResult({ isValid: false, message: 'Erro ao validar NIF' });
      return null;
    } finally {
      setIsValidatingNIF(false);
    }
  };

  // Validação automática quando o usuário terminar de digitar
  const handleNIFBlur = async (nif: string) => {
    if (nif && nif.trim().length >= 5) {
      return await validateNIFField(nif.trim());
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
