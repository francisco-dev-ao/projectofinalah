
import React from "react";

interface DomainRequirementWarningProps {
  show: boolean;
}

const DomainRequirementWarning: React.FC<DomainRequirementWarningProps> = ({ show }) => {
  if (!show) return null;
  
  return (
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
      <p className="text-amber-700 text-sm">
        Para continuar, registre ou selecione um domínio para ativar seu plano.
      </p>
    </div>
  );
};

export default DomainRequirementWarning;
