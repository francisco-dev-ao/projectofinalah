
import React from "react";
import { formatPrice } from "@/lib/utils";
import { domainExtensions } from "@/data/domainPricing";

interface ExtensionsDisplayProps {
  shouldShow: boolean;
}

const ExtensionsDisplay: React.FC<ExtensionsDisplayProps> = ({ shouldShow }) => {
  if (!shouldShow) return null;
  
  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">
        Selecione uma extensão de domínio:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {domainExtensions.map((domain) => (
          <div key={domain.name} className="flex justify-between items-center rounded-md border border-gray-200 p-3 hover:bg-gray-50">
            <span className="font-medium">{domain.name}</span>
            <span className="text-gray-600">{formatPrice(domain.price)}/ano</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExtensionsDisplay;
