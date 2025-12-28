'use client';

import { useState, useEffect } from 'react';

/**
 * Warning/Error icon component
 */
function ExclamationIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Close X icon component
 */
function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Sign in arrow icon component
 */
function SignInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

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
  
  const colors = severity === 'warning' 
    ? {
        bg: 'bg-amber-900/90',
        border: 'border-amber-600/50',
        icon: 'text-amber-400',
        text: 'text-amber-100',
        button: 'bg-amber-600 hover:bg-amber-500',
        dismiss: 'text-amber-300 hover:text-amber-100',
      }
    : {
        bg: 'bg-red-900/90',
        border: 'border-red-600/50',
        icon: 'text-red-400',
        text: 'text-red-100',
        button: 'bg-red-600 hover:bg-red-500',
        dismiss: 'text-red-300 hover:text-red-100',
      };
  
  if (!isVisible) return null;
  
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] ${colors.bg} ${colors.border} border-b backdrop-blur-sm`}
      style={{
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <style jsx>{`
        @keyframes slideDown {
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
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center flex-1 min-w-0">
            <span className={`flex p-2 rounded-lg ${colors.bg}`}>
              <ExclamationIcon className={`h-5 w-5 ${colors.icon}`} aria-hidden="true" />
            </span>
            <div className="ml-3 flex-1 min-w-0">
              <p className={`text-sm font-medium ${colors.text} truncate`}>
                <span className="font-semibold">{title}:</span> {message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSignIn}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white ${colors.button} transition-colors`}
            >
              <SignInIcon className="h-4 w-4" />
              Sign In
            </button>
            <button
              onClick={handleDismiss}
              className={`p-1.5 rounded-md ${colors.dismiss} transition-colors`}
              aria-label="Dismiss"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

