
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
      
    const adminEmail = requestData.email || 'support@angohost.ao';
    
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
    
    if (existingAuthUser && existingProfile && existingProfile.role === 'admin') {
      return new Response(JSON.stringify({ 
        message: 'Admin user already exists with admin role', 
        user: existingAuthUser,
        profile: existingProfile 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // If user exists but is not admin, promote to admin
    if (existingAuthUser && existingProfile && existingProfile.role !== 'admin') {
      // Update profile to set role as admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
        })
        .eq('id', existingAuthUser.id);
      
      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`);
      }
      
      return new Response(JSON.stringify({ 
        message: 'User promoted to admin role successfully', 
        user: existingAuthUser,
        profile: {...existingProfile, role: 'admin'}
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // If user doesn't exist, create new admin user
    if (!existingAuthUser) {
      // Create admin user using Auth API
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: 'Admin@2023', // Temporary password, change in production
        email_confirm: true, // Automatically confirm email
        user_metadata: {
          name: adminEmail === 'fj@francisco.ao' ? 'Francisco José' : 'ANGOHOST, LDA',
          role: 'admin',
          nif: adminEmail === 'fj@francisco.ao' ? '123456789' : '5000088927'
        },
      });
      
      if (createError) {
        throw new Error(`Error creating user: ${createError.message}`);
      }

      // Update profile to set role as admin
      if (authUser?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            name: adminEmail === 'fj@francisco.ao' ? 'Francisco José' : 'ANGOHOST, LDA',
            nif: adminEmail === 'fj@francisco.ao' ? '123456789' : '5000088927',
          })
          .eq('id', authUser.user.id);
        
        if (profileError) {
          throw new Error(`Error updating profile: ${profileError.message}`);
        }

        // Check if profile creation trigger worked, otherwise create manually
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.user.id)
          .single();
        
        if (fetchError || !profile) {
          // Create profile manually
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.user.id,
              name: adminEmail === 'fj@francisco.ao' ? 'Francisco José' : 'ANGOHOST, LDA',
              role: 'admin',
              nif: adminEmail === 'fj@francisco.ao' ? '123456789' : '5000088927',
            });
          
          if (insertError) {
            throw new Error(`Error creating profile manually: ${insertError.message}`);
          }
        }
        
        return new Response(JSON.stringify({ 
          message: 'Admin user created successfully', 
          user: authUser?.user
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ 
      error: 'Failed to create or update admin user'
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
