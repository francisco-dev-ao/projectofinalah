
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// Print reference system removed

interface Invoice {
  id: string;
  invoice_number?: string;
  created_at: string;
  status: string;
  pdf_url?: string;
  orders?: {
    profiles?: {
      name?: string;
      company_name?: string;
      email?: string;
    };
  };
}

interface InvoiceCardsMobileProps {
  invoices: Invoice[];
  selectedInvoices: Set<string>;
  onSelectInvoice: (invoiceId: string, checked: boolean) => void;
  getStatusClass: (status: string) => string;
  getStatusInPortuguese: (status: string) => string;
}

export default function InvoiceCardsMobile({
  invoices,
  selectedInvoices,
  onSelectInvoice,
  getStatusClass,
  getStatusInPortuguese
}: InvoiceCardsMobileProps) {
  return (
    <div className="lg:hidden space-y-4">
      {invoices.length > 0 ? (
        invoices.map((invoice) => (
          <Card key={invoice.id} className="p-4">
            <div className="space-y-3">
              {/* Header with Checkbox */}
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedInvoices.has(invoice.id)}
                    onCheckedChange={(checked) => onSelectInvoice(invoice.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Fatura #{invoice.invoice_number || invoice.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {invoice.orders?.profiles?.name || invoice.orders?.profiles?.company_name || 'Cliente'}
                    </p>
                    {invoice.orders?.profiles?.email && (
                      <p className="text-xs text-gray-500">
                        {invoice.orders.profiles.email}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className={getStatusClass(invoice.status)}>
                  {getStatusInPortuguese(invoice.status)}
                </Badge>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Data:</span>
                  <p className="font-medium">
                    {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a href={`/customer/invoices/${invoice.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </a>
                </Button>
                {/* Print reference removed */}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    try {
                      const { downloadHelpers } = await import("@/utils/downloadHelpers");
                      // Não exigir referência de pagamento
                      await downloadHelpers.printInvoiceDirectly(invoice, false);
                    } catch (error) {
                      console.error('Erro ao imprimir:', error);
                    }
                  }}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Nenhuma fatura encontrada</p>
        </Card>
      )}
    </div>
  );
}
