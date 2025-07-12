
import { supabase } from '@/integrations/supabase/client';
import { updateInvoice } from './crudOperations';
import { InvoicePDFService } from './pdf/pdfService';

// Function to regenerate invoice PDF
export const regenerateInvoicePdf = async (invoiceId: string) => {
  try {
    const result = await InvoicePDFService.generateLocalPdf(invoiceId);
    
    if (result.success && result.pdfUrl) {
      const updateResult = await updateInvoice(invoiceId, { pdf_url: result.pdfUrl });
      
      if (!updateResult.success) {
        console.error("Error updating invoice with PDF URL:", updateResult.error);
        return { success: false, error: updateResult.error };
      }
      
      return { success: true, pdfUrl: result.pdfUrl };
    } else {
      return { success: false, error: result.error || "Failed to generate PDF" };
    }
  } catch (error) {
    console.error("Error in regenerateInvoicePdf:", error);
    return { success: false, error };
  }
};

// Function to generate invoice PDF using the edge function (legacy)
export const generateInvoicePDF = async (invoiceId: string) => {
  try {
    return await InvoicePDFService.generateLocalPdf(invoiceId);
  } catch (error) {
    console.error("Exception in generateInvoicePDF:", error);
    return { success: false, error };
  }
};
