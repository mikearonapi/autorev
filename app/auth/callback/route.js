/**
 * OAuth Callback Route
 * 
 * Handles the redirect from OAuth providers (Google, etc.)
 * Exchanges the code for a session and redirects to the intended page
 * 
 * FIX 2024-12-27: Explicitly transfer cookies to redirect response
 * The cookieStore.set() calls don't automatically transfer to NextResponse.redirect()
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { notifySignup } from '@/lib/discord';

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

  // Track cookies that need to be set on the redirect response
  const cookiesToSet = [];

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
          setAll(cookiesFromSupabase) {
            // Store cookies to transfer to redirect response
            cookiesFromSupabase.forEach(({ name, value, options }) => {
              cookiesToSet.push({ name, value, options });
            });
            // Also set via cookieStore for good measure
            try {
              cookiesFromSupabase.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    );
    
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('[Auth Callback] Code exchange error:', exchangeError);
        return NextResponse.redirect(
          new URL(`/auth/error?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        );
      }

      console.log('[Auth Callback] Code exchanged successfully, cookies to set:', cookiesToSet.length);

      // Fire-and-forget Discord notification for new signups (within 60s of creation)
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

  // Create redirect response
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));

  // CRITICAL: Explicitly set all auth cookies on the redirect response
  // This ensures the browser receives the session cookies
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  console.log(`[Auth Callback] Redirecting to ${next} with ${cookiesToSet.length} cookies`);
  
  return response;
}
