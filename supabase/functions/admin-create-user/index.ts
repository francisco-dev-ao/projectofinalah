
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

    // Get authentication headers from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify admin user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: adminUser }, error: adminAuthError } = await supabaseAdmin.auth.getUser(token);
    
    if (adminAuthError || !adminUser) {
      throw new Error('Authentication failed');
    }

    // Get admin user's profile to check role
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();
    
    if (profileError || !adminProfile) {
      throw new Error('Failed to retrieve admin profile');
    }

    // Only allow admins or super_admins to create users
    if (!['admin', 'super_admin'].includes(adminProfile.role)) {
      throw new Error('Unauthorized: Only admins can create users');
    }

    // Parse request body
    const { email, password, userMetadata } = await req.json();

    // Validate required fields
    if (!email || !password || !userMetadata?.name) {
      return new Response(
        JSON.stringify({ error: "Email, password and name are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create user in Auth
    const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // Automatically confirm email for admin-created users
      user_metadata: userMetadata,
    });

    if (error) {
      console.error("Error creating user:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-user function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred", success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
