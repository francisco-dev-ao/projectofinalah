
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';

interface InvoiceItemsTableProps {
  order: any;
}

const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({ order }) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Itens da Fatura
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Descrição</th>
                <th className="py-3 px-4 text-center font-semibold text-gray-700">Quantidade</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700">Preço Unitário</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order?.order_items && order.order_items.length > 0 ? (
                order.order_items.map((item: any, index: number) => (
                  <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                        )}
                        {item.duration && item.duration_unit && (
                          <div className="text-sm text-blue-600 mt-1">
                            Duração: {item.duration} {item.duration_unit}(s)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-medium">{item.quantity}</td>
                    <td className="py-4 px-4 text-right font-medium">{formatPrice(item.unit_price)}</td>
                    <td className="py-4 px-4 text-right font-bold text-blue-600">
                      {formatPrice(item.unit_price * item.quantity)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 px-4 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart className="h-8 w-8 text-gray-300" />
                      <p>Nenhum item encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={3} className="py-4 px-4 text-right font-bold text-lg">Total Geral:</td>
                <td className="py-4 px-4 text-right font-bold text-xl text-blue-600">
                  {formatPrice(order?.total_amount || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceItemsTable;
