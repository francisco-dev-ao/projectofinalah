
import React from "react";
import { formatPrice } from "@/lib/utils";

interface CartSummaryDetailsProps {
  subtotal: number;
}

const CartSummaryDetails: React.FC<CartSummaryDetailsProps> = ({ 
  subtotal
}) => {
  return (
    <div className="border-t border-b py-4 mb-4">
      <div className="flex justify-between mb-2">
        <span>Subtotal:</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
    </div>
  );
};

export default CartSummaryDetails;
