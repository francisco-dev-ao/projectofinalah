
// Adaptador para o SafeCartProvider
import { useSimpleCart } from './SafeCartProvider';
import { CartItem, DomainCheckResult, CartContextType } from './cart/types';
import { calculateBulkDiscount } from './cart/cartUtils';
import React from 'react';

// Hook adaptador que fornece a mesma interface do antigo useCart
export const useCart = (): CartContextType => {
  const simpleCart = useSimpleCart();
  
  // Adaptamos o SimpleCart para fornecer a interface completa do CartContextType
  const adaptedCart: CartContextType = {
    // Valores básicos do carrinho
    cartItems: simpleCart.cartItems,
    addToCart: simpleCart.addItem,
    removeFromCart: simpleCart.removeItem,
    updateQuantity: simpleCart.updateItemQuantity,
    clearCart: simpleCart.clearCart,
    itemCount: simpleCart.itemCount,
    subtotal: simpleCart.subtotal,
    total: simpleCart.total,
    
    // Valores calculados ou funções adicionais
    hasItemType: (type: string) => simpleCart.cartItems.some(item => item.type === type),
    findItemById: (id: string) => simpleCart.cartItems.find(item => item.id === id),
    isInCart: (id: string) => simpleCart.cartItems.some(item => item.id === id),
    
    // Estados adicionais com valores padrão
    discount: calculateBulkDiscount(simpleCart.cartItems),
    setDiscount: () => {}, // Função vazia para compatibilidade
    couponCode: '',
    setCouponCode: () => {}, // Função vazia para compatibilidade
    hasDomainInCart: simpleCart.cartItems.some(item => item.type === 'domain'),
    
    // Verificador de carrinho
    validateAndFixCart: () => true,
    
    // Aliases para compatibilidade
    addItem: simpleCart.addItem,
    removeItem: simpleCart.removeItem,
    updateItemQuantity: simpleCart.updateItemQuantity,
    isItemInCart: (id: string) => simpleCart.cartItems.some(item => item.id === id),
      // Funções específicas para domínios com implementação básica
    addDomainToCart: (domain: DomainCheckResult) => {
      try {
        // Implementação melhorada
        const newItem: CartItem = {
          id: `domain-${domain.domain}-${Date.now()}`,
          name: domain.domain,
          price: domain.price || 0,
          unitPrice: domain.price || 0,
          quantity: 1,
          type: 'domain',
          period: '1 ano',
          description: 'Registro de domínio',
          duration: 12,
          durationUnit: 'month',
        };
        console.log('Adicionando domínio ao carrinho via useCart:', newItem);
        simpleCart.addItem(newItem);
        return true;
      } catch (error) {
        console.error('Erro ao adicionar domínio ao carrinho:', error);
        return false;
      }
    },
    
    addExistingDomainToCart: (domainName: string) => {
      try {
        // Implementação melhorada
        const newItem: CartItem = {
          id: `existing-domain-${Date.now()}`,
          name: domainName,
          price: 0,
          quantity: 1,
          type: 'domain',
          period: 'N/A',
          description: 'Domínio existente',
          isExistingDomain: true,
        };
        console.log('Adicionando domínio existente ao carrinho via useCart:', newItem);
        simpleCart.addItem(newItem);
        return true;
      } catch (error) {
        console.error('Erro ao adicionar domínio existente ao carrinho:', error);
        return false;
      }
    },
    
    // Agora implementamos a função updateDomainPeriod corretamente
    updateDomainPeriod: (domainId: string, years: number, price: number) => {
      console.log('Calling updateDomainPeriod from useCart:', { domainId, years, price });
      simpleCart.updateDomainPeriod(domainId, years, price);
    }
  };
  
  return adaptedCart;
};

// Exportar um CartContext vazio para compatibilidade
export const CartContext = React.createContext<CartContextType | undefined>(undefined);

// Componente vazio para compatibilidade
export const CartProvider = ({ children }: { children: React.ReactNode }) => children;

// Exportar tipos para compatibilidade
export type { CartItem, DomainCheckResult, CartContextType };
