import React, { useEffect } from "react";
import { CheckCircle, Circle, ArrowRight, Shield, Mail, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCheckoutContactProfile } from "@/hooks/useCheckoutContactProfile";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface StepNavigatorProps {
  onStepClick: (step: string) => void;
  currentStep?: string;
}

const StepNavigator: React.FC<StepNavigatorProps> = ({ onStepClick, currentStep }) => {
  const { cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const { isContactProfileRequired, isContactProfileValid } = useCheckoutContactProfile();
  const navigate = useNavigate();
  
  const hasItems = cartItems.length > 0;
  const hasDomains = cartItems.some(item => item.type === 'domain');
  const hasProtection = cartItems.some(item => item.type === 'domain_protection');
  const hasEmail = cartItems.some(item => item.type === 'email');
  const needsAuth = !isAuthenticated && hasItems;
  const needsContactProfile = isAuthenticated && isContactProfileRequired && !isContactProfileValid();
  
  // Check if all steps are complete and ready for checkout
  const isReadyForCheckout = hasItems && isAuthenticated && !needsContactProfile;
  
  // Auto-guidance for next steps
  useEffect(() => {
    if (!hasItems) return;
    
    // Auto-suggest email service first for professional presence
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
      }, 2000);
    }
    
    // Auto-suggest domain protection after adding domains  
    if (hasDomains && !hasProtection && hasEmail) {
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
      }, 4000);
    }
  }, [hasItems, hasDomains, hasProtection, hasEmail]);
  
  // Magic happens when contact profile is confirmed and ready for checkout
  useEffect(() => {
    if (isReadyForCheckout) {
      setTimeout(() => {
        toast.success("🎉 TUDO PRONTO! Perfil confirmado com sucesso! Agora você pode finalizar sua compra.", {
          duration: 8000,
          action: {
            label: "🚀 Finalizar Agora",
            onClick: () => {
              const element = document.getElementById('finalizar-compra-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                element.classList.add('animate-bounce');
                setTimeout(() => element.classList.remove('animate-bounce'), 3000);
              }
            }
          }
        });
      }, 1000);
    }
  }, [isReadyForCheckout]);
  
  const recommendations = [
    {
      id: 'email',
      title: 'Email Profissional',
      description: 'Transmita credibilidade com seu próprio domínio',
      icon: Mail,
      active: hasItems && !hasEmail,
      completed: hasEmail,
      value: '💼 Imagem profissional'
    },
    {
      id: 'protection',
      title: 'Proteção Total do Domínio',
      description: 'Garanta a segurança do seu investimento digital',
      icon: Shield,
      active: hasDomains && !hasProtection,
      completed: hasProtection,
      value: '🛡️ Essencial para negócios'
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
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-amber-900">
              {needsAuth ? '🔐 Autenticação Necessária' : '📋 Perfil de Contacto Necessário'}
            </span>
          </div>
          <p className="text-sm text-amber-700 mb-3">
            {needsAuth 
              ? 'Para finalizar sua compra e garantir a segurança, você precisa fazer login ou criar uma conta.'
              : 'Para registrar domínios com segurança, você precisa selecionar um perfil de contacto válido.'
            }
          </p>
          <Button 
            onClick={() => onStepClick(needsAuth ? 'auth' : 'contact')}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white w-full"
          >
            {needsAuth ? '🚀 Fazer Login Agora' : '✅ Selecionar Perfil'}
          </Button>
        </div>
      )}
      
      {/* Finalizar Compra - Appears when everything is ready */}
      {isReadyForCheckout && (
        <div 
          id="finalizar-compra-section"
          className="mt-6 p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-4 border-green-300 rounded-lg shadow-2xl"
          style={{
            animation: 'pulse 2s infinite, glow 3s infinite alternate'
          }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping animation-delay-200"></div>
              <h3 className="text-2xl font-bold text-green-900 animate-bounce">
                🎉 MÁGICA ACONTECEU! ✨
              </h3>
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping animation-delay-200"></div>
              <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
            </div>
            
            <div className="bg-white/80 rounded-lg p-4 mb-4 border-2 border-green-200">
              <p className="text-green-800 mb-2 font-bold text-lg">
                🎯 Todas as etapas foram concluídas com sucesso!
              </p>
              <p className="text-green-700 font-medium">
                ✅ Produtos adicionados • ✅ Login realizado • ✅ Perfil confirmado
              </p>
            </div>
            
            <Button 
              onClick={() => navigate('/checkout')}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-12 py-4 text-xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105"
              style={{
                animation: 'bounce 1s infinite, glow 2s infinite alternate'
              }}
            >
              <ShoppingCart className="mr-4 h-7 w-7 animate-pulse" />
              🚀 FINALIZAR COMPRA AGORA! 💫
              <ArrowRight className="ml-4 h-7 w-7 animate-pulse" />
            </Button>
            
            <p className="text-green-600 text-sm mt-3 font-medium animate-pulse">
              ⚡ Processo seguro e rápido • 🔒 Pagamento protegido
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepNavigator;