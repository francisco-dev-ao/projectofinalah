
import { createClient } from '@supabase/supabase-js';

// In Vite, environment variables are accessed via import.meta.env
// and must be prefixed with VITE_ to be available in the browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qitelgupnfdszpioxmnm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpdGVsZ3VwbmZkc3pwaW94bW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyODc2MTMsImV4cCI6MjA2MTg2MzYxM30.Z9r3womzMxjVm7gFH8j4Wb1ZNWgMwubqBdkKtRcPGlA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
