import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/components/admin/order-details/OrderDetailsUtils";
import { ServiceStatus } from "@/types/service";
import { PDFGenerator } from "@/utils/pdfGenerator"; // Importar o gerador
import { toast } from "react-hot-toast"; // Adicionar toast notifications

interface ServiceDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  service: any;
  onStatusUpdate: (serviceId: string, newStatus: ServiceStatus) => Promise<void>;
  onDelete: (serviceId: string) => Promise<void>;
  onServicesChange: () => Promise<void>;
}

const ServiceDetailsDialog = ({
  open,
  onClose,
  service,
  onStatusUpdate,
  onDelete,
  onServicesChange
}: ServiceDetailsDialogProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  if (!service) return null;

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

  // Get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'outline'; // Changed from 'success' to 'outline'
      case 'pending':
      case 'awaiting':
        return 'default';
      case 'suspended':
      case 'canceled':
      case 'cancelled':
      case 'expired':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      const pdfBuffer = await PDFGenerator.generateServicePDF(service);
      
      // Converter buffer para blob
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      
      // Criar URL e iniciar download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `servico-${service.id}-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF do serviço');
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Serviço</span>
            <Badge variant={getStatusBadge(service.status)} className="px-3 py-1 text-sm">
              {formatServiceStatus(service.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium mb-2">Informações Básicas</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-xs">{service.id}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Data de Criação:</span>
                <span>{formatDate(service.created_at)}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Data de Ativação:</span>
                <span>{service.activation_date ? formatDate(service.activation_date) : "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Data de Expiração:</span>
                <span>{service.end_date ? formatDate(service.end_date) : "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Auto Renovação:</span>
                <span>{service.auto_renew ? "Sim" : "Não"}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Informações do Cliente</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{service.profiles?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Email:</span>
                <span>{service.profiles?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Empresa:</span>
                <span>{service.profiles?.company_name || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">ID do Cliente:</span>
                <span className="font-mono text-xs">{service.user_id}</span>
              </div>
            </div>

            {service.domains && service.domains.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Domínio Associado</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Nome de Domínio:</span>
                    <span className="font-medium">{service.domains[0].domain_name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Status do Domínio:</span>
                    <span>{formatServiceStatus(service.domains[0].status)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {service.order_item && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Detalhes do Item de Pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Preço Unitário:</span>
                <span>{service.order_item.unit_price ? `${service.order_item.unit_price} AOA` : "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Quantidade:</span>
                <span>{service.order_item.quantity || "1"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Duração:</span>
                <span>
                  {service.order_item.duration ? `${service.order_item.duration} ${service.order_item.duration_unit || "meses"}` : "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <h3 className="font-medium mb-2">Ações de Status</h3>
          <div className="flex flex-wrap gap-2">
            {service.status !== 'active' && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onStatusUpdate(service.id, 'active' as ServiceStatus)}
              >
                Ativar Serviço
              </Button>
            )}
            {service.status !== 'pending' && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => onStatusUpdate(service.id, 'pending' as ServiceStatus)}
              >
                Marcar como Pendente
              </Button>
            )}
            {service.status !== 'suspended' && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => onStatusUpdate(service.id, 'suspended' as ServiceStatus)}
              >
                Suspender Serviço
              </Button>
            )}
            {service.status !== 'cancelled' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onStatusUpdate(service.id, 'cancelled' as ServiceStatus)}
              >
                Cancelar Serviço
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => onDelete(service.id)}
            >
              Excluir Serviço
            </Button>
            
            <Button
              variant="default"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
            </Button>
          </div>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailsDialog;
