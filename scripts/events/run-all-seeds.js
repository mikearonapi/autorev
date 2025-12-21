#!/usr/bin/env node
/**
 * Master runner for all event seeders
 * Runs each seeder in sequence to populate the events database
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const seeds = [
    // Core major events first
    { name: 'Auctions', path: './seed-auctions-2026.js' },
    { name: 'Major Events', path: './seed-major-events-2026.js' },
    
    // Category seeders from data files
    { name: 'Industry Events', path: './seeders/seed-industry-events.js' },
    { name: 'Time Attack', path: './seeders/seed-time-attack.js' },
    { name: 'Car Shows', path: './seeders/seed-car-shows.js' },
    { name: 'Club Events', path: './seeders/seed-club-events.js' },
    { name: 'Track Days', path: './seeders/seed-track-days.js' },
    { name: 'Autocross', path: './seeders/seed-autocross.js' },
    
    // Recurring events last (generates many records)
    { name: 'Cars & Coffee Base', path: './seed-cars-and-coffee.js' },
    { name: 'Cars & Coffee Expansion', path: './seeders/seed-cc-expansion.js' },
  ];

  console.log('🚀 Running all event seeders...\n');
  console.log('━'.repeat(50));

  for (const seed of seeds) {
    const resolved = path.resolve(__dirname, seed.path);
    console.log(`\n▶️  Running ${seed.name}...`);
    console.log('─'.repeat(40));
    
    try {
      await import(resolved);
      console.log(`\n✅ ${seed.name} completed`);
    } catch (err) {
      console.error(`\n❌ ${seed.name} failed:`, err.message);
      // Continue with other seeds even if one fails
    }
    
    console.log('━'.repeat(50));
  }

  console.log('\n🏁 All event seeds completed.');
}

run().catch((err) => {
  console.error('❌ run-all-seeds failed:', err);
  process.exit(1);
});









