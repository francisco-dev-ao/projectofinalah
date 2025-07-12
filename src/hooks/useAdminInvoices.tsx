
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateInvoice, updateInvoiceStatus } from "@/services/invoice";

export const useAdminInvoices = () => {
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to create invoice for an order
  const createInvoiceForOrder = async (orderId: string) => {
    try {
      setIsGeneratingInvoice(true);
      
      const result = await generateInvoice(orderId);
      
      if (result.success) {
        toast.success("Fatura gerada com sucesso!");
        return result.invoice;
      } else {
        toast.error("Erro ao gerar fatura. Tente novamente mais tarde.");
        console.error("Error generating invoice:", result.error);
        return null;
      }
    } catch (error) {
      console.error("Error in createInvoiceForOrder:", error);
      toast.error("Erro ao gerar fatura");
      return null;
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // Function to update invoice status
  const updateInvoiceStatusFn = async (invoiceId: string, status: 'draft' | 'issued' | 'paid' | 'canceled') => {
    try {
      setIsLoading(true);
      
      const result = await updateInvoiceStatus(invoiceId, status);
      
      if (result.success) {
        toast.success("Status da fatura atualizado com sucesso!");
        return true;
      } else {
        toast.error("Erro ao atualizar status da fatura");
        console.error("Error updating invoice status:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Error in updateInvoiceStatusFn:", error);
      toast.error("Erro ao atualizar status da fatura");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to print invoice
  const printInvoice = async (invoiceId: string) => {
    try {
      console.log('useAdminInvoices: Printing invoice:', invoiceId);
      
      const { downloadHelpers } = await import("@/utils/downloadHelpers");
      
      // Buscar dados completos da fatura
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            profiles:user_id (*),
            payment_references (*),
            order_items (*)
          )
        `)
        .eq('id', invoiceId)
        .single();
        
      if (error) throw new Error(`Erro ao carregar fatura: ${error.message}`);
      
      await downloadHelpers.printInvoiceDirectly(invoiceData);
      toast.success('Abrindo janela de impressão...');
      return true;
    } catch (error) {
      console.error("Error in printInvoice:", error);
      toast.error("Erro ao imprimir fatura");
      return null;
    }
  };

  return {
    createInvoiceForOrder,
    updateInvoiceStatus: updateInvoiceStatusFn,
    printInvoice,
    isGeneratingInvoice,
    isLoading
  };
};
