
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const EmptyCart: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
      <p className="text-xl mb-4">Seu carrinho está vazio</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/email">
          <Button variant="outline" className="w-full">Ver Planos de Email</Button>
        </Link>
        <Link to="/dominios">
          <Button className="w-full">Pesquisar Domínios</Button>
        </Link>
      </div>
    </div>
  );
};

export default EmptyCart;
