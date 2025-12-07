/**
 * Supabase Client Configuration
 * 
 * This module initializes the Supabase client using environment variables.
 * 
 * For Vite projects, environment variables must be prefixed with VITE_ to be
 * exposed to the client. When using Vercel's Supabase integration, you need to
 * add these variables manually in Vercel:
 * 
 *   VITE_SUPABASE_URL = (copy from SUPABASE_URL)
 *   VITE_SUPABASE_ANON_KEY = (copy from SUPABASE_ANON_KEY)
 * 
 * For local development, create a .env file with:
 *   VITE_SUPABASE_URL=https://your-project.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your-anon-key
 */

import { createClient } from '@supabase/supabase-js';

// Try multiple environment variable patterns
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
if (import.meta.env.DEV) {
  if (isSupabaseConfigured) {
    console.log('[SuperNatural] Supabase connected:', supabaseUrl);
  } else {
    console.warn(
      '[SuperNatural] Supabase not configured. Using local data fallback.\n' +
      'To enable Supabase:\n' +
      '  1. Set VITE_SUPABASE_URL in .env (or Vercel)\n' +
      '  2. Set VITE_SUPABASE_ANON_KEY in .env (or Vercel)\n' +
      '\nNote: Vercel Supabase integration creates SUPABASE_URL but Vite needs VITE_ prefix.'
    );
  }
}

export default supabase;
