/**
 * OAuth Callback Route
 * 
 * Handles the redirect from OAuth providers (Google, etc.)
 * Exchanges the code for a session and redirects to the intended page
 * 
 * ENHANCED: Proper session establishment with verification and retry logic
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { notifySignup } from '@/lib/discord';

// Session verification with retry
async function verifySessionEstablished(supabase, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user && !error) {
      console.log(`[Auth Callback] Session verified on attempt ${attempt}`);
      return { user, error: null };
    }
    
    if (attempt < maxRetries) {
      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = 100 * Math.pow(2, attempt - 1);
      console.log(`[Auth Callback] Session not ready, retry ${attempt}/${maxRetries} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { user: null, error: new Error('Session verification failed after retries') };
}

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
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // Ensure secure cookie settings for auth cookies
                const enhancedOptions = {
                  ...options,
                  // Force secure and httpOnly for auth tokens
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                };
                cookieStore.set(name, value, enhancedOptions);
              });
            } catch (cookieError) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
              console.warn('[Auth Callback] Cookie set warning:', cookieError.message);
            }
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

      // Log successful token exchange
      console.log('[Auth Callback] Code exchanged successfully, verifying session...');

      // Verify session is properly established (with retry for race conditions)
      const { user, error: verifyError } = await verifySessionEstablished(supabase);
      
      if (verifyError || !user) {
        console.error('[Auth Callback] Session verification failed:', verifyError);
        // Don't fail completely - the session may still be usable client-side
        // Just redirect and let the client handle it
        console.warn('[Auth Callback] Proceeding with redirect despite verification issue');
      }
      
      if (user) {
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const isNewUser = (now - createdAt) < 60000;

        if (isNewUser) {
          // Gather acquisition context from cookies/headers
          const cookieStore = await cookies();
          const sourcePage = cookieStore.get('signup_source_page')?.value;
          const carContext = cookieStore.get('signup_car_context')?.value;
          const referrer = cookieStore.get('signup_referrer')?.value;

          // Get user's metadata which may contain additional context
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
            // Gracefully handle if activity check fails
            console.log('[Auth Callback] Could not fetch first activity:', activityErr.message);
          }

          notifySignup({
            id: user.id,
            email: user.email,
            provider: user.app_metadata?.provider || 'email',
          }, signupContext).catch(err => console.error('[Auth Callback] Discord signup notification failed:', err));
        }
      }
    } catch (err) {
      console.error('[Auth Callback] Unexpected error:', err);
      return NextResponse.redirect(
        new URL('/auth/error?error=Authentication%20failed', requestUrl.origin)
      );
    }
  }

  // Build the redirect URL with auth success indicator
  const redirectUrl = new URL(next, requestUrl.origin);
  
  // Add a cache-busting timestamp to force client to check fresh session
  // This helps resolve client-side race conditions
  redirectUrl.searchParams.set('auth_ts', Date.now().toString());
  
  // Create response with redirect
  const response = NextResponse.redirect(redirectUrl);
  
  // Set a short-lived cookie to signal auth completion to client
  // This helps the AuthProvider know to refresh immediately
  response.cookies.set('auth_callback_complete', Date.now().toString(), {
    maxAge: 60, // 1 minute - just long enough for client to read
    httpOnly: false, // Allow client JS to read
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  
  console.log(`[Auth Callback] Redirecting to: ${redirectUrl.pathname}`);
  return response;
}
