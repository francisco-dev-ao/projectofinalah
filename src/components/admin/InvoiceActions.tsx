
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface InvoiceActionsProps {
  invoice: any;
}

export default function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      toast.loading('Gerando PDF...');
      
      // Buscar dados completos da fatura
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            profiles:user_id (*),
            order_items (*)
          )
        `)
        .eq('id', invoice.id)
        .single();
        
      if (error) throw error;
      
      // Gerar PDF usando jsPDF - await the promise
      const pdfBuffer = await PDFGenerator.generateInvoicePDF(data);
      
      // Download do PDF
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fatura-${data.invoice_number || data.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast.error(error.message || 'Erro ao gerar PDF');
    } finally {
      setIsGeneratingPdf(false);
      toast.dismiss();
    }
  };

  return (
    <div className="flex space-x-2">
      <Button 
        onClick={handleDownloadPdf}
        disabled={isGeneratingPdf}
        variant="outline"
        size="sm"
      >
        {isGeneratingPdf ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        PDF
      </Button>
    </div>
  );
}
