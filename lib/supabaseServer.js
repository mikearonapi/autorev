/**
 * Server-Side Supabase Client Utilities
 * 
 * Provides proper Supabase clients for API routes and server components.
 * Uses @supabase/ssr for cookie-based session management.
 * 
 * Key differences from client-side:
 * - Creates fresh client per request (stateless)
 * - Properly handles cookies for session validation
 * - Uses getUser() instead of getSession() for security
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Check if Supabase is configured
 */
export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// =============================================================================
// PUBLIC CLIENT (uses anon key, subject to RLS)
// =============================================================================

let publicClient = null;

/**
 * Get the shared public client (uses anon key, subject to RLS)
 * Use this for public operations where RLS should apply.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getPublicClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabaseServer] Supabase not configured');
    return null;
  }
  
  if (!publicClient) {
    publicClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return publicClient;
}

// =============================================================================
// SERVICE ROLE CLIENT (bypasses RLS)
// =============================================================================

let serviceClient = null;

/**
 * Get the shared service role client (bypasses RLS)
 * Use this for admin operations or when RLS should be bypassed.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('[supabaseServer] Service role not configured');
    return null;
  }
  
  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return serviceClient;
}

// =============================================================================
// BEARER TOKEN AUTH (for API routes with token auth)
// =============================================================================

/**
 * Extract bearer token from request Authorization header
 * 
 * @param {Request} request
 * @returns {string | null}
 */
export function getBearerToken(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Create a Supabase client authenticated with a specific access token
 * Useful for API routes that receive a Bearer token.
 * 
 * @param {string} accessToken - The JWT access token
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function createAuthenticatedClient(accessToken) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabaseServer] Supabase not configured');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =============================================================================
// COOKIE-BASED SSR CLIENT
// =============================================================================

/**
 * Create a Supabase client for server-side operations (Route Handlers, Server Components)
 * This client has access to the user's session via cookies.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export async function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabaseServer] Supabase not configured');
    return null;
  }

  const cookieStore = await cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // setAll is called from Server Components where cookies can't be modified
            // This is expected behavior - the middleware handles cookie setting
          }
        },
      },
    }
  );
}

/**
 * Get the authenticated user from a request.
 * Uses getUser() which validates the JWT on the server - more secure than getSession().
 * 
 * @returns {Promise<{user: object|null, error: Error|null}>}
 */
export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  
  if (!supabase) {
    return { user: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (err) {
    console.error('[supabaseServer] Error getting user:', err);
    return { user: null, error: err };
  }
}

/**
 * Validate user session and return user with profile
 * Combines auth check with profile fetch for common use case
 * 
 * @returns {Promise<{user: object|null, profile: object|null, error: Error|null}>}
 */
export async function getAuthenticatedUserWithProfile() {
  const supabase = await createServerSupabaseClient();
  
  if (!supabase) {
    return { user: null, profile: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { user: null, profile: null, error: authError };
    }

    const PROFILE_COLS = 'id, display_name, avatar_url, bio, location, website, tier, tier_expires_at, trial_ends_at, stripe_customer_id, referral_code, referred_by, email_verified, onboarding_completed, preferences, created_at, updated_at';
    
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(PROFILE_COLS)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('[supabaseServer] Profile fetch error:', profileError);
      // Return user even if profile fails - profile might not exist yet
      return { user, profile: null, error: null };
    }

    return { user, profile, error: null };
  } catch (err) {
    console.error('[supabaseServer] Error getting user with profile:', err);
    return { user: null, profile: null, error: err };
  }
}

/**
 * Require authentication for an API route.
 * Returns the user if authenticated, throws an error if not.
 * 
 * @throws {Error} If user is not authenticated
 * @returns {Promise<{user: object, profile: object|null, supabase: object}>}
 */
export async function requireAuth() {
  const supabase = await createServerSupabaseClient();
  
  if (!supabase) {
    throw new Error('AUTH_NOT_CONFIGURED');
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('AUTH_REQUIRED');
  }

  const PROFILE_COLS = 'id, display_name, avatar_url, bio, location, website, tier, tier_expires_at, trial_ends_at, stripe_customer_id, referral_code, referred_by, email_verified, onboarding_completed, preferences, created_at, updated_at';
  
  // Optionally fetch profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select(PROFILE_COLS)
    .eq('id', user.id)
    .maybeSingle();

  return { user, profile, supabase };
}

/**
 * Create an API response helper for auth errors
 * 
 * @param {string} errorCode - The error code
 * @returns {Response} NextResponse with appropriate status
 */
export function createAuthErrorResponse(errorCode) {
  switch (errorCode) {
    case 'AUTH_NOT_CONFIGURED':
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      );
    case 'AUTH_REQUIRED':
      return NextResponse.json(
        { error: 'Authentication required', requiresAuth: true },
        { status: 401 }
      );
    case 'AUTH_INVALID':
      return NextResponse.json(
        { error: 'Invalid or expired session', requiresAuth: true },
        { status: 401 }
      );
    default:
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
  }
}

/**
 * Middleware helper: Refresh session on request
 * Call this at the start of API routes that need fresh session
 * 
 * @param {Request} request
 * @returns {Promise<{user: object|null, supabase: object|null, response: Response|null}>}
 */
export async function refreshSessionFromRequest(request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, supabase: null, response: null };
  }

  let response = null;
  
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Store cookies to set on response
          response = { cookiesToSet };
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  return { user, supabase, response };
}
