
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Domain } from "@/services/domain/domainService";
import { toast } from "sonner";
import DomainsBulkManager from "@/components/admin/bulk-actions/DomainsBulkManager";
import { useAuth } from "@/contexts/AuthContext";
import AdminDomainOrdersList from "@/components/admin/AdminDomainOrdersList";

const DomainsManagement = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const navigate = useNavigate();
  
  // Check admin authentication
  const { user, profile, isLoading } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('domains')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            email,
            company_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading domains:', error);
        toast.error("Erro ao carregar domínios");
        return;
      }
      
      setDomains(data || []);
    } catch (error) {
      console.error("Erro ao carregar domínios:", error);
      toast.error("Erro ao carregar lista de domínios");
    } finally {
      setLoading(false);
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
      case 'transferred':
        return 'Transferido';
      default:
        return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'default';
      case 'expired':
        return 'destructive';
      case 'transferred':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-AO', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getFullDomainName = (domain: Domain) => {
    if (domain.tld === 'custom') {
      return domain.domain_name;
    }
    return `${domain.domain_name}.${domain.tld}`;
  };

  const handleDomainEdit = (domainId: string) => {
    navigate(`/admin/domains/${domainId}/edit`);
  };

  const handleSelectDomain = (domainId: string) => {
    setSelectedDomains(prev => 
      prev.includes(domainId) 
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDomains.length === domains.length) {
      setSelectedDomains([]);
    } else {
      setSelectedDomains(domains.map(domain => domain.id));
    }
  };


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
          ) : domains.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedDomains.length === domains.length && domains.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Domínio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Registrado em</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain) => {
                    const fullDomainName = getFullDomainName(domain);
                    return (
                      <TableRow key={domain.id}>
                        <TableCell className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedDomains.includes(domain.id)}
                            onChange={() => handleSelectDomain(domain.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {fullDomainName}
                        </TableCell>
                        <TableCell>
                          {(domain as any).profiles?.name || (domain as any).profiles?.company_name || 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(domain.registration_date)}</TableCell>
                        <TableCell>{formatDate(domain.expiration_date)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(domain.status)}>
                            {formatStatus(domain.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleDomainEdit(domain.id)}>
                            Gerenciar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">Nenhum domínio encontrado</h3>
              <p className="text-muted-foreground mt-1">
                Ainda não há domínios registrados no sistema.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DomainsManagement;
