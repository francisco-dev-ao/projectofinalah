import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getUserOrders, formatOrderStatus } from "@/services/orderService";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const CustomerOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { orders: userOrders, success } = await getUserOrders(user.id);
      
      if (success && userOrders) {
        setOrders(userOrders);
      } else {
        toast.error("Não foi possível carregar os pedidos");
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast.error("Erro ao carregar lista de pedidos");
    } finally {
      setLoading(false);
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-AO', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'active':
        return 'success';
      case 'pending':
      case 'draft':
        return 'default';
      case 'overdue':
      case 'expired':
        return 'destructive';
      default:
        return 'default';
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Pedidos</h1>
        <p className="text-muted-foreground">Acompanhe seus pedidos e veja o histórico.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
          <CardDescription>Todos os seus pedidos estão listados aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="w-full flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : orders.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{formatPrice(order.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(order.status)}>
                          {formatOrderStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/customer/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            Detalhes
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
              <p className="text-muted-foreground mt-1">Você ainda não realizou nenhum pedido.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerOrders;
