import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { carData } from '../data/cars.js';

function loadMappings() {
  return JSON.parse(readFileSync(new URL('./platform-mappings.json', import.meta.url), 'utf8'));
}

test('platform-mappings.json covers all car slugs uniquely', () => {
  const mappings = loadMappings();
  assert.ok(Array.isArray(mappings.platforms), 'platforms must be an array');

  const carSlugs = carData.map(c => c.slug);
  assert.equal(new Set(carSlugs).size, carSlugs.length, 'carData slugs must be unique');

  const mapped = mappings.platforms.flatMap(p => p.cars);
  assert.equal(mapped.length, carSlugs.length, `mapped slugs count must equal car count (expected ${carSlugs.length}, got ${mapped.length})`);
  assert.equal(new Set(mapped).size, mapped.length, 'mapped slugs must be unique');

  const carSet = new Set(carSlugs);
  const mappedSet = new Set(mapped);

  const missing = carSlugs.filter(s => !mappedSet.has(s));
  const extra = mapped.filter(s => !carSet.has(s));

  assert.deepEqual(missing, [], `missing slugs: ${missing.join(', ')}`);
  assert.deepEqual(extra, [], `extra slugs: ${extra.join(', ')}`);
});

test('each platform has at least one reference vehicle', () => {
  const mappings = loadMappings();

  for (const p of mappings.platforms) {
    assert.ok(p.id, 'platform id required');
    assert.ok(Array.isArray(p.cars) && p.cars.length > 0, `platform ${p.id} must have cars`);
    assert.ok(
      Array.isArray(p.referenceVehicles) && p.referenceVehicles.length > 0,
      `platform ${p.id} must have referenceVehicles`
    );

    const hasAnySource = p.referenceVehicles.some(r => r?.nhtsa || r?.carComplaintsModelUrl);
    assert.ok(hasAnySource, `platform ${p.id} must have nhtsa or carComplaints reference`);
  }
});

test('at least one platform includes CarComplaints sourcing', () => {
  const mappings = loadMappings();
  const hasCc = mappings.platforms.some(p => (p.referenceVehicles || []).some(r => r?.carComplaintsModelUrl));
  assert.ok(hasCc, 'expected at least one carComplaintsModelUrl');
});













