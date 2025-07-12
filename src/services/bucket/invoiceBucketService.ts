
import { supabase } from '@/integrations/supabase/client';

/**
 * Initialize the invoice bucket using the Supabase Edge Function
 * @returns A promise that resolves to a success flag and message
 */
export const initializeInvoiceBucket = async (): Promise<{
  success: boolean;
  message?: string;
  error?: any;
}> => {
  try {
    // Call the Supabase Edge Function to create and configure the bucket
    const { data, error } = await supabase.functions.invoke('create-invoice-bucket');
    
    if (error) {
      console.error('Error initializing invoice bucket:', error);
      return { 
        success: false, 
        message: 'Failed to initialize invoice bucket', 
        error 
      };
    }
    
    return { 
      success: true, 
      message: 'Invoice bucket initialized successfully'
    };
  } catch (error) {
    console.error('Exception in initializeInvoiceBucket:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred', 
      error 
    };
  }
};

/**
 * Check if the invoice bucket exists
 * @returns A promise that resolves to true if the bucket exists
 */
export const checkInvoiceBucketExists = async (): Promise<boolean> => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking buckets:', error);
      return false;
    }
    
    return buckets.some(bucket => bucket.name === 'invoices');
  } catch (error) {
    console.error('Exception in checkInvoiceBucketExists:', error);
    return false;
  }
};
