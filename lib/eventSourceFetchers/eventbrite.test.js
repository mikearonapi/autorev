import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeEventbriteEvent } from './eventbrite.js';

test('normalizeEventbriteEvent maps core fields (with expanded venue)', () => {
  const raw = {
    name: { text: 'Cars & Coffee Downtown' },
    description: { text: 'Morning car meet' },
    url: 'https://www.eventbrite.com/e/example',
    start: { utc: '2026-03-07T16:00:00Z', timezone: 'America/Chicago' },
    end: { utc: '2026-03-07T18:00:00Z', timezone: 'America/Chicago' },
    is_free: true,
    venue: {
      name: 'Some Lot',
      latitude: '30.2700',
      longitude: '-97.7400',
      address: {
        address_1: '123 Main St',
        city: 'Austin',
        region: 'TX',
        postal_code: '78701',
        country: 'US',
      },
    },
    logo: { url: 'https://img.example/logo.png' },
  };

  const normalized = normalizeEventbriteEvent(raw);
  assert.ok(normalized);
  assert.equal(normalized.name, 'Cars & Coffee Downtown');
  assert.equal(normalized.city, 'Austin');
  assert.equal(normalized.state, 'TX');
  assert.equal(normalized.start_date, '2026-03-07');
  assert.equal(normalized.is_free, true);
  assert.equal(normalized.source_url, 'https://www.eventbrite.com/e/example');
});


