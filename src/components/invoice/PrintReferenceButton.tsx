import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface PrintReferenceButtonProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function PrintReferenceButton({ invoiceId, invoiceNumber }: PrintReferenceButtonProps) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setPrinting(true);
      
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            profiles:user_id (*),
            payment_references (*)
          )
        `)
        .eq('id', invoiceId)
        .single();
        
      if (error) throw new Error(`Erro ao carregar fatura: ${error.message}`);
      
      const paymentRef = invoice.orders?.payment_references?.[0];
      if (!paymentRef) {
        toast.error('Referência de pagamento não encontrada');
        return;
      }

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

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
      
      toast.success('Referência preparada para impressão!');
    } catch (error: any) {
      console.error('Error printing reference:', error);
      toast.error(error.message || 'Erro ao imprimir referência');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      disabled={printing}
    >
      {printing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4 mr-2" />
      )}
      Imprimir Referência
    </Button>
  );
}