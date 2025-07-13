import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceActionsProps {
  invoice: any;
  onEdit?: (id: string) => void;
}

export default function InvoiceActions({ invoice, onEdit }: InvoiceActionsProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintReference = async () => {
    try {
      setIsPrinting(true);
      toast.loading('Preparando impressão...');
      
      // Buscar dados da referência de pagamento
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            profiles:user_id (*),
            payment_references (*)
          )
        `)
        .eq('id', invoice.id)
        .single();
        
      if (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Erro ao carregar dados da fatura');
        return;
      }

      // Buscar a referência de pagamento mais recente
      const paymentRef = data.orders?.payment_references?.[0];
      if (!paymentRef) {
        toast.error('Referência de pagamento não encontrada');
        return;
      }

      // Criar conteúdo para impressão da referência
      const printContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 400px;">
          <h2>Referência de Pagamento</h2>
          <hr>
          <p><strong>Fatura:</strong> ${data.invoice_number}</p>
          <p><strong>Cliente:</strong> ${data.orders?.profiles?.name || 'N/A'}</p>
          <p><strong>Entidade:</strong> ${paymentRef.entity}</p>
          <p><strong>Referência:</strong> ${paymentRef.reference}</p>
          <p><strong>Valor:</strong> KZ ${data.amount?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
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
      
      toast.success('Referência preparada para impressão!');
    } catch (error: any) {
      console.error('Erro ao imprimir referência:', error);
      toast.error(error.message || 'Erro ao imprimir referência');
    } finally {
      setIsPrinting(false);
      toast.dismiss();
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrintReference}
        disabled={isPrinting}
        className="text-blue-600 border-blue-600 hover:bg-blue-50"
      >
        {isPrinting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4 mr-2" />
        )}
        Imprimir Referência
      </Button>
      
      {onEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(invoice.id)}
          className="text-gray-600 border-gray-300 hover:bg-gray-50"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      )}
    </div>
  );
}