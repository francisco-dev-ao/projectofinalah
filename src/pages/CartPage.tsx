
import React, { useState, useTransition, Suspense, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useCartDomain } from "@/hooks/useCartDomain";
import { useCartCheckout } from "@/hooks/useCartCheckout";
import EmptyCartPage from "@/components/cart/EmptyCartPage";
import CartPageLayout from "@/components/cart/CartPageLayout";
import CartItemsSection from "@/components/cart/CartItemsSection";
import CartSummarySection from "@/components/cart/CartSummarySection";
import { Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

// Define the checkout steps
const checkoutSteps = [
  { id: 1, name: "Carrinho" }
];

const CartPage = () => {
  const { cartItems, clearCart, addItem } = useCart();
  const [isPending, startTransition] = useTransition();
  const location = useLocation();
  const [showAuthSection, setShowAuthSection] = useState(false);
  
  // Use our custom hooks to manage domain and checkout logic
  const {
    domainOption,
    setDomainOption,
    existingDomain,
    setExistingDomain,
    domainName,
    setDomainName,
    domainExtension,
    setDomainExtension,
    isCheckingDomain,
    domainError,
    setDomainError,
    validateExistingDomain,
    checkDomainAvailability,
    needsDomain,
    hasDomainInCart
  } = useCartDomain();

  const {
    isProcessing,
    handleProceedToCheckout,
    onlyDomainInCart
  } = useCartCheckout(
    validateExistingDomain,
    domainOption,
    existingDomain,
    needsDomain,
    hasDomainInCart,
    // Show auth section when needed
    () => setShowAuthSection(true)
  );

  // Restore cart from session storage if we returned from checkout
  useEffect(() => {
    if (location.state?.from === 'checkout' && cartItems.length === 0) {
      const savedCartItems = sessionStorage.getItem('checkoutCartItems');
      
      if (savedCartItems) {
        try {
          const items = JSON.parse(savedCartItems);
          if (items.length > 0) {
            // Restore items one by one
            items.forEach((item: any) => {
              addItem(item, item.quantity);
            });
            console.log("Restored cart items from checkout:", items);
            // Clear the checkout cart storage
            sessionStorage.removeItem('checkoutCartItems');
          }
        } catch (e) {
          console.error("Error parsing saved cart items:", e);
        }
      }
    }
  }, [location.state, cartItems.length, addItem]);

  // Check for cart emptying issues after navigation
  useEffect(() => {
    const pendingCheckout = sessionStorage.getItem('pendingCheckout');
    if (pendingCheckout) {
      try {
        const checkoutData = JSON.parse(pendingCheckout);
        // If we came back to cart from checkout and cart is empty but there was a pending checkout
        if (location.state?.from === 'checkout' && cartItems.length === 0 && checkoutData.hasItems) {
          // Show a message to the user
          toast("Seus itens podem ter sido perdidos durante o processo.", {
            description: "Tente adicionar os produtos novamente ou contacte o suporte se o problema persistir.",
            action: {
              label: "OK",
              onClick: () => {}
            }
          });
          // Clear the pending checkout flag
          sessionStorage.removeItem('pendingCheckout');
        }
      } catch (e) {
        console.error("Error parsing pending checkout data:", e);
        sessionStorage.removeItem('pendingCheckout');
      }
    }
  }, [cartItems.length, location]);

  // Handle proceed to checkout with transition
  const handleCheckoutWithTransition = () => {
    startTransition(() => {
      // Save cart items to session storage before proceeding to checkout
      sessionStorage.setItem('checkoutCartItems', JSON.stringify(cartItems));
      
      handleProceedToCheckout();
    });
  };

  // Show empty cart page if cart is empty
  if (cartItems.length === 0) {
    return <EmptyCartPage />;
  }

  // Handle domain validation in transition
  const handleDomainValidation = () => {
    startTransition(() => {
      validateExistingDomain();
    });
  };

  return (
    <CartPageLayout currentStep={1} steps={checkoutSteps}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Cart items and domain selection */}
        <div className="lg:col-span-2">
          <Suspense fallback={<div className="flex items-center justify-center p-10"><Loader2 className="animate-spin" /></div>}>
            <CartItemsSection 
              domainOption={domainOption}
              setDomainOption={setDomainOption}
              existingDomain={existingDomain}
              setExistingDomain={setExistingDomain}
              domainError={domainError}
              setDomainError={setDomainError}
              needsDomain={needsDomain}
              hasDomainInCart={hasDomainInCart}
              onValidateDomain={handleDomainValidation}
              showAuthSection={showAuthSection}
            />
          </Suspense>
        </div>
        
        {/* Right column: Order summary */}
        <div>
          <Suspense fallback={<div className="flex items-center justify-center p-10"><Loader2 className="animate-spin" /></div>}>
            <CartSummarySection 
              handleProceedToCheckout={handleCheckoutWithTransition}
              isProcessing={isProcessing || isPending}
            />
          </Suspense>
        </div>
      </div>
    </CartPageLayout>
  );
};

export default CartPage;
