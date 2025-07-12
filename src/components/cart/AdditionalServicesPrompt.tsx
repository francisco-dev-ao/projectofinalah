import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, ServerIcon } from "lucide-react";

interface AdditionalServicesPromptProps {
  onlyDomainInCart: boolean;
}

const AdditionalServicesPrompt = ({ onlyDomainInCart }: AdditionalServicesPromptProps) => {
  const navigate = useNavigate();
  const [emailSelected, setEmailSelected] = useState(false);
  const [hostingSelected, setHostingSelected] = useState(false);

  if (!onlyDomainInCart) {
    return null;
  }

  const handleViewServices = () => {
    if (emailSelected && hostingSelected) {
      toast.info("Por favor, escolha apenas um serviço para visualizar.");
      return;
    }

    if (emailSelected) {
      navigate("/email");
      return;
    }

    if (hostingSelected) {
      navigate("/hospedagem");
      return;
    }

    // If nothing is selected, continue with checkout
    toast.info("Continuando apenas com o domínio.");
  };

  return (
    <div className="bg-blue-50 rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-blue-800">Sugestão de serviços</h2>
      <p className="text-blue-700 mb-4">
        Você está adquirindo apenas um domínio. Deseja adicionar também:
      </p>

      <div className="space-y-4 mb-6">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="email-plans" 
            checked={emailSelected}
            onCheckedChange={(checked) => setEmailSelected(checked === true)}
          />
          <div>
            <Label 
              htmlFor="email-plans" 
              className="font-medium text-blue-800 flex items-center gap-2"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-blue-600"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Planos de E-mail Corporativo
            </Label>
            <p className="text-sm text-blue-600 ml-6">
              Adicione e-mails profissionais com seu domínio
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="hosting-plans" 
            checked={hostingSelected}
            onCheckedChange={(checked) => setHostingSelected(checked === true)}
          />
          <div>
            <Label 
              htmlFor="hosting-plans" 
              className="font-medium text-blue-800 flex items-center gap-2"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-blue-600"
              >
                <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
                <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
                <line x1="6" x2="6" y1="6" y2="6" />
                <line x1="6" x2="6" y1="18" y2="18" />
              </svg>
              Hospedagem de Sites
            </Label>
            <p className="text-sm text-blue-600 ml-6">
              Coloque seu website online com nossos planos de hospedagem
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          className="mr-2"
          onClick={() => {
            setEmailSelected(false);
            setHostingSelected(false);
          }}
        >
          Continuar apenas com domínio
        </Button>
        <Button 
          onClick={handleViewServices}
        >
          {emailSelected || hostingSelected ? "Ver planos selecionados" : "Continuar"}
        </Button>
      </div>
      <p className="text-xs text-blue-500 mt-4 italic">
        Estes serviços são opcionais. Você pode prosseguir apenas com a compra do domínio.
      </p>
    </div>
  );
};

export default AdditionalServicesPrompt;
