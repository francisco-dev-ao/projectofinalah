import { toast } from "sonner";

/**
 * Send payment reference email using AngoHost API directly
 */
export const sendPaymentReferenceEmail = async (
  customerEmail: string,
  customerName: string,
  entity: string,
  reference: string,
  amount: string,
  description: string,
  validityDate: string,
  instructions: string[],
  orderData?: any
): Promise<{ success: boolean }> => {
  try {
    console.log('📧 Sending payment reference email to:', customerEmail);

    // Create professional email HTML template
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dados de Pagamento Disponíveis - Ref: ${reference} - AngoHost</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
          line-height: 1.6; 
          color: #1a202c; 
          background: #f7fafc;
          padding: 20px 0;
        }
        .email-container { 
          max-width: 680px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        /* Header com gradiente profissional */
        .email-header { 
          background: linear-gradient(135deg, #16a085 0%, #2ecc71 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center;
          position: relative;
        }
        .email-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
          opacity: 0.3;
        }
        .email-header * { position: relative; z-index: 1; }
        
        .header-icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .company-logo { 
          font-size: 32px; 
          font-weight: 800; 
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .header-subtitle { 
          font-size: 18px; 
          opacity: 0.95;
          font-weight: 500;
        }
        .success-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          margin-top: 16px;
          font-size: 14px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }
        
        /* Conteúdo principal */
        .email-content { 
          padding: 40px 30px;
        }
        .greeting { 
          font-size: 20px; 
          font-weight: 600;
          margin-bottom: 16px; 
          color: #2d3748;
        }
        .intro-text {
          font-size: 16px;
          color: #4a5568;
          margin-bottom: 32px;
          line-height: 1.7;
        }
        
        /* Card de referência melhorado */
        .reference-card {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px;
          margin: 32px 0;
          position: relative;
          overflow: hidden;
        }
        .reference-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #16a085, #2ecc71);
        }
        
        .reference-title {
          font-size: 24px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 24px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        
        .payment-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        .detail-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        .detail-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #718096;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .detail-value {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
          font-family: 'Monaco', 'Menlo', monospace;
        }
        .amount-card {
          background: linear-gradient(135deg, #16a085 0%, #2ecc71 100%);
          color: white !important;
          grid-column: 1 / -1;
          text-align: center;
        }
        .amount-card .detail-label { color: rgba(255, 255, 255, 0.9); }
        .amount-card .detail-value { 
          color: white; 
          font-size: 28px;
          margin: 8px 0;
        }
        
        .payment-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 20px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 13px;
          font-weight: 600;
          color: #718096;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 15px;
          font-weight: 600;
          color: #2d3748;
        }
        
        /* Seção de instruções melhorada */
        .instructions-section {
          background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
          border: 1px solid #9ae6b4;
          border-radius: 16px;
          padding: 32px;
          margin: 32px 0;
          position: relative;
        }
        .instructions-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #48bb78, #38a169);
          border-radius: 16px 16px 0 0;
        }
        
        .instructions-title {
          font-size: 22px;
          font-weight: 700;
          color: #22543d;
          margin-bottom: 24px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        
        .instructions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .instruction-item {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #48bb78;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s ease;
        }
        .instruction-item:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .step-number {
          background: linear-gradient(135deg, #48bb78, #38a169);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3);
        }
        .step-text {
          font-size: 15px;
          color: #2d3748;
          font-weight: 500;
        }
        
        /* Seção de suporte */
        .support-section {
          background: #f7fafc;
          border-radius: 12px;
          padding: 24px;
          margin: 32px 0;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        .support-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 12px;
        }
        .support-text {
          color: #4a5568;
          margin-bottom: 16px;
        }
        .support-contact {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 12px 20px;
          border-radius: 8px;
          color: #16a085;
          text-decoration: none;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        
        /* Rodapé profissional */
        .email-footer {
          background: #1a202c;
          color: #e2e8f0;
          padding: 32px 30px;
          text-align: center;
        }
        .footer-company {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 12px;
          color: white;
        }
        .footer-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin: 20px 0;
          padding: 20px 0;
          border-top: 1px solid #2d3748;
          border-bottom: 1px solid #2d3748;
        }
        .footer-item {
          font-size: 14px;
          opacity: 0.9;
        }
        .footer-copyright {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 16px;
        }
        
        /* Responsivo */
        @media (max-width: 600px) {
          .email-container { margin: 0 10px; border-radius: 12px; }
          .email-content, .email-header, .email-footer { padding: 24px 20px; }
          .payment-details { grid-template-columns: 1fr; }
          .payment-info { grid-template-columns: 1fr; }
          .footer-details { grid-template-columns: 1fr; }
          .instruction-item { flex-direction: column; text-align: center; }
          .step-number { margin-bottom: 8px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header Profissional -->
        <div class="email-header">
          <div class="header-icon">
            <span style="font-size: 24px;">💳</span>
          </div>
          <div class="company-logo">AngoHost</div>
          <div class="header-subtitle">Prestação de Serviços, LDA</div>
          <div class="success-badge">
            <span style="font-size: 16px;">✅</span>
            <span>Referência Gerada com Sucesso</span>
          </div>
        </div>
        
        <!-- Conteúdo Principal -->
        <div class="email-content">
          <div class="greeting">Olá, ${customerName}!</div>
          <div class="intro-text">
            Sua referência de pagamento Multicaixa foi gerada com sucesso. 
            Utilize os dados abaixo para efetuar o pagamento de forma rápida e segura.
          </div>
          
          <!-- Card de Dados de Pagamento -->
          <div class="reference-card">
            <div class="reference-title">
              <span>💳</span>
              <span>Dados para Pagamento</span>
            </div>
            
            <div class="payment-details">
              <div class="detail-card">
                <div class="detail-label">Entidade</div>
                <div class="detail-value">${entity}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">Referência</div>
                <div class="detail-value">${reference}</div>
              </div>
              <div class="detail-card amount-card">
                <div class="detail-label">Valor a Pagar</div>
                <div class="detail-value">${amount} AOA</div>
              </div>
            </div>
            
            <div class="payment-info">
              <div class="info-item">
                <div class="info-label">Descrição</div>
                <div class="info-value">${description}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Válido até</div>
                <div class="info-value">${validityDate}</div>
              </div>
            </div>
          </div>
          
          <!-- Instruções de Pagamento -->
          <div class="instructions-section">
            <div class="instructions-title">
              <span>📋</span>
              <span>Como Efetuar o Pagamento</span>
            </div>
            
            <div class="instructions-list">
              ${instructions.map((step, index) => `
                <div class="instruction-item">
                  <div class="step-number">${index + 1}</div>
                  <div class="step-text">${step}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Seção de Suporte -->
          <div class="support-section">
            <div class="support-title">Precisa de Ajuda?</div>
            <div class="support-text">
              Após o pagamento, você receberá automaticamente a confirmação e a fatura final. 
              Para qualquer dúvida, nossa equipe está à disposição.
            </div>
            <a href="mailto:support@angohost.ao" class="support-contact">
              <span>📧</span>
              <span>Contatar Suporte</span>
            </a>
          </div>
        </div>
        
        <!-- Rodapé Profissional -->
        <div class="email-footer">
          <div class="footer-company">ANGOHOST - PRESTAÇÃO DE SERVIÇOS, LDA</div>
          <div class="footer-details">
            <div class="footer-item">
              <strong>Email:</strong><br>
              support@angohost.ao
            </div>
            <div class="footer-item">
              <strong>Telefone:</strong><br>
              +244 226 430 401
            </div>
            <div class="footer-item">
              <strong>Endereço:</strong><br>
              Cacuaco Sequele - Angola
            </div>
            <div class="footer-item">
              <strong>NIF:</strong><br>
              5000088927
            </div>
          </div>
          <div class="footer-copyright">
            © 2024 AngoHost. Todos os direitos reservados.<br>
            Este é um email automático, não responda a esta mensagem.
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send email using AngoHost API directly
    const emailPayload = {
      to: customerEmail,
      subject: `Dados de Pagamento Disponíveis - Ref: ${reference} - AngoHost`,
      html: emailHTML,
      from: 'noreply@angohost.ao'
    };

    console.log('📧 Enviando email via API AngoHost para:', customerEmail);

    const response = await fetch('https://mail3.angohost.ao/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API de email:', errorText);
      throw new Error(`Erro ao enviar email: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Email enviado com sucesso:', result);

    toast.success('Email enviado com sucesso!');
    return { success: true };
  } catch (error) {
    console.error('Error sending payment reference email:', error);
    toast.error('Erro ao enviar email: ' + (error as Error).message);
    return { success: false };
  }
};