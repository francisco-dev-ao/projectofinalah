
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { downloadHelpers } from '@/utils/downloadHelpers';
import { formatCurrency } from '@/lib/utils';

interface OrderInvoicesProps {
  orderId: string;
}

export default function OrderInvoices({ orderId }: OrderInvoicesProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchInvoices();
    }
  }, [orderId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            profiles:user_id (*),
            order_items (*)
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      setInvoices(data || []);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoice: any) => {
    try {
      setDownloading(invoice.id);
      await downloadHelpers.downloadInvoicePDF(invoice);
    } catch (error) {
      console.error('Erro ao baixar fatura:', error);
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'issued': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'canceled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      paid: 'Pago',
      issued: 'Emitida',
      pending: 'Pendente',
      canceled: 'Cancelada',
      draft: 'Rascunho',
      overdue: 'Vencida'
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma fatura encontrada para este pedido.
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium">Faturas</h3>
      
      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="shadow-sm">
            <CardHeader className="py-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    #{invoice.invoice_number || invoice.id?.substring(0, 8)}
                  </CardTitle>
                  <CardDescription>
                    Emitida em {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </CardDescription>
                </div>
                <Badge className={getStatusBadgeColor(invoice.status)}>
                  {translateStatus(invoice.status)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="py-2">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <p className="text-gray-500">Valor:</p>
                  <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-gray-500">Vencimento:</p>
                  <p className="font-medium">
                    {invoice.due_date
                      ? format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ptBR })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-2 py-3">
              {invoice.pdf_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver PDF
                  </a>
                </Button>
              )}
              
              <Button
                variant="default"
                size="sm"
                onClick={() => handleDownloadInvoice(invoice)}
                disabled={downloading === invoice.id}
              >
                {downloading === invoice.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
