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
    
    // Obter dados da referência de pagamento
    const paymentReference = invoice.orders?.payment_references?.[0];
    const referenceNumber = paymentReference?.reference_number || invoice.payment_reference || 'Pendente';
    const amount = paymentReference?.amount || invoice.amount || 0;
    const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('pt-AO') : 'Não definido';
    
    // Lista de destinatários
    const recipients = [invoice.orders.profiles.email, ...additionalRecipients].filter(Boolean);
    
    return sendPdfByEmail({
      pdfBuffer,
      to: recipients,
      subject: `Fatura #${invoiceNumber} - AppyPay`,
      text: `Prezado(a) ${clientName},

Segue anexa sua fatura #${invoiceNumber}.

DADOS DE PAGAMENTO:
Referência: ${referenceNumber}
Valor: ${amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
Data de Vencimento: ${dueDate}

INSTRUÇÕES DE PAGAMENTO:
1. Acesse o seu homebanking ou dirija-se a um balcão do banco
2. Utilize a referência de pagamento: ${referenceNumber}
3. Confirme o valor: ${amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
4. Efetue o pagamento até a data de vencimento

IMPORTANTE:
- Guarde o comprovativo de pagamento
- O pagamento pode demorar até 24h para ser processado
- Em caso de dúvidas, contacte-nos

Obrigado por escolher nossos serviços.

Atenciosamente,
Equipe AppyPay
Telefone: +244 999 999 999
Email: support@appypay.ao`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fatura #${invoiceNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">AppyPay</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Sistema de Gestão de Pagamentos</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Fatura #${invoiceNumber}</h2>
              
              <p style="margin: 0 0 20px 0; font-size: 16px;">Prezado(a) <strong>${clientName}</strong>,</p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px;">
                Segue anexa a sua fatura. Por favor, proceda ao pagamento utilizando os dados abaixo:
              </p>
              
              <!-- Payment Details Card -->
              <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 20px 0; color: #495057; font-size: 18px; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
                  💳 Dados de Pagamento
                </h3>
                
                <div style="display: grid; gap: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                    <span style="font-weight: 600; color: #495057;">Referência:</span>
                    <span style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #007bff; background-color: #e7f3ff; padding: 5px 10px; border-radius: 4px;">${referenceNumber}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                    <span style="font-weight: 600; color: #495057;">Valor:</span>
                    <span style="font-size: 18px; font-weight: bold; color: #28a745;">${amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                    <span style="font-weight: 600; color: #495057;">Data de Vencimento:</span>
                    <span style="font-weight: bold; color: #dc3545;">${dueDate}</span>
                  </div>
                </div>
              </div>
              
              <!-- Instructions -->
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #856404; font-size: 16px;">
                  📋 Instruções de Pagamento
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #856404;">
                  <li style="margin-bottom: 8px;">Acesse o seu homebanking ou dirija-se a um balcão do banco</li>
                  <li style="margin-bottom: 8px;">Selecione a opção "Pagamento de Serviços" ou "Referência de Pagamento"</li>
                  <li style="margin-bottom: 8px;">Utilize a referência: <strong>${referenceNumber}</strong></li>
                  <li style="margin-bottom: 8px;">Confirme o valor: <strong>${amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</strong></li>
                  <li style="margin-bottom: 8px;">Efetue o pagamento até a data de vencimento</li>
                </ol>
              </div>
              
              <!-- Important Notes -->
              <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #0c5460; font-size: 16px;">
                  ⚠️ Informações Importantes
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
                  <li style="margin-bottom: 8px;">Guarde o comprovativo de pagamento para seus registos</li>
                  <li style="margin-bottom: 8px;">O pagamento pode demorar até 24 horas para ser processado</li>
                  <li style="margin-bottom: 8px;">Após o pagamento, receberá uma confirmação por email</li>
                  <li style="margin-bottom: 8px;">Em caso de dúvidas, não hesite em contactar-nos</li>
                </ul>
              </div>
              
              <p style="margin: 30px 0 20px 0; font-size: 16px;">
                Obrigado por escolher nossos serviços. Estamos sempre à disposição para ajudá-lo.
              </p>
              
              <p style="margin: 0; font-size: 16px;">
                Atenciosamente,<br>
                <strong>Equipe AppyPay</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <div style="margin-bottom: 15px;">
                <strong style="color: #495057; font-size: 16px;">AppyPay - Sistema de Gestão de Pagamentos</strong>
              </div>
              
              <div style="margin-bottom: 10px; color: #6c757d;">
                📞 <strong>Telefone:</strong> +244 999 999 999
              </div>
              
              <div style="margin-bottom: 10px; color: #6c757d;">
                📧 <strong>Email:</strong> support@appypay.ao
              </div>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
                Este é um email automático. Por favor, não responda diretamente a este email.
              </div>
            </div>
          </div>
        </body>
        </html>
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
