import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

const DomainProtectionOption = () => {
  const { cartItems, addItem, removeItem } = useCart();
  
  // Get all domains in cart
  const domainItems = cartItems.filter(item => item.type === 'domain');
  const protectionItems = cartItems.filter(item => item.type === 'domain_protection');
  
  if (domainItems.length === 0) return null;
  
  // Calculate total protection needed
  const totalProtectionNeeded = domainItems.reduce((total, domain) => {
    const duration = domain.duration || 12;
    const years = Math.ceil(duration / 12);
    return total + (4800 * years); // Base price per year
  }, 0);

  const handleToggleProtection = () => {
    if (protectionItems.length > 0) {
      // Remove all protection items
      protectionItems.forEach(item => removeItem(item.id));
    } else {
      // Add protection for each domain with matching period
      domainItems.forEach((domain, index) => {
        const duration = domain.duration || 12;
        const years = Math.ceil(duration / 12);
        const protectionPrice = 4800 * years;
        
        const protectionService = {
          id: `domain-protection-${domain.id}-${Date.now()}-${index}`,
          name: `Proteção do Domínio (${domain.name})`,
          type: 'domain_protection' as const,
          description: `Proteja ${domain.name} contra roubo por ${years} ano${years > 1 ? 's' : ''}`,
          price: protectionPrice,
          period: `${years} ano${years > 1 ? 's' : ''}`,
          domainId: domain.id,
          domainName: domain.name,
          features: [
            'Proteção contra roubo de domínio',
            'Autenticação de dois fatores (2FA)',
            'Anonimato do proprietário no WHOIS',
            'Bloqueio de transferência automático',
            'Monitoramento 24/7',
            'Alertas de segurança em tempo real'
          ]
        };
        
        addItem(protectionService, 1);
      });
    }
  };

  return (
    <Card className="border-2 border-blue-100 bg-blue-50/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">Proteção do Domínio</h3>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                Recomendado
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">
              Proteja {domainItems.length > 1 ? 'seus domínios' : 'seu domínio'} contra roubo, transferências não autorizadas e mantenha seus dados privados.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {[
                'Proteção contra roubo de domínio',
                'Autenticação de dois fatores (2FA)',
                'Anonimato do proprietário no WHOIS',
                'Bloqueio de transferência automático',
                'Monitoramento 24/7',
                'Alertas de segurança em tempo real'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Domínios no carrinho:</h4>
              <div className="space-y-2">
                {domainItems.map((domain) => {
                  const duration = domain.duration || 12;
                  const years = Math.ceil(duration / 12);
                  const protectionPrice = 4800 * years;
                  
                  return (
                    <div key={domain.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="font-medium">{domain.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({years} ano{years > 1 ? 's' : ''})</span>
                      </div>
                      <span className="text-sm font-medium">{formatPrice(protectionPrice)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(totalProtectionNeeded)}
                </span>
                <span className="text-gray-500">total</span>
              </div>
              
              <Button 
                onClick={handleToggleProtection}
                variant={protectionItems.length > 0 ? "outline" : "default"}
                className={protectionItems.length > 0 ? "border-blue-600 text-blue-600" : "bg-blue-600 hover:bg-blue-700"}
              >
                {protectionItems.length > 0 ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Adicionado
                  </>
                ) : (
                  'Adicionar Proteção'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DomainProtectionOption;