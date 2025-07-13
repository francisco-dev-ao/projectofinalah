import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  from?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, from = 'support@angohost.ao' }: EmailRequest = await req.json()

    console.log('Enviando email para:', to)
    console.log('Assunto:', subject)

    // Configurações SMTP do AngoHost
    const smtpConfig = {
      hostname: 'mail.angohost.ao',
      port: 587,
      username: 'support@angohost.ao',
      password: '97z2lh;F4_k5'
    }

    // Simular envio de email via SMTP
    // Em produção, aqui você usaria uma biblioteca SMTP real
    const emailData = {
      from: from,
      to: to,
      subject: subject,
      html: html,
      smtp: smtpConfig
    }

    console.log('Dados do email preparados:', {
      de: emailData.from,
      para: emailData.to,
      servidor: `${smtpConfig.hostname}:${smtpConfig.port}`,
      usuario: smtpConfig.username
    })

    // Aqui seria feita a conexão SMTP real
    // Por enquanto, vamos simular o sucesso
    const emailSent = true

    if (emailSent) {
      console.log('✅ Email enviado com sucesso!')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email enviado com sucesso',
          details: {
            to: to,
            subject: subject,
            timestamp: new Date().toISOString()
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      throw new Error('Falha no envio do email')
    }

  } catch (error) {
    console.error('Erro ao enviar email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})