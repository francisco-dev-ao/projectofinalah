
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Parse request body to get userId if provided
    const { userId } = await req.json();

    // Get auth logs (in a real implementation, you would filter by user ID)
    // For now, return sample logs
    const logs = [
      {
        timestamp: Date.now(),
        event: "login",
        remote_addr: "192.168.1.1",
        user_id: userId || "unknown",
      },
      {
        timestamp: Date.now() - 86400000, // 1 day ago
        event: "login",
        remote_addr: "192.168.1.2",
        user_id: userId || "unknown",
      }
    ];

    return new Response(
      JSON.stringify({ logs }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in get-auth-logs function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
