import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatPrice, formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { InvoiceActions } from '@/components/invoice/InvoiceActions';

const UnpaidInvoicesAdminList = () => {
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnpaidInvoices();
  }, []);

  const fetchUnpaidInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(`*, orders!inner (id, total_amount, user_id, profiles:user_id(name,email))`)
        .eq('status', 'issued')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setUnpaidInvoices(data || []);
    } catch (error) {
      console.error("Error fetching unpaid invoices (admin):", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Faturas Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (unpaidInvoices.length === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200">
      <CardHeader className="bg-yellow-50 border-b border-yellow-100">
        <CardTitle className="flex items-center text-amber-800">
          <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
          Faturas Pendentes (Todos os Clientes)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {unpaidInvoices.map((invoice) => (
            <li key={invoice.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">Fatura #{invoice.invoice_number}</p>
                <p className="text-sm text-muted-foreground">
                  Cliente: {invoice.orders?.profiles?.name || invoice.orders?.user_id}
                </p>
                <p className="text-sm text-muted-foreground">
                  Emitida em {formatDateTime(invoice.created_at)}
                </p>
                {invoice.due_date && (
                  <p className="text-sm text-red-500">
                    Vencimento: {formatDateTime(invoice.due_date)}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <p className="font-bold text-lg">{formatPrice(invoice.orders.total_amount)}</p>
                <div className="mt-2">
                  <InvoiceActions 
                    invoiceId={invoice.id} 
                    invoiceNumber={invoice.invoice_number} 
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default UnpaidInvoicesAdminList;
