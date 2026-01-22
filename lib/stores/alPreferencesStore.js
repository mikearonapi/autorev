/**
 * AL Preferences Store
 * 
 * Stores and retrieves user preferences for the AL AI assistant.
 * This allows AL to remember user preferences across sessions.
 * Uses storage abstraction for cross-platform support (PWA/iOS/Android).
 * 
 * @module lib/stores/alPreferencesStore
 */

import { storage } from '@/lib/storage';

const STORAGE_KEY = 'al_preferences'; // Storage abstraction adds 'autorev_' prefix
const BOOKMARKS_KEY = 'al_bookmarks';

/**
 * @typedef {Object} ALPreferences
 * @property {string} responseStyle - 'concise' | 'detailed' | 'auto'
 * @property {string[]} preferredBrands - User's preferred car brands
 * @property {string} primaryUseCase - 'daily' | 'track' | 'show' | 'mixed'
 * @property {boolean} showCostPreviews - Whether to show cost previews for expensive queries
 * @property {boolean} showQuickReplies - Whether to show quick reply chips
 * @property {string[]} knownCars - Cars the user has shown interest in
 * @property {Object} conversationContext - Persistent context from conversations
 * @property {number} lastUpdated - Timestamp of last update
 */

/**
 * @typedef {Object} ALBookmark
 * @property {string} id - Unique bookmark ID
 * @property {string} content - The bookmarked response content
 * @property {string} query - The original query that generated this response
 * @property {string} carSlug - The car context when bookmarked (if any)
 * @property {string} carName - The car name when bookmarked (if any)
 * @property {number} createdAt - Timestamp when bookmarked
 * @property {string[]} tags - User-defined tags
 */

/**
 * Default preferences
 * @type {ALPreferences}
 */
export const defaultPreferences = {
  responseStyle: 'auto', // Will calibrate based on query
  preferredBrands: [],
  primaryUseCase: 'mixed',
  showCostPreviews: true,
  showQuickReplies: true,
  knownCars: [],
  conversationContext: {
    lastTopics: [],
    preferredTopics: [],
  },
  lastUpdated: null,
};

/**
 * Load preferences from storage
 * @returns {ALPreferences}
 */
export function loadALPreferences() {
  const stored = storage.get(STORAGE_KEY);
  if (stored) {
    return { ...defaultPreferences, ...stored };
  }
  return defaultPreferences;
}

/**
 * Save preferences to storage
 * @param {Partial<ALPreferences>} preferences 
 */
export function saveALPreferences(preferences) {
  const current = loadALPreferences();
  const updated = {
    ...current,
    ...preferences,
    lastUpdated: Date.now(),
  };
  storage.set(STORAGE_KEY, updated);
}

/**
 * Update a specific preference
 * @param {string} key 
 * @param {any} value 
 */
export function updateALPreference(key, value) {
  saveALPreferences({ [key]: value });
}

/**
 * Add a car to known cars list
 * @param {string} carSlug 
 */
export function addKnownCar(carSlug) {
  const prefs = loadALPreferences();
  if (!prefs.knownCars.includes(carSlug)) {
    saveALPreferences({
      knownCars: [...prefs.knownCars, carSlug].slice(-20), // Keep last 20
    });
  }
}

/**
 * Update conversation context with learned information
 * @param {Object} contextUpdate 
 */
export function updateConversationContext(contextUpdate) {
  const prefs = loadALPreferences();
  saveALPreferences({
    conversationContext: {
      ...prefs.conversationContext,
      ...contextUpdate,
    },
  });
}

// ============================================================================
// Bookmarks
// ============================================================================

/**
 * Load bookmarks from storage
 * @returns {ALBookmark[]}
 */
export function loadALBookmarks() {
  const stored = storage.get(BOOKMARKS_KEY);
  return Array.isArray(stored) ? stored : [];
}

/**
 * Save a bookmark
 * @param {Object} bookmark 
 * @returns {ALBookmark} The saved bookmark with generated ID
 */
export function saveALBookmark({ content, query, carSlug, carName, tags = [] }) {
  const bookmarks = loadALBookmarks();
  const newBookmark = {
    id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    query,
    carSlug,
    carName,
    createdAt: Date.now(),
    tags,
  };
  
  const updated = [newBookmark, ...bookmarks].slice(0, 50); // Keep last 50
  storage.set(BOOKMARKS_KEY, updated);
  
  return newBookmark;
}

/**
 * Remove a bookmark by ID
 * @param {string} bookmarkId 
 */
export function removeALBookmark(bookmarkId) {
  const bookmarks = loadALBookmarks();
  const updated = bookmarks.filter(b => b.id !== bookmarkId);
  storage.set(BOOKMARKS_KEY, updated);
}

/**
 * Check if a response is bookmarked (by content hash)
 * @param {string} content 
 * @returns {boolean}
 */
export function isBookmarked(content) {
  if (!content) return false;
  const bookmarks = loadALBookmarks();
  // Simple check by content start (first 200 chars)
  const contentStart = content.slice(0, 200);
  return bookmarks.some(b => b.content?.slice(0, 200) === contentStart);
}

/**
 * Get bookmark by content
 * @param {string} content 
 * @returns {ALBookmark|null}
 */
export function getBookmarkByContent(content) {
  if (!content) return null;
  const bookmarks = loadALBookmarks();
  const contentStart = content.slice(0, 200);
  return bookmarks.find(b => b.content?.slice(0, 200) === contentStart) || null;
}

