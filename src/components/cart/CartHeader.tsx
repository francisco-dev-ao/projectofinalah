
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const CartHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold">Seu Carrinho</h1>
      <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Continuar comprando
      </Link>
    </div>
  );
};

export default CartHeader;
