import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if invoices bucket exists
    const { data: buckets, error: bucketsError } = await supabaseClient.storage.listBuckets();

    if (bucketsError) {
      throw bucketsError;
    }

    if (buckets.some(bucket => bucket.name === 'invoices')) {
      // Bucket already exists, just ensure policies are set correctly
      console.log('Invoices bucket already exists, ensuring policies are set');
    } else {
      // Create invoices bucket
      const { error: createError } = await supabaseClient.storage.createBucket('invoices', {
        public: true,
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        throw createError;
      }

      console.log('Invoices bucket created successfully');
    }

    // Ensure public access policy exists
    const { error: policyError } = await supabaseClient
      .rpc('setup_invoice_bucket_policies', {
        is_local: Deno.env.get('ENVIRONMENT') === 'local'
      });

    if (policyError) {
      console.warn('Warning: Failed to set up policies:', policyError);
      // Don't throw error here, as policies might already exist
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice bucket initialized successfully',
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    );
  } catch (error) {
    // Log and return error
    console.error('Error initializing invoice bucket:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500,
      }
    );
  }
});
