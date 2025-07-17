
import React from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { CartItem } from "@/contexts/CartContext";

interface EmailCartItemProps {
  item: CartItem;
  updateItemQuantity: (id: string, quantity: number) => void;
  handleRemoveItem: (id: string) => void;
}

const EmailCartItem: React.FC<EmailCartItemProps> = ({
  item,
  updateItemQuantity,
  handleRemoveItem
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between border-b pb-6 mb-4">
      <div className="flex-grow">
        <h3 className="font-semibold text-lg">{item.name}</h3>
        <p className="text-gray-600 mb-2">{item.description}</p>
        <p className="text-sm text-gray-500">
          Email Profissional {' • '} {item.period}
        </p>
        
        {/* Only show quantity selector for email products */}
        <div className="flex items-center mt-3 space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus size={16} />
          </Button>
          <span className="w-10 text-center font-medium">{item.quantity}</span>
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8"
            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
          >
            <Plus size={16} />
          </Button>
          <span className="text-sm text-gray-500 ml-1">
            {formatPrice(item.unitPrice || 0)} por usuário
          </span>
        </div>
        
        {/* Show renewal price for email plans with renewalPrice */}
        {item.renewalPrice && (
          <p className="text-sm text-gray-600 mt-2">
            Renovação estimada: {formatPrice(item.renewalPrice * item.quantity)}
          </p>
        )}
      </div>
      
      <div className="mt-4 md:mt-0 flex flex-col items-end">
        <div className="font-semibold text-lg">
          {formatPrice(item.price * item.quantity)}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-2 border border-red-200 hover:border-red-300"
          onClick={() => handleRemoveItem(item.id)}
        >
          <Trash2 size={16} className="mr-1" />
          <span>Remover</span>
        </Button>
      </div>
    </div>
  );
};

export default EmailCartItem;
