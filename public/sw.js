// AutoRev Service Worker v2.0
// Enhanced PWA support with intelligent API caching
//
// Features:
// - Stale-while-revalidate for car data (faster repeat visits)
// - Network-first for user data (sensitive)
// - Offline page fallback
// - Separate caches by data type

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `autorev-static-${CACHE_VERSION}`;
const API_CACHE = `autorev-api-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Files to precache for offline access
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json'
];

// API routes to cache with stale-while-revalidate
// These are public, read-only car data endpoints
const CACHEABLE_API_PATTERNS = [
  /\/api\/cars$/,                        // Car list
  /\/api\/cars\/[^/]+\/enriched$/,       // Car enriched data
  /\/api\/cars\/[^/]+\/efficiency$/,     // Fuel efficiency
  /\/api\/cars\/[^/]+\/safety-ratings$/, // Safety ratings
  /\/api\/cars\/[^/]+\/recalls$/,        // Recalls
  /\/api\/cars\/[^/]+\/maintenance$/,    // Maintenance
  /\/api\/cars\/[^/]+\/issues$/,         // Known issues
  /\/api\/cars\/[^/]+\/lap-times$/,      // Lap times
  /\/api\/cars\/[^/]+\/dyno$/,           // Dyno runs
  /\/api\/parts\/popular$/,              // Popular parts
  /\/api\/events$/,                      // Events list
  /\/api\/events\/featured$/,            // Featured events
];

// Max age for cached API responses (5 minutes)
const API_CACHE_MAX_AGE = 5 * 60 * 1000;

/**
 * Check if a URL matches any cacheable API pattern
 */
function isCacheableApi(url) {
  const pathname = new URL(url).pathname;
  return CACHEABLE_API_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Stale-while-revalidate strategy
 * Returns cached response immediately, then updates cache in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Start fetch in background regardless of cache
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      // Clone and cache the response
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
    }
    return response;
  }).catch((error) => {
    console.warn('[SW] Fetch failed:', error);
    return cachedResponse || new Response(
      JSON.stringify({ error: 'Offline', code: 'OFFLINE' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  });

  // Return cached response immediately if available, otherwise wait for fetch
  if (cachedResponse) {
    // Return stale data immediately
    return cachedResponse;
  }
  
  // No cache, wait for network
  return fetchPromise;
}

/**
 * Network-first strategy with cache fallback
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // For navigation, show offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    return new Response('Offline', { status: 503 });
  }
}

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old version caches
            return name.startsWith('autorev-') && 
                   name !== STATIC_CACHE && 
                   name !== API_CACHE;
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - route requests to appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip Supabase and analytics
  if (url.hostname.includes('supabase') || 
      url.pathname.includes('analytics') ||
      url.pathname.includes('_next/webpack')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // Skip user-specific APIs (require fresh data)
    if (url.pathname.includes('/users/') || 
        url.pathname.includes('/al/') ||
        url.pathname.includes('/checkout') ||
        url.pathname.includes('/billing') ||
        url.pathname.includes('/admin/')) {
      return; // Let browser handle normally
    }

    // Use stale-while-revalidate for cacheable APIs
    if (isCacheableApi(request.url)) {
      event.respondWith(staleWhileRevalidate(request));
      return;
    }

    // Other APIs - let browser handle
    return;
  }

  // Static assets and pages - network first with cache fallback
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_API_CACHE') {
    caches.delete(API_CACHE).then(() => {
      console.log('[SW] API cache cleared');
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
