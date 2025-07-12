
import { InvoicePDFGenerator } from './pdfGenerator';
import { InvoiceDataFetcher } from './dataFetcher';
import { PDFStorageManager } from './storageManager';

export class InvoicePDFService {
  public static async generateLocalPdf(invoiceId: string) {
    try {
      // Fetch all required data
      const invoice = await InvoiceDataFetcher.fetchInvoiceData(invoiceId);
      const invoiceItems = await InvoiceDataFetcher.fetchInvoiceItems(invoiceId);
      const companySettings = await InvoiceDataFetcher.fetchCompanySettings();

      // Generate PDF
      const generator = new InvoicePDFGenerator();
      const pdfBuffer = generator.generatePDF(invoice, invoiceItems, companySettings);
      
      // Save to storage
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const pdfUrl = await PDFStorageManager.savePDFToStorage(
        invoiceId, 
        invoice.invoice_number, 
        pdfBlob
      );
      
      return { success: true, pdfUrl };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error };
    }
  }
}
