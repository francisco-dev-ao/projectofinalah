import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/formatters';

// Define the order status type
type OrderStatusType = "pending" | "paid" | "canceled" | "processing" | "completed";

// Define the EmailOrder type
interface EmailOrder {
  id: string;
  created_at: string;
  updated_at: string;
  status: OrderStatusType;
  user_id: string;
  total_amount: number;
  payment_method: string;
  order_items: Array<{
    id: string;
    name: string;
    product_data?: {
      category?: string;
    }
  }>;
  profiles: {
    name: string;
    email: string;
    company_name?: string;
    phone?: string;
  };
}

const EmailOrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<EmailOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  // Handle updating the order status
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatusType) => {
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) {
        throw error;
      }
      
      toast.success(`Status do pedido atualizado para ${status}`);
      
      // Refresh orders after updating
      loadOrders();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Não foi possível atualizar o status do pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load email orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          profiles:user_id (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Filter to only get orders with email items and ensure they have the required properties
      const emailOrders = (data || [])
        .filter(order => 
          order.order_items.some((item: any) => item.name?.toLowerCase().includes('email') || 
            (item.product_data && item.product_data.category === 'email'))
        )
        .map(order => ({
          ...order,
          profiles: {
            ...order.profiles,
            // Ensure email property exists
            email: getUserEmail(order.profiles)
          }
        }));
      
      // Type assertion after ensuring the data structure matches EmailOrder
      setOrders(emailOrders as unknown as EmailOrder[]);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Não foi possível carregar os pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getUserEmail = (profile: any) => {
    // If company_email exists, use that
    if (profile && profile.company_email) {
      return profile.company_email;
    }
    // Otherwise use a fallback
    return profile ? profile.name : 'N/A';
  };

  const filteredOrders = orders.filter(order => {
    const searchString = searchQuery.toLowerCase();
    return (
      order.profiles.name?.toLowerCase().includes(searchString) ||
      order.profiles.email?.toLowerCase().includes(searchString) ||
      order.id.toLowerCase().includes(searchString)
    );
  });

  // Function to render order status badge
  const renderStatusBadge = (status: OrderStatusType) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completo</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">Processando</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">Pendente</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">Cancelado</Badge>;
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Gerenciamento de Pedidos de Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Gerencie todos os pedidos de serviços de email.</p>
          </CardContent>
        </Card>
        
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por cliente, email ou ID..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={loadOrders} disabled={loading || isProcessing}>
            Atualizar
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID do Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhum pedido de email encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                      <TableCell>{order.profiles.name || 'N/A'}</TableCell>
                      <TableCell>{order.profiles.email || 'N/A'}</TableCell>
                      <TableCell>{formatDateTime(order.created_at)}</TableCell>
                      <TableCell>AOA {order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{renderStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleUpdateOrderStatus(order.id, "processing")}
                              disabled={isProcessing || order.status === 'processing'}
                            >
                              Marcar como Processando
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                              disabled={isProcessing || order.status === 'completed'}
                            >
                              Marcar como Completo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateOrderStatus(order.id, "canceled")}
                              disabled={isProcessing || order.status === 'canceled'}
                            >
                              Cancelar Pedido
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default EmailOrdersManagement;
