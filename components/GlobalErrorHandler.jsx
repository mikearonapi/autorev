'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/errorLogger';

export function GlobalErrorHandler({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUnhandledRejection = (event) => {
      logError(event?.reason || new Error('Unhandled Promise Rejection'), {
        errorType: 'unhandled_exception',
        severity: 'major',
      });
    };

    const handleError = (event) => {
      logError(event?.error || new Error(event?.message || 'Unhandled Error'), {
        errorType: 'unhandled_exception',
        severity: 'blocking',
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return children;
}

export default GlobalErrorHandler;







