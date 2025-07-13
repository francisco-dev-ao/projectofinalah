
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { createOrderService } from "@/services/orderCreationService";
import { generateInvoice } from "@/services/invoice";
import { generatePaymentReference } from "@/services/appyPayReferenceService";
import { triggerOrderEmail } from "@/utils/orderEmailTrigger";
import { toast } from "sonner";

export type PaymentMethodType = "appypay_reference" | "bank_transfer";

export const useOrderProcessing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState<any>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();

  const handlePlaceOrder = async (paymentMethod: PaymentMethodType) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return { success: false };
    }

    if (cartItems.length === 0) {
      toast.error("Carrinho vazio");
      return { success: false };
    }

    setIsLoading(true);

    try {
      console.log("Processing order with payment method:", paymentMethod);
      console.log("Cart items for order:", cartItems);

      // Create order
      const orderData = {
        userId: user.id,
        items: cartItems.map(item => ({
          name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
          duration: item.duration,
          duration_unit: item.durationUnit
        })),
        totalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        paymentMethod: paymentMethod,
        generateInvoice: true
      };

      console.log("Creating order with data:", orderData);
      const orderResult = await createOrderService.processOrder(orderData);

      if (!orderResult.success || !orderResult.orderId) {
        toast.error("Erro ao criar pedido");
        return { success: false };
      }

      const orderId = orderResult.orderId;
      setCurrentOrderId(orderId);

      console.log("Order created successfully with ID:", orderId);

      // Generate invoice
      try {
        console.log("Generating invoice for order:", orderId);
        const invoiceResult = await generateInvoice(orderId);
        if (invoiceResult?.success) {
          console.log("Invoice generated successfully:", invoiceResult.invoice);
          toast.success("Pedido e fatura criados com sucesso!");
        } else {
          console.warn("Invoice generation failed:", invoiceResult?.error);
        }
      } catch (invoiceError) {
        console.error("Error generating invoice:", invoiceError);
      }

      // Handle payment method
      if (paymentMethod === "appypay_reference") {
        // Generate payment reference
        const referenceRequest = {
          orderId: orderId,
          amount: orderData.totalAmount,
          description: `Pagamento do pedido ${orderId}`,
          validityDays: 3
        };

        console.log("Generating payment reference with:", referenceRequest);
        
        const referenceResult = await generatePaymentReference(referenceRequest);
        
        if (referenceResult.success) {
          console.log("Payment reference generated successfully:", referenceResult);
          
          // Enviar email automático com a referência de pagamento
          try {
            console.log("Sending automatic email with payment reference for order:", orderId);
            await triggerOrderEmail(orderId, user.email, user.user_metadata?.name, { 
              silent: false, 
              retry: true 
            });
            console.log("Email with payment reference sent successfully");
          } catch (emailError) {
            console.error("Error sending automatic email with payment reference:", emailError);
            // Não falha o processo se o email falhar
          }
          
          setPaymentReference(referenceResult);
          setShowReferenceModal(true);
          setIsLoading(false);

          return { success: true, orderId, showReferenceModal: true };
        } else {
          console.error("Failed to generate payment reference:", referenceResult);
          toast.error("Erro ao gerar referência de pagamento");
          setIsLoading(false);
          return { success: false };
        }
      } else if (paymentMethod === "bank_transfer") {
        // For bank transfer, just redirect to success page
        console.log("Bank transfer selected, redirecting to success page");
        clearCart();
        navigate(`/order-success/${orderId}?method=bank_transfer`);
        setIsLoading(false);
        return { success: true, orderId };
      }

      setIsLoading(false);
      return { success: false };
    } catch (error) {
      console.error("Error processing order:", error);
      toast.error("Erro ao processar pedido");
      setIsLoading(false);
      return { success: false };
    }
  };

  const handleReferenceModalClose = () => {
    console.log("Closing reference modal, navigating to success page");
    setShowReferenceModal(false);
    setPaymentReference(null);
    clearCart();
    if (currentOrderId) {
      navigate(`/order-success/${currentOrderId}?method=appypay_reference`);
    } else {
      navigate('/order-success/success?method=appypay_reference');
    }
  };

  return {
    handlePlaceOrder,
    isLoading,
    showReferenceModal,
    paymentReference,
    currentOrderId,
    handleReferenceModalClose
  };
};
