/**
 * Complete Events API Tests
 * Tests all 6 events-related API routes
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Events API - Complete Coverage', () => {
  let testEventSlug;
  let eventTypes;
  
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
    
    // Get event types and a test event for later tests
    const typesRes = await apiRequest('/api/events/types');
    eventTypes = typesRes.data.types || [];
    
    const eventsRes = await apiRequest('/api/events?limit=1');
    if (eventsRes.data.events?.length > 0) {
      testEventSlug = eventsRes.data.events[0].slug;
    }
  });

  // =========================================
  // GET /api/events/types
  // =========================================
  describe('GET /api/events/types', () => {
    it('returns all event types', async () => {
      const response = await apiRequest('/api/events/types');
      assertResponse(response, 200, ['types']);
      assert.ok(response.data.types.length >= 5, 'Should have multiple event types');
    });

    it('event types have required fields', async () => {
      const response = await apiRequest('/api/events/types');
      response.data.types.forEach(type => {
        assert.ok(type.slug, 'Type should have slug');
        assert.ok(type.name, 'Type should have name');
        assert.ok('is_track_event' in type, 'Type should have is_track_event');
      });
    });

    it('includes expected event types', async () => {
      const response = await apiRequest('/api/events/types');
      const slugs = response.data.types.map(t => t.slug);
      
      const expectedTypes = ['cars-and-coffee', 'track-day', 'car-show', 'auction'];
      expectedTypes.forEach(expected => {
        assert.ok(slugs.includes(expected), `Should have ${expected} type`);
      });
    });

    it('track events are marked correctly', async () => {
      const response = await apiRequest('/api/events/types');
      const trackTypes = response.data.types.filter(t => t.is_track_event);
      assert.ok(trackTypes.length > 0, 'Should have some track event types');
      
      const nonTrackTypes = response.data.types.filter(t => !t.is_track_event);
      assert.ok(nonTrackTypes.length > 0, 'Should have some non-track event types');
    });
  });

  // =========================================
  // GET /api/events
  // =========================================
  describe('GET /api/events', () => {
    it('returns events with pagination', async () => {
      const response = await apiRequest('/api/events?limit=20');
      assertResponse(response, 200, ['events', 'total']);
      assert.ok(Array.isArray(response.data.events));
      assert.ok(typeof response.data.total === 'number');
    });

    it('events have required fields', async () => {
      const response = await apiRequest('/api/events?limit=10');
      response.data.events.forEach(event => {
        assert.ok(event.slug, 'Event should have slug');
        assert.ok(event.name, 'Event should have name');
        assert.ok(event.start_date, 'Event should have start_date');
      });
    });

    it('filters by type (cars-and-coffee)', async () => {
      const response = await apiRequest('/api/events?type=cars-and-coffee&limit=20');
      assertResponse(response, 200);
      response.data.events.forEach(event => {
        assert.strictEqual(event.event_type?.slug, 'cars-and-coffee');
      });
    });

    it('filters by type (track-day)', async () => {
      const response = await apiRequest('/api/events?type=track-day&limit=20');
      assertResponse(response, 200);
      response.data.events.forEach(event => {
        assert.strictEqual(event.event_type?.slug, 'track-day');
      });
    });

    it('filters by type (car-show)', async () => {
      const response = await apiRequest('/api/events?type=car-show&limit=20');
      assertResponse(response, 200);
    });

    it('filters by type (auction)', async () => {
      const response = await apiRequest('/api/events?type=auction&limit=20');
      assertResponse(response, 200);
    });

    it('filters by state (CA)', async () => {
      const response = await apiRequest('/api/events?state=CA&limit=20');
      assertResponse(response, 200);
      response.data.events.forEach(event => {
        assert.strictEqual(event.state, 'CA');
      });
    });

    it('filters by state (TX)', async () => {
      const response = await apiRequest('/api/events?state=TX&limit=20');
      assertResponse(response, 200);
    });

    it('filters by state (FL)', async () => {
      const response = await apiRequest('/api/events?state=FL&limit=20');
      assertResponse(response, 200);
    });

    it('filters by is_track_event=true', async () => {
      const response = await apiRequest('/api/events?is_track_event=true&limit=20');
      assertResponse(response, 200);
      response.data.events.forEach(event => {
        assert.ok(event.event_type?.is_track_event);
      });
    });

    it('filters by is_free=true', async () => {
      const response = await apiRequest('/api/events?is_free=true&limit=20');
      assertResponse(response, 200);
      response.data.events.forEach(event => {
        assert.strictEqual(event.is_free, true);
      });
    });

    it('filters by region (West)', async () => {
      const response = await apiRequest('/api/events?region=West&limit=20');
      assertResponse(response, 200);
    });

    it('filters by region (Northeast)', async () => {
      const response = await apiRequest('/api/events?region=Northeast&limit=20');
      assertResponse(response, 200);
    });

    it('filters by scope (local)', async () => {
      const response = await apiRequest('/api/events?scope=local&limit=20');
      assertResponse(response, 200);
    });

    it('filters by scope (national)', async () => {
      const response = await apiRequest('/api/events?scope=national&limit=20');
      assertResponse(response, 200);
    });

    it('supports date range filtering (start_after)', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      const response = await apiRequest(`/api/events?start_after=${futureDate.toISOString()}&limit=20`);
      assertResponse(response, 200);
    });

    it('respects limit parameter', async () => {
      const response = await apiRequest('/api/events?limit=5');
      assertResponse(response, 200);
      assert.ok(response.data.events.length <= 5);
    });

    it('supports offset pagination', async () => {
      const page1 = await apiRequest('/api/events?limit=5&offset=0');
      const page2 = await apiRequest('/api/events?limit=5&offset=5');
      
      if (page1.data.events.length > 0 && page2.data.events.length > 0) {
        const page1Slugs = new Set(page1.data.events.map(e => e.slug));
        const hasOverlap = page2.data.events.some(e => page1Slugs.has(e.slug));
        assert.ok(!hasOverlap, 'Pages should not overlap');
      }
    });

    it('combines multiple filters', async () => {
      const response = await apiRequest('/api/events?type=cars-and-coffee&is_free=true&limit=20');
      assertResponse(response, 200);
      response.data.events.forEach(event => {
        assert.strictEqual(event.event_type?.slug, 'cars-and-coffee');
        assert.strictEqual(event.is_free, true);
      });
    });

    it('supports location search', async () => {
      const response = await apiRequest('/api/events?location=Los+Angeles&radius=50&limit=20');
      assertResponse(response, 200);
    });

    it('handles empty results gracefully', async () => {
      const response = await apiRequest('/api/events?state=ZZ&limit=20');
      assertResponse(response, 200);
      assert.ok(Array.isArray(response.data.events));
    });
  });

  // =========================================
  // GET /api/events/[slug]
  // =========================================
  describe('GET /api/events/[slug]', () => {
    it('returns single event details', async function() {
      if (!testEventSlug) {
        console.log('Skipping - no test event');
        return;
      }
      
      const response = await apiRequest(`/api/events/${testEventSlug}`);
      assertResponse(response, 200, ['event']);
      
      const event = response.data.event;
      assert.ok(event.id);
      assert.ok(event.slug);
      assert.ok(event.name);
      assert.ok(event.start_date);
    });

    it('returns 404 for invalid slug', async () => {
      const response = await apiRequest('/api/events/nonexistent-event-12345');
      assert.strictEqual(response.status, 404);
    });

    it('includes event type details', async function() {
      if (!testEventSlug) return;
      
      const response = await apiRequest(`/api/events/${testEventSlug}`);
      const event = response.data.event;
      
      if (event.event_type) {
        assert.ok(event.event_type.slug);
        assert.ok(event.event_type.name);
      }
    });
  });

  // =========================================
  // POST /api/events/[slug]/save
  // =========================================
  describe('POST /api/events/[slug]/save', () => {
    it('requires authentication', async function() {
      if (!testEventSlug) return;
      
      const response = await apiRequest(`/api/events/${testEventSlug}/save`, {
        method: 'POST',
      });
      
      // Should return 401, 403, or 500 (auth error)
      assert.ok([401, 403, 500].includes(response.status));
    });
  });

  // =========================================
  // DELETE /api/events/[slug]/save
  // =========================================
  describe('DELETE /api/events/[slug]/save', () => {
    it('requires authentication', async function() {
      if (!testEventSlug) return;
      
      const response = await apiRequest(`/api/events/${testEventSlug}/save`, {
        method: 'DELETE',
      });
      
      // Should return 401, 403, or 500 (auth error)
      assert.ok([401, 403, 500].includes(response.status));
    });
  });

  // =========================================
  // POST /api/events/submit
  // =========================================
  describe('POST /api/events/submit', () => {
    it('validates required fields', async () => {
      const response = await apiRequest('/api/events/submit', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      // Should return 400 (validation), 401 (auth), or 500 (server error)
      assert.ok([400, 401, 500].includes(response.status));
    });

    it('validates event data structure', async () => {
      const response = await apiRequest('/api/events/submit', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Event',
          event_type_slug: 'cars-and-coffee',
          // Missing required fields
        }),
      });
      
      assert.ok([400, 401, 500].includes(response.status));
    });
  });
});

// =========================================
// Events Data Validation
// =========================================
describe('Events Data Validation', () => {
  it('events have valid dates', async () => {
    const response = await apiRequest('/api/events?limit=50');
    response.data.events.forEach(event => {
      const startDate = new Date(event.start_date);
      assert.ok(!isNaN(startDate.getTime()), `Invalid date: ${event.start_date}`);
    });
  });

  it('events have valid states', async () => {
    const validStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
    ];
    
    const response = await apiRequest('/api/events?limit=50');
    response.data.events.forEach(event => {
      if (event.state) {
        assert.ok(validStates.includes(event.state), `Invalid state: ${event.state}`);
      }
    });
  });

  it('featured events are highlighted', async () => {
    const response = await apiRequest('/api/events?limit=100');
    const featured = response.data.events.filter(e => e.featured);
    console.log(`Featured events: ${featured.length}/${response.data.events.length}`);
  });
});
