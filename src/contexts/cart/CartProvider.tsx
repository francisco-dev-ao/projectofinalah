import React, { createContext, useState, useEffect } from 'react';
import { CartContextType, CartItem, DomainCheckResult } from './types';
import { 
  calculateItemCount, 
  calculateSubtotal, 
  calculateTotal, 
  hasItemType, 
  findItemById,
  prepareDomainCartItem,
  prepareExistingDomainCartItem,
  loadCartFromStorage,
  saveCartToStorage
} from './cartUtils';

// Create the context with undefined as initial value
export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize cartItems from localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const items = loadCartFromStorage();
      return Array.isArray(items) ? items : [];
    } catch (error) {
      console.error('Failed to load cart from storage', error);
      return [];
    }
  });
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [hasDomainInCart, setHasDomainInCart] = useState(false);
  const [loading, setLoading] = useState(false);

  // Update hasDomainInCart and save cart to localStorage whenever cartItems changes
  useEffect(() => {
    saveCartToStorage(cartItems);
    const hasDomain = Array.isArray(cartItems) && cartItems.some(item => item.type === 'domain');
    setHasDomainInCart(hasDomain);
  }, [cartItems]);
  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setCartItems(prevItems => {
      // Garante que prevItems é um array válido
      const safeItems = Array.isArray(prevItems) ? prevItems : [];
      
      const existingItem = safeItems.find(i => i.id === item.id);
      
      if (existingItem) {
        // Update existing item quantity
        return safeItems.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + quantity } 
            : i
        );
      } else {
        // Add new item with complete properties and specified quantity
        return [...safeItems, { ...item, quantity }];
      }
    });
  };

  // Alias for addToCart for compatibility
  const addItem = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    addToCart(item, quantity);
  };
  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => {
      // Garante que prevItems é um array válido
      if (!Array.isArray(prevItems)) return [];
      return prevItems.filter(item => item.id !== itemId);
    });
  };

  // Alias for removeFromCart for compatibility
  const removeItem = (itemId: string) => {
    removeFromCart(itemId);
  };
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prevItems => {
      // Garante que prevItems é um array válido
      if (!Array.isArray(prevItems)) return [];
      
      return prevItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity } 
          : item
      );
    });
  };

  // Alias for updateQuantity for compatibility
  const updateItemQuantity = (itemId: string, quantity: number) => {
    updateQuantity(itemId, quantity);
  };
  const clearCart = () => {
    console.log("Clearing cart");
    // Clear cart items and reset state
    try {
      setCartItems([]);
      setDiscount(0);
      setCouponCode('');
      // Remove from localStorage too
      localStorage.removeItem('cart');
      console.log("Cart cleared successfully");
    } catch (error) {
      console.error("Error while clearing cart:", error);
      // Tentativa adicional de limpar o localStorage
      try {
        localStorage.removeItem('cart');
      } catch (e) {
        console.error("Failed to clear localStorage:", e);
      }
    }
  };
  
  // Método adicional para verificar e corrigir o estado do carrinho
  const validateAndFixCart = () => {
    if (!Array.isArray(cartItems)) {
      console.error("Cart is invalid, resetting it:", cartItems);
      setCartItems([]);
      localStorage.removeItem('cart');
      return false;
    }
    return true;
  };
  // Add domain to cart from search results
  const addDomainToCart = (domain: DomainCheckResult): boolean => {
    // Check if domain is already in cart
    if (!Array.isArray(cartItems)) {
      console.error('cartItems is not an array in addDomainToCart');
      setCartItems([]);
      const newItem = prepareDomainCartItem(domain);
      setCartItems([newItem]);
      return true;
    }
    
    const existingDomain = cartItems.find(item => 
      item.type === 'domain' && item.name === domain.domain
    );

    if (existingDomain) {
      return false; // Domain already exists in cart
    }

    const newItem = prepareDomainCartItem(domain);
    setCartItems(prev => Array.isArray(prev) ? [...prev, newItem] : [newItem]);
    return true;
  };
  // Add existing domain to cart
  const addExistingDomainToCart = (domainName: string): boolean => {
    // Check if domain is already in cart
    if (!Array.isArray(cartItems)) {
      console.error('cartItems is not an array in addExistingDomainToCart');
      const newItem = prepareExistingDomainCartItem(domainName);
      setCartItems([newItem]);
      return true;
    }
    
    const existingDomain = cartItems.find(item => 
      item.type === 'domain' && item.name === domainName
    );

    if (existingDomain) {
      return false; // Domain already exists in cart
    }

    const newItem = prepareExistingDomainCartItem(domainName);
    setCartItems(prev => Array.isArray(prev) ? [...prev, newItem] : [newItem]);
    return true;
  };
  // Update domain period (years and price)
  const updateDomainPeriod = (domainId: string, years: number, price: number) => {
    setCartItems(prevItems => {
      // Garante que prevItems é um array válido
      if (!Array.isArray(prevItems)) return [];
      
      return prevItems.map(item => {
        if (item.id === domainId) {
          return {
            ...item,
            period: `${years} ${years === 1 ? 'ano' : 'anos'}`,
            price: price,
            duration: years * 12,
            durationUnit: 'month'
          };
        }
        return item;
      });
    });
  };
  // Calculate values based on current state
  // Garante que cartItems é um array antes de chamar as funções de cálculo
  const validCartItems = Array.isArray(cartItems) ? cartItems : [];
  const itemCount = calculateItemCount(validCartItems);
  const subtotal = calculateSubtotal(validCartItems);
  const total = calculateTotal(subtotal, discount);
  // Check if item is in cart
  const isInCart = (id: string) => {
    if (!Array.isArray(cartItems)) {
      return false;
    }
    return cartItems.some(item => item.id === id);
  };

  // Alias for isInCart
  const isItemInCart = (id: string) => isInCart(id);
  const value = {
    cartItems: validCartItems, // Usando validCartItems ao invés de cartItems diretamente
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
    total,
    hasItemType: (type: string) => hasItemType(validCartItems, type),
    findItemById: (id: string) => findItemById(validCartItems, id),
    isInCart,
    discount,
    setDiscount,
    couponCode,
    setCouponCode,
    hasDomainInCart,
    // Aliases for compatibility
    removeItem,
    updateItemQuantity,
    addDomainToCart,
    addExistingDomainToCart,
    updateDomainPeriod,
    addItem,
    isItemInCart,
    validateAndFixCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
