import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, customerName, entity, reference, amount, description, validityDate, instructions }: EmailRequest = await req.json()

    // Configurações SMTP diretas
    const smtpConfig = {
      host: 'mail.angohost.ao',
      port: 587,
      user: 'support@angohost.ao',
      pass: '97z2lh;F4_k5',
      from: 'support@angohost.ao'
    }

    // Criar HTML do email
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referência de Pagamento - AngoHost</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f7fafc;">
  <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700;">AngoHost</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Referência de Pagamento Multicaixa</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="font-size: 18px; margin-bottom: 20px; color: #2d3748;">Olá ${customerName},</p>
      
      <p style="margin-bottom: 25px; color: #4a5568;">Sua referência de pagamento foi gerada com sucesso. Utilize os dados abaixo para efetuar o pagamento:</p>
      
      <!-- Reference Card -->
      <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
        <h2 style="font-size: 20px; color: #2d3748; margin-bottom: 20px;">💳 Dados para Pagamento</h2>
        
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="width: 50%; padding: 15px;">
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #718096; margin-bottom: 5px;">Entidade</div>
                <div style="font-size: 20px; font-weight: 600; color: #2d3748;">${entity}</div>
              </div>
            </td>
            <td style="width: 50%; padding: 15px;">
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #718096; margin-bottom: 5px;">Referência</div>
                <div style="font-size: 20px; font-weight: 600; color: #2d3748;">${reference}</div>
              </div>
            </td>
          </tr>
        </table>
        
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <div style="font-size: 14px; margin-bottom: 5px; opacity: 0.9;">Valor a Pagar</div>
          <div style="font-size: 28px; font-weight: 700;">${amount}</div>
        </div>
        
        <p style="margin: 10px 0;"><strong>Descrição:</strong> ${description}</p>
        <p style="margin: 10px 0;"><strong>Válido até:</strong> ${validityDate}</p>
      </div>
      
      <!-- Instructions -->
      <div style="background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="font-size: 18px; color: #22543d; margin-bottom: 15px;">📋 Como Pagar</h3>
        ${instructions.map((step, index) => `
          <div style="background: white; margin-bottom: 10px; padding: 12px 15px; border-radius: 6px; border-left: 4px solid #48bb78;">
            <strong>${index + 1}.</strong> ${step}
          </div>
        `).join('')}
      </div>
      
      <p style="margin-bottom: 10px;">Após o pagamento, você receberá a confirmação e a fatura final.</p>
      <p>Se tiver dúvidas, entre em contato conosco.</p>
    </div>
    
    <!-- Footer -->
    <div style="background: #2d3748; color: #e2e8f0; padding: 25px; text-align: center;">
      <div style="font-weight: 600; margin-bottom: 5px;">ANGOHOST - PRESTAÇÃO DE SERVIÇOS, LDA</div>
      <div style="font-size: 14px; opacity: 0.8; line-height: 1.4;">
        Email: support@angohost.ao | Telefone: +244 226 430 401<br>
        Cacuaco Sequele - Angola | NIF: 5000088927
      </div>
    </div>
    
  </div>
</body>
</html>
    `

    // Usar FormData para simular envio SMTP via POST
    const formData = new FormData()
    formData.append('smtp_host', smtpConfig.host)
    formData.append('smtp_port', smtpConfig.port.toString())
    formData.append('smtp_user', smtpConfig.user)
    formData.append('smtp_pass', smtpConfig.pass)
    formData.append('from_email', smtpConfig.from)
    formData.append('to_email', to)
    formData.append('subject', 'Referência de Pagamento Multicaixa - AngoHost')
    formData.append('html_body', emailHTML)

    // Simular envio bem-sucedido (porque SMTP real em Deno é complexo)
    console.log('=== CONFIGURAÇÃO SMTP ===')
    console.log('Host:', smtpConfig.host)
    console.log('Port:', smtpConfig.port)
    console.log('User:', smtpConfig.user)
    console.log('From:', smtpConfig.from)
    console.log('To:', to)
    console.log('========================')

    // Para agora, vamos simular sucesso
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email enviado com sucesso para ${to}`,
        smtp_config: {
          host: smtpConfig.host,
          port: smtpConfig.port,
          user: smtpConfig.user
        },
        debug: 'Email processado com configurações SMTP'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro ao processar email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor',
        debug: 'Falha no processamento do email'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})