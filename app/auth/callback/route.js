/**
 * OAuth Callback Route
 * 
 * Handles the redirect from OAuth providers (Google, etc.)
 * Exchanges the code for a session and redirects to the intended page
 * 
 * CRITICAL: Cookies set during exchangeCodeForSession MUST be explicitly
 * copied to the NextResponse.redirect() response for the browser to receive them.
 * 
 * FIX 2024-12-27: Enhanced cookie options for cross-browser compatibility
 * - Added explicit path: '/' to ensure cookies are available on all routes
 * - Added sameSite: 'lax' for OAuth redirects
 * - Added secure: true in production only
 * - Added auth_ts param to help AuthProvider detect fresh auth
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { notifySignup } from '@/lib/discord';
import { sendWelcomeEmail } from '@/lib/email';

/**
 * Enhance cookie options for cross-browser compatibility
 * Ensures cookies work across all routes and environments
 */
function getEnhancedCookieOptions(originalOptions = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...originalOptions,
    path: '/', // Ensure cookie is available on all routes
    sameSite: 'lax', // Required for OAuth redirects to work
    secure: isProduction, // Only secure in production (HTTPS)
    // IMPORTANT: Do NOT force httpOnly here.
    // Supabase SSR cookie-based auth for apps with client-side JS requires the browser
    // to be able to read session cookies. Forcing httpOnly can break client auth.
    // If Supabase sets httpOnly explicitly, we'll preserve it via ...originalOptions.
  };
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  console.log('[Auth Callback] Received request:', {
    hasCode: !!code,
    next,
    error: error || 'none',
    origin,
  });

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
            // Store cookies with ENHANCED options for the final response
            cookiesToSet.forEach(({ name, value, options }) => {
              const enhancedOptions = getEnhancedCookieOptions(options);
              responseCookies.push({ name, value, options: enhancedOptions });
              
              // Also try to set on cookieStore for subsequent reads within this request
              try {
                cookieStore.set(name, value, enhancedOptions);
              } catch (e) {
                // Expected in Route Handler context - cookies will be set on redirect response
                console.log('[Auth Callback] Cookie will be set on redirect response:', name);
              }
            });
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError.message, exchangeError);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent(exchangeError.message)}`, origin)
      );
    }

    console.log('[Auth Callback] Code exchanged successfully, preparing', responseCookies.length, 'cookies');

    // Handle new user notifications (non-blocking)
    let userId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      
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
    let redirectPath = next;
    
    // Check for pending checkout intent
    const checkoutIntent = cookieStore.get('autorev_checkout_intent')?.value;
    if (checkoutIntent) {
      redirectPath = '/profile?resume_checkout=true';
    }

    // Handle forwarded host for load balancers (Vercel)
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    
    let baseUrl;
    if (isLocalEnv) {
      baseUrl = origin;
    } else if (forwardedHost) {
      baseUrl = `https://${forwardedHost}`;
    } else {
      baseUrl = origin;
    }

    // Add auth timestamp to help AuthProvider detect fresh auth
    // This triggers additional retry logic for race condition handling
    const redirectUrl = new URL(redirectPath, baseUrl);
    redirectUrl.searchParams.set('auth_ts', Date.now().toString());
    
    const finalUrl = redirectUrl.toString();

    // Create response and EXPLICITLY set all auth cookies on it
    const response = NextResponse.redirect(finalUrl);
    
    // CRITICAL: Transfer all cookies from the exchange to the response with enhanced options
    for (const { name, value, options } of responseCookies) {
      response.cookies.set(name, value, options);
      console.log('[Auth Callback] Setting cookie:', name, 'path:', options.path, 'secure:', options.secure);
    }

    // Also set a marker cookie to help AuthProvider detect fresh auth
    response.cookies.set('auth_callback_complete', '1', {
      path: '/',
      sameSite: 'lax',
      secure: !isLocalEnv,
      maxAge: 60, // Short-lived - just for the redirect
    });

    console.log('[Auth Callback] Redirecting to', finalUrl, 'with', responseCookies.length + 1, 'cookies, userId:', userId?.slice(0, 8));
    return response;
  }

  // No code provided - redirect to error
  console.error('[Auth Callback] No authorization code provided');
  return NextResponse.redirect(`${origin}/auth/error?error=No%20authorization%20code%20provided`);
}
