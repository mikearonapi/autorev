/**
 * OAuth Callback Route
 * 
 * Handles the redirect from OAuth providers (Google, etc.)
 * Exchanges the code for a session and redirects to the intended page
 * 
 * FIX 2024-12-27: Explicitly transfer cookies to redirect response
 * The cookieStore.set() calls don't automatically transfer to NextResponse.redirect()
 * 
 * UPDATE 2024-12-28: Added welcome email trigger for new signups
 * UPDATE 2024-12-28: Added referral processing for users who signed up via referral link
 * UPDATE 2024-12-28: Added session verification and auth timestamp for reliability
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

import { notifySignup } from '@/lib/discord';
import { sendWelcomeEmail } from '@/lib/emailService';
import { sendLeadEvent } from '@/lib/metaConversionsApi';
import { processReferralSignup } from '@/lib/referralService';

// Admin client for analytics tracking
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Maximum retry attempts for session verification
 */
const MAX_VERIFICATION_RETRIES = 3;
const VERIFICATION_RETRY_DELAY = 200; // ms

/**
 * Default post-login destination
 * Users land on Garage after login - their home base for managing vehicles and builds
 */
const DEFAULT_POST_LOGIN_PATH = '/garage';

/**
 * Validate and sanitize the `next` redirect parameter to prevent open redirect attacks.
 * 
 * A valid `next` must be:
 * - A relative path starting with `/`
 * - NOT a protocol-relative URL (`//evil.com`)
 * - NOT containing a protocol (`https://`, `http://`, `javascript:`, etc.)
 * 
 * @param {string|null} next - The raw `next` query parameter
 * @returns {string} - A safe relative path, defaulting to /insights if invalid
 */
function validateRedirectPath(next) {
  // Default to insights if no next provided
  if (!next || typeof next !== 'string') {
    return DEFAULT_POST_LOGIN_PATH;
  }
  
  const trimmed = next.trim();
  
  // Empty string → default to insights
  if (trimmed === '') {
    return DEFAULT_POST_LOGIN_PATH;
  }
  
  // SECURITY: Reject protocol-relative URLs (e.g., `//evil.com`)
  // These would redirect to evil.com while appearing relative
  if (trimmed.startsWith('//')) {
    console.warn('[Auth Callback] Rejected protocol-relative redirect:', trimmed);
    return DEFAULT_POST_LOGIN_PATH;
  }
  
  // SECURITY: Reject absolute URLs with any protocol
  // Catches http://, https://, javascript:, data:, etc.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    console.warn('[Auth Callback] Rejected absolute URL redirect:', trimmed);
    return DEFAULT_POST_LOGIN_PATH;
  }
  
  // SECURITY: Must start with `/` to be a valid relative path
  // This rejects things like `evil.com` (would resolve relative to current path)
  if (!trimmed.startsWith('/')) {
    console.warn('[Auth Callback] Rejected non-rooted redirect path:', trimmed);
    return DEFAULT_POST_LOGIN_PATH;
  }
  
  // If user is being redirected to homepage, send them to insights instead
  // This ensures logged-in users always land in the app, not the marketing page
  if (trimmed === '/') {
    return DEFAULT_POST_LOGIN_PATH;
  }
  
  // Valid relative path - return as-is
  return trimmed;
}

/**
 * Verify session is valid after code exchange
 * Retries with exponential backoff to handle race conditions
 */
