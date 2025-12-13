/**
 * Supabase Client Configuration for Next.js
 * 
 * Provides two clients:
 * 1. supabase - Uses anon key, subject to RLS (for client-side)
 * 2. supabaseServiceRole - Uses service role key, bypasses RLS (for server-side)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Flag to check if Supabase is configured
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Supabase client instance (anon key - subject to RLS)
 * Use this for client-side operations
 */
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : null;

/**
 * Supabase service role client (bypasses RLS)
 * Use this ONLY for server-side operations that need to bypass RLS
 * NEVER expose this to the client
 */
export const supabaseServiceRole = (isSupabaseConfigured && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Log info about Supabase configuration (only in development)
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (isSupabaseConfigured) {
    console.log('[AutoRev] Supabase connected:', supabaseUrl);
  } else {
    console.warn(
      '[AutoRev] Supabase not configured. Using local data fallback.\n' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }
}

export default supabase;







