
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Create a Supabase client with the auth role key
    const supabaseAdmin = createClient(
      // Supabase API URL - env var exported by default when deployed
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase SERVICE_ROLE KEY - env var exported by default when deployed
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all users from auth and join with profiles
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      throw authError;
    }
    
    const userIds = authUsers.users.map((user) => user.id);
    
    // Get profiles for these users
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('id', userIds);
      
    if (profilesError) {
      throw profilesError;
    }
    
    // Combine auth users and profiles
    const users = authUsers.users.map((user) => {
      const profile = profiles.find((p) => p.id === user.id) || {};
      return {
        ...user,
        profile,
      };
    });

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in get-users function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
