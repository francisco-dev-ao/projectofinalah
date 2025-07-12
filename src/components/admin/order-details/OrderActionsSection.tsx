
import React from "react";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/types/order";
import { toast } from "sonner";
import { Check, ArrowRight, FileText } from "lucide-react";

type OrderActionsSectionProps = {
  orderStatus: string;
  orderId: string;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onCreateInvoice?: () => void;
};

const OrderActionsSection = ({
  orderStatus,
  orderId,
  onStatusUpdate,
  onCreateInvoice
}: OrderActionsSectionProps) => {
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      await onStatusUpdate(orderId, newStatus);
      toast.success(`Status do pedido atualizado para ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Erro ao atualizar status do pedido");
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Ações</h3>
      <div className="flex flex-wrap gap-2">
        {/* Status update actions */}
        {orderStatus === "pending" && (
          <>
            <Button
              onClick={() => handleStatusUpdate(OrderStatus.PROCESSING)}
              variant="outline"
              className="flex items-center gap-1"
            >
              <ArrowRight className="h-4 w-4" />
              Marcar como Processando
            </Button>
            <Button
              onClick={() => handleStatusUpdate(OrderStatus.PAID)}
              variant="outline"
              className="flex items-center gap-1"
            >
              <Check className="h-4 w-4" />
              Marcar como Pago
            </Button>
          </>
        )}

        {orderStatus === "processing" && (
          <>
            <Button
              onClick={() => handleStatusUpdate(OrderStatus.COMPLETED)}
              variant="outline"
              className="flex items-center gap-1"
            >
              <Check className="h-4 w-4" />
              Marcar como Concluído
            </Button>
          </>
        )}

        {/* Invoice generation action */}
        {onCreateInvoice && (
          <Button
            onClick={onCreateInvoice}
            variant="outline"
            className="flex items-center gap-1"
          >
            <FileText className="h-4 w-4" />
            Gerar Fatura
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderActionsSection;
