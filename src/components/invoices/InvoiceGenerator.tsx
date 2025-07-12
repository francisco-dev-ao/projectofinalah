import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useReactToPrint } from 'react-to-print';
import { formatMoney } from '@/utils/formatters';
import '@/hostinger-hover.css';

const InvoiceGenerator = () => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Fatura-Angohost',
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handlePrint} variant="default" className="btn-hostinger">
          Imprimir / Salvar PDF
        </Button>
      </div>
      <div ref={printRef} id="invoice" className="p-8 bg-white border rounded-md shadow-sm max-w-3xl mx-auto card-hostinger">
        <h1 className="text-2xl font-bold mb-2">Fatura #INV-MCWLUIHA-A810417F <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Pendente</span></h1>
        <div className="flex justify-between text-sm mb-2">
          <span>Emitida em: 16/07/2025</span>
          <span>Vencimento: 16/07/2025</span>
        </div>
        {/* Dados da fatura */}
        <div className="grid grid-cols-2 gap-6 border rounded mb-6 p-4 bg-gray-50">
          <div>
            <h3 className="font-semibold mb-1">DE</h3>
            <div className="text-sm leading-tight">
              <div>ANGOHOST, LDA</div>
              <div>NIF: 5000285297</div>
              <div>Rua do Cassenda, Prédio AngoHost, Luanda, Angola</div>
              <div>Email: suporte@angohost.com</div>
              <div>Tel: +244 923 000 000</div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-1">PARA</h3>
            <div className="text-sm leading-tight">
              <div>CLIENTE EXEMPLO</div>
              <div>NIF: 5000285297</div>
              <div>RUA, CIDADE, PAÍS</div>
              <div>Email: cliente@exemplo.com</div>
              <div>Tel: +244 900 000 000</div>
            </div>
          </div>
        </div>
        {/* Itens da fatura */}
        <div className="mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 table-row-hostinger">
                <th className="p-2 text-left">Descrição</th>
                <th className="p-2 text-right">Quantidade</th>
                <th className="p-2 text-right">Preço Unitário</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b table-row-hostinger">
                <td className="p-2">Serviço Exemplo</td>
                <td className="p-2 text-right">1</td>
                <td className="p-2 text-right">{formatMoney(25000)}</td>
                <td className="p-2 text-right">{formatMoney(25000)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="font-bold table-row-hostinger">
                <td colSpan={3} className="p-2 text-right">Total Geral:</td>
                <td className="p-2 text-right">{formatMoney(25000)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* Métodos de Pagamento Disponíveis */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Métodos de Pagamento Disponíveis:</h3>
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50 card-hostinger">
            <div className="font-semibold mb-1">Pagamento por Referência Multicaixa</div>
            <div className="text-sm text-gray-700">
              <div><strong>Entidade:</strong> 11333</div>
              <div><strong>Referência:</strong> 123 456 789</div>
              <div>Pagamento via ATM, Internet Banking, Multicaixa Express ou Balcão Bancário</div>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 text-center mt-8">
          Obrigado por escolher a AngoHost!
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
