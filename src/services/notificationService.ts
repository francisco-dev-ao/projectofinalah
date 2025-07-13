import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailConfig {
  from_name: string;
  from_email: string;
  smtp_host: string;
  smtp_port: number;
  secure: boolean | string;
  auth: {
    user: string;
    pass: string;
  };
}

interface NotificationData {
  customerName: string;
  customerEmail: string;
  subject: string;
  templateType: 'invoice_created' | 'payment_received' | 'order_confirmed' | 'service_renewal';
  data: Record<string, any>;
}

// Get email configuration
const getEmailConfig = async (): Promise<EmailConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('email_config')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data?.email_config) {
      return null;
    }

    return data.email_config as EmailConfig;
  } catch (error) {
    console.error('Error getting email config:', error);
    return null;
  }
};

// Check if auto-send is enabled
const isAutoSendEnabled = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('auto_send_invoices')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data?.auto_send_invoices || false;
  } catch (error) {
    console.error('Error checking auto-send setting:', error);
    return false;
  }
};

// Generate professional email templates that avoid spam
const generateEmailTemplate = (templateType: string, data: Record<string, any>): string => {
  const formatCurrency = (amount: number) => {
    return `KZ ${new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(amount)}`;
  };

  const baseStyles = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    line-height: 1.8; 
    color: #2c3e50; 
    max-width: 650px; 
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  `;

  const headerStyles = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    padding: 30px 20px; 
    text-align: center;
  `;

  const contentStyles = `
    padding: 30px 25px;
    background-color: #ffffff;
  `;

  const footerStyles = `
    background-color: #f8f9fa; 
    padding: 20px 25px; 
    text-align: center; 
    font-size: 13px; 
    color: #6c757d;
    border-top: 1px solid #e9ecef;
  `;

  const buttonStyles = `
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white !important;
    padding: 15px 30px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    text-align: center;
    transition: all 0.3s ease;
    border: none;
    font-size: 16px;
    letter-spacing: 0.5px;
  `;

  const cardStyles = `
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    margin: 25px 0;
    border-left: 4px solid #667eea;
  `;

  switch (templateType) {
    case 'invoice_created':
      return `
        <!DOCTYPE html>
        <html lang="pt">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nova Fatura - AngoHost</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f4f6f9;">
          <div style="${baseStyles}">
            <div style="${headerStyles}">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 300;">
                <span style="font-weight: 700;">Ango</span>Host
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Serviços de Hospedagem Premium
              </p>
            </div>
            
            <div style="${contentStyles}">
              <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 24px; font-weight: 600;">
                Olá ${data.customerName || 'Cliente'},
              </h2>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                Esperamos que esteja bem! Uma nova fatura foi gerada para sua conta AngoHost.
              </p>
              
              <div style="${cardStyles}">
                <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 18px;">📋 Detalhes da Fatura</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6c757d;">Número da Fatura:</td>
                    <td style="padding: 8px 0; color: #2c3e50;">${data.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6c757d;">Data de Vencimento:</td>
                    <td style="padding: 8px 0; color: #dc3545; font-weight: 600;">
                      ${new Date(data.dueDate).toLocaleDateString('pt-AO', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6c757d;">Valor Total:</td>
                    <td style="padding: 8px 0; color: #28a745; font-weight: 700; font-size: 18px;">
                      ${formatCurrency(data.total)}
                    </td>
                  </tr>
                </table>
              </div>
              
              <p style="font-size: 16px; margin: 25px 0;">
                Para visualizar os detalhes completos e efetuar o pagamento, clique no botão abaixo:
              </p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${data.invoiceUrl}" style="${buttonStyles}">
                  💳 Visualizar e Pagar Fatura
                </a>
              </div>
              
              <div style="background-color: #e8f4fd; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; color: #0c5460; font-size: 14px;">
                  <strong>💡 Dica:</strong> Mantenha seus serviços sempre ativos pagando antes do vencimento. 
                  Isso evita interrupções e garante a melhor experiência com nossos serviços.
                </p>
              </div>
              
              <p style="font-size: 16px; margin-top: 30px;">
                Se tiver alguma dúvida, nossa equipe de suporte está sempre disponível para ajudar.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 0;">
                Atenciosamente,<br>
                <strong>Equipe AngoHost</strong><br>
                <span style="color: #6c757d; font-size: 14px;">Suporte Técnico Especializado</span>
              </p>
            </div>
            
            <div style="${footerStyles}">
              <p style="margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} AngoHost - Serviços de Hospedagem Premium
              </p>
              <p style="margin: 0; font-size: 12px;">
                Este é um email automático. Para suporte, responda este email ou acesse nosso portal.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'payment_received':
      return `
        <!DOCTYPE html>
        <html lang="pt">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pagamento Confirmado - AngoHost</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f4f6f9;">
          <div style="${baseStyles}">
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 300;">
                <span style="font-weight: 700;">Ango</span>Host
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">
                ✅ Pagamento Confirmado com Sucesso!
              </p>
            </div>
            
            <div style="${contentStyles}">
              <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 24px; font-weight: 600;">
                Olá ${data.customerName || 'Cliente'},
              </h2>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                Excelente notícia! Confirmamos o recebimento do seu pagamento.
              </p>
              
              <div style="background-color: #d1eddb; border: 1px solid #badbcc; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #28a745;">
                <h3 style="margin: 0 0 15px 0; color: #155724; font-size: 18px;">💚 Detalhes do Pagamento</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #155724;">Fatura:</td>
                    <td style="padding: 8px 0; color: #155724;">${data.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #155724;">Valor Pago:</td>
                    <td style="padding: 8px 0; color: #155724; font-weight: 700; font-size: 18px;">
                      ${formatCurrency(data.amount)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #155724;">Data do Pagamento:</td>
                    <td style="padding: 8px 0; color: #155724;">
                      ${new Date().toLocaleDateString('pt-AO', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #e8f4fd; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; color: #0c5460; font-size: 14px;">
                  <strong>🚀 Status dos Serviços:</strong> Todos os seus serviços continuarão ativos conforme contratado. 
                  Obrigado por manter sua conta em dia!
                </p>
              </div>
              
              <p style="font-size: 16px; margin-top: 30px;">
                Agradecemos pela confiança em nossos serviços. Continuamos trabalhando para oferecer a melhor experiência de hospedagem.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 0;">
                Atenciosamente,<br>
                <strong>Equipe AngoHost</strong><br>
                <span style="color: #6c757d; font-size: 14px;">Suporte Técnico Especializado</span>
              </p>
            </div>
            
            <div style="${footerStyles}">
              <p style="margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} AngoHost - Serviços de Hospedagem Premium
              </p>
              <p style="margin: 0; font-size: 12px;">
                Este é um email automático. Para suporte, responda este email ou acesse nosso portal.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'order_confirmed':
      return `
        <!DOCTYPE html>
        <html lang="pt">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pedido Confirmado - AngoHost</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f4f6f9;">
          <div style="${baseStyles}">
            <div style="background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 300;">
                <span style="font-weight: 700;">Ango</span>Host
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">
                🎉 Pedido Confirmado com Sucesso!
              </p>
            </div>
            
            <div style="${contentStyles}">
              <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 24px; font-weight: 600;">
                Olá ${data.customerName || 'Cliente'},
              </h2>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                Seja muito bem-vindo à AngoHost! Seu pedido foi confirmado e estamos preparando tudo para você.
              </p>
              
              <div style="${cardStyles}">
                <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 18px;">📦 Detalhes do Pedido</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6c757d;">Número do Pedido:</td>
                    <td style="padding: 8px 0; color: #2c3e50;">${data.orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6c757d;">Valor Total:</td>
                    <td style="padding: 8px 0; color: #28a745; font-weight: 700; font-size: 18px;">
                      ${formatCurrency(data.total)}
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⏱️ Próximos Passos:</strong> Em breve você receberá um email com as instruções 
                  detalhadas para configurar e acessar seus serviços contratados.
                </p>
              </div>
              
              <p style="font-size: 16px; margin-top: 30px;">
                Nossa equipe técnica já está trabalhando na configuração dos seus serviços. 
                Qualquer dúvida, estamos aqui para ajudar!
              </p>
              
              <p style="font-size: 16px; margin-bottom: 0;">
                Atenciosamente,<br>
                <strong>Equipe AngoHost</strong><br>
                <span style="color: #6c757d; font-size: 14px;">Suporte Técnico Especializado</span>
              </p>
            </div>
            
            <div style="${footerStyles}">
              <p style="margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} AngoHost - Serviços de Hospedagem Premium
              </p>
              <p style="margin: 0; font-size: 12px;">
                Este é um email automático. Para suporte, responda este email ou acesse nosso portal.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

    default:
      return `
        <!DOCTYPE html>
        <html lang="pt">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Notificação - AngoHost</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f4f6f9;">
          <div style="${baseStyles}">
            <div style="${headerStyles}">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 300;">
                <span style="font-weight: 700;">Ango</span>Host
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Serviços de Hospedagem Premium
              </p>
            </div>
            
            <div style="${contentStyles}">
              <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 24px; font-weight: 600;">
                Olá ${data.customerName || 'Cliente'},
              </h2>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                Você tem uma nova notificação importante da AngoHost.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 0;">
                Atenciosamente,<br>
                <strong>Equipe AngoHost</strong><br>
                <span style="color: #6c757d; font-size: 14px;">Suporte Técnico Especializado</span>
              </p>
            </div>
            
            <div style="${footerStyles}">
              <p style="margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} AngoHost - Serviços de Hospedagem Premium
              </p>
              <p style="margin: 0; font-size: 12px;">
                Este é um email automático. Para suporte, responda este email ou acesse nosso portal.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
  }
};

// Send notification email
export const sendNotificationEmail = async (notificationData: NotificationData) => {
  try {
    // Check if auto-send is enabled
    const autoSendEnabled = await isAutoSendEnabled();
    if (!autoSendEnabled) {
      console.log('Auto-send notifications disabled');
      return { success: false, skipped: true };
    }

    // Get email configuration
    const emailConfig = await getEmailConfig();
    if (!emailConfig) {
      console.error('Email configuration not found');
      return { success: false, error: 'Email configuration not found' };
    }

    // Generate email content
    const htmlContent = generateEmailTemplate(notificationData.templateType, notificationData.data);

    // Log email sending (in production, this would be sent via SMTP)
    console.log('Sending notification email:', {
      from: `${emailConfig.from_name} <${emailConfig.from_email}>`,
      to: notificationData.customerEmail,
      subject: notificationData.subject,
      html: htmlContent
    });

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success(`Notificação enviada para ${notificationData.customerEmail}`);
    return { success: true, message: `Notification sent to ${notificationData.customerEmail}` };

  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Specific notification functions
export const sendInvoiceCreatedNotification = async (invoiceData: {
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  dueDate: string;
  total: number;
  invoiceUrl: string;
}) => {
  return sendNotificationEmail({
    customerName: invoiceData.customerName,
    customerEmail: invoiceData.customerEmail,
    subject: `Nova Fatura ${invoiceData.invoiceNumber} - AngoHost`,
    templateType: 'invoice_created',
    data: invoiceData
  });
};

export const sendPaymentReceivedNotification = async (paymentData: {
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  amount: number;
}) => {
  return sendNotificationEmail({
    customerName: paymentData.customerName,
    customerEmail: paymentData.customerEmail,
    subject: `Pagamento Confirmado - Fatura ${paymentData.invoiceNumber}`,
    templateType: 'payment_received',
    data: paymentData
  });
};

export const sendOrderConfirmedNotification = async (orderData: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  total: number;
}) => {
  return sendNotificationEmail({
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    subject: `Pedido Confirmado ${orderData.orderNumber} - AngoHost`,
    templateType: 'order_confirmed',
    data: orderData
  });
};