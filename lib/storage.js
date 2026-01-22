/**
 * Storage Abstraction Layer
 * 
 * Provides a unified interface for persistent and session storage that works across:
 * - PWA (uses localStorage/sessionStorage)
 * - iOS/Android native (will use AsyncStorage or SecureStore when integrated)
 * 
 * This abstraction allows the same code to run on web and native platforms
 * by swapping the underlying storage implementation.
 * 
 * @module lib/storage
 */

const isServer = typeof window === 'undefined';

/**
 * Storage key prefix for namespacing
 */
const STORAGE_PREFIX = 'autorev_';

/**
 * Persistent storage (survives browser close)
 * PWA: localStorage
 * Native: AsyncStorage (React Native)
 */
export const storage = {
  /**
   * Get an item from storage
   * @param {string} key - Storage key (without prefix)
   * @returns {*} Parsed value or null
   */
  get: (key) => {
    if (isServer) return null;
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`[Storage] Error reading key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set an item in storage
   * @param {string} key - Storage key (without prefix)
   * @param {*} value - Value to store (will be JSON stringified)
   * @returns {boolean} Success status
   */
  set: (key, value) => {
    if (isServer) return false;
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (error) {
      // Handle quota exceeded or other errors
      console.warn(`[Storage] Error writing key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove an item from storage
   * @param {string} key - Storage key (without prefix)
   */
  remove: (key) => {
    if (isServer) return;
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.warn(`[Storage] Error removing key "${key}":`, error);
    }
  },

  /**
   * Clear all AutoRev items from storage
   */
  clear: () => {
    if (isServer) return;
    try {
      // Only clear AutoRev-prefixed items, not all localStorage
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
    } catch (error) {
      console.warn('[Storage] Error clearing storage:', error);
    }
  },

  /**
   * Get all keys in storage (without prefix)
   * @returns {string[]} Array of keys
   */
  keys: () => {
    if (isServer) return [];
    try {
      return Object.keys(localStorage)
        .filter(k => k.startsWith(STORAGE_PREFIX))
        .map(k => k.slice(STORAGE_PREFIX.length));
    } catch (error) {
      console.warn('[Storage] Error getting keys:', error);
      return [];
    }
  },
};

/**
 * Session storage (cleared when browser closes)
 * PWA: sessionStorage
 * Native: In-memory cache (React Native doesn't have sessionStorage equivalent)
 */
export const sessionStore = {
  /**
   * Get an item from session storage
   * @param {string} key - Storage key (without prefix)
   * @returns {*} Parsed value or null
   */
  get: (key) => {
    if (isServer) return null;
    try {
      const item = sessionStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`[SessionStore] Error reading key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set an item in session storage
   * @param {string} key - Storage key (without prefix)
   * @param {*} value - Value to store (will be JSON stringified)
   * @returns {boolean} Success status
   */
  set: (key, value) => {
    if (isServer) return false;
    try {
      sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[SessionStore] Error writing key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove an item from session storage
   * @param {string} key - Storage key (without prefix)
   */
  remove: (key) => {
    if (isServer) return;
    try {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.warn(`[SessionStore] Error removing key "${key}":`, error);
    }
  },

  /**
   * Clear all AutoRev items from session storage
   */
  clear: () => {
    if (isServer) return;
    try {
      const keys = Object.keys(sessionStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      keys.forEach(k => sessionStorage.removeItem(k));
    } catch (error) {
      console.warn('[SessionStore] Error clearing storage:', error);
    }
  },
};

/**
 * Legacy direct access (for migration purposes)
 * Use storage.get/set instead for new code
 */
export const legacyStorage = {
  /**
   * Direct localStorage get (no prefix, no JSON parse)
   */
  getRaw: (key) => {
    if (isServer) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  /**
   * Direct localStorage set (no prefix, no JSON stringify)
   */
  setRaw: (key, value) => {
    if (isServer) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Quota exceeded
    }
  },

  /**
   * Direct localStorage remove (no prefix)
   */
  removeRaw: (key) => {
    if (isServer) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

export default storage;
