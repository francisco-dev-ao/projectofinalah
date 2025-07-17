
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDirectPayment, PaymentMethod } from "@/services/paymentService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type DirectPaymentDialogProps = {
  open: boolean;
  onClose: () => void;
  order: any;
  onOrdersChange?: () => Promise<void>;
};

const DirectPaymentDialog = ({ open, onClose, order, onOrdersChange }: DirectPaymentDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  
  const [paymentData, setPaymentData] = useState({
    method: "bank_transfer" as PaymentMethod,
    amount: order?.total_amount || 0,
    notes: "",
    receiptUrl: "",
    transactionId: "",
  });

  const handleChange = (field: string, value: any) => {
    setPaymentData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (!order?.id || !user?.id) {
        toast.error("Pedido inválido ou usuário não autenticado");
        return;
      }

      // Registra o pagamento direto
      const { success, error } = await createDirectPayment({
        orderId: order.id,
        method: paymentData.method,
        amount: Number(paymentData.amount),
        userId: user.id,
        notes: paymentData.notes,
        receiptUrl: paymentData.receiptUrl,
        transactionId: paymentData.transactionId,
      }, user.id);

      if (!success) {
        toast.error(`Erro ao processar pagamento: ${error?.message || "Erro desconhecido"}`);
        return;
      }
      
      toast.success("Pagamento processado com sucesso");

      // Refresh orders list if callback provided
      if (onOrdersChange) {
        await onOrdersChange();
      }
      
      // Close dialog
      onClose();
    } catch (error: any) {
      toast.error(`Erro ao processar pagamento: ${error.message || "Ocorreu um erro desconhecido"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento Direto (Sem Fatura)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Pedido #{order?.id?.substring(0, 8)}</p>
            <p className="text-sm text-gray-500">Cliente: {order?.profiles?.name || order?.user?.email || "N/A"}</p>
            <p className="text-sm text-gray-500">Total: AOA {order?.total_amount?.toLocaleString() || "0"}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de Pagamento</Label>
              <Select
                value={paymentData.method}
                onValueChange={(value) => handleChange("method", value as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multicaixa">Multicaixa Express</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Pago (AOA)</Label>
              <Input
                id="amount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-id">ID da Transação (opcional)</Label>
              <Input
                id="transaction-id"
                value={paymentData.transactionId}
                onChange={(e) => handleChange("transactionId", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receipt-url">Link do Comprovante (opcional)</Label>
              <Input
                id="receipt-url"
                value={paymentData.receiptUrl}
                onChange={(e) => handleChange("receiptUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Adicione informações adicionais sobre o pagamento..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Pagamento"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DirectPaymentDialog;
