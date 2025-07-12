import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ServiceStatus } from "@/types/service";

interface ManageUserServicesDialogProps {
  userId: string;
  userName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ServiceFormData {
  name: string;
  type: "hosting" | "email" | "domain";
  status: ServiceStatus;
  product_id?: string;
  start_date: Date;
  end_date: Date;
  auto_renew: boolean;
  domain_id?: string;
  configs: {
    [key: string]: any;
  };
  notes?: string;
}

const ManageUserServicesDialog: React.FC<ManageUserServicesDialogProps> = ({
  userId,
  userName,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const initialFormData: ServiceFormData = {
    name: "",
    type: "hosting",
    status: "active",
    start_date: new Date(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
    auto_renew: true,
    configs: {},
    notes: "",
  };

  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availableDomains, setAvailableDomains] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addAuditLogEntry } = useAdminAuth();

  // Load products and domains when dialog opens
  useEffect(() => {
    if (open && userId) {
      loadUserData();
    }
  }, [open, userId]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Load available products for service types
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (productsError) throw productsError;
      setAvailableProducts(productsData || []);

      // Load user domains (for domain and email services)
      const { data: domainsData, error: domainsError } = await supabase
        .from("domains")
        .select("id, domain_name, tld, status")
        .eq("user_id", userId)
        .order("domain_name", { ascending: true });

      if (domainsError) throw domainsError;
      setAvailableDomains(domainsData || []);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Erro ao carregar informações do usuário");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (field: keyof ServiceFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfigChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      configs: {
        ...prev.configs,
        [key]: value,
      },
    }));
  };

  const getServiceSpecificFields = () => {
    switch (formData.type) {
      case "hosting":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="package">Pacote de Hospedagem</Label>
              <Select
                value={formData.configs.package || ""}
                onValueChange={(value) => handleConfigChange("package", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um pacote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="server">Servidor</Label>
              <Input
                id="server"
                value={formData.configs.server || ""}
                onChange={(e) => handleConfigChange("server", e.target.value)}
                placeholder="ex: srv01.angohost.co.ao"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resources">Recursos</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="disk">Espaço em Disco (GB)</Label>
                  <Input
                    id="disk"
                    type="number"
                    value={formData.configs.disk || ""}
                    onChange={(e) => handleConfigChange("disk", e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="bandwidth">Largura de Banda (GB)</Label>
                  <Input
                    id="bandwidth"
                    type="number"
                    value={formData.configs.bandwidth || ""}
                    onChange={(e) =>
                      handleConfigChange("bandwidth", e.target.value)
                    }
                    placeholder="100"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain_id">Domínio</Label>
              <Select
                value={formData.domain_id || ""}
                onValueChange={(value) => handleFormChange("domain_id", value)}
                disabled={availableDomains.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      availableDomains.length === 0
                        ? "Nenhum domínio disponível"
                        : "Selecione um domínio"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableDomains.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.domain_name}.{domain.tld}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mailboxes">Número de Caixas de Email</Label>
              <Input
                id="mailboxes"
                type="number"
                value={formData.configs.mailboxes || ""}
                onChange={(e) =>
                  handleConfigChange("mailboxes", parseInt(e.target.value))
                }
                placeholder="5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mailbox_size">Tamanho por Caixa (GB)</Label>
              <Input
                id="mailbox_size"
                type="number"
                value={formData.configs.mailbox_size || ""}
                onChange={(e) =>
                  handleConfigChange("mailbox_size", parseInt(e.target.value))
                }
                placeholder="2"
              />
            </div>
          </div>
        );

      case "domain":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain_name">Nome do Domínio</Label>
              <div className="flex gap-2">
                <Input
                  id="domain_name"
                  value={formData.configs.domain_name || ""}
                  onChange={(e) =>
                    handleConfigChange("domain_name", e.target.value)
                  }
                  placeholder="exemplo"
                />
                <Select
                  value={formData.configs.tld || ""}
                  onValueChange={(value) => handleConfigChange("tld", value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="TLD" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="co.ao">co.ao</SelectItem>
                    <SelectItem value="ao">ao</SelectItem>
                    <SelectItem value="org.ao">org.ao</SelectItem>
                    <SelectItem value="ed.ao">ed.ao</SelectItem>
                    <SelectItem value="gv.ao">gv.ao</SelectItem>
                    <SelectItem value="com">com</SelectItem>
                    <SelectItem value="net">net</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="privacy_protection"
                checked={!!formData.configs.privacy_protection}
                onCheckedChange={(checked) =>
                  handleConfigChange("privacy_protection", checked)
                }
              />
              <Label htmlFor="privacy_protection">Proteção de Privacidade</Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      if (!userId) {
        throw new Error("ID do usuário não fornecido");
      }

      // Service specific validations
      if (formData.type === "email" && !formData.domain_id) {
        toast.error("Selecione um domínio para o serviço de email");
        return;
      }
      
      if (formData.type === "domain" && (!formData.configs.domain_name || !formData.configs.tld)) {
        toast.error("Nome de domínio e TLD são obrigatórios");
        return;
      }

      // Create service record
      const serviceData = {
        user_id: userId,
        name: formData.name,
        status: formData.status,
        product_id: formData.product_id || null,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString(),
        activation_date: formData.start_date.toISOString(),
        auto_renew: formData.auto_renew,
        domain_id: formData.domain_id || null,
        config: formData.configs,
        notes: formData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert service into Supabase
      const { data: serviceResult, error: serviceError } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (serviceError) throw serviceError;

      // If this is a domain service, create or update the domain record
      if (formData.type === "domain") {
        const domainData = {
          user_id: userId,
          domain_name: formData.configs.domain_name,
          tld: formData.configs.tld,
          status: formData.status,
          auto_renew: formData.auto_renew,
          privacy_protection: !!formData.configs.privacy_protection,
          registration_date: formData.start_date.toISOString(),
          expiration_date: formData.end_date.toISOString(),
          service_id: serviceResult.id
        };
        
        const { error: domainError } = await supabase
          .from('domains')
          .insert(domainData);
          
        if (domainError) {
          console.error("Error creating domain:", domainError);
          // Continue anyway as the service was created
        }
      }
      
      // Log the action
      // FIX: Convert the object to a string for the audit log
      await addAuditLogEntry(
        `create_service: Service '${formData.name}' (${formData.type}) added for user: ${userName || userId}`
      );

      toast.success("Serviço adicionado com sucesso");
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error adding service:", error);
      toast.error(`Erro ao adicionar serviço: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Serviço para {userName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="service_name">Nome do Serviço</Label>
              <Input
                id="service_name"
                required
                value={formData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                placeholder="ex: Hospedagem Premium Site Empresa XYZ"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">Tipo de Serviço</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => handleFormChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hosting">Hospedagem</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="domain">Domínio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => handleFormChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date
                        ? format(formData.start_date, "PP")
                        : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) =>
                        handleFormChange("start_date", date || new Date())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Expiração</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date
                        ? format(formData.end_date, "PP")
                        : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) =>
                        handleFormChange("end_date", date || new Date())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto_renew"
                checked={formData.auto_renew}
                onCheckedChange={(checked) =>
                  handleFormChange("auto_renew", checked)
                }
              />
              <Label htmlFor="auto_renew">Renovação Automática</Label>
            </div>

            <div className="pt-2 border-t">
              <h3 className="font-medium mb-3">Configurações Específicas</h3>
              {getServiceSpecificFields()}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => handleFormChange("notes", e.target.value)}
                placeholder="Observações sobre este serviço"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                "Adicionar Serviço"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManageUserServicesDialog;