async function verifySessionWithRetry(supabase) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_VERIFICATION_RETRIES; attempt++) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        lastError = error;
        console.warn(`[Auth Callback] Session verification attempt ${attempt}/${MAX_VERIFICATION_RETRIES} failed:`, error.message);
      } else if (user) {
        console.log(`[Auth Callback] Session verified on attempt ${attempt}`);
        return { user, error: null };
      } else {
        console.warn(`[Auth Callback] Session verification attempt ${attempt}/${MAX_VERIFICATION_RETRIES}: no user returned`);
      }
      
      if (attempt < MAX_VERIFICATION_RETRIES) {
        const delay = VERIFICATION_RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (err) {
      lastError = err;
      console.error(`[Auth Callback] Session verification attempt ${attempt} threw:`, err);
      
      if (attempt < MAX_VERIFICATION_RETRIES) {
        const delay = VERIFICATION_RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return { user: null, error: lastError || new Error('Session verification failed after retries') };
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const rawNext = requestUrl.searchParams.get('next');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  
  // SECURITY: Validate redirect path to prevent open redirect attacks
  const next = validateRedirectPath(rawNext);

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  // Track cookies that need to be set on the redirect response
  const cookiesToSet = [];
  let verifiedUser = null;

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

      // CRITICAL: Verify session is actually valid before redirecting
      // This prevents race conditions where cookies haven't propagated yet
      const { user: verified, error: verifyError } = await verifySessionWithRetry(supabase);
      
      if (verifyError || !verified) {
        console.error('[Auth Callback] Session verification failed after exchange:', verifyError?.message);
        // Don't fail hard - the client will retry via initializeSessionWithRetry
        // But log it for debugging
      } else {
        verifiedUser = verified;
        console.log('[Auth Callback] Session verified for user:', verified.id?.slice(0, 8) + '...');
      }

      // Fire-and-forget Discord notification for new signups (within 60s of creation)
      // Use already-verified user to avoid redundant API call
      const user = verifiedUser;
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
          
          // Send welcome email (fire-and-forget)
          sendWelcomeEmail(user).catch(err => 
            console.error('[Auth Callback] Welcome email failed:', err)
          );
          
          // Send Meta Conversions API Lead event (fire-and-forget)
          sendLeadEvent(user, {
            eventSourceUrl: sourcePage ? `https://autorev.app${sourcePage}` : 'https://autorev.app/signup',
            userAgent: request.headers.get('user-agent'),
            clientIpAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            customData: {
              signup_method: user.app_metadata?.provider || 'email',
              ...(carContext && { car_context: carContext }),
            },
          }).catch(err => 
            console.error('[Auth Callback] Meta Lead event failed:', err)
          );
          
          // Track signup event and save attribution (fire-and-forget)
          const utmSource = cookieStore.get('utm_source')?.value;
          const utmMedium = cookieStore.get('utm_medium')?.value;
          const utmCampaign = cookieStore.get('utm_campaign')?.value;
          
          // Insert signup event
          supabaseAdmin.from('user_events').insert({
            event_name: 'signup_completed',
            event_category: 'onboarding',
            user_id: user.id,
            session_id: `auth-${user.id.slice(0, 8)}-${Date.now()}`,
            properties: { method: user.app_metadata?.provider || 'email' },
            utm_source: utmSource || null,
            utm_medium: utmMedium || null,
            utm_campaign: utmCampaign || null
          }).then(() => console.log('[Auth Callback] Signup event tracked'))
            .catch(err => console.error('[Auth Callback] Failed to track signup event:', err));
          
          // Save user attribution
          supabaseAdmin.from('user_attribution').insert({
            user_id: user.id,
            first_touch_source: utmSource || signupContext.referrer || 'direct',
            first_touch_medium: utmMedium || null,
            first_touch_campaign: utmCampaign || null,
            first_touch_referrer: signupContext.referrer || null,
            first_touch_landing_page: sourcePage || '/',
            first_touch_at: new Date().toISOString(),
            last_touch_source: utmSource || signupContext.referrer || 'direct',
            last_touch_medium: utmMedium || null,
            last_touch_campaign: utmCampaign || null,
            last_touch_at: new Date().toISOString(),
            signup_page: sourcePage || '/',
            signup_device: 'Unknown',
            signup_country: null
          }).then(() => console.log('[Auth Callback] User attribution saved'))
            .catch(err => {
              // Ignore duplicate errors (user already has attribution)
              if (!err.message?.includes('duplicate')) {
                console.error('[Auth Callback] Failed to save attribution:', err);
              }
            });

          // Process referral if user signed up with a referral code
          const refCode = cookieStore.get('referral_code')?.value;
          if (refCode) {
            console.log(`[Auth Callback] Processing referral signup with code: ${refCode}`);
            processReferralSignup(user.id, refCode)
              .then(result => {
                if (result.success) {
                  console.log(`[Auth Callback] Referral processed: +${result.refereeCredits} credits for new user`);
                } else {
                  console.log(`[Auth Callback] Referral not processed: ${result.error}`);
                }
              })
              .catch(err => console.error('[Auth Callback] Referral processing failed:', err));
          }
        }
      }
    } catch (err) {
      console.error('[Auth Callback] Unexpected error:', err);
      return NextResponse.redirect(
        new URL('/auth/error?error=Authentication%20failed', requestUrl.origin)
      );
    }
  }

  // Build redirect URL
  const redirectUrl = new URL(next, requestUrl.origin);
  
  // Only set fresh auth signals if code exchange was actually attempted
  // This prevents false positives when someone navigates to /auth/callback without an OAuth flow
  const codeExchangeAttempted = !!code;
  
  if (codeExchangeAttempted) {
    // Add auth timestamp to help client detect fresh auth
    redirectUrl.searchParams.set('auth_ts', Date.now().toString());
  }
  
  // Create redirect response
  const response = NextResponse.redirect(redirectUrl);

  // CRITICAL: Explicitly set all auth cookies on the redirect response
  // This ensures the browser receives the session cookies
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  // Only set fresh auth cookies if code exchange was attempted
  if (codeExchangeAttempted) {
    // Set auth callback completion cookie - used by client to detect fresh OAuth login
    // This cookie is checked and cleared by AuthProvider's fresh login detection
    response.cookies.set('auth_callback_complete', '1', {
      path: '/',
      maxAge: 60, // 1 minute - just long enough for client to pick up
      httpOnly: false, // Client needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Also set verified user ID cookie for client-side validation
    if (verifiedUser?.id) {
      response.cookies.set('auth_verified_user', verifiedUser.id, {
        path: '/',
        maxAge: 60, // 1 minute
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
    
    console.log(`[Auth Callback] Redirecting to ${redirectUrl.pathname}${redirectUrl.search} with ${cookiesToSet.length} auth cookies + fresh login signals`);
  } else {
    console.log(`[Auth Callback] Redirecting to ${redirectUrl.pathname} (no code - no fresh login signals)`);
  }
  
  return response;
}
