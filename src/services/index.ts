// Basic services index - PDF functionality removed, using print reference instead
import { downloadHelpers } from '@/utils/downloadHelpers';

export { downloadHelpers };

// Legacy exports for compatibility
export const sendTestEmail = () => Promise.resolve({ success: true });
export const sendInvoiceByEmail = () => Promise.resolve({ success: true });

// Add sendTestEmail to downloadHelpers for compatibility
Object.assign(downloadHelpers, {
  sendTestEmail,
  sendInvoiceByEmail
});

export default downloadHelpers;