import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateUserRole, UserRole } from "@/services/userService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import ManageUserServicesDialog from "./ManageUserServicesDialog";
import { formatDateTime } from "@/utils/formatters";

const roleSchema = z.object({
  role: z.enum(['admin', 'super_admin', 'support', 'sales', 'cliente', 'suporte', 'comercial']),
});

export type UserDetailsDialogProps = {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  user: any;
  onUsersChange?: () => void;
  onUserUpdated?: () => void;
  onDelete?: (userId: string) => void;
  onRoleUpdate?: (userId: string, newRole: string) => Promise<void>;
};

const UserDetailsDialog = ({ 
  open, 
  onOpenChange, 
  user, 
  onUsersChange, 
  onUserUpdated,
  onDelete,
  onClose,
  onRoleUpdate
}: UserDetailsDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { user: loggedInUser } = useAdminAuth();
  const [userServices, setUserServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: (user?.role as UserRole) || "cliente",
    },
  });

  useEffect(() => {
    if (open && user?.id) {
      loadUserServices();
    }
  }, [open, user?.id]);

  const loadUserServices = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingServices(true);
      const { data, error } = await supabase
        .from('services')
        .select('*, domains(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserServices(data || []);
    } catch (error) {
      console.error("Error loading user services:", error);
      toast.error("Não foi possível carregar os serviços do usuário");
    } finally {
      setLoadingServices(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof roleSchema>) => {
    try {
      setIsUpdating(true);
      if (onRoleUpdate) {
        await onRoleUpdate(user.id, values.role as UserRole);
        if (onClose) onClose();
        if (onOpenChange) onOpenChange(false);
      } else {
        const result = await updateUserRole(user.id, values.role as UserRole);
        if (result && result.success) {
          toast.success("User role updated successfully!");
          if (onUsersChange) onUsersChange();
          if (onUserUpdated) onUserUpdated();
          if (onOpenChange) onOpenChange(false);
          if (onClose) onClose();
        } else {
          toast.error("Failed to update user role.");
        }
      }
    } catch (error) {
      toast.error("Failed to update user role.");
      console.error("Error updating user role:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDelete = () => {
    if (onDelete && user?.id) {
      onDelete(user.id);
    }
  };

  const handleDialogOpenChange = (newOpenState: boolean) => {
    if (onOpenChange) onOpenChange(newOpenState);
    if (onClose && !newOpenState) onClose();
  };

  const handleServiceDialogSuccess = () => {
    loadUserServices();
  };

  const formatServiceStatus = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'canceled': return 'Cancelado';
      case 'cancelled': return 'Cancelado';
      case 'suspended': return 'Suspenso';
      case 'expired': return 'Expirado';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'default';
      case 'suspended':
        return 'warning';
      case 'cancelled':
      case 'canceled':
      case 'expired':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatServiceType = (service: any) => {
    const name = service.name?.toLowerCase();
    if (name.includes('domínio') || name.includes('domain')) {
      return 'Domínio';
    } else if (name.includes('email') || name.includes('correio')) {
      return 'Email';
    } else if (name.includes('hospedag') || name.includes('hosting')) {
      return 'Hospedagem';
    } else {
      return 'Outro';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Informações</TabsTrigger>
              <TabsTrigger value="services">Serviços</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input type="text" id="name" value={user.name} readOnly className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input type="email" id="email" value={user.email} readOnly className="col-span-3" />
                </div>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Função</FormLabel>
                            <div className="col-span-3">
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma função" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                  <SelectItem value="support">Support</SelectItem>
                                  <SelectItem value="sales">Sales</SelectItem>
                                  <SelectItem value="cliente">Cliente</SelectItem>
                                  <SelectItem value="suporte">Suporte</SelectItem>
                                  <SelectItem value="comercial">Comercial</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-between">
                      {onDelete && (
                        <Button type="button" variant="destructive" onClick={handleDelete} disabled={loggedInUser?.id === user?.id}>
                          Excluir Usuário
                        </Button>
                      )}
                      <Button type="submit" disabled={isUpdating || loggedInUser?.id === user?.id}>
                        {isUpdating ? "Atualizando..." : "Atualizar Função"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </TabsContent>
            
            <TabsContent value="services">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Serviços do Usuário</h3>
                  <Button 
                    onClick={() => setServiceDialogOpen(true)} 
                    size="sm"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Serviço
                  </Button>
                </div>
                
                {loadingServices ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : userServices.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expira em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>{service.name}</TableCell>
                            <TableCell>{formatServiceType(service)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadge(service.status)}>
                                {formatServiceStatus(service.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(service.end_date)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <p className="text-muted-foreground mb-2">Nenhum serviço encontrado para este usuário</p>
                    <Button
                      onClick={() => setServiceDialogOpen(true)} 
                      variant="outline"
                      size="sm"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Adicionar Serviço
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ManageUserServicesDialog
        userId={user.id}
        userName={user.name}
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        onSuccess={handleServiceDialogSuccess}
      />
    </>
  );
};

export default UserDetailsDialog;
