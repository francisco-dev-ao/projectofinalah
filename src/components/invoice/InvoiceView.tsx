import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Printer, Loader2 } from 'lucide-react';
import { PrintReferenceButton } from './PrintReferenceButton';
import { toast } from 'sonner';
import { getInvoiceItems } from '@/utils/invoice/getInvoiceItems';
import axios from 'axios';

// Define interface for invoice items that matches the component needs
interface InvoiceItemLocal {
  id: string;
  invoice_id: string;
  service_name: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  duration?: number;
  duration_unit?: string;
}

// Extended Invoice type with orders
interface InvoiceWithOrders extends Invoice {
  orders?: {
    profiles?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    payment_references?: Array<{
      entity: string;
      reference: string;
    }>;
  };
}

interface InvoiceViewProps {
  invoiceId: string;
}

export default function InvoiceView({ invoiceId }: InvoiceViewProps) {
  const [invoice, setInvoice] = useState<InvoiceWithOrders | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch invoice data
      const { data: invoiceData, error: invoiceError } = await supabase
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

      if (invoiceError) {
        console.error('Error fetching invoice:', invoiceError);
        setError('Erro ao carregar dados da fatura');
        return;
      }

      if (!invoiceData) {
        setError('Fatura não encontrada');
        return;
      }

      setInvoice(invoiceData);

      // Fetch invoice items using the utility function
      const items = await getInvoiceItems(invoiceId);
      // Map to local interface with safe property access
      const mappedItems: InvoiceItemLocal[] = items.map(item => ({
        id: item.id || '',
        invoice_id: item.invoice_id,
        service_name: item.service_name,
        description: (item as any).description || null,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: (item.quantity || 1) * (item.unit_price || 0),
        duration: (item as any).duration,
        duration_unit: (item as any).duration_unit
      }));
      setInvoiceItems(mappedItems);

    } catch (error: any) {
      console.error('Error in fetchInvoiceData:', error);
      setError('Erro ao carregar dados da fatura');
      toast.error('Erro ao carregar dados da fatura');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando fatura...</span>
        </div>
      </Card>
    );
  }

  if (error || !invoice) {
    return (
      <Card className="p-8">
        <div className="text-center text-red-600">
          {error || 'Fatura não encontrada'}
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Fatura</h1>
            <p className="text-gray-600">#{invoice.invoice_number}</p>
          </div>
          <div className="flex gap-2">
            <PrintReferenceButton 
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoice_number}
            />
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-2">De:</h3>
            <div className="text-gray-600">
              <p>AngoHost</p>
              <p>Luanda, Angola</p>
              <p>support@angohost.ao</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Para:</h3>
            <div className="text-gray-600">
              {invoice.orders?.profiles ? (
                <>
                  <p>{invoice.orders.profiles.name}</p>
                  <p>{invoice.orders.profiles.email}</p>
                  {invoice.orders.profiles.phone && <p>{invoice.orders.profiles.phone}</p>}
                </>
              ) : (
                <p>Cliente não especificado</p>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Invoice Info */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <p className="text-sm text-gray-600">Data da Fatura</p>
            <p className="font-semibold">{format(new Date(invoice.created_at), 'dd/MM/yyyy')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Vencimento</p>
            <p className="font-semibold">{format(new Date(invoice.due_date || invoice.created_at), 'dd/MM/yyyy')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
              {invoice.status === 'paid' ? 'Paga' : 'Pendente'}
            </Badge>
          </div>
        </div>

        {/* Items Table */}
        <div className="border rounded-lg overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Descrição</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Preço Unit.</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{item.service_name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      {item.duration && (
                        <p className="text-xs text-gray-500">
                          Duração: {item.duration} {item.duration_unit === 'month' ? 'mês(es)' : item.duration_unit}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">KZ {item.unit_price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right font-medium">KZ {item.total_price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span>Subtotal:</span>
              <span>KZ {(invoice.amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
            </div>
            <Separator />
            <div className="flex justify-between py-2 font-bold text-lg">
              <span>Total:</span>
              <span>KZ {(invoice.amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {invoice.orders?.payment_references && invoice.orders.payment_references.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Informações de Pagamento</h4>
            <div className="text-sm text-gray-600">
              <p><strong>Entidade:</strong> {invoice.orders.payment_references[0].entity}</p>
              <p><strong>Referência:</strong> {invoice.orders.payment_references[0].reference}</p>
              <p><strong>Valor:</strong> KZ {(invoice.amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
              <p className="mt-2 text-xs">Pagamento via ATM, Internet Banking ou Multicaixa Express</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}