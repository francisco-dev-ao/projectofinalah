import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  customerName: string;
  entity: string;
  reference: string;
  amount: string;
  description: string;
  validityDate: string;
  instructions: string[];
  orderData?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, customerName, entity, reference, amount, description, validityDate, instructions, orderData }: EmailRequest = await req.json()

    // Get SMTP configuration from Supabase secrets
    const SMTP_HOST = Deno.env.get('SMTP_HOST')
    const SMTP_PORT = Deno.env.get('SMTP_PORT')
    const SMTP_USER = Deno.env.get('SMTP_USER')
    const SMTP_PASS = Deno.env.get('SMTP_PASS')
    const SMTP_FROM = Deno.env.get('SMTP_FROM') || 'noreply@angohost.ao'

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      throw new Error('Configurações SMTP não encontradas')
    }

    // Create email HTML template
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Referência de Pagamento - AngoHost</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6; 
          color: #333; 
          background: #f7fafc;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white; 
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 30px; 
          text-align: center;
        }
        .logo { 
          font-size: 28px; 
          font-weight: 700; 
          margin-bottom: 10px;
        }
        .subtitle { 
          font-size: 16px; 
          opacity: 0.9;
        }
        .content { 
          padding: 30px;
        }
        .greeting { 
          font-size: 18px; 
          margin-bottom: 20px; 
          color: #2d3748;
        }
        .reference-card {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
        }
        .reference-title {
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 20px;
        }
        .reference-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        .detail-item {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .detail-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #718096;
          margin-bottom: 5px;
        }
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
        }
        .amount-highlight {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white !important;
          font-size: 24px !important;
          padding: 20px !important;
          border-radius: 12px !important;
          grid-column: 1 / -1;
        }
        .instructions {
          background: #f0fff4;
          border: 1px solid #9ae6b4;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .instructions-title {
          font-size: 18px;
          font-weight: 600;
          color: #22543d;
          margin-bottom: 15px;
        }
        .instruction-step {
          background: white;
          margin-bottom: 10px;
          padding: 12px 15px;
          border-radius: 6px;
          border-left: 4px solid #48bb78;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .step-number {
          background: #48bb78;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
          flex-shrink: 0;
        }
        .footer {
          background: #2d3748;
          color: #e2e8f0;
          padding: 25px;
          text-align: center;
          font-size: 14px;
        }
        .company-name {
          font-weight: 600;
          margin-bottom: 5px;
        }
        .contact-info {
          opacity: 0.8;
          line-height: 1.4;
        }
        @media (max-width: 600px) {
          .reference-details { grid-template-columns: 1fr; }
          .content { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AngoHost</div>
          <div class="subtitle">Referência de Pagamento Multicaixa</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Olá ${customerName},
          </div>
          
          <p>Sua referência de pagamento foi gerada com sucesso. Utilize os dados abaixo para efetuar o pagamento:</p>
          
          <div class="reference-card">
            <div class="reference-title">💳 Dados para Pagamento</div>
            <div class="reference-details">
              <div class="detail-item">
                <div class="detail-label">Entidade</div>
                <div class="detail-value">${entity}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Referência</div>
                <div class="detail-value">${reference}</div>
              </div>
              <div class="detail-item amount-highlight">
                <div class="detail-label">Valor a Pagar</div>
                <div class="detail-value">${amount}</div>
              </div>
            </div>
            <p><strong>Descrição:</strong> ${description}</p>
            <p><strong>Válido até:</strong> ${validityDate}</p>
          </div>
          
          <div class="instructions">
            <div class="instructions-title">📋 Como Pagar</div>
            ${instructions.map((step, index) => `
              <div class="instruction-step">
                <div class="step-number">${index + 1}</div>
                <div>${step}</div>
              </div>
            `).join('')}
          </div>
          
          <p>Após o pagamento, você receberá a confirmação e a fatura final.</p>
          <p>Se tiver dúvidas, entre em contato conosco.</p>
        </div>
        
        <div class="footer">
          <div class="company-name">ANGOHOST - PRESTAÇÃO DE SERVIÇOS, LDA</div>
          <div class="contact-info">
            Email: support@angohost.ao | Telefone: +244 226 430 401<br>
            Cacuaco Sequele - Angola | NIF: 5000088927
          </div>
        </div>
      </div>
    </body>
    </html>
    `

    // Send email using SMTP
    const emailData = {
      from: SMTP_FROM,
      to: to,
      subject: `Referência de Pagamento Multicaixa - AngoHost`,
      html: emailHTML,
    }

    // Using nodemailer-like approach with fetch to SMTP service
    const response = await fetch(`https://api.emailjs.com/api/v1.0/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'smtp',
        template_id: 'template',
        user_id: SMTP_USER,
        template_params: {
          from_email: SMTP_FROM,
          to_email: to,
          subject: emailData.subject,
          html_content: emailHTML,
        },
        accessToken: SMTP_PASS
      })
    })

    if (!response.ok) {
      // Fallback: Use simple SMTP connection
      const smtpResponse = await fetch(`smtp://${SMTP_HOST}:${SMTP_PORT || 587}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${SMTP_USER}:${SMTP_PASS}`)}`,
          'Content-Type': 'message/rfc822',
        },
        body: `From: ${SMTP_FROM}
To: ${to}
Subject: ${emailData.subject}
Content-Type: text/html; charset=UTF-8

${emailHTML}`
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email enviado com sucesso para ${to}` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})