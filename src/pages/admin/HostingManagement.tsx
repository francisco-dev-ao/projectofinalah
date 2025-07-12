
import React, { useState, useEffect } from 'react';
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, CheckCircle2, X, Trash2 } from "lucide-react";
import {
  getServices,
  updateServiceStatus,
  deleteService,
} from "@/services/serviceManagementService";
import { ServiceStatus } from "@/types/service";
import { useAdminAuth } from "@/hooks/use-admin-auth";

const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ServiceStatus>('all');
  const { addAuditLogEntry } = useAdminAuth();

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    try {
      const resp = await getServices();
      if (resp.success) {
        setServices(resp.services);
      } else {
        toast.error("Falha ao carregar serviços");
      }
    } catch {
      toast.error("Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, status: ServiceStatus) {
    setLoading(true);
    try {
      const { success } = await updateServiceStatus(id, status);
      if (success) {
        toast.success(`Serviço marcado como "${status}"`);
        await addAuditLogEntry(`Serviço ${id} -> ${status}`);
        loadServices();
      } else {
        toast.error("Falha ao atualizar status");
      }
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;
    setLoading(true);
    try {
      const { success } = await deleteService(id);
      if (success) {
        toast.success("Serviço excluído");
        await addAuditLogEntry(`Serviço ${id} excluído`);
        loadServices();
      } else {
        toast.error("Falha ao excluir serviço");
      }
    } catch {
      toast.error("Erro ao excluir serviço");
    } finally {
      setLoading(false);
    }
  }

  const filtered = services.filter(s => {
    const rx = new RegExp(searchQuery, 'i');
    const okSearch = rx.test(s.id) || rx.test(s.name) || rx.test(s.profiles?.name ?? '');
    const okStatus = selectedStatus === 'all' || s.status === selectedStatus;
    return okSearch && okStatus;
  });

  const formatStatus = (st: ServiceStatus) => {
    switch (st) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'suspended': return 'Suspenso';
      case 'cancelled': return 'Cancelado';
      default: return st;
    }
  };

  const badgeVariant = (st: ServiceStatus) => {
    switch (st) {
      case 'active': return 'outline'; // Changed from 'success' to 'outline' to match Badge variants
      case 'pending': return 'default';
      default: return 'destructive';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Gerenciar Serviços</h1>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Serviços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap sm:flex-row items-center gap-2">
              <Input
                type="search"
                placeholder="Buscar por nome ou ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select
                value={selectedStatus}
                onValueChange={v => setSelectedStatus(v as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="suspended">Suspensos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={loadServices}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <RefreshCw /> Atualizar
              </Button>
            </div>

            {loading && !filtered.length && (
              <div className="p-8 text-center">Carregando serviços...</div>
            )}

            {filtered.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.id.substring(0, 8)}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>
                          <Badge variant={badgeVariant(s.status)}>
                            {formatStatus(s.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          {s.status !== 'active' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(s.id, 'active')}
                            >
                              <CheckCircle2 />
                            </Button>
                          )}
                          {s.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(s.id, 'cancelled')}
                            >
                              <X />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleDelete(s.id)}
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center">Nenhum serviço encontrado.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ServiceManagement;
