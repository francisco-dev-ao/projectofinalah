
import React from "react";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

type OrderItemsSectionProps = {
  orderItems: any[];
  totalAmount: number;
};

const OrderItemsSection = ({ orderItems = [], totalAmount }: OrderItemsSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Itens do Pedido</h3>
      <div className="space-y-4">
        {orderItems && orderItems.length > 0 ? (
          orderItems.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">Quantidade: {item.quantity}</p>
                {item.duration && (
                  <p className="text-sm text-muted-foreground">
                    Duração: {item.duration} {item.duration_unit || "mês(es)"}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p>{formatPrice(item.unit_price)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">Nenhum item no pedido.</p>
        )}
        
        <Separator className="my-2" />
        
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsSection;
