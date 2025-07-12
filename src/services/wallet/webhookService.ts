
import { supabase } from '@/integrations/supabase/client';

/**
 * Process a webhook notification for wallet payment via the Supabase Edge Function
 * @param payload The webhook payload from the payment provider
 * @returns A promise that resolves to a success flag and message
 */
export const processWalletPaymentWebhook = async (
  payload: any
): Promise<{
  success: boolean;
  message: string;
  error?: any;
}> => {
  try {
    // Call the Supabase Edge Function to process the webhook
    const { data, error } = await supabase.functions.invoke('wallet-payment-webhook', {
      body: payload
    });
    
    if (error) {
      console.error('Error invoking wallet-payment-webhook:', error);
      return {
        success: false,
        message: 'Failed to process payment webhook',
        error
      };
    }
    
    return {
      success: true,
      message: 'Webhook processed successfully'
      // Remove the data property as it's not in the return type definition
    };
  } catch (error) {
    console.error('Exception in processWalletPaymentWebhook:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error
    };
  }
};
