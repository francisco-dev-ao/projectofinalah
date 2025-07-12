
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateTime, formatPrice } from '@/lib/utils';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
}

interface DomainOrdersSectionProps {
  domainId: string;
  domainName: string;
}

const DomainOrdersSection = ({ domainId, domainName }: DomainOrdersSectionProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDomainOrders();
  }, [domainId]);

  const loadDomainOrders = async () => {
    try {
      setLoading(true);
      
      // First get the domain to find related orders
      const { data: domain } = await supabase
        .from('domains')
        .select('order_id')
        .eq('id', domainId)
        .single();

      if (!domain?.order_id) {
        setOrders([]);
        return;
      }

      // Get the order details
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          total_amount,
          order_items (
            id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq('id', domain.order_id);

      if (error) {
        throw error;
      }

      setOrders(orderData || []);
    } catch (error) {
      console.error('Error loading domain orders:', error);
      toast.error('Erro ao carregar pedidos do domínio');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Relacionados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pedidos Relacionados - {domainName}</CardTitle>
        <Button variant="outline" size="sm" onClick={loadDomainOrders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Nenhum pedido encontrado para este domínio
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{formatDateTime(order.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{formatPrice(order.total_amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/customer/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver pedido</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DomainOrdersSection;
