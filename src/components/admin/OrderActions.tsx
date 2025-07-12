
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface OrderActionsProps {
  order: any;
}

export default function OrderActions({ order }: OrderActionsProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      toast.loading('Gerando PDF...');
      
      // Buscar dados completos do pedido
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (*),
          order_items (*)
        `)
        .eq('id', order.id)
        .single();
        
      if (error) throw error;
      
      // Gerar PDF usando jsPDF
      const pdfBuffer = PDFGenerator.generateOrderPDF(data);
      
      // Download do PDF
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pedido-${data.order_number || data.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF do pedido gerado com sucesso!');
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
