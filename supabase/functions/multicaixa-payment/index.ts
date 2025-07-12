
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
    logWithTimestamp("Received payment request:", requestData);

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // Fallback to the token from the request if environment variable not set
    const multicaixaToken = Deno.env.get("MULTICAIXA_FRAME_TOKEN") || 
                           requestData.token || 
                           "a53787fd-b49e-4469-a6ab-fa6acf19db48";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    // Create Supabase client using service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract relevant data from request
    const { reference, amount, orderId, invoiceId } = requestData;
    const originalOrderId = orderId || reference;

    // Verify reference is provided
    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Reference is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!amount) {
      return new Response(
        JSON.stringify({ error: "Amount is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Build payload for Multicaixa Express
    const multicaixaPayload = {
      reference: reference,
      amount: amount,
      token: multicaixaToken,
      mobile: requestData.mobile || "PAYMENT",
      card: requestData.card || "DISABLED",
      qrCode: requestData.qrCode || "PAYMENT",
      callbackUrl: requestData.callbackUrl || `${supabaseUrl}/functions/v1/multicaixa-callback`,
    };

    logWithTimestamp("Sending request to Multicaixa Express:", multicaixaPayload);

    // Make request to Multicaixa Express API
    const response = await fetch(
      "https://pagamentonline.emis.co.ao/online-payment-gateway/portal/frameToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(multicaixaPayload),
      }
    );

    // Handle API response with better error handling
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "Could not read error response";
      }
      
      logWithTimestamp("Error from Multicaixa API:", { 
        status: response.status, 
        body: errorText,
        request: multicaixaPayload
      });
      
      return new Response(
        JSON.stringify({ 
          error: `Multicaixa API error: ${response.status} ${errorText}`,
          details: "Check Edge Function logs for more details" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502  // Using 502 Bad Gateway for upstream API errors
        }
      );
    }

    // Parse response
    const multicaixaResponse = await response.json();
    logWithTimestamp("Received response from Multicaixa Express:", multicaixaResponse);

    // Only try to store payment reference if we got a valid ID from the response
    if (multicaixaResponse && multicaixaResponse.id) {
      try {
        const { error: refError } = await supabase
          .from("payment_references")
          .insert({
            order_id: originalOrderId,
            invoice_id: invoiceId,
            reference: reference,
            token: multicaixaResponse.id,
            amount: amount,
            status: "pending",
          });

        if (refError) {
          logWithTimestamp("Error storing payment reference:", refError);
        }
      } catch (storageError) {
        logWithTimestamp("Exception storing payment reference:", storageError);
        // Continue despite the storage error - don't fail the whole request
      }
    }

    // Return Multicaixa Express API response
    return new Response(JSON.stringify(multicaixaResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Log error
    logWithTimestamp("Error processing request:", { 
      message: error.message, 
      stack: error.stack 
    });
    
    // Return error response
    return new Response(
      JSON.stringify({
        error: error.message || "Ocorreu um erro ao processar a solicitação de pagamento"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
