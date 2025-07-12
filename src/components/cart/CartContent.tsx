
import React, { useTransition } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CartItemsList from "@/components/cart/CartItemsList";
import DomainSelector from "@/components/cart/DomainSelector";
import CartAuthOptions from "@/components/cart/CartAuthOptions";
import OrderSummary from "@/components/cart/OrderSummary";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

interface CartContentProps {
  domainOption: "register" | "use";
  setDomainOption: (option: "register" | "use") => void;
  existingDomain: string;
  setExistingDomain: (domain: string) => void;
  domainName: string;
  setDomainName: (name: string) => void;
  domainExtension: string;
  setDomainExtension: (extension: string) => void;
  checkDomainAvailability: () => void;
  isCheckingDomain: boolean;
  handleProceedToCheckout: () => void;
  isProcessing: boolean;
  domainError: string;
  setDomainError: (error: string) => void;
}

const CartContent: React.FC<CartContentProps> = ({
  domainOption,
  setDomainOption,
  existingDomain,
  setExistingDomain,
  domainName,
  setDomainName,
  domainExtension,
  setDomainExtension,
  checkDomainAvailability,
  isCheckingDomain,
  handleProceedToCheckout,
  isProcessing,
  domainError,
  setDomainError
}) => {
  const { cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const [isPending, startTransition] = useTransition();

  // Check if we have any hosting or email products that might need a domain
  const needsDomain = cartItems.some(item => 
    item.type === 'email' || item.type === 'hosting'
  );

  // Check if a domain already exists in the cart
  const hasDomainInCart = cartItems.some(item => item.type === 'domain');
  
  // Handle domain validation as part of the domain selection process
  const handleDomainValidate = () => {
    if (domainOption === "use") {
      startTransition(() => {
        // Validation logic will be handled in the parent component through validateExistingDomain
      });
    }
  };

  const handleContinueShopping = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    startTransition(() => {
      window.location.href = "/";
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: Cart items and domain selection */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Seu Carrinho</h1>
            <Link 
              to="/" 
              className="flex items-center text-blue-600 hover:text-blue-800"
              onClick={handleContinueShopping}
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
            onValidate={handleDomainValidate}
          />
        )}
        
        {/* Authentication options for non-logged in users */}
        {!isAuthenticated && (
          <CartAuthOptions onAuthSuccess={() => {}} />
        )}
      </div>
      
      {/* Right column: Order summary */}
      <div>
        <OrderSummary 
          onProceedToCheckout={handleProceedToCheckout} 
          isProcessing={isProcessing || isPending}
        />
      </div>
    </div>
  );
};

export default CartContent;
