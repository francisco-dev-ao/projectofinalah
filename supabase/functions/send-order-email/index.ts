import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderEmailRequest {
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  orderData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId, customerEmail, customerName, orderData }: OrderEmailRequest = await req.json()

    // Get order details from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        profiles (
          name,
          company_name,
          email,
          phone
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`)
    }

    // Use customer email from parameter or order profile
    const recipientEmail = customerEmail || order.profiles?.email
    const recipientName = customerName || order.profiles?.name || order.profiles?.company_name

    if (!recipientEmail) {
      throw new Error('No email found for customer')
    }

    // Format currency
    const formatCurrency = (value: number) => {
      return `${new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(value)} AOA`;
    };

    // Create order items list
    const itemsList = order.order_items.map((item: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${item.name || 'Serviço'}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 12px; text-align: right; font-weight: 500;">${formatCurrency(item.unit_price || 0)}</td>
      </tr>
    `).join('');

    // Email HTML template
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Novo Pedido - AngoHost</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center;">
          <img src="https://angohost.ao/ANGOHOST-01.png" alt="AngoHost" style="height: 60px; margin-bottom: 16px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Novo Pedido Recebido</h1>
          <p style="color: #bbf7d0; margin: 8px 0 0 0; font-size: 16px;">Obrigado por escolher a AngoHost!</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          
          <!-- Greeting -->
          <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
            Olá ${recipientName || 'Cliente'},
          </p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
            Recebemos o seu pedido com sucesso! Abaixo estão os detalhes do seu pedido:
          </p>

          <!-- Order Details -->
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #059669; margin: 0 0 16px 0; font-size: 18px;">Detalhes do Pedido</h3>
            
            <div style="margin-bottom: 16px;">
              <strong style="color: #374151;">Número do Pedido:</strong> 
              <span style="color: #6b7280;">#${order.id.substring(0, 8)}</span>
            </div>
            
            <div style="margin-bottom: 16px;">
              <strong style="color: #374151;">Data:</strong> 
              <span style="color: #6b7280;">${new Date(order.created_at).toLocaleString('pt-PT')}</span>
            </div>
            
            <div style="margin-bottom: 16px;">
              <strong style="color: #374151;">Status:</strong> 
              <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">Pendente</span>
            </div>
          </div>

          <!-- Order Items -->
          <div style="margin-bottom: 24px;">
            <h3 style="color: #059669; margin: 0 0 16px 0; font-size: 18px;">Serviços Solicitados</h3>
            
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Serviço</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Qtd</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
                <tr style="background: #f9fafb; font-weight: bold;">
                  <td style="padding: 16px; border-top: 2px solid #e5e7eb;">Total</td>
                  <td style="padding: 16px; border-top: 2px solid #e5e7eb;"></td>
                  <td style="padding: 16px; text-align: right; color: #059669; font-size: 18px; border-top: 2px solid #e5e7eb;">${formatCurrency(order.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Next Steps -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">Próximos Passos</h3>
            <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
              <li style="margin-bottom: 8px;">Processaremos o seu pedido em breve</li>
              <li style="margin-bottom: 8px;">Receberá uma referência de pagamento por email</li>
              <li style="margin-bottom: 8px;">Após o pagamento, ativaremos os seus serviços</li>
              <li>Receberá um email de confirmação com os detalhes de acesso</li>
            </ol>
          </div>

          <!-- Contact Info -->
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #374151; margin: 0 0 12px 0; font-size: 16px;">Precisa de Ajuda?</h3>
            <p style="color: #6b7280; margin: 0; line-height: 1.6;">
              Nossa equipe de suporte está pronta para ajudá-lo!<br>
              📧 Email: <a href="mailto:support@angohost.ao" style="color: #059669;">support@angohost.ao</a><br>
              📞 Telefone: <a href="tel:+244942090108" style="color: #059669;">+244 942 090108</a>
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
            Obrigado por confiar na AngoHost para suas necessidades de hospedagem web!
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
            <strong>AngoHost - Prestação de Serviços, Lda</strong>
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Sequele, Rua 2, Bloco 11, Prédio Nº 3, 7º Andar, Aptº701<br>
            Luanda, Angola | NIF: 5000088927<br>
            Este email foi enviado automaticamente, não responda.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send email using SMTP configuration
    const { error: emailError } = await supabase.functions.invoke('send-test-email', {
      body: {
        to: recipientEmail,
        subject: `Novo Pedido #${order.id.substring(0, 8)} - AngoHost`,
        html: emailHtml,
        from: 'noreply@angohost.ao'
      }
    });

    if (emailError) {
      throw emailError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email enviado com sucesso',
        recipientEmail 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending order email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})