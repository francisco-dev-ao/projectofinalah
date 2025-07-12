import { toast } from 'sonner';
import PrintService from '@/services';

export const downloadHelpers = {
  downloadInvoicePDF: async (invoice: any, requireReference = false) => {
    try {
      // Toast para indicar que o download está em progresso
      const loadingToastId = toast.loading('Preparando download...');
      
      // Usar o novo PrintService para gerar o PDF
      const pdfBuffer = await PrintService.generateInvoicePDF(invoice, requireReference);
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fatura-${invoice.invoice_number || invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Remover o toast de loading e mostrar sucesso
      toast.dismiss(loadingToastId);
      toast.success('PDF baixado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao baixar PDF:', error);
      toast.error(error.message || 'Erro ao baixar PDF');
      throw error;
    }
  },

  printInvoiceDirectly: async (invoice: any, requireReference = false) => {
    // ID único para o toast de loading
    const loadingToastId = toast.loading('Preparando impressão...');
    
    try {
      // Chamar o método de impressão do PrintService
      await PrintService.printInvoice(invoice, requireReference);
      
      // Remover o toast de loading e mostrar sucesso
      toast.dismiss(loadingToastId);
      toast.success('Janela de impressão aberta!');
    } catch (error: any) {
      console.error('Erro ao imprimir fatura:', error);
      // Remover o toast de loading e mostrar erro
      toast.dismiss(loadingToastId);
      toast.error(error.message || 'Erro ao abrir impressão');
      throw error;
    }
  }
};
