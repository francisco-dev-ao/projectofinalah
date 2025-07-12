
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Receipt, 
  Server, 
  Globe, 
  ArrowRight,
  CalendarClock, 
  CreditCard,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatOrderStatus, formatInvoiceStatus, getUserOrders } from "@/services/orderService";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/types/service";
import UnpaidInvoicesList from "@/components/customer/UnpaidInvoicesList";
import MetricCard from "./MetricCard";
import ServiceDetailCard from "./ServiceDetailCard";

const CustomerDashboard = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user) {
      loadUserData();
      loadUserServices();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user's orders
      const { orders: userOrders, success } = await getUserOrders(user.id);
      
      if (success) {
        console.log("CustomerDashboard: Pedidos carregados com sucesso", userOrders?.length || 0);
        setOrders(userOrders || []);
      } else {
        console.error("CustomerDashboard: Falha ao carregar pedidos");
        setError("Não foi possível carregar seus pedidos");
        toast.error("Não foi possível carregar seus pedidos");
      }
    } catch (error) {
      console.error("CustomerDashboard: Erro ao carregar dados:", error);
      setError("Erro ao carregar dados do usuário");
      toast.error("Erro ao carregar dados do usuário");
    } finally {
      setLoading(false);
    }
  };

  const loadUserServices = async () => {
    if (!user) return;
    
    try {
      setServicesLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Cast the data to Service[] to ensure compatibility with the Service type
      setServices(data as unknown as Service[] || []);
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Não foi possível carregar seus serviços");
    } finally {
      setServicesLoading(false);
    }
  };

  // Get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
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

  if (loading && servicesLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <p className="text-gray-600">Carregando seus dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <p>{error}</p>
          <Button 
            onClick={() => loadUserData()} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const activeServices = services.filter(s => s.status === 'active').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalSpent = orders
    .filter(o => o.status === 'completed' || o.status === 'paid')
    .reduce((sum, order) => sum + Number(order.total_amount), 0);

  return (
    <div className="space-y-8">
      {/* Welcome header with user info */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bem-vindo(a), {profile?.name || 'Cliente'}</h1>
        <p className="text-muted-foreground">
          Gerencie seus serviços e pedidos a partir da sua área de cliente.
        </p>
      </div>

      {/* Unpaid invoices alert */}
      {user?.id && <UnpaidInvoicesList userId={user.id} />}

      {/* Dashboard tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 size={16} />
            <span className="hidden md:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart size={16} />
            <span className="hidden md:inline">Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt size={16} />
            <span className="hidden md:inline">Faturas</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Server size={16} />
            <span className="hidden md:inline">Serviços</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-6">
          {/* Dashboard metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Serviços Ativos"
              value={activeServices}
              icon={<Server className="h-4 w-4" />}
              isLoading={servicesLoading}
            />
            <MetricCard
              title="Pedidos Pendentes"
              value={pendingOrders}
              icon={<CalendarClock className="h-4 w-4" />}
              isLoading={loading}
            />
            <MetricCard
              title="Total Investido"
              value={formatPrice(totalSpent)}
              icon={<CreditCard className="h-4 w-4" />}
              isLoading={loading}
            />
          </div>
          
          {/* Recent orders and invoices */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    Pedidos Recentes
                  </CardTitle>
                  <CardDescription>Seus últimos pedidos</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between border-b border-muted pb-2">
                        <div>
                          <p className="font-medium">#{order.id.substring(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' || order.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : order.status === 'pending' 
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {formatOrderStatus(order.status)}
                          </div>
                          <div className="font-medium mt-1">
                            {formatPrice(order.total_amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button asChild variant="ghost" size="sm" className="w-full">
                      <Link to="/customer/orders" className="flex items-center justify-center">
                        Ver todos os pedidos
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">Você ainda não tem pedidos.</p>
                    <Button asChild>
                      <Link to="/hospedagem">Fazer um pedido</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                    Faturas Recentes
                  </CardTitle>
                  <CardDescription>Suas faturas mais recentes</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {orders.some(order => order.invoices?.length > 0) ? (
                  <div className="space-y-4">
                    {orders
                      .filter(order => order.invoices && order.invoices.length > 0)
                      .slice(0, 3)
                      .map((order) => (
                        order.invoices.map((invoice: any) => (
                          <div key={invoice.id} className="flex items-center justify-between border-b border-muted pb-2">
                            <div>
                              <p className="font-medium">{invoice.invoice_number}</p>
                              <p className="text-sm text-muted-foreground">{formatDateTime(invoice.created_at)}</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                invoice.status === 'paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : invoice.status === 'issued' 
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {formatInvoiceStatus(invoice.status)}
                              </div>
                              <div className="font-medium mt-1">
                                {formatPrice(order.total_amount)}
                              </div>
                            </div>
                          </div>
                        ))
                      ))}
                    <Button asChild variant="ghost" size="sm" className="w-full">
                      <Link to="/customer/invoices" className="flex items-center justify-center">
                        Ver todas as faturas
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Você não tem faturas.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Orders Tab Content */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                Seus Pedidos
              </CardTitle>
              <CardDescription>Histórico completo de pedidos</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b border-muted pb-3 mb-3">
                      <div>
                        <p className="font-medium">#{order.id.substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
                        {order.items && order.items.length > 0 && (
                          <p className="text-sm mt-1">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' || order.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : order.status === 'pending' 
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatOrderStatus(order.status)}
                        </div>
                        <div className="font-medium mt-1">
                          {formatPrice(order.total_amount)}
                        </div>
                        <Button asChild variant="ghost" size="sm" className="mt-2">
                          <Link to={`/customer/orders/${order.id}`}>
                            Detalhes
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-center">
                    <Button asChild>
                      <Link to="/customer/orders" className="flex items-center justify-center">
                        Ver todos os pedidos
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">Você ainda não tem pedidos.</p>
                  <Button asChild>
                    <Link to="/hospedagem">Fazer um pedido</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Invoices Tab Content */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Suas Faturas
              </CardTitle>
              <CardDescription>Histórico de faturas e pagamentos</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.some(order => order.invoices?.length > 0) ? (
                <div className="space-y-4">
                  {orders
                    .filter(order => order.invoices && order.invoices.length > 0)
                    .slice(0, 5)
                    .map((order) => (
                      order.invoices.map((invoice: any) => (
                        <div key={invoice.id} className="flex items-center justify-between border-b border-muted pb-3 mb-3">
                          <div>
                            <p className="font-medium">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">Emitida em: {formatDateTime(invoice.created_at)}</p>
                            {invoice.due_date && (
                              <p className="text-sm text-muted-foreground">
                                Vencimento: {formatDateTime(invoice.due_date)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : invoice.status === 'issued' 
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {formatInvoiceStatus(invoice.status)}
                            </div>
                            <div className="font-medium mt-1">
                              {formatPrice(order.total_amount)}
                            </div>
                            <Button asChild variant="ghost" size="sm" className="mt-2">
                              <Link to={`/customer/invoices/${invoice.id}`}>
                                Visualizar
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))
                    ))}
                  <div className="flex justify-center">
                    <Button asChild>
                      <Link to="/customer/invoices" className="flex items-center justify-center">
                        Ver todas as faturas
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Você ainda não tem faturas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Services Tab Content */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-muted-foreground" />
                Seus Serviços
              </CardTitle>
              <CardDescription>Serviços contratados e suas datas de vencimento</CardDescription>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="h-48">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                          <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : services.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {services.map(service => (
                    <ServiceDetailCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">Você ainda não tem serviços ativos.</p>
                  <Button asChild>
                    <Link to="/hospedagem">Contratar serviços</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDashboard;
