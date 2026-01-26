'use client';

import { Suspense } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';


import { UI_IMAGES } from '@/lib/images';

/**
 * Auth Error Page - Brand-Consistent Design
 * 
 * Matches AutoRev's dark theme with:
 * - Navy background (#0d1b2a)
 * - White/slate text hierarchy
 * - Lime accent CTA
 * - AL mascot for friendly error state
 */

// Friendly error messages for common error codes
const ERROR_MESSAGES = {
  'flow_state_not_found': 'Your login session expired. Please try signing in again.',
  'invalid_confirmation_link': 'This confirmation link is invalid or has expired.',
  'confirmation_failed': 'We couldn\'t confirm your email. Please request a new link.',
  'authentication_failed': 'Authentication failed. Please try again.',
  'access_denied': 'Access was denied. Please check your permissions.',
  'server_error': 'Something went wrong on our end. Please try again.',
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
  const error = searchParams.get('error') || 'An unknown error occurred';
  const errorCode = searchParams.get('error_code');
  
  const friendlyMessage = getErrorMessage(errorCode || error);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#0d1b2a',
    }}>
      {/* Logo */}
      <div style={{
        marginBottom: '2rem',
        textAlign: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-oswald, Oswald), sans-serif',
          fontSize: '2rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
        }}>
          <span style={{ color: '#ffffff' }}>AUTO</span>
          <span style={{ color: '#d4ff00' }}>REV</span>
        </span>
      </div>

      {/* Error Card */}
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        textAlign: 'center',
      }}>
        {/* AL Mascot with concerned expression concept */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 1.5rem',
          position: 'relative',
        }}>
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
          <div style={{
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
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
        </div>
        
        <h1 style={{
          fontFamily: 'var(--font-oswald, Oswald), sans-serif',
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}>
          Oops, Something Went Wrong
        </h1>
        
        <p style={{
          color: '#94a3b8',
          marginBottom: '1.5rem',
          lineHeight: '1.6',
          fontSize: '0.95rem',
        }}>
          {friendlyMessage}
        </p>
        
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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
      <p style={{
        marginTop: '1.5rem',
        color: '#64748b',
        fontSize: '0.8rem',
        textAlign: 'center',
      }}>
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
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1b2a',
        color: '#ffffff',
      }}>
        Loading...
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
