import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutSteps from "@/components/cart/CheckoutSteps";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import CheckoutAuthStep from "@/components/checkout/CheckoutAuthStep";
import CheckoutPaymentStep from "@/components/checkout/CheckoutPaymentStep";
import { motion } from "framer-motion";

interface CheckoutPageContentProps {
  navigate: (path: string, options?: any) => void;
  location: any;
}

const CheckoutPageContent: React.FC<CheckoutPageContentProps> = ({ navigate, location }) => {
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  // Apenas 2 passos: Autenticação e Pagamento
  const [currentStep, setCurrentStep] = useState(isAuthenticated ? 1 : 0);
  const [hasStartedCheckout, setHasStartedCheckout] = useState(false);

  // Check for cart items on mount and save to session storage to prevent loss
  useEffect(() => {
    // Se não começamos o checkout e há itens no carrinho, salvar no sessionStorage
    if (!hasStartedCheckout && cartItems.length > 0) {
      sessionStorage.setItem('checkoutCartItems', JSON.stringify(cartItems));
      setHasStartedCheckout(true);
      return; // Early return para evitar executar o resto
    } 
    
    // Se o carrinho está vazio E já começamos o checkout, verificar sessionStorage
    if (cartItems.length === 0 && hasStartedCheckout) {
      const savedCartItems = sessionStorage.getItem('checkoutCartItems');
      
      if (!savedCartItems || JSON.parse(savedCartItems).length === 0) {
        navigate('/cart', { state: { from: 'checkout' } });
        toast.error("Seu carrinho está vazio");
      }
    }
  }, [cartItems.length, hasStartedCheckout, navigate]);

  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    toast.success("Login realizado com sucesso!");
    setCurrentStep(1); // Move to payment step
  }, []);

  // Handle go back step
  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Handle successful payment
  const handleOrderSuccess = useCallback((orderId: string) => {
    clearCart();
    sessionStorage.removeItem('checkoutCartItems');
    navigate(`/order-success/${orderId}`);
  }, [clearCart, navigate]);

  // Step names for CheckoutSteps component
  const stepNames = ['Autenticação', 'Pagamento'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalizar Compra</h1>
            <p className="text-gray-600">Complete sua compra de forma segura e rápida</p>
          </div>

          <CheckoutSteps 
            currentStep={currentStep} 
            totalSteps={2}
            stepNames={stepNames}
          />

          <div className="mt-8">
            {currentStep === 0 && !isAuthenticated && (
              <CheckoutAuthStep onAuthSuccess={handleAuthSuccess} />
            )}
            
            {(currentStep === 1 || isAuthenticated) && (
              <CheckoutPaymentStep 
                onPrevStep={handlePrevStep}
                onOrderSuccess={handleOrderSuccess}
              />
            )}
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

const CheckoutPageWrapper = () => {
  // Error boundary for router hooks
  try {
    const navigate = useNavigate();
    const location = useLocation();
    
    return <CheckoutPageContent navigate={navigate} location={location} />;
  } catch (error) {
    console.error('Router context error in CheckoutPage:', error);
    
    // Fallback component when router context is not available
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Carregando checkout...</h2>
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }
};

export default CheckoutPageWrapper;