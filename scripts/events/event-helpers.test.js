import assert from 'node:assert';
import {
  buildEventSlug,
  mapRegion,
  generateRecurringDates,
} from './lib/event-helpers.js';

// buildEventSlug should include date to keep recurring events unique
{
  const slug = buildEventSlug('Cars & Coffee Test', 'Austin', '2026-02-01');
  assert.strictEqual(slug, 'cars-coffee-test-austin-2026-02-01');
}

// mapRegion should bucket states correctly and return null for non-US
{
  assert.strictEqual(mapRegion('CA'), 'West');
  assert.strictEqual(mapRegion('TX'), 'Southwest');
  assert.strictEqual(mapRegion('NY'), 'Northeast');
  assert.strictEqual(mapRegion('FL'), 'Southeast');
  assert.strictEqual(mapRegion('OH'), 'Midwest');
  assert.strictEqual(mapRegion('UK'), null);
}

// generateRecurringDates for monthly nth weekday
{
  const dates = generateRecurringDates('1st Saturday monthly (Apr-Oct)', 2026);
  assert.strictEqual(dates[0], '2026-04-04');
  assert.strictEqual(dates.at(-1), '2026-10-03');
  assert.strictEqual(dates.length, 7);
}

// generateRecurringDates for weekly constrained months
{
  const dates = generateRecurringDates('Every Saturday (May-Oct)', 2026);
  assert.strictEqual(dates[0], '2026-05-02');
  assert.strictEqual(dates.at(-1), '2026-10-31');
  // 6 months of Saturdays in 2026 (5 + 4 + 4 + 5 + 4 + 5 = 27)
  assert.strictEqual(dates.length, 27);
}







