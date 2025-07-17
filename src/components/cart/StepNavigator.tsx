import React from "react";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCheckoutContactProfile } from "@/hooks/useCheckoutContactProfile";

interface StepNavigatorProps {
  onStepClick: (step: string) => void;
  currentStep?: string;
}

const StepNavigator: React.FC<StepNavigatorProps> = ({ onStepClick, currentStep }) => {
  const { cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const { isContactProfileRequired, isContactProfileValid } = useCheckoutContactProfile();
  
  const hasItems = cartItems.length > 0;
  const hasDomains = cartItems.some(item => item.type === 'domain' && !item.isExistingDomain);
  const needsAuth = !isAuthenticated && hasItems;
  const needsContactProfile = isAuthenticated && isContactProfileRequired && !isContactProfileValid();
  
  const steps = [
    {
      id: 'cart',
      title: 'Produtos no Carrinho',
      completed: hasItems,
      current: currentStep === 'cart'
    },
    {
      id: 'auth',
      title: 'Login/Registro',
      completed: isAuthenticated,
      current: currentStep === 'auth',
      required: needsAuth
    },
    {
      id: 'contact',
      title: 'Perfil de Contacto',
      completed: !needsContactProfile,
      current: currentStep === 'contact',
      required: needsContactProfile
    },
    {
      id: 'checkout',
      title: 'Finalizar Compra',
      completed: false,
      current: currentStep === 'checkout',
      required: hasItems && isAuthenticated && !needsContactProfile
    }
  ];
  
  const nextIncompleteStep = steps.find(step => !step.completed && step.required);
  
  if (!hasItems) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
      <h3 className="text-lg font-semibold mb-4">Progresso da Compra</h3>
      
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.completed ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
            
            <span className={`flex-1 ${step.completed ? 'text-green-600 font-medium' : step.current ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
              {step.title}
              {step.required && !step.completed && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </span>
            
            {step.current && (
              <span className="text-blue-600 text-sm">Atual</span>
            )}
          </div>
        ))}
      </div>
      
      {nextIncompleteStep && (
        <div className="mt-4 pt-4 border-t">
          <Button 
            onClick={() => onStepClick(nextIncompleteStep.id)}
            className="w-full flex items-center justify-center gap-2"
          >
            Próximo: {nextIncompleteStep.title}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepNavigator;