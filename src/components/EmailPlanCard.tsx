import { useState, useEffect, useTransition } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { useCart } from "@/contexts/cart/useCart";
import '@/hostinger-hover.css';

export interface EmailPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice?: number;
  renewalPrice?: number;
  features: string[];
  tag?: string;
  color?: string;
  recommended?: boolean;
}

interface EmailPlanCardProps {
  plan: EmailPlan;
}

const EmailPlanCard = ({ plan }: EmailPlanCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(plan.annualPrice || (plan.monthlyPrice * 12));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const annual = plan.annualPrice || (plan.monthlyPrice * 12);
    setTotalPrice(annual * quantity);
  }, [quantity, plan.monthlyPrice, plan.annualPrice]);

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    // Preço unitário anual por conta
    const unitPrice = plan.annualPrice || (plan.monthlyPrice * 12);
    
    // Create cart item object with proper type
    const cartItem = {
      id: `email-${plan.id}-${Date.now()}`,
      name: plan.name,
      description: plan.description,
      price: unitPrice,
      unitPrice: unitPrice,
      type: "email" as const,
      period: "anual",
      quantity: quantity, // Pass the selected quantity
      renewalPrice: plan.renewalPrice
    };

    // Wrap cart operations and navigation in startTransition
    startTransition(() => {
      // Add to cart with the correct quantity
      addToCart(cartItem, quantity);
      
      // Show success message with quantity information
      toast.success(`${quantity} ${quantity > 1 ? 'contas' : 'conta'} de ${plan.name} adicionadas ao carrinho`);
      
      // Correctly handle navigation with startTransition
      navigate("/cart");
    });
  };

  const cardStyles = {
    "blue": "border-primary hover:border-primary/80",
    "yellow": "border-accent hover:border-accent/80",
    "purple": "border-purple-500 hover:border-purple-400",
    "default": "border-gray-200 hover:border-gray-300"
  };

  const buttonStyles = {
    "blue": "bg-primary hover:bg-primary/90 text-white",
    "yellow": "bg-accent hover:bg-accent/90 text-black",
    "purple": "bg-purple-500 hover:bg-purple-400 text-white", 
    "default": "bg-secondary hover:bg-secondary/90 text-white"
  };

  const colorStyle = plan.color && cardStyles[plan.color as keyof typeof cardStyles] 
    ? cardStyles[plan.color as keyof typeof cardStyles] 
    : cardStyles.default;

  const buttonStyle = plan.color && buttonStyles[plan.color as keyof typeof buttonStyles]
    ? buttonStyles[plan.color as keyof typeof buttonStyles]
    : buttonStyles.default;

  return (
    <Card className={`flex flex-col card-hostinger ${colorStyle} ${plan.recommended ? 'border-2 shadow-lg transform -translate-y-2' : 'border'} transition-all duration-300`}>
      <CardHeader className="pb-6">
        {plan.tag && (
          <Badge variant={plan.color === "yellow" ? "outline" : "default"} className="mb-2 self-start">
            {plan.tag}
          </Badge>
        )}
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="text-gray-600">{plan.description}</p>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="mb-4">
          <p className="text-sm text-gray-500">Preço mensal estimado</p>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">{formatPrice(plan.monthlyPrice)}</span>
            <span className="text-gray-500 ml-1">/mês</span>
          </div>
          
          <p className="text-sm text-gray-500 mt-3">Cobrança anual</p>
          <div className="font-medium">{formatPrice(plan.annualPrice || (plan.monthlyPrice * 12))} por conta</div>
          
          <p className="text-sm text-gray-500 mt-3">Total</p>
          <div className="font-medium">{formatPrice(totalPrice)} por ano</div>
          
          {plan.renewalPrice && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">Renovação</p>
              <div className="text-sm">{formatPrice(plan.renewalPrice)} por conta</div>
            </div>
          )}
        </div>
        
        {/* Quantity selector for email plans */}
        <div className="border-t border-b py-4 my-4">
          <p className="text-sm mb-2">Quantidade de contas</p>
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={decrementQuantity}
              disabled={quantity <= 1 || isPending}
            >
              <Minus size={16} />
            </Button>
            <span className="mx-4 font-medium text-lg w-6 text-center">{quantity}</span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={incrementQuantity}
              disabled={isPending}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Recursos incluídos:</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="text-green-500 mt-0.5 shrink-0" size={18} />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4">
        <Button 
          size="lg" 
          className={`w-full ${buttonStyle}`}
          onClick={handleAddToCart}
          disabled={isPending}
        >
          {isPending ? "Processando..." : "Começar agora"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmailPlanCard;
