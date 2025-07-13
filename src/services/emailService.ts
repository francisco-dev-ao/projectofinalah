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
    <title>Dados de Pagamento - AngoHost</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                💳 Dados de Pagamento Gerados!
                            </h1>
                            <p style="margin: 15px 0 0 0; color: #e8e8e8; font-size: 16px; line-height: 1.5;">
                                Complete seu pagamento facilmente
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 25px 0; color: #333333; font-size: 18px; line-height: 1.6;">
                                Olá <strong>${customerName}</strong>! 👋
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.7;">
                                Os seus dados de pagamento foram gerados com sucesso! Utilize qualquer uma das opções abaixo para concluir o pagamento dos seus serviços AngoHost.
                            </p>
                            
                            <!-- Payment Reference Section -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f8f9fc 0%, #e8eaf6 100%); border-radius: 12px; margin: 30px 0; padding: 25px;">
                                <tr>
                                    <td>
                                        <h3 style="margin: 0 0 20px 0; color: #333333; font-size: 20px; font-weight: 600; text-align: center;">
                                            📱 Referência de Pagamento AppyPay
                                        </h3>
                                        
                                        <div style="background-color: rgba(102, 126, 234, 0.1); border-radius: 10px; padding: 25px; margin: 20px 0; text-align: center; border: 2px solid #667eea;">
                                            <p style="margin: 0 0 15px 0; color: #2c3e50; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                                Referência
                                            </p>
                                            <p style="margin: 0 0 20px 0; color: #2c3e50; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 32px; font-weight: bold; letter-spacing: 3px;">
                                                ${reference}
                                            </p>
                                            <p style="margin: 0; color: #27ae60; font-size: 24px; font-weight: 700;">
                                                ${formatCurrency(amount)}
                                            </p>
                                        </div>
                                        
                                        <div style="margin: 20px 0;">
                                            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                                <span style="display: inline-block; width: 30px; height: 30px; background-color: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; font-weight: bold;">1</span>
                                                <span style="color: #555555; font-size: 15px;">Abra o aplicativo <strong>AppyPay</strong> no seu telemóvel</span>
                                            </div>
                                            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                                <span style="display: inline-block; width: 30px; height: 30px; background-color: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; font-weight: bold;">2</span>
                                                <span style="color: #555555; font-size: 15px;">Selecione <strong>"Pagar Serviços"</strong></span>
                                            </div>
                                            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                                <span style="display: inline-block; width: 30px; height: 30px; background-color: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; font-weight: bold;">3</span>
                                                <span style="color: #555555; font-size: 15px;">Insira a referência: <strong>${reference}</strong></span>
                                            </div>
                                            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                                <span style="display: inline-block; width: 30px; height: 30px; background-color: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; font-weight: bold;">4</span>
                                                <span style="color: #555555; font-size: 15px;">Confirme o valor: <strong>${formatCurrency(amount)}</strong></span>
                                            </div>
                                            <div style="display: flex; align-items: center;">
                                                <span style="display: inline-block; width: 30px; height: 30px; background-color: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; font-weight: bold;">5</span>
                                                <span style="color: #555555; font-size: 15px;">Finalize o pagamento seguindo as instruções</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Multicaixa Alternative -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                <h4 style="margin: 0 0 15px 0; color: #856404; font-size: 18px; font-weight: 600;">
                                    🏦 Alternativa: Pagamento Multicaixa
                                </h4>
                                <div style="background-color: rgba(255, 193, 7, 0.1); border-radius: 6px; padding: 15px; margin: 15px 0;">
                                    <p style="margin: 0 0 10px 0; color: #856404; font-size: 15px;">
                                        <strong>Entidade:</strong> 11333 (AppyPay)
                                    </p>
                                    <p style="margin: 0 0 10px 0; color: #856404; font-size: 15px;">
                                        <strong>Referência:</strong> ${reference}
                                    </p>
                                    <p style="margin: 0; color: #856404; font-size: 15px;">
                                        <strong>Valor:</strong> ${formatCurrency(amount)}
                                    </p>
                                </div>
                                <ol style="margin: 0; padding-left: 20px; color: #856404; font-size: 15px; line-height: 1.8;">
                                    <li>Acesse seu homebanking ou dirija-se a um balcão do banco</li>
                                    <li>Selecione "Pagamento de Serviços" → "Multicaixa"</li>
                                    <li>Insira a <strong>Entidade: 11333</strong></li>
                                    <li>Insira a <strong>Referência: ${reference}</strong></li>
                                    <li>Confirme o <strong>Valor: ${formatCurrency(amount)}</strong></li>
                                    <li>Efetue o pagamento e guarde o comprovativo</li>
                                </ol>
                            </div>
                            
                            <!-- Important Info Section -->
                            <div style="background-color: #d1ecf1; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                                <h4 style="margin: 0 0 15px 0; color: #0c5460; font-size: 18px; font-weight: 600;">
                                    ⏰ Informações Importantes
                                </h4>
                                <div style="color: #0c5460; font-size: 15px; line-height: 1.8; text-align: left;">
                                    ✅ <strong>Validade:</strong> Esta referência é válida por <strong>72 horas</strong><br>
                                    🚀 <strong>Ativação:</strong> Serviços ativados automaticamente em até <strong>30 minutos</strong><br>
                                    📄 <strong>Comprovativo:</strong> Guarde sempre o comprovativo de pagamento<br>
                                    💬 <strong>Suporte:</strong> Para dúvidas, responda este email ou acesse nosso chat
                                </div>
                            </div>
                            
                            <p style="margin: 30px 0 20px 0; color: #555555; font-size: 16px; line-height: 1.7;">
                                Agradecemos a sua confiança nos nossos serviços. A equipe AngoHost está sempre disponível para ajudá-lo.
                            </p>
                            
                            <p style="margin: 20px 0 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Atenciosamente,<br>
                                <strong>Equipa AngoHost</strong><br>
                                <em>Seu parceiro digital em Angola</em>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fc; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; font-weight: 600;">
                                AngoHost - Soluções Digitais para Angola
                            </p>
                            <p style="margin: 0 0 15px 0; color: #888888; font-size: 13px;">
                                Hospedagem • Domínios • Email • Suporte Técnico
                            </p>
                            <div style="margin: 15px 0;">
                                <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Site</a>
                                <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Suporte</a>
                                <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Contacto</a>
                            </div>
                            <p style="margin: 15px 0 0 0; color: #aaaaaa; font-size: 12px;">
                                © ${new Date().getFullYear()} AngoHost - Todos os direitos reservados
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Anti-spam footer -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; margin-top: 15px;">
                    <tr>
                        <td style="text-align: center; padding: 10px;">
                            <p style="margin: 0; color: #aaaaaa; font-size: 11px; line-height: 1.4;">
                                Recebeu este email porque solicitou serviços da AngoHost. Para suporte, responda diretamente a este email.
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
Olá ${customerName}!

