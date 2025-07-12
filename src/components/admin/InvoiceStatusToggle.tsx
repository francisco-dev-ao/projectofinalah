
import React from 'react';
import { updateInvoiceStatus } from '@/services/invoice';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define invoice status type directly here
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'canceled';

interface InvoiceStatusToggleProps {
  invoiceId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

const statusOptions: { value: InvoiceStatus, label: string }[] = [
  { value: 'draft', label: 'Pendente' },
  { value: 'issued', label: 'Emitida' },
  { value: 'paid', label: 'Paga' },
  { value: 'canceled', label: 'Cancelada' }
];

export function InvoiceStatusToggle({ invoiceId, currentStatus, onStatusChange }: InvoiceStatusToggleProps) {
  const handleStatusChange = async (newStatus: string) => {
    try {
      // Update invoice status
      const result = await updateInvoiceStatus(invoiceId, newStatus as InvoiceStatus);
      
      if (result.success) {
        toast.success(`Status da fatura alterado para ${getStatusLabel(newStatus)}`);
        
        // If status is changed to paid, activate related services
        if (newStatus === 'paid') {
          await activateRelatedServices(invoiceId);
        }
        
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      } else {
        toast.error('Erro ao alterar status da fatura');
        console.error('Error updating invoice status:', result.error);
      }
    } catch (error) {
      toast.error('Erro ao alterar status da fatura');
      console.error('Error updating invoice status:', error);
    }
  };

  const activateRelatedServices = async (invoiceId: string) => {
    try {
      // Get the invoice with order information
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            id,
            user_id,
            order_items (
              id,
              product_id
            )
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        console.error('Error fetching invoice for service activation:', invoiceError);
        return;
      }

      // Get services related to this order
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('order_id', invoice.order_id);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        return;
      }

      if (services && services.length > 0) {
        // Activate all services related to this invoice
        const activationPromises = services.map(service => 
          supabase
            .from('services')
            .update({ 
              status: 'active',
              activation_date: new Date().toISOString()
            })
            .eq('id', service.id)
        );

        await Promise.all(activationPromises);
        toast.success(`${services.length} serviço(s) ativado(s) automaticamente`);
      }
    } catch (error) {
      console.error('Error activating services:', error);
      toast.error('Erro ao ativar serviços automaticamente');
    }
  };
  
  const getStatusLabel = (status: string): string => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  return (
    <Select 
      value={currentStatus} 
      onValueChange={handleStatusChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Selecione o status" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
