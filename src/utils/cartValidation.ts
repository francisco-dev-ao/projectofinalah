import { CartItem } from '@/contexts/cart/types';

/**
 * Validates if email/hosting items have domain requirements met
 * Returns validation result with error message if validation fails
 */
export const validateCartDomainRequirements = (cartItems: CartItem[]): { 
  isValid: boolean; 
  errorMessage?: string; 
} => {
  // Get all items that require domains
  const emailItems = cartItems.filter(item => item.type === 'email');
  const hostingItems = cartItems.filter(item => item.type === 'hosting');
  const domainItems = cartItems.filter(item => item.type === 'domain');

  // Check if there are email or hosting items
  const hasEmailOrHosting = emailItems.length > 0 || hostingItems.length > 0;

  // If there are email/hosting items but no domain items
  if (hasEmailOrHosting && domainItems.length === 0) {
    return {
      isValid: false,
      errorMessage: 'Para contratar serviços de Email ou Hospedagem é necessário ter um domínio. Por favor, adicione um domínio ao seu carrinho ou registe um novo domínio.'
    };
  }

  return { isValid: true };
};

/**
 * Get domain requirement message for display
 */
export const getDomainRequirementMessage = (cartItems: CartItem[]): string | null => {
  const validation = validateCartDomainRequirements(cartItems);
  
  if (!validation.isValid) {
    return validation.errorMessage || null;
  }
  
  return null;
};

/**
 * Check if cart needs domain validation
 */
export const cartNeedsDomainValidation = (cartItems: CartItem[]): boolean => {
  return cartItems.some(item => item.type === 'email' || item.type === 'hosting');
};