
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import UserDetailsDialog from "@/components/admin/UserDetailsDialog";
import UserFormDialog from "@/components/admin/UserFormDialog";
import AlertDialogCustom from "@/components/ui/alert-dialog-custom";
import { deleteUser } from "@/services/user/adminUserService";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface AdminUsersListProps {
  users: any[];
  loading: boolean;
  onChangeRole: (userId: string, role: string) => void;
  onRefresh?: () => void;
  onPromoteToAdmin?: (email: string) => void;
  onPromoteToSuperAdmin?: (email: string) => void;
}

const AdminUsersList = ({ 
  users, 
  loading, 
  onChangeRole, 
  onRefresh
}: AdminUsersListProps) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const getUserEmail = (user: any) => {
    if (!user) return 'N/A';
    // Busca em todos os campos/subcampos possíveis
    const possibleEmails = [
      user.email,
      user.profile?.email,
      user.profiles?.email,
      user.user?.email,
      user.user?.profile?.email,
      user.user?.profiles?.email,
      user.company_email,
      user.contact_email
    ];
    const found = possibleEmails.find(email => typeof email === 'string' && email.trim() && email.trim().toLowerCase() !== 'n/a');
    return found || 'N/A';
  };

  const getUserName = (user: any) => {
    if (!user) return 'N/A';
    return user.name || 'N/A';
  };

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleDelete = (user: any) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      console.log('Excluindo usuário:', userToDelete.id);
      const result = await deleteUser(userToDelete.id);
      
      if (result && result.success) {
        toast.success("Usuário excluído com sucesso");
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error("Erro ao excluir usuário");
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error("Erro ao excluir usuário");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handleRoleChange = (userId: string, role: string) => {
    onChangeRole(userId, role);
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando usuários...</div>;
  }

  console.log('Users received in component:', users);

  if (!users || users.length === 0) {
    return <div className="p-4 text-center">Nenhum usuário encontrado</div>;
  }

  // Filter out null/undefined users and ensure they have required fields
  const validUsers = users.filter(user => {
    if (!user || !user.id) {
      console.log('Filtering out invalid user:', user);
      return false;
    }
    return true;
  });

  console.log('Valid users after filtering:', validUsers);

  if (validUsers.length === 0) {
    return <div className="p-4 text-center">Nenhum usuário válido encontrado</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validUsers.map((user) => {
              console.log('Rendering user:', user);
              return (
                <TableRow key={user.id}>
                  <TableCell>{getUserName(user)}</TableCell>
                  <TableCell className="font-medium">{getUserEmail(user)}</TableCell>
                  <TableCell>
                    <Select 
                      value={user.role || 'cliente'} 
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Selecionar função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="suporte">Suporte</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Detalhes */}
      {selectedUser && (
        <UserDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          user={selectedUser}
          onUserUpdated={onRefresh}
        />
      )}

      {/* Dialog de Edição */}
      {selectedUser && (
        <UserFormDialog
          open={showEditDialog}
          setOpen={setShowEditDialog}
          user={selectedUser}
          onSuccess={() => {
            setShowEditDialog(false);
            setSelectedUser(null);
            if (onRefresh) onRefresh();
          }}
          isEditing={true}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialogCustom
        open={showDeleteDialog}
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir o usuário "${getUserName(userToDelete)}" (${getUserEmail(userToDelete)})? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setUserToDelete(null);
        }}
        loading={isDeleting}
      />
    </>
  );
};

export default AdminUsersList;
