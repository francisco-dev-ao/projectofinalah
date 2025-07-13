// Re-export all functions from the different modules
// This maintains the same public API as before

// Utils
export { generateInvoiceNumber, generatePublicToken, extractItemsFromOrder } from './utils';

// Invoice CRUD operations
export { 
  createInvoice, 
  updateInvoice, 
  updateInvoiceStatus, 
  shareInvoice, 
  unshareInvoice,
  deleteInvoice
} from './crudOperations';

// Retrieval functions
export { 
  getInvoiceById, 
  getInvoiceByOrderId,
  getInvoiceByPublicToken,
  getInvoicesByUserId
} from './retrieval';

// PDF operations  
// PDF generation removed - using print reference instead

// Email operations
export { sendInvoiceViaEmail } from './emailService';

// Payment operations
export { recordInvoicePayment, getPublicInvoiceURL } from './paymentService';

// Invoice items
export { createInvoiceItems } from './invoiceItems';

// Invoice generator
export { generateInvoice } from './generator';

// Types
export { InvoiceStatusEnum } from './types';
export type { InvoiceCreateData } from './types';

// Re-export as InvoiceService object for backward compatibility
import { generateInvoice } from './generator';
import { 
  createInvoice, 
  updateInvoice, 
  updateInvoiceStatus,
  shareInvoice,
  unshareInvoice
} from './crudOperations';
import { 
  getInvoiceById,
  getInvoiceByOrderId,
  getInvoicesByUserId,
  getInvoiceByPublicToken
} from './retrieval';
import {
  sendInvoiceViaEmail
} from './emailService';
import {
  recordInvoicePayment,
  getPublicInvoiceURL
} from './paymentService';
// PDF generation removed - using print reference instead

// Export the InvoiceService object
export const InvoiceService = {
  listInvoices: async (customerId?: string) => {
    // If customerId is provided, get invoices for that customer
    if (customerId) {
      const { invoices, success } = await getInvoicesByUserId(customerId);
      return success ? invoices : [];
    }
    
    return [];
  },
  
  getInvoice: async (invoiceId: string) => {
    const response = await getInvoiceById(invoiceId);
    return response.data ? response.data : null;
  },
  
  createInvoice: async (invoiceData: any) => {
    const response = await createInvoice(invoiceData);
    return response.success ? response.invoice : null;
  },
  
  updateInvoice: async (invoiceId: string, invoiceData: any) => {
    const response = await updateInvoice(invoiceId, invoiceData);
    return response.success ? response.invoice : null;
  },
  
  // Add functions that were missing before
  generateInvoice,
  updateInvoiceStatus,
  
  // Keep all other functions directly
  getInvoiceByOrderId,
  shareInvoice,
  unshareInvoice,
  getInvoiceByPublicToken,
  sendInvoiceViaEmail,
  recordInvoicePayment,
  // PDF generation removed
  getPublicInvoiceURL
};

// Export the InvoiceService as default
export default InvoiceService;
