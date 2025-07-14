
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/cart/useCart";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export interface ExchangePlan {
  id: string;
  name: string;
  basePrice: number;
  cpuCores: number;
  ram: string;
  storage: string;
  users: number;
  features: string[];
  applications: string[];
  popular?: boolean;
}

interface ExchangePlanCardProps {
  plan: ExchangePlan;
}

const periodOptions = [
  { value: 0.5, label: "6 meses" },
  { value: 1, label: "1 ano" },
  { value: 2, label: "2 anos" },
];

const ExchangePlanCard = ({ plan }: ExchangePlanCardProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(periodOptions[0]);
  const [quantity, setQuantity] = useState(1);

  // Calculate final price based on base price, period and quantity
  const calculatePrice = () => {
    return plan.basePrice * period.value * quantity;
  };

  const handleAddToCart = () => {
    const finalPrice = calculatePrice();
    
    // Create a cart item for the exchange plan
    const exchangeItem = {
      id: `exchange-${plan.id}-${Date.now()}`,
      name: plan.name,
      description: `Exchange Online (${period.label}, ${quantity} ${quantity > 1 ? "contas" : "conta"})`,
      price: finalPrice,
      unitPrice: plan.basePrice * period.value,
      type: "email" as const,
      period: period.label,
      quantity: quantity,
    };

    addToCart(exchangeItem);

    toast.success(`${plan.name} adicionado ao carrinho com ${quantity} ${quantity > 1 ? "contas" : "conta"} por ${period.label}`);
    
    navigate("/cart");
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => prev > 1 ? prev - 1 : 1);
  };

  return (
    <Card className={`flex flex-col h-full ${plan.popular ? "border-primary border-2 shadow-lg" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
            <CardDescription className="mt-2">
              {formatPrice(plan.basePrice)} / 6 meses por conta
            </CardDescription>
          </div>
          {plan.popular && (
            <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
              Popular
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <div className="border-t border-b py-4 mb-4">
          <p className="text-sm font-semibold mb-2">Recursos:</p>
          <div className="space-y-2">
            <div className="feature-item flex items-center gap-2">
              <Check size={16} className="text-primary flex-shrink-0" />
              <span className="text-sm">{plan.cpuCores} vCPU Cores</span>
            </div>
            <div className="feature-item flex items-center gap-2">
              <Check size={16} className="text-primary flex-shrink-0" />
              <span className="text-sm">{plan.ram} RAM do servidor</span>
            </div>
            <div className="feature-item flex items-center gap-2">
              <Check size={16} className="text-primary flex-shrink-0" />
              <span className="text-sm">{plan.storage} de armazenamento na nuvem</span>
            </div>
            <div className="feature-item flex items-center gap-2">
              <Check size={16} className="text-primary flex-shrink-0" />
              <span className="text-sm">Permite até {plan.users} usuários</span>
            </div>
            
            {plan.features.map((feature, index) => (
              <div key={index} className="feature-item flex items-center gap-2">
                <Check size={16} className="text-primary flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <p className="text-sm font-semibold mb-2">Aplicações incluídas:</p>
          <div className="grid grid-cols-2 gap-2">
            {plan.applications.map((app, index) => (
              <div key={index} className="text-sm flex items-center gap-1">
                <Check size={14} className="text-primary flex-shrink-0" />
                <span>{app}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col space-y-4">
        <div className="w-full space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Período:</span>
            <select
              className="p-2 border rounded-md text-sm"
              value={period.value.toString()}
              onChange={(e) => setPeriod(periodOptions.find(p => p.value === parseFloat(e.target.value)) || periodOptions[0])}
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Quantidade de contas:</span>
            <div className="flex items-center border rounded-md">
              <button 
                className="px-3 py-1 text-gray-600 hover:bg-gray-100" 
                onClick={decrementQuantity}
                aria-label="Diminuir quantidade"
              >
                -
              </button>
              <span className="px-3 py-1">{quantity}</span>
              <button 
                className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                onClick={incrementQuantity}
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-lg">{formatPrice(calculatePrice())}</span>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full gap-2" 
          onClick={handleAddToCart}
          variant={plan.popular ? "default" : "outline"}
        >
          Selecionar plano <ArrowRight className="ml-1" size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExchangePlanCard;
