
import { useContext } from 'react';
import { CartContext } from './CartProvider';
import type { CartContextType } from './types';

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Re-export types for easier imports
export type { CartItem, DomainCheckResult } from './types';
export type { CartContextType } from './types';
