import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Check, Users } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

const emailPlans = [
  {
    id: "email-basic",
    name: "E-mail Premium",
    description: "Recursos essenciais para pequenas empresas",
    type: 'email' as const,
    price: 1400, // KZ 1.400,00/mês  
    period: 'mês',
    renewalPrice: 1600,
    features: [
      "Domínio Personalizado",
      "Anti-spam e Anti-vírus", 
      "Webmail responsivo",
      "5GB de espaço",
      "Suporte por email"
    ],
    maxUsers: 5
  },
  {
    id: "email-business", 
    name: "Avançado Pro",
    description: "Soluções completas para empresas em crescimento",
    type: 'email' as const,
    price: 3333, // KZ 3.333,00/mês
    period: 'mês',
    renewalPrice: 3500,
    recommended: true,
    features: [
      "50GB por usuário",
      "Regras de Encaminhamento", 
      "Aliases de e-mail",
      "Verificação Antivírus",
      "Anti-spam avançado",
      "Infraestrutura baseada na cloud",
      "Suporte por email e chat"
    ],
    maxUsers: 50
  },
  {
    id: "email-enterprise",
    name: "Business", 
    description: "Recursos avançados para grandes empresas",
    type: 'email' as const,
    price: 2500, // KZ 2.500,00/mês
    period: 'mês', 
    renewalPrice: 2700,
    features: [
      "30GB por usuário",
      "Preço por número de usuário",
      "IMAP/POP",
      "Reputação de IP limpo", 
      "Classificado pelo Google",
      "Suporte prioritário 24/7"
    ],
    maxUsers: 100
  }
];

const EmailServiceOption = () => {
  const { cartItems, addItem, removeItem } = useCart();
  const [selectedPlan, setSelectedPlan] = useState(emailPlans[1]); // Default to recommended plan
  const [selectedUsers, setSelectedUsers] = useState(1);
  
  // Check if email service is already in cart
  const hasEmailInCart = cartItems.some(item => item.type === 'email');
  
  // Check if there's at least one domain in cart
  const hasDomainInCart = cartItems.some(item => item.type === 'domain');
  
  if (!hasDomainInCart) return null;

  const calculatePrice = () => {
    return selectedPlan.price * selectedUsers;
  };

  const handleToggleEmail = () => {
    if (hasEmailInCart) {
      const emailItem = cartItems.find(item => item.type === 'email');
      if (emailItem) {
        removeItem(emailItem.id);
      }
    } else {
      const emailService = {
        ...selectedPlan,
        name: `${selectedPlan.name} (${selectedUsers} usuário${selectedUsers > 1 ? 's' : ''})`,
        price: calculatePrice(),
        quantity: 1,
        metadata: {
          users: selectedUsers,
          originalPrice: selectedPlan.price
        }
      };
      addItem(emailService, 1);
    }
  };

  return (
    <Card className="border-2 border-green-100 bg-green-50/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">E-mail Profissional</h3>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Popular
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">
              Tenha um endereço de e-mail profissional com o seu domínio para transmitir mais credibilidade.
            </p>
            
            {!hasEmailInCart && (
              <div className="space-y-4 mb-4">
                {/* Plan Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Escolha seu plano:</label>
                  <Select value={selectedPlan.id} onValueChange={(value) => {
                    const plan = emailPlans.find(p => p.id === value);
                    if (plan) setSelectedPlan(plan);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {emailPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center gap-2">
                            <span>{plan.name}</span>
                            {plan.recommended && (
                              <span className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-xs">
                                Recomendado
                              </span>
                            )}
                            <span className="text-gray-500">- {formatPrice(plan.price)}/{plan.period}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Número de usuários:</label>
                  <Select value={selectedUsers.toString()} onValueChange={(value) => setSelectedUsers(parseInt(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {Array.from({ length: Math.min(selectedPlan.maxUsers, 10) }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{num} usuário{num > 1 ? 's' : ''}</span>
                            <span className="text-gray-500">- {formatPrice(selectedPlan.price * num)}/{selectedPlan.period}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Plan Features */}
                <div className="bg-white p-3 rounded-lg border">
                  <h4 className="font-medium mb-2">{selectedPlan.name} - Recursos:</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {selectedPlan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                        <span className="text-xs">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {hasEmailInCart ? 
                    formatPrice(cartItems.find(item => item.type === 'email')?.price || 0) :
                    formatPrice(calculatePrice())
                  }
                </span>
                <span className="text-gray-500">/{selectedPlan.period}</span>
              </div>
              
              <Button 
                onClick={handleToggleEmail}
                variant={hasEmailInCart ? "outline" : "default"}
                className={hasEmailInCart ? "border-green-600 text-green-600" : "bg-green-600 hover:bg-green-700"}
              >
                {hasEmailInCart ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Adicionado
                  </>
                ) : (
                  'Adicionar E-mail'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailServiceOption;