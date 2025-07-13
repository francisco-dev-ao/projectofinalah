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
  private static readonly API_URL = 'https://mail3.angohost.ao/email/send';
  private static readonly API_KEY = 'SUA_CHAVE_SECRETA'; // TODO: Configurar chave real

  /**
   * Envia um email usando a API AngoHost diretamente
   */
  static async sendEmail(emailData: EmailData): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('📧 Enviando email via API AngoHost...', {
        to: emailData.to,
        subject: emailData.subject,
        hasHtml: !!emailData.html,
        hasText: !!emailData.text
      });

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          ...(emailData.html && { html: emailData.html }),
          ...(emailData.text && { text: emailData.text })
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API AngoHost:', response.status, errorText);
        throw new Error(`Erro na API de email: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Email enviado com sucesso via API AngoHost!', result);
      
      return { 
        success: true, 
        message: 'Email enviado com sucesso'
      };

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

  /**
   * Envia email de fatura
   */
  static async sendInvoiceEmail(
    customerEmail: string,
    customerName: string,
    invoiceNumber: string,
    amount: number,
    dueDate: string,
    invoiceUrl: string,
    items?: Array<{ name: string; quantity: number; unit_price: number }>
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const formatCurrency = (value: number) => {
      return `KZ ${new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
      }).format(value)}`;
    };

    const itemsList = (items || []).map(item => 
      `<li>${item.name} - ${formatCurrency(item.unit_price)} × ${item.quantity}</li>`
    ).join('');

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #0066cc;">
            <h2 style="margin: 0; color: #0066cc;">AngoHost</h2>
          </div>
          
          <div style="padding: 20px;">
            <p>Olá ${customerName},</p>
            
            <p>Sua fatura <strong>#${invoiceNumber}</strong> foi gerada e está disponível para pagamento.</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
              <p><strong>Detalhes da Fatura:</strong></p>
              <p>Número: ${invoiceNumber}</p>
              <p>Data de Vencimento: ${new Date(dueDate).toLocaleDateString('pt-AO')}</p>
              <p>Total: ${formatCurrency(amount)}</p>
              
              ${itemsList ? `<p><strong>Itens:</strong></p><ul>${itemsList}</ul>` : ''}
            </div>
            
            <p>Você pode visualizar e pagar sua fatura através do nosso portal:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invoiceUrl}" style="background-color: #0066cc; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Visualizar Fatura</a>
            </div>
            
            <p>Se você tiver alguma dúvida, entre em contato com nossa equipe de suporte respondendo a este email ou através do nosso chat.</p>
            
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
      subject: `Fatura ${invoiceNumber} - AngoHost`,
      html
    });
  }
}