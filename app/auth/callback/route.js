/**
 * OAuth Callback Route
 * 
 * Handles the redirect from OAuth providers (Google, etc.)
 * Exchanges the code for a session and redirects to the intended page
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
              cookiesToSet.forEach(({ name, value, options }) =>
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

      // Fire-and-forget Discord notification for new signups (within 60s of creation)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const isNewUser = (now - createdAt) < 60000;

        if (isNewUser) {
          notifySignup({
            id: user.id,
            email: user.email,
            provider: user.app_metadata?.provider || 'email',
          }).catch(err => console.error('[Auth Callback] Discord signup notification failed:', err));
        }
      }
    } catch (err) {
      console.error('[Auth Callback] Unexpected error:', err);
      return NextResponse.redirect(
        new URL('/auth/error?error=Authentication%20failed', requestUrl.origin)
      );
    }
  }

  // Redirect to the intended destination
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
