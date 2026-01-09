/**
 * Community Builds Integration Tests
 * 
 * Tests the community builds functionality including:
 * - Most viewed builds sorting
 * - Latest builds listing
 * - Build detail retrieval
 * 
 * Preconditions:
 * - Dev server running
 * - community_posts table has approved published builds
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, assertArrayItems, waitForServer, BASE_URL } from './test-helpers.js';

describe('Community Builds', () => {
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    try {
      await waitForServer(10000, 500);
      console.log('Server is ready');
    } catch (err) {
      console.log('Server not available, tests may fail:', err.message);
    }
  });

  describe('GET /api/community/builds', () => {
    it('returns builds list with required fields', async () => {
      const response = await apiRequest('/api/community/builds?limit=10');
      
      // Should return 200 with builds array
      assertResponse(response, 200, ['builds']);
      
      if (response.data.builds.length > 0) {
        // Check each build has required fields
        assertArrayItems(response.data.builds, [
          'id',
          'slug',
          'title',
          'view_count',
        ], 1);
        console.log(`Found ${response.data.builds.length} builds`);
      } else {
        console.log('No builds in database (empty table is ok)');
      }
    });

    it('returns builds sorted by view_count when sort=popular', async () => {
      const response = await apiRequest('/api/community/builds?sort=popular&limit=20');
      
      assertResponse(response, 200, ['builds']);
      
      const builds = response.data.builds;
      if (builds.length >= 2) {
        // Verify descending order by view_count
        for (let i = 0; i < builds.length - 1; i++) {
          const currentViews = builds[i].view_count || 0;
          const nextViews = builds[i + 1].view_count || 0;
          
          assert.ok(
            currentViews >= nextViews,
            `Builds not sorted by view_count: index ${i} has ${currentViews} views, ` +
            `index ${i + 1} has ${nextViews} views`
          );
        }
        console.log(`Verified ${builds.length} builds are sorted by view_count DESC`);
      } else {
        console.log('Not enough builds to verify sort order');
      }
    });

    it('returns builds sorted by published_at when sort=latest', async () => {
      const response = await apiRequest('/api/community/builds?sort=latest&limit=20');
      
      assertResponse(response, 200, ['builds']);
      
      const builds = response.data.builds;
      if (builds.length >= 2) {
        // Verify descending order by published_at
        for (let i = 0; i < builds.length - 1; i++) {
          const currentDate = new Date(builds[i].published_at);
          const nextDate = new Date(builds[i + 1].published_at);
          
          assert.ok(
            currentDate >= nextDate,
            `Builds not sorted by published_at: index ${i} is ${builds[i].published_at}, ` +
            `index ${i + 1} is ${builds[i + 1].published_at}`
          );
        }
        console.log(`Verified ${builds.length} builds are sorted by published_at DESC`);
      } else {
        console.log('Not enough builds to verify sort order');
      }
    });

    it('respects limit parameter', async () => {
      const limit = 5;
      const response = await apiRequest(`/api/community/builds?limit=${limit}`);
      
      assertResponse(response, 200, ['builds']);
      assert.ok(
        response.data.builds.length <= limit,
        `Expected at most ${limit} builds, got ${response.data.builds.length}`
      );
    });
  });

  describe('Most Viewed Builds Consistency', () => {
    it('should return consistent results regardless of limit', async () => {
      // This test verifies the fix for the bug where different limits
      // would return different "most viewed" results because sorting
      // was happening client-side after the limit was applied.
      
      const [response6, response12] = await Promise.all([
        apiRequest('/api/community/builds?sort=popular&limit=6'),
        apiRequest('/api/community/builds?sort=popular&limit=12'),
      ]);
      
      assertResponse(response6, 200, ['builds']);
      assertResponse(response12, 200, ['builds']);
      
      const builds6 = response6.data.builds;
      const builds12 = response12.data.builds;
      
      // The first 6 builds should be the same in both responses
      // (both sorted by view_count DESC at the database level)
      const minLength = Math.min(builds6.length, 6, builds12.length);
      
      if (minLength >= 2) {
        for (let i = 0; i < minLength; i++) {
          assert.strictEqual(
            builds6[i]?.slug,
            builds12[i]?.slug,
            `Build at index ${i} differs between limit=6 and limit=12: ` +
            `"${builds6[i]?.slug}" vs "${builds12[i]?.slug}"`
          );
        }
        console.log(`Verified ${minLength} builds are consistent between limit=6 and limit=12`);
      } else {
        console.log('Not enough builds to verify consistency');
      }
    });
  });
});
