
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useInvoiceBucket = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  const initializeInvoiceBucket = async () => {
    try {
      setIsInitializing(true);
      
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (!bucketsError && buckets) {
        const exists = buckets.some(bucket => bucket.name === 'invoices');
        if (exists) {
          setIsInitialized(true);
          return true;
        }
      }
      
      const { data, error } = await supabase.rpc('setup_invoice_bucket_policies');
      
      if (error && error.message !== 'invalid_parameter_value') {
        console.error('Error initializing invoice bucket:', error);
        return false;
      }
      
      setIsInitialized(true);
      return true;
    } catch (error) {
      console.error('Exception initializing invoice bucket:', error);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  return { isInitialized, isInitializing, initializeInvoiceBucket };
};
