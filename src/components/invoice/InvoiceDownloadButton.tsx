
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { supabase } from '@/lib/supabase';

export interface InvoiceDownloadButtonProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function InvoiceDownloadButton({ invoiceId, invoiceNumber }: InvoiceDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
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
      
      // Gerar PDF usando jsPDF - await the promise
      const pdfBuffer = await PDFGenerator.generateInvoicePDF(invoice);
      
      // Criar blob e fazer download
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
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      toast.error(error.message || 'Erro ao fazer download da fatura. Por favor, tente novamente.');
    } finally {
      setDownloading(false);
      toast.dismiss();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={downloading}
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Download
    </Button>
  );
}
