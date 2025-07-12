import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper for log with timestamp
const logWithTimestamp = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : "");
};

// Generate reference number (formato: 9 dígitos)
const generateReference = (): string => {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
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
    const entity = Deno.env.get("APPYPAY_ENTITY") || "11333"; // Entidade real AppyPay
    const isTestMode = false; // Sempre usar modo real

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

    // Generate payment reference
    const reference = generateReference();
    
    // Calculate validity date
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + validityDays);

    // Create payment reference data
    const paymentReferenceData = {
      entity: entity,
      reference: reference,
      amount: parseFloat(amount.toString()),
      description: description || `Pagamento do pedido ${orderId}`,
      validity_date: validityDate.toISOString(),
      status: "pending",
      test_mode: isTestMode
    };

    logWithTimestamp("Generated payment reference:", paymentReferenceData);

    // Store payment reference in database
    const { data: paymentRef, error: insertError } = await supabase
      .from("payment_references")
      .insert({
        order_id: orderId,
        reference: reference,
        amount: parseFloat(amount.toString()),
        status: "pending",
        payment_method: "appypay_reference",
        entity: entity,
        description: paymentReferenceData.description,
        validity_date: validityDate.toISOString(),
        appypay_response: paymentReferenceData
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
      entity: entity,
      reference: reference,
      amount: parseFloat(amount.toString()),
      description: paymentReferenceData.description,
      validity_date: validityDate.toISOString(),
      validity_days: validityDays,
      order_id: orderId,
      instructions: {
        pt: {
          title: "Como pagar por referência",
          steps: [
            "Dirija-se a um ATM, Internet Banking ou Multicaixa Express",
            `Selecione "Pagamentos" e depois "Outros Serviços"`,
            `Insira a Entidade: ${entity}`,
            `Insira a Referência: ${reference}`,
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

    logWithTimestamp("Payment reference created successfully:", responseData);

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