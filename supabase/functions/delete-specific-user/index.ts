
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
    // Initialize Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // The email of the user to delete (in this case hardcoded for security)
    const userEmail = "deve@joao.ao";
    
    console.log(`Starting deletion process for user: ${userEmail}`);

    // Get user info first
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    
    if (userError) {
      console.error("Error finding user profile:", userError);
      throw userError;
    }
    
    if (!userData?.id) {
      // Look up directly in auth.users
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      const user = authData.users.find(u => u.email === userEmail);
      if (!user) {
        return new Response(
          JSON.stringify({ error: `User with email ${userEmail} not found` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      userData = { id: user.id };
    }
    
    const userId = userData.id;
    console.log(`Found user ID: ${userId}`);
    
    // 1. Delete all invoices related to user's orders
    console.log("Deleting invoices...");
    const { data: userOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('user_id', userId);
      
    if (ordersError) throw ordersError;
    
    const orderIds = userOrders?.map(order => order.id) || [];
    console.log(`Found ${orderIds.length} orders to process`);
    
    if (orderIds.length > 0) {
      // Delete invoices for these orders
      const { error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .delete()
        .in('order_id', orderIds);
        
      if (invoiceError) {
        console.error("Error deleting invoices:", invoiceError);
        throw invoiceError;
      }
      
      // Delete payments for these orders
      const { error: paymentsError } = await supabaseAdmin
        .from('payments')
        .delete()
        .in('order_id', orderIds);
        
      if (paymentsError) {
        console.error("Error deleting payments:", paymentsError);
        throw paymentsError;
      }
      
      // Delete order items for these orders
      const { error: orderItemsError } = await supabaseAdmin
        .from('order_items')
        .delete()
        .in('order_id', orderIds);
        
      if (orderItemsError) {
        console.error("Error deleting order items:", orderItemsError);
        throw orderItemsError;
      }
    }
    
    // 2. Delete services
    console.log("Deleting services...");
    const { error: servicesError } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('user_id', userId);
      
    if (servicesError) {
      console.error("Error deleting services:", servicesError);
      throw servicesError;
    }
    
    // 3. Delete domains
    console.log("Deleting domains...");
    const { error: domainsError } = await supabaseAdmin
      .from('domains')
      .delete()
      .eq('user_id', userId);
      
    if (domainsError) {
      console.error("Error deleting domains:", domainsError);
      throw domainsError;
    }
    
    // 4. Delete orders after deleting all related data
    console.log("Deleting orders...");
    const { error: deleteOrdersError } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('user_id', userId);
      
    if (deleteOrdersError) {
      console.error("Error deleting orders:", deleteOrdersError);
      throw deleteOrdersError;
    }
    
    // 5. Delete notifications
    console.log("Deleting notifications...");
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);
      
    if (notificationsError) {
      console.error("Error deleting notifications:", notificationsError);
      throw notificationsError;
    }
    
    // 6. Finally delete the user itself
    console.log("Deleting user account...");
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error("Error deleting user:", deleteUserError);
      throw deleteUserError;
    }
    
    console.log("User and all related data successfully deleted");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${userEmail} and all associated data successfully deleted.`,
        userId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    console.error("Error in delete-specific-user function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred", 
        details: error
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
