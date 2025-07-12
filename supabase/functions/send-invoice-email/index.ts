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
      subject: `Fatura ${invoice.invoice_number} - AngoHost`,
      content: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #0066cc;">
            <h2 style="margin: 0; color: #0066cc;">AngoHost</h2>
          </div>
          
          <div style="padding: 20px;">
            <p>Olá ${userName},</p>
            
            <p>Sua fatura <strong>#${invoice.invoice_number}</strong> foi gerada e está disponível para pagamento.</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
              <p><strong>Detalhes da Fatura:</strong></p>
              <p>Número: ${invoice.invoice_number}</p>
              <p>Data de Vencimento: ${new Date(invoice.due_date).toLocaleDateString('pt-AO')}</p>
              <p>Total: ${formattedTotal}</p>
              
              <p><strong>Itens:</strong></p>
              ${itemsList}
            </div>
            
            <p>Você pode visualizar e pagar sua fatura através do nosso portal:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invoiceLink}" style="background-color: #0066cc; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Visualizar Fatura</a>
            </div>
            
            ${pdfLink ? `<p>Você também pode baixar a fatura em PDF <a href="${pdfLink}" style="color: #0066cc; text-decoration: underline;">clicando aqui</a>.</p>` : ''}
            
            <p>Se você tiver alguma dúvida, entre em contato com nossa equipe de suporte respondendo a este email ou através do nosso chat.</p>
            
            <p>Atenciosamente,<br>Equipe AngoHost</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} AngoHost. Todos os direitos reservados.</p>
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