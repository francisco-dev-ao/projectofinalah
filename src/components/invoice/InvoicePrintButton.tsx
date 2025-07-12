
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadHelpers } from '@/utils/downloadHelpers';
import { supabase } from '@/lib/supabase';

export interface InvoicePrintButtonProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function InvoicePrintButton({ invoiceId, invoiceNumber }: InvoicePrintButtonProps) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setPrinting(true);
      
      // Buscar dados completos da fatura com referências de pagamento
      const { data: invoice, error } = await supabase
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
      
      // Usar a nova função de impressão direta
      // Não exigir referência de pagamento válida (requireReference=false)
      await downloadHelpers.printInvoiceDirectly(invoice, false);
      
    } catch (error: any) {
      console.error('Error printing invoice:', error);
      toast.error(error.message || 'Erro ao imprimir fatura. Por favor, tente novamente.');
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
      Imprimir
    </Button>
  );
}
