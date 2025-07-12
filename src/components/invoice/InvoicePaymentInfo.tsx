import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface InvoicePaymentInfoProps {
  invoice: any;
  companyInfo: any;
}

const InvoicePaymentInfo: React.FC<InvoicePaymentInfoProps> = ({ invoice, companyInfo }) => {
  const isPaid = invoice?.status === 'paid';

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Informações de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPaid ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Fatura Paga</p>
                <p className="text-sm text-green-600">Esta fatura foi paga com sucesso. Obrigado!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {companyInfo?.payment_instructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Instruções de Pagamento</h4>
                    <p className="text-sm text-blue-700 whitespace-pre-line">
                      {companyInfo.payment_instructions}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Métodos de Pagamento Disponíveis:</h3>
              <div className="grid gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <img 
                      src="/lovable-uploads/f8d6177e-8235-4942-af13-8da5c89452a9.png" 
                      alt="Multicaixa" 
                      className="mr-2 h-5 w-5 object-contain"
                    />
                    Pagamento por Referência Multicaixa
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Entidade:</strong> 11333</p>
                    <p><strong>Referência:</strong> {
                      invoice?.orders?.payment_references && invoice.orders.payment_references.length > 0
                        ? invoice.orders.payment_references.sort((a, b) => 
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                          )[0].reference
                        : 'Indisponível'
                    }</p>
                    <p>Pagamento via ATM, Internet Banking, Multicaixa Express ou Balcão Bancário</p>
                  </div>
                </div>
                
                {/* Instruções de pagamento para Multicaixa Express e Pagamento em Dinheiro foram removidas conforme solicitado */}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoicePaymentInfo;
