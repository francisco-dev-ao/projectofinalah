
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Print reference system removed

interface InvoiceViewProps {
  invoice: any;
  companySettings?: any;
}

export default function InvoiceView({ invoice, companySettings }: InvoiceViewProps) {
  const company = companySettings?.[0] || {};
  const customer = invoice?.orders?.profiles?.[0] || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Fatura #{invoice?.invoice_number}</span>
          {/* Print reference removed */}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Empresa</h3>
            <p>{company?.name || 'AngoHost'}</p>
            <p>NIF: {company?.nif || ''}</p>
            <p>{company?.address || ''}</p>
            <p>{company?.city || ''}</p>
            <p>{company?.email || ''}</p>
            <p>{company?.phone || ''}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Cliente</h3>
            <p>{customer?.name || ''}</p>
            <p>NIF: {customer?.nif || ''}</p>
            <p>{customer?.address || ''}</p>
            <p>{customer?.city || ''}</p>
            <p>{customer?.email || ''}</p>
            <p>{customer?.phone || ''}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
