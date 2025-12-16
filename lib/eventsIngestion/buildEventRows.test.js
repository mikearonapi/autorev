import test from 'node:test';
import assert from 'node:assert/strict';

import { buildEventRows } from './buildEventRows.js';

test('buildEventRows stamps provenance + verification for ingested events', () => {
  const eventTypeIdBySlug = new Map([
    ['cars-and-coffee', 'type-cnc'],
    ['other', 'type-other'],
  ]);

  const rows = buildEventRows({
    events: [
      {
        name: 'Cars & Coffee Example',
        description: 'Test',
        event_type_slug: 'cars-and-coffee',
        start_date: '2026-01-01',
        city: 'Austin',
        state: 'TX',
        scope: 'local',
        source_url: 'https://carsandcoffeeevents.com/event/example/',
        is_free: true,
      },
    ],
    source: { id: 'source-uuid', name: 'CarsAndCoffeeEvents' },
    eventTypeIdBySlug,
    otherTypeId: 'type-other',
    existingSlugs: new Set(),
    existingSlugByConflictKey: new Map(),
    verifiedAtIso: '2025-12-16T00:00:00.000Z',
    scrapeJobId: 'job-uuid',
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].source_name, 'CarsAndCoffeeEvents');
  assert.equal(rows[0].ingested_source_id, 'source-uuid');
  assert.equal(rows[0].ingested_by_job_id, 'job-uuid');
  assert.equal(rows[0].approved_at, '2025-12-16T00:00:00.000Z');
  assert.equal(rows[0].last_verified_at, '2025-12-16T00:00:00.000Z');
  assert.equal(rows[0].status, 'approved');
});


