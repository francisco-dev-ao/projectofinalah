
import { supabase } from '@/integrations/supabase/client';

export class PDFStorageManager {
  public static async savePDFToStorage(invoiceId: string, invoiceNumber: string, pdfBlob: Blob): Promise<string> {
    try {
      await this.initializeInvoiceBucket();
      
      const fileName = `fatura-${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(`pdfs/${invoiceId}/${fileName}`, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading PDF to storage:', uploadError);
        throw uploadError;
      }
      
      const { data: publicUrlData } = await supabase.storage
        .from('invoices')
        .getPublicUrl(`pdfs/${invoiceId}/${fileName}`);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw error;
    }
  }

  private static async initializeInvoiceBucket(): Promise<boolean> {
    try {
      await supabase.rpc('setup_invoice_bucket_policies');
      return true;
    } catch (error) {
      console.error('Error initializing invoice bucket:', error);
      return false;
    }
  }
}
