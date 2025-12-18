import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPlatformStats, invalidateStatsCache } from './statsService.js';

function createStubClient(counts = {}, { failTable } = {}) {
  let selectCalls = 0;

  const makePromise = (table) => {
    selectCalls += 1;
    const result = failTable === table
      ? { count: null, error: new Error('forced failure') }
      : { count: counts[table] ?? 0, error: null };

    const promise = Promise.resolve(result);
    promise.eq = () => promise;
    return promise;
  };

  return {
    from(table) {
      return {
        select() {
          return makePromise(table);
        },
      };
    },
    getSelectCalls() {
      return selectCalls;
    },
  };
}

test('getPlatformStats returns counts and computed fields', async () => {
  invalidateStatsCache();
  const client = createStubClient({
    cars: 100,
    parts: 20,
    part_fitments: 50,
    events: 10,
    youtube_videos: 5,
    community_insights: 15,
    document_chunks: 40,
    car_recalls: 12,
    car_issues: 22,
  });

  const stats = await getPlatformStats({ clientOverride: client });

  assert.equal(stats.cars, 100);
  assert.equal(stats.parts, 20);
  assert.equal(stats.fitments, 50);
  assert.equal(stats.events, 10);
  assert.equal(stats.videos, 5);
  assert.equal(stats.insights, 15);
  assert.equal(stats.knowledgeChunks, 40);
  assert.equal(stats.recalls, 12);
  assert.equal(stats.issues, 22);
  assert.equal(stats.expertReviewedCars, 60);
  assert.ok(typeof stats.fetchedAt === 'string');
});

test('getPlatformStats caches results within TTL for the same client', async () => {
  invalidateStatsCache();
  const client = createStubClient({
    cars: 2,
    parts: 1,
    part_fitments: 1,
    events: 1,
    youtube_videos: 1,
    community_insights: 1,
    document_chunks: 1,
    car_recalls: 0,
    car_issues: 0,
  });

  const first = await getPlatformStats({ clientOverride: client });
  const callsAfterFirst = client.getSelectCalls();
  const second = await getPlatformStats({ clientOverride: client });

  assert.equal(client.getSelectCalls(), callsAfterFirst);
  assert.strictEqual(first, second);
});

test('getPlatformStats surfaces query errors', async () => {
  invalidateStatsCache();
  const client = createStubClient({}, { failTable: 'cars' });

  await assert.rejects(
    () => getPlatformStats({ clientOverride: client }),
    /Failed to count cars/
  );
});



