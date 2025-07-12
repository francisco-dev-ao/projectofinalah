
import { useState, useTransition, useCallback } from "react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { validateExistingDomain } from "@/utils/domainUtils";

export const useCartDomain = () => {
  const [domainOption, setDomainOption] = useState<"register" | "use">("register");
  const [existingDomain, setExistingDomain] = useState("");
  const [domainName, setDomainName] = useState("");
  const [domainExtension, setDomainExtension] = useState(".ao");
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [domainError, setDomainError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { addDomainToCart, cartItems } = useCart();

  // Check if we have any hosting or email products that might need a domain
  const needsDomain = cartItems.some(item => 
    item.type === 'email' || item.type === 'hosting'
  );

  // Check if a domain already exists in the cart
  const hasDomainInCart = cartItems.some(item => item.type === 'domain');

  // Use useCallback to memoize validation function
  const validateDomainAndShowFeedback = useCallback((): boolean => {
    const isValid = validateExistingDomain(existingDomain);
    
    if (!isValid) {
      setDomainError("Por favor, digite um domínio válido");
    } else {
      setDomainError("");
    }
    
    return isValid;
  }, [existingDomain]);

  // Export the wrapped validation function
  const validateExistingDomainCallback = useCallback((): boolean => {
    return validateDomainAndShowFeedback();
  }, [validateDomainAndShowFeedback]);

  const checkDomainAvailability = useCallback(() => {
    if (!domainName.trim()) {
      toast.error("Por favor, digite o nome do domínio");
      return;
    }

    // Set loading state outside transition
    setIsCheckingDomain(true);
    
    // Extract the async operation into a separate function
    const performDomainCheck = async () => {
      try {
        // Simulate API call to check domain availability
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const fullDomain = `${domainName}${domainExtension}`;
        
        // Show success message
        toast.success(`O domínio ${fullDomain} está disponível!`);
        
        // Add domain to cart with a sample price
        addDomainToCart({ 
          domain: fullDomain, 
          available: true, 
          price: 15000 // Sample price
        });
        
      } catch (error) {
        console.error("Domain check error:", error);
        toast.error("Erro ao verificar disponibilidade do domínio");
      } finally {
        setIsCheckingDomain(false);
      }
    };
    
    // Start the domain check
    performDomainCheck();
  }, [domainName, domainExtension, addDomainToCart]);

  const setDomainOptionWithTransition = useCallback((option: "register" | "use") => {
    setDomainOption(option);
    // Clear any domain errors when switching options
    if (domainError) {
      setDomainError("");
    }
  }, [domainError]);

  return {
    domainOption,
    setDomainOption: setDomainOptionWithTransition,
    existingDomain,
    setExistingDomain,
    domainName,
    setDomainName,
    domainExtension,
    setDomainExtension,
    isCheckingDomain,
    setIsCheckingDomain,
    domainError,
    setDomainError,
    validateDomainAndShowFeedback,
    validateExistingDomain: validateExistingDomainCallback,
    checkDomainAvailability,
    needsDomain,
    hasDomainInCart,
    isPending: isPending || isCheckingDomain
  };
};
