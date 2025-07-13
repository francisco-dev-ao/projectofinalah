
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatPrice } from '@/lib/utils';
import { PrintReferenceButton } from '@/components/invoice/PrintReferenceButton';
import { Link } from 'react-router-dom';

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

interface InvoiceTableDesktopProps {
  invoices: Invoice[];
  selectedInvoices: Set<string>;
  onSelectInvoice: (invoiceId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  getStatusClass: (status: string) => string;
  getStatusInPortuguese: (status: string) => string;
}

export default function InvoiceTableDesktop({
  invoices,
  selectedInvoices,
  onSelectInvoice,
  onSelectAll,
  getStatusClass,
  getStatusInPortuguese
}: InvoiceTableDesktopProps) {
  const isAllSelected = invoices.length > 0 && selectedInvoices.size === invoices.length;

  return (
    <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PDF
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedInvoices.has(invoice.id)}
                      onCheckedChange={(checked) => onSelectInvoice(invoice.id, checked as boolean)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {invoice.invoice_number || '--'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">
                        {invoice.orders?.profiles?.name || invoice.orders?.profiles?.company_name || 'Cliente'}
                      </div>
                      {invoice.orders?.profiles?.email && (
                        <div className="text-sm text-gray-500">
                          {invoice.orders.profiles.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusClass(invoice.status)}>
                      {getStatusInPortuguese(invoice.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PrintReferenceButton
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.invoice_number}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/invoices/${invoice.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
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
                        <span className="sr-only">Imprimir</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  Nenhuma fatura encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
