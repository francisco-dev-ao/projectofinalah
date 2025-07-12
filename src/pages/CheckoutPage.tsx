
import { useState, useEffect, useCallback } from "react";
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

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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
  }, [cartItems.length, hasStartedCheckout, navigate]); // Adicionar navigate

  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    setCurrentStep(1); // Ir direto para pagamento
  }, []);

  // Handle going back to previous step
  const handlePreviousStep = useCallback(() => {
    setCurrentStep(0); // Voltar para autenticação
  }, []);

  // Handle successful order completion
  const handleOrderSuccess = useCallback((orderId: string) => {
    sessionStorage.removeItem('checkoutCartItems');
    sessionStorage.removeItem('pendingCheckout');
    clearCart();
    navigate(`/order-success/${orderId}`);
  }, [clearCart, navigate]);

  // Animation variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <motion.main 
        className="flex-grow pt-6 pb-16"
        initial="initial"
        animate="animate"
        variants={pageVariants}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Finalizar Compra
            </h1>
            <p className="text-center text-gray-500 mb-8">Complete os passos abaixo para finalizar sua compra</p>
            
            {/* Checkout Steps */}
            <div className="mb-10">
              <CheckoutSteps currentStep={currentStep} />
            </div>
            
            <div className="mt-8">
              {currentStep === 0 ? (
                // Step 1: Authentication
                <CheckoutAuthStep onAuthSuccess={handleAuthSuccess} />
              ) : (
                // Step 2: Payment Selection
                <CheckoutPaymentStep 
                  onPrevStep={handlePreviousStep} 
                  onOrderSuccess={handleOrderSuccess}
                />
              )}
            </div>
          </div>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
