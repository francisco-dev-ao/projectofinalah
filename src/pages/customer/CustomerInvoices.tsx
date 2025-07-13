
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import InvoicePdfGenerator from '@/components/invoice/InvoicePdfGenerator';
import { formatPrice } from '@/lib/utils';

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Usuário não autenticado");
      
      console.log('CustomerInvoices: Buscando faturas para usuário:', user.id);
      
      // Buscar faturas que pertencem ao usuário através do order_id
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders!inner(
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
        .not('order_id', 'is', null) // Garantir que a fatura tem um order_id
        .order('created_at', { ascending: false });
        
      console.log('CustomerInvoices: Faturas do usuário:', data?.length || 0);
      console.log('CustomerInvoices: Dados das faturas:', data);
        
      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }
      
      // Filtrar faturas que realmente pertencem ao usuário
      const userInvoices = (data || []).filter(invoice => {
        // Verificar se a fatura tem um pedido válido que pertence ao usuário
        if (!invoice.orders) {
          console.log('CustomerInvoices: Fatura sem pedido:', invoice.id);
          return false;
        }
        
        if (invoice.orders.user_id !== user.id) {
          console.log('CustomerInvoices: Fatura com pedido de outro usuário:', invoice.id, invoice.orders.user_id, user.id);
          return false;
        }
        
        // Verificar se não é uma fatura de exemplo
        if (invoice.invoice_number && (
          invoice.invoice_number.includes('EXAMPLE') || 
          invoice.invoice_number.includes('DEMO') || 
          invoice.invoice_number.includes('TEST')
        )) {
          console.log('CustomerInvoices: Fatura de exemplo detectada:', invoice.invoice_number);
          return false;
        }
        
        return true;
      });
      
      console.log('CustomerInvoices: Faturas filtradas:', userInvoices.length);
      
      const processedInvoices = userInvoices.map(invoice => {
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
        
        const processedItems = invoice.orders?.order_items?.map((item: any) => {
          let description = item.description || '';
          
          if (item.duration && item.duration_unit) {
            const durationText = `${item.duration} ${item.duration_unit === 'month' ? 'mês(es)' : 
                                                    item.duration_unit === 'year' ? 'ano(s)' : 
                                                    item.duration_unit === 'day' ? 'dia(s)' : item.duration_unit}`;
            description = description ? `${description} - Duração: ${durationText}` : `Duração: ${durationText}`;
          }
          
          return {
            ...item,
            enhanced_description: description,
            display_name: item.name || 'Serviço'
          };
        }) || [];
        
        return {
          ...invoice,
          calculated_amount: calculatedAmount,
          enhanced_items: processedItems
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

  // Função para limpar dados de exemplo (apenas para administradores)
  const clearDemoData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // Verificar se o usuário é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role !== 'admin') {
        console.log('CustomerInvoices: Usuário não é admin, não pode limpar dados de exemplo');
        return;
      }
      
      console.log('CustomerInvoices: Limpando dados de exemplo...');
      
      // Deletar faturas de exemplo
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .or('invoice_number.ilike.%EXAMPLE%,invoice_number.ilike.%DEMO%,invoice_number.ilike.%TEST%');
      
      if (deleteError) {
        console.error('CustomerInvoices: Erro ao deletar faturas de exemplo:', deleteError);
      } else {
        console.log('CustomerInvoices: Dados de exemplo limpos com sucesso');
        // Recarregar faturas
        fetchInvoices();
      }
    } catch (error) {
      console.error('CustomerInvoices: Erro ao limpar dados de exemplo:', error);
    }
  };

  // Função para verificar e corrigir faturas órfãs (apenas para administradores)
  const checkOrphanedInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // Verificar se o usuário é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role !== 'admin') {
        console.log('CustomerInvoices: Usuário não é admin, não pode verificar faturas órfãs');
        return;
      }
      
      console.log('CustomerInvoices: Verificando faturas órfãs...');
      
      // Buscar todas as faturas para análise
      const { data: allInvoices, error: allError } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            id,
            user_id
          )
        `)
        .order('created_at', { ascending: false });
      
      if (allError) {
        console.error('CustomerInvoices: Erro ao buscar todas as faturas:', allError);
        return;
      }
      
      console.log('CustomerInvoices: Total de faturas no sistema:', allInvoices?.length || 0);
      
      // Analisar faturas
      const orphanedInvoices = allInvoices?.filter(invoice => !invoice.order_id) || [];
      const demoInvoices = allInvoices?.filter(invoice => 
        invoice.invoice_number && (
          invoice.invoice_number.includes('EXAMPLE') || 
          invoice.invoice_number.includes('DEMO') || 
          invoice.invoice_number.includes('TEST')
        )
      ) || [];
      const invalidInvoices = allInvoices?.filter(invoice => 
        invoice.order_id && !invoice.orders
      ) || [];
      
      console.log('CustomerInvoices: Análise das faturas:', {
        total: allInvoices?.length || 0,
        orphaned: orphanedInvoices.length,
        demo: demoInvoices.length,
        invalid: invalidInvoices.length
      });
      
      // Deletar faturas órfãs e de exemplo
      const invoicesToDelete = [...orphanedInvoices, ...demoInvoices];
      
      if (invoicesToDelete.length > 0) {
        const invoiceIds = invoicesToDelete.map(invoice => invoice.id);
        
        const { error: deleteError } = await supabase
          .from('invoices')
          .delete()
          .in('id', invoiceIds);
        
        if (deleteError) {
          console.error('CustomerInvoices: Erro ao deletar faturas problemáticas:', deleteError);
          toast.error('Erro ao limpar faturas problemáticas');
        } else {
          console.log('CustomerInvoices: Faturas problemáticas removidas com sucesso');
          toast.success(`${invoicesToDelete.length} faturas problemáticas foram removidas`);
          // Recarregar faturas
          fetchInvoices();
        }
      } else {
        console.log('CustomerInvoices: Nenhuma fatura problemática encontrada');
        toast.success('Nenhuma fatura problemática encontrada');
      }
    } catch (error) {
      console.error('CustomerInvoices: Erro ao verificar faturas órfãs:', error);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Minhas Faturas</h2>
            <p className="text-gray-600 mt-1">Gerencie e visualize suas faturas</p>
          </div>
          {/* Botões para administradores */}
          <div className="flex gap-2">
            <button
              onClick={checkOrphanedInvoices}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              title="Verificar faturas órfãs (apenas para administradores)"
            >
              Verificar Faturas Órfãs
            </button>
            <button
              onClick={clearDemoData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              title="Limpar dados de exemplo (apenas para administradores)"
            >
              Limpar Dados de Exemplo
            </button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-lg p-8 shadow text-center">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma fatura encontrada</h3>
            <p className="text-gray-600 mb-4">
              Você ainda não possui faturas. As faturas aparecerão aqui após você fazer pedidos.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Fazer meu primeiro pedido
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      Fatura #{invoice.invoice_number || invoice.id.substring(0, 8)}
                    </h3>
                    <span className={`mt-2 sm:mt-0 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                      invoice.status === 'unpaid' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {invoice.status === 'paid' ? 'Pago' : 
                       invoice.status === 'unpaid' ? 'Não Pago' :
                       invoice.status === 'draft' ? 'Pendente' : invoice.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Data:</span> {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    <div>
                      <span className="font-medium">Valor:</span> 
                      <span className="text-lg font-bold text-gray-900 ml-1">
                        {formatPrice(invoice.calculated_amount || invoice.amount || 0)}
                      </span>
                    </div>
                  </div>
                  
                  {invoice.enhanced_items && invoice.enhanced_items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium mb-3 text-gray-900">Serviços incluídos:</h4>
                      <div className="space-y-2">
                        {invoice.enhanced_items.slice(0, 3).map((item: any, index: number) => (
                          <div key={item.id || index} className="flex justify-between items-start text-sm">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium block text-gray-900">{item.display_name}</span>
                              {item.enhanced_description && (
                                <p className="text-gray-500 text-xs mt-1 truncate">{item.enhanced_description}</p>
                              )}
                            </div>
                            <div className="ml-4 text-right shrink-0">
                              <span className="text-xs text-gray-500">Qtd: {item.quantity}</span>
                              <p className="font-medium text-gray-900">{formatPrice(item.unit_price * item.quantity)}</p>
                            </div>
                          </div>
                        ))}
                        {invoice.enhanced_items.length > 3 && (
                          <p className="text-xs text-gray-400">+{invoice.enhanced_items.length - 3} serviços adicionais</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const { downloadHelpers } = await import("@/utils/downloadHelpers");
                        await downloadHelpers.printInvoiceDirectly(invoice);
                        toast.success('Abrindo janela de impressão...');
                      } catch (error) {
                        toast.error('Erro ao imprimir fatura');
                      }
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="flex items-center gap-2"
                  >
                    <Link to={`/customer/invoices/${invoice.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Ver</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
