import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '@/utils/errors';

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Creates and returns a Supabase client instance
 * Uses singleton pattern to avoid creating multiple instances
 */
export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new DatabaseError(
        'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey);
    return supabaseInstance;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Still return a client with empty strings so app doesn't crash completely
    // But authentication will obviously fail
    supabaseInstance = createSupabaseClient('', '');
    return supabaseInstance;
  }
} 