
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getUserServices } from "@/services/serviceService";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Globe, Info, Server, Mail, Package, Calendar, Settings, ShoppingCart, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ServiceStatus } from "@/types/service";
import { formatDate, formatPrice } from "@/lib/utils";

const CustomerServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserServices();
    }
  }, [user]);

  const loadUserServices = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Buscar serviços e orders relacionadas a serviços
      const { services: userServices, orders: serviceOrders, success } = await getUserServices(user.id, {
        excludeDomains: true,
        status: 'all' as any
      });
      
      if (success) {
        setServices(userServices || []);
        setOrders(serviceOrders || []);
      } else {
        toast.error("Não foi possível carregar seus serviços");
      }
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      toast.error("Erro ao carregar dados dos serviços");
    } finally {
      setLoading(false);
    }
  };

  // Get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { variant: 'default' as const, label: 'Ativo', className: 'bg-green-500 hover:bg-green-600' };
      case 'pending':
        return { variant: 'secondary' as const, label: 'Pendente', className: 'bg-yellow-500 hover:bg-yellow-600' };
      case 'processing':
        return { variant: 'secondary' as const, label: 'Processando', className: 'bg-blue-500 hover:bg-blue-600' };
      case 'paid':
        return { variant: 'default' as const, label: 'Pago', className: 'bg-green-500 hover:bg-green-600' };
      case 'suspended':
        return { variant: 'destructive' as const, label: 'Suspenso', className: 'bg-orange-500 hover:bg-orange-600' };
      case 'expired':
        return { variant: 'destructive' as const, label: 'Expirado', className: '' };
      case 'canceled':
      case 'cancelled':
        return { variant: 'destructive' as const, label: 'Cancelado', className: '' };
      default:
        return { variant: 'outline' as const, label: status, className: '' };
    }
  };

  // Get service icon based on name/type
  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('hospedagem') || name.includes('hosting')) {
      return <Server className="h-5 w-5" />;
    }
    if (name.includes('email') || name.includes('e-mail')) {
      return <Mail className="h-5 w-5" />;
    }
    return <Package className="h-5 w-5" />;
  };

  // Get service type label
  const getServiceType = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('hospedagem') || name.includes('hosting')) {
      return 'Hospedagem';
    }
    if (name.includes('email') || name.includes('e-mail')) {
      return 'Email';
    }
    return 'Serviço';
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalItems = services.length + orders.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meus Serviços</h1>
        <p className="text-muted-foreground">
          Gerencie seus serviços de hospedagem e email.
        </p>
      </div>

      <Alert className="bg-blue-50 border border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Esta página exibe serviços de hospedagem e email. </span>
            <Link to="/customer/domains" className="flex items-center text-blue-600 hover:text-blue-800">
              <Globe className="h-4 w-4 mr-1" />
              Gerenciar domínios
            </Link>
          </div>
        </AlertDescription>
      </Alert>

      {totalItems > 0 ? (
        <div className="grid gap-6">
          {/* Exibir serviços ativos */}
          {services.map((service) => {
            const statusInfo = getStatusBadge(service.status);
            
            return (
              <Card key={`service-${service.id}`} className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getServiceIcon(service.name)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {getServiceType(service.name)} • Criado em {formatDate(service.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={statusInfo.variant}
                    className={statusInfo.className}
                  >
                    {statusInfo.label}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Data de Início
                        </p>
                        <p className="text-sm">{service.start_date ? formatDate(service.start_date) : 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Data de Expiração
                        </p>
                        <p className="text-sm">{service.end_date ? formatDate(service.end_date) : 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Renovação Automática</p>
                        <p className="text-sm">
                          <Badge variant={service.auto_renew ? "default" : "outline"}>
                            {service.auto_renew ? 'Ativada' : 'Desativada'}
                          </Badge>
                        </p>
                      </div>
                    </div>
                    
                    {service.order_items && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Detalhes do Pedido:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {service.order_items.duration && (
                            <p>Duração: {service.order_items.duration} {service.order_items.duration_unit || 'mês(es)'}</p>
                          )}
                          {service.order_items.unit_price && (
                            <p>Valor: {formatPrice(service.order_items.unit_price)}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <Link to={`/customer/services/${service.id}`}>
                          <Settings className="h-4 w-4 mr-1" />
                          Detalhes
                        </Link>
                      </Button>
                      
                      {service.status === 'active' && (
                        <Button variant="outline" size="sm">
                          <Server className="h-4 w-4 mr-1" />
                          Gerenciar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Exibir orders de serviços */}
          {orders.map((order) => {
            const statusInfo = getStatusBadge(order.status);
            
            return (
              <Card key={`order-${order.id}`} className="transition-shadow hover:shadow-md border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Pedido #{order.id.slice(-8)}
                        <Badge variant="outline" className="text-xs">
                          Order
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Pedido realizado em {formatDate(order.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={statusInfo.variant}
                    className={statusInfo.className}
                  >
                    {statusInfo.label}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Itens do pedido */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Itens do Pedido:</p>
                      {order.order_items?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {getServiceIcon(item.name)}
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Qtd: {item.quantity} 
                                {item.duration && ` • ${item.duration} ${item.duration_unit || 'mês(es)'}`}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-medium">{formatPrice(item.unit_price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Total do Pedido</p>
                        <p className="text-lg font-bold text-primary">{formatPrice(order.total_amount)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Método de Pagamento</p>
                        <p className="text-sm">{order.payment_method || 'Não informado'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <Link to={`/customer/orders/${order.id}`}>
                          <FileText className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Link>
                      </Button>
                      
                      {order.status === 'pending' && (
                        <Button variant="outline" size="sm" className="text-blue-600">
                          Ver Fatura
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Nenhum serviço encontrado
            </CardTitle>
            <CardDescription>
              Você ainda não possui nenhum serviço de hospedagem ou email ativo em sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Explore nossos planos de hospedagem e email para começar.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/hospedagem">
                  <Server className="h-4 w-4 mr-2" />
                  Ver Hospedagem
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/email">
                  <Mail className="h-4 w-4 mr-2" />
                  Ver Email
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerServices;
