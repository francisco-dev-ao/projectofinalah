
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

interface InvoiceDownloadButtonProps {
  invoice: any;
  variant?: 'default' | 'outline';
  showText?: boolean;
}

export default function InvoiceDownloadButton({ 
  invoice, 
  variant = 'outline',
  showText = false 
}: InvoiceDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      toast.loading('Gerando PDF...');
      
      // Await the PDF generation
      const pdfBuffer = await PDFGenerator.generateInvoicePDF(invoice);
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fatura-${invoice.invoice_number || invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao baixar PDF');
    } finally {
      setIsDownloading(false);
      toast.dismiss();
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-2">
          {isDownloading ? 'Baixando...' : 'Baixar PDF'}
        </span>
      )}
    </Button>
  );
}
