
import React from "react";
import { formatPrice } from "@/lib/utils";
import { CartItem } from "@/contexts/CartContext";

interface CartItemDisplayProps {
  items: CartItem[];
}

const CartItemDisplay: React.FC<CartItemDisplayProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {items.map((item) => (
        <div key={item.id} className="flex justify-between">
          <span className="text-gray-600">
            {(item as any).isExistingDomain ? '🌐 Domínio existente: ' : ''}
            {item.name}{item.type === 'email' && item.quantity > 1 ? ` x${item.quantity}` : ''}
          </span>
          <span>{(item as any).isExistingDomain ? '0 Kz' : formatPrice(item.price)}</span>
        </div>
      ))}
    </div>
  );
};

export default CartItemDisplay;
