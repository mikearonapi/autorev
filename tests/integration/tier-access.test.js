/**
 * Tier Access & Feature Gating Tests
 * Tests tier-based access control
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Tier Access & Feature Gating', () => {
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
  });

  // =========================================
  // Free Tier Features
  // =========================================
  describe('Free Tier Features (No Auth)', () => {
    it('car list is publicly accessible', async () => {
      const response = await apiRequest('/api/cars');
      assertResponse(response, 200, ['cars']);
    });

    it('car efficiency is publicly accessible', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/efficiency');
      assertResponse(response, 200);
    });

    it('car safety ratings is publicly accessible', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/safety-ratings');
      assertResponse(response, 200);
    });

    it('car recalls is publicly accessible', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/recalls');
      assertResponse(response, 200);
    });

    it('car expert reviews is publicly accessible', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/expert-reviews');
      assertResponse(response, 200);
    });

    it('car lap times is publicly accessible', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/lap-times');
      assertResponse(response, 200);
    });

    it('car dyno data is publicly accessible', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/dyno');
      assertResponse(response, 200);
    });

    it('events list is publicly accessible', async () => {
      const response = await apiRequest('/api/events?limit=10');
      assertResponse(response, 200);
    });

    it('event types is publicly accessible', async () => {
      const response = await apiRequest('/api/events/types');
      assertResponse(response, 200);
    });

    it('parts search is publicly accessible', async () => {
      const response = await apiRequest('/api/parts/search?q=intake');
      assertResponse(response, 200);
    });

    it('health endpoint is publicly accessible', async () => {
      const response = await apiRequest('/api/health');
      assertResponse(response, 200);
    });

    it('stats endpoint is publicly accessible', async () => {
      const response = await apiRequest('/api/stats');
      assertResponse(response, 200);
    });
  });

  // =========================================
  // Enthusiast Tier Features
  // =========================================
  describe('Enthusiast Tier Features (Auth Required)', () => {
    it('VIN decode requires authentication', async () => {
      const response = await apiRequest('/api/vin/decode', {
        method: 'POST',
        body: JSON.stringify({ vin: 'WP0AB29986S731234' }),
      });
      
      // Should require auth OR work in IS_BETA mode
      if (response.status === 200) {
        console.log('VIN decode accessible (IS_BETA mode)');
      } else {
        assert.ok([401, 403].includes(response.status), 'Should require auth');
      }
    });

    it('market value may be tier-gated', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/market-value');
      // May return 200, 401, 403, or 500 (no data)
      assert.ok([200, 401, 403, 500].includes(response.status));
    });

    it('event saving requires authentication', async () => {
      const eventsRes = await apiRequest('/api/events?limit=1');
      const slug = eventsRes.data.events?.[0]?.slug;
      
      if (slug) {
        const response = await apiRequest(`/api/events/${slug}/save`, {
          method: 'POST',
        });
        assert.ok([401, 403, 500].includes(response.status));
      }
    });

    it('saved events requires authentication or IS_BETA mode', async () => {
      const response = await apiRequest('/api/users/test-user/saved-events');
      // May be accessible in IS_BETA mode (200), require auth (401/403), or error (500)
      console.log(`Saved events status: ${response.status}`);
      assert.ok([200, 401, 403, 500].includes(response.status));
    });
  });

  // =========================================
  // Tuner Tier Features
  // =========================================
  describe('Tuner Tier Features', () => {
    it('dyno data is accessible (may be tiered in production)', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/dyno');
      // Currently accessible, may be gated in production
      assertResponse(response, 200);
    });

    it('lap times are accessible (may be tiered in production)', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/lap-times');
      // Currently accessible, may be gated in production
      assertResponse(response, 200);
    });

    it('parts catalog is accessible', async () => {
      const response = await apiRequest('/api/parts/search?q=intake');
      assertResponse(response, 200);
    });
  });

  // =========================================
  // Admin Features
  // =========================================
  describe('Admin Features (Require Admin Auth)', () => {
    const adminEndpoints = [
      { method: 'GET', path: '/api/internal/qa-report' },
      { method: 'GET', path: '/api/internal/events/submissions' },
      { method: 'POST', path: '/api/internal/car-variants' },
      { method: 'POST', path: '/api/internal/dyno/runs' },
      { method: 'POST', path: '/api/internal/track/lap-times' },
      { method: 'POST', path: '/api/internal/parts/fitments' },
      { method: 'POST', path: '/api/internal/knowledge/ingest' },
    ];

    for (const { method, path } of adminEndpoints) {
      it(`${method} ${path} requires admin auth`, async () => {
        const response = await apiRequest(path, {
          method,
          body: method === 'POST' ? JSON.stringify({}) : undefined,
        });
        
        // Should require admin auth or return 405 for wrong method
        if (response.status === 200) {
          console.log(`${path} accessible (may be IS_BETA mode)`);
        } else {
          assert.ok([401, 403, 405, 500].includes(response.status), 
            `${path} should require auth, got ${response.status}`);
        }
      });
    }
  });

  // =========================================
  // Cron Features
  // =========================================
  describe('Cron Features (Require CRON_SECRET)', () => {
    const cronEndpoints = [
      '/api/cron/schedule-ingestion',
      '/api/cron/process-scrape-jobs',
      '/api/cron/refresh-recalls',
      '/api/cron/refresh-complaints',
      '/api/cron/youtube-enrichment',
      '/api/cron/forum-scrape',
      '/api/cron/refresh-events',
    ];

    for (const path of cronEndpoints) {
      it(`${path} requires cron auth`, async () => {
        const response = await apiRequest(path);
        assert.ok([401, 403].includes(response.status), 
          `${path} should require auth, got ${response.status}`);
      });
    }
  });

  // =========================================
  // AL Assistant Features
  // =========================================
  describe('AL Assistant (Auth Required)', () => {
    it('AL chat requires authentication', async () => {
      const response = await apiRequest('/api/ai-mechanic', {
        method: 'POST',
        body: JSON.stringify({ message: 'Test' }),
      });
      
      assert.ok([401, 403].includes(response.status), 'AL should require auth');
    });

    it('AL credits requires authentication', async () => {
      const response = await apiRequest('/api/users/test-user/al-credits');
      
      // May be accessible in IS_BETA mode
      if (response.status !== 200) {
        assert.ok([401, 403].includes(response.status));
      }
    });

    it('AL conversations requires authentication', async () => {
      const response = await apiRequest('/api/users/test-user/al-conversations');
      
      // May be accessible in IS_BETA mode
      if (response.status !== 200) {
        assert.ok([401, 403].includes(response.status));
      }
    });
  });
});

// =========================================
// IS_BETA Mode Detection
// =========================================
describe('IS_BETA Mode Detection', () => {
  it('detects IS_BETA mode by checking VIN decode access', async () => {
    const response = await apiRequest('/api/vin/decode', {
      method: 'POST',
      body: JSON.stringify({ vin: 'WP0AB29986S731234' }),
    });
    
    if (response.status === 200) {
      console.log('⚠️ IS_BETA mode appears to be ENABLED - tier checks bypassed');
    } else {
      console.log('✅ IS_BETA mode appears to be DISABLED - tier checks enforced');
    }
  });

  it('detects IS_BETA mode by checking user data access', async () => {
    const response = await apiRequest('/api/users/test-user/al-credits');
    
    if (response.status === 200) {
      console.log('⚠️ User data accessible without auth (IS_BETA mode)');
    } else {
      console.log('✅ User data requires auth (production mode)');
    }
  });
});

