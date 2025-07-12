
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

const CheckoutOrderSummary = () => {
  const { cartItems, total } = useCart();

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center text-blue-900">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
          Resumo do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items do carrinho */}
        <div className="space-y-3">
          {cartItems.map((item, index) => (
            <div key={index} className="flex justify-between items-start p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 group">
              <div className="flex-1">
                <h4 className="font-medium group-hover:text-blue-600 transition-colors duration-200">{item.name}</h4>
                {item.duration && (
                  <p className="text-sm text-muted-foreground">
                    Duração: {item.duration} {item.durationUnit === 'year' ? 'ano(s)' : 'mês(es)'}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium">{formatPrice(item.price)}</div>
                {item.quantity > 1 && (
                  <div className="text-sm text-muted-foreground">
                    {item.quantity}x {formatPrice(item.price / item.quantity)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Total - sem RF */}
        <div className="space-y-2 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
          <div className="flex justify-between text-lg font-semibold text-green-800">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Total:
            </span>
            <span className="text-green-600">{formatPrice(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutOrderSummary;
