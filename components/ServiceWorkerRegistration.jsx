'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for PWA functionality
 * Enables "Add to Home Screen" on iOS and Android
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker after page load for better performance
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration.scope);
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}

