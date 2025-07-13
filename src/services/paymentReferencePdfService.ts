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

    // Create simple professional email template
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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6; 
          color: #333; 
          background: #f5f5f5;
          padding: 20px;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff; 
          border: 1px solid #ddd;
        }
        
        /* Header simples */
        .header { 
          background: #2c5282;
          color: white; 
          padding: 30px 25px; 
          text-align: center;
        }
        .logo { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 8px;
        }
        .subtitle { 
          font-size: 16px;
        }
        
        /* Conteúdo */
        .content { 
          padding: 30px 25px;
        }
        .greeting { 
          font-size: 18px; 
          font-weight: 600;
          margin-bottom: 20px; 
          color: #2c5282;
        }
        .intro { 
          margin-bottom: 30px;
          color: #555;
        }
        
        /* Dados de pagamento */
        .payment-section {
          border: 2px solid #2c5282;
          padding: 25px;
          margin: 25px 0;
          background: #f8f9fa;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #2c5282;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .payment-data {
          background: white;
          padding: 20px;
          border: 1px solid #ddd;
          margin-bottom: 15px;
        }
        .data-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .data-row:last-child {
          border-bottom: none;
        }
        .data-label {
          font-weight: 600;
          color: #666;
        }
        .data-value {
          font-weight: bold;
          color: #2c5282;
          font-family: monospace;
        }
        .amount-value {
          color: #d69e2e;
          font-size: 18px;
        }
        
        .payment-info {
          margin-top: 15px;
          padding: 15px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
        }
        .info-row {
          margin-bottom: 8px;
        }
        .info-label {
          font-weight: 600;
          color: #856404;
        }
        .info-value {
          color: #856404;
        }
        
        /* Instruções */
        .instructions-section {
          margin: 30px 0;
        }
        .instructions-title {
          font-size: 18px;
          font-weight: bold;
          color: #2c5282;
          margin-bottom: 15px;
        }
        .instructions-list {
          background: white;
          border: 1px solid #ddd;
          padding: 20px;
        }
        .instruction {
          margin-bottom: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .instruction:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .step-number {
          display: inline-block;
          background: #2c5282;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          text-align: center;
          line-height: 24px;
          font-size: 12px;
          font-weight: bold;
          margin-right: 10px;
        }
        .step-text {
          color: #555;
        }
        
        /* Observações */
        .notes {
          margin: 30px 0;
          padding: 20px;
          background: #e6f3ff;
          border: 1px solid #cce7ff;
        }
        .notes-title {
          font-weight: bold;
          color: #2c5282;
          margin-bottom: 10px;
        }
        .notes-text {
          color: #555;
        }
        
        /* Footer */
        .footer {
          background: #2c5282;
          color: white;
          padding: 25px;
          text-align: center;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .contact-info {
          font-size: 14px;
          line-height: 1.8;
        }
        .contact-row {
          margin-bottom: 5px;
        }
        
        /* Responsivo */
        @media (max-width: 600px) {
          body { padding: 10px; }
          .content, .header, .footer { padding: 20px 15px; }
          .data-row { flex-direction: column; }
          .data-label { margin-bottom: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <div class="logo">AngoHost</div>
          <div class="subtitle">Dados de Pagamento Disponíveis - Ref: ${reference}</div>
        </div>
        
        <!-- Conteúdo -->
        <div class="content">
          <div class="greeting">Caro(a) ${customerName},</div>
          <div class="intro">
            Sua referência de pagamento Multicaixa foi gerada com sucesso. 
            Por favor, utilize os dados abaixo para efetuar o pagamento.
          </div>
          
          <!-- Dados de Pagamento -->
          <div class="payment-section">
            <div class="section-title">DADOS PARA PAGAMENTO</div>
            
            <div class="payment-data">
              <div class="data-row">
                <span class="data-label">Entidade:</span>
                <span class="data-value">${entity}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Referência:</span>
                <span class="data-value">${reference}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Valor a Pagar:</span>
                <span class="data-value amount-value">${amount} AOA</span>
              </div>
            </div>
            
            <div class="payment-info">
              <div class="info-row">
                <span class="info-label">Descrição:</span>
                <span class="info-value">${description}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Válido até:</span>
                <span class="info-value">${validityDate}</span>
              </div>
            </div>
          </div>
          
          <!-- Instruções -->
          <div class="instructions-section">
            <div class="instructions-title">INSTRUÇÕES DE PAGAMENTO</div>
            <div class="instructions-list">
              ${instructions.map((step, index) => `
                <div class="instruction">
                  <span class="step-number">${index + 1}</span>
                  <span class="step-text">${step}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Observações -->
          <div class="notes">
            <div class="notes-title">Observações Importantes:</div>
            <div class="notes-text">
              • Após o pagamento, você receberá automaticamente a confirmação por email.<br>
              • Guarde esta referência até a confirmação do pagamento.<br>
              • Em caso de dúvidas, entre em contato conosco através do email support@angohost.ao
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="company-name">ANGOHOST - PRESTAÇÃO DE SERVIÇOS, LDA</div>
          <div class="contact-info">
            <div class="contact-row">Email: support@angohost.ao</div>
            <div class="contact-row">Telefone: +244 226 430 401</div>
            <div class="contact-row">Endereço: Cacuaco Sequele - Angola</div>
            <div class="contact-row">NIF: 5000088927</div>
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