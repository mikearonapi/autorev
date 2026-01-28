/**
 * Email Confirmation Route
 * 
 * Handles email verification tokens from auth emails.
 * Verifies the token with Supabase and redirects to the app.
 * 
 * URL format: /auth/confirm?token_hash={hash}&type={type}&next={redirect}
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/garage';

  // Validate required parameters
  if (!token_hash || !type) {
    // eslint-disable-next-line no-console
    console.error('[Auth Confirm] Missing required parameters');
    return NextResponse.redirect(
      new URL('/auth/error?error=Invalid%20confirmation%20link', requestUrl.origin)
    );
  }

  const cookieStore = await cookies();
  const cookiesToSet = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesFromSupabase) {
          cookiesFromSupabase.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options });
          });
          try {
            cookiesFromSupabase.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors from Server Component context
          }
        },
      },
    }
  );

  try {
    // Verify the OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Auth Confirm] Verification failed:', error.message);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    // eslint-disable-next-line no-console
    console.log('[Auth Confirm] Email verified successfully for user:', data.user?.id?.slice(0, 8) + '...');

    // Build redirect URL
    const redirectUrl = new URL(next, requestUrl.origin);
    
    // Add success indicator
    redirectUrl.searchParams.set('email_confirmed', '1');
    redirectUrl.searchParams.set('auth_ts', Date.now().toString());

    const response = NextResponse.redirect(redirectUrl);

    // Set auth cookies on the response
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    // Set confirmation complete cookie for client detection
    response.cookies.set('email_confirmed', '1', {
      path: '/',
      maxAge: 60,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // eslint-disable-next-line no-console
    console.log(`[Auth Confirm] Redirecting to ${redirectUrl.pathname} with email_confirmed=1`);
    return response;

  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Auth Confirm] Unexpected error:', err);
    return NextResponse.redirect(
      new URL('/auth/error?error=Confirmation%20failed', requestUrl.origin)
    );
  }
}
