import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchFacebookEvents } from './facebookEvents.js';

test('fetchFacebookEvents returns config error when no curated URLs provided', async () => {
  const res = await fetchFacebookEvents({ scrape_config: {} }, { dryRun: false, limit: 5 });
  assert.equal(Array.isArray(res.events), true);
  assert.equal(res.events.length, 0);
  assert.ok(res.errors.some((e) => e.includes('eventUrls')));
});











