import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { InvoiceService } from '@/services/invoiceService';

interface PaymentConfirmationProps {
  order: any;
  onSuccess?: () => void;
}

export default function PaymentConfirmation({ order, onSuccess }: PaymentConfirmationProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmPayment = async () => {
    try {
      setIsProcessing(true);
      
      // Chamar o webhook para confirmar o pagamento
      const response = await fetch('/api/webhooks/payment-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          paymentMethod: 'bank_transfer',
          status: 'confirmed',
          transactionId: `MANUAL-${Date.now()}`
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao confirmar pagamento');
      }
      
      toast.success('Pagamento confirmado e fatura gerada com sucesso!');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro na confirmação de pagamento:', error);
      toast.error(error.message || 'Erro ao confirmar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  // Não mostrar para pedidos já confirmados
  if (order.payment_status === 'confirmed') {
    return null;
  }

  return (
    <Button
      onClick={handleConfirmPayment}
      disabled={isProcessing}
      variant="default"
      size="sm"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        'Confirmar Pagamento'
      )}
    </Button>
  );
}