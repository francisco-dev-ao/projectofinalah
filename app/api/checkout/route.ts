
import { NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Helper function for logging with timestamp
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : "");
}

export async function POST(req: Request) {
  try {
    const { orderId, invoiceId, amount, customerName, customerEmail } = await req.json();

    if (!orderId && !invoiceId) {
      return NextResponse.json({ error: "Either orderId or invoiceId is required" }, { status: 400 });
    }
    
    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    // Get multicaixa config
    const { data: configData } = await supabase
      .from("company_settings")
      .select("multicaixa_express_config")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const config = configData?.multicaixa_express_config || {
      frametoken: "a53787fd-b49e-4469-a6ab-fa6acf19db48",
      callback: "https://qitelgupnfdszpioxmnm.supabase.co/functions/v1/multicaixa-callback",
      success: "",
      error: ""
    };
    
    // Generate a payment reference that is simple and consistent
    // Format: first 5 chars of UUID (without hyphens) + timestamp (last 5 digits)
    const firstPart = uuidv4().replace(/-/g, '').substring(0, 5);
    const timestamp = Date.now().toString().slice(-5);
    const reference = firstPart + timestamp;
    
    logWithTimestamp("Generated payment reference", { reference, orderId, invoiceId });
    
    // Create payment reference record
    const { data: paymentRef, error: refError } = await supabase
      .from("payment_references")
      .insert({
        order_id: orderId || null,
        invoice_id: invoiceId || null,
        reference: reference,
        token: uuidv4(),
        amount: Number(amount),
        status: "pending",
        metadata: {
          customer_name: customerName,
          customer_email: customerEmail
        }
      })
      .select()
      .single();
      
    if (refError) {
      logWithTimestamp("Error creating payment reference", refError);
      return NextResponse.json({ error: "Failed to create payment reference" }, { status: 500 });
    }
    
    // Update the invoice with the reference
    if (invoiceId) {
      await supabase
        .from("invoices")
        .update({ 
          reference: reference,
          metadata: {
            payment_reference: reference,
            payment_method: "multicaixa"
          }
        })
        .eq("id", invoiceId);
    }

    // Build Multicaixa Express payload
    const multicaixaPayload = {
      reference: reference,
      amount: Number(amount),
      token: config.frametoken,
      mobile: "PAYMENT",
      card: "DISABLED",
      qrCode: "PAYMENT",
      callbackUrl: config.callback
    };

    // Send request to Multicaixa Express API
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

    if (!response.ok) {
      const errorText = await response.text();
      logWithTimestamp("Error from Multicaixa API", { status: response.status, body: errorText });
      return NextResponse.json({ 
        error: `Multicaixa API error: ${response.status} ${errorText}` 
      }, { status: 502 });
    }

    const multicaixaResponse = await response.json();
    logWithTimestamp("Received response from Multicaixa Express", multicaixaResponse);

    // Return the response
    return NextResponse.json({
      success: true,
      id: multicaixaResponse.id,
      reference: reference
    });
  } catch (error: any) {
    logWithTimestamp("Error processing checkout", { message: error.message, stack: error.stack });
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
