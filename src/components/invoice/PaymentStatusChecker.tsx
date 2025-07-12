import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { PaymentStatusService, PaymentStatusCheck } from '@/services/paymentStatusService';
import { toast } from 'sonner';

interface PaymentStatusCheckerProps {
  orderId: string;
  initialStatus?: PaymentStatusCheck;
  autoRefresh?: boolean;
  onStatusChange?: (status: PaymentStatusCheck) => void;
}

const PaymentStatusChecker: React.FC<PaymentStatusCheckerProps> = ({
  orderId,
  initialStatus,
  autoRefresh = true,
  onStatusChange
}) => {
  const [status, setStatus] = useState<PaymentStatusCheck | null>(initialStatus || null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const newStatus = await PaymentStatusService.checkPaymentStatus(orderId);
      if (newStatus) {
        setStatus(newStatus);
        setLastChecked(new Date());
        onStatusChange?.(newStatus);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast.error('Erro ao verificar status do pagamento');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!status) {
      checkStatus();
    }
  }, [orderId]);

  useEffect(() => {
    if (autoRefresh && status?.paymentStatus === 'pending') {
      const cleanup = PaymentStatusService.startPaymentStatusPolling(
        orderId,
        (newStatus) => {
          setStatus(newStatus);
          setLastChecked(new Date());
          onStatusChange?.(newStatus);
          
          if (newStatus.paymentStatus === 'confirmed') {
            toast.success('Pagamento confirmado! Fatura atualizada automaticamente.');
          }
        }
      );

      return cleanup;
    }
  }, [orderId, autoRefresh, status?.paymentStatus]);

  const getPaymentStatusIcon = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Confirmado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getInvoiceStatusBadge = (invoiceStatus: string) => {
    switch (invoiceStatus) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paga</Badge>;
      case 'issued':
        return <Badge variant="secondary">Emitida</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Rascunho</Badge>;
    }
  };

  if (!status) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Verificando status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Status do Pagamento</span>
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={isChecking}
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Referência</label>
            <p className="font-mono text-lg">{status.reference}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Valor</label>
            <p className="text-lg">KZ {status.amount.toLocaleString('pt-PT')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Status do Pagamento</label>
            <div className="flex items-center mt-1">
              {getPaymentStatusIcon(status.paymentStatus)}
              <span className="ml-2">{getPaymentStatusBadge(status.paymentStatus)}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Status da Fatura</label>
            <div className="mt-1">
              {getInvoiceStatusBadge(status.invoiceStatus)}
            </div>
          </div>
        </div>

        {lastChecked && (
          <div className="text-xs text-gray-500">
            Última verificação: {lastChecked.toLocaleTimeString('pt-PT')}
          </div>
        )}

        {status.paymentStatus === 'confirmed' && status.invoiceStatus === 'paid' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                Pagamento confirmado e fatura atualizada automaticamente!
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatusChecker;