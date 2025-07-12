
// This is a stub edge function implementation
// Follow the Supabase Edge Function schema

import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface UserUpdateData {
  name: string;
  role: string;
  nif?: string;
  company_name?: string;
  phone?: string;
  address?: string;
  phone_invoice?: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the auth role key
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default when deployed
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase SERVICE_ROLE KEY - env var exported by default when deployed
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the request body
    const { userId, userData } = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!userData) {
      throw new Error("User data is required");
    }

    // Update the user profile
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({
        name: userData.name,
        role: userData.role,
        nif: userData.nif,
        company_name: userData.company_name,
        phone: userData.phone,
        address: userData.address,
        phone_invoice: userData.phone_invoice,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (profileError) {
      throw profileError;
    }

    return new Response(JSON.stringify({ success: true }), {
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
