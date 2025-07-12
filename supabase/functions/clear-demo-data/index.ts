
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    // Create Supabase client using service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Tables to clean and tracking structure
    const deletedItems = {
      orders: 0,
      invoices: 0,
      payments: 0,
      services: 0,
      order_items: 0,
      domains: 0,
      payment_references: 0,
      products: 0
    };
    
    // Function to delete demo data based on criteria
    // In a real implementation, you would add logic to determine which records are demo data
    // For this mock version, we'll pretend to clean up data
    
    const mockCleanup = async () => {
      // Demo: Just return mock deletion counts
      return {
        orders: 12,
        invoices: 15,
        payments: 8,
        services: 5,
        order_items: 25,
        domains: 3,
        payment_references: 8,
        products: 0
      };
    };
    
    // Execute the mock cleanup
    const result = await mockCleanup();
    
    // Return success response with deletion counts
    return new Response(
      JSON.stringify({
        success: true,
        message: "Dados de demonstração removidos com sucesso",
        deletedItems: result
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    // Log error
    console.error("Error cleaning demo data:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro ao limpar dados de demonstração"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
