
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CouponInput: React.FC = () => {
  const [couponCode, setCouponCode] = useState("");

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Por favor, insira um código de cupom");
      return;
    }

    toast.info("Cupom não encontrado ou expirado.");
    setCouponCode("");
  };

  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-2">
        <Input 
          placeholder="Código de cupom" 
          value={couponCode} 
          onChange={(e) => setCouponCode(e.target.value)} 
        />
        <Button 
          variant="outline" 
          onClick={handleApplyCoupon}
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
};

export default CouponInput;
