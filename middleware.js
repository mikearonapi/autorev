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

  // Optional: Protect routes that require authentication
  // Uncomment if you want to redirect unauthenticated users from certain paths
  // const protectedPaths = ['/my-garage', '/tuning-shop', '/settings'];
  // const isProtectedPath = protectedPaths.some(path => 
  //   request.nextUrl.pathname.startsWith(path)
  // );
  // 
  // if (!user && isProtectedPath) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/';
  //   url.searchParams.set('auth', 'signin');
  //   return NextResponse.redirect(url);
  // }

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