Dados de Pagamento Gerados! 💳

Os seus dados de pagamento foram gerados com sucesso! Utilize qualquer uma das opções abaixo para concluir o pagamento dos seus serviços AngoHost.

📱 REFERÊNCIA DE PAGAMENTO APPYPAY:
Referência: ${reference}
Valor: ${formatCurrency(amount)}

COMO PAGAR VIA APPYPAY:
1. Abra o aplicativo AppyPay no seu telemóvel
2. Selecione "Pagar Serviços"
3. Insira a referência: ${reference}
4. Confirme o valor: ${formatCurrency(amount)}
5. Finalize o pagamento seguindo as instruções

🏦 ALTERNATIVA: PAGAMENTO MULTICAIXA
Entidade: 11333 (AppyPay)
Referência: ${reference}
Valor: ${formatCurrency(amount)}

INSTRUÇÕES MULTICAIXA:
1. Acesse seu homebanking ou dirija-se a um balcão do banco
2. Selecione "Pagamento de Serviços" → "Multicaixa"
3. Insira a Entidade: 11333
4. Insira a Referência: ${reference}
5. Confirme o Valor: ${formatCurrency(amount)}
6. Efetue o pagamento e guarde o comprovativo

⏰ INFORMAÇÕES IMPORTANTES:
✅ Validade: Esta referência é válida por 72 horas
🚀 Ativação: Serviços ativados automaticamente em até 30 minutos
📄 Comprovativo: Guarde sempre o comprovativo de pagamento
💬 Suporte: Para dúvidas, responda este email ou acesse nosso chat

