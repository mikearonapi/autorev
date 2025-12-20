import test from 'node:test';
import assert from 'node:assert/strict';

import { parseTribeEventsListHtml } from './carsandcoffeeevents.js';

test('parseTribeEventsListHtml extracts event name/url/date/city', () => {
  const html = `
    <div class="tribe-events-calendar-list__event" data-tribe-event-date-start="2026-05-02T12:00:00Z">
      <h3 class="tribe-events-calendar-list__event-title">
        <a class="tribe-events-calendar-list__event-title-link" href="/event/cars-coffee-test/">Cars & Coffee Test</a>
      </h3>
      <div class="tribe-events-calendar-list__event-venue">
        <span class="tribe-events-calendar-list__event-venue-address">Austin, TX</span>
      </div>
    </div>
  `;

  const events = parseTribeEventsListHtml(html, 'https://carsandcoffeeevents.com/');
  assert.equal(events.length, 1);
  assert.equal(events[0].name, 'Cars & Coffee Test');
  assert.equal(events[0].start_date, '2026-05-02');
  assert.equal(events[0].city, 'Austin');
  assert.equal(events[0].state, 'TX');
  assert.ok(events[0].source_url.includes('carsandcoffeeevents.com/event/cars-coffee-test'));
});












