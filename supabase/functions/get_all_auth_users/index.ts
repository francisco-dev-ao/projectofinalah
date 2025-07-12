
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This is a simple implementation of a function to get all auth users
serve(async (req) => {
  // Create a Supabase client with the auth role key
  const supabaseClient = createClient(
    // Supabase API URL - env var exported by default when deployed
    Deno.env.get("SUPABASE_URL") ?? "",
    // Supabase SERVICE_ROLE KEY - env var exported by default when deployed
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get all users from the auth schema
    const { data: users, error } = await supabaseClient.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(users.users), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
