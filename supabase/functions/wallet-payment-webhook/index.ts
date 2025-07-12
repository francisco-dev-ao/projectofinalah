
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
    const webhookData = await req.json();
    logWithTimestamp("Received payment webhook:", webhookData);

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    // Create Supabase client using service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract payment data from webhook
    const paymentReference = webhookData.reference;
    const status = webhookData.status;
    const transactionId = webhookData.transactionId;
    
    if (!paymentReference) {
      logWithTimestamp("Error: No reference in webhook data");
      return new Response(
        JSON.stringify({ error: "Missing reference in webhook data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Find the payment reference in the database
    const { data: paymentRef, error: refError } = await supabase
      .from("payment_references")
      .select("*")
      .eq("reference", paymentReference)
      .maybeSingle();

    if (refError || !paymentRef) {
      logWithTimestamp("Error: Payment reference not found", { 
        reference: paymentReference, 
        error: refError 
      });
      return new Response(
        JSON.stringify({ error: "Payment reference not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get the invoice ID
    const invoiceId = paymentRef.invoice_id;
    logWithTimestamp("Found payment reference:", { invoiceId, paymentRef });

    // Update payment reference status
    const { error: updateRefError } = await supabase
      .from("payment_references")
      .update({ 
        status: status === "ACCEPTED" ? "paid" : "failed",
        updated_at: new Date().toISOString()
      })
      .eq("id", paymentRef.id);

    if (updateRefError) {
      logWithTimestamp("Error updating payment reference status:", updateRefError);
    }

    // If payment was successful, update invoice and credit wallet
    if (status === "ACCEPTED") {
      // Update invoice status to paid
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", invoiceId);

      if (invoiceError) {
        logWithTimestamp("Error updating invoice status:", invoiceError);
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          invoice_id: invoiceId,
          amount_paid: paymentRef.amount,
          method: "multicaixa",
          status: "confirmed",
          transaction_id: transactionId || paymentRef.token,
          notes: "Pagamento confirmado via Multicaixa Express"
        });

      if (paymentError) {
        logWithTimestamp("Error creating payment record:", paymentError);
      }

      // Credit wallet through RPC function
      const { data: creditResult, error: creditError } = await supabase.rpc(
        'credit_wallet_from_invoice',
        {
          p_invoice_id: invoiceId,
          p_amount: paymentRef.amount
        }
      );

      if (creditError) {
        logWithTimestamp("Error crediting wallet:", creditError);
      } else {
        logWithTimestamp("Wallet credited successfully:", creditResult);
      }

      logWithTimestamp("Payment successful, wallet credited:", { invoiceId });
      return new Response(
        JSON.stringify({ success: true, message: "Payment processed successfully and wallet credited" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else {
      // Payment failed
      logWithTimestamp("Payment failed:", webhookData);
      return new Response(
        JSON.stringify({ success: false, message: "Payment failed", details: webhookData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
  } catch (error) {
    // Log error
    logWithTimestamp("Error processing payment webhook:", { 
      message: error.message, 
      stack: error.stack 
    });
    
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message || "Error processing webhook" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
