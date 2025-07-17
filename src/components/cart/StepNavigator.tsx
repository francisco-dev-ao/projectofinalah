import React, { useEffect } from "react";
import { CheckCircle, Circle, ArrowRight, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCheckoutContactProfile } from "@/hooks/useCheckoutContactProfile";
import { toast } from "sonner";

interface StepNavigatorProps {
  onStepClick: (step: string) => void;
  currentStep?: string;
}

const StepNavigator: React.FC<StepNavigatorProps> = ({ onStepClick, currentStep }) => {
  const { cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const { isContactProfileRequired, isContactProfileValid } = useCheckoutContactProfile();
  
  const hasItems = cartItems.length > 0;
  const hasDomains = cartItems.some(item => item.type === 'domain');
  const hasProtection = cartItems.some(item => item.type === 'domain_protection');
  const hasEmail = cartItems.some(item => item.type === 'email');
  const needsAuth = !isAuthenticated && hasItems;
  const needsContactProfile = isAuthenticated && isContactProfileRequired && !isContactProfileValid();
  
  // Auto-guidance for next steps
  useEffect(() => {
    if (!hasItems) return;
    
    // Auto-suggest domain protection after adding domains
    if (hasDomains && !hasProtection) {
      setTimeout(() => {
        toast.success("💎 Proteja seu investimento! Adicione Proteção Total do Domínio para garantir segurança máxima.", {
          duration: 6000,
          action: {
            label: "Ver Proteção",
            onClick: () => {
              const element = document.getElementById('domain-protection');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                element.classList.add('animate-pulse');
                setTimeout(() => element.classList.remove('animate-pulse'), 2000);
              }
            }
          }
        });
      }, 2000);
    }
    
    // Auto-suggest email service for professional presence
    if (hasItems && !hasEmail) {
      setTimeout(() => {
        toast.success("📧 Complete sua presença profissional! Adicione Email Profissional para comunicação empresarial.", {
          duration: 6000,
          action: {
            label: "Ver Email",
            onClick: () => {
              const element = document.getElementById('email-service');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                element.classList.add('animate-pulse');
                setTimeout(() => element.classList.remove('animate-pulse'), 2000);
              }
            }
          }
        });
      }, 4000);
    }
  }, [hasItems, hasDomains, hasProtection, hasEmail]);
  
  const recommendations = [
    {
      id: 'protection',
      title: 'Proteção Total do Domínio',
      description: 'Garanta a segurança do seu investimento digital',
      icon: Shield,
      active: hasDomains && !hasProtection,
      completed: hasProtection,
      value: '🛡️ Essencial para negócios'
    },
    {
      id: 'email',
      title: 'Email Profissional',
      description: 'Transmita credibilidade com seu próprio domínio',
      icon: Mail,
      active: hasItems && !hasEmail,
      completed: hasEmail,
      value: '💼 Imagem profissional'
    }
  ];
  
  if (!hasItems) return null;
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-semibold text-blue-900">Maximize seu Investimento Digital</h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {recommendations.map((rec) => {
          const IconComponent = rec.icon;
          
          return (
            <div 
              key={rec.id}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                rec.completed 
                  ? 'border-green-200 bg-green-50' 
                  : rec.active 
                    ? 'border-blue-300 bg-blue-50 shadow-md hover:shadow-lg animate-fade-in' 
                    : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  rec.completed ? 'bg-green-100' : rec.active ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {rec.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <IconComponent className={`h-5 w-5 ${rec.active ? 'text-blue-600' : 'text-gray-400'}`} />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    rec.completed ? 'text-green-900' : rec.active ? 'text-blue-900' : 'text-gray-600'
                  }`}>
                    {rec.title}
                  </h4>
                  <p className={`text-sm ${
                    rec.completed ? 'text-green-700' : rec.active ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {rec.description}
                  </p>
                  <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                    rec.completed 
                      ? 'bg-green-100 text-green-800' 
                      : rec.active 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {rec.completed ? '✅ Adicionado' : rec.value}
                  </span>
                </div>
              </div>
              
              {rec.active && (
                <Button 
                  onClick={() => onStepClick(rec.id)}
                  size="sm"
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Adicionar Agora
                </Button>
              )}
            </div>
          );
        })}
      </div>
      
      {(needsAuth || needsContactProfile) && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Circle className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-900">
              {needsAuth ? 'Login Necessário' : 'Perfil de Contacto Necessário'}
            </span>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            {needsAuth 
              ? 'Para finalizar sua compra, você precisa fazer login ou criar uma conta.'
              : 'Para registrar domínios, você precisa selecionar um perfil de contacto.'
            }
          </p>
          <Button 
            onClick={() => onStepClick(needsAuth ? 'auth' : 'contact')}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {needsAuth ? 'Fazer Login' : 'Selecionar Perfil'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepNavigator;