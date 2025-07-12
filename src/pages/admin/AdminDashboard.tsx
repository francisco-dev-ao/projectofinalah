import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/admin/AdminLayout";
import { TrendingUp, Users, ShoppingBag, CreditCard } from "lucide-react";
import Chart from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalSales: 0,
    newUsers: 0
  });
  
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch total orders
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      // Fetch pending orders
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // Fetch total sales (sum of confirmed payments)
      const { data: salesData } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('status', 'confirmed');
      
      const totalSales = salesData?.reduce((acc, payment) => acc + parseFloat(payment.amount_paid.toString()), 0) || 0;
      
      // Fetch new users in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      // Fetch recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setStats({
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalSales,
        newUsers: newUsers || 0
      });
      
      setRecentOrders(orders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Revenue Chart data
  const revenueChartData = {
    options: {
      chart: {
        id: "revenue-chart",
        toolbar: {
          show: false,
        },
      },
      xaxis: {
        categories: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
        labels: {
          style: {
            fontSize: '10px',
          },
        },
      },
      stroke: {
        curve: 'smooth' as 'smooth', // Type assertion to match exact expected type
      },
      tooltip: {
        y: {
          formatter: (value: number) => formatPrice(value),
        },
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 300
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    },
    series: [
      {
        name: "Receita",
        data: [12000, 19000, 15000, 22000, 18000, 24500, 30000, 28000, 26000, 32000, 30000, 35000],
      },
    ],
  };

  // Orders Chart data
  const ordersChartData = {
    options: {
      chart: {
        id: "orders-chart",
        toolbar: {
          show: false,
        },
      },
      xaxis: {
        categories: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
        labels: {
          style: {
            fontSize: '10px',
          },
        },
      },
      stroke: {
        curve: 'smooth' as 'smooth', // Type assertion to match exact expected type
      },
      colors: ['#84cc16', '#f59e0b', '#ef4444'],
      tooltip: {
        y: {
          formatter: (value: number) => `${value} pedidos`,
        },
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 300
          },
          legend: {
            position: 'bottom',
            fontSize: '10px',
          }
        }
      }]
    },
    series: [
      {
        name: "Concluídos",
        data: [31, 40, 28, 51, 42, 35, 58, 45, 42, 56, 43, 60],
      },
      {
        name: "Pendentes",
        data: [11, 15, 10, 18, 12, 15, 20, 13, 16, 14, 12, 18],
      },
      {
        name: "Cancelados",
        data: [5, 7, 4, 9, 3, 5, 8, 5, 7, 4, 6, 3],
      },
    ],
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'canceled':
        return 'bg-red-100 text-red-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Visão geral do seu negócio e métricas importantes.
          </p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Pedidos Totais
              </CardTitle>
              <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-lg md:text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                +10% comparado ao mês passado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Pedidos Pendentes
              </CardTitle>
              <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-lg md:text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Aguardando processamento
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Receita Total
              </CardTitle>
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-lg md:text-2xl font-bold truncate">{formatPrice(stats.totalSales)}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                +5% comparado ao mês passado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Novos Clientes
              </CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-lg md:text-2xl font-bold">{stats.newUsers}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Nos últimos 30 dias
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="w-full flex justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="revenue" className="text-xs sm:text-sm">Receita</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm">Pedidos</TabsTrigger>
          </TabsList>
          <TabsContent value="revenue" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-base sm:text-lg">Receita Mensal</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Receita total por mês para o ano atual.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 sm:h-80 md:h-96">
                <Chart 
                  options={revenueChartData.options}
                  series={revenueChartData.series}
                  type="area"
                  height="100%"
                />
              </CardContent>
            </Card>
            <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Receita Este Mês
                  </CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-lg md:text-2xl font-bold truncate">{formatPrice(35000)}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    +8% comparado ao mês passado
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Valor Médio por Pedido
                  </CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-lg md:text-2xl font-bold">{formatPrice(750)}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    +2% comparado ao mês passado
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Taxa de Conversão
                  </CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-lg md:text-2xl font-bold">3.2%</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    +0.5% comparado ao mês passado
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-base sm:text-lg">Pedidos Mensais</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Número de pedidos por mês para o ano atual.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 sm:h-80 md:h-96">
                <Chart 
                  options={ordersChartData.options}
                  series={ordersChartData.series}
                  type="line"
                  height="100%"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-base sm:text-lg">Pedidos Recentes</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Os 5 pedidos mais recentes no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-medium leading-none">
                        Pedido #{order.id.substring(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cliente: {order.profiles?.name || "Cliente"}
                      </p>
                    </div>
                    <div className="sm:ml-auto font-medium text-xs sm:text-sm">
                      {formatPrice(order.total_amount)}
                    </div>
                    <div className={`sm:ml-4 text-[10px] sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 rounded inline-block ${getStatusColor(order.status)}`}>
                      {order.status === 'pending' && 'Pendente'}
                      {order.status === 'processing' && 'Em Processamento'}
                      {order.status === 'completed' && 'Concluído'}
                      {order.status === 'canceled' && 'Cancelado'}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-xs sm:text-sm text-muted-foreground">
                  Nenhum pedido recente para exibir.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
