/**
 * Next.js Middleware for Supabase Auth
 * 
 * This middleware refreshes the user's session on every request.
 * Without this, auth cookies expire and users get logged out unexpectedly.
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  // =========================================================================
  // ROUTE REDIRECTS (Simplified 5-Tab Structure - January 2026)
  // My Garage is the unified hub for all car features
  // =========================================================================
  const pathname = request.nextUrl.pathname;
  
  // Redirect legacy routes to new structure
  // /track → /data (renamed for future OBD2/telemetry)
  if (pathname === '/track') {
    const url = request.nextUrl.clone();
    url.pathname = '/data';
    return NextResponse.redirect(url, { status: 308 });
  }
  
  // /tuning-shop → /garage (build planning is part of garage)
  if (pathname === '/tuning-shop') {
    const url = request.nextUrl.clone();
    url.pathname = '/garage';
    return NextResponse.redirect(url, { status: 308 });
  }
  
  // /my-builds → /garage (builds are part of garage)
  if (pathname === '/my-builds') {
    const url = request.nextUrl.clone();
    url.pathname = '/garage';
    return NextResponse.redirect(url, { status: 308 });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip middleware if Supabase isn't configured
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT use getSession() here - it doesn't validate the token
  // Using getUser() ensures the session is verified and refreshed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // =========================================================================
  // REFERRAL CODE CAPTURE
  // Store referral code in a cookie when user visits with ?ref=CODE
  // Cookie persists for 30 days so signup can credit the referrer
  // =========================================================================
  const refCode = request.nextUrl.searchParams.get('ref');
  if (refCode && refCode.length === 8 && !user) {
    // Only store if:
    // 1. ref param exists and is valid length (8 chars)
    // 2. User is not already logged in (no need for logged-in users)
    supabaseResponse.cookies.set('referral_code', refCode.toUpperCase(), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    console.log(`[Middleware] Stored referral code: ${refCode.toUpperCase()}`);
  }

  // =========================================================================
  // ROUTE PROTECTION - Redirect unauthenticated users to homepage
  // 
  // IMPORTANT: Some paths have PUBLIC sub-routes for SEO:
  // - /community/builds is PUBLIC (SEO content)
  // - /community/events/[slug] is PUBLIC (individual event pages)
  // - /community (base) is PRIVATE (user's feed)
  // =========================================================================
  
  // Paths that are PUBLIC - do not protect these for SEO crawlability
  const publicPaths = [
    '/community/builds',      // Public build gallery - SEO content
    '/community/events/',     // Individual event pages - SEO content (note: trailing slash)
  ];
  
  // Check if this is a public path FIRST
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // If it's a known public path, don't protect it
  if (isPublicPath) {
    return supabaseResponse;
  }
  
  // Protected paths - require authentication
  const protectedPaths = [
    '/garage',
    '/data',
    '/community',      // Base /community is protected (user feed), but /community/builds and /community/events/[slug] are public
    '/al',
    '/profile',
    '/build',
    '/performance',
    '/parts',
    '/my-builds',
    '/mod-planner',
  ];
  
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );
  
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    // Don't add auth=signin param - just redirect to homepage cleanly
    return NextResponse.redirect(url);
  }

  // =========================================================================
  // CONTENT SECURITY POLICY (Enforcing Mode)
  // 
  // This CSP actively blocks content that violates the policy.
  // Last updated: January 2026 (promoted from report-only after monitoring)
  // 
  // If you encounter CSP violations:
  // 1. Check browser console for blocked resources
  // 2. Add the trusted domain to the appropriate directive below
  // 3. Test thoroughly before deploying
  // =========================================================================
  const cspDirectives = [
    // Default to self
    "default-src 'self'",
    // Scripts: self, inline (for React), eval (for dev), plus trusted domains
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://va.vercel-scripts.com https://www.googletagmanager.com https://www.google-analytics.com https://*.posthog.com",
    // Styles: self and inline (for CSS-in-JS and dynamic styles)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images: self, data URIs, blob, plus trusted image hosts
    "img-src 'self' data: blob: https://*.supabase.co https://*.blob.vercel-storage.com https://*.googleusercontent.com https://images.unsplash.com https://i.ytimg.com https://www.google-analytics.com",
    // Fonts: self and Google Fonts
    "font-src 'self' https://fonts.gstatic.com data:",
    // Connect: API calls to self and external services
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.anthropic.com https://api.openai.com https://va.vercel-scripts.com https://www.google-analytics.com https://*.vercel-insights.com https://*.posthog.com https://*.sentry.io",
    // Frames: Stripe checkout, YouTube embeds
    "frame-src 'self' https://js.stripe.com https://www.youtube.com https://youtube.com",
    // Object: none (no Flash/plugins)
    "object-src 'none'",
    // Base URI: self only
    "base-uri 'self'",
    // Form action: self only
    "form-action 'self'",
    // Frame ancestors: none (clickjacking protection, duplicates X-Frame-Options)
    "frame-ancestors 'none'",
    // Upgrade insecure requests
    "upgrade-insecure-requests",
  ].join('; ');

  // CSP is now in enforcing mode - violations will be blocked
  // Only apply CSP in production to avoid issues with dev server HMR
  if (process.env.NODE_ENV === 'production') {
    supabaseResponse.headers.set('Content-Security-Policy', cspDirectives);
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

