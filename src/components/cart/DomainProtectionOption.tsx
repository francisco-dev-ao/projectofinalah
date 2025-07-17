import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

const DomainProtectionOption = () => {
  const { cartItems, addItem, removeItem } = useCart();
  
  // Check if domain protection is already in cart
  const hasDomainProtection = cartItems.some(item => item.type === 'domain_protection');
  
  // Check if there's at least one domain in cart
  const hasDomainInCart = cartItems.some(item => item.type === 'domain');
  
  if (!hasDomainInCart) return null;

  const protectionService = {
    id: 'domain-protection',
    name: 'Proteção Total do Domínio',
    type: 'domain_protection' as const,
    description: 'Proteja seu domínio contra roubo, transferências não autorizadas e mantenha seus dados privados.',
    price: 4800, // KZ 4.800,00
    period: 'ano',
    features: [
      'Proteção contra roubo de domínio',
      'Autenticação de dois fatores (2FA)',
      'Anonimato do proprietário no WHOIS',
      'Bloqueio de transferência automático',
      'Monitoramento 24/7',
      'Alertas de segurança em tempo real'
    ]
  };

  const handleToggleProtection = () => {
    if (hasDomainProtection) {
      const protectionItem = cartItems.find(item => item.type === 'domain_protection');
      if (protectionItem) {
        removeItem(protectionItem.id);
      }
    } else {
      addItem(protectionService, 1);
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
              <h3 className="font-semibold text-lg">{protectionService.name}</h3>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                Recomendado
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">{protectionService.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {protectionService.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(protectionService.price)}
                </span>
                <span className="text-gray-500">/{protectionService.period}</span>
              </div>
              
              <Button 
                onClick={handleToggleProtection}
                variant={hasDomainProtection ? "outline" : "default"}
                className={hasDomainProtection ? "border-blue-600 text-blue-600" : "bg-blue-600 hover:bg-blue-700"}
              >
                {hasDomainProtection ? (
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