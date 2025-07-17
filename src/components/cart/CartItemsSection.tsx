
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import CartItemsList from "@/components/cart/CartItemsList";
import DomainSelector from "@/components/cart/DomainSelector";
import DomainProtectionOption from "@/components/cart/DomainProtectionOption";
import EmailServiceOption from "@/components/cart/EmailServiceOption";
import CartAuthOptions from "@/components/cart/CartAuthOptions";
import ContactProfileSelection from "@/components/checkout/ContactProfileSelection";
import DiscountInfo from "@/components/cart/DiscountInfo";
import StepNavigator from "@/components/cart/StepNavigator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCheckoutContactProfile } from "@/hooks/useCheckoutContactProfile";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface CartItemsSectionProps {
  domainOption: "register" | "use";
  setDomainOption: (option: "register" | "use") => void;
  existingDomain: string;
  setExistingDomain: (domain: string) => void;
  domainError: string;
  setDomainError: (error: string) => void;
  needsDomain: boolean;
  hasDomainInCart: boolean;
  onValidateDomain: () => void;
  showAuthSection: boolean;
}

const CartItemsSection: React.FC<CartItemsSectionProps> = ({
  domainOption,
  setDomainOption,
  existingDomain,
  setExistingDomain,
  domainError,
  setDomainError,
  needsDomain,
  hasDomainInCart,
  onValidateDomain,
  showAuthSection
}) => {
  const { cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const {
    selectedContactProfileId,
    isContactProfileRequired,
    isContactProfileValid,
    handleProfileSelected
  } = useCheckoutContactProfile();

  const handleProfileContinue = () => {
    if (selectedContactProfileId) {
      toast.success("🎉 Perfil de contacto confirmado com sucesso! A mágica está acontecendo...", {
        duration: 5000,
        action: {
          label: "Ver Resultado",
          onClick: () => {
            setTimeout(() => {
              const element = document.getElementById('finalizar-compra-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }, 500);
          }
        }
      });
    } else {
      toast.error("Por favor, selecione um perfil de contacto primeiro.");
    }
  };

  const handleStepNavigation = (step: string) => {
    if (step === 'protection') {
      const element = document.getElementById('domain-protection');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.classList.add('animate-pulse');
        setTimeout(() => element.classList.remove('animate-pulse'), 2000);
      }
    } else if (step === 'email') {
      const element = document.getElementById('email-service');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.classList.add('animate-pulse');
        setTimeout(() => element.classList.remove('animate-pulse'), 2000);
      }
    } else {
      // Handle other steps
      const element = document.getElementById(`step-${step}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Navigator */}
      <StepNavigator onStepClick={handleStepNavigation} currentStep="cart" />
      
      <div id="step-cart" className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-semibold">Seu Carrinho</h1>
          <Link 
            to="/" 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Continuar comprando
          </Link>
        </div>
        
        <CartItemsList />
        
        {/* Discount Info */}
        <DiscountInfo />
      </div>
      
      {/* Domain Protection Option - Only shown if there are domains */}
      <div id="domain-protection">
        <DomainProtectionOption />
      </div>
      
      {/* Email Service Option - Only shown if there are services that need email */}
      <div id="email-service">
        <EmailServiceOption />
      </div>
      
      {/* Domain selection section - show only when needed */}
      {(needsDomain && !hasDomainInCart) && (
        <div id="step-domain">
          <DomainSelector 
            existingDomain={existingDomain}
            setExistingDomain={setExistingDomain}
            domainOption={domainOption}
            setDomainOption={setDomainOption}
            domainError={domainError}
            setDomainError={setDomainError}
            onValidate={onValidateDomain}
          />
        </div>
      )}

      {/* Contact Profile selection for NEW domains only - OPCIONAL para domínios existentes */}
      {isAuthenticated && isContactProfileRequired && (
        <div id="step-contact" className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h2 className="text-xl font-semibold text-blue-900">Perfil de Contacto para Novos Domínios</h2>
              <p className="text-blue-700 text-sm">
                Para registrar novos domínios, selecione um perfil de contacto válido. Não é necessário para domínios existentes.
              </p>
            </div>
          </div>
          
          {!isContactProfileValid() && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">
                <strong>Atenção:</strong> Você não poderá prosseguir para o checkout sem selecionar um perfil de contacto.
              </AlertDescription>
            </Alert>
          )}
          
          <ContactProfileSelection
            onProfileSelected={handleProfileSelected}
            onContinue={handleProfileContinue}
            selectedProfileId={selectedContactProfileId}
          />
        </div>
      )}
      
      {/* Authentication options for non-logged in users - Show automatically when there are items */}
      {!isAuthenticated && cartItems.length > 0 && (
        <div id="step-auth" className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-semibold text-blue-900">Etapa Necessária</h2>
          </div>
          <CartAuthOptions onAuthSuccess={() => {}} />
        </div>
      )}
    </div>
  );
};

export default CartItemsSection;
