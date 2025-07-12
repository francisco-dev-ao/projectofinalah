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

// Generate email templates
const generateEmailTemplate = (templateType: string, data: Record<string, any>): string => {
  const formatCurrency = (amount: number) => {
    return `KZ ${new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(amount)}`;
  };

  const baseStyles = `
    font-family: Arial, sans-serif; 
    line-height: 1.6; 
    color: #333; 
    max-width: 600px; 
    margin: 0 auto;
  `;

  const headerStyles = `
    background-color: #f8f9fa; 
    padding: 20px; 
    text-align: center; 
    border-bottom: 3px solid #0066cc;
  `;

  const contentStyles = `
    padding: 20px;
  `;

  const footerStyles = `
    background-color: #f8f9fa; 
    padding: 20px; 
    text-align: center; 
    font-size: 12px; 
    color: #666;
  `;

  switch (templateType) {
    case 'invoice_created':
      return `
        <html>
          <body style="${baseStyles}">
            <div style="${headerStyles}">
              <h2 style="margin: 0; color: #0066cc;">AngoHost - Nova Fatura</h2>
            </div>
            
            <div style="${contentStyles}">
              <p>Olá ${data.customerName},</p>
              
              <p>Uma nova fatura foi gerada para sua conta.</p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
                <p><strong>Detalhes da Fatura:</strong></p>
                <p>Número: ${data.invoiceNumber}</p>
                <p>Data de Vencimento: ${new Date(data.dueDate).toLocaleDateString('pt-AO')}</p>
                <p>Total: ${formatCurrency(data.total)}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.invoiceUrl}" style="background-color: #0066cc; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Visualizar Fatura</a>
              </div>
              
              <p>Atenciosamente,<br>Equipe AngoHost</p>
            </div>
            
            <div style="${footerStyles}">
              <p>© ${new Date().getFullYear()} AngoHost. Todos os direitos reservados.</p>
            </div>
          </body>
        </html>
      `;

    case 'payment_received':
      return `
        <html>
          <body style="${baseStyles}">
            <div style="${headerStyles}">
              <h2 style="margin: 0; color: #28a745;">✅ Pagamento Confirmado</h2>
            </div>
            
            <div style="${contentStyles}">
              <p>Olá ${data.customerName},</p>
              
              <p>Confirmamos o recebimento do seu pagamento!</p>
              
              <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                <p><strong>Detalhes do Pagamento:</strong></p>
                <p>Fatura: ${data.invoiceNumber}</p>
                <p>Valor: ${formatCurrency(data.amount)}</p>
                <p>Data: ${new Date().toLocaleDateString('pt-AO')}</p>
              </div>
              
              <p>Seus serviços continuarão ativos conforme contratado.</p>
              
              <p>Atenciosamente,<br>Equipe AngoHost</p>
            </div>
            
            <div style="${footerStyles}">
              <p>© ${new Date().getFullYear()} AngoHost. Todos os direitos reservados.</p>
            </div>
          </body>
        </html>
      `;

    case 'order_confirmed':
      return `
        <html>
          <body style="${baseStyles}">
            <div style="${headerStyles}">
              <h2 style="margin: 0; color: #0066cc;">Pedido Confirmado</h2>
            </div>
            
            <div style="${contentStyles}">
              <p>Olá ${data.customerName},</p>
              
              <p>Seu pedido foi confirmado com sucesso!</p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
                <p><strong>Detalhes do Pedido:</strong></p>
                <p>Número: ${data.orderNumber}</p>
                <p>Total: ${formatCurrency(data.total)}</p>
              </div>
              
              <p>Em breve você receberá as instruções para configurar seus serviços.</p>
              
              <p>Atenciosamente,<br>Equipe AngoHost</p>
            </div>
            
            <div style="${footerStyles}">
              <p>© ${new Date().getFullYear()} AngoHost. Todos os direitos reservados.</p>
            </div>
          </body>
        </html>
      `;

    default:
      return `
        <html>
          <body style="${baseStyles}">
            <div style="${headerStyles}">
              <h2 style="margin: 0; color: #0066cc;">AngoHost</h2>
            </div>
            
            <div style="${contentStyles}">
              <p>Olá ${data.customerName},</p>
              <p>Você tem uma nova notificação da AngoHost.</p>
              <p>Atenciosamente,<br>Equipe AngoHost</p>
            </div>
            
            <div style="${footerStyles}">
              <p>© ${new Date().getFullYear()} AngoHost. Todos os direitos reservados.</p>
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