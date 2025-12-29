'use client';

import { useState, useEffect } from 'react';

/**
 * Warning/Error icon component
 */
function ExclamationIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Close X icon component
 */
function XIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Sign in arrow icon component
 */
function SignInIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

// Color schemes for different severity levels
const colorSchemes = {
  warning: {
    bg: 'rgba(120, 53, 15, 0.95)',
    border: 'rgba(217, 119, 6, 0.5)',
    icon: '#fbbf24',
    text: '#fef3c7',
    button: '#d97706',
    buttonHover: '#f59e0b',
    dismiss: '#fcd34d',
    dismissHover: '#fef3c7',
  },
  error: {
    bg: 'rgba(127, 29, 29, 0.95)',
    border: 'rgba(220, 38, 38, 0.5)',
    icon: '#f87171',
    text: '#fee2e2',
    button: '#dc2626',
    buttonHover: '#ef4444',
    dismiss: '#fca5a5',
    dismissHover: '#fee2e2',
  },
};

/**
 * AuthErrorBanner Component
 * 
 * Displays a prominent banner when auth errors occur, such as:
 * - Session revoked (logged out from another device)
 * - Session expired
 * - Network errors
 * 
 * Provides clear messaging and action buttons for recovery.
 */
export default function AuthErrorBanner({ 
  sessionExpired, 
  sessionRevoked, 
  authError, 
  onSignIn, 
  onDismiss 
}) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [isHoveringDismiss, setIsHoveringDismiss] = useState(false);
  
  // Determine if banner should show
  const shouldShow = !isDismissed && (sessionRevoked || sessionExpired || authError);
  
  // Delay appearance slightly to avoid flash on normal logouts
  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [shouldShow]);
  
  // Reset dismissed state when error changes
  useEffect(() => {
    if (sessionRevoked || sessionExpired || authError) {
      setIsDismissed(false);
    }
  }, [sessionRevoked, sessionExpired, authError]);
  
  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };
  
  const handleSignIn = () => {
    setIsDismissed(true);
    onSignIn?.();
  };
  
  // Determine the message to show
  let title = 'Session Error';
  let message = authError || 'An authentication error occurred.';
  let severity = 'error'; // 'warning' | 'error'
  
  if (sessionRevoked) {
    title = 'Signed Out';
    message = 'You were signed out because you logged in on another device.';
    severity = 'warning';
  } else if (sessionExpired && !authError) {
    title = 'Session Expired';
    message = 'Your session has expired. Please sign in again to continue.';
    severity = 'warning';
  }
  
  const colors = colorSchemes[severity];
  
  if (!isVisible) return null;
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: colors.bg,
        borderBottom: `1px solid ${colors.border}`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'authBannerSlideDown 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes authBannerSlideDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0.75rem 1rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flex: '1 1 0%',
            minWidth: 0,
          }}>
            <span style={{
              display: 'flex',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}>
              <ExclamationIcon 
                style={{ 
                  width: '1.25rem', 
                  height: '1.25rem', 
                  color: colors.icon,
                }} 
              />
            </span>
            <div style={{
              marginLeft: '0.75rem',
              flex: '1 1 0%',
              minWidth: 0,
            }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: colors.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: 0,
              }}>
                <span style={{ fontWeight: 600 }}>{title}:</span> {message}
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0,
          }}>
            <button
              onClick={handleSignIn}
              onMouseEnter={() => setIsHoveringButton(true)}
              onMouseLeave={() => setIsHoveringButton(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#ffffff',
                backgroundColor: isHoveringButton ? colors.buttonHover : colors.button,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 150ms',
              }}
            >
              <SignInIcon style={{ width: '1rem', height: '1rem' }} />
              Sign In
            </button>
            <button
              onClick={handleDismiss}
              onMouseEnter={() => setIsHoveringDismiss(true)}
              onMouseLeave={() => setIsHoveringDismiss(false)}
              style={{
                padding: '0.375rem',
                borderRadius: '0.375rem',
                color: isHoveringDismiss ? colors.dismissHover : colors.dismiss,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 150ms',
              }}
              aria-label="Dismiss"
            >
              <XIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
