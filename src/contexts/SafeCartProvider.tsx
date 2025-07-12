
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CartItem } from './cart/types';

interface SimpleCartContextType {
  cartItems: CartItem[];
  addItem: (item: CartItem, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateDomainPeriod: (domainId: string, years: number, price: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  total: number;
}

const SimpleCartContext = createContext<SimpleCartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'simple_cart_items';

export const SafeCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItems(items);
        console.log('Loaded cart from storage:', items);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }, [cartItems]);

  const addItem = useCallback((item: CartItem, quantity: number = 1) => {
    console.log('Adicionando item ao carrinho:', item, 'quantidade:', quantity);
    
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        return updatedItems;
      } else {
        return [...prevItems, { ...item, quantity }];
      }
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const updateDomainPeriod = useCallback((domainId: string, years: number, price: number) => {
    console.log('Updating domain period:', { domainId, years, price });
    
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === domainId && item.type === 'domain') {
          const updatedItem = {
            ...item,
            price: price,
            unitPrice: price,
            period: `${years} ano${years > 1 ? 's' : ''}`,
            duration: years * 12,
            durationUnit: 'month' as const
          };
          console.log('Updated domain item:', updatedItem);
          return updatedItem;
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const total = subtotal; // Sem taxas adicionais por agora

  const value: SimpleCartContextType = {
    cartItems,
    addItem,
    removeItem,
    updateItemQuantity,
    updateDomainPeriod,
    clearCart,
    itemCount,
    subtotal,
    total
  };

  return (
    <SimpleCartContext.Provider value={value}>
      {children}
    </SimpleCartContext.Provider>
  );
};

export const useSimpleCart = (): SimpleCartContextType => {
  const context = useContext(SimpleCartContext);
  if (context === undefined) {
    throw new Error('useSimpleCart must be used within a SafeCartProvider');
  }
  return context;
};
