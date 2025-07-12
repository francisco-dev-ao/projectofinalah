
import { v4 as uuidv4 } from 'uuid';
import { PRODUCT_TYPE_PREFIXES } from './productIdConstants';

// Function to validate a product ID
export const validateProductId = (productId: string): boolean => {
  // Check if product ID exists
  if (!productId) return false;
  
  // Check if product ID has the correct format (prefix-uuid)
  const parts = productId.split('-');
  if (parts.length < 2) return false;
  
  const prefix = parts[0];
  
  // Check if prefix is valid
  const validPrefixes = Object.values(PRODUCT_TYPE_PREFIXES);
  if (!validPrefixes.includes(prefix)) return false;
  
  // Try to parse the UUID part
  try {
    const uuid = parts.slice(1).join('-');
    return uuid.length > 0;
  } catch (e) {
    return false;
  }
};

// Function to generate a product ID
export const generateProductId = (type: string): string => {
  // Get the prefix for this product type
  const prefix = PRODUCT_TYPE_PREFIXES[type as keyof typeof PRODUCT_TYPE_PREFIXES] || 'PROD';
  
  // Generate a UUID
  const uuid = uuidv4();
  
  // Return the formatted product ID
  return `${prefix}-${uuid}`;
};

export const extractProductType = (productId: string): string | null => {
  if (!productId) return null;
  
  const prefix = productId.split('-')[0];
  
  // Find the product type from the prefix
  for (const [type, prefixValue] of Object.entries(PRODUCT_TYPE_PREFIXES)) {
    if (prefixValue === prefix) {
      return type;
    }
  }
  
  return null;
};
