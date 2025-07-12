
import { Domain } from './types';

// Domain price tiers
const PRICE_TIERS = {
  THREE_CHARS: 300000, // 300,000 AOA for 3-character domains
  DEFAULT: 20000,      // 20,000 AOA for standard domains
  RENEWAL: 19000       // 19,000 AOA for renewals
};

/**
 * Calculate domain price based on length and type (new registration or renewal)
 * @param domainName Domain name without TLD
 * @param isRenewal Whether this is a renewal
 * @returns Price in AOA
 */
export const calculateDomainPrice = (domainName: string, isRenewal: boolean = false): number => {
  if (isRenewal) {
    return PRICE_TIERS.RENEWAL;
  }
  
  // Special pricing for 3-character domains on first registration
  if (domainName.length === 3) {
    return PRICE_TIERS.THREE_CHARS;
  }
  
  return PRICE_TIERS.DEFAULT;
};
