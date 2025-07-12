import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { sendInvoiceViaEmail } from '@/services/invoice/emailService';
import { toast } from 'sonner';

interface InvoiceEmailButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  customerEmail?: string;
}

export function InvoiceEmailButton({ 
  invoiceId, 
  invoiceNumber, 
  customerEmail 
}: InvoiceEmailButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendEmail = async () => {
    setIsLoading(true);
    try {
      const result = await sendInvoiceViaEmail(invoiceId, customerEmail);
      if (result.success) {
        toast.success('Email enviado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao enviar email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Erro ao enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSendEmail}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Mail className="h-4 w-4 mr-2" />
      )}
      {isLoading ? 'Enviando...' : 'Enviar por Email'}
    </Button>
  );
}