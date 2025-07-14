
import { useState, useEffect, useTransition } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, Check, Info } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { HostingPlan } from "../components/HostingPlansSection";
import { useCart } from "@/contexts/CartContext";

interface SubscriptionOption {
  id: string;
  duration: number;
  durationText: string;
  originalPrice: number;
  discountPercentage: number | null;
  currentPrice: number;
  totalPrice: number;
  savings: number | null;
  renewal: number | null;
  recommended?: boolean;
  extras?: string[];
}

const SubscriptionPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<HostingPlan | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const { addToCart } = useCart();
  // Add useTransition hook to handle state transitions
  const [isPending, startTransition] = useTransition();
  
  useEffect(() => {
    // Wrap the state update in startTransition to prevent suspense during rendering
    startTransition(() => {
      // Retrieve selected plan from localStorage
      const storedPlan = localStorage.getItem("selectedHostingPlan");
      if (storedPlan) {
        setSelectedPlan(JSON.parse(storedPlan));
      } else if (planId) {
        // If no plan in localStorage, redirect back to hosting page
        navigate("/hospedagem");
        toast.error("Por favor, selecione um plano de hospedagem primeiro");
      }
    });
  }, [planId, navigate]);
  
  // Generate subscription options based on the selected plan
  const subscriptionOptions: SubscriptionOption[] = [
    {
      id: "monthly",
      duration: 1,
      durationText: "1 mês",
      originalPrice: 45190,
      discountPercentage: null,
      currentPrice: 45190,
      totalPrice: 45190,
      savings: null,
      renewal: null,
      extras: [],
    },
    {
      id: "biannual",
      duration: 6,
      durationText: "6 meses",
      originalPrice: 45190,
      discountPercentage: 62,
      currentPrice: 16890,
      totalPrice: 100780,
      savings: 170360,
      renewal: 41990,
      extras: [],
    },
    {
      id: "annual",
      duration: 12,
      durationText: "1 ano",
      originalPrice: 45190,
      discountPercentage: 65,
      currentPrice: 15590,
      totalPrice: 186190,
      savings: 436080,
      renewal: 38790,
      recommended: true,
      extras: ["1 ano de domínio grátis"],
    },
    {
      id: "triennial",
      duration: 36,
      durationText: "3 anos",
      originalPrice: 45190,
      discountPercentage: 69,
      currentPrice: 13890,
      totalPrice: 499540,
      savings: 1207290,
      renewal: 34690,
      extras: ["1 ano de domínio grátis"],
    },
  ];
  
  const handleSubscriptionSelect = (subscriptionId: string) => {
    // Wrap state updates in startTransition
    startTransition(() => {
      setSelectedSubscription(subscriptionId);
    });
  };

  const handleContinue = () => {
    if (!selectedSubscription || !selectedPlan) {
      toast.error("Por favor, selecione uma opção de assinatura");
      return;
    }
    
    const subscription = subscriptionOptions.find(sub => sub.id === selectedSubscription);
    
    if (!subscription) {
      toast.error("Opção de assinatura inválida");
      return;
    }
    
    // Wrap multiple state updates and side effects in startTransition
    startTransition(() => {
      // Create cart item
      const cartItem = {
        id: `${selectedPlan.id}-${subscription.id}-${Date.now()}`,
        name: `Hospedagem ${selectedPlan.name}`,
        description: `Assinatura de ${subscription.durationText}`,
        price: subscription.totalPrice,
        unitPrice: subscription.currentPrice,
        type: "hosting",
        period: subscription.durationText,
        quantity: 1,
        duration: subscription.duration,
        durationUnit: subscription.duration === 1 ? 'month' : 'month'
      };
      
      // Add to cart using the CartContext
      addToCart(cartItem);
      
      // Show success message
      toast.success(`${selectedPlan.name} adicionado ao carrinho`);
      
      // Navigate to cart
      navigate("/cart");
    });
  };

  // Show loading state when transitions are pending
  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xl">Carregando...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xl">Carregando...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-8 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 mb-8">
              <div className="bg-green-500 text-white rounded-full p-1">
                <Check size={16} />
              </div>
              <p className="font-medium text-green-800">
                Você adicionou a Hospedagem de sites {selectedPlan.name}
              </p>
            </div>

            <h1 className="text-2xl font-bold mb-2 text-center">
              Escolha uma das opções de assinatura para seguir:
            </h1>
            <p className="text-center text-gray-600 mb-10">
              Quanto mais longa sua assinatura, mais você economiza
            </p>

            <div className="grid grid-cols-1 gap-6">
              {subscriptionOptions.map((option) => (
                <Card 
                  key={option.id}
                  className={`border cursor-pointer transition-all ${
                    selectedSubscription === option.id 
                      ? 'border-2 border-primary shadow-md' 
                      : 'hover:border-gray-300'
                  } ${option.recommended ? 'relative' : ''}`}
                  onClick={() => handleSubscriptionSelect(option.id)}
                >
                  {option.recommended && (
                    <div className="absolute -top-3 left-4 bg-accent text-black px-3 py-0.5 rounded-md text-sm font-medium">
                      Mais popular
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedSubscription === option.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-gray-300'
                        }`}>
                          {selectedSubscription === option.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="text-primary" size={20} />
                          <span className="font-medium">{option.durationText}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        {option.discountPercentage && (
                          <Badge className="bg-red-500 text-white self-start">
                            {option.discountPercentage}% OFF
                          </Badge>
                        )}
                        <div className="flex gap-2 items-baseline">
                          {option.discountPercentage && (
                            <span className="line-through text-sm text-gray-500">
                              {formatPrice(option.originalPrice)}
                            </span>
                          )}
                          <span className="font-bold text-xl">
                            {formatPrice(option.currentPrice)}
                          </span>
                          <span className="text-gray-500 text-sm">/mês</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Valor total</p>
                          <p className="font-medium">{formatPrice(option.totalPrice)}</p>
                        </div>

                        {option.savings && (
                          <div>
                            <p className="text-sm text-gray-500">Economia</p>
                            <p className="font-medium text-green-600">{formatPrice(option.savings)}</p>
                          </div>
                        )}
                      </div>

                      {option.renewal && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-500">
                            Renovação: {formatPrice(option.renewal)}/mês
                          </p>
                        </div>
                      )}

                      {option.extras && option.extras.length > 0 && (
                        <div className="mt-3">
                          {option.extras.map((extra, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                              <span className="text-green-500 font-bold text-sm">+</span>
                              <span className="text-green-600 text-sm font-medium">{extra}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex flex-col items-center mt-8">
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-help">
                        <Info size={16} className="text-gray-500" />
                        <span className="ml-1 text-blue-600 underline">
                          Condições para preços promocionais
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Os preços promocionais são válidos para o primeiro período de contratação. 
                      Após esse período, a renovação será feita pelo valor indicado.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Button 
                size="lg" 
                onClick={handleContinue}
                className="px-10 gap-2"
                disabled={!selectedSubscription}
              >
                Continuar
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionPage;
