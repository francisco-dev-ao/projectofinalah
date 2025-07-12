
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { AlertTriangle, Download, Printer, Clock, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { saveAs } from 'file-saver';
// Importar o novo componente ao invés da função direta
import InvoicePdfGenerator from '@/components/invoice/InvoicePdfGenerator';

interface UnpaidInvoicesListProps {
  userId: string;
}

const UnpaidInvoicesList: React.FC<UnpaidInvoicesListProps> = ({ userId }) => {
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchUnpaidInvoices();
  }, [userId]);

  // Check invoices and generate PDFs if needed
  useEffect(() => {
    if (unpaidInvoices && unpaidInvoices.length > 0) {
      unpaidInvoices.forEach(invoice => {
        if (!invoice.pdf_url) {
          ensureInvoiceHasPdf(invoice);
        }
      });
    }
  }, [unpaidInvoices]);

  const fetchUnpaidInvoices = async () => {
    try {
      setIsLoading(true);
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders!inner(
            id,
            total_amount,
            status
          )
        `)
        .eq('orders.user_id', userId)
        .eq('status', 'issued')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setUnpaidInvoices(invoices || []);
    } catch (error) {
      console.error('Error fetching unpaid invoices:', error);
      toast.error('Erro ao carregar faturas pendentes');
    } finally {
      setIsLoading(false);
    }
  };
  // Esta função foi modificada para não gerar PDFs automaticamente
  // para evitar problemas com elemento não encontrado
  const ensureInvoiceHasPdf = async (invoice: any) => {
    // Não tentamos mais gerar PDFs automaticamente
    // Apenas verificamos se já existe
    if (!invoice.pdf_url) {
      console.log('Fatura sem PDF:', invoice.id);
    }
  };

  const handleGeneratePdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setIsGenerating(prev => ({ ...prev, [invoiceId]: true }));
      toast.loading('Gerando PDF...');
      
      // Função importada do backend (não precisa de elemento HTML na página)
      // Usamos fetch ao endpoint da API que criamos
      const response = await fetch(`/api/invoices/generate/${invoiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invoiceNumber })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao gerar PDF: ${response.status}`);
      }
      
      const data = await response.json();
      const pdfUrl = data.url;
      
      if (pdfUrl) {
        // Update invoice with PDF URL
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ pdf_url: pdfUrl })
          .eq('id', invoiceId);
          
        if (updateError) {
          console.warn('Error updating invoice with PDF URL:', updateError);
        }
        
        // Try to download the newly generated PDF
        try {
          const response = await fetch(pdfUrl);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          
          const blob = await response.blob();
          if (blob.size === 0) throw new Error('Empty PDF file received');
          
          const safeInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-');
          const filename = `fatura-${safeInvoiceNumber}.pdf`;
          saveAs(blob, filename);
          
          // Refresh the list to update PDF URLs
          await fetchUnpaidInvoices();
          toast.success('PDF gerado e baixado com sucesso!');
        } catch (downloadError) {
          console.error('Error downloading newly generated PDF:', downloadError);
          toast.error('PDF gerado mas não foi possível baixar. Tente novamente.');
        }
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(`Erro ao gerar PDF: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsGenerating(prev => ({ ...prev, [invoiceId]: false }));
      toast.dismiss();
    }
  };

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string, pdfUrl: string | null) => {
    if (!pdfUrl) {
      // If no PDF URL exists, generate one
      await handleGeneratePdf(invoiceId, invoiceNumber);
      return;
    }

    try {
      setIsGenerating(prev => ({ ...prev, [invoiceId]: true }));
      toast.loading('Baixando PDF...');
      
      try {
        const response = await fetch(pdfUrl);
        
        if (!response.ok) {
          if (response.status === 404) {
            // If PDF not found, regenerate it
            toast.warning('PDF não encontrado. Gerando novamente...');
            await handleGeneratePdf(invoiceId, invoiceNumber);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Empty PDF file received');
        }
        
        const safeInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-');
        const filename = `fatura-${safeInvoiceNumber}.pdf`;
        saveAs(blob, filename);
        toast.success('PDF baixado com sucesso!');
      } catch (downloadError) {
        console.error(`Download failed:`, downloadError);
        toast.error('Erro ao baixar o PDF. Gerando novamente...');
        await handleGeneratePdf(invoiceId, invoiceNumber);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erro ao baixar o PDF. Tentando regenerar...');
      await handleGeneratePdf(invoiceId, invoiceNumber);
    } finally {
      setIsGenerating(prev => ({ ...prev, [invoiceId]: false }));
      toast.dismiss();
    }
  };

  if (isLoading) {
    return null; // or a loading skeleton
  }

  if (unpaidInvoices.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-none overflow-hidden rounded-2xl bg-gradient-to-b from-amber-50/80 to-amber-50/50">
      <CardHeader className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-b border-amber-100/50 pb-4">
        <CardTitle className="text-lg font-semibold text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Faturas Pendentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unpaidInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-col bg-white p-5 rounded-2xl border border-amber-100 shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg text-gray-800">Fatura #{invoice.invoice_number}</h3>
                  <p className="text-sm flex items-center gap-1 text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    Emitida em {formatDateTime(invoice.created_at)}
                  </p>
                </div>
                <div className="inline-block py-1 px-2 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                  Pendente
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm flex items-center gap-1 text-red-600 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  Vencimento: {formatDateTime(invoice.due_date)}
                </p>
              </div>
              
              <div className="flex items-end justify-between mt-auto pt-2">
                <p className="text-xl font-bold text-gray-900 flex items-center gap-1">
                  <CreditCard className="h-4 w-4 text-primary" />
                  {formatPrice(invoice.orders.total_amount)}
                </p>
                <div className="flex gap-2">                  {invoice.pdf_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPdf(invoice.id, invoice.invoice_number, invoice.pdf_url)}
                      disabled={isGenerating[invoice.id]}
                      className="rounded-xl border-primary/20 hover:bg-primary/5 transition-all duration-200 hover:scale-105"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  ) : (
                    <InvoicePdfGenerator
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.invoice_number}
                      buttonText="Gerar PDF"
                      onSuccess={(url) => {
                        // Atualizar o estado local com a nova URL
                        setUnpaidInvoices(prev => 
                          prev.map(inv => 
                            inv.id === invoice.id ? {...inv, pdf_url: url} : inv
                          )
                        );
                      }}
                      className="rounded-xl border-primary/20 hover:bg-primary/5 transition-all duration-200 hover:scale-105"
                    />
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (invoice.pdf_url) {
                        window.open(invoice.pdf_url, '_blank');
                      } else {
                        handleGeneratePdf(invoice.id, invoice.invoice_number);
                      }
                    }}
                    disabled={isGenerating[invoice.id]}
                    className="rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white hover:shadow-md transition-all duration-200 hover:scale-105"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    {invoice.pdf_url ? 'Imprimir' : 'Gerar PDF'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnpaidInvoicesList;
