/**
 * Next.js Middleware for Supabase Auth
 * 
 * This middleware refreshes the user's session on every request.
 * Without this, auth cookies expire and users get logged out unexpectedly.
 * 
 * CRITICAL FOR GOOGLE OAUTH:
 * - Must process /auth/callback route to receive session cookies
 * - Must NOT skip the callback or session won't persist
 * - Must use consistent cookie options (sameSite: 'lax', secure in prod)
 * 
 * FIX 2024-12-27: Ensured callback route is processed, enhanced cookie options
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/**
 * Get enhanced cookie options for cross-browser compatibility
 * Must match options used in /auth/callback/route.js
 */
function getEnhancedCookieOptions(originalOptions = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...originalOptions,
    path: '/', // Ensure cookie is available on all routes
    sameSite: 'lax', // Required for OAuth redirects
    secure: isProduction, // Only secure in production (HTTPS)
  };
}

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

  const pathname = request.nextUrl.pathname;

  // Skip for static assets only - NOT for /auth/callback!
  // The callback route handler manages its own cookies, but middleware
  // still needs to run for session validation on subsequent requests
  if (
    pathname.startsWith('/_next/') ||
    pathname.includes('.') // Static files (images, fonts, etc.)
  ) {
    return supabaseResponse;
  }

  // Skip session refresh for API routes - they handle auth via Bearer token
  // or createServerSupabaseClient in the route handler
  // BUT still allow the middleware to pass through (don't return early for all API routes)
  const skipSessionRefresh = pathname.startsWith('/api/');

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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) => {
              // Apply enhanced cookie options for consistency
              const enhancedOptions = getEnhancedCookieOptions(options);
              supabaseResponse.cookies.set(name, value, enhancedOptions);
            });
          },
        },
      }
    );

    // Skip getUser() call for API routes to reduce latency
    // API routes should validate auth themselves
    if (!skipSessionRefresh) {
      // IMPORTANT: Do NOT use getSession() here - it doesn't validate the token
      // Using getUser() ensures the session is verified and refreshed
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      // Log auth state for debugging (dev only)
      if (process.env.NODE_ENV === 'development') {
        if (error) {
          console.log(`[Middleware] ${pathname}: auth error -`, error.message);
        } else if (user) {
          console.log(`[Middleware] ${pathname}: authenticated as`, user.id.slice(0, 8));
        }
      }

      // Add user info to response headers for debugging (dev only)
      if (process.env.NODE_ENV === 'development' && user) {
        supabaseResponse.headers.set('x-auth-user', user.id.slice(0, 8));
      }
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
     * 
     * IMPORTANT: /auth/callback IS matched - the route handler needs
     * middleware to run for proper cookie handling on subsequent requests
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

