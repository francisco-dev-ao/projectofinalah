
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useCheckoutContactProfile } from "./useCheckoutContactProfile";
import { useOrderEmail } from "./useOrderEmail";
import { toast } from "sonner";

export const useCartCheckout = (
  validateExistingDomain: () => void,
  domainOption: "register" | "use",
  existingDomain: string,
  needsDomain: boolean,
  hasDomainInCart: boolean,
  showAuthSection: () => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const {
    selectedContactProfileId,
    isContactProfileRequired,
    isContactProfileValid
  } = useCheckoutContactProfile();

  // Check if cart has only domain items
  const onlyDomainInCart = cartItems.length > 0 && cartItems.every(item => item.type === 'domain');

  const handleProceedToCheckout = async () => {
    setIsProcessing(true);

    try {
      // Check if user is authenticated
      if (!isAuthenticated) {
        showAuthSection();
        toast.error("Por favor, faça login ou crie uma conta para continuar");
        return;
      }

      // Validate domain requirements
      if (needsDomain && !hasDomainInCart) {
        if (domainOption === "use" && !existingDomain.trim()) {
          toast.error("Por favor, informe o domínio existente");
          return;
        }

        if (domainOption === "use") {
          validateExistingDomain();
          return;
        }
      }

      // VALIDAÇÃO: Perfil de contacto apenas para novos domínios (não domínios existentes)
      if (isContactProfileRequired && !isContactProfileValid()) {
        toast.error("Perfil de contacto é necessário para registro de novos domínios. Por favor, selecione um perfil.");
        return;
      }

      // Validate cart items
      if (cartItems.length === 0) {
        toast.error("Seu carrinho está vazio");
        return;
      }

      // Save cart items to session storage before navigation
      sessionStorage.setItem('checkoutCartItems', JSON.stringify(cartItems));
      
      // Navigate to checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      toast.error("Erro ao prosseguir para o checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    handleProceedToCheckout,
    onlyDomainInCart,
    isContactProfileRequired,
    isContactProfileValid: isContactProfileValid()
  };
};
