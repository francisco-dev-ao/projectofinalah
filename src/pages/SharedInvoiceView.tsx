import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { FileText, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { useInvoiceBucket } from '@/hooks/useInvoiceBucket';
import { saveAs } from 'file-saver';

const SharedInvoiceView = () => {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { isInitializing, isInitialized, initializeInvoiceBucket } = useInvoiceBucket();

  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initializeInvoiceBucket();
    }
    
    if (token) {
      fetchInvoiceDetails();
      fetchCompanyInfo();
    }
  }, [token, isInitialized, isInitializing]);

  const fetchInvoiceDetails = async () => {
    if (!token || token === ':token') return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch invoice with order details
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            order_items(*),
            profiles:user_id(*),
            payment_references(*)
          )
        `)
        .eq('share_token', token)
        .single();
      
      if (error) {
        console.error('Error fetching invoice:', error);
        setError('Não foi possível carregar os detalhes da fatura');
        toast.error('Não foi possível carregar os detalhes da fatura');
        return;
      }
      
      setInvoice(data);
      setOrder(data?.orders || null);
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      setError(`Erro ao carregar detalhes da fatura: ${error.message}`);
      toast.error(`Erro ao carregar detalhes da fatura`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching company info:', error);
      }
      
      if (data) {
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };
  const handleDownloadInvoice = async () => {
    if (!invoice) return;
    
    try {
      setIsGeneratingPDF(true);
      
      // Importar dinamicamente os helpers de download
      const { downloadHelpers } = await import('@/utils/downloadHelpers');
      
      // Gerar e baixar o PDF usando o novo sistema
      await downloadHelpers.downloadInvoicePDF(invoice);
      
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      toast.error(`Erro ao baixar fatura: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'paid':
        return <Badge variant="success" className="bg-green-100 text-green-800 border-green-300">Pago</Badge>;
      case 'pending':
      case 'issued':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">Vencido</Badge>;
      case 'cancelled':
      case 'canceled':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">Cancelado</Badge>;
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando detalhes da fatura...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice || !order) {
    return (
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error || "A fatura solicitada não existe ou você não tem permissão para visualizá-la."}</p>
              <Button asChild className="mt-4">
                <Link to="/">Voltar para Página Inicial</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-4">
              <Link to="/" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para página inicial
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Fatura #{invoice?.invoice_number}</h1>
            <p className="text-muted-foreground">Emitida em: {formatDate(invoice?.created_at)}</p>
          </div>
          <div>
            <Button disabled={isGeneratingPDF} onClick={handleDownloadInvoice}>
              {isGeneratingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isGeneratingPDF ? 'Gerando PDF...' : 'Baixar PDF'}
            </Button>
          </div>
        </div>

        {/* Invoice Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Detalhes da Fatura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between gap-8">
              {/* Company Information (Left Side) */}
              <div className="space-y-2 flex-1">
                <h3 className="font-bold text-sm uppercase text-muted-foreground">De</h3>
                <div className="space-y-1">
                  <p className="font-bold">{companyInfo?.company_name || 'AngoHost'}</p>
                  <p className="text-sm">{companyInfo?.company_details || 'Endereço da Empresa'}</p>
                </div>
                <div className="space-y-1 mt-4">
                  <p className="text-sm">Email: {companyInfo?.company_email || 'support@angohost.ao'}</p>
                  <p className="text-sm">Telefone: {companyInfo?.company_phone || '+244 942 090108'}</p>
                  <p className="text-sm">NIF: {companyInfo?.company_nif || '5000088927'}</p>
                </div>
              </div>
              
              {/* Client Information (Right Side) */}
              <div className="space-y-2 flex-1">
                <h3 className="font-bold text-sm uppercase text-muted-foreground">Para</h3>
                <div className="space-y-1">
                  <p className="font-bold">{order?.profiles?.name || 'Cliente'}</p>
                  {order?.profiles?.company_name && <p>{order.profiles.company_name}</p>}
                  <p className="text-sm">{order?.profiles?.address || 'Endereço não especificado'}</p>
                </div>
                <div className="space-y-1 mt-4">
                  <p className="text-sm">Email: {order?.profiles?.email || 'N/A'}</p>
                  <p className="text-sm">Telefone: {order?.profiles?.phone || 'N/A'}</p>
                  <p className="text-sm">NIF: {order?.profiles?.nif || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between mt-8 gap-4">
              <div className="grid grid-cols-2 gap-4 w-full">
                <div>
                  <p className="text-sm text-muted-foreground">Número da Fatura</p>
                  <p className="font-medium">{invoice?.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div>{invoice && getStatusBadge(invoice.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Emissão</p>
                  <p className="font-medium">{formatDate(invoice?.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                  <p className="font-medium">{formatDate(invoice?.due_date) || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Itens da Fatura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Descrição</th>
                    <th className="py-2 px-4 text-right">Qtd</th>
                    <th className="py-2 px-4 text-right">Preço Unit.</th>
                    <th className="py-2 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order?.order_items && order.order_items.length > 0 ? (
                    order.order_items.map((item: any) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.name}</div>
                          {item.duration && item.duration_unit && (
                            <div className="text-sm text-muted-foreground">
                              Duração: {item.duration} {item.duration_unit}(s)
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">{formatPrice(item.unit_price)}</td>
                        <td className="py-3 px-4 text-right">{formatPrice(item.unit_price * item.quantity)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 px-4 text-center text-muted-foreground">
                        Nenhum item encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="p-4"></td>
                    <td className="p-4 text-right font-medium">Subtotal:</td>
                    <td className="p-4 text-right">{order && formatPrice(order.total_amount - (order.rf_tax || 0))}</td>
                  </tr>
                  {order?.rf_tax > 0 && (
                    <tr>
                      <td colSpan={2} className="p-4"></td>
                      <td className="p-4 text-right font-medium">RF (6,5%):</td>
                      <td className="p-4 text-right">{formatPrice(order.rf_tax)}</td>
                    </tr>
                  )}
                  <tr className="border-t">
                    <td colSpan={2} className="p-4"></td>
                    <td className="p-4 text-right font-bold">Total:</td>
                    <td className="p-4 text-right font-bold">{order && formatPrice(order.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Informação de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice?.status === 'paid' ? (
              <div className="bg-green-50 text-green-800 p-4 rounded-md">
                <p className="font-medium">Esta fatura foi paga. Obrigado!</p>
              </div>
            ) : (
              <div>
                {companyInfo?.payment_instructions && (
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-md mb-4">
                    <h4 className="font-medium mb-2">Instruções de Pagamento</h4>
                    <p className="text-sm whitespace-pre-line">{companyInfo.payment_instructions}</p>
                  </div>
                )}
                
                {/* Payment Methods Section */}
                <div className="mt-6 space-y-6">
                  <h3 className="font-medium">Métodos de Pagamento Disponíveis:</h3>
                  
                  <div className="bg-white p-4 border rounded-md">
                    <h4 className="font-medium text-lg mb-2">Pagamento por Referência Multicaixa</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Entidade:</strong> 11333</p>
                      <p><strong>Referência:</strong> {
                        invoice?.orders?.payment_references && invoice.orders.payment_references.length > 0
                          ? invoice.orders.payment_references.sort((a, b) => 
                              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                            )[0].reference
                          : 'Indisponível'
                      }</p>
                      <p>Pagamento via ATM, Internet Banking, Multicaixa Express ou Balcão Bancário</p>
                    </div>
                  </div>
                  
                  {companyInfo?.multicaixa_instructions && (
                    <div className="bg-white p-4 border rounded-md">
                      <h4 className="font-medium text-lg mb-2">Multicaixa Express</h4>
                      <p className="text-sm whitespace-pre-line">{companyInfo.multicaixa_instructions}</p>
                    </div>
                  )}
                  
                  {companyInfo?.cash_instructions && (
                    <div className="bg-white p-4 border rounded-md">
                      <h4 className="font-medium text-lg mb-2">Pagamento em Dinheiro</h4>
                      <p className="text-sm whitespace-pre-line">{companyInfo.cash_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Section */}
        {invoice?.payment_instructions && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Notas Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{invoice.payment_instructions}</p>
            </CardContent>
          </Card>
        )}
        
        <div className="text-center text-sm text-muted-foreground py-4">
          © {new Date().getFullYear()} {companyInfo?.company_name || 'AngoHost'}. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};

export default SharedInvoiceView;
