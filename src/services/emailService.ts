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
  private static readonly API_KEY = 'SUA_CHAVE_SECRETA'; // TODO: Configurar chave real da API

  /**
   * Envia um email usando a API AngoHost diretamente
   */
  static async sendEmail(emailData: EmailData): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Verificar se a chave da API está configurada
      if (this.API_KEY === 'SUA_CHAVE_SECRETA') {
        console.error('❌ Chave da API de email não configurada');
        return {
          success: false,
          error: 'Chave da API de email não configurada. Configure a chave real no EmailService.'
        };
      }

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

  /**
   * Envia email de teste para configuração SMTP
   */
  static async sendTestEmail(testEmail: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #0066cc;">
            <h2 style="margin: 0; color: #0066cc;">AngoHost - Teste de Email</h2>
          </div>
          
          <div style="padding: 20px;">
            <h3 style="color: #0066cc;">✅ Configuração de Email Funcionando!</h3>
            
            <p>Parabéns! Sua configuração de email está funcionando corretamente.</p>
            
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #155724;"><strong>Este é um email de teste enviado em:</strong></p>
              <p style="margin: 5px 0 0 0; color: #155724;">${new Date().toLocaleString('pt-AO')}</p>
            </div>
            
            <p>Agora você pode:</p>
            <ul>
              <li>Enviar faturas por email automaticamente</li>
              <li>Notificar clientes sobre novos pedidos</li>
              <li>Enviar confirmações de pagamento</li>
            </ul>
            
            <p>Se você recebeu este email, significa que o sistema está pronto para enviar emails para seus clientes.</p>
            
            <p>Atenciosamente,<br>Sistema AngoHost</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} AngoHost. Sistema de gestão integrado.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: testEmail,
      subject: 'Teste de Configuração Email - AngoHost',
      html
    });
  }

  /**
   * Envia email de confirmação de pedido
   */
  static async sendOrderConfirmationEmail(
    customerEmail: string,
    customerName: string,
    orderId: string,
    orderData?: any
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const formatCurrency = (value: number) => {
      return `KZ ${new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
      }).format(value)}`;
    };

    const orderItems = orderData?.order_items || [];
    const itemsList = orderItems.map((item: any) => 
      `<li>${item.name} - ${formatCurrency(item.unit_price)} × ${item.quantity} = ${formatCurrency(item.unit_price * item.quantity)}</li>`
    ).join('');

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #0066cc;">
            <h2 style="margin: 0; color: #0066cc;">AngoHost</h2>
          </div>
          
          <div style="padding: 20px;">
            <p>Olá ${customerName},</p>
            
            <p>Obrigado por escolher a AngoHost! Seu pedido <strong>#${orderId.substring(0, 8)}</strong> foi confirmado com sucesso.</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
              <p><strong>Detalhes do Pedido:</strong></p>
              <p>Número: ${orderId.substring(0, 8)}</p>
              <p>Data: ${new Date().toLocaleDateString('pt-AO')}</p>
              <p>Status: Confirmado</p>
              
              ${itemsList ? `<p><strong>Itens:</strong></p><ul>${itemsList}</ul>` : ''}
              
              ${orderData?.total_amount ? `<p><strong>Total: ${formatCurrency(orderData.total_amount)}</strong></p>` : ''}
            </div>
            
            <p>Em breve você receberá as instruções de pagamento e ativação dos seus serviços.</p>
            
            <p>Se você tiver alguma dúvida, entre em contato com nossa equipe de suporte respondendo a este email.</p>
            
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
      subject: `Confirmação de Pedido #${orderId.substring(0, 8)} - AngoHost`,
      html
    });
  }
}