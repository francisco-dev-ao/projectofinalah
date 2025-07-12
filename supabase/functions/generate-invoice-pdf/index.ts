
/**
 * @deprecated Esta função edge não é mais utilizada.
 * A geração de PDF agora é feita diretamente usando jsPDF + autotable.
 * Ver: src/utils/pdfGenerator.ts e src/services/invoiceService.ts
 *
 * ATENÇÃO: Esta função será removida em uma versão futura.
 * Use InvoiceService.generateAndStorePdf(invoiceId, invoiceNumber) em vez desta função.
 * Documentação: https://github.com/jspdf-invoice-template/docs
 * 
 * Estamos mantendo temporariamente por compatibilidade.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import puppeteer from 'https://deno.land/x/puppeteer@9.0.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    // Mostrar aviso de depreciação para qualquer chamada
    console.log('AVISO: A função Edge generate-invoice-pdf está depreciada. Use InvoiceService.generateAndStorePdf() em vez disso.');
    
    const requestData = await req.json();
    const { 
      invoiceId, 
      origin, 
      bucketName = 'invoices', 
      invoice: providedInvoice, 
      companySettings: providedSettings,
      invoiceItems: providedItems 
    } = requestData;

    // Verificar se é apenas uma consulta para verificar a depreciação
    if (requestData.checkDeprecation) {
      return new Response(
        JSON.stringify({ 
          deprecated: true, 
          message: 'Esta função está obsoleta. Use InvoiceService.generateAndStorePdf(invoiceId, invoiceNumber) em vez disso.',
          alternativeImplementation: 'src/utils/pdfGenerator.ts e src/services/invoiceService.ts'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ 
          error: 'Invoice ID is required',
          deprecated: true,
          message: 'Esta função está obsoleta. Use InvoiceService.generateAndStorePdf(invoiceId, invoiceNumber) em vez disso.'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with error handling
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use provided invoice data or fetch it with retries
    let invoice = providedInvoice;
    let settings = providedSettings;
    let items = providedItems;
    
    if (!invoice) {
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries && !invoice) {
        try {
          const { data, error } = await supabase
            .from('invoices')
            .select(`
              *,
              orders (
                *,
                user_id,
                order_items(*),
                profiles:user_id(*)
              )
            `)
            .eq('id', invoiceId)
            .single();

          if (error) throw error;
          if (!data) throw new Error('Invoice not found');
          
          invoice = data;
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    // If items weren't provided, fetch them using the RPC function
    if (!items) {
      try {
        const { data, error } = await supabase.rpc(
          'get_invoice_items',
          { invoice_id: invoiceId }
        );
        
        if (!error && data) {
          items = data;
        } else {
          // If RPC fails, try fetching order items directly
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', invoice.order_id);
            
          if (orderItems) {
            items = orderItems.map(item => ({
              id: item.id,
              service_name: item.name || 'Serviço',
              service_description: item.description || '',
              quantity: item.quantity || 1,
              unit_price: item.price || item.unit_price || 0,
              subtotal: item.total || (item.quantity * (item.price || item.unit_price)) || 0
            }));
          }
        }
      } catch (error) {
        console.log('Warning: Could not fetch invoice items', error);
        // Continue without items data, we'll use order_items from invoice
      }
    }
    
    // Fetch company settings if not provided
    if (!settings) {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .single();
          
        if (!error) {
          settings = data;
        }
      } catch (error) {
        console.log('Warning: Could not fetch company settings', error);
        // Continue without settings
      }
    }

    // Generate PDF with proper error handling
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none'
      ]
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });

      console.log('Generating PDF content...');

      // Process invoice items
      let orderItems = items || [];
      
      // If we still don't have items, try using the order_items from the invoice
      if (orderItems.length === 0 && invoice.orders?.order_items) {
        orderItems = invoice.orders.order_items.map((item: any) => ({
          id: item.id,
          service_name: item.name || 'Serviço',
          service_description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.price || item.unit_price || 0,
          subtotal: item.total || (item.quantity * (item.price || item.unit_price)) || 0
        }));
      }
      
      // Calculate totals
      const subtotal = orderItems.reduce((sum: number, item: any) => {
        const itemSubtotal = item.subtotal || (item.quantity * item.unit_price) || 0;
        return sum + itemSubtotal;
      }, 0);
      
      const taxAmount = invoice.orders?.rf_tax || 0;
      const totalAmount = invoice.orders?.total_amount || subtotal + taxAmount;
      
      // Format customer info
      const customer = invoice.orders?.profiles || {};

      // Set content with improved styling and safe data access
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Fatura #${invoice.invoice_number || ''}</title>
            <style>
              @page {
                margin: 20px;
                size: A4;
              }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                line-height: 1.6;
              }
              .invoice-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #eee;
                padding-bottom: 20px;
              }
              .company-info {
                text-align: left;
                margin-bottom: 30px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
              }
              .invoice-details {
                margin-bottom: 20px;
                display: flex;
                justify-content: space-between;
                background-color: #fff;
                padding: 15px;
                border: 1px solid #eee;
                border-radius: 5px;
              }
              .customer-details {
                margin-bottom: 30px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
                border: 1px solid #eee;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                background-color: #fff;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #f8f9fa;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f8f9fa;
              }
              .total {
                text-align: right;
                font-size: 1.2em;
                margin-top: 20px;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 5px;
                border: 1px solid #eee;
              }
              .footer {
                margin-top: 50px;
                text-align: center;
                color: #666;
                font-size: 0.9em;
                border-top: 1px solid #eee;
                padding-top: 20px;
              }
              h1, h2, h3 {
                color: #2c3e50;
              }
              .logo {
                max-width: 200px;
                max-height: 80px;
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              ${settings?.company_logo ? `<img src="${settings.company_logo}" class="logo" alt="Logo" />` : ''}
              <h1>FATURA</h1>
              <p>Nº ${invoice.invoice_number || ''}</p>
            </div>

            <div class="company-info">
              <h2>${settings?.company_name || 'AngoHost'}</h2>
              <p><strong>Endereço:</strong> ${settings?.company_address || 'Luanda, Angola'}</p>
              <p><strong>NIF:</strong> ${settings?.company_nif || ''}</p>
              <p><strong>Telefone:</strong> ${settings?.company_phone || ''}</p>
              <p><strong>Email:</strong> ${settings?.company_email || 'suport@angohost.ao'}</p>
            </div>

            <div class="invoice-details">
              <div>
                <p><strong>Data de Emissão:</strong> ${invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('pt-AO') : ''}</p>
                <p><strong>Data de Vencimento:</strong> ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('pt-AO') : ''}</p>
                <p><strong>Status:</strong> ${invoice.status || ''}</p>
              </div>
            </div>

            <div class="customer-details">
              <h3>Dados do Cliente</h3>
              <p><strong>Nome:</strong> ${customer?.name || customer?.company_name || ''}</p>
              <p><strong>Email:</strong> ${customer?.email || ''}</p>
              ${customer?.phone ? `<p><strong>Telefone:</strong> ${customer.phone}</p>` : ''}
              ${customer?.address ? `<p><strong>Endereço:</strong> ${customer.address}</p>` : ''}
              ${customer?.nif ? `<p><strong>NIF:</strong> ${customer.nif}</p>` : ''}
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Descrição</th>
                  <th>Quantidade</th>
                  <th>Preço Unitário</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItems.map((item: any) => {
                  const name = item.service_name || 'Serviço';
                  const description = item.service_description || '';
                  const quantity = item.quantity || 1;
                  const unitPrice = item.unit_price || 0;
                  const itemTotal = item.subtotal || (quantity * unitPrice) || 0;
                  
                  return `
                    <tr>
                      <td>${name}</td>
                      <td>${description}</td>
                      <td>${quantity}</td>
                      <td>${unitPrice.toLocaleString('pt-AO')} AOA</td>
                      <td>${itemTotal.toLocaleString('pt-AO')} AOA</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="total">
              <p><strong>Subtotal:</strong> ${subtotal.toLocaleString('pt-AO')} AOA</p>
              ${taxAmount > 0 ? `<p><strong>RF (${invoice.orders?.tax_rate || 6.5}%):</strong> ${taxAmount.toLocaleString('pt-AO')} AOA</p>` : ''}
              <p><strong>Total:</strong> ${totalAmount.toLocaleString('pt-AO')} AOA</p>
            </div>

            <div class="footer">
              ${invoice.payment_instructions ? `<p><strong>Instruções de Pagamento:</strong><br>${invoice.payment_instructions}</p>` : ''}
              <p>${settings?.invoice_footer || 'Obrigado pela preferência!'}</p>
              <p>AngoHost - Hospedagem de Sites em Angola</p>
              <p>Email: support@angohost.ao | Tel: +244 923 456 789</p>
            </div>
          </body>
        </html>
      `;

      console.log('Setting page content...');
      await page.setContent(htmlContent);

      console.log('Generating PDF...');
      const pdf = await page.pdf({
        format: 'A4',
        preferCSSPageSize: true,
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      // Store PDF with retries
      let pdfUrl = null;
      let retryCount = 0;
      const maxRetries = 3;
      let pdfFileName = '';

      while (retryCount < maxRetries && !pdfUrl) {
        try {
          pdfFileName = `pdfs/${invoiceId}/fatura-${invoice.invoice_number}.pdf`;
          const { error: storageError } = await supabase
            .storage
            .from(bucketName)
            .upload(pdfFileName, pdf, {
              contentType: 'application/pdf',
              upsert: true,
              cacheControl: '3600'
            });

          if (storageError) throw storageError;

          // Usar a origem fornecida ou um fallback para URL pública
          const publicOrigin = origin || Deno.env.get('PUBLIC_URL') || 'http://localhost:8080';

          // Obter URL pública do arquivo
          const { data: publicUrlData } = await supabase.storage
            .from(bucketName)
            .getPublicUrl(pdfFileName);

          pdfUrl = publicUrlData.publicUrl;

          // Se a URL não for absoluta, adicione o origin
          if (pdfUrl && !pdfUrl.includes('://')) {
            pdfUrl = new URL(pdfUrl, publicOrigin).toString();
          }
          
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Update invoice with PDF URL
      await supabase
        .from('invoices')
        .update({ pdf_url: pdfUrl })
        .eq('id', invoiceId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          pdfUrl: pdfUrl,
          url: pdfUrl // Para compatibilidade
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('Error in generate-invoice-pdf:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
