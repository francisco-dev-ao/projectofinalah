
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { checkInvoiceBucketExists, initializeInvoiceBucket } from "@/services/bucket/invoiceBucketService";

export const useInvoiceBucket = () => {
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    checkBucketExists();
  }, []);

  // Check if the bucket already exists
  const checkBucketExists = async () => {
    const exists = await checkInvoiceBucketExists();
    setIsInitialized(exists);
    return exists;
  };

  // Initialize the invoices bucket
  const initializeInvoiceBucket = async () => {
    setIsInitializing(true);
    
    try {
      console.log('Verificando e inicializando bucket de faturas...');
      
      // Call the service to initialize the bucket
      const result = await initializeInvoiceBucket();
      
      if (result.success) {
        toast.success("Bucket de faturas criado com sucesso");
        setIsInitialized(true);
        return true;
      } else {
        console.error('Falha ao criar bucket:', result.error || 'Erro desconhecido');
        toast.error("Erro ao inicializar bucket de faturas");
        return false;
      }
    } catch (error) {
      console.error('Erro ao inicializar bucket de faturas:', error);
      toast.error("Erro ao inicializar bucket de faturas");
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    isInitializing,
    isInitialized,
    initializeInvoiceBucket,
  };
};
