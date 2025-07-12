
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InvoicesListProps {
  invoices: any[];
  customers?: any[];
}

export default function InvoicesList({ invoices, customers }: InvoicesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Faturas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {invoices?.map((invoice) => {
            const customer = customers?.[0] || {};
            return (
              <div key={invoice.id} className="p-4 border rounded">
                <p>Fatura #{invoice.invoice_number}</p>
                <p>Cliente: {customer?.name || 'N/A'}</p>
                <p>Valor: {invoice.amount}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
