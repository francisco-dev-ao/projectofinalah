
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { toast } from 'sonner';
import { invoiceService } from '@/services/invoiceService';

interface InvoicePdfGeneratorProps {
  invoiceId: string;
  invoiceNumber: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'icon';
  onSuccess?: (url: string) => void;
  className?: string;
}

export default function InvoicePdfGenerator({ 
  invoiceId, 
  invoiceNumber, 
  buttonText = 'Gerar PDF',
  variant = 'outline',
  onSuccess,
  className
}: InvoicePdfGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);
      toast.loading('Gerando PDF...');
      
      // Buscar dados completos da fatura (cliente, itens, etc.)
      const invoiceData = await invoiceService.getInvoice(invoiceId);
      
      // Log para depuração
      console.log('Dados completos da fatura:', invoiceData);
      
      // Gerar PDF com dados reais - await the promise
      const pdfBuffer = await PDFGenerator.generateInvoicePDF(invoiceData);
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fatura-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onSuccess?.(url);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGenerating(false);
      toast.dismiss();
    }
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleGeneratePdf}
        disabled={isGenerating}
        className={className}
        title="Gerar PDF"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      onClick={handleGeneratePdf}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
}
