import { supabase } from '@/integrations/supabase/client';

interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Centralizado serviço de envio de emails usando a API AngoHost
 */
export class EmailService {
  /**
   * Envia um email usando a edge function que utiliza a API AngoHost
   */
  static async sendEmail(emailData: EmailData): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('📧 Enviando email via EmailService...', {
        to: emailData.to,
        subject: emailData.subject,
        hasHtml: !!emailData.html,
        hasText: !!emailData.text
      });

      const { data, error } = await supabase.functions.invoke('send-real-email', {
        body: emailData
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw new Error(error.message);
      }

      if (!data || !data.success) {
        console.error('❌ Falha no envio do email:', data);
        throw new Error(data?.error || 'Falha no envio do email');
      }

      console.log('✅ Email enviado com sucesso!', data);
      return { success: true, message: data.message };

    } catch (error) {
      console.error('❌ Erro no EmailService:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Envia email de referência de pagamento
   */
  static async sendPaymentReferenceEmail(
    customerEmail: string, 
    customerName: string, 
    reference: string, 
    amount: number
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const formatCurrency = (value: number) => {
      return `KZ ${new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
      }).format(value)}`;
    };

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #0066cc;">
            <h2 style="margin: 0; color: #0066cc;">AngoHost</h2>
          </div>
          
          <div style="padding: 20px;">
            <p>Olá ${customerName},</p>
            
            <p>Sua referência de pagamento AppyPay foi gerada com sucesso!</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #0066cc;">Referência de Pagamento</h3>
              <p style="font-size: 24px; font-weight: bold; margin: 0; color: #333;">${reference}</p>
              <p style="margin: 10px 0 0 0; font-size: 18px; color: #666;">Valor: ${formatCurrency(amount)}</p>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">📱 Como pagar:</h4>
              <ol style="margin: 0; padding-left: 20px; color: #856404;">
                <li>Abra o aplicativo AppyPay no seu telemóvel</li>
                <li>Selecione "Pagar Serviços"</li>
                <li>Insira a referência: <strong>${reference}</strong></li>
                <li>Confirme o valor: <strong>${formatCurrency(amount)}</strong></li>
                <li>Complete o pagamento</li>
              </ol>
            </div>
            
            <p><strong>Importante:</strong> Após efetuar o pagamento, seu serviço será ativado automaticamente em alguns minutos.</p>
            
            <p>Se precisar de ajuda ou tiver alguma dúvida, entre em contato com nossa equipe de suporte respondendo a este email.</p>
            
            <p>Obrigado por escolher a AngoHost!</p>
            
            <p>Atenciosamente,<br>Equipe AngoHost</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} AngoHost. Todos os direitos reservados.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Referência de Pagamento AppyPay - ${reference}`,
      html
    });
  }
}