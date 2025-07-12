
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// Remove CustomerLayout import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, ShoppingCart, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getOrderById } from '@/services/orders';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (orderId && user) {
      loadOrderData(orderId);
    }
  }, [orderId, user]);

  const loadOrderData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get order data
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (*),
          order_items (*),
          invoices:invoices (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error loading order details:", error);
        setError("Não foi possível carregar os detalhes do pedido");
        toast.error("Não foi possível carregar os detalhes do pedido");
        return;
      }
      
      // Verify this order belongs to the current user
      if (data.user_id !== user?.id) {
        setError("Você não tem permissão para visualizar este pedido");
        toast.error("Você não tem permissão para visualizar este pedido");
        return;
      }
      
      setOrder(data);
    } catch (error: any) {
      console.error("Error loading order details:", error);
      setError(`Erro ao carregar detalhes do pedido: ${error.message}`);
      toast.error("Erro ao carregar detalhes do pedido");
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'completed':
        return 'Concluído';
      case 'paid':
        return 'Pago';
      case 'canceled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'success';
      case 'pending':
      case 'processing':
        return 'default';
      case 'canceled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Carregando detalhes do pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/customer/orders" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Pedidos
          </Link>
        </Button>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "O pedido solicitado não existe ou você não tem permissão para visualizá-lo."}</p>
            <Button asChild className="mt-4">
              <Link to="/customer/orders">Voltar para Pedidos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/customer/orders" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para pedidos
          </Link>
        </Button>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pedido #{order.order_number || order.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground">
              Realizado em {formatDateTime(order.created_at)}
            </p>
          </div>
          
          <Badge variant={getStatusBadge(order.status)}>
            {formatStatus(order.status)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              Detalhes do Pedido
            </CardTitle>
            <CardDescription>
              Informações sobre seu pedido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número do Pedido</p>
                <p>{order.order_number || order.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p>{formatStatus(order.status)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data</p>
                <p>{formatDateTime(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p>{formatPrice(order.total_amount)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Cliente</p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p>{order.profiles?.name}</p>
                <p>{order.profiles?.email}</p>
                {order.profiles?.phone && <p>{order.profiles.phone}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {order.invoices && order.invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Faturas
              </CardTitle>
              <CardDescription>
                Faturas relacionadas a este pedido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.invoices.map((invoice: any) => (
                <div key={invoice.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                  <div>
                    <p className="font-medium">Fatura #{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      Emitida em {formatDateTime(invoice.created_at)}
                    </p>
                    <Badge
                      variant={
                        invoice.status === 'paid'
                          ? 'success'
                          : invoice.status === 'issued' || invoice.status === 'pending'
                          ? 'outline'
                          : 'destructive'
                      }
                      className="mt-1"
                    >
                      {invoice.status === 'paid'
                        ? 'Paga'
                        : invoice.status === 'issued' || invoice.status === 'pending'
                        ? 'Pendente'
                        : invoice.status}
                    </Badge>
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/customer/invoices/${invoice.id}`}>
                      Ver Detalhes
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 pl-2 font-medium">Item</th>
                  <th className="pb-3 pr-2 text-right font-medium">Quantidade</th>
                  <th className="pb-3 pr-2 text-right font-medium">Preço</th>
                  <th className="pb-3 pr-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 pl-2">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-2 text-right">{item.quantity}</td>
                      <td className="py-3 pr-2 text-right">{formatPrice(item.unit_price)}</td>
                      <td className="py-3 pr-2 text-right font-medium">
                        {formatPrice(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-muted-foreground">
                      Nenhum item encontrado
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={2}></td>
                  <td className="pt-3 pr-2 text-right font-medium">Total:</td>
                  <td className="pt-3 pr-2 text-right font-medium">
                    {formatPrice(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetails;
