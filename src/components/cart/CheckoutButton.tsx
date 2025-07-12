
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, ArrowRight } from "lucide-react";

interface CheckoutButtonProps {
  isLoading: boolean;
  isAuthenticated: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  isLoading,
  isAuthenticated,
  isDisabled,
  onClick
}) => {
  return (
    <Button 
      className="w-full flex items-center justify-center gap-2 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 focus:ring-4 focus:ring-blue-300 active:scale-95 group"
      onClick={onClick}
      disabled={isLoading || isDisabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          {isAuthenticated ? (
            <>
              <Check size={20} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
              Concluir pagamento
            </>
          ) : (
            <>
              Continuar para identificação
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </>
          )}
        </>
      )}
    </Button>
  );
};

export default CheckoutButton;
