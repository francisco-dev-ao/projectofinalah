
import { useState, useTransition } from "react";
import { Check, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

export interface HostingPlan {
  id: string;
  name: string;
  subtitle: string;
  originalPrice: number;
  currentPrice: number;
  discountPercentage: number;
  totalPrice: number;
  period: number;
  savings: number;
  recommended?: boolean;
  color?: string;
  features: string[];
}

// Planos de hospedagem definidos localmente para evitar erro de importação
const hostingPlans: HostingPlan[] = [
  {
    id: "plano-p",
    name: "Plano P",
    subtitle: "Para projetos pessoais e landing pages",
    originalPrice: 20000,
    currentPrice: 15000,
    discountPercentage: 25,
    totalPrice: 15000,
    period: 1,
    savings: 5000,
    color: "blue",
    features: [
      "1 Site",
      "Certificado SSL Grátis",
      "Suporte Email",
      "99.9% Uptime"
    ]
  },
  {
    id: "plano-m",
    name: "Plano M",
    subtitle: "Ideal para pequenas empresas",
    originalPrice: 35000,
    currentPrice: 25000,
    discountPercentage: 29,
    totalPrice: 25000,
    period: 1,
    savings: 10000,
    color: "yellow",
    recommended: true,
    features: [
      "10 Sites",
      "Certificado SSL Grátis",
      "Suporte 24/7",
      "99.9% Uptime",
      "Backups Diários"
    ]
  },
  {
    id: "plano-turbo",
    name: "Plano Turbo",
    subtitle: "Para quem precisa de performance",
    originalPrice: 50000,
    currentPrice: 40000,
    discountPercentage: 20,
    totalPrice: 40000,
    period: 1,
    savings: 10000,
    color: "purple",
    features: [
      "Sites Ilimitados",
      "Certificado SSL Grátis",
      "Suporte Prioritário 24/7",
      "99.9% Uptime",
      "Backups Diários",
      "CDN Grátis"
    ]
  }
];

const HostingPlanCard = ({ plan }: { plan: HostingPlan }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  // Add useTransition to handle navigation that might cause suspense
  const [isPending, startTransition] = useTransition();
  
  const handleSelectPlan = () => {
    // Wrap localStorage and navigation operations in startTransition
    startTransition(() => {
      // Save selected plan to localStorage for the subscription page
      localStorage.setItem("selectedHostingPlan", JSON.stringify(plan));
      // Navigate to subscription selection page
      navigate(`/hospedagem/assinatura/${plan.id}`);
    });
  };

  // Define color styles based on plan color
  const cardStyles = {
    blue: "border-[#27374] hover:border-[#1b2951]",
    yellow: "border-[#27374] hover:border-[#1951]",
    purple: "border-[#27374] hover:border-[#1b2951]",
    default: "border-[#27374] hover:border-[#1b2951]"
  };

  const buttonStyles = {
    blue: "bg-[#273d74] hover:bg-[#1b2951] text-white",
    yellow: "bg-[#273d74] hover:bg-[#1b2951] text-white",
    purple: "bg-[#273d74] hover:bg-[#1b2951] text-white",
    default: "bg-[#273d74] hover:bg-[#1b2951] text-white"
  };

  const cardHoverStyle = "hover:shadow-2xl hover:-translate-y-2 transition-all duration-300";

  const colorStyle = plan.color && cardStyles[plan.color as keyof typeof cardStyles] 
    ? cardStyles[plan.color as keyof typeof cardStyles] 
    : cardStyles.default;

  const buttonStyle = plan.color && buttonStyles[plan.color as keyof typeof buttonStyles]
    ? buttonStyles[plan.color as keyof typeof buttonStyles]
    : buttonStyles.default;

  return (
    <Card className={`flex flex-col h-full border border-[#273d74] ${plan.recommended ? 'border-2 shadow-lg' : ''} ${cardHoverStyle} relative`}>
      {plan.recommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent text-black px-4 py-1 rounded-full text-sm font-medium">
          Recomendado
        </div>
      )}
      <CardHeader>
        <h3 className="text-2xl font-bold">{plan.name}</h3>
        <p className="text-gray-600">{plan.subtitle}</p>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="line-through text-gray-500">{formatPrice(plan.originalPrice)}</span>
            <Badge className={`${plan.color === 'yellow' ? 'bg-accent text-black' : ''}`}>
              {plan.discountPercentage}% OFF
            </Badge>
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">{formatPrice(plan.currentPrice)}</span>
            <span className="text-gray-500 ml-1">/mês</span>
          </div>
          <div className="text-sm font-medium">
            {formatPrice(plan.totalPrice)} por {plan.period} anos
          </div>
          <div className="text-sm text-green-600 font-medium">
            Economize {formatPrice(plan.savings)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="border-t border-b py-4 space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-0.5 shrink-0" size={18} />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="pt-4">
        <Button 
          size="lg" 
          className={`w-full ${buttonStyle} transition-colors duration-200`}
          onClick={handleSelectPlan}
          disabled={isPending}
        >
          {isPending ? "Processando..." : "Começar agora"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const HostingPlansSection = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Removido o título e subtítulo duplicados */}
        {/* 
        <h2 className="section-title">Planos de Hospedagem Web</h2>
        <p className="section-subtitle">
          Escolha o plano perfeito para o seu negócio com recursos escaláveis e preço em Kwanzas
        </p>
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {hostingPlans.map((plan, index) => (
            <HostingPlanCard key={index} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HostingPlansSection;
