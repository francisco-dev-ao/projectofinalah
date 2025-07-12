
import React, { useEffect } from "react";
import InvoiceList from "@/components/invoice/InvoiceList";
import { useInvoices } from "@/hooks/useInvoices";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useInvoiceBucket } from "@/hooks/useInvoiceBucket";

export default function InvoicesPage() {
  const { invoices, isLoading, error } = useInvoices();
  const { initializeInvoiceBucket } = useInvoiceBucket();

  useEffect(() => {
    if (error) {
      toast.error("Erro ao carregar faturas: " + error);
    }
    
    // Initialize the invoice bucket if needed
    initializeInvoiceBucket();
  }, [error, initializeInvoiceBucket]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Faturas</h1>
      
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <InvoiceList />
      )}
    </div>
  );
}
