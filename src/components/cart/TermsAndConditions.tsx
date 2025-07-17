import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ExternalLink } from "lucide-react";

const TermsAndConditions = () => {
  return (
    <Card className="border-gray-200 bg-gray-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="h-5 w-5 text-gray-600" />
          <h4 className="font-medium text-gray-900">Termos e Condições</h4>
        </div>
        
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-3 w-3" />
            <a 
              href="/termos-dominios-ao" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Termos para Registo de Domínio .AO
            </a>
          </div>
          <div className="flex items-center gap-2">
            <ExternalLink className="h-3 w-3" />
            <a 
              href="/termos-uso" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Termos e Política de Uso da AngoHost
            </a>
          </div>
        </div>
        
        <p className="text-xs text-gray-600 mt-3">
          Ao prosseguir com o pagamento, você concorda com os termos e condições acima.
        </p>
      </CardContent>
    </Card>
  );
};

export default TermsAndConditions;