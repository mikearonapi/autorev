/**
 * Supabase Client Configuration
 * 
 * This module initializes the Supabase client using environment variables.
 * For local development, create a .env file with:
 *   VITE_SUPABASE_URL=your_supabase_project_url
 *   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
 * 
 * For production (Vercel), add these as environment variables in your project settings.
 */

import { createClient } from '@supabase/supabase-js';

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
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Log warning if Supabase is not configured (only in development)
 */
if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[SuperNatural Motorsports] Supabase is not configured. ' +
    'Using local data fallback. To enable Supabase, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export default supabase;

