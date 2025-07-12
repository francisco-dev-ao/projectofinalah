import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Eye, RefreshCw, Download, Settings, BarChart3 } from "lucide-react";

interface MulticaixaReferenceConfig {
  entity: string;
  client_id: string;
  client_secret: string;
  base_url: string;
  callback_url: string;
  auto_generate: boolean;
  expiration_hours: number;
  custom_instructions: string;
  is_active: boolean;
}

interface PaymentReference {
  id: string;
  reference: string;
  entity: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  order_id: string;
  customer_name: string;
  created_at: string;
  expires_at: string;
  paid_at?: string;
}

const MulticaixaReferenceManagement = () => {
  const { user, isAdmin } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<MulticaixaReferenceConfig>({
    entity: "11333",
    client_id: "",
    client_secret: "",
    base_url: "https://api.multicaixa.ao",
    callback_url: "",
    auto_generate: true,
    expiration_hours: 24,
    custom_instructions: "Para pagar esta referência, acesse o app Multicaixa Express ou qualquer terminal Multicaixa em Angola.",
    is_active: true
  });
  
  const [references, setReferences] = useState<PaymentReference[]>([]);
  const [stats, setStats] = useState({
    total_references: 0,
    paid_references: 0,
    pending_references: 0,
    total_amount_paid: 0
  });

  useEffect(() => {
    loadConfig();
    loadReferences();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('multicaixa_reference_config')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data?.multicaixa_reference_config) {
        const savedConfig = typeof data.multicaixa_reference_config === 'string' 
          ? JSON.parse(data.multicaixa_reference_config)
          : data.multicaixa_reference_config;
        setConfig({ ...config, ...savedConfig });
      }
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      // Mock data - em produção seria uma consulta real
      const mockReferences: PaymentReference[] = [
        {
          id: "ref_1",
          reference: "123456789",
          entity: "11333",
          amount: 25000,
          status: "paid",
          order_id: "order_123",
          customer_name: "João Silva",
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          paid_at: new Date().toISOString()
        },
        {
          id: "ref_2",
          reference: "987654321",
          entity: "11333",
          amount: 45000,
          status: "pending",
          order_id: "order_456",
          customer_name: "Maria Santos",
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setReferences(mockReferences);
    } catch (error) {
      console.error("Error loading references:", error);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats - em produção seria calculado dos dados reais
      setStats({
        total_references: 156,
        paid_references: 98,
        pending_references: 45,
        total_amount_paid: 2450000
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      
      const { data: settings, error: fetchError } = await supabase
        .from('company_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const configData = {
        multicaixa_reference_config: config
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('company_settings')
          .update(configData)
          .eq('id', settings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_settings')
          .insert(configData);
        
        if (error) throw error;
      }

      toast.success("Configurações do Multicaixa por Referência salvas com sucesso!");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700">Expirado</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `KZ ${new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(amount)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-AO');
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">Acesso Negado</h3>
          <p className="text-muted-foreground mt-1">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Multicaixa por Referência</h1>
            <p className="text-muted-foreground">
              Gestão completa do sistema de pagamento por referência Multicaixa
            </p>
          </div>
          <Button onClick={() => loadReferences()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
            <TabsTrigger value="references">Referências</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Referências</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_references}</div>
                  <p className="text-xs text-muted-foreground">Todas as referências criadas</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Referências Pagas</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.paid_references}</div>
                  <p className="text-xs text-muted-foreground">Pagamentos confirmados</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending_references}</div>
                  <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.total_amount_paid)}</div>
                  <p className="text-xs text-muted-foreground">Valor total pago</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações do Multicaixa por Referência
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros do sistema de pagamento por referência
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entity">Entidade Multicaixa</Label>
                    <Input
                      id="entity"
                      value={config.entity}
                      onChange={(e) => setConfig({ ...config, entity: e.target.value })}
                      placeholder="11333"
                    />
                    <p className="text-sm text-muted-foreground">
                      Código da entidade fornecido pelo Multicaixa
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiration">Expiração (horas)</Label>
                    <Select 
                      value={config.expiration_hours.toString()} 
                      onValueChange={(value) => setConfig({ ...config, expiration_hours: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hora</SelectItem>
                        <SelectItem value="6">6 horas</SelectItem>
                        <SelectItem value="12">12 horas</SelectItem>
                        <SelectItem value="24">24 horas</SelectItem>
                        <SelectItem value="48">48 horas</SelectItem>
                        <SelectItem value="72">72 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_id">Client ID</Label>
                    <Input
                      id="client_id"
                      type="password"
                      value={config.client_id}
                      onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                      placeholder="Seu Client ID da API"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="client_secret">Client Secret</Label>
                    <Input
                      id="client_secret"
                      type="password"
                      value={config.client_secret}
                      onChange={(e) => setConfig({ ...config, client_secret: e.target.value })}
                      placeholder="Seu Client Secret da API"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base_url">URL Base da API</Label>
                  <Input
                    id="base_url"
                    value={config.base_url}
                    onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                    placeholder="https://api.multicaixa.ao"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="callback_url">URL de Callback</Label>
                  <Input
                    id="callback_url"
                    value={config.callback_url}
                    onChange={(e) => setConfig({ ...config, callback_url: e.target.value })}
                    placeholder={`${window.location.origin}/api/multicaixa/callback`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instruções Personalizadas</Label>
                  <Textarea
                    id="instructions"
                    value={config.custom_instructions}
                    onChange={(e) => setConfig({ ...config, custom_instructions: e.target.value })}
                    placeholder="Instruções que aparecerão junto com a referência de pagamento"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_generate"
                    checked={config.auto_generate}
                    onCheckedChange={(checked) => setConfig({ ...config, auto_generate: checked })}
                  />
                  <Label htmlFor="auto_generate">Gerar referências automaticamente para novos pedidos</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={config.is_active}
                    onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Sistema ativo</Label>
                </div>

                <Button onClick={saveConfig} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="references" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Referências</CardTitle>
                <CardDescription>
                  Todas as referências de pagamento geradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referência</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {references.map((ref) => (
                      <TableRow key={ref.id}>
                        <TableCell className="font-mono">{ref.reference}</TableCell>
                        <TableCell>{ref.customer_name}</TableCell>
                        <TableCell>{formatCurrency(ref.amount)}</TableCell>
                        <TableCell>{getStatusBadge(ref.status)}</TableCell>
                        <TableCell>{formatDate(ref.created_at)}</TableCell>
                        <TableCell>{formatDate(ref.expires_at)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Pagamento</CardTitle>
                <CardDescription>
                  Relatórios e análises das referências de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Relatório Mensal
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Todas as Referências
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  Funcionalidade de relatórios detalhados será implementada em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default MulticaixaReferenceManagement;