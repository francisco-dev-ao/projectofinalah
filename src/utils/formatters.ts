import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Format date for display
export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    return 'Data inválida';
  }
};

// Format order status for display
export const formatOrderStatus = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'processing': return 'Em processamento';
    case 'completed': return 'Concluído';
    case 'canceled': return 'Cancelado';
    case 'cancelled': return 'Cancelado';
    case 'paid': return 'Pago';
    case 'issued': return 'Não Pago';
    default: return status;
  }
};

// Format invoice status for display
export const formatInvoiceStatus = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'paid': return 'Pago';
    case 'cancelled': return 'Cancelado';
    case 'canceled': return 'Cancelado';
    case 'issued': return 'Não Pago';
    case 'overdue': return 'Vencido';
    case 'draft': return 'Pendente';
    default: return status;
  }
};

// Format payment status for display
export const formatPaymentStatus = (status: string): string => {
  switch (status) {
    case 'awaiting': return 'Aguardando';
    case 'confirmed': return 'Confirmado';
    case 'failed': return 'Falhou';
    case 'paid': return 'Pago';
    default: return status;
  }
};

// Formato correto da moeda: KZ 35.000,00
export const formatMoney = (amount?: number) => {
  if (typeof amount !== "number" || isNaN(amount)) return "KZ 0,00";
  
  // Usar pt-PT para formato europeu: ponto para milhares, vírgula para decimais
  const formatted = new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount);
  
  return `KZ ${formatted}`;
};