Agradecemos a sua confiança nos nossos serviços!

Atenciosamente,
Equipa AngoHost
Seu parceiro digital em Angola
`;

    return this.sendEmail({
      from: 'pagamentos@angohost.ao',
      to: customerEmail,
      subject: `Dados de Pagamento Disponíveis - Serviços AngoHost`,
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
   * Envia email de boas-vindas para novos usuários
   */
  static async sendWelcomeEmail(
    customerEmail: string,
    customerName: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo à AngoHost</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
              <tr>
                  <td align="center" style="padding: 20px 0;">
                      <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                          <!-- Header -->
                          <tr>
                              <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                      🎉 Bem-vindo à AngoHost!
                                  </h1>
                                  <p style="margin: 15px 0 0 0; color: #e8e8e8; font-size: 16px; line-height: 1.5;">
                                      Sua jornada digital começa aqui
                                  </p>
                              </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                              <td style="padding: 40px 30px;">
                                  <p style="margin: 0 0 25px 0; color: #333333; font-size: 18px; line-height: 1.6;">
                                      Olá <strong>${customerName}</strong>! 👋
                                  </p>
                                  
                                  <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.7;">
                                      É com grande satisfação que damos as boas-vindas à <strong>AngoHost</strong>! 
                                      Sua conta foi criada com sucesso e você agora faz parte da nossa comunidade de clientes.
                                  </p>
                                  
                                  <!-- Features Section -->
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f8f9fc 0%, #e8eaf6 100%); border-radius: 12px; margin: 30px 0; padding: 25px;">
                                      <tr>
                                          <td>
                                              <h3 style="margin: 0 0 20px 0; color: #333333; font-size: 20px; font-weight: 600; text-align: center;">
                                                  O que você pode fazer agora:
                                              </h3>
                                              
                                              <div style="margin: 20px 0;">
                                                  <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                                      <span style="display: inline-block; width: 30px; height: 30px; background-color: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; font-weight: bold;">🌐</span>
                                                      <span style="color: #555555; font-size: 15px;">Registrar e gerir domínios .ao e internacionais</span>
                                                  </div>
                                                  <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                                      <span style="display: inline-block; width: 30px; height: 30px; background-color: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; font-weight: bold;">🚀</span>
                                                      <span style="color: #555555; font-size: 15px;">Contratar planos de hospedagem profissional</span>
                                                  </div>
                                                  <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                                      <span style="display: inline-block; width: 30px; height: 30px; background-color: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; font-weight: bold;">📧</span>
                                                      <span style="color: #555555; font-size: 15px;">Configurar contas de email profissionais</span>
                                                  </div>
                                                  <div style="display: flex; align-items: center;">
                                                      <span style="display: inline-block; width: 30px; height: 30px; background-color: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; font-weight: bold;">💼</span>
                                                      <span style="color: #555555; font-size: 15px;">Acessar suporte técnico especializado</span>
                                                  </div>
                                              </div>
                                          </td>
                                      </tr>
                                  </table>
                                  
                                  <!-- Next Steps -->
                                  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                      <h4 style="margin: 0 0 15px 0; color: #856404; font-size: 18px; font-weight: 600;">
                                          📝 Próximos Passos:
                                      </h4>
                                      <ol style="margin: 0; padding-left: 20px; color: #856404; font-size: 15px; line-height: 1.8;">
                                          <li>Confirme seu email clicando no link de verificação que enviamos</li>
                                          <li>Complete seu perfil na área do cliente</li>
                                          <li>Explore nossos serviços e faça seu primeiro pedido</li>
                                          <li>Entre em contacto conosco se precisar de ajuda</li>
                                      </ol>
                                  </div>
                                  
                                  <!-- Support Section -->
                                  <div style="background-color: #d1ecf1; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                                      <h4 style="margin: 0 0 15px 0; color: #0c5460; font-size: 18px; font-weight: 600;">
                                          🤝 Precisa de Ajuda?
                                      </h4>
                                      <p style="margin: 0 0 15px 0; color: #0c5460; font-size: 15px; line-height: 1.6;">
                                          Nossa equipe está pronta para ajudá-lo. Entre em contacto através dos canais abaixo:
                                      </p>
                                      <div style="color: #0c5460; font-size: 14px;">
                                          📧 <strong>Email:</strong> support@angohost.ao<br>
                                          📞 <strong>Telefone:</strong> +244 999 999 999<br>
                                          💬 <strong>Chat Online:</strong> Disponível no site
                                      </div>
                                  </div>
                                  
                                  <p style="margin: 30px 0 20px 0; color: #555555; font-size: 16px; line-height: 1.7;">
                                      Obrigado por escolher a AngoHost como seu parceiro tecnológico. 
                                      Estamos ansiosos para ajudá-lo a alcançar seus objetivos digitais!
                                  </p>
                                  
                                  <p style="margin: 20px 0 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                      Atenciosamente,<br>
                                      <strong>Equipa AngoHost</strong><br>
                                      <em>Seu parceiro digital em Angola</em>
                                  </p>
                              </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                              <td style="background-color: #f8f9fc; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                                  <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; font-weight: 600;">
                                      AngoHost - Soluções Digitais para Angola
                                  </p>
                                  <p style="margin: 0 0 15px 0; color: #888888; font-size: 13px;">
                                      Hospedagem • Domínios • Email • Suporte Técnico
                                  </p>
                                  <div style="margin: 15px 0;">
                                      <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Site</a>
                                      <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Suporte</a>
                                      <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Contacto</a>
                                  </div>
                                  <p style="margin: 15px 0 0 0; color: #aaaaaa; font-size: 12px;">
                                      © ${new Date().getFullYear()} AngoHost - Todos os direitos reservados
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `;

    const textContent = `
Olá ${customerName}!

Bem-vindo à AngoHost! 🎉

É com grande satisfação que damos as boas-vindas! Sua conta foi criada com sucesso e você agora faz parte da nossa comunidade.

O QUE VOCÊ PODE FAZER AGORA:
🌐 Registrar e gerir domínios .ao e internacionais
🚀 Contratar planos de hospedagem profissional  
📧 Configurar contas de email profissionais
💼 Acessar suporte técnico especializado

PRÓXIMOS PASSOS:
1. Confirme seu email clicando no link de verificação
2. Complete seu perfil na área do cliente
3. Explore nossos serviços e faça seu primeiro pedido
4. Entre em contacto conosco se precisar de ajuda

PRECISA DE AJUDA?
📧 Email: support@angohost.ao
📞 Telefone: +244 999 999 999
💬 Chat Online: Disponível no site

Obrigado por escolher a AngoHost como seu parceiro tecnológico!

Atenciosamente,
Equipa AngoHost
Seu parceiro digital em Angola
    `;

    return this.sendEmail({
      from: 'noreply@angohost.ao',
      to: customerEmail,
      subject: `🎉 Bem-vindo à AngoHost, ${customerName}! Sua conta foi criada`,
      html,
      text: textContent
    });
  }

  /**
   * Envia email de confirmação de pagamento recebido
   */
  static async sendPaymentConfirmationEmail(
    customerEmail: string,
    customerName: string,
    orderId: string,
    amount: number,
    paymentMethod: string = 'AppyPay'
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
          <title>Pagamento Confirmado - AngoHost</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
              <tr>
                  <td align="center" style="padding: 20px 0;">
                      <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                          <!-- Header -->
                          <tr>
                              <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center;">
                                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                      ✅ Pagamento Confirmado!
                                  </h1>
                                  <p style="margin: 15px 0 0 0; color: #e8f5e8; font-size: 16px; line-height: 1.5;">
                                      Seu pagamento foi processado com sucesso
                                  </p>
                              </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                              <td style="padding: 40px 30px;">
                                  <p style="margin: 0 0 25px 0; color: #333333; font-size: 18px; line-height: 1.6;">
                                      Olá <strong>${customerName}</strong>! 🎉
                                  </p>
                                  
                                  <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.7;">
                                      Confirmamos o recebimento do seu pagamento. Seus serviços serão ativados automaticamente em breve.
                                  </p>
                                  
                                  <!-- Payment Details -->
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f8f9fc 0%, #e8f5e8 100%); border-radius: 12px; margin: 30px 0; padding: 25px;">
                                      <tr>
                                          <td>
                                              <h3 style="margin: 0 0 20px 0; color: #333333; font-size: 20px; font-weight: 600; text-align: center;">
                                                  📋 Detalhes do Pagamento
                                              </h3>
                                              
                                              <div style="margin: 20px 0;">
                                                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #ddd;">
                                                      <span style="color: #555555; font-weight: 600;">Pedido:</span>
                                                      <span style="color: #333333; font-family: monospace;">#${orderId.substring(0, 8)}</span>
                                                  </div>
                                                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #ddd;">
                                                      <span style="color: #555555; font-weight: 600;">Valor Pago:</span>
                                                      <span style="color: #28a745; font-weight: bold; font-size: 18px;">${formatCurrency(amount)}</span>
                                                  </div>
                                                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #ddd;">
                                                      <span style="color: #555555; font-weight: 600;">Método:</span>
                                                      <span style="color: #333333;">${paymentMethod}</span>
                                                  </div>
                                                  <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                                                      <span style="color: #555555; font-weight: 600;">Data:</span>
                                                      <span style="color: #333333;">${new Date().toLocaleDateString('pt-AO')}</span>
                                                  </div>
                                              </div>
                                          </td>
                                      </tr>
                                  </table>
                                  
                                  <!-- Next Steps -->
                                  <div style="background-color: #d1ecf1; border-left: 4px solid #0dcaf0; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                      <h4 style="margin: 0 0 15px 0; color: #0c5460; font-size: 18px; font-weight: 600;">
                                          🚀 Próximos Passos:
                                      </h4>
                                      <ul style="margin: 0; padding-left: 20px; color: #0c5460; font-size: 15px; line-height: 1.8;">
                                          <li>Seus serviços serão ativados automaticamente</li>
                                          <li>Receberá um email com os detalhes de acesso</li>
                                          <li>Pode acompanhar o status na área do cliente</li>
                                          <li>Nossa equipe está disponível para suporte</li>
                                      </ul>
                                  </div>
                                  
                                  <p style="margin: 30px 0 20px 0; color: #555555; font-size: 16px; line-height: 1.7;">
                                      Obrigado por escolher a AngoHost. Estamos comprometidos em oferecer o melhor serviço!
                                  </p>
                                  
                                  <p style="margin: 20px 0 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                      Atenciosamente,<br>
                                      <strong>Equipa AngoHost</strong>
                                  </p>
                              </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                              <td style="background-color: #f8f9fc; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                                  <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                                      📧 support@angohost.ao • 📞 +244 999 999 999
                                  </p>
                                  <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                                      © ${new Date().getFullYear()} AngoHost - Todos os direitos reservados
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `;

    const textContent = `
Olá ${customerName}!

✅ PAGAMENTO CONFIRMADO!

Confirmamos o recebimento do seu pagamento. Seus serviços serão ativados automaticamente em breve.

DETALHES DO PAGAMENTO:
Pedido: #${orderId.substring(0, 8)}
Valor Pago: ${formatCurrency(amount)}
Método: ${paymentMethod}
Data: ${new Date().toLocaleDateString('pt-AO')}

PRÓXIMOS PASSOS:
- Seus serviços serão ativados automaticamente
- Receberá um email com os detalhes de acesso
- Pode acompanhar o status na área do cliente
- Nossa equipe está disponível para suporte

Obrigado por escolher a AngoHost!

Atenciosamente,
Equipa AngoHost
    `;

    return this.sendEmail({
      from: 'pagamentos@angohost.ao',
      to: customerEmail,
      subject: `✅ Pagamento Confirmado - Pedido #${orderId.substring(0, 8)} | AngoHost`,
      html,
      text: textContent
    });
  }

  /**
   * Envia email de aviso de fatura em atraso
   */
  static async sendOverdueInvoiceEmail(
    customerEmail: string,
    customerName: string,
    invoiceNumber: string,
    amount: number,
    daysPastDue: number
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
          <title>Fatura em Atraso - AngoHost</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
              <tr>
                  <td align="center" style="padding: 20px 0;">
                      <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                          <!-- Header -->
                          <tr>
                              <td style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 30px; text-align: center;">
                                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                      ⚠️ Fatura em Atraso
                                  </h1>
                                  <p style="margin: 15px 0 0 0; color: #ffe6e6; font-size: 16px; line-height: 1.5;">
                                      Pagamento pendente há ${daysPastDue} dias
                                  </p>
                              </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                              <td style="padding: 40px 30px;">
                                  <p style="margin: 0 0 25px 0; color: #333333; font-size: 18px; line-height: 1.6;">
                                      Prezado(a) <strong>${customerName}</strong>,
                                  </p>
                                  
                                  <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.7;">
                                      Detectamos que sua fatura está em atraso há <strong>${daysPastDue} dias</strong>. 
                                      Para evitar a suspensão dos serviços, proceda ao pagamento o mais breve possível.
                                  </p>
                                  
                                  <!-- Invoice Details -->
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff5f5; border: 2px solid #fed7d7; border-radius: 12px; margin: 30px 0; padding: 25px;">
                                      <tr>
                                          <td>
                                              <h3 style="margin: 0 0 20px 0; color: #c53030; font-size: 20px; font-weight: 600; text-align: center;">
                                                  🧾 Detalhes da Fatura
                                              </h3>
                                              
                                              <div style="margin: 20px 0;">
                                                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #fed7d7;">
                                                      <span style="color: #555555; font-weight: 600;">Fatura:</span>
                                                      <span style="color: #c53030; font-weight: bold; font-family: monospace;">#${invoiceNumber}</span>
                                                  </div>
                                                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #fed7d7;">
                                                      <span style="color: #555555; font-weight: 600;">Valor:</span>
                                                      <span style="color: #c53030; font-weight: bold; font-size: 18px;">${formatCurrency(amount)}</span>
                                                  </div>
                                                  <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                                                      <span style="color: #555555; font-weight: 600;">Dias em Atraso:</span>
                                                      <span style="color: #c53030; font-weight: bold;">${daysPastDue} dias</span>
                                                  </div>
                                              </div>
                                          </td>
                                      </tr>
                                  </table>
                                  
                                  <!-- Warning -->
                                  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                      <h4 style="margin: 0 0 15px 0; color: #856404; font-size: 18px; font-weight: 600;">
                                          ⚠️ IMPORTANTE:
                                      </h4>
                                      <p style="margin: 0; color: #856404; font-size: 15px; line-height: 1.8;">
                                          Caso o pagamento não seja efetuado em <strong>7 dias</strong>, seus serviços poderão ser suspensos automaticamente. 
                                          Para evitar interrupções, recomendamos que proceda ao pagamento imediatamente.
                                      </p>
                                  </div>
                                  
                                  <!-- Support -->
                                  <div style="background-color: #d1ecf1; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                                      <h4 style="margin: 0 0 15px 0; color: #0c5460; font-size: 18px; font-weight: 600;">
                                          💬 Precisa de Ajuda?
                                      </h4>
                                      <p style="margin: 0 0 15px 0; color: #0c5460; font-size: 15px; line-height: 1.6;">
                                          Se tiver dificuldades com o pagamento ou questões sobre a fatura, entre em contacto conosco:
                                      </p>
                                      <div style="color: #0c5460; font-size: 14px;">
                                          📧 <strong>Email:</strong> support@angohost.ao<br>
                                          📞 <strong>Telefone:</strong> +244 999 999 999
                                      </div>
                                  </div>
                                  
                                  <p style="margin: 30px 0 20px 0; color: #555555; font-size: 16px; line-height: 1.7;">
                                      Agradecemos a sua compreensão e aguardamos a regularização da situação.
                                  </p>
                                  
                                  <p style="margin: 20px 0 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                      Atenciosamente,<br>
                                      <strong>Equipa AngoHost</strong>
                                  </p>
                              </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                              <td style="background-color: #f8f9fc; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                                  <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                                      © ${new Date().getFullYear()} AngoHost - Todos os direitos reservados
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      from: 'billing@angohost.ao',
      to: customerEmail,
      subject: `⚠️ Fatura #${invoiceNumber} em atraso há ${daysPastDue} dias | AngoHost`,
      html
    });
  }

  /**
   * Envia notificação para admin sobre novo ticket
   */
  static async sendAdminTicketNotification(
    adminEmail: string,
    customerName: string,
    customerEmail: string,
    ticketId: string,
    subject: string,
    priority: string = 'Média'
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Novo Ticket de Suporte - AngoHost</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
              <tr>
                  <td align="center" style="padding: 20px 0;">
                      <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                          <!-- Header -->
                          <tr>
                              <td style="background: linear-gradient(135deg, #6f42c1 0%, #007bff 100%); padding: 30px; text-align: center;">
                                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                                      🎫 Novo Ticket de Suporte
                                  </h1>
                                  <p style="margin: 10px 0 0 0; color: #e8e8e8; font-size: 14px;">
                                      Sistema de Suporte AngoHost
                                  </p>
                              </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                              <td style="padding: 30px;">
                                  <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                                      Um novo ticket de suporte foi criado no sistema.
                                  </p>
                                  
                                  <!-- Ticket Details -->
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fc; border-radius: 8px; margin: 20px 0; padding: 20px;">
                                      <tr>
                                          <td>
                                              <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">Detalhes do Ticket:</h3>
                                              
                                              <div style="margin: 10px 0;">
                                                  <strong>ID:</strong> #${ticketId}<br>
                                                  <strong>Cliente:</strong> ${customerName}<br>
                                                  <strong>Email:</strong> ${customerEmail}<br>
                                                  <strong>Assunto:</strong> ${subject}<br>
                                                  <strong>Prioridade:</strong> <span style="color: ${priority === 'Alta' ? '#dc3545' : priority === 'Média' ? '#ffc107' : '#28a745'};">${priority}</span><br>
                                                  <strong>Data:</strong> ${new Date().toLocaleString('pt-AO')}
                                              </div>
                                          </td>
                                      </tr>
                                  </table>
                                  
                                  <div style="text-align: center; margin: 30px 0;">
                                      <a href="${process.env.NODE_ENV === 'production' ? 'https://angohost.ao' : 'http://localhost:3000'}/admin/tickets/${ticketId}" 
                                         style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                          Ver Ticket
                                      </a>
                                  </div>
                                  
                                  <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px;">
                                      Acesse o painel administrativo para responder ao cliente.
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      from: 'system@angohost.ao',
      to: adminEmail,
      subject: `🎫 Novo Ticket #${ticketId} - ${subject}`,
      html
    });
  }

  /**
   * Envia email de confirmação de atualização de dados
   */
  static async sendDataUpdateConfirmationEmail(
    customerEmail: string,
    customerName: string,
    updatedFields: string[]
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const fieldsList = updatedFields.map(field => `<li>${field}</li>`).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Dados Atualizados - AngoHost</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
              <tr>
                  <td align="center" style="padding: 20px 0;">
                      <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                          <!-- Header -->
                          <tr>
                              <td style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); padding: 30px; text-align: center;">
                                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                                      🔄 Dados Atualizados
                                  </h1>
                                  <p style="margin: 10px 0 0 0; color: #e8f4f8; font-size: 14px;">
                                      Confirmação de Alteração
                                  </p>
                              </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                              <td style="padding: 30px;">
                                  <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                                      Olá <strong>${customerName}</strong>,
                                  </p>
                                  
                                  <p style="margin: 0 0 20px 0; color: #555555; font-size: 15px;">
                                      Confirmamos que os seguintes dados da sua conta foram atualizados com sucesso:
                                  </p>
                                  
                                  <div style="background-color: #d1ecf1; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                      <h4 style="margin: 0 0 10px 0; color: #0c5460;">Campos Alterados:</h4>
                                      <ul style="margin: 0; color: #0c5460;">${fieldsList}</ul>
                                  </div>
                                  
                                  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                      <p style="margin: 0; color: #856404; font-size: 14px;">
                                          <strong>⚠️ Importante:</strong> Se você não fez essas alterações, entre em contacto conosco imediatamente através do email support@angohost.ao
                                      </p>
                                  </div>
                                  
                                  <p style="margin: 20px 0; color: #555555; font-size: 15px;">
                                      Data da alteração: <strong>${new Date().toLocaleString('pt-AO')}</strong>
                                  </p>
                                  
                                  <p style="margin: 20px 0 0 0; color: #333333; font-size: 15px;">
                                      Atenciosamente,<br>
                                      <strong>Equipa AngoHost</strong>
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      from: 'security@angohost.ao',
      to: customerEmail,
      subject: `🔄 Dados da conta atualizados | AngoHost`,
      html
    });
  }

  /**
   * Envia código de verificação de identidade
   */
  static async sendVerificationCodeEmail(
    customerEmail: string,
    customerName: string,
    verificationCode: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Verificação - AngoHost</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
              <tr>
                  <td align="center" style="padding: 20px 0;">
                      <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                          <!-- Header -->
                          <tr>
                              <td style="background: linear-gradient(135deg, #fd7e14 0%, #e55100 100%); padding: 30px; text-align: center;">
                                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                                      🔐 Código de Verificação
                                  </h1>
                                  <p style="margin: 10px 0 0 0; color: #fff3e0; font-size: 14px;">
                                      Verificação de Identidade
                                  </p>
                              </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                              <td style="padding: 30px; text-align: center;">
                                  <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                                      Olá <strong>${customerName}</strong>,
                                  </p>
                                  
                                  <p style="margin: 0 0 30px 0; color: #555555; font-size: 15px;">
                                      Use o código abaixo para verificar sua identidade:
                                  </p>
                                  
                                  <!-- Verification Code -->
                                  <div style="background: linear-gradient(135deg, #fd7e14 0%, #e55100 100%); border-radius: 12px; padding: 30px; margin: 30px 0;">
                                      <div style="background-color: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 20px;">
                                          <p style="margin: 0; color: #ffffff; font-family: 'Monaco', 'Menlo', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px;">
                                              ${verificationCode}
                                          </p>
                                      </div>
                                  </div>
                                  
                                  <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: left;">
                                      <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Instruções Importantes:</h4>
                                      <ul style="margin: 0; color: #856404; font-size: 14px;">
                                          <li>Este código expira em <strong>10 minutos</strong></li>
                                          <li>Use apenas uma vez</li>
                                          <li>Não compartilhe com terceiros</li>
                                          <li>Se não solicitou, ignore este email</li>
                                      </ul>
                                  </div>
                                  
                                  <p style="margin: 20px 0 0 0; color: #333333; font-size: 15px;">
                                      Atenciosamente,<br>
                                      <strong>Equipa AngoHost</strong>
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      from: 'security@angohost.ao',
      to: customerEmail,
      subject: `🔐 Código de verificação: ${verificationCode} | AngoHost`,
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