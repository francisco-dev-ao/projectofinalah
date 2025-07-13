
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import CheckoutPaymentOptions from "./CheckoutPaymentOptions";
import CheckoutOrderSummary from "./CheckoutOrderSummary";
import { AppyPayReferenceModal } from "./AppyPayReferenceModal";
import { useCheckoutOrder } from "@/hooks/useCheckoutOrder";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { PaymentMethodType } from "./CheckoutPaymentOptions";
import { generatePaymentReference } from "@/services/appyPayReferenceService";
import { toast } from "sonner";
import { validateCartDomainRequirements } from "@/utils/cartValidation";

interface CheckoutPaymentStepProps {
  onPrevStep: () => void;
  onOrderSuccess: (orderId: string) => void;
}

const CheckoutPaymentStep = ({ onPrevStep, onOrderSuccess }: CheckoutPaymentStepProps) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("appypay_reference");
  const [isLoading, setIsLoading] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState<any>(null);
  
  const { cartItems, clearCart } = useCart();
  const { handlePlaceOrder } = useCheckoutOrder();
  const navigate = useNavigate();

  // Calculate total amount from cart
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinalizePurchase = async () => {
    console.log("🛒 Finalizando compra com método:", selectedPaymentMethod);
    console.log("🛒 Itens do carrinho:", cartItems);
    
    // Validate domain requirements for email/hosting services
    const validation = validateCartDomainRequirements(cartItems);
    if (!validation.isValid) {
      toast.error(validation.errorMessage);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Criar pedido primeiro
      const result = await handlePlaceOrder(selectedPaymentMethod);
      
      console.log("📦 Resultado do pedido:", result);
      
      if (result.success && result.orderId) {
        // Para pagamento por referência, usar a nova função que processa o carrinho
        if (selectedPaymentMethod === "appypay_reference") {
          // Importar e usar a função criarCobrancaComCarrinho
          const { criarCobrancaComCarrinho } = await import("@/services/appyPayReferenceService");
          
          console.log("💳 Criando cobrança com carrinho:", cartItems);
          
          try {
            const cobrancaResult = await criarCobrancaComCarrinho(cartItems, result.orderId);
            
            if (cobrancaResult.success) {
              console.log("✅ Cobrança criada:", cobrancaResult);
              console.log("🔍 Estrutura da resposta:", JSON.stringify(cobrancaResult, null, 2));
              
              // Formato compatível com o modal
              const paymentRef = {
                success: true,
                entity: "11333",
                reference: cobrancaResult.reference,
                amount: cobrancaResult.amount,
                description: cobrancaResult.description,
                validity_date: new Date(Date.now() + 2 * 86400000).toISOString(),
                validity_days: 2,
                order_id: result.orderId,
                instructions: {
                  pt: {
                    title: "Como pagar por referência",
                    steps: [
                      "Dirija-se a um ATM, Internet Banking ou Multicaixa Express",
                      "Selecione \"Pagamentos\" e depois \"Outros Serviços\"",
                      "Insira a Entidade: 11333",
                      `Insira a Referência: ${cobrancaResult.reference}`,
                      `Confirme o valor: ${cobrancaResult.amount} AOA`,
                      "Confirme o pagamento"
                    ],
                    note: `Esta referência é válida até ${new Date(Date.now() + 2 * 86400000).toLocaleDateString('pt-AO')}`
                  }
                },
                payment_channels: ["ATM", "Internet Banking", "Multicaixa Express", "Balcão Bancário"]
              };
              
              setPaymentReference(paymentRef);
              setShowReferenceModal(true);
              
              toast.success("Referência de pagamento gerada!");
            } else {
              console.error("❌ Falha ao gerar cobrança:", cobrancaResult.error);
              toast.error("Erro ao gerar referência de pagamento");
              clearCart();
              onOrderSuccess(result.orderId);
            }
          } catch (error) {
            console.error("❌ Erro ao gerar cobrança:", error);
            toast.error("Erro ao gerar referência de pagamento");
            clearCart();
            onOrderSuccess(result.orderId);
          }
        } else {
          // Outros métodos de pagamento (incluindo cash_payment)
          clearCart();
          onOrderSuccess(result.orderId);
        }
      } else {
        toast.error(result.error || "Erro ao processar pedido");
      }
    } catch (error: any) {
      console.error("❌ Erro no checkout:", error);
      toast.error(error.message || "Erro ao finalizar compra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReferenceModalClose = () => {
    setShowReferenceModal(false);
    setPaymentReference(null);
    clearCart();
    onOrderSuccess(paymentReference?.order_id || '');
  };

  return (
    <motion.div 
      className="max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Button 
        variant="ghost" 
        onClick={onPrevStep}
        className="flex items-center gap-2 mb-6"
        disabled={isLoading}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Options */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Método de Pagamento</h2>
          
          <CheckoutPaymentOptions
            paymentMethod={selectedPaymentMethod}
            onPaymentMethodChange={setSelectedPaymentMethod}
          />
          
          <div className="mt-6">
            <Button 
              onClick={handleFinalizePurchase}
              disabled={isLoading}
              className="w-full py-6 text-lg font-semibold transition-all duration-300 group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30 focus:ring-4 focus:ring-green-300 focus:outline-none transform active:scale-95 shadow-lg before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              size="lg"
            >
              <span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" size={20} />
                    Finalizar Compra
                    <div className="ml-2 group-hover:translate-x-1 transition-transform duration-300">
                      🚀
                    </div>
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Resumo do Pedido</h2>
          <CheckoutOrderSummary />
        </div>
      </div>

      {/* AppyPay Reference Modal */}
      {showReferenceModal && paymentReference && (
        <AppyPayReferenceModal
          isOpen={showReferenceModal}
          onClose={handleReferenceModalClose}
          paymentReference={paymentReference}
        />
      )}
    </motion.div>
  );
};

export default CheckoutPaymentStep;
