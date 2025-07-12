import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Helper for log with timestamp
const logWithTimestamp = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] PAYMENT-CALLBACK: ${message}`, data ? JSON.stringify(data) : "");
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
    // Get request data
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams);
    let requestData: any = {};

    // Handle both GET and POST requests
    if (req.method === "GET") {
      requestData = queryParams;
      logWithTimestamp("Received GET callback:", requestData);
    } else if (req.method === "POST") {
      const rawData = await req.text();
      try {
        requestData = JSON.parse(rawData);
      } catch {
        // If not JSON, treat as query string data
        requestData = queryParams;
      }
      logWithTimestamp("Received POST callback:", requestData);
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    // Create Supabase client using service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract payment data - try multiple possible field names
    const reference = requestData.reference || 
                     requestData.ref || 
                     requestData.payment_reference || 
                     requestData.transaction_id ||
                     requestData.order_id;
    
    const status = requestData.status || 
                   requestData.payment_status || 
                   requestData.state ||
                   (requestData.success === true || requestData.success === "true" ? "paid" : "failed");
    
    const transactionId = requestData.transaction_id || 
                         requestData.txn_id || 
                         requestData.id ||
                         requestData.payment_id;

    const amount = requestData.amount || 
                   requestData.total_amount || 
                   requestData.value;

    logWithTimestamp("Extracted payment data:", {
      reference,
      status,
      transactionId,
      amount,
      allData: requestData
    });

    if (!reference) {
      logWithTimestamp("No payment reference found in callback data");
      return new Response(JSON.stringify({
        error: "No payment reference found in callback data",
        received_data: requestData
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      });
    }

    // Find the payment reference in our database
    let paymentRef = null;
    let searchError = null;

    // Try to find by different fields
    const searchFields = ['reference', 'token', 'order_id'];
    
    for (const field of searchFields) {
      const { data, error } = await supabase
        .from("payment_references")
        .select("*, orders(id, total_amount, user_id, status)")
        .eq(field, reference)
        .maybeSingle();
      
      if (data && !error) {
        paymentRef = data;
        logWithTimestamp(`Found payment reference by ${field}:`, paymentRef);
        break;
      }
      
      if (error) {
        searchError = error;
      }
    }

    // If not found in payment_references, try to find order directly
    if (!paymentRef) {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, total_amount, user_id, status")
        .eq("id", reference)
        .maybeSingle();
      
      if (orderData && !orderError) {
        paymentRef = {
          order_id: orderData.id,
          reference: reference,
          orders: orderData
        };
        logWithTimestamp("Found order directly:", paymentRef);
      }
    }

    if (!paymentRef) {
      logWithTimestamp("Payment reference not found:", { 
        reference, 
        searchError,
        searchFields: searchFields.join(", ")
      });
      
      return new Response(JSON.stringify({
        error: "Payment reference not found",
        reference: reference,
        search_attempted: searchFields
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404 
      });
    }

    const orderId = paymentRef.order_id;
    const orderData = paymentRef.orders;

    logWithTimestamp("Processing payment callback:", {
      orderId,
      reference,
      status,
      transactionId
    });

    // Determine order status
    let orderStatus = "pending";
    let invoiceStatus = "unpaid";
    
    // Normalize status
    const normalizedStatus = status ? status.toLowerCase().trim() : "";
    
    if (normalizedStatus === "paid" || 
        normalizedStatus === "success" || 
        normalizedStatus === "completed" || 
        normalizedStatus === "confirmed" ||
        normalizedStatus === "1" ||
        normalizedStatus === "true") {
      orderStatus = "paid";
      invoiceStatus = "paid";
    } else if (normalizedStatus === "failed" || 
               normalizedStatus === "error" || 
               normalizedStatus === "cancelled" ||
               normalizedStatus === "0" ||
               normalizedStatus === "false") {
      orderStatus = "cancelled";
      invoiceStatus = "unpaid";
    }

    // Update order status
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (orderUpdateError) {
      logWithTimestamp("Error updating order status:", orderUpdateError);
      throw new Error("Failed to update order status");
    }

    // Update payment reference if it exists
    if (paymentRef.id) {
      const { error: paymentUpdateError } = await supabase
        .from("payment_references")
        .update({
          status: orderStatus === "paid" ? "confirmed" : "failed",
          updated_at: new Date().toISOString(),
          callback_response: requestData
        })
        .eq("id", paymentRef.id);

      if (paymentUpdateError) {
        logWithTimestamp("Error updating payment reference:", paymentUpdateError);
      }
    }

    // Record payment in payments table if successful
    if (orderStatus === "paid") {
      const paymentAmount = amount ? parseFloat(amount) : (orderData?.total_amount || 0);
      
      const { error: paymentInsertError } = await supabase
        .from("payments")
        .insert({
          order_id: orderId,
          amount_paid: paymentAmount,
          method: "reference_payment",
          status: "confirmed",
          transaction_id: transactionId || reference,
          notes: `Payment confirmed via callback. Reference: ${reference}`,
          payment_date: new Date().toISOString()
        });

      if (paymentInsertError) {
        logWithTimestamp("Error inserting payment record:", paymentInsertError);
      } else {
        logWithTimestamp("Payment record created successfully");
      }
    }

    // Update invoice status if payment was successful
    if (orderStatus === "paid") {
      logWithTimestamp("Updating invoice status to paid for order:", orderId);
      
      const { error: invoiceUpdateError } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("order_id", orderId);

      if (invoiceUpdateError) {
        logWithTimestamp("Error updating invoice status:", invoiceUpdateError);
      } else {
        logWithTimestamp("Invoice status updated to paid successfully");
      }
    }

    logWithTimestamp("Payment callback processed successfully:", {
      orderId,
      reference,
      orderStatus,
      invoiceStatus,
      transactionId
    });

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: "Payment callback processed successfully",
      order_id: orderId,
      reference: reference,
      status: orderStatus,
      invoice_status: invoiceStatus,
      transaction_id: transactionId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logWithTimestamp("Error processing payment callback:", { 
      message: error.message, 
      stack: error.stack 
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao processar callback de pagamento",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});