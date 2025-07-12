
import { Link } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext";
import { useAllCustomerDomains, DisplayDomain } from "@/hooks/useAllCustomerDomains";
import { formatDate } from "@/lib/utils";

const CustomerDomains = () => {
  const { user } = useAuth();
  const { domains, loading } = useAllCustomerDomains(user?.id);

  const getStatusBadge = (domain: DisplayDomain) => {
    const status = domain.status.toLowerCase();
    
    if (domain.source === 'database') {
      switch (status) {
        case 'active':
          return <Badge className="bg-green-600 hover:bg-green-700">Ativo</Badge>;
        case 'pending':
          return <Badge variant="secondary">Pendente</Badge>;
        case 'expired':
          return <Badge variant="destructive">Expirado</Badge>;
        default:
          return <Badge variant="outline">{domain.status}</Badge>;
      }
    }
    
    // from order
    switch (status) {
      case 'processando':
        return <Badge>Processando</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{domain.status}</Badge>;
    }
  };

  const getFullDomainName = (domain: DisplayDomain) => {
    if (domain.tld === "custom" || !domain.tld) {
      return domain.domain_name;
    }
    return `${domain.domain_name}.${domain.tld}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meus Domínios</h1>
          <p className="text-muted-foreground">Gerencie seus domínios registrados e acompanhe os pedidos pendentes.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/customer/contact-profiles">Perfil de contactos</Link>
          </Button>
          <Button asChild>
            <Link to="/dominios">Registrar Novo Domínio</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Domínios</CardTitle>
          <CardDescription>
            Listando domínios registrados e domínios de pedidos pendentes.
            {domains.length > 0 && ` (${domains.length} domínio${domains.length !== 1 ? "s" : ""} listados)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="w-full flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Carregando domínios...</span>
            </div>
          ) : domains.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[700px] w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Domínio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Expiração</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain) => {
                    const fullDomainName = getFullDomainName(domain);
                    return (
                      <TableRow key={domain.id}>
                        <TableCell className="font-medium">{fullDomainName}</TableCell>
                        <TableCell>
                          {getStatusBadge(domain)}
                        </TableCell>
                        <TableCell>
                          {domain.expiration_date ? formatDate(domain.expiration_date) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {domain.source === 'database' ? (
                            <Badge variant="outline">Registrado</Badge>
                          ) : (
                            <Badge variant="secondary">Pedido</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {domain.source === 'order' && domain.order_id ? (
                            <Link to={`/customer/orders/${domain.order_id}`}>
                              <Button variant="outline" size="sm">
                                Ver pedido
                              </Button>
                            </Link>
                          ) : domain.source === 'database' ? (
                            <Link to={`/customer/domains/${domain.id}`}>
                              <Button variant="outline" size="sm">
                                Gerenciar
                              </Button>
                            </Link>
                          ) : null}
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
                Você ainda não registrou ou encomendou um domínio.
              </p>
              <Button className="mt-4" asChild>
                <Link to="/dominios">Registrar Domínio</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDomains;
