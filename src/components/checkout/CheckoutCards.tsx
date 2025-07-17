import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Building2, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface CheckoutCardsProps {
  userEmail: string;
  onPaymentMethodChange: (method: string) => void;
  onFinishPurchase: () => void;
  isProcessing?: boolean;
}

const CheckoutCards = ({ 
  userEmail, 
  onPaymentMethodChange, 
  onFinishPurchase,
  isProcessing = false
}: CheckoutCardsProps) => {
  const { cartItems, total } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<string>("multicaixa");

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
    onPaymentMethodChange(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card Método de Pagamento */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-violet-50 border-b">
          <CardTitle className="text-xl font-semibold">Método de Pagamento</CardTitle>
          <p className="text-gray-500 text-sm mt-1">Selecione um método de pagamento para continuar.</p>
        </CardHeader>
        <CardContent className="pt-6">
          <RadioGroup 
            value={paymentMethod} 
            onValueChange={handlePaymentMethodChange}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2 border rounded-md p-4 relative">
              <div className="absolute right-4 top-4">
                <RadioGroupItem value="multicaixa" id="multicaixa" />
              </div>
              <Label 
                htmlFor="multicaixa" 
                className="flex flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-violet-100 p-2 rounded-md">
                    <Smartphone className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium">Multicaixa Express</p>
                    <p className="text-sm text-gray-500">Pagamento via app Multicaixa Express</p>
                  </div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 border rounded-md p-4 relative">
              <div className="absolute right-4 top-4">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
              </div>
              <Label 
                htmlFor="bank_transfer"
                className="flex flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-violet-100 p-2 rounded-md">
                    <Building2 className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium">Transferência Bancária</p>
                    <p className="text-sm text-gray-500">Transferência bancária para nossa conta</p>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          <div className="mt-6 bg-gray-50 p-3 rounded-md flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">Comprando como: {userEmail}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Card Resumo do Pedido */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-violet-50 border-b">
          <CardTitle className="text-xl font-semibold">Resumo do Pedido</CardTitle>
          <p className="text-gray-500 text-sm mt-1">Revise os itens e o valor total</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.quantity} unidade{item.quantity > 1 ? 's' : ''}</p>
                </div>
                <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
            
            <div className="pt-4 mt-2 border-t flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="text-lg font-semibold text-violet-700">{formatPrice(total)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button 
            className="w-full flex items-center justify-center gap-2 py-6 text-lg font-semibold transition-all duration-300 group relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/30 focus:ring-4 focus:ring-violet-300 focus:outline-none transform active:scale-95 shadow-lg before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300" 
            onClick={onFinishPurchase}
            disabled={isProcessing}
          >
            <span className="relative z-10 flex items-center">
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                  Gerar Referencia de Pagamento
                </>
              )}
            </span>
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors duration-300 group">
            <ShieldCheck className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform duration-300" />
            <span>Pagamento seguro e protegido</span>
          </div>
          
          <p className="text-xs text-center text-gray-500">
            Ao finalizar a compra, você concorda com nossos termos de serviço
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CheckoutCards; 