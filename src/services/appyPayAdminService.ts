import { supabase } from "@/integrations/supabase/client";

export interface AppyPayReferenceFilter {
  amountFrom?: number;
  amountTo?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  skip?: number;
}

export interface AppyPayReference {
  id: number;
  entity: string;
  referenceNumber: string;
  currency: string;
  amount: number;
  minAmount?: number;
  maxAmount?: number;
  startDate: string;
  expirationDate: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

/**
 * Get all payment references from AppyPay API
 */
export const getAllAppyPayReferences = async (filters?: AppyPayReferenceFilter) => {
  try {
    const { data, error } = await supabase.functions.invoke('appypay-get-references', {
      body: { filters }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching AppyPay references:', error);
    throw new Error('Erro ao buscar referências AppyPay');
  }
};

export const appyPayAdminService = {
  getAllReferences: getAllAppyPayReferences
};