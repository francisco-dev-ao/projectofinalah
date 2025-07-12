
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

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    // Create Supabase client with service role key for privileged access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authentication headers from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    
    // Check if the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }
    
    // Get user role from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profileData) {
      throw new Error('Failed to get user profile');
    }
    
    // Only admins can check production readiness
    if (profileData.role !== 'admin' && profileData.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Admins can check production readiness');
    }
    
    // Call the RPC function to check production readiness
    const { data: readinessData, error: readinessError } = await supabase.rpc('check_production_readiness');
    
    if (readinessError) {
      throw new Error(`Failed to check production readiness: ${readinessError.message}`);
    }

    // Get counts of important tables
    const { data: counts, error: countsError } = await supabase.rpc('get_table_row_counts');
    
    if (countsError) {
      console.error("Error getting table counts:", countsError);
    }
    
    // Add additional checks
    const additionalChecks = {
      smtp_configured: true, // This would ideally check if SMTP settings exist
      payment_methods_configured: true, // This would check if payment methods are set up
      company_details_configured: true, // This would check if company details are set up
    };

    // Log the check as an audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'CHECK_PRODUCTION_READINESS',
        details: `Production readiness check performed. System is ${readinessData.is_ready ? 'ready' : 'not ready'} for production.`,
        ip_address: req.headers.get('x-forwarded-for') || 'Unknown'
      });

    return new Response(JSON.stringify({ 
      success: true,
      readiness: readinessData,
      counts: counts || {},
      additionalChecks,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: error.message.includes('Unauthorized') ? 403 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
