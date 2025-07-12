/**
 * Componente completo de exemplo com fatura e botão de geração de PDF
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import gerarEEnviar from '@/utils/gerarEEnviar';

interface InvoiceExampleProps {
  invoiceNumber?: string;
  customerName?: string;
  items?: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
}

const InvoiceExample: React.FC<InvoiceExampleProps> = ({
  invoiceNumber = 'INV-2025-001',
  customerName = 'Cliente Exemplo',
  items = [
    { description: 'Hospedagem Web', quantity: 1, price: 150.00 },
    { description: 'Domínio .com.br', quantity: 1, price: 50.00 },
    { description: 'Certificado SSL', quantity: 1, price: 75.00 }
  ]
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calcula o subtotal dos itens
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const tax = subtotal * 0.15; // 15% de imposto
  const total = subtotal + tax;

  const handleGerarEEnviarPDF = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Chama a função de geração e envio do PDF
      const result = await gerarEEnviar();
      
      console.log('PDF enviado com sucesso:', result);
      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao gerar e enviar PDF:', err);
      setError(err.message || 'Erro ao processar fatura');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',') + ' AOA';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Fatura de Exemplo</h1>
        <Button
          onClick={handleGerarEEnviarPDF}
          disabled={isProcessing}
          className="bg-primary hover:bg-primary/90"
        >
          {isProcessing ? 'Processando...' : 'Gerar e Enviar PDF'}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-100 text-green-800 rounded-md mb-4">
          PDF gerado e enviado com sucesso!
        </div>
      )}

      {/* A fatura em si - este é o elemento que será convertido em PDF */}
      <div id="invoice" className="p-6 border rounded-lg bg-white shadow-sm">
        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-800">FATURA</h2>
            <p className="text-sm text-gray-600">#{invoiceNumber}</p>
            <p className="text-sm text-gray-600">Data: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl">AngoHost</div>
            <p className="text-sm text-gray-600">Luanda, Angola</p>
            <p className="text-sm text-gray-600">contato@angohost.com</p>
            <p className="text-sm text-gray-600">+244 923 456 789</p>
          </div>
        </div>
        
        <div className="border-b pb-4 mb-4">
          <h3 className="font-semibold">Cliente</h3>
          <p className="text-gray-800">{customerName}</p>
        </div>
        
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Descrição</th>
              <th className="text-right py-2">Quantidade</th>
              <th className="text-right py-2">Preço Unitário</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                <td className="py-2 text-right">{formatCurrency(item.quantity * item.price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right pt-4 font-medium">Subtotal</td>
              <td className="text-right pt-4 font-medium">{formatCurrency(subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="text-right pt-2 font-medium">Imposto (15%)</td>
              <td className="text-right pt-2 font-medium">{formatCurrency(tax)}</td>
            </tr>
            <tr className="font-bold">
              <td colSpan={3} className="text-right pt-4">Total</td>
              <td className="text-right pt-4">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
        
        <div className="mt-8 border-t pt-4">
          <h4 className="font-semibold mb-2">Métodos de Pagamento</h4>
          <p className="text-sm text-gray-600">Banco: XXX - Agência: 0001 - Conta: 12345-6</p>
          <p className="text-sm text-gray-600 mt-4">Esta fatura é válida por 30 dias.</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceExample;
