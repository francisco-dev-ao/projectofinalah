import { PrintReferenceButton } from './PrintReferenceButton';
import { InvoiceEmailButton } from './InvoiceEmailButton';

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  customerEmail?: string;
}

export function InvoiceActions({ invoiceId, invoiceNumber, customerEmail }: InvoiceActionsProps) {
  return (
    <div className="flex gap-2">
      <InvoiceEmailButton 
        invoiceId={invoiceId} 
        invoiceNumber={invoiceNumber}
        customerEmail={customerEmail}
      />
      <PrintReferenceButton 
        invoiceId={invoiceId} 
        invoiceNumber={invoiceNumber} 
      />
    </div>
  );
}