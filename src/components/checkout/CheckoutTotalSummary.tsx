
import { FC } from "react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

export interface CheckoutTotalSummaryProps {
  total?: number;
}

const CheckoutTotalSummary: FC<CheckoutTotalSummaryProps> = ({ total: propTotal }) => {
  const { total: cartTotal } = useCart();
  
  // Use provided total from props or fall back to cart context total
  const displayTotal = propTotal !== undefined ? propTotal : cartTotal;

  return (
    <div className="space-y-3">
      <div className="flex justify-between font-medium text-lg pt-2 border-t">
        <span>Total:</span>
        <span className="text-indigo-700">{formatPrice(displayTotal)}</span>
      </div>
    </div>
  );
};

export default CheckoutTotalSummary;
