import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Create and export a function to initialize Supabase client
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createSupabaseClient(supabaseUrl, supabaseKey);
} 