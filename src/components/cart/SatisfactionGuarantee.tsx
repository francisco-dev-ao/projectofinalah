import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, HeadphonesIcon } from "lucide-react";

const SatisfactionGuarantee = () => {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="h-6 w-6 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Satisfação Garantida</h3>
        </div>
        
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Garantia de 30 dias para reembolso</span>
          </div>
          <div className="flex items-center gap-2">
            <HeadphonesIcon className="h-4 w-4" />
            <span>Suporte 24/7 para resolver qualquer problema</span>
          </div>
        </div>
        
        <p className="text-xs text-blue-700 mt-3">
          Se não ficar completamente satisfeito, oferecemos reembolso completo em até 30 dias.
        </p>
      </CardContent>
    </Card>
  );
};

export default SatisfactionGuarantee;