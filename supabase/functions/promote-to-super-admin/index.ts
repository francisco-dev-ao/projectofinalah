
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    // Create Supabase client with service role key for privileged access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request body
    const { email } = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Find user by email
    const { data: users, error: authError } = await supabase
      .auth
      .admin
      .listUsers();
    
    if (authError) {
      throw new Error(`Error fetching users: ${authError.message}`);
    }
    
    const targetUser = users?.users?.find(user => user.email === email);
    
    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Update user metadata to include super_admin role
    await supabase.auth.admin.updateUserById(
      targetUser.id,
      {
        user_metadata: {
          ...targetUser.user_metadata,
          role: 'super_admin'
        }
      }
    );
    
    // Update profile in public schema with a valid role value (super_admin)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', targetUser.id);
      
    if (profileError) {
      throw new Error(`Error updating profile: ${profileError.message}`);
    }
    
    // Create audit log entry
    await supabase
      .from('audit_logs')
      .insert({
        user_id: targetUser.id,
        action: 'promote_to_super_admin',
        details: `User ${email} promoted to super_admin role`
      });
    
    return new Response(JSON.stringify({ 
      success: true,
      message: `User ${email} successfully promoted to super_admin`,
      user: {
        id: targetUser.id,
        email: targetUser.email
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in promote-to-super-admin function:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
