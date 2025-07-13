
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner";
import { createUser, updateUser } from "@/services/userService";
import { UserRole, AdminUser } from "@/types/admin-auth";

interface UserFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose?: () => void;
  user?: AdminUser;
  onSuccess: () => void;
  onOpenChange?: (open: boolean) => void;
  onUserCreated?: () => void;
  onSubmit?: (userData: any) => Promise<void>;
  isEditing?: boolean;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({ 
  open, 
  setOpen, 
  onClose,
  user, 
  onSuccess,
  onOpenChange,
  onUserCreated,
  onSubmit,
  isEditing
}) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'cliente' as UserRole,
    password: '',
  });
  const [isEditMode, setIsEditMode] = useState(!!user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'cliente' as UserRole,
      password: '',
    });
    setIsEditMode(!!user);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
        return;
      }

      if (isEditMode || isEditing) {
        if (!user) {
          toast.error("Usuário não encontrado para atualizar.");
          return;
        }
        // Update user logic
        const result = await updateUser(user.id, {
          name: formData.name,
          role: formData.role,
          email: formData.email
        });
        
        if (result && result.success) {
          toast.success("Usuário atualizado com sucesso!");
          onSuccess();
          setOpen(false);
          if (onUserCreated) {
            onUserCreated();
          }
          if (onClose) {
            onClose();
          }
        } else {
          toast.error("Erro ao atualizar usuário.");
        }
      } else {
        // Create user logic with correct format
        const result = await createUser(
          formData.email, 
          formData.password, 
          {
            name: formData.name,
            role: formData.role
          }
        );
        
        if (result && result.success) {
          toast.success("Usuário criado com sucesso!");
          onSuccess();
          setOpen(false);
          if (onUserCreated) {
            onUserCreated();
          }
          if (onClose) {
            onClose();
          }
        } else {
          toast.error("Erro ao criar usuário.");
        }
      }
    } catch (error) {
      console.error("Error during user operation:", error);
      toast.error("Ocorreu um erro ao processar a operação.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormOpenChange = (newOpenState: boolean) => {
    setOpen(newOpenState);
    if (onOpenChange) {
      onOpenChange(newOpenState);
    }
    if (!newOpenState && onClose) {
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleFormOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isEditMode || isEditing ? "Editar Usuário" : "Criar Novo Usuário"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isEditMode || isEditing ? "Atualize os detalhes do usuário." : "Preencha o formulário para criar um novo usuário."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="col-span-3" />
          </div>
          {!(isEditMode || isEditing) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Senha
              </Label>
              <Input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className="col-span-3" />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: string) => setFormData(prevData => ({ 
                ...prevData, 
                role: value as UserRole 
              }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="suporte">Suporte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            if (onClose) onClose();
          }}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction disabled={loading} onClick={handleSubmit}>
            {loading ? "Salvando..." : "Salvar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserFormDialog;
