
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

interface InvoiceItem {
  invoice_id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  start_date?: string | null;
  end_date?: string | null;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the Admin key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Parse request body
    const { items } = await req.json();
    
    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: "Invalid items data. Expected an array." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Insert the invoice items
    const { data, error } = await supabaseClient
      .from('invoice_items')
      .insert(items);
      
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
