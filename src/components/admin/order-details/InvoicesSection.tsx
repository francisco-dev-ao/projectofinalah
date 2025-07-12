
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";
import { useAdminInvoices } from "@/hooks/useAdminInvoices";

type InvoicesSectionProps = {
  invoices: any[];
  order: any;
  formatDate: (date: string) => string;
  onOrdersChange?: () => Promise<void>;
};

const InvoicesSection = ({ invoices = [], order, formatDate, onOrdersChange }: InvoicesSectionProps) => {
  const { createInvoiceForOrder, isGeneratingInvoice } = useAdminInvoices();
  const [isCreating, setIsCreating] = useState(false);
  
  const handleGenerateInvoice = async () => {
    try {
      setIsCreating(true);
      await createInvoiceForOrder(order.id);
      
      // Refresh data after generating invoice
      if (onOrdersChange) {
        await onOrdersChange();
      }
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Faturas</h3>
        {invoices.length === 0 && (
          <Button 
            onClick={handleGenerateInvoice}
            disabled={isCreating || isGeneratingInvoice}
            size="sm" 
            variant="outline"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            {isCreating ? "Gerando..." : "Gerar Fatura"}
          </Button>
        )}
      </div>
      
      {invoices && invoices.length > 0 ? (
        <div className="space-y-2">
          {invoices.map((invoice: any) => (
            <div key={invoice.id} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">
                  #{invoice.invoice_number} - {formatDate(invoice.created_at)}
                </p>
              </div>
              <OrderStatusBadge status={invoice.status} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhuma fatura emitida.</p>
      )}
    </div>
  );
};

export default InvoicesSection;
