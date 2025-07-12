
// Current domain validation utilities
export const validateExistingDomain = (domain: string): boolean => {
  if (!domain || domain.trim() === '') {
    return false;
  }

  // Remove http:// or https:// if present
  let cleanDomain = domain.toLowerCase();
  cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
  
  // Remove www. if present
  cleanDomain = cleanDomain.replace(/^www\./, '');
  
  // Basic domain validation
  const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
  return domainRegex.test(cleanDomain);
};

// Get base URL for the current environment
export const getBaseUrl = (): string => {
  // Check if running in a browser environment
  if (typeof window !== 'undefined') {
    return window.location.host;
  }
  
  // Default to localhost in non-browser environments
  return 'localhost:3000';
};
