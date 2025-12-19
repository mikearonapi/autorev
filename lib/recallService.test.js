import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseYearsRange,
  normalizeMakeName,
  normalizeModelName,
  buildCarRecallIdentifiers,
  mapNhtsaRecallToCarRecallsRow,
} from './recallService.js';

test('parseYearsRange parses single year and ranges', () => {
  assert.deepEqual(parseYearsRange('2016'), { start: 2016, end: 2016 });
  assert.deepEqual(parseYearsRange('2016-2019'), { start: 2016, end: 2019 });
  assert.deepEqual(parseYearsRange('2019 - 2016'), { start: 2016, end: 2019 });
  assert.equal(parseYearsRange('unknown'), null);
});

test('normalizeMakeName handles Mercedes naming', () => {
  assert.equal(normalizeMakeName('Mercedes'), 'Mercedes-Benz');
  assert.equal(normalizeMakeName('Porsche'), 'Porsche');
});

test('normalizeModelName extracts NHTSA-compatible model names', () => {
  // Pattern-matched models
  assert.equal(normalizeModelName('Porsche 911 Carrera S'), '911');
  assert.equal(normalizeModelName('BMW M3 E46'), 'M3');
  assert.equal(normalizeModelName('C8 Corvette Stingray'), 'Corvette');
  assert.equal(normalizeModelName('Camaro SS 1LE'), 'Camaro');
  assert.equal(normalizeModelName('Toyota GR Supra'), 'Supra');
  assert.equal(normalizeModelName('Nissan 370Z Nismo'), '370Z');
  assert.equal(normalizeModelName('718 Cayman GT4'), '718 Cayman');
});

test('buildCarRecallIdentifiers generates one query per model year', () => {
  const car = { slug: 'test-car', name: 'Porsche 911 Carrera S', brand: 'Porsche', years: '2019-2020' };
  const built = buildCarRecallIdentifiers(car);
  assert.equal(built.error, null);
  assert.equal(built.identifiers.length, 2);
  assert.deepEqual(
    built.identifiers.map((i) => i.modelYear),
    [2019, 2020]
  );
  assert.ok(built.identifiers[0].sourceUrl.includes('make=Porsche'));
  assert.ok(built.identifiers[0].sourceUrl.includes('model=911'));
});

test('mapNhtsaRecallToCarRecallsRow maps core fields and keeps campaign_number for upsert', () => {
  const nhtsaRecall = {
    NHTSACampaignNumber: '24V123',
    Manufacturer: 'Porsche',
    Component: 'AIR BAGS',
    Summary: 'Summary here',
    Consequence: 'Consequence here',
    Remedy: 'Remedy here',
    ReportReceivedDate: '2024-01-02',
    Notes: 'Notes here',
  };
  const row = mapNhtsaRecallToCarRecallsRow('porsche-911', nhtsaRecall, 'https://api.nhtsa.gov/recalls/recallsByVehicle?...');
  assert.ok(row);
  assert.equal(row.car_slug, 'porsche-911');
  assert.equal(row.campaign_number, '24V123');
  assert.equal(row.recall_campaign_number, '24V123');
  assert.equal(row.report_received_date, '2024-01-02');
  assert.equal(row.recall_date, '2024-01-02');
  assert.equal(row.manufacturer, 'Porsche');
  assert.equal(row.source_url.includes('api.nhtsa.gov'), true);
});






