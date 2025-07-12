import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Smartphone, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AppyPayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  onSuccess?: (data: any) => void;
}

export const AppyPayPaymentModal = ({ 
  isOpen, 
  onClose, 
  orderId, 
  amount, 
  onSuccess 
}: AppyPayPaymentModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentType, setPaymentType] = useState<'multicaixa' | 'umm'>('multicaixa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [testMode, setTestMode] = useState(true);

  const handlePayment = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor, insira o número de telemóvel');
      return;
    }

    // Validate phone number format (Angola format)
    const phoneRegex = /^(\+244|244)?[9][0-9]{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      toast.error('Por favor, insira um número de telemóvel válido');
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('appypay-multicaixa', {
        body: {
          orderId,
          amount,
          phoneNumber: phoneNumber.replace(/\s/g, ''),
          paymentType,
          testMode
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(data.message || 'Pagamento iniciado com sucesso! Confirme no seu telemóvel.');
        if (onSuccess) {
          onSuccess(data);
        }
        onClose();
      } else {
        toast.error(data.message || 'Falha no processamento do pagamento');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Erro ao processar o pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX XXX XXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/f8d6177e-8235-4942-af13-8da5c89452a9.png" 
              alt="Multicaixa" 
              className="h-6 w-6 object-contain"
            />
            Pagamento por Referência Multicaixa
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Payment Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Método de Pagamento</Label>
            <RadioGroup
              value={paymentType}
              onValueChange={(value: 'multicaixa' | 'umm') => setPaymentType(value)}
              className="grid grid-cols-1 gap-3"
            >
              <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50">
                <RadioGroupItem value="multicaixa" id="multicaixa" />
                <Label htmlFor="multicaixa" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Multicaixa Express</div>
                    <div className="text-xs text-muted-foreground">
                      Pagamento através da app Multicaixa Express
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50">
                <RadioGroupItem value="umm" id="umm" />
                <Label htmlFor="umm" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="h-4 w-4" />
                  <div>
                    <div className="font-medium">UNITEL Mobile Money</div>
                    <div className="text-xs text-muted-foreground">
                      Pagamento através do UNITEL Mobile Money
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone">Número de Telemóvel</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="9XX XXX XXX"
              value={phoneNumber}
              onChange={handlePhoneChange}
              maxLength={11}
              className="text-lg tracking-wider"
            />
            <p className="text-xs text-muted-foreground">
              Insira o número associado à sua conta {paymentType === 'multicaixa' ? 'Multicaixa' : 'UNITEL'}
            </p>
          </div>

          {/* Amount Display */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor a pagar:</span>
              <span className="text-lg font-semibold">{amount.toLocaleString('pt-AO')} AOA</span>
            </div>
          </div>

          {/* Test Mode Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="testMode"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="testMode" className="text-sm">
              Modo de teste (para desenvolvimento)
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !phoneNumber.trim()}
              className="flex-1"
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
          </div>

          {/* Info Message */}
          <div className="text-xs text-muted-foreground text-center bg-blue-50 p-3 rounded-lg">
            <p>
              Tem 90 segundos para autorizar o pagamento na sua app 
              {paymentType === 'multicaixa' ? ' Multicaixa Express' : ' UNITEL Mobile Money'}.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};