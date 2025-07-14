
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/cart/useCart";
import { toast } from "sonner";

export interface PricingPlan {
  name: string;
  price: number;
  period: string;
  popular?: boolean;
  features: string[];
  storage: string;
  bandwidth: string;
  databases: number;
  emails: number;
  buttonText: string;
}

interface PricingCardProps {
  plan: PricingPlan;
}

const PricingCard = ({ plan }: PricingCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const handleAddToCart = () => {
    // Create cart item object
    const cartItem = {
      id: `hosting-${plan.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: plan.name,
      description: `Hospedagem de sites (${plan.period})`,
      price: plan.price,
      unitPrice: plan.price,
      type: "hosting" as const,
      period: plan.period,
      quantity: 1
    };
    
    // Add to cart
    addToCart(cartItem);
    
    // Show success message
    toast.success(`${plan.name} adicionado ao carrinho`);
    
    // Navigate to cart
    navigate("/cart");
  };
  
  return (
    <div className={`pricing-card ${plan.popular ? "border-primary border-2 relative" : "border-gray-200"}`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
          Mais Popular
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <div className="mt-4">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
            <span className="text-gray-500 ml-1">/{plan.period}</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-b py-6 mb-6">
        <div className="feature-item">
          <Check size={18} className="text-primary" />
          <span>{plan.storage} de Armazenamento</span>
        </div>
        <div className="feature-item">
          <Check size={18} className="text-primary" />
          <span>{plan.bandwidth} de Banda</span>
        </div>
        <div className="feature-item">
          <Check size={18} className="text-primary" />
          <span>{plan.databases} Bases de Dados</span>
        </div>
        <div className="feature-item">
          <Check size={18} className="text-primary" />
          <span>{plan.emails} Contas de Email</span>
        </div>
        
        {plan.features.map((feature, index) => (
          <div key={index} className="feature-item">
            <Check size={18} className="text-primary" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-auto">
        <Button 
          className="w-full" 
          variant={plan.popular ? "default" : "outline"}
          onClick={handleAddToCart}
        >
          {plan.buttonText}
        </Button>
      </div>
    </div>
  );
};

export default PricingCard;
