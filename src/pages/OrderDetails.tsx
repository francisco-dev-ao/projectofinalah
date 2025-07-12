import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { formatOrderStatus, getOrder } from "@/services/orderService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Define payment status formatter locally since it's not exported properly
const formatPaymentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    awaiting: "Aguardando",
    processing: "Processando",
    confirmed: "Confirmado",
    failed: "Falhou"
  };

  return statusMap[status] || status;
};

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        const { order: orderData, success } = await getOrder(id);
        
        if (success && orderData) {
          setOrder(orderData);
        } else {
          toast.error("Não foi possível carregar os detalhes do pedido.");
        }
      } catch (error) {
        console.error("Erro ao carregar pedido:", error);
        toast.error("Erro ao carregar detalhes do pedido");
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [id, user]);

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Get badge variant for order status
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Get badge variant for payment status
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'awaiting':
        return 'warning';
      case 'rejected':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-semibold mb-2">Pedido não encontrado</h2>
        <p className="text-muted-foreground mb-4">O pedido solicitado não existe ou você não tem permissão para visualizá-lo.</p>
        <Link to="/customer/orders">
          <Button>Voltar para Pedidos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to="/customer/orders" className="mr-4">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Detalhes do Pedido</h1>
              <p className="text-muted-foreground">Pedido #{order.id.substring(0, 8)}</p>
            </div>
          </div>
          <Badge variant={getOrderStatusBadge(order.status)}>
            {formatOrderStatus(order.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
                <CardDescription>
                  Criado em {formatDate(order.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Itens do Pedido</h3>
                    <div className="bg-muted/50 rounded-md">
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item: any, index: number) => (
                          <div key={item.id} className="p-4 border-b last:border-b-0">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.duration && item.duration_unit && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.duration} {item.duration_unit}
                                    {item.start_date && item.end_date && (
                                      <span>
                                        {" • "}
                                        {formatDate(item.start_date)} - {formatDate(item.end_date)}
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p>{formatPrice(item.unit_price)}</p>
                                {item.quantity > 1 && (
                                  <p className="text-sm text-muted-foreground">
                                    Quantidade: {item.quantity}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-muted-foreground">Nenhum item encontrado</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between py-2">
                      <span>Subtotal:</span>
                      <span>{formatPrice(order.total_amount)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between py-2 font-bold">
                      <span>Total:</span>
                      <span>{formatPrice(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Faturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.invoices && order.invoices.length > 0 ? (
                  <div className="space-y-4">
                    {order.invoices.map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>Emitido: {formatDate(invoice.created_at)}</span>
                            {invoice.due_date && (
                              <span className="ml-3">Vencimento: {formatDate(invoice.due_date)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                            {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                          </Badge>
                          {invoice.pdf_url && (
                            <Button variant="ghost" size="icon" className="ml-2" asChild>
                              <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma fatura emitida ainda</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status and payment info */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Status do Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                {order.payments && order.payments.length > 0 ? (
                  order.payments.map((payment: any) => (
                    <div key={payment.id} className="space-y-4">
                      <div className="flex items-center">
                        {payment.status === 'confirmed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : payment.status === 'rejected' ? (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                        )}
                        <Badge variant={getPaymentStatusBadge(payment.status)}>
                          {formatPaymentStatus(payment.status)}
                        </Badge>
                      </div>
                      
                      <div className="pt-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Método:</span>
                          <span>
                            {payment.method === 'multicaixa' ? 'Multicaixa Express' :
                             payment.method === 'transfer' ? 'Transferência Bancária' :
                             payment.method}
                          </span>
                        </div>
                        
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Valor:</span>
                          <span>{formatPrice(payment.amount_paid)}</span>
                        </div>
                        
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Data:</span>
                          <span>{payment.payment_date ? formatDate(payment.payment_date) : formatDate(payment.created_at)}</span>
                        </div>
                        
                        {payment.transaction_id && (
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">ID da Transação:</span>
                            <span className="font-mono text-sm">{payment.transaction_id}</span>
                          </div>
                        )}
                      </div>
                      
                      {payment.status === 'awaiting' && payment.method === 'transfer' && (
                        <div className="mt-4 p-4 bg-muted rounded-md">
                          <p className="font-medium mb-2">Dados para Transferência:</p>
                          <p className="text-sm">Banco: Banco Económico</p>
                          <div className="space-y-2">
                            <p className="text-sm"><strong>Entidade:</strong> 11333</p>
                            <p className="text-sm"><strong>Referência:</strong> {
                              order?.payment_references && order.payment_references.length > 0
                                ? order.payment_references.sort((a, b) => 
                                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                  )[0].reference
                                : 'Indisponível'
                            }</p>
                            <p className="text-sm"><strong>Valor:</strong> {order.total_amount?.toLocaleString('pt-PT')} Kz</p>
                            <p className="text-sm"><strong>Validade:</strong> 2 dias após geração</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">Use ATM, Internet Banking, Multicaixa Express ou Balcão Bancário</p>
                        </div>
                      )}
                      
                      {payment.notes && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">{payment.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhum pagamento registrado</p>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                {order.profiles && (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{order.profiles.name}</p>
                      {order.profiles.company_name && (
                        <p>{order.profiles.company_name}</p>
                      )}
                    </div>
                    
                    {order.profiles.nif && (
                      <div>
                        <p className="text-sm text-muted-foreground">NIF</p>
                        <p>{order.profiles.nif}</p>
                      </div>
                    )}
                    
                    {order.profiles.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p>{order.profiles.phone}</p>
                      </div>
                    )}
                    
                    {order.profiles.address && (
                      <div>
                        <p className="text-sm text-muted-foreground">Endereço</p>
                        <p>{order.profiles.address}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
