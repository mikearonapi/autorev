/**
 * Next.js Middleware for Supabase Auth
 * 
 * This middleware refreshes the user's session on every request.
 * Without this, auth cookies expire and users get logged out unexpectedly.
 * 
 * ENHANCED: Includes better error handling and session refresh logic
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Session refresh result cache to reduce auth calls
// Key: cookie signature, Value: { timestamp, user }
const sessionCache = new Map();
const CACHE_TTL_MS = 60000; // 1 minute cache

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip middleware if Supabase isn't configured
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  // Skip auth check for static assets and non-page routes
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // Static files
  ) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) => {
              // Ensure consistent cookie settings
              const enhancedOptions = {
                ...options,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              };
              supabaseResponse.cookies.set(name, value, enhancedOptions);
            });
          },
        },
      }
    );

    // IMPORTANT: Do NOT use getSession() here - it doesn't validate the token
    // Using getUser() ensures the session is verified and refreshed
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Log auth errors for debugging (but don't fail the request)
    if (error && process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] Auth check for ${pathname}:`, error.message);
    }

    // Add user info to response headers for debugging (dev only)
    if (process.env.NODE_ENV === 'development' && user) {
      supabaseResponse.headers.set('x-auth-user', user.id.slice(0, 8));
    }

  } catch (err) {
    // Log but don't fail - the page will handle auth state
    console.error('[Middleware] Auth error:', err.message);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * - API routes that don't need auth refresh
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

