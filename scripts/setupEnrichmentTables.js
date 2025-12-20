#!/usr/bin/env node

/**
 * Setup Enrichment Tables
 * 
 * Creates the enriched data tables via Supabase management API.
 * Then starts the enrichment process.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Tables we need
const REQUIRED_TABLES = [
  'car_fuel_economy',
  'car_safety_data',
  'car_recalls',
  'car_market_pricing',
  'car_price_history',
  'car_expert_reviews',
  'car_auction_results',
  'scrape_jobs',
  'car_manual_data',
];

async function checkTables() {
  console.log('='.repeat(60));
  console.log('Checking Enrichment Tables');
  console.log('='.repeat(60));
  
  const existing = [];
  const missing = [];
  
  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      
      if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
        missing.push(table);
        console.log(`❌ ${table} - NOT FOUND`);
      } else if (error) {
        console.log(`⚠️  ${table} - ${error.message}`);
        missing.push(table);
      } else {
        existing.push(table);
        console.log(`✅ ${table} - EXISTS`);
      }
    } catch (err) {
      missing.push(table);
      console.log(`❌ ${table} - ERROR: ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Summary: ${existing.length} existing, ${missing.length} missing`);
  console.log('='.repeat(60));
  
  return { existing, missing };
}

async function createTablesViaSql() {
  console.log('\nAttempting to create missing tables...\n');
  
  // Core tables SQL (simplified for direct execution)
  const createStatements = [
    `CREATE TABLE IF NOT EXISTS car_fuel_economy (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      car_slug VARCHAR(255) NOT NULL,
      epa_vehicle_id INTEGER,
      city_mpg DECIMAL(4,1),
      highway_mpg DECIMAL(4,1),
      combined_mpg DECIMAL(4,1),
      fuel_type VARCHAR(100),
      annual_fuel_cost INTEGER,
      co2_emissions INTEGER,
      ghg_score INTEGER,
      user_avg_mpg DECIMAL(4,1),
      user_city_mpg DECIMAL(4,1),
      user_highway_mpg DECIMAL(4,1),
      user_sample_size INTEGER,
      is_electric BOOLEAN DEFAULT FALSE,
      is_hybrid BOOLEAN DEFAULT FALSE,
      ev_range INTEGER,
      source VARCHAR(50) DEFAULT 'EPA',
      fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(car_slug)
    )`,
    
    `CREATE TABLE IF NOT EXISTS car_safety_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      car_slug VARCHAR(255) NOT NULL,
      nhtsa_overall_rating INTEGER,
      nhtsa_front_crash_rating INTEGER,
      nhtsa_side_crash_rating INTEGER,
      nhtsa_rollover_rating INTEGER,
      recall_count INTEGER DEFAULT 0,
      complaint_count INTEGER DEFAULT 0,
      investigation_count INTEGER DEFAULT 0,
      tsb_count INTEGER DEFAULT 0,
      has_open_recalls BOOLEAN DEFAULT FALSE,
      has_open_investigations BOOLEAN DEFAULT FALSE,
      iihs_overall VARCHAR(50),
      iihs_small_overlap_front VARCHAR(50),
      iihs_moderate_overlap_front VARCHAR(50),
      iihs_side VARCHAR(50),
      iihs_roof_strength VARCHAR(50),
      iihs_head_restraints VARCHAR(50),
      iihs_front_crash_prevention VARCHAR(50),
      iihs_headlight_rating VARCHAR(50),
      iihs_top_safety_pick BOOLEAN DEFAULT FALSE,
      iihs_top_safety_pick_plus BOOLEAN DEFAULT FALSE,
      safety_score INTEGER,
      safety_grade CHAR(2),
      nhtsa_fetched_at TIMESTAMP WITH TIME ZONE,
      iihs_fetched_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(car_slug)
    )`,
    
    `CREATE TABLE IF NOT EXISTS car_recalls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      car_slug VARCHAR(255) NOT NULL,
      campaign_number VARCHAR(50) NOT NULL,
      component VARCHAR(255),
      summary TEXT,
      consequence TEXT,
      remedy TEXT,
      report_received_date DATE,
      is_incomplete BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(car_slug, campaign_number)
    )`,
    
    `CREATE TABLE IF NOT EXISTS car_market_pricing (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      car_slug VARCHAR(255) NOT NULL,
      bat_avg_price INTEGER,
      bat_median_price INTEGER,
      bat_min_price INTEGER,
      bat_max_price INTEGER,
      bat_sample_size INTEGER,
      bat_sell_through_rate INTEGER,
      bat_avg_mileage INTEGER,
      bat_fetched_at TIMESTAMP WITH TIME ZONE,
      hagerty_concours INTEGER,
      hagerty_excellent INTEGER,
      hagerty_good INTEGER,
      hagerty_fair INTEGER,
      hagerty_trend VARCHAR(20),
      hagerty_trend_percent DECIMAL(5,2),
      hagerty_fetched_at TIMESTAMP WITH TIME ZONE,
      carscom_avg_price INTEGER,
      carscom_median_price INTEGER,
      carscom_min_price INTEGER,
      carscom_max_price INTEGER,
      carscom_listing_count INTEGER,
      carscom_avg_mileage INTEGER,
      carscom_fetched_at TIMESTAMP WITH TIME ZONE,
      consensus_price INTEGER,
      price_confidence VARCHAR(20),
      market_trend VARCHAR(20),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(car_slug)
    )`,
    
    `CREATE TABLE IF NOT EXISTS car_price_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      car_slug VARCHAR(255) NOT NULL,
      source VARCHAR(50) NOT NULL,
      price INTEGER NOT NULL,
      recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(car_slug, source, recorded_at)
    )`,
    
    `CREATE TABLE IF NOT EXISTS car_expert_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      car_slug VARCHAR(255) NOT NULL,
      source VARCHAR(50) NOT NULL,
      source_url TEXT,
      title VARCHAR(500),
      overall_rating DECIMAL(3,1),
      performance_rating DECIMAL(3,1),
      handling_rating DECIMAL(3,1),
      comfort_rating DECIMAL(3,1),
      interior_rating DECIMAL(3,1),
      value_rating DECIMAL(3,1),
      pros TEXT[],
      cons TEXT[],
      verdict TEXT,
      zero_to_sixty DECIMAL(4,2),
      zero_to_hundred DECIMAL(4,2),
      quarter_mile DECIMAL(4,2),
      quarter_mile_speed INTEGER,
      braking_70_to_0 INTEGER,
      skidpad_g DECIMAL(3,2),
      review_date DATE,
      review_type VARCHAR(50),
      fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(car_slug, source, source_url)
    )`,
    
    `CREATE TABLE IF NOT EXISTS car_auction_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      car_slug VARCHAR(255),
      auction_id VARCHAR(255) NOT NULL,
      source VARCHAR(50) DEFAULT 'bringatrailer',
      auction_url TEXT,
      title TEXT,
      year INTEGER,
      make VARCHAR(100),
      model VARCHAR(200),
      mileage INTEGER,
      transmission VARCHAR(50),
      sold_price INTEGER,
      high_bid INTEGER,
      sold BOOLEAN DEFAULT FALSE,
      reserve_not_met BOOLEAN DEFAULT FALSE,
      bid_count INTEGER,
      auction_end_date DATE,
      location VARCHAR(200),
      thumbnail_url TEXT,
      highlights TEXT[],
      fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(auction_id, source)
    )`,
    
    `CREATE TABLE IF NOT EXISTS scrape_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_type VARCHAR(50) NOT NULL,
      car_slug VARCHAR(255),
      status VARCHAR(20) DEFAULT 'pending',
      priority INTEGER DEFAULT 5,
      sources_attempted TEXT[],
      sources_succeeded TEXT[],
      sources_failed TEXT[],
      error_message TEXT,
      scheduled_for TIMESTAMP WITH TIME ZONE,
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      attempt_count INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      next_retry_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    `CREATE TABLE IF NOT EXISTS car_manual_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      car_slug VARCHAR(255) NOT NULL,
      data_type VARCHAR(50) NOT NULL,
      source VARCHAR(100),
      source_url TEXT,
      data JSONB NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      verified_by VARCHAR(255),
      verified_at TIMESTAMP WITH TIME ZONE,
      notes TEXT,
      entered_by VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
  ];
  
  // Try to create tables using Supabase's SQL function if available
  // Otherwise, we'll need to run manually
  for (const sql of createStatements) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    
    try {
      // Try direct SQL via the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ sql_query: sql }),
      });
      
      if (response.ok) {
        console.log(`✅ Created/verified: ${tableName}`);
      } else {
        const err = await response.text();
        if (err.includes('already exists') || err.includes('42P07')) {
          console.log(`✅ Already exists: ${tableName}`);
        } else {
          console.log(`⚠️  ${tableName}: Manual creation needed`);
        }
      }
    } catch (err) {
      console.log(`⚠️  ${tableName}: ${err.message}`);
    }
  }
}

async function main() {
  const { existing, missing } = await checkTables();
  
  if (missing.length > 0) {
    console.log('\n' + '⚠️'.repeat(30));
    console.log('\nSome tables are missing. You need to run the migration manually.');
    console.log('\nPlease do one of the following:\n');
    console.log('Option 1: Supabase Dashboard');
    console.log('  1. Go to https://supabase.com/dashboard');
    console.log('  2. Select your project');
    console.log('  3. Go to SQL Editor');
    console.log('  4. Open the file: supabase/migrations/021_enriched_car_data.sql');
    console.log('  5. Copy and paste the entire contents');
    console.log('  6. Click Run');
    console.log('\nOption 2: Supabase CLI');
    console.log('  npx supabase link --project-ref pcbkerqlfcjbnhaxjyqj');
    console.log('  npx supabase db push');
    console.log('\n' + '⚠️'.repeat(30));
    
    // Create a smaller inline migration for just the essential tables
    console.log('\n\nAttempting inline table creation...\n');
    await createTablesViaSql();
    
    // Re-check
    console.log('\n\nRe-checking tables...\n');
    await checkTables();
  }
  
  console.log('\n✅ Setup check complete!');
}

main().catch(console.error);













