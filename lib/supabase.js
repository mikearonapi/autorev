/**
 * Supabase Client Configuration for Next.js
 * 
 * Uses NEXT_PUBLIC_ prefixed environment variables which are
 * automatically exposed to the browser by Next.js.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Flag to check if Supabase is configured
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Supabase client instance
 * Will be null if environment variables are not configured
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
 * Log info about Supabase configuration (only in development)
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (isSupabaseConfigured) {
    console.log('[SuperNatural] Supabase connected:', supabaseUrl);
  } else {
    console.warn(
      '[SuperNatural] Supabase not configured. Using local data fallback.\n' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }
}

export default supabase;







