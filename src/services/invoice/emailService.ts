
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PrintService from '@/services';

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

// Function to get email configuration from company settings
const getEmailConfig = async (): Promise<EmailConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('email_config')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data?.email_config) {
      console.error('Error fetching email config:', error);
      return null;
    }

    return data.email_config as EmailConfig;
  } catch (error) {
    console.error('Error in getEmailConfig:', error);
    return null;
  }
};

// Function to send email using Supabase edge function
const sendEmailDirectly = async (emailConfig: EmailConfig, emailData: InvoiceEmailData) => {
  try {
    console.log('📧 Enviando email de fatura via edge function...');
    
    const emailContent = {
      to: emailData.customerEmail,
      subject: `Fatura ${emailData.invoiceNumber} - AngoHost`,
      html: generateEmailHTML(emailData),
      config: emailConfig
    };

    console.log('📋 Configuração de email para fatura:', {
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.secure,
      user: emailConfig.auth.user,
      to: emailData.customerEmail
    });

    // Send email using Supabase edge function
    const { data: result, error: sendError } = await supabase.functions.invoke('send-test-email', {
      body: emailContent
    });

    console.log('📬 Resposta da edge function para fatura:', { result, error: sendError });

    if (sendError) {
      console.error('❌ Erro na edge function:', sendError);
      throw new Error(sendError.message);
    }

    if (!result || !result.success) {
      console.error('❌ Falha no envio do email da fatura:', result);
      const errorMessage = result?.error || 'Falha no envio do email';
      throw new Error(errorMessage);
    }

    console.log('✅ Email de fatura enviado com sucesso!', result);
    return { success: true, method: result.method };

  } catch (error) {
    console.error('❌ Erro ao enviar email de fatura:', error);
    throw error;
  }
};

// Function to generate email HTML content
const generateEmailHTML = (data: InvoiceEmailData): string => {
  const formatCurrency = (amount: number) => {
    return `KZ ${new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(amount)}`;
  };

  const itemsList = data.items.map(item => 
    `<li>${item.name} - ${formatCurrency(item.unit_price)} × ${item.quantity}</li>`
  ).join('');

  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #0066cc;">
          <h2 style="margin: 0; color: #0066cc;">AngoHost</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Olá ${data.customerName},</p>
          
          <p>Sua fatura <strong>#${data.invoiceNumber}</strong> foi gerada e está disponível para pagamento.</p>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
            <p><strong>Detalhes da Fatura:</strong></p>
            <p>Número: ${data.invoiceNumber}</p>
            <p>Data de Vencimento: ${new Date(data.dueDate).toLocaleDateString('pt-AO')}</p>
            <p>Total: ${formatCurrency(data.total)}</p>
            
            <p><strong>Itens:</strong></p>
            <ul>${itemsList}</ul>
          </div>
          
          <p>Você pode visualizar e pagar sua fatura através do nosso portal:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.invoiceUrl}" style="background-color: #0066cc; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Visualizar Fatura</a>
          </div>
          
          ${data.pdfUrl ? `<p>Você também pode baixar a fatura em PDF <a href="${data.pdfUrl}" style="color: #0066cc; text-decoration: underline;">clicando aqui</a>.</p>` : ''}
          
          <p>Se você tiver alguma dúvida, entre em contato com nossa equipe de suporte respondendo a este email ou através do nosso chat.</p>
          
          <p>Atenciosamente,<br>Equipe AngoHost</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} AngoHost. Todos os direitos reservados.</p>
        </div>
      </body>
    </html>
  `;
};

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

    // Enviar por e-mail usando o PrintService
    // Adicionar o e-mail personalizado como destinatário adicional se for diferente do cliente
    const additionalRecipients = email && email !== recipientEmail ? [email] : [];
    const result = await PrintService.sendInvoiceByEmail(invoice, false, additionalRecipients);

    // Update invoice to mark as email sent
    await supabase
      .from('invoices')
      .update({ 
        email_sent: true, 
        email_sent_at: new Date().toISOString() 
      })
      .eq('id', invoiceId);

    toast.success(`Fatura enviada por email para ${result.recipients.join(', ')}`);
    return { 
      success: true, 
      message: `Invoice sent to ${result.recipients.join(', ')}`,
      messageId: result.messageId
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
