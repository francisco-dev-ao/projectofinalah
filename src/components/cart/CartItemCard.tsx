
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { CartItem } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

interface CartItemCardProps {
  item: CartItem;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, updateQuantity, removeItem }) => {
  const handleRemoveItem = () => {
    removeItem(item.id);
  };

  const handleDecreaseQuantity = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  // Format renewal date if it exists
  const renewalDate = (item as any).renewalDate 
    ? new Date((item as any).renewalDate).toLocaleDateString('pt-BR')
    : null;

  return (
    <Card className="mb-4 hover:shadow-lg transition-all duration-300 hover:scale-102 border-2 hover:border-primary/20 group">
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200">{item.name}</h3>
            <p className="text-gray-600 text-sm">{item.description || (item.type === 'domain' ? 'Registro de domínio' : 'Produto')}</p>
            
            <div className="flex items-center mt-2">
              <span className="text-gray-500 text-sm">
                {item.period && `${formatPrice(item.price)} por ${item.period}`}
              </span>
            </div>
            
            {renewalDate && (
              <p className="text-gray-500 text-xs mt-1">
                Renovação em: {renewalDate}
              </p>
            )}
            
            {(item as any).renewalPrice && (
              <p className="text-gray-500 text-xs mt-1">
                Valor estimado de renovação: {formatPrice((item as any).renewalPrice * item.quantity)}
              </p>
            )}

            {/* Quantity selector - only show for products that support quantity */}
            {item.type === 'email' && (
              <div className="flex items-center mt-3 space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-110"
                  onClick={handleDecreaseQuantity}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={16} />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 hover:bg-green-50 hover:border-green-300 transition-all duration-200 hover:scale-110"
                  onClick={handleIncreaseQuantity}
                >
                  <Plus size={16} />
                </Button>
                <span className="text-sm text-gray-500 ml-1">
                  {formatPrice(item.unitPrice || 0)} cada
                </span>
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="font-semibold text-lg">
              {formatPrice(item.price * item.quantity)}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-2 p-0 transition-all duration-200 hover:scale-110 group border border-red-200 hover:border-red-300"
              onClick={handleRemoveItem}
            >
              <Trash2 size={16} className="mr-1 group-hover:animate-pulse" />
              <span>Remover</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartItemCard;
