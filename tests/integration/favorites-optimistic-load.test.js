/**
 * FavoritesProvider Optimistic Load Test
 * 
 * Verifies that localStorage favorites are loaded synchronously
 * and visible immediately on page load without waiting for auth.
 * 
 * @module tests/integration/favorites-optimistic-load.test.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

// Mock localStorage for testing
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value.toString();
  }

  clear() {
    this.store = {};
  }

  removeItem(key) {
    delete this.store[key];
  }
}

describe('FavoritesProvider - Optimistic Load', () => {
  test('loadFavorites returns empty state when no localStorage data', async () => {
    const localStorageMock = new LocalStorageMock();
    global.localStorage = localStorageMock;
    global.window = { localStorage: localStorageMock };

    const { loadFavorites } = await import('../../lib/stores/favoritesStore.js');
    const state = loadFavorites();
    
    assert.deepStrictEqual(state, { favorites: [] });

    delete global.localStorage;
    delete global.window;
  });

  test('loadFavorites returns stored data when localStorage has favorites', async () => {
    const localStorageMock = new LocalStorageMock();
    global.localStorage = localStorageMock;
    global.window = { localStorage: localStorageMock };
    
    // Seed localStorage with test data
    const testFavorites = {
      favorites: [
        { slug: 'porsche-911-gt3', name: 'Porsche 911 GT3', hp: 502 },
        { slug: 'bmw-m3', name: 'BMW M3', hp: 473 },
      ]
    };
    localStorage.setItem('autorev_favorites', JSON.stringify(testFavorites));
    
    const { loadFavorites } = await import('../../lib/stores/favoritesStore.js');
    const state = loadFavorites();
    
    assert.strictEqual(state.favorites.length, 2);
    assert.strictEqual(state.favorites[0].slug, 'porsche-911-gt3');
    assert.strictEqual(state.favorites[1].slug, 'bmw-m3');

    delete global.localStorage;
    delete global.window;
  });

  test('loadFavorites is SSR-safe (returns empty when window undefined)', async () => {
    const { loadFavorites } = await import('../../lib/stores/favoritesStore.js');
    
    // Temporarily remove window
    const windowBackup = global.window;
    delete global.window;
    
    const state = loadFavorites();
    
    assert.deepStrictEqual(state, { favorites: [] });
    
    // Restore window if it existed
    if (windowBackup) {
      global.window = windowBackup;
    }
  });

  test('loadFavorites handles corrupted localStorage data gracefully', async () => {
    const localStorageMock = new LocalStorageMock();
    global.localStorage = localStorageMock;
    global.window = { localStorage: localStorageMock };
    
    // Seed localStorage with invalid JSON
    localStorage.setItem('autorev_favorites', 'invalid{json}');
    
    const { loadFavorites } = await import('../../lib/stores/favoritesStore.js');
    const state = loadFavorites();
    
    assert.deepStrictEqual(state, { favorites: [] });

    delete global.localStorage;
    delete global.window;
  });

  test('loadFavorites handles non-array favorites gracefully', async () => {
    const localStorageMock = new LocalStorageMock();
    global.localStorage = localStorageMock;
    global.window = { localStorage: localStorageMock };
    
    // Seed localStorage with invalid structure
    localStorage.setItem('autorev_favorites', JSON.stringify({ favorites: 'not-an-array' }));
    
    const { loadFavorites } = await import('../../lib/stores/favoritesStore.js');
    const state = loadFavorites();
    
    assert.deepStrictEqual(state, { favorites: [] });

    delete global.localStorage;
    delete global.window;
  });
});

/**
 * Manual Test Instructions
 * ========================
 * 
 * Since this provider uses React hooks and Next.js context,
 * the best way to verify the optimistic load is manual testing:
 * 
 * 1. Open browser DevTools → Application → Local Storage
 * 2. Add test data:
 *    Key: autorev_favorites
 *    Value: {"favorites":[{"slug":"porsche-911-gt3","name":"Porsche 911 GT3"}]}
 * 
 * 3. Navigate to /garage while logged OUT (guest mode)
 * 4. VERIFY: Favorite car appears IMMEDIATELY (no loading state)
 * 
 * 5. Sign in with an account
 * 6. VERIFY: Server favorites load without flickering
 * 7. VERIFY: Local favorites are synced to server (merged)
 * 
 * 8. Sign out
 * 9. VERIFY: Only guest favorites (from localStorage) are shown
 * 10. VERIFY: User's server favorites are NOT shown after logout
 * 
 * Expected behavior:
 * - Guest favorites: Instant load from localStorage
 * - After auth: Server data syncs/merges smoothly
 * - No flash of empty state → content → different content
 * - Logout: Clean transition back to guest-only favorites
 */

