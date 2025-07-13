import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Plus, Search, Filter, Download, Trash2, Edit, Globe, Settings } from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import DomainsBulkManager from "@/components/admin/bulk-actions/DomainsBulkManager";
import { useAuth } from "@/contexts/AuthContext";
import AdminDomainOrdersList from "@/components/admin/AdminDomainOrdersList";
import SystemDataCleanup from "@/components/admin/SystemDataCleanup";

const DomainsManagement = () => {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Check admin authentication
  const { user, profile, isLoading } = useAuth();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('domain_orders')
        .select(`
          *,
          orders (
            id,
            status,
            total_amount,
            created_at,
            profiles:user_id (
              id,
              name,
              email,
              company_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast.error('Erro ao carregar domínios');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (status: string): any => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'expired':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'expired':
        return 'Expirado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const filteredDomains = domains.filter(domain => {
    const matchesSearch = domain.domain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         domain.orders?.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         domain.orders?.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || domain.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">Acesso Negado</h3>
        <p className="text-muted-foreground mt-1">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Domínios</h1>
          <p className="text-muted-foreground">Gerencie todos os domínios dos clientes.</p>
        </div>
      </div>

      <Tabs defaultValue="domains" className="space-y-6">
        <TabsList>
          <TabsTrigger value="domains">Domínios</TabsTrigger>
          <TabsTrigger value="cleanup">Limpeza de Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="space-y-6">
          {/* Domain Orders List */}
          <AdminDomainOrdersList />

          <DomainsBulkManager />

          <Card>
            <CardHeader>
              <CardTitle>Todos os Domínios</CardTitle>
              <CardDescription>
                {domains.length > 0 && `${domains.length} domínio${domains.length !== 1 ? 's' : ''} encontrado${domains.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="w-full flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando domínios...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar domínios..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredDomains.length === 0 ? (
                    <div className="text-center py-8">
                      <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum domínio encontrado</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Domínio</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Data de Criação</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDomains.map((domain) => (
                            <TableRow key={domain.id}>
                              <TableCell>
                                <div className="font-medium">{domain.domain_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  TLD: {domain.tld_type}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {domain.orders?.profiles?.name || 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {domain.orders?.profiles?.email || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getBadgeVariant(domain.status)}>
                                  {formatStatus(domain.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {formatPrice(domain.price || 0)}
                              </TableCell>
                              <TableCell>
                                {formatDateTime(domain.created_at)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    asChild
                                  >
                                    <Link to={`/admin/domains/edit/${domain.id}`}>
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleanup">
          <SystemDataCleanup />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DomainsManagement;