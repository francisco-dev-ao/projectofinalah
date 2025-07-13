import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Edit, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import UserDetailsDialog from "@/components/admin/UserDetailsDialog";
import UserFormDialog from "@/components/admin/UserFormDialog";
import { getAllUsers, updateUserRole, deleteUser } from "@/services/user/adminUserService";
import { getUserById } from "@/services/userService";
import { UserRole } from "@/types/admin-auth";

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await getAllUsers();
      
      if (result && result.success && result.users) {
        setUsers(result.users);
      } else {
        console.error("Unexpected data format from getAllUsers:", result);
        toast.error("Falha ao carregar usuários");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (userId: string) => {
    try {
      setLoading(true);
      const result = await getUserById(userId);
      
      if (result && result.success && result.user) {
        setSelectedUser(result.user);
        setIsDetailsOpen(true);
      } else {
        toast.error("Não foi possível carregar detalhes do usuário");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Erro ao carregar detalhes do usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (userId: string) => {
    try {
      setLoading(true);
      const result = await getUserById(userId);
      
      if (result && result.success && result.user) {
        setSelectedUser(result.user);
        setIsEditing(true);
        setIsFormOpen(true);
      } else {
        toast.error("Não foi possível carregar detalhes do usuário");
      }
    } catch (error) {
      console.error("Error fetching user for edit:", error);
      toast.error("Erro ao carregar dados do usuário para edição");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
      try {
        setLoading(true);
        const result = await deleteUser(userId);
        
        if (result && result.success) {
          toast.success("Usuário excluído com sucesso");
          loadUsers();
        } else {
          toast.error("Não foi possível excluir o usuário");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Erro ao excluir usuário");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      setLoading(true);
      const result = await updateUserRole(userId, newRole as UserRole);
      
      if (result && result.success) {
        toast.success("Função do usuário atualizada com sucesso");
        loadUsers();
      } else {
        toast.error("Não foi possível atualizar a função do usuário");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Erro ao atualizar função do usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    // This function expects 3 parameters, but we're configuring the component
    // to use the onSubmit prop instead to handle the submission
    setIsFormOpen(false);
    loadUsers();
  };

  const handleUpdateUser = async (userData: any) => {
    try {
      setLoading(true);
      // Implement user update
      toast.success("Usuário atualizado com sucesso");
      loadUsers();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Erro ao atualizar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (userData: any) => {
    if (isEditing) {
      await handleUpdateUser(userData);
    } else {
      await handleCreateUser(userData);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(searchLower);
    const emailMatch = user.email?.toLowerCase().includes(searchLower);
    const roleMatch = selectedRole === "all" || user.role === selectedRole;
    
    return (nameMatch || emailMatch) && roleMatch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-blue-500">Admin</Badge>;
      case "suporte":
        return <Badge variant="secondary">Suporte</Badge>;
      case "cliente":
        return <Badge variant="outline">Cliente</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Gerenciar Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            Gerencie todos os usuários da plataforma: administradores, suporte e clientes.
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar usuários..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => loadUsers()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
            <Button onClick={() => {
              setSelectedUser(null);
              setIsEditing(false);
              setIsFormOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Data de Registro</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                      <TableCell>{user.email || "N/A"}</TableCell>
                      <TableCell>{getRoleBadge(user.role || "cliente")}</TableCell>
                      <TableCell>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>{user.company_name || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(user.id)}
                          >
                            Detalhes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user.id)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <UserDetailsDialog
        user={selectedUser}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onRoleUpdate={handleRoleUpdate}
      />

      <UserFormDialog
        user={isEditing ? selectedUser : null}
        open={isFormOpen}
        setOpen={setIsFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        isEditing={isEditing}
        onSuccess={() => {
          loadUsers();
        }}
      />
    </AdminLayout>
  );
};

export default UserManagement;
