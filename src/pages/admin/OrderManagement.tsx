
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { AlertTriangle, RefreshCw, Trash2, CheckCircle, XCircle, Mail } from "lucide-react";
import OrderDetailsDialog from "@/components/admin/OrderDetailsDialog";
import PaymentDialog from "@/components/admin/PaymentDialog";
import InvoiceDialog from "@/components/admin/InvoiceDialog";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { getAllOrders, formatOrderStatus, getOrder, updateOrderStatus } from "@/services/orderService";
import { OrderStatus } from "@/types/order";
import { formatDate } from "@/components/admin/order-details/OrderDetailsUtils";
import { supabase } from "@/integrations/supabase/client";

const OrderManagement = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [openOrderDetails, setOpenOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("OrderManagement component mounted");
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      console.log("Loading orders...");
      setLoading(true);
      const { orders: orderData, success } = await getAllOrders();
      console.log("Orders response:", { orderData, success });
      
      if (success && orderData?.length > 0) {
        setOrders(orderData);
        setError(null);
      } else if (success && (!orderData || orderData.length === 0)) {
        setOrders([]);
        setError("Nenhum pedido encontrado.");
      } else {
        setError("Não foi possível carregar os pedidos.");
        toast.error("Não foi possível carregar os pedidos.");
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      setError(`Erro ao carregar pedidos: ${error}`);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchRegex = new RegExp(searchQuery, "i");
    const matchesSearch = searchRegex.test(order.id) || 
                         (order.profiles?.name && searchRegex.test(order.profiles.name)) || 
                         (order.profiles?.company_name && searchRegex.test(order.profiles.company_name));
    const matchesStatus = selectedStatus !== "all" ? order.status === selectedStatus : true;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);
      const { success } = await updateOrderStatus(orderId, newStatus as any);
      if (success) {
        toast.success("Status do pedido atualizado com sucesso.");
        loadOrders(); // Reload orders to reflect the changes
      } else {
        toast.error("Não foi possível atualizar o status do pedido.");
      }
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      toast.error("Erro ao atualizar status do pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOrderDetails = async (orderId: string) => {
    try {
      setLoading(true);
      const { order: orderData, success } = await getOrder(orderId);
      if (success && orderData) {
        setSelectedOrder(orderData);
        setOpenOrderDetails(true);
      } else {
        toast.error("Não foi possível carregar os detalhes do pedido.");
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do pedido:", error);
      toast.error("Erro ao carregar detalhes do pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOrderDetails = () => {
    setOpenOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleOpenPaymentDialog = async (orderId: string) => {
    try {
      setLoading(true);
      const { order: orderData, success } = await getOrder(orderId);
      if (success && orderData) {
        setSelectedOrder(orderData);
        setOpenPaymentDialog(true);
      } else {
        toast.error("Não foi possível carregar os detalhes do pedido.");
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do pedido:", error);
      toast.error("Erro ao carregar detalhes do pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedOrder(null);
  };

  const handleOpenInvoiceDialog = async (orderId: string) => {
    try {
      setLoading(true);
      const { order: orderData, success } = await getOrder(orderId);
      if (success && orderData) {
        setSelectedOrder(orderData);
        setOpenInvoiceDialog(true);
      } else {
        toast.error("Não foi possível carregar os detalhes do pedido.");
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do pedido:", error);
      toast.error("Erro ao carregar detalhes do pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseInvoiceDialog = () => {
    setOpenInvoiceDialog(false);
    setSelectedOrder(null);
    loadOrders(); // Refresh orders to reflect new invoice
  };

  const handleApproveOrder = async (orderId: string) => {
    await handleStatusUpdate(orderId, "approved");
    // Aqui pode-se disparar notificação por e-mail se desejado
  };

  const handleRejectOrder = async (orderId: string) => {
    await handleStatusUpdate(orderId, "rejected");
    // Aqui pode-se disparar notificação por e-mail se desejado
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (error) {
        toast.error("Erro ao eliminar pedido");
      } else {
        toast.success("Pedido eliminado com sucesso");
        loadOrders();
      }
    } catch (error) {
      toast.error("Erro ao eliminar pedido");
    } finally {
      setLoading(false);
    }
  };

  // Get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'confirmed':
        return 'success';
      case 'pending':
      case 'awaiting':
      case 'draft':
        return 'default';
      case 'canceled':
      case 'cancelled':
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading && !orders.length) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Gerenciar Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              Nesta página, você pode visualizar e gerenciar todos os pedidos.
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="search"
              placeholder="Pesquisar pedido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={loadOrders} 
            variant="outline"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Lista
          </Button>
        </div>

        {error && !filteredOrders.length ? (
          <div className="text-center py-8 bg-muted/20 rounded-lg border">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
            <p className="text-gray-500">{error}</p>
            <Button 
              variant="outline"
              onClick={loadOrders}
              className="mt-4"
            >
              Tentar novamente
            </Button>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número do Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo de Serviço</TableHead>
                  <TableHead>Data do Pedido</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const tipoServico = order.order_items && order.order_items.length > 0
                    ? order.order_items.map((item: any) => item.name).join(", ")
                    : "-";
                  return (
                    <TableRow key={order.id}>
                      <TableCell>{order.id.substring(0, 8)}</TableCell>
                      <TableCell>{order.profiles?.name || "N/A"}</TableCell>
                      <TableCell>{tipoServico}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{formatPrice(order.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(order.status)} className="px-3 py-1 text-sm">
                          {formatOrderStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => handleOpenOrderDetails(order.id)}>
                            Ver Detalhes
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleOpenPaymentDialog(order.id)}>
                            Pagamento
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleOpenInvoiceDialog(order.id)}>
                            Fatura
                          </Button>
                          {order.status === "pending" && (
                            <>
                              <Button variant="default" size="sm" onClick={() => handleApproveOrder(order.id)} title="Aprovar">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleRejectOrder(order.id)} title="Rejeitar">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleDeleteOrder(order.id)} title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {/* Opcional: botão para enviar notificação por e-mail */}
                          {/* <Button variant="outline" size="sm" onClick={() => handleSendEmail(order.id)} title="Notificar por e-mail">
                            <Mail className="h-4 w-4" />
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/20 rounded-lg border">
            <p className="text-gray-500">Nenhum pedido encontrado.</p>
          </div>
        )}

        <OrderDetailsDialog 
          open={openOrderDetails} 
          onClose={handleCloseOrderDetails} 
          order={selectedOrder} 
          onStatusUpdate={handleStatusUpdate}
          onOrdersChange={loadOrders}
        />
        
        <PaymentDialog 
          open={openPaymentDialog} 
          onClose={handleClosePaymentDialog} 
          order={selectedOrder} 
          onOrdersChange={loadOrders} 
        />
        
        <InvoiceDialog 
          open={openInvoiceDialog} 
          onClose={handleCloseInvoiceDialog} 
          order={selectedOrder} 
          onSubmit={() => loadOrders()}
        />
      </div>
    </AdminLayout>
  );
};

export default OrderManagement;
