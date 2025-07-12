
import React from "react";

type ClientInfoSectionProps = {
  profiles: any;
};

const ClientInfoSection = ({ profiles }: ClientInfoSectionProps) => {
  if (!profiles) return null;
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Informações do Cliente</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-sm">
            <span className="font-medium">Nome:</span> {profiles.name || "N/A"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Email:</span> {profiles.email || "N/A"}
          </p>
          <p className="text-sm">
            <span className="font-medium">NIF:</span> {profiles.nif || "N/A"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="font-medium">Telefone:</span> {profiles.phone || "N/A"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Empresa:</span> {profiles.company_name || "N/A"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Endereço:</span> {profiles.address || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientInfoSection;
