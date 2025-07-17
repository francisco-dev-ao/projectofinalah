import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, HeadphonesIcon } from "lucide-react";

interface SatisfactionGuaranteeProps {
  compact?: boolean;
  highlight?: boolean;
}

const SatisfactionGuarantee: React.FC<SatisfactionGuaranteeProps> = ({ compact, highlight }) => {
  if (compact) {
    return (
      <div className={`flex flex-col items-end text-xs ${highlight ? 'bg-red-50/50 text-red-800 border-red-500' : 'bg-blue-50/50 text-blue-800 border-blue-100'} rounded p-2 border max-w-xs`}>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className={`h-4 w-4 ${highlight ? 'text-red-600' : 'text-blue-600'}`} />
          <span className={`font-semibold text-sm ${highlight ? 'text-red-900' : 'text-blue-900'}`}>Satisfação Garantida</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-3 w-3" />
          <span>30 dias para reembolso</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <HeadphonesIcon className="h-3 w-3" />
          <span>Suporte 24/7</span>
        </div>
        <span className={`text-[10px] mt-1 ${highlight ? 'text-red-700' : 'text-blue-700'}`}>Reembolso total se não ficar satisfeito.</span>
      </div>
    );
  }
  return (
    <Card className={`${highlight ? 'border-red-500 bg-red-50/50' : 'border-blue-200 bg-blue-50/50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className={`h-6 w-6 ${highlight ? 'text-red-600' : 'text-blue-600'}`} />
          <h3 className={`font-semibold ${highlight ? 'text-red-900' : 'text-blue-900'}`}>Satisfação Garantida</h3>
        </div>
        
        <div className={`space-y-2 text-sm ${highlight ? 'text-red-800' : 'text-blue-800'}`}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Garantia de 30 dias para reembolso</span>
          </div>
          <div className="flex items-center gap-2">
            <HeadphonesIcon className="h-4 w-4" />
            <span>Suporte 24/7 para resolver qualquer problema</span>
          </div>
        </div>
        
        <p className={`text-xs mt-3 ${highlight ? 'text-red-700' : 'text-blue-700'}`}>
          Se não ficar completamente satisfeito, oferecemos reembolso completo em até 30 dias.
        </p>
      </CardContent>
    </Card>
  );
};

export default SatisfactionGuarantee;