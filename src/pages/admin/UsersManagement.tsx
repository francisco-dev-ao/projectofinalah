
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, RefreshCcw } from "lucide-react";
import UserFormDialog from "@/components/admin/UserFormDialog";
import AdminUsersList from "@/components/admin/security/AdminUsersList";
import AuditLogsSection from "@/components/admin/security/AuditLogsSection";
import { getAllUsers, updateUserRole } from "@/services/user/adminUserService";
import { fetchAuditLogs } from "@/services/audit-log-service";
import { AuditLog } from "@/components/admin/security/AuditLogsSection";

const UsersManagement = () => {
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  // Users query com refetch automático a cada 30 segundos para tempo real
  const {
    data: usersResult,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAllUsers,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchOnWindowFocus: true, // Atualiza quando a janela ganha foco
    refetchOnMount: true, // Atualiza ao montar o componente
  });

  // Audit logs query
  const {
    data: auditLogsData,
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => fetchAuditLogs(),
    refetchInterval: 60000, // Atualiza logs a cada 1 minuto
  });

  // Handle role change
  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const response = await updateUserRole(userId, role as any);
      if (response && response.success) {
        toast.success("Função do usuário atualizada com sucesso");
        // Força atualização imediata da lista
        await refetchUsers();
      } else {
        toast.error("Erro ao atualizar função do usuário");
      }
    } catch (error) {
      toast.error("Erro ao atualizar função do usuário");
    }
  };

  // Handle successful user creation
  const handleUserCreated = async () => {
    toast.success("Usuário criado com sucesso");
    // Força atualização imediata da lista
    await refetchUsers();
    setIsCreateUserOpen(false);
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (activeTab === "users") {
      await refetchUsers();
      toast.success("Lista de usuários atualizada");
    } else {
      await refetchLogs();
      toast.success("Logs de auditoria atualizados");
    }
  };

  // Transform the users data to match the AdminUser type expected by the component
  const users = usersResult?.users || [];

  // Extract logs data from auditLogsData and ensure it matches the AuditLog type
  const auditLogs: AuditLog[] = (auditLogsData?.logs || []).map((log: any) => ({
    id: log.id,
    user_id: log.user_id,
    action: log.action,
    details: log.details,
    created_at: log.created_at,
    ip_address: log.ip_address,
    profiles: log.profiles || null
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={isLoadingUsers || isLoadingLogs}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button onClick={() => setIsCreateUserOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="auditLogs">Logs de Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <AdminUsersList
              users={users || []}
              loading={isLoadingUsers}
              onChangeRole={handleRoleChange}
              onRefresh={refetchUsers}
            />
          </TabsContent>

          <TabsContent value="auditLogs" className="space-y-4">
            <AuditLogsSection
              logs={auditLogs}
              loading={isLoadingLogs}
              onRefresh={refetchLogs}
            />
          </TabsContent>
        </Tabs>
      </div>

      <UserFormDialog
        open={isCreateUserOpen}
        setOpen={setIsCreateUserOpen}
        onSuccess={handleUserCreated}
      />
    </AdminLayout>
  );
};

export default UsersManagement;
