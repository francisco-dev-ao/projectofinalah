
import React from 'react';
import InvoicePdfGenerator from './InvoicePdfGenerator';

interface InvoicePdfManagerProps {
  invoice: any;
  onSuccess?: () => void;
}

export default function InvoicePdfManager({ invoice, onSuccess }: InvoicePdfManagerProps) {
  return (
    <InvoicePdfGenerator
      invoiceId={invoice.id}
      invoiceNumber={invoice.invoice_number}
      pdfUrl={invoice.pdf_url}
      onSuccess={() => onSuccess?.()}
      variant="icon"
    />
  );
}
