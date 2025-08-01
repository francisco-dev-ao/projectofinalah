import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Check, Users, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

const emailPlans = [
  {
    id: "email-basic",
    name: "E-mail Premium",
    description: "Recursos essenciais para pequenas empresas",
    type: 'email' as const,
    monthlyPrice: 1000,
    annualPrice: 12000,
    period: 'ano',
    renewalPrice: 14500,
    features: [
      "Domínio Personalizado",
      "Anti-spam e Anti-vírus", 
      "Webmail responsivo",
      "5GB de espaço",
      "Suporte por email"
    ],
    maxUsers: 500
  },
  {
    id: "email-business", 
    name: "Avançado Pro",
    description: "Soluções completas para empresas em crescimento",
    type: 'email' as const,
    monthlyPrice: 3333,
    annualPrice: 40000,
    period: 'ano',
    renewalPrice: 42000,
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
    maxUsers: 500
  },
  {
    id: "email-enterprise",
    name: "Business", 
    description: "Recursos avançados para grandes empresas",
    type: 'email' as const,
    monthlyPrice: 2500,
    annualPrice: 30000,
    period: 'ano', 
    renewalPrice: 32000,
    features: [
      "30GB por usuário",
      "Preço por número de usuário",
      "IMAP/POP",
      "Reputação de IP limpo", 
      "Classificado pelo Google",
      "Suporte prioritário 24/7"
    ],
    maxUsers: 500
  }
];

