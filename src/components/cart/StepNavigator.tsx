import React, { useEffect, useState } from "react";
import { CheckCircle, Circle, ArrowRight, Shield, Mail, ShoppingCart, Sparkles, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  
  // Estado para controlar o popup da mágica
  const [showMagicPopup, setShowMagicPopup] = useState(false);
  
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
        setShowMagicPopup(true);
        toast.success("🎉 MÁGICA ACONTECEU! Todas as etapas concluídas com sucesso!", {
          duration: 8000,
        });
      }, 1000);
    }
  }, [isReadyForCheckout]);

  const handleFinalizarCompra = () => {
    setShowMagicPopup(false);
    navigate('/checkout');
  };
  
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
      
      {/* Magic Popup - Modal que abre quando tudo está pronto */}
      <Dialog open={showMagicPopup} onOpenChange={setShowMagicPopup}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-4 border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
          <div className="relative">
            {/* Decorative background elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-emerald-100/50 animate-pulse"></div>
            <div className="absolute top-4 left-4 w-8 h-8 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-8 right-8 w-6 h-6 bg-green-400 rounded-full animate-bounce opacity-75"></div>
            <div className="absolute bottom-6 left-8 w-4 h-4 bg-blue-400 rounded-full animate-pulse opacity-75"></div>
            
            <div className="relative z-10 p-8 text-center">
              <DialogHeader className="mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Star className="w-8 h-8 text-yellow-500 animate-spin" />
                  <Trophy className="w-10 h-10 text-yellow-600 animate-bounce" />
                  <Sparkles className="w-8 h-8 text-yellow-500 animate-ping" />
                </div>
                
                <DialogTitle className="text-4xl font-bold text-green-900 mb-2 animate-bounce">
                  🎉 MÁGICA ACONTECEU! ✨
                </DialogTitle>
                
                <div className="text-2xl font-bold text-emerald-800 animate-pulse">
                  🏆 PARABÉNS! TUDO PRONTO! 🏆
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="bg-white/80 rounded-xl p-6 border-2 border-green-300 shadow-lg">
                  <h3 className="text-xl font-bold text-green-900 mb-4">
                    🎯 Todas as etapas foram concluídas com sucesso!
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col items-center p-3 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
                      <span className="font-medium text-green-800">Produtos<br/>Adicionados</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-blue-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-blue-600 mb-2" />
                      <span className="font-medium text-blue-800">Login<br/>Realizado</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-purple-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-purple-600 mb-2" />
                      <span className="font-medium text-purple-800">Perfil<br/>Confirmado</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Button 
                    onClick={handleFinalizarCompra}
                    size="lg"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-6 text-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <ShoppingCart className="mr-4 h-8 w-8 animate-pulse" />
                    🚀 FINALIZAR COMPRA AGORA! 💫
                    <ArrowRight className="ml-4 h-8 w-8 animate-pulse" />
                  </Button>
                  
                  <div className="flex items-center justify-center gap-4 text-green-700 text-sm font-medium">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                      <span>Processo seguro</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                      <span>Pagamento protegido</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                      <span>Entrega rápida</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setShowMagicPopup(false)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Continuar navegando
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StepNavigator;