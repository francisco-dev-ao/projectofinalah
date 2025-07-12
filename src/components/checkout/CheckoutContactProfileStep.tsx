
import React from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ContactProfileSelection from "./ContactProfileSelection";

interface CheckoutContactProfileStepProps {
  onProfileSelected: (profileId: string) => void;
  onContinue: () => void;
  onPrevStep: () => void;
  selectedProfileId?: string;
}

const CheckoutContactProfileStep = ({ 
  onProfileSelected, 
  onContinue, 
  onPrevStep, 
  selectedProfileId 
}: CheckoutContactProfileStepProps) => {
  return (
    <motion.div 
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={onPrevStep}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Perfil de Contactos para Domínio
        </h2>
        <p className="text-muted-foreground">
          Para registrar domínios, é necessário um perfil de contactos válido.
        </p>
      </div>

      <ContactProfileSelection
        onProfileSelected={onProfileSelected}
        onContinue={onContinue}
        selectedProfileId={selectedProfileId}
      />
    </motion.div>
  );
};

export default CheckoutContactProfileStep;
