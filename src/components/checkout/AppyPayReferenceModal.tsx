import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, CheckCircle, Clock, CreditCard, Smartphone, Building2, Banknote, Printer, Loader2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generatePaymentReferencePDF, printPaymentReference } from '@/services/payment/referencePrintService';

interface PaymentReference {
  entity: string;
  reference: string;
  amount: number;
  description: string;
  validity_date: string;
  validity_days: number;
  order_id: string;
  instructions: {
    pt: {
      title: string;
      steps: string[];
      note: string;
    };
  };
  payment_channels: string[];
}

interface AppyPayReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentReference: PaymentReference;
}

export const AppyPayReferenceModal = ({ 
  isOpen, 
  onClose, 
  paymentReference 
}: AppyPayReferenceModalProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [generatingReferencePDF, setGeneratingReferencePDF] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<{name?: string, email?: string}>({});
  const [orderData, setOrderData] = useState<any>(null);

  // Carregar informações do cliente e dados do pedido
  useEffect(() => {
    const loadOrderData = async () => {
      try {
        const { data: order, error } = await supabase
          .from("orders")
          .select(`
            *,
            profiles:user_id (name, email),
            order_items (*)
          `)
          .eq("id", paymentReference.order_id)
          .single();
          
        if (!error && order) {
          // Definir dados do cliente
          if (order.profiles) {
            setCustomerInfo({
              name: order.profiles.name,
              email: order.profiles.email
            });
          }
          
          // Definir dados completos do pedido
          setOrderData(order);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do pedido:', error);
      }
    };
    
    if (paymentReference?.order_id) {
      loadOrderData();
    }
  }, [paymentReference?.order_id]);

  // Calculate time remaining
  useEffect(() => {
    if (!paymentReference?.validity_date) return;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const validityTime = new Date(paymentReference.validity_date).getTime();
      const difference = validityTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days} dias, ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      } else {
        setTimeLeft('Expirado');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [paymentReference?.validity_date]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'atm':
        return <CreditCard className="h-4 w-4" />;
      case 'multicaixa express':
        return <Smartphone className="h-4 w-4" />;
      case 'internet banking':
        return <Building2 className="h-4 w-4" />;
      case 'balcão bancário':
        return <Banknote className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  // Handler para gerar PDF apenas da referência de pagamento
  const handleGenerateReferencePDF = async () => {
    try {
      setGeneratingReferencePDF(true);
      await generatePaymentReferencePDF(paymentReference, customerInfo.name, customerInfo.email, orderData);
      toast.success('PDF da referência gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF da referência:', error);
      toast.error('Erro ao gerar PDF da referência');
    } finally {
      setGeneratingReferencePDF(false);
    }
  };

  // Handler para imprimir apenas a referência de pagamento
  const handlePrintReference = () => {
    try {
      printPaymentReference(paymentReference, customerInfo.name, customerInfo.email, orderData);
      toast.success('Documento de referência aberto para impressão!');
    } catch (error) {
      console.error('Erro ao imprimir referência:', error);
      toast.error('Erro ao abrir documento para impressão');
    }
  };

  if (!paymentReference) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto p-0">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="bg-white/20 p-2 rounded-full">
                <CheckCircle className="h-6 w-6" />
              </div>
              Referência de Pagamento Gerada
            </DialogTitle>
            <p className="text-green-100 mt-2">
              Sua referência multicaixa foi criada com sucesso
            </p>
          </DialogHeader>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Action Buttons na parte superior */}
          <div className="flex flex-col gap-3">
            {/* Botões de referência de pagamento */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handlePrintReference}
                className="flex-1 border-blue-300 hover:bg-blue-50"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Referência
              </Button>
              <Button
                onClick={handleGenerateReferencePDF}
                disabled={generatingReferencePDF}
                variant="outline"
                className="flex-1 border-green-300 hover:bg-green-50"
              >
                {generatingReferencePDF ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    PDF Referência
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Nota sobre fatura final */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full mt-0.5">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Fatura Final</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Após o pagamento, a fatura final certificada pela AGT chegará automaticamente ao seu email.
                </p>
              </div>
            </div>
          </div>

          {/* Status compacto */}
          <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Válida por {timeLeft}</p>
                <p className="text-sm text-green-600">
                  Expira em {formatDate(paymentReference.validity_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-white border-green-300 text-green-700">
                Pedido #{paymentReference.order_id.substring(0, 8)}
              </Badge>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Fatura Registrada
              </Badge>
            </div>
          </div>

          {/* Payment Details Card - Layout melhorado */}
          <Card className="border-2 border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <CardTitle className="text-lg text-center text-green-800 flex items-center justify-center gap-2">
                <img 
                  src="/lovable-uploads/f8d6177e-8235-4942-af13-8da5c89452a9.png" 
                  alt="Multicaixa" 
                  className="h-6 w-6 object-contain"
                />
                Dados para Pagamento Multicaixa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4">
                {/* Entity */}
                <div className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors p-4 rounded-xl border">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Entidade</p>
                    <p className="text-2xl font-mono font-bold text-gray-900">{paymentReference.entity}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentReference.entity, 'Entidade')}
                    className="ml-4 hover:bg-green-50 hover:border-green-300"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Reference */}
                <div className="flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-xl border border-blue-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-600 mb-1">Referência</p>
                    <p className="text-2xl font-mono font-bold text-blue-900">{paymentReference.reference}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentReference.reference, 'Referência')}
                    className="ml-4 hover:bg-blue-100 hover:border-blue-300"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between bg-green-50 hover:bg-green-100 transition-colors p-4 rounded-xl border border-green-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600 mb-1">Valor</p>
                    <p className="text-2xl font-bold text-green-800">
                      {paymentReference.amount.toLocaleString('pt-AO')} AOA
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentReference.amount.toString(), 'Valor')}
                    className="ml-4 hover:bg-green-100 hover:border-green-300"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Channels - Design melhorado */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Onde Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {paymentReference.payment_channels.map((channel, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-sm transition-all">
                    <div className="bg-blue-100 p-2 rounded-full">
                      {getChannelIcon(channel)}
                    </div>
                    <span className="text-sm font-medium text-blue-800">{channel}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructions - Layout melhorado */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {paymentReference.instructions.pt.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border">
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  {paymentReference.instructions.pt.steps.map((step, index) => (
                    <li key={index} className="text-gray-700 leading-relaxed pl-2">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              
              <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">Importante</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {paymentReference.instructions.pt.note}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão de fechar no final */}
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-8"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};