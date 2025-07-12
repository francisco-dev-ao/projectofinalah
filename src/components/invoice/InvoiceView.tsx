import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Printer, Loader2 } from 'lucide-react';
import { InvoiceDownloadButton } from './InvoiceDownloadButton';
import { InvoicePrintButton } from './InvoicePrintButton';
import { toast } from 'sonner';
import { getInvoiceItems } from '@/utils/invoice/getInvoiceItems';
import axios from 'axios';

// Define interface for invoice items
interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_name: string;
  service_description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  start_date?: string;
  end_date?: string;
}

// Define extended Invoice type with orders property
interface InvoiceWithOrders extends Invoice {
  orders?: {
    total_amount: number;
    rf_tax: number;
    profiles?: {
      name: string;
      email: string;
      address?: string;
      phone?: string;
      nif?: string;
      tax_id?: string;
      company_name?: string;
    }
  };
}

interface InvoiceViewProps {
  invoiceId: string;
}

const InvoiceView = ({ invoiceId }: InvoiceViewProps) => {
  const [invoice, setInvoice] = useState<InvoiceWithOrders | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [subtotal, setSubtotal] = useState(0);

  const fetchInvoiceData = async () => {
    setIsLoading(true);
    try {
      // Fetch the invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            rf_tax,
            profiles (*)
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) {
        console.error(invoiceError);
        toast.error("Erro ao carregar a fatura");
        throw invoiceError;
      }
      
      setInvoice(invoiceData as InvoiceWithOrders);

      // Fetch invoice items using RPC function
      try {
        const { data: itemsData, error: rpcError } = await supabase.rpc(
          'get_invoice_items',
          { invoice_id: invoiceId }
        );
        
        if (rpcError) {
          console.error("RPC Error:", rpcError);
          // Fallback to fetch order items directly
          await fetchOrderItems(invoiceData.order_id);
        } else if (itemsData && Array.isArray(itemsData) && itemsData.length > 0) {
          processItems(itemsData);
        } else {
          // If no items from RPC, try fallback
          await fetchOrderItems(invoiceData.order_id);
        }
      } catch (rpcError) {
        console.error("Error with RPC call:", rpcError);
        // Fallback to fetch order items directly
        await fetchOrderItems(invoiceData.order_id);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error("Erro ao carregar os dados da fatura");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products:product_id (*)
        `)
        .eq('order_id', orderId);

      if (itemsError) {
        console.error("Order items error:", itemsError);
        throw itemsError;
      }

      if (itemsData && Array.isArray(itemsData)) {
        processItems(itemsData.map(item => ({
          id: item.id,
          invoice_id: invoiceId,
          service_name: item.name || item.products?.name || 'Serviço',
          service_description: item.description || item.products?.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || item.price || 0,
          subtotal: item.total || (item.quantity * (item.unit_price || item.price)) || 0,
          start_date: item.start_date || '',
          end_date: item.end_date || ''
        })));
      }
    } catch (error) {
      console.error("Error fetching order items:", error);
      setItems([]);
    }
  };

  const processItems = (data: any[]) => {
    // Transform the data to match our InvoiceItem interface
    const formattedItems = data.map((item: any) => ({
      id: item.id,
      invoice_id: invoiceId,
      service_name: item.service_name || item.name || 'Serviço',
      service_description: item.service_description || item.description || '',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || item.price || 0,
      subtotal: item.subtotal || (item.quantity * (item.unit_price || item.price)) || item.total || 0,
      start_date: item.start_date || '',
      end_date: item.end_date || ''
    }));
    
    setItems(formattedItems);
    
    // Calculate subtotal
    const calculatedSubtotal = formattedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setSubtotal(calculatedSubtotal);
  };

  const handlePrintInvoice = async () => {
    try {
      setIsPrinting(true);
      console.log("Printing invoice:", invoiceId);
      
      const { downloadHelpers } = await import("@/utils/downloadHelpers");
      
      // Buscar dados completos da fatura
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            profiles:user_id (*),
            payment_references (*),
            order_items (*)
          )
        `)
        .eq('id', invoiceId)
        .single();
        
      if (error) throw new Error(`Erro ao carregar fatura: ${error.message}`);
      
      // Imprimir fatura sem exigir referência de pagamento
      await downloadHelpers.printInvoiceDirectly(invoiceData, false);
      toast.success("Abrindo janela de impressão...");
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Erro ao imprimir fatura");
    } finally {
      setIsPrinting(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando fatura...</div>;
  }

  if (!invoice) {
    return <div className="flex justify-center p-8">Fatura não encontrada.</div>;
  }

  // Calculate totals
  const taxAmount = invoice.orders?.rf_tax || 0;
  const totalAmount = invoice.orders?.total_amount || subtotal + taxAmount;

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">Fatura #{invoice.invoice_number}</h2>
          <p className="text-gray-500">
            Emitida em {format(new Date(invoice.created_at), 'dd/MM/yyyy')}
          </p>
          {invoice.due_date && (
            <p className="text-gray-500">
              Vencimento {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
            </p>
          )}
        </div>
        <Badge 
          variant={
            invoice.status === 'paid' ? 'default' : 
            invoice.status === 'canceled' ? 'destructive' : 'secondary'
          }
          className="text-sm"
        >
          {invoice.status === 'draft' && 'Rascunho'}
          {invoice.status === 'issued' && 'Emitida'}
          {invoice.status === 'paid' && 'Paga'}
          {invoice.status === 'canceled' && 'Cancelada'}
        </Badge>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="font-medium mb-2">De</h3>
          <div className="whitespace-pre-line text-sm text-gray-600">
            {invoice.company_details || 'Detalhes da empresa não disponíveis'}
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">Para</h3>
          <div className="text-sm text-gray-600">
            {invoice.orders?.profiles?.name && <p>{invoice.orders.profiles.name}</p>}
            {invoice.orders?.profiles?.company_name && <p>{invoice.orders.profiles.company_name}</p>}
            {invoice.orders?.profiles?.address && <p>{invoice.orders.profiles.address}</p>}
            {invoice.orders?.profiles?.nif && <p>NIF: {invoice.orders.profiles.nif}</p>}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unit.</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium">{item.service_name}</div>
                    <div className="text-gray-500">{item.service_description}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {item.start_date && item.end_date ? (
                      <>
                        {format(new Date(item.start_date), 'dd/MM/yyyy')} a {format(new Date(item.end_date), 'dd/MM/yyyy')}
                      </>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">{item.quantity}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    KZ {new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(item.unit_price)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    KZ {new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(item.subtotal || (item.quantity * item.unit_price))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                  Nenhum item encontrado para esta fatura.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}></td>
              <td className="px-4 py-4 text-right text-sm font-medium">Total</td>
              <td className="px-4 py-4 text-right text-sm font-medium">
                KZ {new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {invoice.payment_instructions && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">Instruções de Pagamento</h3>
          <div className="whitespace-pre-line text-sm text-gray-600 border p-3 rounded">
            {invoice.payment_instructions}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 mt-6">
        <InvoicePrintButton invoiceId={invoice.id} invoiceNumber={invoice.invoice_number} />
        <Button
          size="sm"
          onClick={handlePrintInvoice}
          disabled={isPrinting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isPrinting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Abrindo...
            </>
          ) : (
            <>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default InvoiceView;
