
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { toast } from 'sonner';
import { invoiceService } from '@/services/invoiceService';

interface InvoicePdfGeneratorProps {
  invoiceId: string;
  invoiceNumber: string;
  pdfUrl?: string;
  onSuccess?: (pdfUrl: string) => void;
  variant?: 'default' | 'icon';
}

// Export the function for direct use with complete data
export const generateInvoicePdf = async (invoiceId: string, invoiceNumber: string): Promise<string> => {
  try {
    // Get the complete invoice data with customer and items - now with enhanced relationships
    const invoiceData = await invoiceService.getInvoice(invoiceId);
    
    // Generate PDF with enhanced data - await the promise
    const pdfBuffer = await PDFGenerator.generateInvoicePDF(invoiceData);
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Erro ao buscar dados da fatura para PDF:', error);
    throw error;
  }
};

export default function InvoicePdfGenerator({ 
  invoiceId, 
  invoiceNumber, 
  pdfUrl,
  onSuccess,
  variant = 'default'
}: InvoicePdfGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);
      toast.loading('Gerando PDF...');
      
      const url = await generateInvoicePdf(invoiceId, invoiceNumber);
      
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
      variant="ghost"
      size="sm"
      onClick={handleGeneratePdf}
      disabled={isGenerating}
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
