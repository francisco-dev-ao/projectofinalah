import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InvoiceService } from '@/services/invoiceService';
import { toast } from 'react-hot-toast';
import { downloadHelpers } from '@/utils/downloadHelpers';

interface OrderInvoicesProps {
  orderId: string;
}

export default function OrderInvoices({ orderId }: OrderInvoicesProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [printingInvoiceId, setPrintingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [orderId]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setIsGenerating(true);
      const { invoice } = await InvoiceService.processInvoiceForOrder(orderId);
      toast.success('Fatura gerada com sucesso!');
      fetchInvoices();
    } catch (error: any) {
      console.error('Erro ao gerar fatura:', error);
      toast.error(error.message || 'Erro ao gerar fatura');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintInvoice = async (invoice: any) => {
    try {
      setPrintingInvoiceId(invoice.id);
      const data = await InvoiceService.getInvoice(invoice.id);
      await downloadHelpers.printInvoiceDirectly(data);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao imprimir fatura');
    } finally {
      setPrintingInvoiceId(null);
    }
  };

  const handleDownloadPdf = async (invoice: any) => {
    try {
      setActiveInvoiceId(invoice.id);
      const data = await InvoiceService.getInvoice(invoice.id);
      await downloadHelpers.downloadInvoicePDF(data);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao baixar PDF');
    } finally {
      setActiveInvoiceId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Faturas</h3>
        {invoices.length === 0 && (
          <Button 
            onClick={handleGenerateInvoice} 
            disabled={isGenerating} 
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar Fatura'
            )}
          </Button>
        )}
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma fatura encontrada para este pedido.</p>
      ) : (
        <div className="bg-white rounded-md border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    KZ {new Intl.NumberFormat('pt-PT', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      useGrouping: true
                    }).format(invoice.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                      invoice.status === 'unpaid' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status === 'paid' ? 'Pago' : 
                       invoice.status === 'unpaid' ? 'Não Pago' :
                       invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrintInvoice(invoice)}
                        disabled={printingInvoiceId === invoice.id}
                        title="Imprimir Fatura"
                      >
                        {printingInvoiceId === invoice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Printer className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPdf(invoice)}
                        disabled={activeInvoiceId === invoice.id}
                        title="Baixar PDF"
                      >
                        {activeInvoiceId === invoice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {invoice.pdf_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="Ver PDF Online"
                        >
                          <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}