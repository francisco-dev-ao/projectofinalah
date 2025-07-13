import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EmailService } from '@/services/emailService';

interface InvoiceEmailData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  dueDate: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  invoiceUrl: string;
  pdfUrl?: string;
}

// Function to get invoice data for email
const getInvoiceEmailData = async (invoiceId: string): Promise<InvoiceEmailData | null> => {
  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        orders!inner (
          *,
          order_items(*),
          profiles:user_id (*)
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      console.error('Error fetching invoice:', error);
      return null;
    }

    const baseUrl = window.location.origin;
    
    return {
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.orders.profiles.name || 'Cliente',
      customerEmail: invoice.orders.profiles.email,
      dueDate: invoice.due_date,
      total: invoice.total_amount || invoice.orders.total_amount || 0,
      items: invoice.orders.order_items || [],
      invoiceUrl: `${baseUrl}/invoices/${invoice.id}`,
      pdfUrl: invoice.pdf_url
    };
  } catch (error) {
    console.error('Error in getInvoiceEmailData:', error);
    return null;
  }
};

// Function to send invoice via email
export const sendInvoiceViaEmail = async (invoiceId: string, email?: string) => {
  try {
    // Buscar dados completos da fatura
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        orders (
          *,
          profiles:user_id (*),
          payment_references (*),
          order_items (*)
        )
      `)
      .eq('id', invoiceId)
      .single();
      
    if (error || !invoice) {
      console.error('Error fetching invoice:', error);
      toast.error('Dados da fatura não encontrados.');
      return { success: false, error: 'Invoice data not found' };
    }

    // Verificar e-mail do cliente
    let recipientEmail = invoice.orders?.profiles?.email;
    
    // Override email if provided
    if (email) {
      recipientEmail = email;
    }

    // Check if customer email exists
    if (!recipientEmail) {
      toast.error('Email do cliente não encontrado.');
      return { success: false, error: 'Customer email not found' };
    }

    // Preparar dados da fatura
    const customerName = invoice.orders?.profiles?.name || 'Cliente';
    const invoiceNumber = invoice.invoice_number;
    const amount = invoice.total_amount || invoice.orders?.total_amount || 0;
    const dueDate = invoice.due_date;
    const baseUrl = window.location.origin;
    const invoiceUrl = `${baseUrl}/invoices/${invoice.id}`;
    const items = invoice.orders?.order_items || [];

    // Enviar email usando o EmailService centralizado
    const result = await EmailService.sendInvoiceEmail(
      recipientEmail,
      customerName,
      invoiceNumber,
      amount,
      dueDate,
      invoiceUrl,
      items
    );

    if (!result.success) {
      throw new Error(result.error || 'Falha no envio do email');
    }

    // Update invoice to mark as email sent
    await supabase
      .from('invoices')
      .update({ 
        email_sent: true, 
        email_sent_at: new Date().toISOString() 
      })
      .eq('id', invoiceId);

    toast.success(`Fatura enviada por email para ${recipientEmail}`);
    return { 
      success: true, 
      message: `Invoice sent to ${recipientEmail}`,
      recipients: [recipientEmail]
    };

  } catch (error) {
    console.error('Error sending invoice email:', error);
    toast.error(error instanceof Error ? error.message : 'Erro ao enviar email da fatura');
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Function to send automatic invoice emails when invoices are created
export const sendAutomaticInvoiceEmail = async (invoiceId: string) => {
  try {
    // Sempre envia o e-mail, ignorando configuração auto_send_invoices
    return await sendInvoiceViaEmail(invoiceId);
  } catch (error) {
    console.error('Error in sendAutomaticInvoiceEmail:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
