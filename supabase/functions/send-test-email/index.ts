import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  secure: boolean | string;
  auth: {
    user: string;
    pass: string;
  };
  from_email: string;
  from_name: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  config: EmailConfig;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, config } = await req.json() as EmailRequest

    console.log('🔄 Enviando email com configuração:', {
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.secure,
      user: config.auth.user,
      to: to
    })

    // Try to send via SMTP first
    const smtpResponse = await sendViaSMTP(config, to, subject, html)
    
    if (smtpResponse.success) {
      console.log('✅ Email enviado com sucesso via SMTP')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email enviado com sucesso via SMTP',
          method: 'smtp',
          smtpResponse: smtpResponse.response
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      console.error('❌ Falha no envio via SMTP:', smtpResponse.error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: smtpResponse.error,
          details: 'Falha ao enviar email via SMTP'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('❌ Erro crítico ao enviar email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Erro interno do servidor'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function sendViaSMTP(config: EmailConfig, to: string, subject: string, html: string) {
  try {
    const hostname = config.smtp_host
    const port = config.smtp_port
    const username = config.auth.user
    const password = config.auth.pass
    const isSecure = config.secure === true || config.secure === 'ssl' || config.secure === 'tls'
    
    console.log(`🔌 Conectando ao servidor SMTP ${hostname}:${port} (secure: ${isSecure})`)
    
    // Validate configuration
    if (!hostname || !port || !username || !password) {
      return { success: false, error: 'Configuração SMTP incompleta' }
    }

    // Create connection
    let conn: Deno.TcpConn | Deno.TlsConn;
    
    try {
      if (isSecure && port === 465) {
        // SSL connection
        conn = await Deno.connectTls({ hostname, port })
      } else {
        // Regular TCP connection
        conn = await Deno.connect({ hostname, port })
      }
      
      console.log('🔗 Conexão TCP estabelecida')
      
      // Simple SMTP conversation
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      
      // Read initial response
      const buffer = new Uint8Array(1024)
      const n = await conn.read(buffer)
      const response = decoder.decode(buffer.subarray(0, n || 0))
      console.log('📨 Resposta inicial:', response)
      
      if (!response.startsWith('220')) {
        throw new Error(`Erro na conexão inicial: ${response}`)
      }
      
      // EHLO command
      await conn.write(encoder.encode(`EHLO ${hostname}\r\n`))
      const ehloBuffer = new Uint8Array(1024)
      const ehloN = await conn.read(ehloBuffer)
      const ehloResponse = decoder.decode(ehloBuffer.subarray(0, ehloN || 0))
      console.log('📨 Resposta EHLO:', ehloResponse)
      
      if (!ehloResponse.startsWith('250')) {
        throw new Error(`Erro no EHLO: ${ehloResponse}`)
      }
      
      // STARTTLS if needed and not already secure
      if (!isSecure && port === 587) {
        await conn.write(encoder.encode('STARTTLS\r\n'))
        const tlsBuffer = new Uint8Array(1024)
        const tlsN = await conn.read(tlsBuffer)
        const tlsResponse = decoder.decode(tlsBuffer.subarray(0, tlsN || 0))
        console.log('📨 Resposta STARTTLS:', tlsResponse)
        
        if (tlsResponse.startsWith('220')) {
          conn.close()
          conn = await Deno.connectTls({ hostname, port })
          console.log('🔒 Conexão TLS estabelecida')
        }
      }
      
      // AUTH LOGIN
      await conn.write(encoder.encode('AUTH LOGIN\r\n'))
      const authBuffer = new Uint8Array(1024)
      const authN = await conn.read(authBuffer)
      const authResponse = decoder.decode(authBuffer.subarray(0, authN || 0))
      console.log('📨 Resposta AUTH:', authResponse)
      
      if (!authResponse.startsWith('334')) {
        throw new Error(`Erro no AUTH: ${authResponse}`)
      }
      
      // Send username
      const encodedUsername = btoa(username)
      await conn.write(encoder.encode(`${encodedUsername}\r\n`))
      const userBuffer = new Uint8Array(1024)
      const userN = await conn.read(userBuffer)
      const userResponse = decoder.decode(userBuffer.subarray(0, userN || 0))
      console.log('📨 Resposta username:', userResponse)
      
      // Send password
      const encodedPassword = btoa(password)
      await conn.write(encoder.encode(`${encodedPassword}\r\n`))
      const passBuffer = new Uint8Array(1024)
      const passN = await conn.read(passBuffer)
      const passResponse = decoder.decode(passBuffer.subarray(0, passN || 0))
      console.log('📨 Resposta password:', passResponse)
      
      if (!passResponse.startsWith('235')) {
        throw new Error(`Erro na autenticação: ${passResponse}`)
      }
      
      // MAIL FROM
      await conn.write(encoder.encode(`MAIL FROM:<${config.from_email}>\r\n`))
      const mailBuffer = new Uint8Array(1024)
      const mailN = await conn.read(mailBuffer)
      const mailResponse = decoder.decode(mailBuffer.subarray(0, mailN || 0))
      console.log('📨 Resposta MAIL FROM:', mailResponse)
      
      if (!mailResponse.startsWith('250')) {
        throw new Error(`Erro no MAIL FROM: ${mailResponse}`)
      }
      
      // RCPT TO
      await conn.write(encoder.encode(`RCPT TO:<${to}>\r\n`))
      const rcptBuffer = new Uint8Array(1024)
      const rcptN = await conn.read(rcptBuffer)
      const rcptResponse = decoder.decode(rcptBuffer.subarray(0, rcptN || 0))
      console.log('📨 Resposta RCPT TO:', rcptResponse)
      
      if (!rcptResponse.startsWith('250')) {
        throw new Error(`Erro no RCPT TO: ${rcptResponse}`)
      }
      
      // DATA
      await conn.write(encoder.encode('DATA\r\n'))
      const dataBuffer = new Uint8Array(1024)
      const dataN = await conn.read(dataBuffer)
      const dataResponse = decoder.decode(dataBuffer.subarray(0, dataN || 0))
      console.log('📨 Resposta DATA:', dataResponse)
      
      if (!dataResponse.startsWith('354')) {
        throw new Error(`Erro no DATA: ${dataResponse}`)
      }
      
      // Send email content
      const emailContent = `From: ${config.from_name} <${config.from_email}>\r\nTo: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}\r\n.\r\n`
      await conn.write(encoder.encode(emailContent))
      
      const sendBuffer = new Uint8Array(1024)
      const sendN = await conn.read(sendBuffer)
      const sendResponse = decoder.decode(sendBuffer.subarray(0, sendN || 0))
      console.log('📨 Resposta envio:', sendResponse)
      
      if (!sendResponse.startsWith('250')) {
        throw new Error(`Erro no envio: ${sendResponse}`)
      }
      
      // QUIT
      await conn.write(encoder.encode('QUIT\r\n'))
      
      conn.close()
      
      console.log('✅ Email enviado com sucesso via SMTP!')
      return { success: true, message: 'Email enviado via SMTP', response: sendResponse }
      
    } catch (connError) {
      console.error('❌ Erro na conexão SMTP:', connError)
      if (conn) {
        try {
          conn.close()
        } catch (closeError) {
          console.error('Erro ao fechar conexão:', closeError)
        }
      }
      return { success: false, error: `Erro na conexão: ${connError.message}` }
    }
    
  } catch (error) {
    console.error('❌ Erro geral no SMTP:', error)
    return { success: false, error: error.message }
  }
}