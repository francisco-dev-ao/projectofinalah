import { toast } from 'sonner';
// PrintService removed - using direct print reference instead

export const downloadHelpers = {
  // Redirect PDF download to print reference
  downloadInvoicePDF: async (invoice: any, requireReference = false) => {
    return downloadHelpers.printInvoiceDirectly(invoice, requireReference);
  },

  printInvoiceDirectly: async (invoice: any, requireReference = false) => {
    const loadingToastId = toast.loading('Preparando impressão da referência...');
    
    try {
      // Buscar a referência de pagamento mais recente
      const paymentRef = invoice.orders?.payment_references?.[0];
      if (!paymentRef) {
        toast.error('Referência de pagamento não encontrada');
        return;
      }

      // Criar conteúdo para impressão da referência
      const printContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 400px;">
          <h2>Referência de Pagamento</h2>
          <hr>
          <p><strong>Fatura:</strong> ${invoice.invoice_number}</p>
          <p><strong>Cliente:</strong> ${invoice.orders?.profiles?.name || 'N/A'}</p>
          <p><strong>Entidade:</strong> ${paymentRef.entity}</p>
          <p><strong>Referência:</strong> ${paymentRef.reference}</p>
          <p><strong>Valor:</strong> KZ ${invoice.amount?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
          <p><strong>Validade:</strong> ${new Date(paymentRef.expires_at).toLocaleDateString('pt-PT')}</p>
          <hr>
          <small>Pagamento via ATM, Internet Banking ou Multicaixa Express</small>
        </div>
      `;

      // Abrir janela de impressão
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
      
      toast.dismiss(loadingToastId);
      toast.success('Referência preparada para impressão!');
    } catch (error: any) {
      console.error('Erro ao imprimir referência:', error);
      toast.dismiss(loadingToastId);
      toast.error(error.message || 'Erro ao imprimir referência');
      throw error;
    }
  }
};
