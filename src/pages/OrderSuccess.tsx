import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceService } from '@/services/invoice';
// PDFGenerator removed - using print reference instead
import PaymentStatusChecker from '@/components/invoice/PaymentStatusChecker';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [bankInstructions, setBankInstructions] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const method = searchParams.get('method');

  useEffect(() => {
    const fetchOrderAndInvoice = async () => {
      try {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            payments (
              id,
              method,
              status,
              amount_paid,
              transaction_id
            ),
            payment_references (
              id,
              reference,
              amount,
              status,
              created_at
            )
          `)
          .eq('id', orderId);

        if (orderError) throw orderError;
        
        if (orderData && orderData.length > 0) {
          setOrder(orderData[0]);
          
          // Check if invoice exists for this order
          try {
            const { data: existingInvoice } = await supabase
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
              .eq('order_id', orderId)
              .single();

            if (existingInvoice) {
              setInvoice(existingInvoice);
              
            } else {
              // Generate invoice if it doesn't exist
              const invoiceResult = await InvoiceService.generateInvoice(orderId);
              if (invoiceResult?.success && invoiceResult?.invoice) {
                setInvoice(invoiceResult.invoice);
              }
            }
          } catch (invoiceError) {
            console.error('Error handling invoice:', invoiceError);
          }
        } else {
          toast.error('Pedido não encontrado');
        }

        // Fetch bank transfer instructions
        if (method === 'bank_transfer') {
          try {
            const { data: settings, error: settingsError } = await supabase
              .from('company_settings')
              .select('bank_transfer_instructions');

            if (settingsError) throw settingsError;
            
            if (settings && settings.length > 0) {
              setBankInstructions(settings[0]?.bank_transfer_instructions || '');
            }
          } catch (settingsErr) {
            console.error('Error fetching bank instructions:', settingsErr);
          }
        }
      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast.error('Erro ao carregar detalhes do pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndInvoice();
  }, [orderId, method]);

  const handlePrintInvoice = async () => {
    if (!invoice) {
      toast.error('Fatura não disponível');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      
      // Buscar dados completos da fatura
      const { data: completeInvoice } = await supabase
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
        .eq('id', invoice.id)
        .single();
        
      if (completeInvoice) {
        const { downloadHelpers } = await import("@/utils/downloadHelpers");
        await downloadHelpers.printInvoiceDirectly(completeInvoice);
        toast.success('Abrindo janela de impressão...');
      }
    } catch (error: any) {
      console.error('Error printing invoice:', error);
      toast.error('Erro ao imprimir fatura');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pedido não encontrado</h2>
          <p className="text-gray-600 mb-4">
            Não foi possível encontrar os detalhes deste pedido.
          </p>
          <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a página inicial
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card className="p-6">
        <div className="text-center mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pedido Recebido!</h2>
          <p className="text-gray-600">
            Seu pedido #{orderId?.substring(0, 8)} foi registrado com sucesso.
          </p>
        </div>

        {(method === 'bank_transfer' || method === 'appypay_reference') && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-blue-900 flex items-center">
              <img 
                src="/lovable-uploads/f8d6177e-8235-4942-af13-8da5c89452a9.png" 
                alt="Multicaixa" 
                className="mr-2 h-6 w-6 object-contain"
              />
              Pagamento por Referência Multicaixa
            </h3>
            
            <div className="text-blue-800 space-y-2 text-sm">
              <p><strong>Entidade:</strong> 11333</p>
              <p><strong>Referência:</strong> {
                order?.payment_references && order.payment_references.length > 0 
                  ? order.payment_references.sort((a, b) => 
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0].reference 
                  : 'Indisponível'
              }</p>
              <p><strong>Valor:</strong> {order?.total_amount?.toLocaleString('pt-PT')} Kz</p>
              <p><strong>Validade:</strong> 2 dias após geração</p>
            </div>
            
            <p className="mt-4 text-sm text-blue-700">
              <strong>Instruções:</strong> Use ATM, Internet Banking, Multicaixa Express ou Balcão Bancário
            </p>
          </div>
        )}

        {method === 'multicaixa' && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-green-900">
              Pagamento via Multicaixa Express
            </h3>
            <p className="text-green-800">
              Por favor, siga as instruções no seu aplicativo Multicaixa Express
              para completar o pagamento.
            </p>
          </div>
        )}

        {/* Invoice print section */}
        {invoice && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Fatura</h3>
            <p className="text-sm text-gray-600 mb-4">
              Sua fatura está disponível para impressão.
            </p>
            <Button
              onClick={handlePrintInvoice}
              disabled={isGeneratingPdf}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Abrindo...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Fatura
                </>
              )}
            </Button>
          </div>
        )}

        {/* Payment Status Checker for AppyPay Reference */}
        {(method === 'appypay_reference' || method === 'bank_transfer') && order && (
          <div className="mt-6">
            <PaymentStatusChecker 
              orderId={order.id}
              autoRefresh={true}
              onStatusChange={(status) => {
                if (status.paymentStatus === 'confirmed') {
                  // Refresh the page to show updated status
                  window.location.reload();
                }
              }}
            />
          </div>
        )}

        <div className="mt-6 space-y-4">
          <Button 
            onClick={() => navigate('/customer/invoices')} 
            variant="outline" 
            className="w-full"
          >
            Ver Meus Pedidos
          </Button>
          <Button 
            onClick={() => navigate('/')} 
            variant="ghost" 
            className="w-full"
          >
            Voltar para a página inicial
          </Button>
        </div>
      </Card>
    </div>
  );
}
