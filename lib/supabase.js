/**
 * Supabase Client Configuration for Next.js
 * 
 * Provides two clients:
 * 1. supabase - Uses anon key with SSR cookie-based sessions (for client-side)
 * 2. supabaseServiceRole - Uses service role key, bypasses RLS (for server-side/scripts)
 * 
 * IMPORTANT: Client uses @supabase/ssr for cookie-based session persistence
 * which works reliably across mobile browsers (iOS Safari ITP, Android Chrome)
 * 
 * NOTE: This module works in both browser and Node.js environments.
 * The browser client uses @supabase/ssr, server/scripts use @supabase/supabase-js.
 * 
 * FIXED (Jan 2026): Replaced async import with synchronous import to prevent
 * race condition that caused auth failures on Android devices. The previous
 * async import pattern meant the fallback createClient (without cookie support)
 * was always used initially, breaking session persistence on slower devices.
 */

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Flag to check if Supabase is configured
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Flag to check if running in browser
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Supabase client instance (anon key - subject to RLS)
 * 
 * In browser: Uses @supabase/ssr createBrowserClient for cookie-based sessions
 * In Node.js: Uses regular @supabase/supabase-js createClient
 * 
 * CRITICAL: Browser MUST use createBrowserClient for proper cookie-based auth.
 * This is essential for session persistence on mobile browsers (Android Chrome,
 * iOS Safari with ITP). The regular createClient does not handle cookies properly.
 */
let supabase = null;

if (isSupabaseConfigured) {
  if (isBrowser) {
    // Browser environment - use SSR client for cookie-based auth
    // MUST use createBrowserClient for proper session persistence on mobile
    supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  } else {
    // Node.js environment (scripts, API routes) - use regular client
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
}

export { supabase };

/**
 * Supabase service role client (bypasses RLS)
 * Use this ONLY for server-side operations that need to bypass RLS
 * NEVER expose this to the client
 * 
 * Works in both Next.js API routes and Node.js scripts
 */
export const supabaseServiceRole = (supabaseUrl && supabaseServiceRoleKey)
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







