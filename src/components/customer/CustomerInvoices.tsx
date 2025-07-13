
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Eye, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PrintReferenceButton } from '@/components/invoice/PrintReferenceButton';
import { invoiceService } from '@/services/invoiceService';
import { formatPrice } from '@/lib/utils';
// PDF generation removed - using print reference system

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            id,
            user_id,
            total_amount,
            status,
            created_at,
            order_items (
              id,
              name,
              description,
              unit_price,
              quantity,
              duration,
              duration_unit
            )
          )
        `)
        .eq('orders.user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }
      
      const processedInvoices = (data || []).map(invoice => {
        let calculatedAmount = invoice.amount;
        
        if (!calculatedAmount || calculatedAmount === 0) {
          if (invoice.orders?.total_amount) {
            calculatedAmount = invoice.orders.total_amount;
          } else if (invoice.orders?.order_items) {
            calculatedAmount = invoice.orders.order_items.reduce((sum: number, item: any) => {
              const itemPrice = item.unit_price || 0;
              const itemQuantity = item.quantity || 1;
              return sum + (itemPrice * itemQuantity);
            }, 0);
          }
        }
        
        return {
          ...invoice,
          calculated_amount: calculatedAmount
        };
      });
      
      setInvoices(processedInvoices);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
      toast.error('Erro ao carregar suas faturas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (invoice: any) => {
    try {
      setLoadingInvoiceId(invoice.id);
      
      // Get current user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get user profile for customer data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      const customerData = {
        name: profile?.full_name || user.email?.split('@')[0] || 'Cliente',
        email: user.email || '',
        phone: profile?.phone
      };

      // PDF generation removed - redirect to print reference
      toast.error('Download de PDF removido. Use a opção "Imprimir Referência" na página de detalhes da fatura.');
    } catch (error: any) {
      console.error('Erro ao processar PDF:', error);
      toast.error(error.message || 'Erro ao processar PDF');
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Minhas Faturas</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-lg p-6 shadow text-center">
          <p className="text-gray-600">Você ainda não possui faturas.</p>
        </div>
      ) : (
        <>
          {/* Mobile view - Card layout */}
          <div className="block lg:hidden space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-lg shadow p-4 border">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      Fatura #{invoice.invoice_number || '--'}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(invoice)}
                      disabled={loadingInvoiceId === invoice.id}
                      className="p-2"
                    >
                      {loadingInvoiceId === invoice.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="p-2"
                    >
                      <Link to={`/customer/invoices/${invoice.id}`}>
                        <Eye className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
                
                {/* Services info for mobile */}
                <div className="mb-3">
                  {invoice.orders?.order_items?.length > 0 ? (
                    <div className="space-y-1">
                      {invoice.orders.order_items.slice(0, 2).map((item: any, index: number) => (
                        <div key={item.id || index} className="text-xs">
                          <span className="font-medium text-gray-900">{item.name}</span>
                          {item.description && (
                            <p className="text-gray-500">{item.description}</p>
                          )}
                          {item.duration && item.duration_unit && (
                            <p className="text-gray-400">
                              {item.duration} {item.duration_unit === 'month' ? 'mês(es)' : 
                                               item.duration_unit === 'year' ? 'ano(s)' : 
                                               item.duration_unit}
                            </p>
                          )}
                        </div>
                      ))}
                      {invoice.orders.order_items.length > 2 && (
                        <p className="text-xs text-gray-400">+{invoice.orders.order_items.length - 2} mais</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">--</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm font-bold text-gray-900">
                    {formatPrice(invoice.calculated_amount || invoice.amount || 0)}
                  </div>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                    invoice.status === 'unpaid' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.status === 'paid' ? 'Pago' : 
                     invoice.status === 'unpaid' ? 'Não Pago' :
                     invoice.status === 'draft' ? 'Pendente' : invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view - Table layout */}
          <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
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
                      Serviços
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
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.invoice_number || '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          {invoice.orders?.order_items?.length > 0 ? (
                            <div className="space-y-1">
                              {invoice.orders.order_items.slice(0, 2).map((item: any, index: number) => (
                                <div key={item.id || index} className="text-sm">
                                  <span className="font-medium">{item.name}</span>
                                  {item.description && (
                                    <p className="text-gray-500 text-xs">{item.description}</p>
                                  )}
                                  {item.duration && item.duration_unit && (
                                    <p className="text-gray-400 text-xs">
                                      {item.duration} {item.duration_unit === 'month' ? 'mês(es)' : 
                                                       item.duration_unit === 'year' ? 'ano(s)' : 
                                                       item.duration_unit}
                                    </p>
                                  )}
                                </div>
                              ))}
                              {invoice.orders.order_items.length > 2 && (
                                <p className="text-xs text-gray-400">+{invoice.orders.order_items.length - 2} mais</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">--</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatPrice(invoice.calculated_amount || invoice.amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          invoice.status === 'unpaid' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status === 'paid' ? 'Pago' : 
                           invoice.status === 'unpaid' ? 'Não Pago' :
                           invoice.status === 'draft' ? 'Pendente' : invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(invoice)}
                            disabled={loadingInvoiceId === invoice.id}
                          >
                            {loadingInvoiceId === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link to={`/customer/invoices/${invoice.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
