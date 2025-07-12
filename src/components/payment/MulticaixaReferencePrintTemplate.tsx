import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface MulticaixaReferencePrintTemplateProps {
  paymentReference: PaymentReference;
  customerName?: string;
  customerEmail?: string;
}

const MulticaixaReferencePrintTemplate = forwardRef<HTMLDivElement, MulticaixaReferencePrintTemplateProps>(
  ({ paymentReference, customerName, customerEmail }, ref) => {
    const formatCurrency = (value: number) => {
      return `${new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(value)} AOA`;
    };

    const formatDate = (dateString: string) => {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    };

    return (
      <div ref={ref} className="bg-white p-8 max-w-2xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-green-600 pb-4">
          <div className="flex items-center">
            <img src="/ANGOHOST-01.png" alt="AngoHost Logo" className="h-12 mr-4" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">AngoHost</h1>
              <p className="text-sm text-gray-600">Soluções de Hospedagem</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-green-600">Referência de Pagamento</h2>
            <p className="text-sm text-gray-600">Gerado em: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
          </div>
        </div>

        {/* Customer Info */}
        {(customerName || customerEmail) && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2">Dados do Cliente</h3>
            {customerName && <p className="text-sm">Nome: {customerName}</p>}
            {customerEmail && <p className="text-sm">Email: {customerEmail}</p>}
            <p className="text-sm">Pedido: #{paymentReference.order_id.substring(0, 8)}</p>
          </div>
        )}

        {/* Payment Reference Details */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <img 
              src="/lovable-uploads/f8d6177e-8235-4942-af13-8da5c89452a9.png" 
              alt="Multicaixa" 
              className="h-8 w-8 mr-3"
            />
            <h3 className="text-xl font-bold text-green-800">Dados para Pagamento Multicaixa</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Entidade */}
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-600 mb-1">Entidade</p>
              <p className="text-3xl font-mono font-bold text-green-800">{paymentReference.entity}</p>
            </div>

            {/* Referência */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-600 mb-1">Referência</p>
              <p className="text-3xl font-mono font-bold text-blue-800">{paymentReference.reference}</p>
            </div>

            {/* Valor */}
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-600 mb-1">Valor</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(paymentReference.amount)}</p>
            </div>

            {/* Validade */}
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <p className="text-sm font-medium text-orange-600 mb-1">Válida até</p>
              <p className="text-lg font-bold text-orange-800">{formatDate(paymentReference.validity_date)}</p>
              <p className="text-sm text-orange-600">({paymentReference.validity_days} dias)</p>
            </div>
          </div>

          <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-1">Descrição</p>
            <p className="text-gray-800">{paymentReference.description}</p>
          </div>
        </div>

        {/* Payment Channels */}
        <div className="mb-6">
          <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="text-blue-600 mr-2">📱</span>
            Onde Pagar
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {paymentReference.payment_channels.map((channel, index) => (
              <div key={index} className="flex items-center bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-blue-600 mr-2">✓</span>
                <span className="font-medium text-blue-800">{channel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="text-green-600 mr-2">📋</span>
            {paymentReference.instructions.pt.title}
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              {paymentReference.instructions.pt.steps.map((step, index) => (
                <li key={index} className="leading-relaxed">{step}</li>
              ))}
            </ol>
            
            <div className="mt-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">⚠️ Importante</p>
              <p className="text-sm text-blue-700">{paymentReference.instructions.pt.note}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 text-center">
          <div className="mb-3">
            <p className="text-sm font-bold text-gray-800">AngoHost, Lda</p>
            <p className="text-sm text-gray-600">Luanda, Angola | NIF: 5000088927</p>
            <p className="text-sm text-gray-600">Email: support@angohost.ao | Tel: +244 942 090108</p>
          </div>
          <p className="text-xs text-gray-500">
            Este documento foi gerado eletronicamente - {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
        </div>
      </div>
    );
  }
);

MulticaixaReferencePrintTemplate.displayName = 'MulticaixaReferencePrintTemplate';

export default MulticaixaReferencePrintTemplate;