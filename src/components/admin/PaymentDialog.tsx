import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createDirectPayment } from "@/services/paymentService";
import { PaymentMethod } from "@/types/order";
import { generateInvoice } from "@/services/invoice";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  order: any;
  onOrdersChange: () => void;
}

const PaymentDialog = ({ open, onClose, order, onOrdersChange }: PaymentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Reset form on open
  useEffect(() => {
    if (open && order) {
      setPaymentMethod("");
      setAmount(order?.total_amount?.toString() || "");
      setNotes("");
      setTransactionId("");
    }
  }, [open, order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentMethod) {
      toast.error("Selecione um método de pagamento");
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    
    if (!order?.id) {
      toast.error("Pedido inválido");
      return;
    }
    
    try {
      setIsRegistering(true);
      
      // Register the payment
      const { success } = await createDirectPayment({
        orderId: order.id,
        method: paymentMethod as any,
        amount: parseFloat(amount),
        notes,
        transactionId
      });
      
      if (success) {
        toast.success("Pagamento registrado com sucesso");
        
        // Generate invoice if it doesn't exist
        if (!order.invoices || order.invoices.length === 0) {
          console.log("Generating invoice for order:", order.id);
          const invoiceResult = await generateInvoice(order.id);
          if (invoiceResult.success) {
            console.log("Invoice generated:", invoiceResult.invoice);
          } else {
            console.error("Failed to generate invoice:", invoiceResult.error);
          }
        }
        
        // Refresh orders list
        onOrdersChange();
        
        // Close dialog
        onClose();
      } else {
        toast.error("Falha ao registrar pagamento");
      }
    } catch (error) {
      console.error("Error registering payment:", error);
      toast.error("Erro ao registrar pagamento");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="method">
              Método de Pagamento
            </label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentMethod.MULTICAIXA}>Multicaixa Express</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="amount">
              Valor (Kz)
            </label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="transaction">
              ID da Transação
            </label>
            <Input
              id="transaction"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="ID ou referência da transação"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="notes">
              Observações
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre o pagamento..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isRegistering}>
              {isRegistering ? "Registrando..." : "Registrar Pagamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
