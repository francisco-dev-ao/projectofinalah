
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PDFGenerator } from '@/utils/pdfGenerator';

export const useInvoices = (userId?: string) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  // Fetch all user invoices if userId is provided
  const { data: invoices, isLoading, error, refetch: refetchInvoicesInternal } = useQuery({
    queryKey: ['invoices', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders!inner(
            id,
            user_id,
            total_amount,
            status,
            created_at,
            profiles:user_id(*),
            order_items(*)
          )
        `)
        .eq('orders.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return invoices || [];
    },
    enabled: !!userId
  });

  // Refetch invoices with a clean fetch function
  const refetchInvoices = async () => {
    return refetchInvoicesInternal();
  };

  // Generate PDF for invoice using jsPDF
  const generatePDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setIsGeneratingPDF(true);
      toast.loading('Gerando PDF...');
      
      // Buscar dados completos da fatura
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            profiles:user_id (*),
            order_items (*)
          )
        `)
        .eq('id', invoiceId)
        .single();
        
      if (error) throw new Error(`Erro ao carregar fatura: ${error.message}`);
      
      // Gerar PDF usando jsPDF
      const pdfBuffer = PDFGenerator.generateInvoicePDF(invoice);
      
      // Criar blob para download
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      await refetchInvoices(); // Refetch invoices to get updated data
      toast.success('PDF gerado com sucesso!');
      
      return url;
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF da fatura");
      throw error;
    } finally {
      setIsGeneratingPDF(false);
      toast.dismiss();
    }
  };

  // Download invoice PDF
  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setIsGeneratingPDF(true);
      toast.loading('Preparando download...');
      
      // Buscar dados completos da fatura
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            profiles:user_id (*),
            order_items (*)
          )
        `)
        .eq('id', invoiceId)
        .single();
        
      if (error) throw new Error(`Erro ao carregar fatura: ${error.message}`);
      
      // Gerar PDF usando jsPDF
      const pdfBuffer = PDFGenerator.generateInvoicePDF(invoice);
      
      // Fazer download
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fatura-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Download iniciado com sucesso!');
    } catch (error) {
      console.error("Error in downloadInvoice:", error);
      toast.error("Erro ao baixar a fatura");
    } finally {
      setIsGeneratingPDF(false);
      toast.dismiss();
    }
  };

  // Share invoice via email
  const shareInvoice = async (invoiceId: string) => {
    try {
      setIsSharing(true);
      toast.loading('Compartilhando fatura...');
      
      const { data, error } = await supabase.functions.invoke('share-invoice', {
        body: { invoiceId }
      });
      
      if (error) {
        console.error("Error sharing invoice:", error);
        toast.error("Erro ao compartilhar fatura");
        throw error;
      }
      
      toast.success("Fatura compartilhada com sucesso!");
      return data;
    } catch (error) {
      console.error("Error in shareInvoice:", error);
      toast.error("Erro ao compartilhar fatura");
      throw error;
    } finally {
      setIsSharing(false);
      toast.dismiss();
    }
  };

  return {
    invoices,
    isLoading,
    error,
    downloadInvoice,
    generatePDF,
    isGeneratingPDF,
    shareInvoice,
    isSharing,
    refetchInvoices,
  };
};
