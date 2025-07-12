
import React, { ReactNode } from "react";

interface CartCategorySectionProps {
  title: string;
  children: ReactNode;
}

const CartCategorySection: React.FC<CartCategorySectionProps> = ({ title, children }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      {children}
    </div>
  );
};

export default CartCategorySection;
