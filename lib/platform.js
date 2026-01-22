/**
 * Platform Abstraction Layer
 * 
 * Provides cross-platform abstractions for browser APIs that don't exist
 * or work differently in native mobile apps (React Native).
 * 
 * This module abstracts:
 * - Web Share API
 * - Clipboard API
 * - Online status
 * - Platform detection
 * 
 * @module lib/platform
 */

const isServer = typeof window === 'undefined';
const isClient = !isServer;

/**
 * Platform detection utilities
 */
export const platform = {
  /**
   * Whether running in web browser environment
   */
  isWeb: isClient,

  /**
   * Whether running in React Native environment
   * Will be true when running in native mobile apps
   */
  isNative: false,

  /**
   * Whether running on server (SSR)
   */
  isServer,

  /**
   * Whether running on client
   */
  isClient,

  /**
   * Whether running on iOS (web or native)
   */
  isIOS: isClient && /iPad|iPhone|iPod/.test(navigator.userAgent),

  /**
   * Whether running on Android (web or native)
   */
  isAndroid: isClient && /Android/.test(navigator.userAgent),

  /**
   * Whether Web Share API is available
   */
  canShare: isClient && typeof navigator.share === 'function',

  /**
   * Whether Clipboard API is available
   */
  canClipboard: isClient && typeof navigator.clipboard?.writeText === 'function',

  /**
   * Share content using Web Share API with fallback to clipboard
   * 
   * @param {Object} data - Share data
   * @param {string} [data.title] - Share title
   * @param {string} [data.text] - Share text
   * @param {string} [data.url] - Share URL
   * @returns {Promise<{success: boolean, method: string}>}
   */
  share: async (data) => {
    if (isServer) {
      return { success: false, method: 'server' };
    }

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share(data);
        return { success: true, method: 'native' };
      } catch (err) {
        // User cancelled or share failed
        if (err.name !== 'AbortError') {
          console.warn('[Platform] Share failed:', err);
        }
      }
    }

    // Fallback: Copy URL to clipboard
    const textToCopy = data.url || data.text || data.title;
    if (textToCopy) {
      try {
        await platform.copyToClipboard(textToCopy);
        return { success: true, method: 'clipboard' };
      } catch (err) {
        console.warn('[Platform] Clipboard fallback failed:', err);
      }
    }

    return { success: false, method: 'none' };
  },

  /**
   * Copy text to clipboard with fallback for older browsers
   * 
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} - Whether copy succeeded
   */
  copyToClipboard: async (text) => {
    if (isServer) return false;

    // Try modern Clipboard API first
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('[Platform] Clipboard API failed:', err);
        // Fall through to fallback
      }
    }

    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (err) {
      console.warn('[Platform] Fallback clipboard failed:', err);
      return false;
    }
  },

  /**
   * Read text from clipboard
   * 
   * @returns {Promise<string|null>} - Clipboard text or null if unavailable
   */
  readClipboard: async () => {
    if (isServer) return null;

    if (navigator.clipboard?.readText) {
      try {
        return await navigator.clipboard.readText();
      } catch (err) {
        console.warn('[Platform] Clipboard read failed:', err);
        return null;
      }
    }

    return null;
  },

  /**
   * Check if device is online
   * 
   * @returns {boolean}
   */
  isOnline: () => {
    if (isServer) return true;
    return navigator.onLine ?? true;
  },

  /**
   * Add online/offline event listener
   * 
   * @param {'online' | 'offline'} event - Event type
   * @param {Function} callback - Event handler
   * @returns {Function} - Cleanup function to remove listener
   */
  onNetworkChange: (event, callback) => {
    if (isServer) return () => {};
    
    window.addEventListener(event, callback);
    return () => window.removeEventListener(event, callback);
  },

  /**
   * Get device pixel ratio for image sizing
   * 
   * @returns {number}
   */
  getPixelRatio: () => {
    if (isServer) return 1;
    return window.devicePixelRatio || 1;
  },

  /**
   * Get viewport dimensions
   * 
   * @returns {{width: number, height: number}}
   */
  getViewport: () => {
    if (isServer) return { width: 0, height: 0 };
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },

  /**
   * Trigger haptic feedback (native only, no-op on web)
   * 
   * @param {'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'} type - Feedback type
   */
  haptic: (type = 'light') => {
    // No-op on web - will be implemented in React Native wrapper
    if (isServer || !platform.isNative) return;
    // Native implementation would go here
  },

  /**
   * Check if the device supports biometric authentication
   * 
   * @returns {boolean}
   */
  supportsBiometric: () => {
    // No standard web API for biometrics
    // Will be implemented in React Native wrapper
    return false;
  },
};

/**
 * Feature flags for conditional rendering
 */
export const features = {
  /**
   * Whether dark mode is supported and enabled
   */
  darkMode: isClient && window.matchMedia?.('(prefers-color-scheme: dark)').matches,

  /**
   * Whether reduced motion is preferred
   */
  reducedMotion: isClient && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,

  /**
   * Whether touch is the primary input
   */
  touchPrimary: isClient && window.matchMedia?.('(pointer: coarse)').matches,

  /**
   * Whether device has hover capability
   */
  hasHover: isClient && window.matchMedia?.('(hover: hover)').matches,
};

export default platform;
