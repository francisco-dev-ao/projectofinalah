
import React from "react";
import { Badge } from "@/components/ui/badge";

type OrderStatusBadgeProps = {
  status: string;
  type?: "order" | "payment";
};

const OrderStatusBadge = ({ status, type = "order" }: OrderStatusBadgeProps) => {
  // Get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'confirmed':
        return 'success';
      case 'pending':
      case 'awaiting':
      case 'draft':
      case 'issued':
        return 'default';
      case 'canceled':
      case 'cancelled':
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };
  
  const getStatusText = (status: string, type: string) => {
    if (type === "order") {
      switch (status.toLowerCase()) {
        case 'pending': return 'Pendente';
        case 'processing': return 'Em processamento';
        case 'completed': return 'Concluído';
        case 'canceled': return 'Cancelado';
        case 'cancelled': return 'Cancelado';
        case 'paid': return 'Pago';
        case 'issued': return 'Emitido';
        default: return status;
      }
    } else {
      switch (status.toLowerCase()) {
        case 'awaiting': return 'Aguardando';
        case 'confirmed': return 'Confirmado';
        case 'failed': return 'Falhou';
        case 'paid': return 'Pago';
        default: return status;
      }
    }
  };
  
  return (
    <Badge variant={getStatusBadge(status)}>
      {getStatusText(status, type)}
    </Badge>
  );
};

export default OrderStatusBadge;
