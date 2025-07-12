
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
    
    // Connect to database using DB URL
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    
    // Get user stats
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, role')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      throw new Error(`Error fetching user stats: ${usersError.message}`);
    }

    // Get order stats
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, status')
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      throw new Error(`Error fetching order stats: ${ordersError.message}`);
    }
    
    // Get database metadata using PostgreSQL queries
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('get_table_stats');
    
    if (tablesError) {
      console.error("Error fetching table stats:", tablesError);
    }
    
    // Get RLS policies data
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('get_rls_policies');
    
    if (rlsError) {
      console.error("Error fetching RLS stats:", rlsError);
    }
    
    // Summarize data
    const stats = {
      users: {
        total: usersData?.length || 0,
        admins: usersData?.filter(u => u.role === 'admin').length || 0,
        superAdmins: usersData?.filter(u => u.role === 'super_admin').length || 0,
        customers: usersData?.filter(u => u.role === 'cliente').length || 0
      },
      orders: {
        total: ordersData?.length || 0,
        pending: ordersData?.filter(o => o.status === 'pending').length || 0,
        completed: ordersData?.filter(o => o.status === 'completed').length || 0
      },
      tables: tablesData || { total: 0, tables: [] },
      rls: rlsData || { total: 0, policies: [] }
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
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
