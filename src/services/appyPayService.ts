import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AppyPayPaymentRequest {
  orderId: string;
  amount: number;
  phoneNumber: string;
  paymentType: 'multicaixa' | 'umm';
  testMode?: boolean;
}

export interface AppyPayPaymentResponse {
  success: boolean;
  message: string;
  merchantTransactionId?: string;
  appypayId?: string;
  orderStatus?: string;
  paymentData?: any;
}

export interface AppyPayConfig {
  testMode: boolean;
  // Test credentials
  testClientId?: string;
  testClientSecret?: string;
  testReferenceKey?: string;
  testPaymentMethod?: string;
  // Live credentials
  clientId?: string;
  clientSecret?: string;
  referenceKey?: string;
  paymentMethod?: string;
}

/**
 * Process payment through AppyPay (Multicaixa Express or UNITEL Mobile Money)
 */
export const processAppyPayPayment = async (
  paymentRequest: AppyPayPaymentRequest
): Promise<AppyPayPaymentResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('appypay-multicaixa', {
      body: paymentRequest
    });

    if (error) {
      throw new Error(error.message || 'Erro na comunicação com o serviço de pagamento');
    }

    return data;
  } catch (error: any) {
    console.error('AppyPay payment error:', error);
    throw new Error(error.message || 'Erro ao processar pagamento AppyPay');
  }
};

/**
 * Get payment status by reference
 */
export const getPaymentStatus = async (reference: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_references')
      .select(`
        *,
        orders (
          id,
          status,
          total_amount
        )
      `)
      .eq('reference', reference)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching payment status:', error);
    throw new Error('Erro ao buscar status do pagamento');
  }
};

/**
 * Get all payment references for an order
 */
export const getOrderPaymentReferences = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_references')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching order payment references:', error);
    return [];
  }
};

/**
 * Validate phone number for AppyPay payments
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Remove spaces and special characters
  const cleanPhone = phoneNumber.replace(/\s/g, '');
  
  // Angola phone number format: 9XXXXXXXX (9 digits starting with 9)
  const phoneRegex = /^(\+244|244)?[9][0-9]{8}$/;
  
  return phoneRegex.test(cleanPhone);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  }
};

/**
 * Get payment method display name
 */
export const getPaymentMethodName = (paymentType: 'multicaixa' | 'umm'): string => {
  switch (paymentType) {
    case 'multicaixa':
      return 'Multicaixa Express';
    case 'umm':
      return 'UNITEL Mobile Money';
    default:
      return 'AppyPay';
  }
};

/**
 * Check if AppyPay is properly configured
 */
export const checkAppyPayConfiguration = async (testMode: boolean = true): Promise<boolean> => {
  try {
    // This would typically check if all required environment variables are set
    // For now, we'll assume it's configured if the edge function exists
    const { data, error } = await supabase.functions.invoke('appypay-multicaixa', {
      body: {
        action: 'check_config',
        testMode
      }
    });

    return !error;
  } catch (error) {
    console.error('AppyPay configuration check failed:', error);
    return false;
  }
};

/**
 * AppyPay service class for managing payments
 */
export class AppyPayService {
  private config: AppyPayConfig;

  constructor(config: AppyPayConfig) {
    this.config = config;
  }

  async processPayment(paymentRequest: Omit<AppyPayPaymentRequest, 'testMode'>): Promise<AppyPayPaymentResponse> {
    return processAppyPayPayment({
      ...paymentRequest,
      testMode: this.config.testMode
    });
  }

  async getPaymentStatus(reference: string) {
    return getPaymentStatus(reference);
  }

  async getOrderPayments(orderId: string) {
    return getOrderPaymentReferences(orderId);
  }

  validatePhone(phoneNumber: string): boolean {
    return validatePhoneNumber(phoneNumber);
  }

  formatPhone(phoneNumber: string): string {
    return formatPhoneNumber(phoneNumber);
  }

  isConfigured(): boolean {
    if (this.config.testMode) {
      return !!(this.config.testClientId && this.config.testClientSecret && 
               this.config.testReferenceKey && this.config.testPaymentMethod);
    } else {
      return !!(this.config.clientId && this.config.clientSecret && 
               this.config.referenceKey && this.config.paymentMethod);
    }
  }
}

// Default service instance
export const appyPayService = new AppyPayService({
  testMode: true // Default to test mode
});