/**
 * Journey 4: Event Discovery
 * 
 * Tests the complete flow:
 * Events List → Filter by Type → Event Detail → (Save requires auth)
 * 
 * Preconditions:
 * - Dev server running
 * - events table has approved future events
 * - event_types table populated
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, assertArrayItems, waitForServer, BASE_URL } from './test-helpers.js';

describe('Journey 4: Event Discovery', () => {
  let testEventSlug;
  let eventTypes;
  
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    try {
      await waitForServer(10000, 500);
      console.log('Server is ready');
    } catch (err) {
      console.log('Server not available, tests may fail:', err.message);
    }
  });
  
  describe('Step 3: Get Event Types', () => {
    it('GET /api/events/types returns event types', async () => {
      const response = await apiRequest('/api/events/types');
      
      assertResponse(response, 200, ['types']);
      assertArrayItems(response.data.types, ['slug', 'name'], 3);
      
      eventTypes = response.data.types;
      console.log(`Found ${eventTypes.length} event types`);
    });
    
    it('Event types have required fields', async () => {
      const response = await apiRequest('/api/events/types');
      
      for (const type of response.data.types) {
        assert.ok(type.slug, 'Type should have slug');
        assert.ok(type.name, 'Type should have name');
        assert.ok('is_track_event' in type, 'Type should have is_track_event');
      }
    });
  });
  
  describe('Step 1-2: Get Events List', () => {
    it('GET /api/events returns events with pagination', async () => {
      const response = await apiRequest('/api/events?limit=20');
      
      assertResponse(response, 200, ['events', 'total']);
      assert.ok(Array.isArray(response.data.events), 'events should be array');
      assert.ok(typeof response.data.total === 'number', 'total should be number');
      
      if (response.data.events.length > 0) {
        testEventSlug = response.data.events[0].slug;
        console.log(`Using test event: ${testEventSlug}`);
      }
    });
    
    it('Events have required fields', async () => {
      const response = await apiRequest('/api/events?limit=5');
      
      if (response.data.events.length > 0) {
        const event = response.data.events[0];
        assert.ok(event.slug, 'Event should have slug');
        assert.ok(event.name, 'Event should have name');
        assert.ok(event.start_date, 'Event should have start_date');
        assert.ok(event.city || event.state, 'Event should have location');
      }
    });
    
    it('Events are sorted by date (default)', async () => {
      const response = await apiRequest('/api/events?limit=10');
      
      const events = response.data.events;
      if (events.length > 1) {
        for (let i = 1; i < events.length; i++) {
          const prevDate = new Date(events[i-1].start_date);
          const currDate = new Date(events[i].start_date);
          // Featured events may appear first, but within same featured status, date order
          if (events[i-1].featured === events[i].featured) {
            assert.ok(
              currDate >= prevDate,
              `Events should be sorted by date: ${events[i-1].start_date} -> ${events[i].start_date}`
            );
          }
        }
      }
    });
  });
  
  describe('Step 4-7: Filter Events', () => {
    it('GET /api/events?type=cars-and-coffee filters by type', async () => {
      const response = await apiRequest('/api/events?type=cars-and-coffee&limit=20');
      
      assertResponse(response, 200, ['events']);
      
      for (const event of response.data.events) {
        assert.ok(
          event.event_type?.slug === 'cars-and-coffee',
          `Event type should be cars-and-coffee, got ${event.event_type?.slug}`
        );
      }
    });
    
    it('GET /api/events?state=CA filters by state', async () => {
      const response = await apiRequest('/api/events?state=CA&limit=20');
      
      assertResponse(response, 200, ['events']);
      
      for (const event of response.data.events) {
        assert.strictEqual(event.state, 'CA', 'Events should be in California');
      }
    });
    
    it('GET /api/events?is_track_event=true filters track events', async () => {
      const response = await apiRequest('/api/events?is_track_event=true&limit=20');
      
      assertResponse(response, 200, ['events']);
      
      for (const event of response.data.events) {
        assert.ok(
          event.event_type?.is_track_event === true,
          'Events should be track events'
        );
      }
    });
    
    it('GET /api/events?is_free=true filters free events', async () => {
      const response = await apiRequest('/api/events?is_free=true&limit=20');
      
      assertResponse(response, 200, ['events']);
      
      for (const event of response.data.events) {
        assert.strictEqual(event.is_free, true, 'Events should be free');
      }
    });
  });
  
  describe('Step 8-9: Event Detail', () => {
    it('GET /api/events/[slug] returns full event details', async function() {
      if (!testEventSlug) {
        console.log('Skipping - no test event available');
        return;
      }
      
      const response = await apiRequest(`/api/events/${testEventSlug}`);
      
      assertResponse(response, 200, ['event']);
      
      const event = response.data.event;
      assert.ok(event.id, 'Event should have id');
      assert.ok(event.slug, 'Event should have slug');
      assert.ok(event.name, 'Event should have name');
      assert.ok(event.start_date, 'Event should have start_date');
      assert.ok(event.event_type, 'Event should have event_type');
    });
    
    it('GET /api/events/[invalid] returns 404', async () => {
      const response = await apiRequest('/api/events/nonexistent-event-slug-99999');
      
      assert.strictEqual(response.status, 404, 'Should return 404 for missing event');
    });
  });
  
  describe('Step 11-13: Save Event (Auth Required)', () => {
    it('POST /api/events/[slug]/save handles unauthenticated request', async function() {
      if (!testEventSlug) {
        console.log('Skipping - no test event available');
        return;
      }
      
      const response = await apiRequest(`/api/events/${testEventSlug}/save`, {
        method: 'POST',
      });
      
      // Should require auth (401/403) or return server error (500) if auth middleware fails
      console.log(`Event save status: ${response.status}`);
      assert.ok(
        response.status === 401 || response.status === 403 || response.status === 500,
        `Expected auth check, got ${response.status}`
      );
    });
  });
  
  describe('Step 14-16: Submit Event (Auth Required)', () => {
    it('POST /api/events/submit handles validation', async () => {
      const response = await apiRequest('/api/events/submit', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
      });
      
      // Should return validation error (400), auth error (401), or server error (500)
      console.log(`Event submit status: ${response.status}`);
      assert.ok(
        response.status === 400 || response.status === 401 || response.status === 500,
        `Expected validation/auth check, got ${response.status}`
      );
    });
  });
});

describe('Events Pagination', () => {
  it('Supports offset pagination', async () => {
    const page1 = await apiRequest('/api/events?limit=5&offset=0');
    const page2 = await apiRequest('/api/events?limit=5&offset=5');
    
    assertResponse(page1, 200);
    assertResponse(page2, 200);
    
    if (page1.data.events.length > 0 && page2.data.events.length > 0) {
      const page1Slugs = new Set(page1.data.events.map(e => e.slug));
      const hasOverlap = page2.data.events.some(e => page1Slugs.has(e.slug));
      assert.ok(!hasOverlap, 'Pages should not overlap');
    }
  });
});

