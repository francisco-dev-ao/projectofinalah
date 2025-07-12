
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import CartPageLayout from "./CartPageLayout";

const EmptyCartPage = () => {
  return (
    <CartPageLayout currentStep={1} steps={[{ id: 1, name: "Carrinho" }]}>
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h1>
          <p className="text-gray-500 mb-8">
            Parece que você ainda não adicionou nenhum produto ao seu carrinho.
            Explore nossos serviços e encontre a solução perfeita para sua necessidade.
          </p>
          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link to="/hospedagem">Planos de Hospedagem</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/dominios">Domínios</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/email">Email Profissional</Link>
            </Button>
          </div>
        </div>
      </div>
    </CartPageLayout>
  );
};

export default EmptyCartPage;
