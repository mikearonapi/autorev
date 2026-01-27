'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * usePWAInstall - Hook for managing PWA installation across all platforms
 *
 * Handles:
 * - Chrome/Edge/Samsung: beforeinstallprompt event capture
 * - iOS Safari: Detection and instruction display
 * - macOS Safari 17+: PWA support detection
 * - Already installed detection via display-mode: standalone
 * - Dismissal persistence with localStorage
 *
 * @returns {Object} PWA install state and actions
 */
export default function usePWAInstall() {
  // Install prompt event (Chrome/Edge only)
  const deferredPromptRef = useRef(null);

  // State
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMacSafari17, setIsMacSafari17] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [browser, setBrowser] = useState('unknown');

  // Check if user has dismissed the prompt recently
  const checkDismissed = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const dismissedUntil = localStorage.getItem('pwa-install-dismissed-until');
    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      if (dismissedDate > new Date()) {
        return true;
      }
      // Expired, remove it
      localStorage.removeItem('pwa-install-dismissed-until');
    }
    return false;
  }, []);

  // Dismiss prompt for a period (default 7 days)
  const dismissPrompt = useCallback((days = 7) => {
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + days);
    localStorage.setItem('pwa-install-dismissed-until', dismissUntil.toISOString());
    setIsDismissed(true);
  }, []);

  // Permanently dismiss (user installed or doesn't want it)
  const dismissPermanently = useCallback(() => {
    localStorage.setItem('pwa-install-dismissed-permanently', 'true');
    setIsDismissed(true);
  }, []);

  // Platform detection - ALWAYS runs to ensure correct instructions even when force-shown
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();

    // Detect iOS (iPhone, iPad, iPod)
    const iosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIOS(iosDevice);

    // Detect Android
    const androidDevice = /android/.test(ua);
    setIsAndroid(androidDevice);

    // Detect macOS Safari 17+ (supports PWA installation)
    const isMac = /macintosh/.test(ua) && !navigator.maxTouchPoints;
    if (isMac) {
      const safariVersionMatch = /version\/(\d+)\./.exec(ua);
      if (safariVersionMatch && parseInt(safariVersionMatch[1]) >= 17) {
        // Additional check for Safari (not Chrome/Firefox on Mac)
        if (/safari/.test(ua) && !/chrome|firefox|edg/.test(ua)) {
          setIsMacSafari17(true);
        }
      }
    }

    // Detect browser - order matters! Check specific browsers before generic ones
    // Samsung Browser must be checked BEFORE Chrome (Samsung UA contains 'chrome')
    if (/samsungbrowser/.test(ua)) {
      setBrowser('samsung');
    } else if (/edg/.test(ua)) {
      setBrowser('edge');
    } else if (/opr|opera/.test(ua)) {
      setBrowser('opera');
    } else if (/firefox|fxios/.test(ua)) {
      setBrowser('firefox');
    } else if (/chrome|crios/.test(ua) && !/edg/.test(ua)) {
      setBrowser('chrome');
    } else if (/safari/.test(ua) && !/chrome/.test(ua)) {
      setBrowser('safari');
    }

    // Check if already installed (running in standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true || // iOS Safari
      document.referrer.includes('android-app://'); // TWA

    if (isStandalone) {
      setIsInstalled(true);
      // Still continue to set installable states for edge cases
    }

    // Check dismissal status (separate from detection)
    if (localStorage.getItem('pwa-install-dismissed-permanently') === 'true') {
      setIsDismissed(true);
    } else if (checkDismissed()) {
      setIsDismissed(true);
    }

    // For iOS, it's always "installable" (user can add to home screen)
    if (iosDevice && !isStandalone) {
      setIsInstallable(true);
    }

    // For Android, it's always "installable" (can add to home screen)
    if (androidDevice && !isStandalone) {
      setIsInstallable(true);
    }

    // For macOS Safari 17+, it's installable
    if (isMac && /safari/.test(ua) && !/chrome|firefox|edg/.test(ua) && !isStandalone) {
      const safariVersionMatch = /version\/(\d+)\./.exec(ua);
      if (safariVersionMatch && parseInt(safariVersionMatch[1]) >= 17) {
        setIsInstallable(true);
      }
    }
  }, [checkDismissed]);

  // Handle beforeinstallprompt event (Chrome/Edge/Samsung)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInstalled || isDismissed) return;

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPromptRef.current = e;
      setIsInstallable(true);
      console.log('[PWA] Install prompt ready');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPromptRef.current = null;
      dismissPermanently();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, isDismissed, dismissPermanently]);

  // Trigger the install prompt (Chrome/Edge/Samsung only)
  const promptInstall = useCallback(async () => {
    if (!deferredPromptRef.current) {
      console.log('[PWA] No install prompt available');
      return { outcome: 'unavailable' };
    }

    try {
      // Show the install prompt
      deferredPromptRef.current.prompt();

      // Wait for the user's response
      const { outcome } = await deferredPromptRef.current.userChoice;
      console.log(`[PWA] User response: ${outcome}`);

      // Clear the stored prompt
      deferredPromptRef.current = null;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        dismissPermanently();
      }

      return { outcome };
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return { outcome: 'error', error };
    }
  }, [dismissPermanently]);

  // Can we show the native install prompt?
  const canPromptNatively = Boolean(deferredPromptRef.current);

  // Should we show any install UI?
  const shouldShowInstallPrompt = isInstallable && !isInstalled && !isDismissed;

  // Get platform-specific install instructions
  const getInstallInstructions = useCallback(() => {
    // iOS Safari
    if (isIOS) {
      return {
        platform: 'ios',
        steps: [
          { icon: 'share', text: 'Tap the Share button at the bottom' },
          { icon: 'scroll', text: 'Scroll down in the share menu' },
          { icon: 'add', text: 'Tap "Add to Home Screen"' },
          { icon: 'confirm', text: 'Tap "Add" in the top right' },
        ],
        shareIcon: true,
      };
    }

    // macOS Safari 17+
    if (isMacSafari17) {
      return {
        platform: 'mac-safari',
        steps: [
          { icon: 'file', text: 'Click File in the menu bar' },
          { icon: 'add', text: 'Click "Add to Dock"' },
        ],
        shareIcon: false,
      };
    }

    // Samsung Internet Browser (Android)
    if (isAndroid && browser === 'samsung') {
      return {
        platform: 'samsung',
        steps: [
          { icon: 'menu', text: 'Tap the menu (☰) at the bottom right' },
          { icon: 'add', text: 'Tap "Add page to" then "Home screen"' },
          { icon: 'confirm', text: 'Tap "Add" to confirm' },
        ],
        canUseNativePrompt: canPromptNatively,
      };
    }

    // Chrome on Android
    if (isAndroid && browser === 'chrome') {
      return {
        platform: 'android-chrome',
        steps: [
          { icon: 'menu', text: 'Tap the menu (⋮) in the top right' },
          { icon: 'install', text: 'Tap "Install app" or "Add to Home screen"' },
          { icon: 'confirm', text: 'Tap "Install" to confirm' },
        ],
        canUseNativePrompt: canPromptNatively,
      };
    }

    // Firefox on Android
    if (isAndroid && browser === 'firefox') {
      return {
        platform: 'android-firefox',
        steps: [
          { icon: 'menu', text: 'Tap the menu (⋮) button' },
          { icon: 'install', text: 'Tap "Install"' },
          { icon: 'confirm', text: 'Tap "Add" to confirm' },
        ],
      };
    }

    // Opera on Android
    if (isAndroid && browser === 'opera') {
      return {
        platform: 'android-opera',
        steps: [
          { icon: 'menu', text: 'Tap the menu (⋮) button' },
          { icon: 'add', text: 'Tap "Home screen"' },
          { icon: 'confirm', text: 'Tap "Add" to confirm' },
        ],
        canUseNativePrompt: canPromptNatively,
      };
    }

    // Edge on Android
    if (isAndroid && browser === 'edge') {
      return {
        platform: 'android-edge',
        steps: [
          { icon: 'menu', text: 'Tap the menu (…) at the bottom' },
          { icon: 'add', text: 'Tap "Add to phone"' },
          { icon: 'confirm', text: 'Tap "Install" to confirm' },
        ],
        canUseNativePrompt: canPromptNatively,
      };
    }

    // Fallback for Android with unknown browser
    if (isAndroid) {
      return {
        platform: 'android-generic',
        steps: [
          { icon: 'menu', text: 'Tap the browser menu (⋮ or ☰)' },
          { icon: 'install', text: 'Look for "Install app" or "Add to Home screen"' },
          { icon: 'confirm', text: 'Confirm when prompted' },
        ],
        canUseNativePrompt: canPromptNatively,
      };
    }

    // Firefox on desktop
    if (browser === 'firefox') {
      return {
        platform: 'firefox-desktop',
        steps: [
          { icon: 'install', text: 'Firefox does not support installing PWAs on desktop' },
          { icon: 'menu', text: 'Try using Chrome or Edge for the best experience' },
        ],
      };
    }

    // Edge on desktop
    if (browser === 'edge') {
      return {
        platform: 'edge-desktop',
        steps: [
          { icon: 'install', text: 'Click the install icon (⊕) in the address bar' },
          { icon: 'confirm', text: 'Click "Install" to confirm' },
        ],
        canUseNativePrompt: canPromptNatively,
      };
    }

    // Chrome on desktop (default)
    return {
      platform: 'chrome-desktop',
      steps: [
        { icon: 'install', text: 'Click the install icon (⊕) in the address bar' },
        { icon: 'confirm', text: 'Click "Install" to confirm' },
      ],
      canUseNativePrompt: canPromptNatively,
    };
  }, [isIOS, isMacSafari17, isAndroid, browser, canPromptNatively]);

  return {
    // State
    isInstallable,
    isInstalled,
    isIOS,
    isMacSafari17,
    isAndroid,
    isDismissed,
    browser,

    // Computed
    canPromptNatively,
    shouldShowInstallPrompt,

    // Actions
    promptInstall,
    dismissPrompt,
    dismissPermanently,
    getInstallInstructions,
  };
}
