/**
 * Service-role Supabase client for scripts and server utilities.
 * Creates a standalone client that works in Node.js scripts without Next.js.
 * Do not expose this to the browser.
 */
import { createClient } from '@supabase/supabase-js';

// For Node.js scripts, we create our own client rather than importing from supabase.js
// which uses browser-specific @supabase/ssr
let _client = null;

/**
 * Returns a Supabase client suitable for server-side scripts.
 * Uses service role key to bypass RLS.
 */
export function getServiceSupabase() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  const key = serviceKey || anonKey;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _client;
}

export default getServiceSupabase;

