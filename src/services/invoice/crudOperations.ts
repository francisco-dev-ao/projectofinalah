
import { supabase } from '@/integrations/supabase/client';
import { InvoiceCreateData, InvoiceStatusEnum } from './types';
import { generateInvoiceNumber, generatePublicToken } from './utils';
import { InvoiceStatus } from '@/types/invoice';

// Function to create a new invoice
export const createInvoice = async (invoiceData: Record<string, any>) => {
  // Ensure required fields exist before insertion
  if (!invoiceData.invoice_number) {
    invoiceData.invoice_number = generateInvoiceNumber();
  }
  
  if (!invoiceData.order_id) {
    throw new Error("order_id is required to create an invoice");
  }
  
  // Cast the status to InvoiceStatus - default to 'pending' instead of 'draft'
  const status = invoiceData.status as InvoiceStatus || 'pending';
  
  // Prepare validated data
  const validatedData: InvoiceCreateData = {
    invoice_number: invoiceData.invoice_number,
    order_id: invoiceData.order_id,
    user_id: invoiceData.user_id,
    created_at: invoiceData.created_at,
    due_date: invoiceData.due_date,
    total_amount: invoiceData.total_amount,
    status: status,
    payment_method: invoiceData.payment_method,
    company_details: invoiceData.company_details,
    payment_instructions: invoiceData.payment_instructions,
    notes: invoiceData.notes,
    pdf_url: invoiceData.pdf_url,
    public_token: invoiceData.public_token,
    is_public: invoiceData.is_public,
    updated_at: invoiceData.updated_at
  };
  
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert(validatedData)
      .select();
    
    if (error) {
      console.error("Error creating invoice:", error);
      return { success: false, error };
    }
    
    if (!data || data.length === 0) {
      return { success: false, error: "No data returned after invoice creation" };
    }
    
    // Auto-generate PDF after invoice creation
    try {
      const { generateInvoicePdf } = await import('@/utils/invoice/invoicePdfGenerator');
      const pdfUrl = await generateInvoicePdf(data[0].id, data[0].invoice_number);
      
      // Update the invoice with the PDF URL
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ pdf_url: pdfUrl })
        .eq('id', data[0].id);
        
      if (updateError) {
        console.warn('Error updating invoice with PDF URL:', updateError);
      } else {
        data[0].pdf_url = pdfUrl;
      }
    } catch (pdfError) {
      console.error('Error auto-generating PDF:', pdfError);
      // Continue without PDF
    }
    
    return { success: true, invoice: data[0] };
  } catch (err) {
    console.error("Exception in createInvoice:", err);
    return { success: false, error: err };
  }
};

// Function to update an invoice status
export const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', invoiceId);

  if (error) {
    console.error("Error updating invoice status:", error);
    return { success: false, error };
  }

  return { success: true, invoice: data ? data[0] : null };
};

// Function to update an existing invoice
export const updateInvoice = async (invoiceId: string, invoiceData: Record<string, any>) => {
  const { data, error } = await supabase
    .from('invoices')
    .update(invoiceData)
    .eq('id', invoiceId);

  if (error) {
    console.error("Error updating invoice:", error);
    return { success: false, error };
  }

  return { success: true, invoice: data ? data[0] : null };
};

// Function to share an invoice publicly
export const shareInvoice = async (invoiceId: string) => {
  const publicToken = generatePublicToken();

  const { data, error } = await supabase
    .from('invoices')
    .update({ public_token: publicToken, is_public: true })
    .eq('id', invoiceId);

  if (error) {
    console.error("Error sharing invoice:", error);
    return { success: false, error };
  }

  return { success: true, publicToken };
};

// Function to unshare an invoice
export const unshareInvoice = async (invoiceId: string) => {
  const { data, error } = await supabase
    .from('invoices')
    .update({ public_token: null, is_public: false })
    .eq('id', invoiceId);

  if (error) {
    console.error("Error unsharing invoice:", error);
    return { success: false, error };
  }

  return { success: true };
};

// Function to delete an invoice
export const deleteInvoice = async (invoiceId: string) => {
  try {
    // First, remove any invoice PDF files from storage
    try {
      // List files in the invoice's directory
      const { data: filesData } = await supabase.storage
        .from('invoices')
        .list(`pdfs/${invoiceId}`);
      
      // Delete each file if any exist
      if (filesData && filesData.length > 0) {
        const filePaths = filesData.map(file => `pdfs/${invoiceId}/${file.name}`);
        await supabase.storage
          .from('invoices')
          .remove(filePaths);
      }
    } catch (storageError) {
      console.warn("Error removing invoice PDF files:", storageError);
      // Continue with invoice deletion even if file removal fails
    }

    // Delete the invoice record
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      console.error("Error deleting invoice:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Exception in deleteInvoice:", err);
    return { success: false, error: err };
  }
};
