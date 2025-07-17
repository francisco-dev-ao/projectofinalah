
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft } from 'lucide-react';
import { PrintReferenceButton } from '@/components/invoice/PrintReferenceButton';
import { formatPrice } from '@/lib/utils';

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
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
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setInvoice(data);
      } catch (error) {
        console.error('Erro ao carregar fatura:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoice();
  }, [id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout>
        <div className="text-center py-10">
          <h2 className="text-xl">Fatura não encontrada</h2>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Fatura #{invoice.invoice_number}</h1>
          </div>
          <div className="flex gap-2">
            <PrintReferenceButton 
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoice_number}
            />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Informações da Fatura</h2>
              <p><span className="font-medium">Nº da Fatura:</span> {invoice.invoice_number}</p>
              <p><span className="font-medium">Data de Emissão:</span> {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
              <p><span className="font-medium">Data de Vencimento:</span> {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
              <p>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                  invoice.status === 'unpaid' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {invoice.status === 'paid' ? 'Pago' : 
                   invoice.status === 'unpaid' ? 'Não Pago' :
                   invoice.status === 'draft' ? 'Pendente' : invoice.status}
                </span>
              </p>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2">Cliente</h2>
              <p><span className="font-medium">Nome:</span> {invoice.orders?.profiles?.name || invoice.orders?.profiles?.company_name}</p>
              <p><span className="font-medium">Email:</span> {invoice.orders?.profiles?.email}</p>
              {invoice.orders?.profiles?.phone && (
                <p><span className="font-medium">Telefone:</span> {invoice.orders?.profiles?.phone}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Unit.</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.orders?.order_items?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.description || '-'}</td>
                  <td className="px-6 py-4">{item.quantity}</td>
                  <td className="px-6 py-4 text-right">{formatPrice(item.unit_price)}</td>
                  <td className="px-6 py-4 text-right">{formatPrice(item.unit_price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-6 py-3 text-right font-semibold">Total</td>
                <td className="px-6 py-3 text-right font-semibold">
                  {formatPrice(invoice.amount || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {invoice.payment_instructions && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Instruções de Pagamento</h2>
            <div className="whitespace-pre-line">{invoice.payment_instructions}</div>
          </div>
        )}
      </div>
    </Layout>
  );
}