const EmailServiceOption = () => {
  const { cartItems, addItem, removeItem, updateItemQuantity } = useCart();
  const [selectedPlan, setSelectedPlan] = useState(emailPlans[1]); // Default to recommended plan
  const [selectedUsers, setSelectedUsers] = useState(1);
  
  // Check if email service is already in cart
  const hasEmailInCart = cartItems.some(item => item.type === 'email');
  const existingEmailItem = cartItems.find(item => item.type === 'email');
  
  // Check if there's at least one domain in cart
  const hasDomainInCart = cartItems.some(item => item.type === 'domain');
  
  // Don't show if no domain in cart
  if (!hasDomainInCart) return null;
  
  // Set initial values based on existing email in cart
  React.useEffect(() => {
    if (hasEmailInCart && existingEmailItem) {
      const existingPlan = emailPlans.find(plan => plan.id === existingEmailItem.id);
      if (existingPlan) {
        setSelectedPlan(existingPlan);
      }
      setSelectedUsers(existingEmailItem.quantity || existingEmailItem.metadata?.users || 1);
    }
  }, [hasEmailInCart, existingEmailItem]);

  // Atualizar o carrinho automaticamente ao alterar a quantidade
  useEffect(() => {
    if (hasEmailInCart && existingEmailItem) {
      const updatedEmailService = {
        ...existingEmailItem,
        name: `${selectedPlan.name} (${selectedUsers} usuário${selectedUsers > 1 ? 's' : ''})`,
        quantity: selectedUsers,
        price: selectedPlan.annualPrice, // Price per user
        unitPrice: selectedPlan.annualPrice, // Price per user
        metadata: {
          users: selectedUsers,
          originalPrice: selectedPlan.annualPrice
        }
      };
      removeItem(existingEmailItem.id);
      addItem(updatedEmailService, selectedUsers);
    }
  }, [selectedUsers, selectedPlan, hasEmailInCart, existingEmailItem, addItem, removeItem]);

  const calculatePrice = () => {
    return selectedPlan.annualPrice * selectedUsers;
  };

  const updateEmailQuantity = () => {
    if (hasEmailInCart && existingEmailItem) {
      const updatedEmailService = {
        ...existingEmailItem,
        name: `${selectedPlan.name} (${selectedUsers} usuário${selectedUsers > 1 ? 's' : ''})`,
        quantity: selectedUsers,
        price: selectedPlan.annualPrice, // Price per user
        unitPrice: selectedPlan.annualPrice, // Price per user
        metadata: {
          users: selectedUsers,
          originalPrice: selectedPlan.annualPrice
        }
      };
      
      // Remove the old item and add the updated one
      removeItem(existingEmailItem.id);
      addItem(updatedEmailService, selectedUsers);
    }
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
        price: selectedPlan.annualPrice, // Price per user
        unitPrice: selectedPlan.annualPrice, // Price per user
        quantity: selectedUsers, // Set quantity to number of users
        metadata: {
          users: selectedUsers,
          originalPrice: selectedPlan.annualPrice
        }
      };
      addItem(emailService, selectedUsers);
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
                  <label className="block text-sm font-medium mb-2 animate-pulse bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ✨ Escolha seu plano:
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-bounce">
                      Clique aqui
                    </span>
                  </label>
                  <Select value={selectedPlan.id} onValueChange={(value) => {
                    const plan = emailPlans.find(p => p.id === value);
                    if (plan) setSelectedPlan(plan);
                  }}>
                    <SelectTrigger className="w-full border-2 border-blue-300 hover:border-blue-500 transition-all duration-300 animate-pulse hover:animate-none bg-gradient-to-r from-blue-50 to-purple-50">
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
                            <span className="text-gray-500">- {formatPrice(plan.annualPrice)}/{plan.period}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Selection - Interface padrão dos pacotes */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Plano selecionado:</label>
                    <div className="text-lg font-semibold text-gray-800">
                      {selectedPlan.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatPrice(selectedPlan.monthlyPrice)}/mês • {formatPrice(selectedPlan.annualPrice)}/ano por usuário
                    </div>
                  </div>

                  {/* Quantidade de usuários */}
                  <div className="border-t border-b py-4">
                    <label className="block text-sm font-medium mb-3">Quantidade de usuários:</label>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedUsers(Math.max(1, selectedUsers - 1))}
                        disabled={selectedUsers <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={selectedUsers}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          const clampedValue = Math.min(Math.max(1, value), 500);
                          setSelectedUsers(clampedValue);
                        }}
                        className="w-20 px-3 py-2 text-center font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedUsers(Math.min(500, selectedUsers + 1))}
                        disabled={selectedUsers >= 500}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>

                      {/* Botão Adicionar E-mail ao lado */}
                      <Button 
                        onClick={handleToggleEmail}
                        className="ml-4 bg-green-600 hover:bg-green-700 text-white"
                        disabled={hasEmailInCart}
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
                    
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-sm text-gray-500">
                        Mínimo: 1 • Máximo: 500
                      </p>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Preço anual:</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(calculatePrice())}
                        </p>
                        <p className="text-xs text-gray-500">
                          (~{formatPrice(Math.round(calculatePrice() / 12))}/mês)
                        </p>
                      </div>
                    </div>
                  </div>
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
            
            {hasEmailInCart ? (
              <div className="space-y-4">
                {/* Email already in cart - show modification interface */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <div className="font-medium text-green-800">E-mail adicionado ao carrinho</div>
                  </div>
  
                  {/* Current plan info */}
                  <div className="mb-4">
                    <div className="text-lg font-semibold text-gray-800">
                      {selectedPlan.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatPrice(selectedPlan.monthlyPrice)}/mês • {formatPrice(selectedPlan.annualPrice)}/ano por usuário
                    </div>
                  </div>

                  {/* Quantity controls for existing email */}
                  <div className="border-t border-b py-4">
                    <label className="block text-sm font-medium mb-3">Quantidade de usuários:</label>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedUsers(Math.max(1, selectedUsers - 1))}
                        disabled={selectedUsers <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={selectedUsers}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          const clampedValue = Math.min(Math.max(1, value), 500);
                          setSelectedUsers(clampedValue);
                        }}
                        className="w-20 px-3 py-2 text-center font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedUsers(Math.min(500, selectedUsers + 1))}
                        disabled={selectedUsers >= 500}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>

                      {/* Remove button */}
                      <Button 
                        onClick={handleToggleEmail}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Remover
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-sm text-gray-500">
                        {selectedUsers} usuário{selectedUsers > 1 ? 's' : ''} • Máximo: 500
                      </p>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Preço anual:</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(calculatePrice())}
                        </p>
                        <p className="text-xs text-gray-500">
                          (~{formatPrice(Math.round(calculatePrice() / 12))}/mês)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Configure a quantidade de usuários e clique em "Adicionar E-mail"
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailServiceOption;