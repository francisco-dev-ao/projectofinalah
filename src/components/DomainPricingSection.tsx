
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import DomainSearchForm from "./DomainSearchForm";
import { formatPrice } from "@/lib/utils";
import { domainExtensions } from "@/data/domainPricing";

const DomainPricingSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">Domínios Angolanos</h2>
        <p className="section-subtitle">
          Registe o seu domínio angolano com os melhores preços do mercado
        </p>
        
        <div className="max-w-3xl mx-auto mb-12">
          <DomainSearchForm />
        </div>
        
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Preços de Domínios</h3>
            <div className="space-y-3">
              {domainExtensions.map((domain) => (
                <div key={domain.name} className="domain-extension">
                  <div>
                    <span className="font-medium text-lg">{domain.name}</span>
                    <p className="text-sm text-gray-600">{domain.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-lg">
                      {formatPrice(domain.price)}
                    </div>
                    <span className="text-xs text-gray-500">por ano</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium mb-2">Todos os Domínios Incluem:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="feature-item">
                <span className="text-primary">✓</span>
                <span>Gestão DNS</span>
              </div>
              <div className="feature-item">
                <span className="text-primary">✓</span>
                <span>Proteção de Privacidade</span>
              </div>
              <div className="feature-item">
                <span className="text-primary">✓</span>
                <span>Redirecionamento de Email</span>
              </div>
              <div className="feature-item">
                <span className="text-primary">✓</span>
                <span>Renovação Automática</span>
              </div>
              <div className="feature-item">
                <span className="text-primary">✓</span>
                <span>Painel de Gestão</span>
              </div>
              <div className="feature-item">
                <span className="text-primary">✓</span>
                <span>Suporte Técnico</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DomainPricingSection;
