/**
 * Arquivo de barril (barrel file) para exportar os componentes do serviço PrintService
 */

// Re-exportar todos os componentes individuais
export {
  printInvoice,
  generateInvoicePDF,
  usePrintInvoice,
  printOrder,
  generateOrderPDF,
  usePrintOrder,
  printService,
  generateServicePDF,
  usePrintService,
  hasValidPaymentReference,
  getLatestPaymentReference,
  sendInvoiceByEmail,
  sendOrderByEmail,
  sendTestEmail
} from './PrintService';

// Re-exportar o default
export { default } from './PrintService';
