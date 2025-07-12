import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// Helper for log with timestamp
const logWithTimestamp = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : "");
};

serve(async (req) => {
  // Handle OPTIONS requests for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    logWithTimestamp("Received AppyPay reference payment request:", requestData);

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // AppyPay configuration with your credentials
    const clientId = "14590a63-158d-4eed-a108-47ffcd6122c4";
    const clientSecret = "U5W8Q~YFBrH8zktWmEIPDPsZGWskKWNCtTsyYbi4";
    const apiBaseUrl = "https://gwy-api.appypay.co.ao/v2.0"; // API real v2.0

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    // Create Supabase client using service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract relevant data from request
    const { orderId, amount, description, validityDays = 3 } = requestData;

    if (!orderId || !amount) {
      return new Response(
        JSON.stringify({ error: "Order ID and amount are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Step 1: Authenticate with AppyPay OAuth2
    logWithTimestamp("Authenticating with AppyPay OAuth2");
    
    const tokenUrl = 'https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token';
    
    const authBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      resource: 'bee57785-7a19-4f1c-9c8d-aa03f2f0e333'
    });

    const authResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: authBody.toString()
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      logWithTimestamp("Authentication failed:", authError);
      throw new Error(`Authentication failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    if (!accessToken) {
      throw new Error("No access token received from AppyPay");
    }

    logWithTimestamp("Authentication successful");

    // Step 2: Create charge with AppyPay API
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + (validityDays || 2));

    const merchantTransactionId = ('ANGO' + Date.now()).slice(0, 15);

    const chargePayload = {
      merchantTransactionId: merchantTransactionId,
      amount: parseFloat(amount.toString()),
      currency: "AOA",
      description: description || `Pagamento do pedido ${orderId}`,
      paymentMethod: "ref_1e68f78d-481b-43df-8ce4-139ce69c27d2",
      createdBy: "AngoHost",
      startDate: new Date().toISOString().split('T')[0] + 'T00:00:00',
      expirationDate: validityDate.toISOString().split('T')[0] + 'T23:59:59'
    };

    logWithTimestamp("Creating payment charge with AppyPay:", chargePayload);

    const chargeResponse = await fetch(`${apiBaseUrl}/charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Language": "pt-BR",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(chargePayload)
    });

    if (!chargeResponse.ok) {
      const chargeError = await chargeResponse.text();
      logWithTimestamp("Charge creation failed:", chargeError);
      throw new Error(`Charge creation failed: ${chargeResponse.status}`);
    }

    const chargeData = await chargeResponse.json();
    logWithTimestamp("Payment charge created successfully:", chargeData);

    // Store payment reference in database
    const { data: paymentRef, error: insertError } = await supabase
      .from("payment_references")
      .insert({
        order_id: orderId,
        reference: chargeData.reference || merchantTransactionId,
        amount: parseFloat(amount.toString()),
        status: "pending",
        payment_method: "appypay_reference",
        entity: "11333",
        description: chargePayload.description,
        validity_date: validityDate.toISOString(),
        appypay_response: chargeData
      })
      .select()
      .single();

    if (insertError) {
      logWithTimestamp("Error storing payment reference:", insertError);
      throw new Error("Failed to store payment reference");
    }

    // Update order status to awaiting payment
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        status: "pending_payment",
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (orderUpdateError) {
      logWithTimestamp("Error updating order status:", orderUpdateError);
    }

    // Return payment reference details
    const responseData = {
      success: true,
      entity: "11333",
      reference: chargeData.reference || merchantTransactionId,
      amount: parseFloat(amount.toString()),
      description: chargePayload.description,
      validity_date: validityDate.toISOString(),
      validity_days: validityDays || 2,
      order_id: orderId,
      appypay_id: chargeData.id,
      instructions: {
        pt: {
          title: "Como pagar por referência",
          steps: [
            "Dirija-se a um ATM, Internet Banking ou Multicaixa Express",
            `Selecione "Pagamentos" e depois "Outros Serviços"`,
            `Insira a Entidade: 11333`,
            `Insira a Referência: ${chargeData.reference || merchantTransactionId}`,
            `Confirme o valor: ${amount} AOA`,
            "Confirme o pagamento"
          ],
          note: `Esta referência é válida até ${validityDate.toLocaleDateString('pt-AO')}`
        }
      },
      payment_channels: [
        "ATM",
        "Internet Banking", 
        "Multicaixa Express",
        "Balcão Bancário"
      ]
    };

    logWithTimestamp("Payment reference response prepared:", responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logWithTimestamp("Error processing AppyPay reference payment:", { 
      message: error.message, 
      stack: error.stack 
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || "Ocorreu um erro ao gerar a referência de pagamento"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});