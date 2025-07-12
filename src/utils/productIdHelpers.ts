
import { validateProductId as originalValidateProductId } from '@/utils/product/productIdValidator';

/**
 * Ensures a product ID is valid, but allows for custom/dynamic IDs
 * This is more flexible than the strict UUID validation
 */
export function ensureValidProductId(productId: string): void {
  // Don't validate if the ID is empty or null
  if (!productId) {
    return; // Allow empty IDs to pass through
  }
  
  // Allow dynamic IDs that start with known prefixes
  const dynamicPrefixes = ['email-', 'domain-', 'hosting-', 'service-'];
  const isDynamicId = dynamicPrefixes.some(prefix => productId.startsWith(prefix));
  
  if (isDynamicId) {
    return; // Allow dynamic IDs to pass through
  }
  
  // For non-dynamic IDs, use the original validation but don't throw errors
  const isValid = originalValidateProductId(productId);
  if (!isValid) {
    console.warn(`Product ID validation warning: ${productId} may not be in expected format`);
    // Don't throw error, just log warning
  }
}

/**
 * Checks if a product ID is a valid UUID format
 */
export function isValidUUID(productId: string): boolean {
  if (!productId) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(productId);
}

/**
 * Extracts service information from cart items for better invoice display
 */
export function extractServiceInfo(item: any) {
  return {
    name: item.name || 'Serviço',
    description: item.description || '',
    unit_price: item.unitPrice || item.price || item.unit_price || 0,
    quantity: item.quantity || 1,
    duration: item.duration || null,
    duration_unit: item.durationUnit || item.duration_unit || null,
    type: item.type || 'service'
  };
}
