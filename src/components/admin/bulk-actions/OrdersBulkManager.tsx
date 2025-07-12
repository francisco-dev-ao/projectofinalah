
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/components/admin/order-details/OrderDetailsUtils';
import { formatPrice } from '@/lib/utils';
import BulkSelectionBar from './BulkSelectionBar';
import BulkDeleteDialog from './BulkDeleteDialog';
import ClientBulkActions from './ClientBulkActions';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  profiles?: {
    name?: string;
    email?: string;
    company_name?: string;
  };
}

export default function OrdersBulkManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteClientDialog, setShowDeleteClientDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            company_name
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.profiles?.name && order.profiles.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.profiles?.email && order.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.size === 0) return;

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const orderId of selectedOrders) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);

        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        errorCount++;
        console.error('Error deleting order:', error);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} pedido(s) excluído(s) com sucesso`);
      await loadOrders();
      setSelectedOrders(new Set());
    }

    if (errorCount > 0) {
      toast.error(`Erro ao excluir ${errorCount} pedido(s)`);
    }

    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  const handleDeleteClientOrders = async () => {
    if (!selectedClientId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('user_id', selectedClientId);

      if (error) throw error;

      toast.success(`Todos os pedidos do cliente foram excluídos`);
      await loadOrders();
      setSelectedClientId(null);
      setSelectedClientName("");
    } catch (error) {
      console.error('Error deleting client orders:', error);
      toast.error('Erro ao excluir pedidos do cliente');
    }

    setIsDeleting(false);
    setShowDeleteClientDialog(false);
  };

  const getUniqueClients = () => {
    const clientsMap = new Map();
    orders.forEach(order => {
      if (order.profiles) {
        const clientId = order.profiles.email || order.id;
        const clientName = order.profiles.name || order.profiles.company_name || 'Cliente';
        const clientEmail = order.profiles.email;
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, { id: clientId, name: clientName, email: clientEmail });
        }
      }
    });
    return Array.from(clientsMap.values());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completo</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isAllSelected = filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gerenciar Pedidos em Massa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Selecione e exclua múltiplos pedidos ou todos os pedidos de um cliente específico.
          </p>
        </CardContent>
      </Card>

      <BulkSelectionBar
        selectedCount={selectedOrders.size}
        totalCount={filteredOrders.length}
        onDeleteSelected={() => setShowDeleteDialog(true)}
        onClearSelection={() => setSelectedOrders(new Set())}
        isDeleting={isDeleting}
        entityType="pedido"
      />

      <ClientBulkActions
        clients={getUniqueClients()}
        selectedClientId={selectedClientId}
        onClientSelect={(clientId, clientName) => {
          setSelectedClientId(clientId);
          setSelectedClientName(clientName);
        }}
        onDeleteClientData={() => setShowDeleteClientDialog(true)}
        isDeleting={isDeleting}
        entityType="pedidos"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, cliente ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Completo</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadOrders} disabled={isLoading} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {order.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.profiles?.name || order.profiles?.company_name || 'Cliente'}
                          </div>
                          {order.profiles?.email && (
                            <div className="text-sm text-gray-500">
                              {order.profiles.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{formatPrice(order.total_amount)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <BulkDeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteSelected}
        title="Confirmar Exclusão de Pedidos"
        description="Tem certeza que deseja excluir os pedidos selecionados? Esta ação não pode ser desfeita."
        items={filteredOrders.filter(order => selectedOrders.has(order.id))}
        isDeleting={isDeleting}
        entityType="pedido"
      />

      <BulkDeleteDialog
        open={showDeleteClientDialog}
        onClose={() => setShowDeleteClientDialog(false)}
        onConfirm={handleDeleteClientOrders}
        title="Confirmar Exclusão de Pedidos do Cliente"
        description={`Tem certeza que deseja excluir TODOS os pedidos do cliente "${selectedClientName}"? Esta ação não pode ser desfeita.`}
        items={orders.filter(order => order.profiles?.email === selectedClientId || order.profiles?.name === selectedClientName)}
        isDeleting={isDeleting}
        entityType="pedido"
      />
    </div>
  );
}
