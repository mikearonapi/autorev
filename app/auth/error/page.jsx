'use client';

import { Suspense, useState, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { UI_IMAGES } from '@/lib/images';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Auth Error Page - Brand-Consistent Design
 *
 * Matches AutoRev's dark theme with:
 * - Navy background (#0d1b2a)
 * - White/slate text hierarchy
 * - Lime accent CTA
 * - AL mascot for friendly error state
 *
 * ENHANCED: Now detects if user is already logged in and offers
 * to redirect them, which handles multi-session scenarios gracefully.
 */

// Friendly error messages for common error codes
const ERROR_MESSAGES = {
  flow_state_not_found: 'Your login session expired. Please try signing in again.',
  invalid_confirmation_link: 'This confirmation link is invalid or has expired.',
  confirmation_failed: "We couldn't confirm your email. Please request a new link.",
  authentication_failed: 'Authentication failed. Please try again.',
  access_denied: 'Access was denied. Please check your permissions.',
  server_error: 'Something went wrong on our end. Please try again.',
};

function getErrorMessage(error) {
  // Check if it's a known error code
  const lowerError = error?.toLowerCase().replace(/\s+/g, '_');
  if (ERROR_MESSAGES[lowerError]) {
    return ERROR_MESSAGES[lowerError];
  }
  // Return the original error or a default message
  return error || 'An unexpected error occurred. Please try again.';
}

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error') || 'An unknown error occurred';
  const errorCode = searchParams.get('error_code');

  // MULTI-SESSION FIX: Check if user is already logged in
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    async function checkExistingSession() {
      if (!isSupabaseConfigured || !supabase) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          console.log('[Auth Error] User is already logged in:', user.id?.slice(0, 8) + '...');
          setIsAlreadyLoggedIn(true);
          setLoggedInUser(user);
        }
      } catch (err) {
        console.log('[Auth Error] Session check error:', err.message);
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkExistingSession();
  }, []);

  // Auto-redirect if already logged in and it's a flow state error
  useEffect(() => {
    if (isAlreadyLoggedIn && errorCode === 'flow_state_not_found') {
      // Give user a moment to see the message, then redirect
      const timer = setTimeout(() => {
        router.push('/garage');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAlreadyLoggedIn, errorCode, router]);

  const friendlyMessage = getErrorMessage(errorCode || error);

  // If user is already logged in, show a different UI
  if (!isCheckingSession && isAlreadyLoggedIn) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#0d1b2a',
        }}
      >
        {/* Logo */}
        <div
          style={{
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-oswald, Oswald), sans-serif',
              fontSize: '2rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: '#ffffff' }}>AUTO</span>
            <span style={{ color: '#d4ff00' }}>REV</span>
          </span>
        </div>

        {/* Already Logged In Card */}
        <div
          style={{
            maxWidth: '400px',
            width: '100%',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          {/* Success indicator */}
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              position: 'relative',
            }}
          >
            <Image
              src={UI_IMAGES.alMascotFull}
              alt="AL"
              width={80}
              height={80}
              style={{
                borderRadius: '50%',
              }}
            />
            {/* Check indicator overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                width: '28px',
                height: '28px',
                background: '#22c55e',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid #0d1b2a',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-oswald, Oswald), sans-serif',
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            You're Already Signed In
          </h1>

          <p
            style={{
              color: '#94a3b8',
              marginBottom: '1.5rem',
              lineHeight: '1.6',
              fontSize: '0.95rem',
            }}
          >
            Good news! You're already logged in
            {loggedInUser?.email ? ` as ${loggedInUser.email}` : ''}. Redirecting you to your
            garage...
          </p>

          <div
            style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link
              href="/garage"
              style={{
                padding: '0.875rem 1.75rem',
                background: '#d4ff00',
                color: '#0a1628',
                borderRadius: '100px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                transition: 'all 0.2s ease',
              }}
            >
              Go to Garage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#0d1b2a',
      }}
    >
      {/* Logo */}
      <div
        style={{
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-oswald, Oswald), sans-serif',
            fontSize: '2rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{ color: '#ffffff' }}>AUTO</span>
          <span style={{ color: '#d4ff00' }}>REV</span>
        </span>
      </div>

      {/* Error Card */}
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          textAlign: 'center',
        }}
      >
        {/* AL Mascot with concerned expression concept */}
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1.5rem',
            position: 'relative',
          }}
        >
          <Image
            src={UI_IMAGES.alMascotFull}
            alt="AL"
            width={80}
            height={80}
            style={{
              borderRadius: '50%',
              opacity: 0.8,
            }}
          />
          {/* Error indicator overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '28px',
              height: '28px',
              background: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #0d1b2a',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-oswald, Oswald), sans-serif',
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          Oops, Something Went Wrong
        </h1>

        <p
          style={{
            color: '#94a3b8',
            marginBottom: '1.5rem',
            lineHeight: '1.6',
            fontSize: '0.95rem',
          }}
        >
          {friendlyMessage}
        </p>

        <div
          style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <Link
            href="/garage"
            style={{
              padding: '0.875rem 1.75rem',
              background: '#d4ff00',
              color: '#0a1628',
              borderRadius: '100px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transition: 'all 0.2s ease',
            }}
          >
            Try Again
          </Link>
          <Link
            href="/"
            style={{
              padding: '0.875rem 1.75rem',
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '100px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transition: 'all 0.2s ease',
            }}
          >
            Go Home
          </Link>
        </div>
      </div>

      {/* Help text */}
      <p
        style={{
          marginTop: '1.5rem',
          color: '#64748b',
          fontSize: '0.8rem',
          textAlign: 'center',
        }}
      >
        If this keeps happening, please{' '}
        <Link
          href="/contact"
          style={{
            color: '#d4ff00',
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
          }}
        >
          contact support
        </Link>
      </p>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d1b2a',
            color: '#ffffff',
          }}
        >
          Loading...
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
