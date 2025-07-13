import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

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
    const { invoiceId } = await req.json();
    
    if (!invoiceId) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da fatura é obrigatório" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configurações do Supabase não encontradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar a fatura com informações relacionadas
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        orders!inner (
          *,
          order_items(*),
          profiles:user_id (*)
        )
      `)
      .eq('id', invoiceId)
      .single();
    
    if (invoiceError || !invoice) {
      throw new Error(`Erro ao buscar fatura: ${invoiceError?.message || "Fatura não encontrada"}`);
    }
    
    // Buscar as configurações da empresa (incluindo SMTP)
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (settingsError || !settings) {
      throw new Error(`Erro ao buscar configurações: ${settingsError?.message || "Configurações não encontradas"}`);
    }
    
    // Verificar se o envio automático está ativado
    if (!settings.auto_send_invoices) {
      console.log("Envio automático de faturas desativado");
      return new Response(
        JSON.stringify({ success: false, skipped: true, message: "Envio automático desativado" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Verificar as configurações de SMTP
    if (!settings.email_config || !settings.email_config.smtp_host) {
      throw new Error("Configurações SMTP não encontradas");
    }
    
    const config = {
      host: settings.email_config.smtp_host,
      port: settings.email_config.smtp_port,
      user: settings.email_config.auth.user,
      password: settings.email_config.auth.pass,
      secure: settings.email_config.secure,
      from_email: settings.email_config.from_email,
      from_name: settings.email_config.from_name
    };
    
    // Obter email do cliente
    const userEmail = invoice.orders.profiles.email;
    const userName = invoice.orders.profiles.name || 'Cliente';
    
    if (!userEmail) {
      throw new Error("Email do cliente não encontrado");
    }
    
    console.log(`Enviando fatura ${invoice.invoice_number} para ${userEmail}`);
    
    // Configure SMTP client
    const client = new SmtpClient();
    
    // Create connection config
    const connectConfig: any = {
      hostname: config.host,
      port: parseInt(config.port.toString()),
      username: config.user,
      password: config.password,
    };
    
    // Definir a conexão segura
    let useSecureConnection = false;
    
    if (config.secure === "ssl") {
      useSecureConnection = true;
      connectConfig.tls = true;
    } else if (config.secure === "tls" || config.secure === true) {
      useSecureConnection = true;
    }
    
    // Conectar ao servidor SMTP
    if (useSecureConnection) {
      await client.connectTLS(connectConfig);
    } else {
      await client.connect(connectConfig);
    }
    
    // Formato da moeda
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA'
      }).format(amount);
    };
    
    // Criar conteúdo do email
    const invoiceLink = `${Deno.env.get('PUBLIC_URL') || 'https://app.angohost.ao'}/invoices/${invoice.id}`;
    const pdfLink = invoice.pdf_url || '';
    const total = invoice.total_amount || invoice.orders.total_amount || 0;
    const formattedTotal = formatCurrency(total);
    
    // Gerar lista de itens
    let itemsList = '';
    if (invoice.orders.order_items && invoice.orders.order_items.length > 0) {
      itemsList = '<ul>';
      for (const item of invoice.orders.order_items) {
        itemsList += `<li>${item.name} - ${formatCurrency(item.unit_price)} × ${item.quantity}</li>`;
      }
      itemsList += '</ul>';
    }
    
    // Enviar o email
    await client.send({
      from: `${config.from_name} <${config.from_email}>`,
      to: userEmail,
      subject: `Nova Fatura Disponível - Serviços AngoHost`,
      content: `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova Fatura - AngoHost</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f4f6f9;">
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #2c3e50; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e1e8ed; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 300;">
              <span style="font-weight: 700;">Ango</span>Host
            </h1>
            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
              Serviços de Hospedagem Premium
            </p>
          </div>
          
          <div style="padding: 30px 25px; background-color: #ffffff;">
            <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 24px; font-weight: 600;">
              Olá ${userName},
            </h2>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Esperamos que esteja bem! Uma nova fatura foi gerada para sua conta AngoHost.
            </p>
            
            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 18px;">📋 Detalhes da Fatura</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #6c757d;">Número da Fatura:</td>
                  <td style="padding: 8px 0; color: #2c3e50;">${invoice.invoice_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #6c757d;">Data de Vencimento:</td>
                  <td style="padding: 8px 0; color: #dc3545; font-weight: 600;">
                    ${new Date(invoice.due_date).toLocaleDateString('pt-AO', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #6c757d;">Valor Total:</td>
                  <td style="padding: 8px 0; color: #28a745; font-weight: 700; font-size: 18px;">
                    ${formattedTotal}
                  </td>
                </tr>
              </table>
              
              ${itemsList ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                  <h4 style="margin: 0 0 10px 0; color: #495057;">Serviços Contratados:</h4>
                  ${itemsList}
                </div>
              ` : ''}
            </div>
            
            <p style="font-size: 16px; margin: 25px 0;">
              Para visualizar os detalhes completos e efetuar o pagamento, clique no botão abaixo:
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${invoiceLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center; font-size: 16px; letter-spacing: 0.5px;">
                💳 Visualizar e Pagar Fatura
              </a>
            </div>
            
            ${pdfLink ? `
              <div style="text-align: center; margin: 20px 0;">
                <a href="${pdfLink}" style="color: #667eea; text-decoration: underline; font-size: 14px;">
                  📄 Baixar Fatura em PDF
                </a>
              </div>
            ` : ''}
            
            <div style="background-color: #e8f4fd; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; color: #0c5460; font-size: 14px;">
                <strong>💡 Dica:</strong> Mantenha seus serviços sempre ativos pagando antes do vencimento. 
                Isso evita interrupções e garante a melhor experiência com nossos serviços.
              </p>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">
              Se tiver alguma dúvida, nossa equipe de suporte está sempre disponível para ajudar.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 0;">
              Atenciosamente,<br>
              <strong>Equipe AngoHost</strong><br>
              <span style="color: #6c757d; font-size: 14px;">Suporte Técnico Especializado</span>
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px 25px; text-align: center; font-size: 13px; color: #6c757d; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0;">
              © ${new Date().getFullYear()} AngoHost - Serviços de Hospedagem Premium
            </p>
            <p style="margin: 0; font-size: 12px;">
              Este é um email automático. Para suporte, responda este email ou acesse nosso portal.
            </p>
          </div>
        </div>
      </body>
      </html>`,
      html: true,
    });
    
    // Fechar a conexão
    await client.close();
    
    // Atualizar a fatura marcando como email enviado
    await supabase
      .from('invoices')
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq('id', invoiceId);
    
    return new Response(
      JSON.stringify({ success: true, message: "Email de fatura enviado com sucesso" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    console.error("Erro ao enviar email da fatura:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Erro ao enviar email: ${error.message}` 
      }),
      {
        status: 200, // Retornamos 200 para evitar erro 500
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 