
// Export from productIdConstants but exclude generateProductId to avoid conflicts
export { PRODUCT_TYPE_PREFIXES } from './productIdConstants';

// Export from productIdStorage
export * from './productIdStorage';

// Export from productIdValidator but only the validator and extractor functions, not the generator
export { validateProductId, extractProductType } from './productIdValidator';

// Export the generator from productIdValidator exclusively
export { generateProductId } from './productIdValidator';

// Export these helper functions for easier access
export { ensureValidProductId } from '@/utils/productIdHelpers';
