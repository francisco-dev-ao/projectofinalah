
import React from "react";
import { Check } from "lucide-react";
import type { DomainCheckResult } from "@/contexts/CartContext";

interface DomainAddedNoticeProps {
  domain: DomainCheckResult | null;
}

const DomainAddedNotice: React.FC<DomainAddedNoticeProps> = ({ domain }) => {
  if (!domain) return null;
  
  return (
    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
      <Check size={18} className="text-green-500" />
      <span className="text-green-700 font-medium">
        Domínio <span className="font-bold">{domain.domain}</span> adicionado ao carrinho
      </span>
    </div>
  );
};

export default DomainAddedNotice;
