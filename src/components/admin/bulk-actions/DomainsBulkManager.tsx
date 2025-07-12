
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/components/admin/order-details/OrderDetailsUtils';
import BulkSelectionBar from './BulkSelectionBar';
import BulkDeleteDialog from './BulkDeleteDialog';
import ClientBulkActions from './ClientBulkActions';

interface Domain {
  id: string;
  domain_name: string;
  status: string;
  created_at: string;
  expiry_date?: string;
  profiles?: {
    name?: string;
    email?: string;
    company_name?: string;
  };
}

export default function DomainsBulkManager() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteClientDialog, setShowDeleteClientDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('domains')
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
      setDomains(data || []);
    } catch (error) {
      console.error('Erro ao carregar domínios:', error);
      toast.error('Erro ao carregar domínios');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDomains = domains.filter(domain => {
    const matchesSearch = 
      domain.domain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (domain.profiles?.name && domain.profiles.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (domain.profiles?.email && domain.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || domain.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectDomain = (domainId: string, checked: boolean) => {
    const newSelected = new Set(selectedDomains);
    if (checked) {
      newSelected.add(domainId);
    } else {
      newSelected.delete(domainId);
    }
    setSelectedDomains(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDomains(new Set(filteredDomains.map(domain => domain.id)));
    } else {
      setSelectedDomains(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDomains.size === 0) return;

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const domainId of selectedDomains) {
      try {
        const { error } = await supabase
          .from('domains')
          .delete()
          .eq('id', domainId);

        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        errorCount++;
        console.error('Error deleting domain:', error);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} domínio(s) excluído(s) com sucesso`);
      await loadDomains();
      setSelectedDomains(new Set());
    }

    if (errorCount > 0) {
      toast.error(`Erro ao excluir ${errorCount} domínio(s)`);
    }

    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  const handleDeleteClientDomains = async () => {
    if (!selectedClientId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('user_id', selectedClientId);

      if (error) throw error;

      toast.success(`Todos os domínios do cliente foram excluídos`);
      await loadDomains();
      setSelectedClientId(null);
      setSelectedClientName("");
    } catch (error) {
      console.error('Error deleting client domains:', error);
      toast.error('Erro ao excluir domínios do cliente');
    }

    setIsDeleting(false);
    setShowDeleteClientDialog(false);
  };

  const getUniqueClients = () => {
    const clientsMap = new Map();
    domains.forEach(domain => {
      if (domain.profiles) {
        const clientId = domain.profiles.email || domain.id;
        const clientName = domain.profiles.name || domain.profiles.company_name || 'Cliente';
        const clientEmail = domain.profiles.email;
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, { id: clientId, name: clientName, email: clientEmail });
        }
      }
    });
    return Array.from(clientsMap.values());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isAllSelected = filteredDomains.length > 0 && selectedDomains.size === filteredDomains.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Gerenciar Domínios em Massa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Selecione e exclua múltiplos domínios ou todos os domínios de um cliente específico.
          </p>
        </CardContent>
      </Card>

      <BulkSelectionBar
        selectedCount={selectedDomains.size}
        totalCount={filteredDomains.length}
        onDeleteSelected={() => setShowDeleteDialog(true)}
        onClearSelection={() => setSelectedDomains(new Set())}
        isDeleting={isDeleting}
        entityType="domínio"
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
        entityType="domínios"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por domínio, cliente ou email..."
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
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadDomains} disabled={isLoading} variant="outline">
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
                    <TableHead>Domínio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDomains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDomains.has(domain.id)}
                          onCheckedChange={(checked) => handleSelectDomain(domain.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {domain.domain_name}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {domain.profiles?.name || domain.profiles?.company_name || 'Cliente'}
                          </div>
                          {domain.profiles?.email && (
                            <div className="text-sm text-gray-500">
                              {domain.profiles.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(domain.created_at)}</TableCell>
                      <TableCell>
                        {domain.expiry_date ? formatDate(domain.expiry_date) : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(domain.status)}</TableCell>
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
        title="Confirmar Exclusão de Domínios"
        description="Tem certeza que deseja excluir os domínios selecionados? Esta ação não pode ser desfeita."
        items={filteredDomains.filter(domain => selectedDomains.has(domain.id)).map(d => ({ name: d.domain_name, id: d.id }))}
        isDeleting={isDeleting}
        entityType="domínio"
      />

      <BulkDeleteDialog
        open={showDeleteClientDialog}
        onClose={() => setShowDeleteClientDialog(false)}
        onConfirm={handleDeleteClientDomains}
        title="Confirmar Exclusão de Domínios do Cliente"
        description={`Tem certeza que deseja excluir TODOS os domínios do cliente "${selectedClientName}"? Esta ação não pode ser desfeita.`}
        items={domains.filter(domain => domain.profiles?.email === selectedClientId || domain.profiles?.name === selectedClientName).map(d => ({ name: d.domain_name, id: d.id }))}
        isDeleting={isDeleting}
        entityType="domínio"
      />
    </div>
  );
}
