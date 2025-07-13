import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ServiceDetailsDialogProps {
  service: any;
}

export function ServiceDetailsDialog({ service }: ServiceDetailsDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrintService = async () => {
    try {
      setIsGenerating(true);
      toast.loading('Preparando impressão...');

      // Criar conteúdo para impressão do serviço
      const printContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2>Detalhes do Serviço</h2>
          <hr>
          <p><strong>Nome:</strong> ${service.service_name || 'N/A'}</p>
          <p><strong>Status:</strong> ${getStatusInPortuguese(service.status)}</p>
          <p><strong>Data de Criação:</strong> ${format(new Date(service.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
          ${service.activation_date ? 
            `<p><strong>Data de Ativação:</strong> ${format(new Date(service.activation_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>` 
            : ''
          }
          <hr>
          <small>Documento gerado automaticamente pelo sistema AngoHost</small>
        </div>
      `;

      // Abrir janela de impressão
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
      
      toast.success('Informações do serviço preparadas para impressão!');
    } catch (error: any) {
      console.error('Erro ao imprimir serviço:', error);
      toast.error(error.message || 'Erro ao imprimir serviço');
    } finally {
      setIsGenerating(false);
      toast.dismiss();
    }
  };

  const getStatusInPortuguese = (status: string) => {
    const statusMap: Record<string, string> = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'suspended': 'Suspenso',
      'canceled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Serviço</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nome do Serviço</label>
              <p className="mt-1">{service.service_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <Badge className={getStatusColor(service.status)}>
                  {getStatusInPortuguese(service.status)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Data de Criação</label>
              <p className="mt-1">
                {format(new Date(service.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
            {service.activation_date && (
              <div>
                <label className="text-sm font-medium text-gray-500">Data de Ativação</label>
                <p className="mt-1">
                  {format(new Date(service.activation_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button
              onClick={handlePrintService}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              Imprimir Detalhes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}