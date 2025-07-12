/**
 * EmailService.ts - Serviço de envio de e-mail para o lado do servidor
 * Este arquivo é usado apenas no lado do servidor (API routes) e não no cliente
 */

import nodemailer from 'nodemailer';
// Importar o cliente Supabase
import { createClient } from '@supabase/supabase-js';

// Configuração do transportador de e-mail SMTP
const emailTransporter = nodemailer.createTransport({
  host: process.env.NEXT_PUBLIC_SMTP_HOST || 'mail.angohost.ao',
  port: parseInt(process.env.NEXT_PUBLIC_SMTP_PORT || '587'),
  secure: process.env.NEXT_PUBLIC_SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.NEXT_PUBLIC_SMTP_USER || 'support@angohost.ao',
    pass: process.env.NEXT_PUBLIC_SMTP_PASSWORD || '97z2lh;F4_k5',
  },
});

// Email padrão para envio
const DEFAULT_FROM_EMAIL = process.env.NEXT_PUBLIC_SMTP_FROM || 'support@angohost.ao';

// Inicializar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Envia um PDF por e-mail
 * @param options Opções para o envio
 * @returns Informações do envio
 */
export const sendPdfByEmail = async (options: {
  pdfBuffer: Uint8Array | Buffer;
  to: string[];
  subject: string;
  text: string;
  html: string;
  filename: string;
  invoiceId?: string;
}): Promise<any> => {
  try {
    // Configurar o e-mail
    const mailOptions = {
      from: DEFAULT_FROM_EMAIL,
      to: options.to.join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: [
        {
          filename: options.filename,
          content: Buffer.from(options.pdfBuffer),
          contentType: 'application/pdf'
        }
      ]
    };
    
    // Enviar o e-mail
    const info = await emailTransporter.sendMail(mailOptions);
    
    // Registrar o envio do e-mail se for uma fatura
    if (options.invoiceId) {
      try {
        await supabase
          .from('invoice_emails')
          .insert({
            invoice_id: options.invoiceId,
            sent_at: new Date().toISOString(),
            recipients: options.to,
            message_id: info.messageId
          });
      } catch (error) {
        console.error('Erro ao registrar envio de e-mail:', error);
      }
    }
    
    return {
      success: true,
      messageId: info.messageId,
      recipients: options.to
    };
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error);
    throw error;
  }
};

/**
 * Envia um e-mail de teste para verificar a configuração SMTP
 */
export const sendTestEmail = async (email: string): Promise<any> => {
  if (!email) {
    throw new Error('E-mail de destino não fornecido');
  }
  
  return sendPdfByEmail({
    pdfBuffer: Buffer.from('Teste de PDF', 'utf-8'),
    to: [email],
    subject: 'Teste de Configuração SMTP - AppyPay',
    text: `Este é um e-mail de teste enviado em ${new Date().toLocaleString('pt-AO')}.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333;">Teste de E-mail - AppyPay</h2>
        <p>Este é um e-mail de teste para verificar a configuração SMTP do sistema AppyPay.</p>
        <p>Timestamp: <strong>${new Date().toLocaleString('pt-AO')}</strong></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">Se você recebeu este e-mail, a configuração SMTP está funcionando corretamente.</p>
      </div>
    `,
    filename: 'teste.pdf'
  });
};

/**
 * Envia uma fatura por e-mail para o cliente
 */
export const sendInvoiceByEmail = async (
  invoice: any,
  pdfBuffer: Buffer,
  requireReference = false,
  additionalRecipients: string[] = []
): Promise<any> => {
  try {
    // Verificar se a fatura tem cliente com e-mail
    if (!invoice.orders?.profiles?.email) {
      throw new Error('E-mail do cliente não encontrado');
    }
    
    // Preparar o e-mail
    const invoiceNumber = invoice.invoice_number || invoice.id;
    const clientName = invoice.orders?.profiles?.name || 
                    invoice.orders?.profiles?.company_name || 
                    'Cliente';
    
    // Lista de destinatários
    const recipients = [invoice.orders.profiles.email, ...additionalRecipients].filter(Boolean);
    
    return sendPdfByEmail({
      pdfBuffer,
      to: recipients,
      subject: `Fatura #${invoiceNumber} - AppyPay`,
      text: `Prezado(a) ${clientName},\n\n` +
            `Segue anexa sua fatura #${invoiceNumber}.\n\n` +
            `Referência de Pagamento: ${invoice.payment_reference || 'Pendente'}\n\n` +
            `Obrigado por escolher nossos serviços.\n\n` +
            `Atenciosamente,\n` +
            `Equipe AppyPay`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Fatura #${invoiceNumber}</h2>
          <p>Prezado(a) <strong>${clientName}</strong>,</p>
          <p>Segue anexa sua fatura conforme solicitado.</p>
          
          <div style="background-color: #f5f5f5; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Referência de Pagamento:</strong> ${invoice.payment_reference || 'Pendente'}</p>
          </div>
          
          <p>Obrigado por escolher nossos serviços.</p>
          <p>Atenciosamente,<br>Equipe AppyPay</p>
        </div>
      `,
      filename: `fatura-${invoiceNumber}.pdf`,
      invoiceId: invoice.id
    });
  } catch (error: any) {
    console.error('Erro ao enviar fatura por e-mail:', error);
    throw error;
  }
};

/**
 * Envia um pedido por e-mail para o cliente
 */
export const sendOrderByEmail = async (
  order: any,
  pdfBuffer: Buffer,
  additionalRecipients: string[] = []
): Promise<any> => {
  try {
    // Verificar se o pedido tem cliente com e-mail
    if (!order.profiles?.email) {
      throw new Error('E-mail do cliente não encontrado');
    }
    
    // Preparar o e-mail
    const orderNumber = order.order_number || order.id;
    const clientName = order.profiles?.name || order.profiles?.company_name || 'Cliente';
    
    // Lista de destinatários
    const recipients = [order.profiles.email, ...additionalRecipients].filter(Boolean);
    
    return sendPdfByEmail({
      pdfBuffer,
      to: recipients,
      subject: `Pedido #${orderNumber} - AppyPay`,
      text: `Prezado(a) ${clientName},\n\n` +
            `Segue anexo seu pedido #${orderNumber}.\n\n` +
            `Obrigado por escolher nossos serviços.\n\n` +
            `Atenciosamente,\n` +
            `Equipe AppyPay`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Pedido #${orderNumber}</h2>
          <p>Prezado(a) <strong>${clientName}</strong>,</p>
          <p>Segue anexo seu pedido conforme solicitado.</p>
          
          <p>Obrigado por escolher nossos serviços.</p>
          <p>Atenciosamente,<br>Equipe AppyPay</p>
        </div>
      `,
      filename: `pedido-${orderNumber}.pdf`
    });
  } catch (error: any) {
    console.error('Erro ao enviar pedido por e-mail:', error);
    throw error;
  }
};

// Exportar as funções
export default {
  sendPdfByEmail,
  sendTestEmail,
  sendInvoiceByEmail,
  sendOrderByEmail
};
