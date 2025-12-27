/**
 * OAuth Callback Route
 * 
 * Handles the redirect from OAuth providers (Google, etc.)
 * Exchanges the code for a session and redirects to the intended page
 * 
 * CRITICAL FIX: Properly transfer auth cookies to the redirect response
 * The cookies set during exchangeCodeForSession MUST be set on the final
 * NextResponse.redirect() for the browser to receive them.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { notifySignup } from '@/lib/discord';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  // Build the redirect URL
  let redirectUrl = new URL(next, requestUrl.origin);
  
  // Track cookies that need to be set on the response
  // This is CRITICAL - cookies set via cookieStore.set() during exchangeCodeForSession
  // are NOT automatically included in the redirect response
  const cookiesToSetOnResponse = [];

  // Exchange code for session
  if (code) {
    const cookieStore = await cookies();
    
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
              const enhancedOptions = {
                ...options,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
              };
              
              // Track for setting on response later
              cookiesToSetOnResponse.push({ name, value, options: enhancedOptions });
              
              // Also try to set on cookieStore (may fail in some contexts)
              try {
                cookieStore.set(name, value, enhancedOptions);
              } catch (cookieError) {
                // This is expected in route handlers - we'll set on response instead
                console.log('[Auth Callback] Cookie queued for response:', name);
              }
            });
          },
        },
      }
    );
    
    try {
      // Exchange the authorization code for session tokens
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('[Auth Callback] Code exchange error:', exchangeError);
        return NextResponse.redirect(
          new URL(`/auth/error?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        );
      }

      console.log('[Auth Callback] Code exchanged successfully, cookies to set:', cookiesToSetOnResponse.length);

      // Get user for new user handling
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const isNewUser = (now - createdAt) < 60000;

        if (isNewUser) {
          // Gather acquisition context from cookies/headers
          const sourcePage = cookieStore.get('signup_source_page')?.value;
          const carContext = cookieStore.get('signup_car_context')?.value;
          const referrer = cookieStore.get('signup_referrer')?.value;

          const signupContext = {
            source_page: sourcePage || user.user_metadata?.source_page,
            car_context: carContext || user.user_metadata?.car_context,
            referrer: referrer || user.user_metadata?.referrer || 'direct',
          };

          // Check for first action (within 2 minutes of signup)
          try {
            const twoMinutesLater = new Date(createdAt);
            twoMinutesLater.setMinutes(twoMinutesLater.getMinutes() + 2);
            
            const { data: firstActivity } = await supabase
              .from('user_activity')
              .select('event_type')
              .eq('user_id', user.id)
              .gte('created_at', createdAt.toISOString())
              .lte('created_at', twoMinutesLater.toISOString())
              .order('created_at', { ascending: true })
              .limit(1)
              .single();

            if (firstActivity) {
              const actionLabels = {
                'car_favorited': '⭐ Favorited a car',
                'build_started': '🔧 Started building',
                'ai_mechanic_used': '🤖 Asked AL',
                'comparison_started': '⚖️ Started comparison',
                'car_viewed': '👀 Viewed car details',
              };
              signupContext.first_action = actionLabels[firstActivity.event_type] || firstActivity.event_type;
            }
          } catch (activityErr) {
            console.log('[Auth Callback] Could not fetch first activity:', activityErr.message);
          }

          notifySignup({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            provider: user.app_metadata?.provider || 'email',
          }, signupContext).catch(err => console.error('[Auth Callback] Discord signup notification failed:', err));

          sendWelcomeEmail(user).catch(err => 
            console.error('[Auth Callback] Welcome email failed:', err)
          );
        }
      }
    } catch (err) {
      console.error('[Auth Callback] Unexpected error:', err);
      return NextResponse.redirect(
        new URL('/auth/error?error=Authentication%20failed', requestUrl.origin)
      );
    }
  }

  // Check if there's a pending checkout intent
  const cookieStoreForCheckout = await cookies();
  const checkoutIntent = cookieStoreForCheckout.get('autorev_checkout_intent')?.value;
  if (checkoutIntent) {
    redirectUrl = new URL('/profile', requestUrl.origin);
    redirectUrl.searchParams.set('resume_checkout', 'true');
  }
  
  // Add a cache-busting timestamp
  redirectUrl.searchParams.set('auth_ts', Date.now().toString());
  
  // Create response with redirect
  const response = NextResponse.redirect(redirectUrl);
  
  // CRITICAL: Set all auth cookies on the response
  // Without this, the browser won't receive the session cookies!
  for (const { name, value, options } of cookiesToSetOnResponse) {
    response.cookies.set(name, value, options);
    console.log('[Auth Callback] Setting cookie on response:', name);
  }
  
  // Set a short-lived cookie to signal auth completion to client
  response.cookies.set('auth_callback_complete', Date.now().toString(), {
    maxAge: 60,
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
  
  console.log(`[Auth Callback] Redirecting to: ${redirectUrl.pathname} with ${cookiesToSetOnResponse.length} auth cookies`);
  return response;
}
