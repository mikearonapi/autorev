/**
 * AL Preferences Store
 * 
 * Stores and retrieves user preferences for the AL AI assistant.
 * This allows AL to remember user preferences across sessions.
 * 
 * @module lib/stores/alPreferencesStore
 */

const STORAGE_KEY = 'autorev_al_preferences';
const BOOKMARKS_KEY = 'autorev_al_bookmarks';

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
 * Load preferences from localStorage
 * @returns {ALPreferences}
 */
export function loadALPreferences() {
  if (typeof window === 'undefined') {
    return defaultPreferences;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaultPreferences,
        ...parsed,
      };
    }
  } catch (err) {
    console.warn('[ALPreferencesStore] Failed to load preferences:', err);
  }

  return defaultPreferences;
}

/**
 * Save preferences to localStorage
 * @param {Partial<ALPreferences>} preferences 
 */
export function saveALPreferences(preferences) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = loadALPreferences();
    const updated = {
      ...current,
      ...preferences,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[ALPreferencesStore] Failed to save preferences:', err);
  }
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
 * Load bookmarks from localStorage
 * @returns {ALBookmark[]}
 */
export function loadALBookmarks() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('[ALPreferencesStore] Failed to load bookmarks:', err);
  }

  return [];
}

/**
 * Save a bookmark
 * @param {Object} bookmark 
 * @returns {ALBookmark} The saved bookmark with generated ID
 */
export function saveALBookmark({ content, query, carSlug, carName, tags = [] }) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
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
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    
    return newBookmark;
  } catch (err) {
    console.warn('[ALPreferencesStore] Failed to save bookmark:', err);
    return null;
  }
}

/**
 * Remove a bookmark by ID
 * @param {string} bookmarkId 
 */
export function removeALBookmark(bookmarkId) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const bookmarks = loadALBookmarks();
    const updated = bookmarks.filter(b => b.id !== bookmarkId);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[ALPreferencesStore] Failed to remove bookmark:', err);
  }
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

