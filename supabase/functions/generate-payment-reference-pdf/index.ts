import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { referenceData, orderData, customerData } = await req.json();

    // Simple PDF generation using basic HTML/CSS approach
    // This creates a simple PDF structure that can be converted by the client
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Dados de Pagamento - AngoHost</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: white;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #1a73e8;
            padding-bottom: 20px;
          }
          .logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1a73e8; 
          }
          .reference-box { 
            border: 2px solid #1a73e8; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px;
            background: #f8f9ff;
          }
          .payment-data { 
            font-size: 18px; 
            font-weight: bold; 
            margin: 10px 0; 
          }
          .instructions { 
            margin-top: 20px; 
          }
          .step { 
            margin: 8px 0; 
            padding-left: 20px; 
          }
          .validity { 
            color: #d32f2f; 
            font-weight: bold; 
            margin-top: 15px; 
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">AngoHost</div>
          <div>Dados de Pagamento por Referência</div>
        </div>

        <div class="customer-info">
          <h3>Cliente:</h3>
          <p><strong>Nome:</strong> ${customerData.name}</p>
          <p><strong>Email:</strong> ${customerData.email}</p>
          ${customerData.company ? `<p><strong>Empresa:</strong> ${customerData.company}</p>` : ''}
        </div>

        <div class="reference-box">
          <h2 style="color: #1a73e8; margin-bottom: 20px;">Dados para Pagamento</h2>
          <div class="payment-data">Entidade: ${referenceData.entity}</div>
          <div class="payment-data">Referência: ${referenceData.reference}</div>
          <div class="payment-data">Valor: ${referenceData.amount} AOA</div>
          <div class="payment-data">Descrição: ${referenceData.description}</div>
          <div class="validity">Válido até: ${referenceData.validityDate}</div>
        </div>

        <div class="instructions">
          <h3>Instruções de Pagamento:</h3>
          ${referenceData.instructions.map((instruction: string, index: number) => 
            `<div class="step">${index + 1}. ${instruction}</div>`
          ).join('')}
        </div>

        <div class="footer">
          <p>AngoHost - Soluções de Hospedagem e Domínios</p>
          <p>www.angohost.ao | contato@angohost.ao</p>
        </div>
      </body>
      </html>
    `;

    // For now, return the HTML content as base64
    // In a production environment, you would use a proper PDF generation library
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(htmlContent);
    const base64Html = btoa(String.fromCharCode(...htmlBytes));

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfData: base64Html,
        message: "PDF gerado com sucesso" 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating payment reference PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});