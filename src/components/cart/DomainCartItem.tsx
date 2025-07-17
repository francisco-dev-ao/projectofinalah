
import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import DomainPeriodSelector from "@/components/DomainPeriodSelector";
import { CartItem } from "@/contexts/CartContext";

interface DomainCartItemProps {
  item: CartItem;
  updateDomainPeriod: (id: string, years: number, price: number) => void;
  handleRemoveItem: (id: string) => void;
}

const DomainCartItem: React.FC<DomainCartItemProps> = ({
  item,
  updateDomainPeriod,
  handleRemoveItem
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between border-b pb-6 mb-4">
      <div className="flex-grow">
        <h3 className="font-semibold text-lg">{item.name}</h3>
        <p className="text-gray-600 mb-2">{item.description}</p>
        <p className="text-sm text-gray-500">Domínio {' • '} {item.period}</p>
        
        {item.renewalDate && (
          <p className="text-sm text-gray-600 mt-1">
            Renovação em: {item.renewalDate}
          </p>
        )}
        
        {/* Period selector for domains */}
        <div className="mt-2">
          <DomainPeriodSelector 
            basePrice={item.unitPrice || 0} 
            onPeriodChange={(years, price) => updateDomainPeriod(item.id, years, price)}
            className="max-w-xs"
          />
        </div>
      </div>
      
      <div className="mt-4 md:mt-0 flex flex-col items-end">
        <div className="font-semibold text-lg">
          {formatPrice(item.price)}
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

export default DomainCartItem;
