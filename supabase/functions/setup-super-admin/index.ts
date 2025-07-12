
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
    
    // Get request body if provided (allowing custom email)
    const requestData = req.headers.get("content-type")?.includes("application/json") 
      ? await req.json().catch(() => ({})) 
      : {};
      
    const adminEmail = requestData.email || 'lania@angohost.co.ao';
    
    // Check if the user already exists in auth
    const { data: authData, error: authError } = await supabase
      .auth
      .admin
      .listUsers();
    
    if (authError) {
      throw new Error(`Error checking existing users: ${authError.message}`);
    }
    
    let existingAuthUser = authData?.users?.find(user => user.email === adminEmail);
    
    // Check if the profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', existingAuthUser?.id || '')
      .single();
    
    if (existingAuthUser && existingProfile && existingProfile.role === 'super_admin') {
      return new Response(JSON.stringify({ 
        message: 'Admin user already exists', 
        user: existingAuthUser,
        profile: existingProfile 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // If user exists but is not super_admin, promote to super_admin
    if (existingAuthUser && existingProfile && existingProfile.role !== 'super_admin') {
      // Update profile to set role as super_admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'super_admin',
        })
        .eq('id', existingAuthUser.id);
      
      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`);
      }
      
      return new Response(JSON.stringify({ 
        message: 'User promoted to super_admin role successfully', 
        user: existingAuthUser,
        profile: {...existingProfile, role: 'super_admin'}
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // If user doesn't exist, create new super_admin user
    if (!existingAuthUser) {
      // Create admin user using Auth API
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: 'Admin@2023', // Temporary password, change in production
        email_confirm: true, // Automatically confirm email
        user_metadata: {
          name: 'Super Administrador',
          role: 'super_admin',
        },
      });
      
      if (createError) {
        throw new Error(`Error creating user: ${createError.message}`);
      }

      // Update profile to set role as super_admin
      if (authUser?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            role: 'super_admin',
            name: 'Super Administrador',
          })
          .eq('id', authUser.user.id);
        
        if (profileError) {
          throw new Error(`Error updating profile: ${profileError.message}`);
        }
        
        return new Response(JSON.stringify({ 
          message: 'Super admin user created successfully', 
          user: authUser?.user
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ 
      error: 'Failed to create or update super admin user'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
