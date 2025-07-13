import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { InvoiceService } from '@/services/invoiceService';
import { Link } from 'react-router-dom';
import { FileText, Home, List } from 'lucide-react';
// PDFGenerator removed - using print reference instead
import { downloadHelpers } from '@/utils/downloadHelpers';
import { storageUtils } from '@/utils/storageUtils';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const method = searchParams.get('method');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const processOrder = async () => {
      if (!orderId) return;

      try {
        setIsLoading(true);
        
        // 1. Buscar detalhes do pedido
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*, profiles:user_id(*)')
          .eq('id', orderId)
          .single();
          
        if (orderError) throw new Error(`Erro ao buscar detalhes do pedido: ${orderError.message}`);
        if (!orderData) throw new Error('Pedido não encontrado');
        
        setOrderDetails(orderData);
        
        // 2. Verificar se é transferência bancária
        const isTransfer = method === 'bank_transfer' || orderData.payment_method === 'bank_transfer';
        
        // 3. Se for transferência bancária, gerar fatura
        if (isTransfer) {
          console.log('Gerando fatura para pagamento por transferência bancária...');

          // Verificar se o bucket existe ou criar
          await storageUtils.ensureStorageBucket('invoices');
          
          // Processar fatura usando o InvoiceService
          const { invoice: invoiceData, pdfUrl: url } = await InvoiceService.processInvoiceForOrder(orderId as string);
          
          setInvoice(invoiceData);
          setPdfUrl(url);
          
          toast.success('Instruções de pagamento enviadas. Uma fatura foi gerada e estará disponível após confirmação do pagamento.');
        }
      } catch (error: any) {
        console.error('Erro ao processar pedido:', error);
        toast.error(error.message || 'Erro ao processar pedido');
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      processOrder();
    }
  }, [orderId, method]);

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      
      if (!invoice) {
        // Se por algum motivo não temos a invoice salva no estado, buscamos novamente
        const { data, error } = await supabase
          .from('invoices')
          .select('id')
          .eq('order_id', orderId)
          .single();
          
        if (error || !data) throw new Error('Fatura não encontrada');
        
        // Busca a fatura completa
        const invoiceData = await InvoiceService.getInvoice(data.id);
        
        // Usa a mesma lógica do PrintReferenceButton
        await downloadHelpers.printInvoiceDirectly(invoiceData);
      } else {
        // Se já temos a invoice no estado, usamos ela diretamente
        await downloadHelpers.printInvoiceDirectly(invoice);
      }
      
      toast.success('Abrindo janela de impressão...');
    } catch (error: any) {
      console.error('Erro ao imprimir fatura:', error);
      toast.error(error.message || 'Erro ao imprimir fatura');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900">Pedido Recebido!</h2>
              
              {orderDetails && (
                <p className="mt-2 text-gray-600">
                  Seu pedido #{orderId?.toString().substring(0, 8)} foi registrado com sucesso.
                </p>
              )}

              {method === 'bank_transfer' && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4 w-full">
                  <h3 className="text-lg font-medium text-blue-800 mb-3">
                    Pagamento por Referência Multicaixa
                  </h3>
                  
                  <div className="text-sm text-blue-700 space-y-2">
                    <p><strong>Entidade:</strong> 11333</p>
                    <p><strong>Referência:</strong> {
                      orderDetails?.payment_references && orderDetails.payment_references.length > 0
                        ? orderDetails.payment_references.sort((a, b) => 
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                          )[0].reference
                        : 'Indisponível'
                    }</p>
                    <p><strong>Valor:</strong> {orderDetails?.total_amount?.toLocaleString('pt-PT')} Kz</p>
                    <p><strong>Validade:</strong> 2 dias após geração</p>
                  </div>
                  
                  <div className="mt-3 text-sm text-blue-700 font-medium">
                    <p>Use ATM, Internet Banking, Multicaixa Express ou Balcão Bancário para efetuar o pagamento</p>
                  </div>
                </div>
              )}

              {pdfUrl && (
                <div className="mt-6 w-full">
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="w-full"
                  >
                    {isGeneratingPdf ? 'Abrindo...' : 'Imprimir Fatura'}
                  </Button>
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Uma fatura final será gerada após a confirmação do pagamento
                  </p>
                </div>
              )}

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4 w-full">
                <div className="flex items-center">
                  <div className="text-yellow-600 mr-3">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      📧 Fatura Final Certificada
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      A fatura final certificada pela AGT chegará automaticamente pelo seu email após o pagamento ser confirmado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 w-full">
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Voltar para a página inicial
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/account/orders">
                    <List className="mr-2 h-4 w-4" />
                    Ver Meus Pedidos
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
