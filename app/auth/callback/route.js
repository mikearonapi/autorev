/**
 * OAuth Callback Route
 * 
 * Handles the redirect from OAuth providers (Google, etc.)
 * Exchanges the code for a session and redirects to the intended page
 * 
 * CRITICAL: Cookies set during exchangeCodeForSession MUST be explicitly
 * copied to the NextResponse.redirect() response for the browser to receive them.
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { notifySignup } from '@/lib/discord';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(errorDescription || error)}`, origin)
    );
  }

  if (code) {
    const cookieStore = await cookies();
    
    // Track cookies that need to be set on the response
    const responseCookies = [];
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Store cookies to set on the final response
            cookiesToSet.forEach(({ name, value, options }) => {
              responseCookies.push({ name, value, options });
              // Also set on cookieStore for subsequent reads within this request
              try {
                cookieStore.set(name, value, options);
              } catch (e) {
                // Ignore errors from Server Component context
              }
            });
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent(exchangeError.message)}`, origin)
      );
    }

    console.log('[Auth Callback] Code exchanged successfully, setting', responseCookies.length, 'cookies');

    // Handle new user notifications (non-blocking)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const isNewUser = (now - createdAt) < 60000;

        if (isNewUser) {
          const sourcePage = cookieStore.get('signup_source_page')?.value;
          const carContext = cookieStore.get('signup_car_context')?.value;
          const referrer = cookieStore.get('signup_referrer')?.value;

          const signupContext = {
            source_page: sourcePage || user.user_metadata?.source_page,
            car_context: carContext || user.user_metadata?.car_context,
            referrer: referrer || user.user_metadata?.referrer || 'direct',
          };

          // Non-blocking notifications
          notifySignup({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            provider: user.app_metadata?.provider || 'email',
          }, signupContext).catch(err => console.error('[Auth Callback] Discord notification failed:', err));

          sendWelcomeEmail(user).catch(err => 
            console.error('[Auth Callback] Welcome email failed:', err)
          );
        }
      }
    } catch (userErr) {
      console.log('[Auth Callback] Could not check new user status:', userErr.message);
    }

    // Build redirect URL
    let redirectUrl = next;
    
    // Check for pending checkout intent
    const checkoutIntent = cookieStore.get('autorev_checkout_intent')?.value;
    if (checkoutIntent) {
      redirectUrl = '/profile?resume_checkout=true';
    }

    // Handle forwarded host for load balancers (Vercel)
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    
    let finalUrl;
    if (isLocalEnv) {
      finalUrl = `${origin}${redirectUrl}`;
    } else if (forwardedHost) {
      finalUrl = `https://${forwardedHost}${redirectUrl}`;
    } else {
      finalUrl = `${origin}${redirectUrl}`;
    }

    // Create response and EXPLICITLY set all auth cookies on it
    const response = NextResponse.redirect(finalUrl);
    
    // CRITICAL: Transfer all cookies from the exchange to the response
    for (const { name, value, options } of responseCookies) {
      response.cookies.set(name, value, options);
    }

    console.log('[Auth Callback] Redirecting to', finalUrl, 'with', responseCookies.length, 'auth cookies');
    return response;
  }

  // No code provided - redirect to error
  return NextResponse.redirect(`${origin}/auth/error?error=No%20authorization%20code%20provided`);
}
