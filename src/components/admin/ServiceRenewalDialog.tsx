
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import useServiceRenewal from "@/hooks/useServiceRenewal";

// Define the renewal options interface here
export interface RenewalOptions {
  serviceId: string;
  userId: string;
  upgradeOptions?: {
    newPlan: string;
  };
}

interface ServiceRenewalDialogProps {
  open: boolean;
  onClose: () => void;
  service: any;
  onSuccess?: () => void;
  isUpgrade?: boolean;
}

const ServiceRenewalDialog = ({
  open,
  onClose,
  service,
  onSuccess,
  isUpgrade = false
}: ServiceRenewalDialogProps) => {
  const [period, setPeriod] = useState<string>("1year");
  const [plan, setPlan] = useState<string>("");
  const { renewService, isProcessing } = useServiceRenewal();

  useEffect(() => {
    if (open && service) {
      setPeriod("1year");
      setPlan("");
    }
  }, [open, service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service?.id || !service?.user_id) {
      toast.error("Serviço inválido");
      return;
    }
    
    try {
      let result;
      
      if (isUpgrade) {
        // For now, we'll just show an error as upgradeService isn't implemented
        toast.error("Função de upgrade ainda não implementada");
        return;
      } else {
        result = await renewService(service.id, service.user_id, period);
      }
      
      if (result.success) {
        toast.success(isUpgrade 
          ? "Solicitação de upgrade enviada com sucesso" 
          : "Renovação solicitada com sucesso"
        );
        
        if (onSuccess) {
          onSuccess();
        }
        
        onClose();
      } else {
        toast.error(isUpgrade 
          ? "Erro ao solicitar upgrade" 
          : "Erro ao renovar serviço"
        );
      }
    } catch (error) {
      console.error("Error in renewal:", error);
      toast.error("Ocorreu um erro ao processar a solicitação");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isUpgrade ? "Solicitar Upgrade" : "Renovar Serviço"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {isUpgrade ? "Novo Plano" : "Período de Renovação"}
            </label>
            
            {isUpgrade ? (
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic_plus">Básico Plus</SelectItem>
                  <SelectItem value="standard">Padrão</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 mês</SelectItem>
                  <SelectItem value="3months">3 meses</SelectItem>
                  <SelectItem value="6months">6 meses</SelectItem>
                  <SelectItem value="1year">1 ano</SelectItem>
                  <SelectItem value="2years">2 anos</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : isUpgrade ? (
                "Solicitar Upgrade"
              ) : (
                "Renovar Serviço"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceRenewalDialog;
