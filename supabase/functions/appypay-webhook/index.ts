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
    // Get raw body data
    const rawData = await req.text();
    logWithTimestamp("Received AppyPay webhook:", rawData);

    // Parse JSON data
    const webhookData = JSON.parse(rawData);
    
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    // Create Supabase client using service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract data from AppyPay webhook format
    const reference = webhookData.reference;
    const entity = webhookData.entity;
    const amount = webhookData.amount;
    const status = webhookData.status; // "PAID", "EXPIRED", "CANCELLED"
    const paymentDate = webhookData.paymentDate;
    const transactionId = webhookData.transactionId;

    if (!reference) {
      logWithTimestamp("No reference in webhook data");
      return new Response("No reference provided", { status: 400 });
    }

    logWithTimestamp("Processing AppyPay webhook:", {
      reference,
      status,
      amount,
      transactionId
    });

    // Find the payment reference by reference number
    const { data: paymentRef, error: findError } = await supabase
      .from("payment_references")
      .select("order_id, id, invoice_id")
      .eq("reference", reference)
      .single();

    if (findError || !paymentRef) {
      logWithTimestamp("Payment reference not found:", { reference, error: findError });
      return new Response("Payment reference not found", { status: 404 });
    }

    const orderId = paymentRef.order_id;
    logWithTimestamp("Found order for webhook:", { orderId, reference });

    // Determine order status based on AppyPay status
    let orderStatus = "pending";
    let invoiceStatus = "unpaid";
    
    if (status === "PAID") {
      orderStatus = "paid";
      invoiceStatus = "paid";
    } else if (status === "EXPIRED" || status === "CANCELLED") {
      orderStatus = "cancelled";
      invoiceStatus = "unpaid";
    } else {
      orderStatus = "failed";
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

    // Update payment reference status
    const { error: paymentUpdateError } = await supabase
      .from("payment_references")
      .update({
        status: status === "PAID" ? "confirmed" : "failed",
        updated_at: new Date().toISOString(),
        webhook_response: webhookData
      })
      .eq("id", paymentRef.id);

    if (paymentUpdateError) {
      logWithTimestamp("Error updating payment reference:", paymentUpdateError);
    }

    // Record payment in payments table if successful
    if (status === "PAID") {
      const { data: orderData } = await supabase
        .from("orders")
        .select("total_amount, user_id")
        .eq("id", orderId)
        .single();

      if (orderData) {
        const { error: paymentInsertError } = await supabase
          .from("payments")
          .insert({
            order_id: orderId,
            amount_paid: amount || orderData.total_amount,
            method: "appypay_multicaixa",
            status: "confirmed",
            transaction_id: transactionId,
            notes: `AppyPay payment confirmed via webhook. Reference: ${reference}`,
            payment_date: paymentDate || new Date().toISOString()
          });

        if (paymentInsertError) {
          logWithTimestamp("Error inserting payment record:", paymentInsertError);
        } else {
          logWithTimestamp("Payment record created successfully");
        }
      }
    }

    // Update invoice status if payment was successful
    if (status === "PAID") {
      logWithTimestamp("Updating invoice status to paid for order:", orderId);
      
      const { error: invoiceUpdateError } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: paymentDate || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            payment_method: "appypay_multicaixa",
            transaction_id: transactionId,
            appypay_reference: reference,
            payment_amount: amount
          }
        })
        .eq("order_id", orderId);

      if (invoiceUpdateError) {
        logWithTimestamp("Error updating invoice status:", invoiceUpdateError);
      } else {
        logWithTimestamp("Invoice status updated to paid successfully");
      }
    }

    logWithTimestamp("AppyPay webhook processed successfully:", {
      orderId,
      reference,
      status,
      transactionId,
      orderStatus,
      invoiceStatus
    });

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: "Webhook processed successfully",
      orderId: orderId,
      status: orderStatus
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logWithTimestamp("Error processing AppyPay webhook:", { 
      message: error.message, 
      stack: error.stack 
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao processar webhook"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});