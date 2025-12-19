#!/usr/bin/env node
/**
 * Master Event Expansion Runner
 * 
 * Runs all expansion seeders in the correct order.
 * 
 * Usage: node scripts/events/run-expansion.js
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

const seeders = [
  { name: 'Verified 2026 Events', path: 'scripts/events/seeders/seed-verified-2026.js' },
  { name: 'Missing Major Events', path: 'scripts/events/seeders/seed-missing-major.js' },
  { name: 'Expansion Events Part 1', path: 'scripts/events/seeders/seed-expansion.js' },
  { name: 'Major Expansion (Goodguys, NHRA, etc)', path: 'scripts/events/data/major-expansion-2026.json', inline: true },
  { name: 'Specialty Expansion', path: 'scripts/events/data/specialty-expansion-2026.json', inline: true },
];

function runSeeder(name, scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🚀 Running: ${name}`);
    console.log(`${'═'.repeat(60)}\n`);

    const child = spawn('node', [scriptPath], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env }
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${name} completed successfully`);
        resolve();
      } else {
        console.error(`\n❌ ${name} failed with code ${code}`);
        resolve(); // Continue with next seeder
      }
    });

    child.on('error', (err) => {
      console.error(`\n❌ ${name} error:`, err.message);
      resolve(); // Continue with next seeder
    });
  });
}

async function main() {
  console.log('═'.repeat(60));
  console.log('    AUTOREV EVENT EXPANSION MASTER RUNNER');
  console.log('═'.repeat(60));
  console.log(`\nWill run ${seeders.filter(s => !s.inline).length} seeders\n`);

  for (const seeder of seeders) {
    if (!seeder.inline) {
      await runSeeder(seeder.name, join(projectRoot, seeder.path));
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('    ALL SEEDERS COMPLETED');
  console.log('═'.repeat(60));
}

main().catch(console.error);

