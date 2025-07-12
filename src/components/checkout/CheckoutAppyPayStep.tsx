import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { AppyPayPaymentModal } from './AppyPayPaymentModal';
import { toast } from 'sonner';

interface CheckoutAppyPayStepProps {
  orderId: string;
  amount: number;
  onPaymentSuccess: (data: any) => void;
  onBack: () => void;
}

export const CheckoutAppyPayStep = ({
  orderId,
  amount,
  onPaymentSuccess,
  onBack
}: CheckoutAppyPayStepProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'multicaixa' | 'umm' | null>(null);

  const paymentMethods = [
    {
      id: 'multicaixa' as const,
      name: 'Multicaixa Express',
      description: 'Pagamento através da app Multicaixa Express',
      icon: CreditCard,
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      iconColor: 'text-blue-600'
    },
    {
      id: 'umm' as const,
      name: 'UNITEL Mobile Money',
      description: 'Pagamento através do UNITEL Mobile Money',
      icon: Smartphone,
      color: 'bg-green-50 border-green-200 text-green-800',
      iconColor: 'text-green-600'
    }
  ];

  const handleMethodSelect = (method: 'multicaixa' | 'umm') => {
    setSelectedMethod(method);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = (data: any) => {
    toast.success('Pagamento processado com sucesso!');
    onPaymentSuccess(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/f8d6177e-8235-4942-af13-8da5c89452a9.png" 
              alt="Multicaixa" 
              className="h-6 w-6 object-contain"
            />
            Pagamento por Referência Multicaixa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total a pagar:</span>
              <span className="text-2xl font-bold text-primary">
                {amount.toLocaleString('pt-AO')} AOA
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Escolha o método de pagamento:</h3>
            
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${method.color}`}
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${method.iconColor}`} />
                    <div className="flex-1">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm opacity-80">{method.description}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/50"
                    >
                      Selecionar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Como funciona:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Selecione o método de pagamento preferido</li>
                  <li>Insira o número de telemóvel associado à conta</li>
                  <li>Confirme o pagamento na app do telemóvel</li>
                  <li>Tem 90 segundos para autorizar o pagamento</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <AppyPayPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={orderId}
        amount={amount}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};