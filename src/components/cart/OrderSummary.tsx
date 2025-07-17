
import React from "react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface OrderSummaryProps {
  onProceedToCheckout: () => void;
  isProcessing: boolean;
  showCheckoutButton?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  onProceedToCheckout, 
  isProcessing,
  showCheckoutButton = true
}) => {
  const { cartItems, subtotal, total } = useCart();
  const [coupon, setCoupon] = React.useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);

  const handleApplyCoupon = () => {
    if (!coupon.trim()) {
      toast.error("Por favor, insira um código de cupom");
      return;
    }

    setIsApplyingCoupon(true);
    
    // Simulate coupon application
    setTimeout(() => {
      toast.info("Cupom não encontrado ou expirado");
      setIsApplyingCoupon(false);
      setCoupon("");
    }, 1000);
  };

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
          <p className="text-gray-500">O seu carrinho está vazio.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4 shadow-lg border-2 border-primary/10 bg-white/90 rounded-xl">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-primary flex items-center gap-2">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#273d74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Resumo do Pedido
        </h2>
        
        {/* Items summary */}
        <div className="space-y-3 mb-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 shadow-sm">
              <span className="text-gray-700 font-medium truncate max-w-[70%]" title={item.name}>
                {item.name}{item.quantity > 1 ? ` x${item.quantity}` : ''}
              </span>
              <span className="text-primary font-semibold">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Coupon code */}
        <div className="mt-4 mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Código de cupom"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              disabled={isApplyingCoupon}
              className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
            />
            <Button 
              variant="outline" 
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon}
              className="border-primary text-primary hover:bg-primary/10 rounded-lg"
            >
              {isApplyingCoupon ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                "Aplicar"
              )}
            </Button>
          </div>
        </div>

        {/* Order summary - Only show subtotal and total */}
        <div className="border-t border-b py-4 space-y-2 bg-gray-50 rounded-lg">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between mt-6 mb-8">
          <span className="text-xl font-bold text-primary">Total:</span>
          <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
        </div>

        {showCheckoutButton && (
          <Button 
            onClick={onProceedToCheckout} 
            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/25 focus:ring-4 focus:ring-green-300 active:scale-95 group"
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <span className="group-hover:scale-110 transition-transform duration-300">✅</span>
                <span className="ml-2">Confirmar</span>
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
