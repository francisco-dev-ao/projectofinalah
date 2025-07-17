import React from "react";
import { Percent } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DiscountInfo = () => {
  const { cartItems, discount } = useCart();
  
  // Calculate total users in email services
  const totalUsers = cartItems.reduce((count, item) => {
    if (item.type === 'email' && item.metadata?.users) {
      return count + (item.metadata.users * item.quantity);
    }
    return count;
  }, 0);
  
  if (totalUsers <= 10) return null;
  
  return (
    <Alert className="border-green-200 bg-green-50">
      <Percent className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-700">
        <strong>Desconto aplicado!</strong> Você tem {totalUsers} usuários de email e ganhou 2% de desconto: {formatPrice(discount)}
      </AlertDescription>
    </Alert>
  );
};

export default DiscountInfo;