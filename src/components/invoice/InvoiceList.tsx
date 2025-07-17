
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { Eye, Download } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  created_at: string;
  due_date: string;
  status: string;
  total_amount?: number;
  pdf_url?: string;
}

interface Order {
  total_amount?: number;
}

const InvoiceList: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          created_at,
          due_date,
          status,
          pdf_url,
          total_amount,
          orders (
            total_amount
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching invoices:", error);
        toast.error("Erro ao carregar faturas");
      } else if (data) {
        const formattedInvoices = data.map((item) => ({
          id: item.id,
          invoice_number: item.invoice_number,
          created_at: item.created_at,
          due_date: item.due_date,
          status: item.status,
          total_amount: item.total_amount || (item.orders as Order)?.total_amount || 0,
          pdf_url: item.pdf_url
        }));
        setInvoices(formattedInvoices);
      }
    } catch (error) {
      console.error("Error in fetchInvoices:", error);
      toast.error("Erro ao carregar faturas");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paga';
      case 'issued':
        return 'Emitida';
      case 'draft':
        return 'Rascunho';
      case 'canceled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'issued':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturas</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Nº da Fatura</th>
                  <th className="py-2 text-left">Data</th>
                  <th className="py-2 text-left">Vencimento</th>
                  <th className="py-2 text-left">Valor</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{invoice.invoice_number}</td>
                    <td className="py-3">{formatDateTime(invoice.created_at)}</td>
                    <td className="py-3">{formatDateTime(invoice.due_date)}</td>
                    <td className="py-3">
                      {formatPrice(invoice.total_amount || 0)}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClassName(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {invoice.pdf_url && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma fatura encontrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceList;
