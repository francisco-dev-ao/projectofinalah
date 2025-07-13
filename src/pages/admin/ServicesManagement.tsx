
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { AlertTriangle, RefreshCw, CheckCircle2, XCircle, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { getServices, updateServiceStatus, deleteService } from "@/services/serviceManagementService";
import { getAllOrders } from "@/services/orders";
import { ServiceDetailsDialog } from "@/components/admin/ServiceDetailsDialog";
import { formatDate } from "@/components/admin/order-details/OrderDetailsUtils";
import { ServiceStatus } from "@/types/service";
import { useAdminAuth } from "@/hooks/use-admin-auth";

const ServicesManagement = () => {
  const [services, setServices] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [openServiceDetails, setOpenServiceDetails] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { addAuditLogEntry } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadServicesAndOrders();
  }, []);

  const loadServicesAndOrders = async () => {
    try {
      setLoading(true);
      
      // Carregar serviços existentes
      const { services: serviceData, success: servicesSuccess } = await getServices();
      
      // Carregar ordens pendentes que ainda não foram convertidas em serviços
      const { orders: ordersData, success: ordersSuccess } = await getAllOrders();
      
      console.log("Services response:", { serviceData, servicesSuccess });
      console.log("Orders response:", { ordersData, ordersSuccess });
      
      if (servicesSuccess && serviceData) {
        setServices(serviceData);
      } else {
        setServices([]);
      }
      
      if (ordersSuccess && ordersData) {
        // Filtrar apenas ordens pagas que têm itens de serviço (Email, Hospedagem)
        const serviceOrders = ordersData.filter(order => {
          if (order.status !== 'paid' && order.status !== 'pending') return false;
          
          return order.order_items?.some((item: any) => {
            const name = item.name?.toLowerCase();
            return name.includes('email') || 
                   name.includes('hospedagem') || 
                   name.includes('hosting') ||
                   name.includes('ssl') ||
                   name.includes('certificado');
          });
        });
        
        setPendingOrders(serviceOrders);
      } else {
        setPendingOrders([]);
      }
      
      setError(null);
    } catch (error) {
      console.error("Erro ao carregar serviços e ordens:", error);
      setError(`Erro ao carregar dados: ${error}`);
      toast.error("Erro ao carregar serviços e ordens");
    } finally {
      setLoading(false);
    }
  };

  const getServiceType = (item: any) => {
    const name = item.name?.toLowerCase();
    if (name.includes('email') || name.includes('e-mail')) {
      return 'email';
    } else if (name.includes('hospedagem') || name.includes('hosting')) {
      return 'hosting';
    } else if (name.includes('ssl') || name.includes('certificado')) {
      return 'ssl';
    } else {
      return 'other';
    }
  };

  // Combinar serviços e ordens pendentes para exibição
  const allItems = [
    ...services.map(service => ({
      ...service,
      type: 'service',
      itemType: getServiceType(service)
    })),
    ...pendingOrders.flatMap(order => 
      order.order_items
        ?.filter((item: any) => {
          const name = item.name?.toLowerCase();
          return name.includes('email') || 
                 name.includes('hospedagem') || 
                 name.includes('hosting') ||
                 name.includes('ssl') ||
                 name.includes('certificado');
        })
        .map((item: any) => ({
          id: `order-${order.id}-${item.id}`,
          name: item.name,
          status: order.status === 'paid' ? 'pending_activation' : order.status,
          created_at: order.created_at,
          end_date: null,
          profiles: order.profiles,
          type: 'order',
          itemType: getServiceType(item),
          order_id: order.id,
          order_item: item,
          user_id: order.user_id
        })) || []
    )
  ];

  const filteredItems = allItems.filter((item) => {
    const searchRegex = new RegExp(searchQuery, "i");
    const matchesSearch = searchRegex.test(item.id) || 
                         (item.name && searchRegex.test(item.name)) || 
                         (item.profiles?.name && searchRegex.test(item.profiles.name));
    const matchesStatus = selectedStatus !== "all" ? item.status === selectedStatus : true;
    const matchesType = selectedType !== "all" ? item.itemType === selectedType : true;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusUpdate = async (itemId: string, newStatus: ServiceStatus) => {
    const item = allItems.find(i => i.id === itemId);
    if (!item || item.type !== 'service') {
      toast.error("Apenas serviços podem ter status atualizado");
      return;
    }

    try {
      setLoading(true);
      const { success } = await updateServiceStatus(itemId, newStatus);
      if (success) {
        toast.success("Status do serviço atualizado com sucesso.");
        await addAuditLogEntry(`Serviço ${itemId} status atualizado para ${newStatus}`);
        loadServicesAndOrders();
      } else {
        toast.error("Não foi possível atualizar o status do serviço.");
      }
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (itemId: string) => {
    const item = allItems.find(i => i.id === itemId);
    if (!item || item.type !== 'service') {
      toast.error("Apenas serviços podem ser excluídos");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    try {
      setLoading(true);
      const { success } = await deleteService(itemId);
      if (success) {
        toast.success("Serviço excluído com sucesso.");
        await addAuditLogEntry(`Serviço ${itemId} excluído`);
        loadServicesAndOrders();
      } else {
        toast.error("Não foi possível excluir o serviço.");
      }
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      toast.error("Erro ao excluir serviço");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItemDetails = (item: any) => {
    setSelectedService(item);
    setOpenServiceDetails(true);
  };

  const handleCloseItemDetails = () => {
    setOpenServiceDetails(false);
    setSelectedService(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'outline';
      case 'pending':
      case 'pending_activation':
      case 'paid':
        return 'default';
      case 'suspended':
      case 'canceled':
      case 'cancelled':
      case 'expired':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatItemStatus = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'pending_activation': return 'Aguardando Ativação';
      case 'paid': return 'Pago - Aguardando Ativação';
      case 'canceled': return 'Cancelado';
      case 'cancelled': return 'Cancelado';
      case 'suspended': return 'Suspenso';
      case 'expired': return 'Expirado';
      default: return status;
    }
  };

  const formatItemType = (type: string) => {
    switch (type) {
      case 'email': return 'Email';
      case 'hosting': return 'Hospedagem';
      case 'ssl': return 'SSL';
      default: return 'Outro';
    }
  };

  if (loading && !allItems.length) {
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
              <CardTitle>Gerenciar Serviços e Ordens Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              Visualize e gerencie todos os serviços ativos e ordens pendentes de ativação (Email, Hospedagem, SSL).
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="search"
              placeholder="Pesquisar serviço ou ordem..."
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
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="pending_activation">Aguardando Ativação</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="hosting">Hospedagem</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={loadServicesAndOrders} 
            variant="outline"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Lista
          </Button>
        </div>

        {error && !filteredItems.length ? (
          <div className="text-center py-8 bg-muted/20 rounded-lg border">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
            <p className="text-gray-500">{error}</p>
            <Button 
              variant="outline"
              onClick={loadServicesAndOrders}
              className="mt-4"
            >
              Tentar novamente
            </Button>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Serviço/Produto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.profiles?.name || item.profiles?.email || "N/A"}</TableCell>
                    <TableCell>{formatItemType(item.itemType)}</TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'service' ? 'outline' : 'default'}>
                        {item.type === 'service' ? 'Serviço' : 'Ordem'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(item.status)} className="px-3 py-1 text-sm">
                        {formatItemStatus(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleOpenItemDetails(item)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                        {item.type === 'service' && (
                          <>
                            {item.status !== 'active' && (
                              <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(item.id, 'active' as ServiceStatus)}>
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="sr-only">Ativar</span>
                              </Button>
                            )}
                            {item.status !== 'suspended' && (
                              <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(item.id, 'suspended' as ServiceStatus)}>
                                <XCircle className="h-4 w-4" />
                                <span className="sr-only">Suspender</span>
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteService(item.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/20 rounded-lg border">
            <p className="text-gray-500">Nenhum serviço ou ordem pendente encontrada.</p>
          </div>
        )}

        {selectedService && (
          <ServiceDetailsDialog 
            open={openServiceDetails} 
            onClose={handleCloseItemDetails} 
            service={selectedService}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDeleteService}
            onServicesChange={loadServicesAndOrders}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default ServicesManagement;
