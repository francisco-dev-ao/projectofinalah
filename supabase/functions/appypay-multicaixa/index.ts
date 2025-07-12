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

// Generate random number for merchant transaction ID
const generateRandomId = (length: number): string => {
  let result = Math.floor(Math.random() * 9) + 1; // First digit 1-9
  for (let i = 0; i < length - 1; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result.toString();
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
    logWithTimestamp("Received AppyPay payment request:", requestData);

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // AppyPay configuration from environment or request
    const isTestMode = Deno.env.get("APPYPAY_TEST_MODE") === "true" || requestData.testMode;
    
    let authUrl, paymentUrl, clientId, clientSecret, referenceKey, paymentMethod;
    
    if (isTestMode) {
      authUrl = "https://login.microsoftonline.com/appypaydev.onmicrosoft.com/oauth2/token";
      paymentUrl = "https://app-appypay-api-tst.azurewebsites.net/v1.2/charges";
      clientId = Deno.env.get("APPYPAY_TEST_CLIENT_ID") || requestData.testClientId;
      clientSecret = Deno.env.get("APPYPAY_TEST_CLIENT_SECRET") || requestData.testClientSecret;
      referenceKey = Deno.env.get("APPYPAY_TEST_REFERENCE_KEY") || requestData.testReferenceKey;
      paymentMethod = Deno.env.get("APPYPAY_TEST_PAYMENT_METHOD") || requestData.testPaymentMethod;
    } else {
      authUrl = "https://login.microsoftonline.com/appypay.co.ao/oauth2/token";
      paymentUrl = "https://api.appypay.co.ao/v1.2/charges";
      clientId = Deno.env.get("APPYPAY_CLIENT_ID") || requestData.clientId;
      clientSecret = Deno.env.get("APPYPAY_CLIENT_SECRET") || requestData.clientSecret;
      referenceKey = Deno.env.get("APPYPAY_REFERENCE_KEY") || requestData.referenceKey;
      paymentMethod = Deno.env.get("APPYPAY_PAYMENT_METHOD") || requestData.paymentMethod;
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    if (!clientId || !clientSecret || !referenceKey || !paymentMethod) {
      throw new Error("AppyPay configuration is incomplete");
    }

    // Create Supabase client using service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract relevant data from request
    const { orderId, amount, phoneNumber, paymentType = "multicaixa" } = requestData;

    if (!orderId || !amount || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Order ID, amount and phone number are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Step 1: Get OAuth token
    logWithTimestamp("Getting OAuth token from AppyPay");
    
    const authResponse = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&resource=${referenceKey}`,
    });

    if (!authResponse.ok) {
      throw new Error(`OAuth authentication failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    
    if (!authData.access_token) {
      throw new Error("Failed to obtain access token from AppyPay");
    }

    logWithTimestamp("OAuth token obtained successfully");

    // Step 2: Create payment
    const merchantTransactionId = generateRandomId(14);
    
    const paymentPayload = {
      capture: true,
      amount: parseFloat(amount.toString()),
      orderOrigin: 0,
      paymentMethod: paymentMethod,
      description: `Payment for order ${orderId}`,
      merchantTransactionId: merchantTransactionId,
      paymentInfo: {
        phoneNumber: phoneNumber
      }
    };

    logWithTimestamp("Creating payment with AppyPay:", paymentPayload);

    const paymentResponse = await fetch(paymentUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${authData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      logWithTimestamp("Payment creation failed:", { 
        status: paymentResponse.status, 
        body: errorText 
      });
      
      throw new Error(`Payment creation failed: ${paymentResponse.status} ${errorText}`);
    }

    const paymentData = await paymentResponse.json();
    logWithTimestamp("Payment response received:", paymentData);

    // Step 3: Process response and update order
    const status = paymentData.responseStatus?.successful;
    const responseMessage = paymentData.responseStatus?.message;
    const appypayId = paymentData.id;

    let orderStatus = "pending";
    if (status === true) {
      orderStatus = "paid";
    } else if (status === false) {
      orderStatus = "cancelled";
    } else {
      orderStatus = "failed";
    }

    // Update order status in database
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (updateError) {
      logWithTimestamp("Error updating order status:", updateError);
    }

    // Store payment reference
    const { error: paymentError } = await supabase
      .from("payment_references")
      .insert({
        order_id: orderId,
        reference: merchantTransactionId,
        token: appypayId,
        amount: amount,
        status: status ? "confirmed" : "pending",
        payment_method: paymentType,
        phone_number: phoneNumber,
        appypay_response: paymentData
      });

    if (paymentError) {
      logWithTimestamp("Error storing payment reference:", paymentError);
    }

    // Return response
    return new Response(JSON.stringify({
      success: status,
      message: responseMessage,
      merchantTransactionId: merchantTransactionId,
      appypayId: appypayId,
      orderStatus: orderStatus,
      paymentData: paymentData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logWithTimestamp("Error processing AppyPay payment:", { 
      message: error.message, 
      stack: error.stack 
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || "Ocorreu um erro ao processar o pagamento"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});