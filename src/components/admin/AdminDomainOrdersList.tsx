
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime, formatPrice } from '@/lib/utils';
import { useDomainOrders } from '@/hooks/useDomainOrders';

const AdminDomainOrdersList = () => {
  const { orders, loading, loadDomainOrders } = useDomainOrders(undefined, true);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processando</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDomainNames = (orderItems: any[]) => {
    return orderItems
      .filter(item => 
        item.product_type === 'domain' || 
        item.product_name?.toLowerCase().includes('dominio') ||
        item.product_name?.toLowerCase().includes('domain')
      )
      .map(item => item.product_name)
      .join(', ');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos de Domínios</CardTitle>
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
        <CardTitle>Pedidos de Domínios Pendentes e Ativos</CardTitle>
        <Button variant="outline" size="sm" onClick={loadDomainOrders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Nenhum pedido de domínio pendente ou ativo encontrado
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Domínios</TableHead>
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
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {order.profiles?.name || order.profiles?.company_name || 'Cliente'}
                        </div>
                        {order.profiles?.email && (
                          <div className="text-xs text-muted-foreground">
                            {order.profiles.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {getDomainNames(order.order_items)}
                    </TableCell>
                    <TableCell>{formatDateTime(order.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{formatPrice(order.total_amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/orders/${order.id}`}>
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

export default AdminDomainOrdersList;
