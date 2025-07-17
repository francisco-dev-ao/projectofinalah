
import { Button } from "@/components/ui/button";
import { PaymentMethodType } from "./CheckoutPaymentOptions";
import { Loader2, CheckCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutPlaceOrderButtonProps {
  selectedPaymentMethod: PaymentMethodType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onPlaceOrder: () => void;
}

export function CheckoutPlaceOrderButton({ 
  selectedPaymentMethod,
  isAuthenticated,
  isLoading,
  onPlaceOrder
}: CheckoutPlaceOrderButtonProps) {
  
  return (
    <div className="space-y-4">
      <Button
        className={cn(
          "w-full py-6 text-lg font-semibold transition-all duration-300 group relative overflow-hidden",
          "bg-gradient-to-r from-indigo-600 to-purple-600",
          "hover:from-indigo-700 hover:to-purple-700",
          "hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30",
          "focus:ring-4 focus:ring-purple-300 focus:outline-none",
          "transform active:scale-95",
          "shadow-lg",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
        )}
        onClick={onPlaceOrder}
        disabled={isLoading || !selectedPaymentMethod || !isAuthenticated}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processando pagamento...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" size={20} />
            <span className="relative z-10">Gerar Referencia de Pagamento</span>
          </>
        )}
      </Button>
      
      <div className="flex items-center justify-center text-sm text-gray-500 gap-2 hover:text-green-600 transition-colors duration-300 group">
        <ShieldCheck size={16} className="text-green-600 group-hover:scale-110 transition-transform duration-300" />
        <span>Pagamento seguro e protegido</span>
      </div>
    </div>
  );
}

export default CheckoutPlaceOrderButton;
