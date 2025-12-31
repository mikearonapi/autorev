/**
 * Weekly Car Expansion Cron Job
 * 
 * Automatically adds new cars to the database using the AI research pipeline.
 * 
 * Strategy:
 * 1. Check a curated queue of "cars to add" (from Notion/config/database)
 * 2. If no queue, use AI to identify high-demand cars based on:
 *    - Search queries without matching cars
 *    - Popular forum discussions about cars we don't have
 *    - Competitor analysis (what cars are trending)
 * 3. Run the AI research pipeline for selected cars
 * 4. Send notification with results
 * 
 * Schedule: Weekly (Sundays at 4am UTC)
 * Max cars per run: 3-5 (configurable)
 * Duration: ~15-30 minutes per car
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyCronEnrichment, notifyCronError } from '@/lib/discord';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export const maxDuration = 300; // 5 minutes (just for discovery - actual pipeline runs separately)
export const dynamic = 'force-dynamic';

// ============================================================================
// Car Discovery Strategies
// ============================================================================

/**
 * Curated list of high-value cars to add (prioritized)
 * This list should be maintained based on user requests and market analysis
 */
const EXPANSION_QUEUE = [
  // Highly requested enthusiast cars not yet in database
  // Format: { name: 'Full Car Name', priority: 1-5, reason: 'why this car' }
  
  // JDM Icons
  { name: 'Honda S2000 AP1', priority: 5, reason: 'Highly requested JDM legend, strong forum community' },
  { name: 'Toyota Supra JZA80', priority: 5, reason: 'JDM icon, massive enthusiast following' },
  { name: 'Nissan Skyline R34 GT-R', priority: 4, reason: 'Legendary JDM, now legal for import' },
  { name: 'Mitsubishi Lancer Evolution VIII', priority: 4, reason: 'Rally legend, strong modding community' },
  { name: 'Acura NSX NA1', priority: 4, reason: 'Mid-engine Honda, appreciating classic' },
  
  // European Sports
  { name: 'Lotus Elise S2', priority: 4, reason: 'Lightweight sports car benchmark' },
  { name: 'Lotus Exige S', priority: 4, reason: 'Track-focused Lotus variant' },
  { name: 'Alfa Romeo 4C', priority: 3, reason: 'Carbon tub exotic at accessible price' },
  { name: 'Alpine A110', priority: 3, reason: 'Modern lightweight sports car' },
  
  // American Muscle Modern
  { name: 'Dodge Challenger SRT Hellcat', priority: 3, reason: 'Supercharged muscle icon' },
  { name: 'Chevrolet Camaro ZL1 1LE', priority: 3, reason: 'Track-focused muscle' },
  { name: 'Ford Mustang GT350', priority: 3, reason: 'Flat-plane crank special' },
  
  // Hot Hatches
  { name: 'Renault Megane RS Trophy', priority: 2, reason: 'FWD track record holder' },
  { name: 'Hyundai Veloster N', priority: 2, reason: 'Value performance option' },
  { name: 'Mini John Cooper Works GP', priority: 2, reason: 'Limited edition hot hatch' },
  
  // Affordable Entry
  { name: 'Hyundai Genesis Coupe 3.8', priority: 2, reason: 'Affordable RWD with V6' },
  { name: 'Infiniti G37 Coupe', priority: 2, reason: 'VQ37 sports coupe value' },
];

/**
 * Check if a car already exists in the database
 */
async function carExists(supabase, carName) {
  const searchTerms = carName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(t => t.length > 2);
  
  // Search for similar cars
  const { data } = await supabase
    .from('cars')
    .select('slug, name')
    .or(searchTerms.map(t => `name.ilike.%${t}%`).join(','))
    .limit(5);
  
  // Check for close matches
  const carNameLower = carName.toLowerCase();
  return data?.some(car => {
    const existingLower = car.name.toLowerCase();
    // Check for substantial overlap
    return searchTerms.filter(t => existingLower.includes(t)).length >= 2;
  }) || false;
}

/**
 * Get cars from the expansion queue that don't exist yet
 */
async function getQueuedCars(supabase, limit = 5) {
  const candidates = [];
  
  for (const car of EXPANSION_QUEUE) {
    if (candidates.length >= limit) break;
    
    const exists = await carExists(supabase, car.name);
    if (!exists) {
      candidates.push(car);
    }
  }
  
  // Sort by priority (highest first)
  return candidates.sort((a, b) => b.priority - a.priority);
}

/**
 * Use AI to identify high-demand cars based on search patterns
 * (This would analyze search logs, AL conversations, etc.)
 */
async function discoverDemandedCars(supabase) {
  // Query AL conversations for unmatched car references
  const { data: conversations } = await supabase
    .from('al_conversations')
    .select('user_message')
    .is('car_id', null) // Conversations without a matched car
    .gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(100);
  
  if (!conversations?.length) return [];
  
  // Extract car mentions from messages (simple pattern matching)
  const carMentions = new Map();
  const carPatterns = [
    /(?:looking for|want|need|buying|considering)\s+(?:a\s+)?(\d{4})?\s*([a-z]+\s+[a-z0-9\s]+?)(?:\?|$|\.)/gi,
    /(?:how about|what about|is the)\s+([a-z]+\s+[a-z0-9\s]+?)(?:\?|$|\.)/gi,
    /([a-z]+)\s+(s2000|supra|nsx|gtr?|evo|sti|wrx|miata|86|brz|z|350z|370z|g35|g37)/gi,
  ];
  
  for (const conv of conversations) {
    const msg = conv.user_message || '';
    for (const pattern of carPatterns) {
      const matches = msg.matchAll(pattern);
      for (const match of matches) {
        const carRef = (match[2] || match[1] || '').trim().toLowerCase();
        if (carRef.length > 3) {
          carMentions.set(carRef, (carMentions.get(carRef) || 0) + 1);
        }
      }
    }
  }
  
  // Return top mentioned cars that might not exist
  return Array.from(carMentions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, mentions: count, source: 'al_conversations' }));
}

