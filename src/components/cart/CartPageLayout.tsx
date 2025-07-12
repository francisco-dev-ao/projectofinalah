
import React, { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutProgress from "@/components/cart/CheckoutProgress";

interface CartPageLayoutProps {
  children: ReactNode;
  currentStep?: number;
  steps?: Array<{
    id: number;
    name: string;
  }>;
}

const CartPageLayout: React.FC<CartPageLayoutProps> = ({ 
  children,
  currentStep = 1,
  steps = [{ id: 1, name: "Carrinho" }]
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-grow">
        <CheckoutProgress currentStep={currentStep} steps={steps} />
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default CartPageLayout;
