import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { filters } = await req.json();
    
    // AppyPay API configuration with your credentials
    const clientId = "14590a63-158d-4eed-a108-47ffcd6122c4";
    const clientSecret = "U5W8Q~YFBrH8zktWmEIPDPsZGWskKWNCtTsyYbi4";
    const apiBaseUrl = "https://api.appypay.co.ao/v1";

    // Step 1: Authenticate with AppyPay API
    const authResponse = await fetch(`${apiBaseUrl}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        clientId: clientId,
        clientSecret: clientSecret
      })
    });

    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.accessToken || authData.access_token;
    // Step 2: Get references
    // Build query parameters
    const params = new URLSearchParams();
    if (filters?.amountFrom) params.append('amountFrom', filters.amountFrom.toString());
    if (filters?.amountTo) params.append('amountTo', filters.amountTo.toString());
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.skip) params.append('skip', filters.skip.toString());

    const response = await fetch(`${apiBaseUrl}/references?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`AppyPay API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});