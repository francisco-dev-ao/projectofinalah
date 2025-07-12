
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface InvoicePdfGeneratorProps {
  invoiceId: string;
  invoiceNumber: string;
  pdfUrl?: string;
  onSuccess?: (pdfUrl: string) => void;
  variant?: 'default' | 'outline' | 'icon';
  className?: string;
}

export default function InvoicePdfGenerator({ 
  invoiceId, 
  invoiceNumber, 
  pdfUrl,
  onSuccess,
  variant = 'outline',
  className
}: InvoicePdfGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);
      toast.loading('Gerando PDF...');
      
      // Buscar dados básicos da fatura
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
        
      if (invoiceError) {
        console.error('Erro ao buscar fatura:', invoiceError);
        throw new Error(`Erro ao carregar fatura: ${invoiceError.message}`);
      }
      
      if (!invoice) {
        throw new Error('Fatura não encontrada');
      }
      
      // Buscar dados do pedido separadamente se existir order_id
      let orderData = null;
      let profileData = null;
      let orderItems = [];
      
      if (invoice.order_id) {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', invoice.order_id)
          .single();
          
        if (!orderError && order) {
          orderData = order;
          
          // Buscar perfil do usuário
          if (order.user_id) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', order.user_id)
              .single();
              
            if (!profileError) {
              profileData = profile;
            }
          }
          
          // Buscar itens do pedido
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
            
          if (!itemsError && items) {
            orderItems = items;
          }
        }
      }
      
      // Montar estrutura de dados para o PDF
      const invoiceWithData = {
        ...invoice,
        orders: orderData ? {
          ...orderData,
          profiles: profileData,
          order_items: orderItems
        } : null
      };
      
      console.log('Dados da fatura para PDF:', invoiceWithData);
      
      // Gerar PDF com dados reais
      const pdfBuffer = await PDFGenerator.generateInvoicePDF(invoiceWithData);
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Download the PDF
      const link = document.createElement('a');
      link.href = url;
      link.download = `fatura-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onSuccess?.(url);
      toast.success('PDF gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast.error(error.message || 'Erro ao gerar PDF');
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
          Gerar PDF
        </>
      )}
    </Button>
  );
}
