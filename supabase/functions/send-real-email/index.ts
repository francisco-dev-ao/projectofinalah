import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html?: string
  text?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json()

    console.log('Enviando email para:', to)
    console.log('Assunto:', subject)

    // Get API key from Supabase secrets
    const apiKey = Deno.env.get('ANGOHOST_EMAIL_API_KEY')
    
    if (!apiKey) {
      throw new Error('Chave da API de email não configurada')
    }

    // Prepare email data for AngoHost API
    const emailData = {
      to: to,
      subject: subject,
      ...(html && { html }),
      ...(text && { text })
    }

    console.log('Enviando email via API AngoHost:', {
      para: to,
      assunto: subject,
      temHtml: !!html,
      temTexto: !!text
    })

    // Send email using AngoHost API
    const response = await fetch('https://mail3.angohost.ao/email/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro na API AngoHost:', response.status, errorText)
      throw new Error(`Erro na API de email: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Email enviado com sucesso via API AngoHost!', result)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email enviado com sucesso',
        details: {
          to: to,
          subject: subject,
          timestamp: new Date().toISOString(),
          apiResponse: result
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
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
        status: 500,
      }
    )
  }
})