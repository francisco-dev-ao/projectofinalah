
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
    const callbackData = await req.json();
    logWithTimestamp("Received callback from Multicaixa Express:", callbackData);

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    // Create Supabase client using service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get payment reference data
    if (!callbackData.reference) {
      logWithTimestamp("Error: No reference in callback data", callbackData);
      return new Response(
        JSON.stringify({ error: "Missing reference in callback data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Find the payment reference in the database
    const { data: paymentRef, error: refError } = await supabase
      .from("payment_references")
      .select("*")
      .eq("reference", callbackData.reference)
      .maybeSingle();

    if (refError || !paymentRef) {
      logWithTimestamp("Error: Payment reference not found", { 
        reference: callbackData.reference, 
        error: refError 
      });
      return new Response(
        JSON.stringify({ error: "Payment reference not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get the order ID and invoice ID from the payment reference
    const orderId = paymentRef.order_id;
    const invoiceId = paymentRef.invoice_id;
    
    logWithTimestamp("Found payment reference:", { orderId, invoiceId, paymentRef });

    // Update payment reference status
    const { error: updateRefError } = await supabase
      .from("payment_references")
      .update({ status: callbackData.status === "ACCEPTED" ? "paid" : "failed" })
      .eq("id", paymentRef.id);

    if (updateRefError) {
      logWithTimestamp("Error updating payment reference status:", updateRefError);
    }

    // If payment was successful, update order status and create payment record
    if (callbackData.status === "ACCEPTED") {
      // Update order status to paid if order ID exists
      if (orderId) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", orderId);

        if (orderError) {
          logWithTimestamp("Error updating order status:", orderError);
        } else {
          logWithTimestamp("Order status updated to paid:", orderId);
        }
      }
      
      // Update invoice status to paid if invoice ID exists
      if (invoiceId) {
        const { error: invoiceError } = await supabase
          .from("invoices")
          .update({ 
            status: "paid",
            paid_at: new Date().toISOString(),
            metadata: {
              payment_method: "multicaixa",
              payment_reference: callbackData.reference,
              transaction_id: callbackData.transactionId,
              paid_at: new Date().toISOString()
            }
          })
          .eq("id", invoiceId);

        if (invoiceError) {
          logWithTimestamp("Error updating invoice status:", invoiceError);
        } else {
          logWithTimestamp("Invoice status updated to paid:", invoiceId);
        }
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: orderId,
          amount_paid: paymentRef.amount,
          method: "multicaixa",
          status: "confirmed",
          transaction_id: callbackData.transactionId || paymentRef.token,
          notes: "Pagamento confirmado via Multicaixa Express",
          payment_date: new Date().toISOString()
        });

      if (paymentError) {
        logWithTimestamp("Error creating payment record:", paymentError);
      }

      // Activate services for domain orders
      if (orderId) {
        try {
          // Get order items to check for domains
          const { data: orderItems, error: itemsError } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", orderId);

          if (!itemsError && orderItems) {
            for (const item of orderItems) {
              const itemName = (item.name || item.product_name || "").toLowerCase();
              
              // Check if item is a domain
              if (itemName.includes("domínio") || itemName.includes("domain")) {
                // Extract domain name from the item
                const domainMatch = itemName.match(/([a-z0-9][-a-z0-9]*\.(ao|co\.ao|org\.ao|edu\.ao|it\.ao))/i);
                
                if (domainMatch) {
                  const fullDomain = domainMatch[0];
                  const firstDot = fullDomain.indexOf(".");
                  const domainName = fullDomain.substring(0, firstDot);
                  const tld = fullDomain.substring(firstDot + 1);
                  
                  // Get order details to get user_id
                  const { data: order } = await supabase
                    .from("orders")
                    .select("user_id")
                    .eq("id", orderId)
                    .single();
                  
                  if (order) {
                    // Create domain record
                    const { error: domainError } = await supabase
                      .from("domains")
                      .insert({
                        user_id: order.user_id,
                        domain_name: domainName,
                        tld: tld,
                        status: "active",
                        registration_date: new Date().toISOString(),
                        expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
                        auto_renew: true,
                        metadata: {
                          order_id: orderId,
                          activated_by_payment: true,
                          payment_reference: callbackData.reference
                        }
                      });
                    
                    if (domainError) {
                      logWithTimestamp("Error creating domain record:", domainError);
                    } else {
                      logWithTimestamp("Domain activated successfully:", { domainName, tld });
                    }
                  }
                }
              }
            }
          }
        } catch (domainActivationError) {
          logWithTimestamp("Error activating domains:", domainActivationError);
        }
      }

      logWithTimestamp("Payment successful, order and services activated:", { orderId, invoiceId });
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Payment processed successfully and services activated" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else {
      // Payment failed
      logWithTimestamp("Payment failed:", callbackData);
      return new Response(
        JSON.stringify({ success: false, message: "Payment failed", details: callbackData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
  } catch (error) {
    // Log error
    logWithTimestamp("Error processing Multicaixa callback:", { 
      message: error.message, 
      stack: error.stack 
    });
    
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message || "Error processing callback" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
