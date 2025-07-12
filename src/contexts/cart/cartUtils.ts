
import { CartItem, DomainCheckResult } from "./types";

/**
 * Calculate total items count
 */
export const calculateItemCount = (cartItems: CartItem[]): number => {
  if (!Array.isArray(cartItems)) {
    console.error('calculateItemCount: cartItems is not an array', cartItems);
    return 0;
  }
  return cartItems.reduce((count, item) => count + item.quantity, 0);
};

/**
 * Calculate subtotal
 */
export const calculateSubtotal = (cartItems: CartItem[]): number => {
  if (!Array.isArray(cartItems)) {
    console.error('calculateSubtotal: cartItems is not an array', cartItems);
    return 0;
  }
  return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

/**
 * Calculate final total - sem RF
 */
export const calculateTotal = (subtotal: number, discount: number): number => {
  return Math.max(0, subtotal - discount);
};

/**
 * Check if cart has an item of a specific type
 */
export const hasItemType = (cartItems: CartItem[], type: string): boolean => {
  if (!Array.isArray(cartItems)) {
    console.error('hasItemType: cartItems is not an array', cartItems);
    return false;
  }
  return cartItems.some(item => item.type === type);
};

/**
 * Find cart item by ID
 */
export const findItemById = (cartItems: CartItem[], id: string): CartItem | undefined => {
  if (!Array.isArray(cartItems)) {
    console.error('findItemById: cartItems is not an array', cartItems);
    return undefined;
  }
  return cartItems.find(item => item.id === id);
};

/**
 * Prepare domain item for adding to cart
 */
export const prepareDomainCartItem = (domain: DomainCheckResult): CartItem => {
  return {
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
    renewalPrice: domain.price ? domain.price * 1.05 : 0,
  };
};

/**
 * Prepare existing domain for adding to cart
 */
export const prepareExistingDomainCartItem = (domainName: string): CartItem => {
  return {
    id: `existing-domain-${Date.now()}`,
    name: domainName,
    price: 0,
    quantity: 1,
    type: 'domain',
    period: 'N/A',
    description: 'Domínio existente',
    isExistingDomain: true,
  };
};

/**
 * Load cart from localStorage
 */
export const loadCartFromStorage = (): CartItem[] => {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      const parsedCart = JSON.parse(savedCart);
      // Verifica se o resultado é um array
      if (!Array.isArray(parsedCart)) {
        console.error('Cart in localStorage is not an array', parsedCart);
        return [];
      }
      return parsedCart;
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      return [];
    }
  }
  return [];
};

/**
 * Save cart to localStorage
 */
export const saveCartToStorage = (cartItems: CartItem[]): void => {
  // Verifica se cartItems é um array antes de salvar
  if (!Array.isArray(cartItems)) {
    console.error('saveCartToStorage: cartItems is not an array', cartItems);
    localStorage.setItem('cart', JSON.stringify([])); // Salva um array vazio em caso de erro
    return;
  }
  localStorage.setItem('cart', JSON.stringify(cartItems));
};
