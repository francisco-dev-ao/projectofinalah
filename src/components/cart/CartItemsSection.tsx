
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import CartItemsList from "@/components/cart/CartItemsList";
import DomainSelector from "@/components/cart/DomainSelector";
import CartAuthOptions from "@/components/cart/CartAuthOptions";
import ContactProfileSelection from "@/components/checkout/ContactProfileSelection";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCheckoutContactProfile } from "@/hooks/useCheckoutContactProfile";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      toast.success("Perfil de contacto confirmado! Agora pode prosseguir para o checkout.");
    } else {
      toast.error("Por favor, selecione um perfil de contacto primeiro.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
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
      </div>
      
      {/* Domain selection section - show only when needed */}
      {(needsDomain && !hasDomainInCart) && (
        <DomainSelector 
          existingDomain={existingDomain}
          setExistingDomain={setExistingDomain}
          domainOption={domainOption}
          setDomainOption={setDomainOption}
          domainError={domainError}
          setDomainError={setDomainError}
          onValidate={onValidateDomain}
        />
      )}

      {/* Contact Profile selection for NEW domains only - OPCIONAL para domínios existentes */}
      {isAuthenticated && isContactProfileRequired && (
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
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
      
      {/* Authentication options for non-logged in users */}
      {!isAuthenticated && showAuthSection && (
        <CartAuthOptions onAuthSuccess={() => {}} />
      )}
    </div>
  );
};

export default CartItemsSection;
