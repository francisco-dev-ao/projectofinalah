import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const { config, testEmail } = await req.json();
    
    if (!config || !testEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Parâmetros inválidos" }),
        {
          status: 200, // Mudado para 200 para evitar erro HTTP
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("SMTP Config:", JSON.stringify(config, null, 2));
    
    // Configure SMTP client
    const client = new SmtpClient();
    
    // Create connection config
    const connectConfig: any = {
      hostname: config.host,
      port: parseInt(config.port),
      username: config.user,
      password: config.password,
    };

    try {
      // Simplify security handling - log para debugging
      console.log(`Configuração de segurança recebida: ${config.secure} (tipo: ${typeof config.secure})`);
      
      // TLS é necessário para a porta 587, SSL para 465
      let useSecureConnection = false;
      
      if (config.secure === "ssl") {
        console.log("Usando SSL (TLS com flag SSL)");
        useSecureConnection = true;
        // Configuração extra para SSL
        connectConfig.tls = true;
      } else if (config.secure === "tls" || config.secure === true) {
        console.log("Usando TLS padrão");
        useSecureConnection = true;
      } else {
        console.log("Conexão sem criptografia");
      }

      // Faz a conexão com ou sem segurança
      if (useSecureConnection) {
        console.log("Estabelecendo conexão segura (TLS)");
        await client.connectTLS(connectConfig);
      } else {
        console.log("Estabelecendo conexão sem criptografia");
        await client.connect(connectConfig);
      }
      
      console.log(`Conectado ao servidor SMTP, tentando enviar email para ${testEmail}`);
      
      // Add better error handling and timeout
      const sendPromise = client.send({
        from: `${config.from_name} <${config.from_email}>`,
        to: testEmail,
        subject: "Teste de Configuração SMTP - AngoHost",
        content: `
        <html>
          <body>
            <h1>Teste de Configuração SMTP</h1>
            <p>Este é um email de teste para confirmar que suas configurações SMTP estão funcionando corretamente.</p>
            <p>Se você está recebendo este email, significa que a configuração foi bem-sucedida!</p>
            <p><strong>Detalhes da configuração:</strong></p>
            <ul>
              <li>Servidor: ${config.host}</li>
              <li>Porta: ${config.port}</li>
              <li>Segurança: ${config.secure}</li>
              <li>Email de envio: ${config.from_email}</li>
            </ul>
            <p>Atenciosamente,<br>Equipe AngoHost</p>
          </body>
        </html>`,
        html: true,
      });

      // Set a timeout of 15 seconds
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout ao conectar ao servidor SMTP")), 15000);
      });

      // Wait for send to complete or timeout
      await Promise.race([sendPromise, timeout]);
      console.log("Email enviado com sucesso");
      await client.close();

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (smtpError) {
      console.error("SMTP Error:", smtpError);
      
      // Try to close client if it's open
      try {
        await client.close();
      } catch (e) {
        console.error("Error closing SMTP client:", e);
      }
      
      // Em vez de lançar um erro, retornamos uma resposta com status 200
      // mas com flag de sucesso false
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro SMTP: ${smtpError.message}` 
        }),
        {
          status: 200, // Importante: retorna 200 mesmo com erro
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Erro ao testar SMTP:", error);
    
    // Mesmo para erros genéricos, retornamos status 200
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Erro ao processar solicitação: ${error.message}` 
      }),
      {
        status: 200, // Retornamos 200 para evitar erro 500
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
