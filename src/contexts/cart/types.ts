
// Define the DomainCheckResult interface
export interface DomainCheckResult {
  domain: string;
  available: boolean;
  price?: number;
  renewalPrice?: number;
  isPremium?: boolean;
}

// Define the CartItem interface
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
  description?: string;
  unitPrice?: number;  
  period: string;
  duration?: number;
  durationUnit?: string;
  metadata?: Record<string, any>;
  renewalDate?: string;
  renewalPrice?: number;
  isExistingDomain?: boolean;
}

// Define the CartContextType interface
export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  total: number;
  hasItemType: (type: string) => boolean;
  findItemById: (id: string) => CartItem | undefined;
  isInCart: (id: string) => boolean;
  discount: number;
  setDiscount: (value: number) => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
  hasDomainInCart: boolean;
  validateAndFixCart: () => boolean;
  
  // Aliases for compatibility
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  addDomainToCart: (domain: DomainCheckResult) => boolean;
  addExistingDomainToCart: (domainName: string) => boolean;
  updateDomainPeriod: (domainId: string, years: number, price: number) => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  isItemInCart: (id: string) => boolean;
}
