/**
 * Supabase Server Client for API Routes
 * 
 * SINGLETON instances for server-side API routes.
 * DO NOT create new clients per request - use these shared instances.
 * 
 * Usage in API routes:
 *   import { getPublicClient, getServiceClient } from '@/lib/supabaseServer';
 *   
 *   export async function GET(request) {
 *     const supabase = getPublicClient();  // For RLS-safe queries
 *     // or
 *     const supabase = getServiceClient(); // For admin operations (bypasses RLS)
 *   }
 * 
 * Why this matters:
 * - Supabase free tier: 60 concurrent connections
 * - Creating new client per request exhausts pool under load
 * - Shared clients reuse connections efficiently
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Singleton instances - created once at module load
let _publicClient = null;
let _serviceClient = null;

/**
 * Check if Supabase is configured
 */
export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Get the public (anon key) Supabase client.
 * Subject to Row Level Security (RLS).
 * Safe to use for public API endpoints.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getPublicClient() {
  if (!isConfigured) return null;
  
  if (!_publicClient) {
    _publicClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return _publicClient;
}

/**
 * Get the service role Supabase client.
 * BYPASSES Row Level Security (RLS).
 * Use only for admin operations and internal routes.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  
  if (!_serviceClient) {
    _serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return _serviceClient;
}

/**
 * Get the appropriate client based on need.
 * Convenience function for routes that need conditional access.
 * 
 * @param {'public' | 'service'} type - Which client type to return
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getClient(type = 'public') {
  return type === 'service' ? getServiceClient() : getPublicClient();
}

/**
 * Create an authenticated client for a specific user's Bearer token.
 * This MUST create a new client per request since the auth context is per-user.
 * 
 * Use sparingly - only for routes that need user-specific RLS context.
 * For admin operations, use getServiceClient() instead.
 * 
 * @param {string} bearerToken - The user's JWT token
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function createAuthenticatedClient(bearerToken) {
  if (!isConfigured || !bearerToken) return null;
  
  // Note: This creates a new client per call - this is intentional
  // because the auth context is per-user and cannot be shared.
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Extract Bearer token from request headers
 * @param {Request} request - The incoming request
 * @returns {string | null} - The token or null
 */
export function getBearerToken(request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export default { 
  getPublicClient, 
  getServiceClient, 
  getClient, 
  createAuthenticatedClient,
  getBearerToken,
  isConfigured 
};
