
import React from "react";
import OrderSummary from "@/components/cart/OrderSummary";
import SatisfactionGuarantee from "@/components/cart/SatisfactionGuarantee";
import TermsAndConditions from "@/components/cart/TermsAndConditions";
import { useCheckoutContactProfile } from "@/hooks/useCheckoutContactProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface CartSummarySectionProps {
  handleProceedToCheckout: () => void;
  isProcessing: boolean;
}

const CartSummarySection: React.FC<CartSummarySectionProps> = ({
  handleProceedToCheckout,
  isProcessing
}) => {
  const { isAuthenticated } = useAuth();
  const { isContactProfileRequired, isContactProfileValid } = useCheckoutContactProfile();

  const showContactProfileWarning = isAuthenticated && isContactProfileRequired && !isContactProfileValid();

  return (
    <div className="space-y-4">
      {/* Aviso sobre perfil de contacto para novos domínios */}
      {showContactProfileWarning && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            <strong>Perfil de contacto necessário!</strong>
            <br />
            Selecione um perfil de contacto para registrar novos domínios.
          </AlertDescription>
        </Alert>
      )}
      
      <OrderSummary 
        onProceedToCheckout={handleProceedToCheckout} 
        isProcessing={isProcessing}
      />
      
      <SatisfactionGuarantee />
      
      <TermsAndConditions />
    </div>
  );
};

export default CartSummarySection;
