interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

/**
 * Centralizado serviço de envio de emails usando a API AngoHost
 */
export class EmailService {
  private static readonly API_URL = 'https://mail3.angohost.ao/email/send';

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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailData.from || 'noreply@angohost.ao',
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
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Referência de Pagamento - AngoHost</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                                AngoHost
                            </h1>
                            <p style="margin: 8px 0 0 0; color: #e8e8e8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px;">
                                Soluções em Hosting e Domínios
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; line-height: 1.6;">
                                Prezado(a) <strong>${customerName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #555555; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; line-height: 1.6;">
                                A sua referência de pagamento AppyPay foi gerada com sucesso. Utilize os dados abaixo para concluir o seu pagamento:
                            </p>
                            
                            <!-- Payment Reference Box -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 30px; text-align: center;">
                                        <h2 style="margin: 0 0 15px 0; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 18px; font-weight: 600;">
                                            Referência de Pagamento
                                        </h2>
                                        <div style="background-color: rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 20px; margin: 15px 0;">
                                            <p style="margin: 0; color: #ffffff; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 32px; font-weight: bold; letter-spacing: 2px;">
                                                ${reference}
                                            </p>
                                        </div>
                                        <p style="margin: 15px 0 0 0; color: #e8e8e8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 20px; font-weight: 600;">
                                            Valor: ${formatCurrency(amount)}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Instructions -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fc; border-radius: 8px; border-left: 4px solid #667eea; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h3 style="margin: 0 0 15px 0; color: #333333; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 18px; font-weight: 600;">
                                            📱 Instruções de Pagamento
                                        </h3>
                                        <ol style="margin: 0; padding-left: 20px; color: #555555; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; line-height: 1.8;">
                                            <li>Abra o aplicativo <strong>AppyPay</strong> no seu dispositivo móvel</li>
                                            <li>Selecione a opção <strong>"Pagar Serviços"</strong></li>
                                            <li>Insira a referência: <strong style="color: #667eea;">${reference}</strong></li>
                                            <li>Confirme o valor: <strong style="color: #667eea;">${formatCurrency(amount)}</strong></li>
                                            <li>Finalize o pagamento seguindo as instruções no app</li>
                                        </ol>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 20px 0; color: #555555; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; line-height: 1.6;">
                                <strong>Importante:</strong> Após a confirmação do pagamento, os seus serviços serão ativados automaticamente dentro de alguns minutos.
                            </p>
                            
                            <p style="margin: 20px 0; color: #555555; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; line-height: 1.6;">
                                Para qualquer dúvida ou assistência, entre em contacto connosco através do email de suporte ou do nosso chat online.
                            </p>
                            
                            <p style="margin: 30px 0 0 0; color: #333333; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; line-height: 1.6;">
                                Obrigado por escolher a AngoHost!
                            </p>
                            
                            <p style="margin: 15px 0 0 0; color: #555555; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px;">
                                Atenciosamente,<br>
                                <strong>Equipa AngoHost</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fc; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0 0 10px 0; color: #888888; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px;">
                                Este email foi enviado automaticamente pelo sistema AngoHost
                            </p>
                            <p style="margin: 0; color: #aaaaaa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px;">
                                © ${new Date().getFullYear()} AngoHost - Todos os direitos reservados
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const textContent = `
Prezado(a) ${customerName},

A sua referência de pagamento AppyPay foi gerada com sucesso.

REFERÊNCIA: ${reference}
VALOR: ${formatCurrency(amount)}

INSTRUÇÕES DE PAGAMENTO:
1. Abra o aplicativo AppyPay no seu dispositivo móvel
2. Selecione "Pagar Serviços"
3. Insira a referência: ${reference}
4. Confirme o valor: ${formatCurrency(amount)}
5. Finalize o pagamento

Após a confirmação do pagamento, os seus serviços serão ativados automaticamente.

Obrigado por escolher a AngoHost!

Atenciosamente,
Equipa AngoHost
`;

    return this.sendEmail({
      from: 'pagamentos@angohost.ao',
      to: customerEmail,
      subject: `Referência de Pagamento AppyPay - ${reference} | AngoHost`,
      html,
      text: textContent
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