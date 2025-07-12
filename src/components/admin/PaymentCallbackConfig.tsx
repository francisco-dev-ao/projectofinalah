import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const PaymentCallbackConfig = () => {
  const [copied, setCopied] = useState(false);
  
  // Get the current domain to construct the callback URL
  const baseUrl = window.location.origin;
  const callbackUrl = `${baseUrl.replace('051e9cae-3f6c-4255-bd93-a1fbb007f480.lovableproject.com', 'qitelgupnfdszpioxmnm.supabase.co')}/functions/v1/payment-callback`;
  
  // Alternative callback URL for the webhook
  const webhookUrl = `${baseUrl.replace('051e9cae-3f6c-4255-bd93-a1fbb007f480.lovableproject.com', 'qitelgupnfdszpioxmnm.supabase.co')}/functions/v1/appypay-webhook`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copiado para área de transferência`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar para área de transferência');
    }
  };

  const testCallback = async () => {
    try {
      const testData = {
        reference: 'TEST-REF-123',
        status: 'paid',
        transaction_id: 'TXN-TEST-456',
        amount: '100.00'
      };

      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Teste de callback executado com sucesso!');
        console.log('Callback test result:', result);
      } else {
        const error = await response.text();
        toast.error(`Erro no teste: ${error}`);
      }
    } catch (error) {
      toast.error('Erro ao executar teste de callback');
      console.error('Callback test error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Configuração de Callback de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Callback URL */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">URL de Callback Principal</h3>
              <Badge variant="default">Genérico</Badge>
            </div>
            <p className="text-sm text-gray-600">
              Use esta URL para receber callbacks de qualquer sistema de pagamento por referência.
              Suporta tanto GET quanto POST.
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <code className="flex-1 text-sm font-mono break-all">
                {callbackUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(callbackUrl, 'URL de callback')}
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* AppyPay Webhook URL */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">URL de Webhook AppyPay</h3>
              <Badge variant="secondary">AppyPay</Badge>
            </div>
            <p className="text-sm text-gray-600">
              URL específica para webhooks do AppyPay que processa automaticamente pagamentos por referência Multicaixa.
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <code className="flex-1 text-sm font-mono break-all">
                {webhookUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookUrl, 'URL de webhook AppyPay')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* AppyPay Expected Format */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Formato de Dados AppyPay</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">
                A AppyPay enviará um POST com JSON no seguinte formato:
              </p>
              <pre className="text-xs text-blue-700 bg-white p-3 rounded border overflow-x-auto">
{`{
  "reference": "960095186",
  "entity": "11333",
  "amount": 12333,
  "status": "PAID",
  "paymentDate": "2025-07-08T19:00:00Z",
  "transactionId": "d6a1f9de-..."
}`}
              </pre>
              <p className="text-xs text-blue-600 mt-2">
                <strong>Status possíveis:</strong> PAID, EXPIRED, CANCELLED
              </p>
            </div>
          </div>

          {/* Parameters Documentation */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Parâmetros Aceitos</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">
                O callback aceita os seguintes parâmetros (qualquer um dos nomes):
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li><strong>Referência:</strong> reference, ref, payment_reference, transaction_id, order_id</li>
                <li><strong>Status:</strong> status, payment_status, state, success</li>
                <li><strong>ID Transação:</strong> transaction_id, txn_id, id, payment_id</li>
                <li><strong>Valor:</strong> amount, total_amount, value</li>
              </ul>
            </div>
          </div>

          {/* Status Values */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Valores de Status Aceitos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="font-medium text-green-800 mb-2">✅ Pagamento Aprovado:</p>
                <code className="text-sm text-green-700">
                  paid, success, completed, confirmed, 1, true
                </code>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-medium text-red-800 mb-2">❌ Pagamento Rejeitado:</p>
                <code className="text-sm text-red-700">
                  failed, error, cancelled, 0, false
                </code>
              </div>
            </div>
          </div>

          {/* Example URLs */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Exemplos de Uso</h3>
            <div className="space-y-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">GET Request:</p>
                <code className="text-xs break-all">
                  {callbackUrl}?reference=ORDER-123&status=paid&transaction_id=TXN-456&amount=100.00
                </code>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">POST Request (JSON):</p>
                <code className="text-xs">
                  {`{"reference": "ORDER-123", "status": "paid", "transaction_id": "TXN-456", "amount": "100.00"}`}
                </code>
              </div>
            </div>
          </div>

          {/* Test Button */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={testCallback} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Testar Callback
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallbackConfig;