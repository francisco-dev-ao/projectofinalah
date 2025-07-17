
// Service for validating NIF (Angola Tax ID Number) using official API
// This service handles NIF validation and fetches company information

import { supabase } from "@/integrations/supabase/client";

interface CompanyInfo {
  name?: string;
  address?: string;
  phone?: string;
}

interface NIFValidationResult {
  isValid: boolean;
  companyInfo?: CompanyInfo | null;
}

// The base URL for the Angola tax authority API
const API_BASE_URL = "https://api-nif.angohost.ao/consultar";

/**
 * Validates a NIF (Angola Tax ID Number) using the official API
 * @param nif The NIF to be validated
 * @returns Promise<NIFValidationResult> Object containing validation result
 */
export const validateNIF = async (nif: string): Promise<NIFValidationResult> => {
  // Clean the NIF by removing spaces and special characters
  const cleanNIF = nif.replace(/[^a-zA-Z0-9]/g, '');
  
  console.log('nifService: Validando NIF:', nif, 'Limpo:', cleanNIF);
  
  // Validação mais rigorosa: NIFs devem ter pelo menos 9 caracteres
  if (cleanNIF.length < 9) {
    console.log('nifService: NIF muito curto:', cleanNIF.length);
    return { isValid: false, companyInfo: null };
  }
  
  // Verificar se é um NIF pessoal (formato como 005732018NE040)
  const isPersonalNIF = /^\d{9}[A-Z]{2}\d{3}$/.test(cleanNIF);
  
  // Verificar se é um NIF empresarial (10 dígitos)
  const isBusinessNIF = /^\d{10}$/.test(cleanNIF);
  
  // Verificar se é um NIF válido (pessoal ou empresarial)
  if (!isPersonalNIF && !isBusinessNIF) {
    console.log('nifService: Formato de NIF inválido:', cleanNIF);
    return { isValid: false, companyInfo: null };
  }
  
  // Validação adicional: NIFs devem começar com números
  if (!/^\d/.test(cleanNIF)) {
    console.log('nifService: NIF não começa com número:', cleanNIF);
    return { isValid: false, companyInfo: null };
  }

  try {
    console.log('nifService: Consultando API para NIF:', cleanNIF, 'Tipo:', isPersonalNIF ? 'Pessoal' : 'Empresarial');
    // Make actual API call to the official NIF validation service
    const response = await fetch(`${API_BASE_URL}/${cleanNIF}`);
    
    // Check if request was successful
    if (!response.ok) {
      console.error(`API returned ${response.status}: ${response.statusText}`);
      return { isValid: false, companyInfo: null };
    }
    
    const data = await response.json();
    console.log('nifService: Resposta da API:', data);
    
    // Check if the NIF is valid based on API response
    if (data && (data.success || data.data?.success)) {
      const responseData = data.data || data;
      console.log('nifService: NIF válido, dados retornados:', responseData);
      return {
        isValid: true,
        companyInfo: {
          name: responseData.nome || responseData.name || "",
          address: responseData.endereco || responseData.address || "",
          phone: responseData.numero_contacto || responseData.phone || responseData.telefone || ""
        }
      };
    } else {
      console.log('nifService: NIF inválido na API');
      return { isValid: false, companyInfo: null };
    }
  } catch (error) {
    console.error("Error validating NIF:", error);
    
    // In case of API failure, return invalid response
    return { isValid: false, companyInfo: null };
  }
};

/**
 * Formats a NIF for display according to Angola standards
 * @param nif The NIF to be formatted
 * @returns string The formatted NIF
 */
export const formatNIF = (nif: string): string => {
  // Remove spaces and special characters
  const cleanNIF = nif.replace(/[^a-zA-Z0-9]/g, '');
  
  console.log('nifService: Formatando NIF:', nif, 'Limpo:', cleanNIF);
  
  // Verificar se é um NIF pessoal (formato como 005732018NE040)
  const isPersonalNIF = /^\d{9}[A-Z]{2}\d{3}$/.test(cleanNIF);
  
  if (isPersonalNIF) {
    console.log('nifService: Formatando NIF pessoal');
    // Formatar NIF pessoal: 005732018NE040 -> 005732018-NE-040
    return `${cleanNIF.substring(0, 9)}-${cleanNIF.substring(9, 11)}-${cleanNIF.substring(11)}`;
  }
  
  // Verificar se é um NIF empresarial (9 ou 10 dígitos)
  const isBusinessNIF = /^\d{9,10}$/.test(cleanNIF);
  
  if (isBusinessNIF) {
    console.log('nifService: Formatando NIF empresarial');
    // Apply proper Angola NIF format
    if (cleanNIF.length === 9) {
      return `${cleanNIF.substring(0, 3)}.${cleanNIF.substring(3, 6)}.${cleanNIF.substring(6, 9)}`;
    } else {
      // Para NIFs de 10 dígitos: 5000088927 -> 500.008.892.7
      return `${cleanNIF.substring(0, 3)}.${cleanNIF.substring(3, 6)}.${cleanNIF.substring(6, 9)}.${cleanNIF.substring(9, 10)}`;
    }
  }
  
  // Return the cleaned NIF if we can't format it
  console.log('nifService: NIF não formatado, retornando limpo');
  return cleanNIF;
};

/**
 * Verifies if a NIF is already registered in the system
 * @param nif The NIF to verify
 * @returns Promise<boolean> Indicates if the NIF is already in use
 */
export const checkNIFExists = async (nif: string): Promise<boolean> => {
  // Clean the NIF
  const cleanNIF = nif.replace(/[^a-zA-Z0-9]/g, '');
  
  console.log('nifService: Verificando se NIF existe:', nif, 'Limpo:', cleanNIF);
  
  try {
    // Query the database to check if this NIF is already registered
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('nif', cleanNIF);
    
    if (error) {
      console.error("Error checking if NIF exists:", error);
      return false;
    }
    
    const exists = count ? count > 0 : false;
    console.log('nifService: NIF existe no sistema:', exists);
    
    // Return true if there are any profiles with this NIF
    return exists;
  } catch (error) {
    console.error("Error checking if NIF exists:", error);
    return false;
  }
};