/**
 * GET handler for cron job
 */
export async function GET(request) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const maxCars = parseInt(url.searchParams.get('max') || '3');
  const dryRun = url.searchParams.get('dryRun') === 'true';
  
  // Auth check
  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-vercel-cron');
  
  if (!cronHeader && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const results = {
    carsDiscovered: [],
    carsQueued: [],
    demandSignals: [],
    queuedForPipeline: [],
    dryRun
  };

  try {
    console.log('[WeeklyCarExpansion] Starting car discovery...');
    console.log(`   Max cars: ${maxCars}, Dry run: ${dryRun}`);

    // ============================================
    // STEP 1: Get cars from curated queue
    // ============================================
    console.log('\n[WeeklyCarExpansion] Step 1: Checking expansion queue...');
    
    const queuedCars = await getQueuedCars(supabase, maxCars);
    results.carsDiscovered = queuedCars;
    
    console.log(`   Found ${queuedCars.length} cars from queue that don't exist yet`);
    for (const car of queuedCars) {
      console.log(`   • ${car.name} (priority: ${car.priority}) - ${car.reason}`);
    }

    // ============================================
    // STEP 2: Check demand signals (AL conversations)
    // ============================================
    console.log('\n[WeeklyCarExpansion] Step 2: Analyzing demand signals...');
    
    const demandedCars = await discoverDemandedCars(supabase);
    results.demandSignals = demandedCars.slice(0, 5);
    
    if (demandedCars.length > 0) {
      console.log(`   Top demanded cars from AL conversations:`);
      for (const car of demandedCars.slice(0, 5)) {
        console.log(`   • "${car.name}" (${car.mentions} mentions)`);
      }
    }

    // ============================================
    // STEP 3: Queue cars for pipeline (or log in dry run)
    // ============================================
    console.log('\n[WeeklyCarExpansion] Step 3: Queuing for pipeline...');
    
    const carsToAdd = queuedCars.slice(0, maxCars);
    
    if (!dryRun && carsToAdd.length > 0) {
      // Create pipeline queue entries
      for (const car of carsToAdd) {
        // Check if already queued
        const { data: existing } = await supabase
          .from('scrape_jobs')
          .select('id')
          .eq('job_type', 'car_pipeline')
          .eq('job_payload->>car_name', car.name)
          .eq('status', 'pending')
          .maybeSingle();
        
        if (!existing) {
          const { error } = await supabase
            .from('scrape_jobs')
            .insert({
              job_type: 'car_pipeline',
              source_id: null,
              priority: car.priority,
              status: 'pending',
              job_payload: {
                car_name: car.name,
                priority: car.priority,
                reason: car.reason,
                source: 'weekly_expansion',
                queued_at: new Date().toISOString()
              }
            });
          
          if (!error) {
            results.queuedForPipeline.push(car.name);
            console.log(`   ✓ Queued: ${car.name}`);
          } else {
            console.log(`   ✗ Failed to queue: ${car.name} - ${error.message}`);
          }
        } else {
          console.log(`   → Already queued: ${car.name}`);
        }
      }
    } else if (dryRun) {
      console.log('   [DRY RUN] Would queue these cars:');
      for (const car of carsToAdd) {
        console.log(`   • ${car.name}`);
        results.queuedForPipeline.push(car.name);
      }
    }

    // ============================================
    // STEP 4: Summary and notification
    // ============================================
    const duration = Date.now() - startTime;
    
    console.log('\n[WeeklyCarExpansion] Complete!');
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Cars queued: ${results.queuedForPipeline.length}`);

    // Send Discord notification
    if (results.queuedForPipeline.length > 0 || results.demandSignals.length > 0) {
      notifyCronEnrichment('Weekly Car Expansion Discovery', {
        duration,
        table: 'scrape_jobs',
        recordsAdded: results.queuedForPipeline.length,
        recordsProcessed: results.carsDiscovered.length,
        details: [
          { label: '🚗 Cars Discovered', value: results.carsDiscovered.length },
          { label: '📋 Queued for Pipeline', value: results.queuedForPipeline.length },
          { label: '📊 Demand Signals', value: results.demandSignals.length },
          { label: '🧪 Dry Run', value: dryRun ? 'Yes' : 'No' },
        ],
        notes: results.queuedForPipeline.length > 0 
          ? `Queued cars:\n${results.queuedForPipeline.map(c => `• ${c}`).join('\n')}`
          : undefined
      });
    }

    return NextResponse.json({
      success: true,
      duration,
      results,
      message: dryRun 
        ? 'Discovery complete (dry run - no changes made)'
        : `Queued ${results.queuedForPipeline.length} cars for pipeline`
    });

  } catch (error) {
    console.error('[WeeklyCarExpansion] Fatal error:', error);
    
    notifyCronError('weekly-car-expansion', error.message, {
      partialResults: results,
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      success: false,
      error: error.message,
      partialResults: results
    }, { status: 500 });
  }
}

