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

    // Format amount correctly (KZ with dots as thousand separators)
    const formatAmount = (amount) => {
      const numAmount = parseFloat(amount);
      return `KZ ${numAmount.toLocaleString('pt-AO').replace(/,/g, '.')}`;
    };

    // Create Hostinger-style professional email template
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          line-height: 1.6; 
          color: #333; 
          background: #f8f9fa;
          padding: 20px 0;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* Header estilo Hostinger */
        .header { 
          background: linear-gradient(135deg, #673ab7 0%, #9c27b0 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center;
        }
        .logo { 
          font-size: 28px; 
          font-weight: 700; 
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .subtitle { 
          font-size: 16px;
          opacity: 0.9;
          font-weight: 400;
        }
        
        /* Conteúdo */
        .content { 
          padding: 40px 30px;
        }
        .greeting { 
          font-size: 24px; 
          font-weight: 600;
          margin-bottom: 16px; 
          color: #1a1a1a;
        }
        .intro { 
          font-size: 16px;
          color: #666;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        
        /* Card principal estilo Hostinger */
        .payment-card {
          background: #f8f9ff;
          border: 2px solid #e3e6ff;
          border-radius: 12px;
          padding: 32px;
          margin: 32px 0;
          position: relative;
        }
        .payment-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #673ab7, #9c27b0);
          border-radius: 12px 12px 0 0;
        }
        
        .card-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 24px;
          text-align: center;
        }
        
        /* Dados de pagamento estilo limpo */
        .payment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .payment-item {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .payment-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #8b949e;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .payment-value {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }
        
        /* Valor em destaque */
        .amount-highlight {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, #673ab7 0%, #9c27b0 100%);
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .amount-highlight::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }
        .amount-highlight .payment-label { 
          color: rgba(255, 255, 255, 0.8); 
        }
        .amount-highlight .payment-value { 
          color: white; 
          font-size: 24px;
          font-weight: 800;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        /* Info adicional */
        .additional-info {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 20px;
          margin-top: 16px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 13px;
          font-weight: 600;
          color: #8b949e;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
        }
        
        /* Instruções estilo Hostinger */
        .instructions {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 12px;
          padding: 32px;
          margin: 32px 0;
        }
        .instructions-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 24px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #673ab7;
        }
        .step-number {
          background: #673ab7;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }
        .step-text {
          font-size: 15px;
          color: #1a1a1a;
          line-height: 1.5;
        }
        
        /* Call to action */
        .cta-section {
          background: linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%);
          border: 1px solid #b3d9ff;
          border-radius: 12px;
          padding: 24px;
          margin: 32px 0;
          text-align: center;
        }
        .cta-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .cta-text {
          font-size: 14px;
          color: #666;
          margin-bottom: 16px;
        }
        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #673ab7;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .cta-button:hover {
          background: #5e35b1;
          transform: translateY(-1px);
        }
        
        /* Footer estilo Hostinger */
        .footer {
          background: #1a1a1a;
          color: #e1e5e9;
          padding: 32px 30px;
        }
        .footer-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 24px;
        }
        .footer-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
        }
        .footer-section p,
        .footer-section div {
          font-size: 14px;
          line-height: 1.6;
          color: #8b949e;
          margin-bottom: 8px;
        }
        .footer-bottom {
          border-top: 1px solid #333;
          padding-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #8b949e;
        }
        .company-name {
          font-weight: 700;
          color: white;
        }
        
        /* Responsivo */
        @media (max-width: 600px) {
          body { padding: 10px 0; }
          .content, .header, .footer { padding: 24px 20px; }
          .payment-grid { grid-template-columns: 1fr; }
          .info-grid { grid-template-columns: 1fr; }
          .footer-content { grid-template-columns: 1fr; }
          .step { flex-direction: column; text-align: center; }
          .step-number { margin-bottom: 8px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <div class="logo">AngoHost</div>
          <div class="subtitle">Dados de Pagamento Disponíveis</div>
        </div>
        
        <!-- Conteúdo -->
        <div class="content">
          <div class="greeting">Olá, ${customerName}!</div>
          <div class="intro">
            Sua referência de pagamento Multicaixa foi gerada com sucesso. 
            Use os dados abaixo para completar o pagamento de forma rápida e segura.
          </div>
          
          <!-- Card de Pagamento -->
          <div class="payment-card">
            <div class="card-title">💳 Dados para Pagamento</div>
            
            <div class="payment-grid">
              <div class="payment-item">
                <div class="payment-label">Entidade</div>
                <div class="payment-value">${entity}</div>
              </div>
              <div class="payment-item">
                <div class="payment-label">Referência</div>
                <div class="payment-value">${reference}</div>
              </div>
              <div class="payment-item amount-highlight">
                <div class="payment-label">Valor a Pagar</div>
                <div class="payment-value">${formatAmount(amount)}</div>
              </div>
            </div>
            
            <div class="additional-info">
              <div class="info-grid">
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
          </div>
          
          <!-- Instruções -->
          <div class="instructions">
            <div class="instructions-title">
              <span>📋</span>
              <span>Como Efetuar o Pagamento</span>
            </div>
            
            <div class="steps-list">
              ${instructions.map((step, index) => `
                <div class="step">
                  <div class="step-number">${index + 1}</div>
                  <div class="step-text">${step}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Call to Action -->
          <div class="cta-section">
            <div class="cta-title">Precisa de Ajuda?</div>
            <div class="cta-text">
              Nossa equipe de suporte está disponível para ajudá-lo com qualquer dúvida sobre o pagamento.
            </div>
            <a href="mailto:support@angohost.ao" class="cta-button">
              <span>📧</span>
              <span>Contatar Suporte</span>
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-content">
            <div class="footer-section">
              <h3>ANGOHOST</h3>
              <p>Prestação de Serviços, LDA</p>
              <div>NIF: 5000088927</div>
              <div>Cacuaco Sequele - Angola</div>
            </div>
            <div class="footer-section">
              <h3>Contato</h3>
              <div>📧 support@angohost.ao</div>
              <div>📞 +244 226 430 401</div>
              <div>🌐 www.angohost.ao</div>
            </div>
          </div>
          <div class="footer-bottom">
            <span class="company-name">© 2024 AngoHost.</span> 
            Todos os direitos reservados. Este é um email automático.
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