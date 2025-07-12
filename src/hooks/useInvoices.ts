
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useInvoices = (userId?: string) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all user invoices
  const fetchInvoices = async () => {
    if (!userId) {
      console.log('useInvoices: No userId provided');
      setInvoices([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log('useInvoices: Fetching invoices for user:', userId);
      setIsLoading(true);
      setError(null);

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          orders!inner(
            id,
            user_id,
            total_amount,
            status,
            created_at
          )
        `)
        .eq('orders.user_id', userId)
        .order('created_at', { ascending: false });

      if (invoiceError) {
        console.error('useInvoices: Error fetching invoices:', invoiceError);
        throw invoiceError;
      }

      console.log('useInvoices: Invoices fetched successfully:', invoiceData?.length || 0);
      setInvoices(invoiceData || []);
    } catch (err: any) {
      console.error("useInvoices: Error in fetchInvoices:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Download invoice PDF
  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      console.log('useInvoices: Starting download for invoice:', invoiceId);
      setIsGeneratingPDF(true);
      
      // Buscar dados completos da fatura
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            order_items (*),
            profiles:user_id (*)
          )
        `)
        .eq('id', invoiceId)
        .single();
        
      if (invoiceError) {
        console.error('useInvoices: Error fetching invoice data:', invoiceError);
        throw new Error(invoiceError.message || 'Falha ao buscar dados da fatura');
      }
      
      if (!invoiceData) {
        throw new Error('Fatura não encontrada');
      }
      
      console.log('useInvoices: Invoice data loaded for download:', invoiceData);
      
      // Importar sob demanda para reduzir carregamento inicial
      const { downloadHelpers } = await import('@/utils/downloadHelpers');
      
      // Baixar usando o novo sistema de PDF
      await downloadHelpers.downloadInvoicePDF(invoiceData);
      
      console.log('useInvoices: Download completed successfully');
      // Retornar sucesso
      await fetchInvoices(); // Refresh the invoices list
      return true;
    } catch (error) {
      console.error('useInvoices: Error downloading invoice:', error);
      toast.error('Erro ao baixar fatura');
      return false;
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  // Share invoice
  const shareInvoice = async (invoiceId: string) => {
    try {
      console.log('useInvoices: Starting share for invoice:', invoiceId);
      setIsSharing(true);
      
      // Generate shareable link
      const { data, error } = await supabase.functions.invoke('share-invoice', {
        body: { invoiceId }
      });
      
      if (error) {
        console.error('useInvoices: Error in share function:', error);
        throw new Error(error.message);
      }
      
      // Copy link to clipboard
      if (data?.shareUrl) {
        await navigator.clipboard.writeText(data.shareUrl);
        toast.success('Link copiado para a área de transferência');
        console.log('useInvoices: Share completed successfully');
        return data.shareUrl;
      } else {
        toast.error('Não foi possível gerar um link compartilhável');
        return null;
      }
    } catch (error) {
      console.error('useInvoices: Error sharing invoice:', error);
      toast.error('Erro ao compartilhar fatura');
      return null;
    } finally {
      setIsSharing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (userId) {
      console.log('useInvoices: useEffect triggered for user:', userId);
      fetchInvoices();
    }
  }, [userId]);

  return {
    invoices,
    isLoading,
    downloadInvoice,
    isGeneratingPDF,
    shareInvoice,
    isSharing,
    error,
    refetchInvoices: fetchInvoices
  };
};
