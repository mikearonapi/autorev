#!/usr/bin/env node
/**
 * Test script for event refresh pipeline
 * 
 * Usage:
 *   node scripts/test-events-refresh.js                    # Diagnostic mode
 *   node scripts/test-events-refresh.js --source=MotorsportReg --limit=5 --dryRun
 *   node scripts/test-events-refresh.js --all --limit=10 --dryRun
 *   node scripts/test-events-refresh.js --source=CarsAndCoffeeEvents --limit=3
 * 
 * Options:
 *   --source=NAME   Test a specific source (by name in event_sources table)
 *   --all           Test all active sources
 *   --limit=N       Max events per source (default: 10)
 *   --dryRun        Don't write to database
 *   --diagnostic    Just show config status (default if no other args)
 * 
 * Requires:
 *   - .env.local with SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { fetchFromSource, getFetcher } from '../lib/eventSourceFetchers/index.js';

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const sourceName = getArg('source');
const limit = parseInt(getArg('limit') || '10', 10);
const dryRun = hasFlag('dryRun');
const runAll = hasFlag('all');
const diagnosticOnly = hasFlag('diagnostic') || (!sourceName && !runAll);

// Check env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔧 Events Refresh Test Script\n');
console.log('═'.repeat(60));

// Diagnostic check
console.log('\n📋 Configuration Status:\n');
console.log(`  NEXT_PUBLIC_SUPABASE_URL:     ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY:    ${supabaseServiceRoleKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('\n❌ Missing required environment variables. Create .env.local with:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// List available fetchers
console.log('\n📦 Available Fetchers:\n');
const availableFetchers = [
  'motorsportreg', 'scca', 'pca', 'eventbrite', 'eventbritesearch',
  'carsandcoffeeevents', 'facebookevents', 'rideology', 'trackvenue', 'ical'
];
availableFetchers.forEach(f => console.log(`  • ${f}`));

// Fetch and display sources
console.log('\n📊 Event Sources in Database:\n');

const { data: sources, error: sourcesErr } = await supabase
  .from('event_sources')
  .select('id, name, source_type, is_active, last_run_at, last_run_status, last_run_events')
  .order('is_active', { ascending: false })
  .order('name', { ascending: true });

if (sourcesErr) {
  console.error('❌ Failed to fetch sources:', sourcesErr.message);
  process.exit(1);
}

const maxNameLen = Math.max(...sources.map(s => s.name.length));
console.log(`  ${'Name'.padEnd(maxNameLen)} | Active | Fetcher | Last Run`);
console.log(`  ${'-'.repeat(maxNameLen)}-|--------|---------|----------`);

for (const source of sources) {
  const normalizedName = source.name.toLowerCase().replace(/[^a-z]/g, '');
  const hasFetcher = Boolean(getFetcher(source.name));
  const activeIcon = source.is_active ? '✅' : '❌';
  const fetcherIcon = hasFetcher ? '✅' : '⚠️ ';
  const lastRun = source.last_run_at 
    ? new Date(source.last_run_at).toISOString().slice(0, 16).replace('T', ' ')
    : 'Never';
  
  console.log(`  ${source.name.padEnd(maxNameLen)} | ${activeIcon}     | ${fetcherIcon}      | ${lastRun}`);
  
  if (!hasFetcher && source.is_active) {
    console.log(`      ⚠️  No fetcher for normalized name: "${normalizedName}"`);
  }
}

if (diagnosticOnly) {
  console.log('\n✅ Diagnostic complete. Use --source=NAME or --all to test fetching.\n');
  process.exit(0);
}

// Test fetching
console.log('\n' + '═'.repeat(60));
console.log('\n🚀 Testing Event Fetchers\n');

const sourcesToTest = runAll 
  ? sources.filter(s => s.is_active)
  : sources.filter(s => s.name.toLowerCase().includes(sourceName.toLowerCase()));

if (sourcesToTest.length === 0) {
  console.error(`❌ No sources found matching "${sourceName}"`);
  process.exit(1);
}

console.log(`Testing ${sourcesToTest.length} source(s) with limit=${limit}, dryRun=${dryRun}\n`);

for (const source of sourcesToTest) {
  console.log(`\n📡 Testing: ${source.name}`);
  console.log('-'.repeat(40));
  
  const fetcher = getFetcher(source.name);
  if (!fetcher) {
    console.log(`  ⚠️  No fetcher implemented for this source`);
    continue;
  }
  
  const startTime = Date.now();
  
  try {
    const { events, errors } = await fetchFromSource(source, { 
      limit, 
      dryRun: true // Always dry run the fetcher (don't affect source sites)
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`  ✅ Fetched ${events.length} events in ${duration}ms`);
    
    if (errors.length > 0) {
      console.log(`  ⚠️  Errors: ${errors.length}`);
      errors.slice(0, 3).forEach(e => console.log(`      - ${e}`));
    }
    
    if (events.length > 0) {
      console.log(`\n  Sample events:`);
      events.slice(0, 3).forEach((e, i) => {
        console.log(`    ${i + 1}. ${e.name}`);
        console.log(`       📅 ${e.start_date} | 📍 ${e.city}, ${e.state}`);
        console.log(`       🔗 ${e.source_url?.slice(0, 60)}...`);
      });
    }
    
    // Update last_run_at if not dry run
    if (!dryRun && events.length > 0) {
      console.log(`\n  💾 Updating source last_run_at...`);
      const { error: updateErr } = await supabase
        .from('event_sources')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: errors.length > 0 ? 'partial' : 'success',
          last_run_events: events.length,
        })
        .eq('id', source.id);
      
      if (updateErr) {
        console.log(`  ❌ Failed to update source: ${updateErr.message}`);
      } else {
        console.log(`  ✅ Source updated`);
      }
    }
    
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }
}

console.log('\n' + '═'.repeat(60));
console.log('\n✅ Test complete!\n');

if (dryRun) {
  console.log('ℹ️  This was a dry run. No changes were made to the database.');
  console.log('   Remove --dryRun to actually update source timestamps.\n');
}

