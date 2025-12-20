#!/usr/bin/env node
/**
 * Smoke test for scripts/generateSeedMultiBrandMigration.mjs
 *
 * We don't execute DB migrations here; we just validate that the generator:
 * - produces SQL
 * - includes expected sections / INSERT shapes
 * - generates at least 5 parts + fitments per car in a small sample
 *
 * Usage:
 *   node scripts/testGenerateSeedMultiBrandMigration.mjs
 */
import assert from 'node:assert/strict';
import { buildMigrationSql, ZERO_FITMENT_CARS } from './generateSeedMultiBrandMigration.mjs';

function countOccurrences(haystack, needle) {
  let idx = 0;
  let count = 0;
  while (true) {
    idx = haystack.indexOf(needle, idx);
    if (idx === -1) return count;
    count++;
    idx += needle.length;
  }
}

function run() {
  // Use a sample we know has platform_tags + patterns today.
  const sample = ZERO_FITMENT_CARS.filter((c) => ['bmw-m3-e46', '718-cayman-gt4'].includes(c.slug));

  const sql = buildMigrationSql({ cars: sample, allowUnmatched: false });

  assert.ok(sql.includes('-- Migration 040: Seed Multi-Brand Parts + Fitments'));
  assert.ok(sql.includes('-- PARTS'));
  assert.ok(sql.includes('-- FITMENTS'));
  assert.ok(sql.includes('INSERT INTO parts'));
  assert.ok(sql.includes('INSERT INTO part_fitments'));
  assert.ok(sql.includes('ON CONFLICT (brand_name, part_number) DO NOTHING;'));
  assert.ok(sql.includes('ON CONFLICT DO NOTHING;'));

  // Each car should yield 5 parts -> 5 parts INSERTs and 5 fitments INSERTs
  // (per car): intake, exhaust, suspension, brakes, tune/alt-suspension
  const partsInserts = countOccurrences(sql, 'INSERT INTO parts');
  const fitmentInserts = countOccurrences(sql, 'INSERT INTO part_fitments');

  assert.equal(partsInserts, sample.length * 5);
  assert.equal(fitmentInserts, sample.length * 5);

  console.log('OK: seed migration generator test passed');
}

try {
  run();
} catch (err) {
  console.error(err?.stack || String(err));
  process.exit(1);
}













