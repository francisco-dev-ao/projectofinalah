
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAdminInvoices } from "@/hooks/useAdminInvoices";
import { toast } from "sonner";

type InvoiceDialogProps = {
  order: any;
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: { invoiceNumber: string; notes?: string }) => void;
};

const InvoiceDialog = ({ order, open, onClose, onSubmit }: InvoiceDialogProps) => {
  // Generate a default invoice number based on order ID and current date
  const defaultInvoiceNumber = () => {
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const orderIdShort = order?.id ? order.id.substring(0, 4) : 'XXXX';
    
    return `INV-${year}${month}-${orderIdShort}`;
  };

  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber());
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createInvoiceForOrder } = useAdminInvoices();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order?.id) {
      toast.error("Pedido inválido");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate invoice for this order
      const invoice = await createInvoiceForOrder(order.id);
      
      if (invoice && onSubmit) {
        onSubmit({
          invoiceNumber: invoice.invoice_number,
          notes: notes.trim() ? notes : undefined
        });
      }
      
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Fatura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número da Fatura</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações à fatura se necessário"
                rows={3}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Pedido ID: #{order?.id?.substring(0, 8)}</p>
              <p>Cliente: {order?.profiles?.name || "N/A"}</p>
              <p>Data do pedido: {new Date(order?.created_at).toLocaleDateString('pt-AO')}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Fatura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;
