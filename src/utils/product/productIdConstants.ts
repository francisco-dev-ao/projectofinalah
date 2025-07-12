
// Product type prefixes
export const PRODUCT_TYPE_PREFIXES = {
  DOMAIN: 'DOM',
  HOSTING: 'HST',
  EMAIL: 'EML',
  SSL: 'SSL',
  SUPPORT: 'SUP',
  LICENSE: 'LIC',
};

// Used for compatibility with productIdValidator.ts
export const productIdPrefix = PRODUCT_TYPE_PREFIXES;

// Generate a product ID with the format PREFIX-TIMESTAMP-RANDOM
export const generateProductId = (prefix: string): string => {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};
