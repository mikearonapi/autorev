#!/usr/bin/env node
/**
 * Tuning Shop Enhancement Pipeline - Step 4: Create/Update Profile
 * 
 * Creates or updates a car_tuning_profiles entry by merging:
 * - Mined database data (YouTube insights, existing issues, parts)
 * - Research document data
 * - External research (tuner websites, forums)
 * 
 * Usage:
 *   node scripts/tuning-pipeline/create-profile.mjs --car-slug ford-f150-thirteenth --engine "3.5L EcoBoost"
 *   node scripts/tuning-pipeline/create-profile.mjs --car-slug jeep-wrangler-jl --focus off-road
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import { readFileSync } from 'fs';
import { mineDatabase } from './mine-database.mjs';
import { analyzeGaps } from './analyze-gaps.mjs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const PIPELINE_VERSION = '1.1.0'; // Updated to write upgrades_by_objective as source of truth

/**
 * Research data for top 30 vehicles extracted from research document
 * This is a subset - in production, this would be loaded from the research file
 */
const RESEARCH_DATA = {
  // Ford F-150
  'ford-f150': {
    variants: [
      {
        engineFamily: '3.5L EcoBoost',
        tuningFocus: 'performance',
        stockWhp: 350, // ~375 crank HP
        stockWtq: 420, // ~470 crank TQ
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['Tune only (91/93 oct)'], hpGainLow: 60, hpGainHigh: 100, torqueGainLow: 80, torqueGainHigh: 120, costLow: 400, costHigh: 600, requirements: ['Premium fuel'], notes: 'Safe for daily driving, no hardware required' },
          { stage: 'Stage 2', key: 'stage2', components: ['Tune', 'Cold air intake', 'Downpipes', 'Upgraded intercooler'], hpGainLow: 120, hpGainHigh: 150, torqueGainLow: 150, torqueGainHigh: 180, costLow: 1500, costHigh: 2500, requirements: ['91+ octane', 'Stage 1 tune'], notes: 'Significant gains, still reliable for daily use' },
          { stage: 'Stage 3+', key: 'stage3', components: ['Turbo upgrade', 'Larger intercooler', 'Fuel system upgrades', 'E85 conversion'], hpGainLow: 200, hpGainHigh: 300, torqueGainLow: 250, torqueGainHigh: 350, costLow: 5000, costHigh: 10000, requirements: ['Built transmission recommended', 'Professional tuning'], notes: 'Beyond stock turbo capability' }
        ],
        tuningPlatforms: [
          { name: 'SCT', priceLow: 400, priceHigh: 500, notes: 'Popular choice, good pre-loaded maps', url: 'https://sctflash.com' },
          { name: 'HP Tuners', priceLow: 700, priceHigh: 1000, notes: 'Pro-level, custom tune capability', url: 'https://hptuners.com' },
          { name: 'COBB Accessport', priceLow: 650, priceHigh: 750, notes: 'Best for 3.5L EcoBoost, OTS and pro-tune support', url: 'https://cobbtuning.com' },
          { name: '5 Star Tuning/MPT', priceLow: 300, priceHigh: 500, notes: 'Custom mail-order tunes, great value', url: 'https://5startuning.com' },
          { name: 'Livernois', priceLow: 600, priceHigh: 800, notes: 'Solid reputation for Ford platforms', url: 'https://livernoismotorsports.com' }
        ],
        powerLimits: {
          stockTurbo: { whp: 500, notes: 'Safe limit for stock twin turbos' },
          stockFuelSystem: { whp: 450, notes: 'Stock HPFP becomes limiting factor' },
          stockTransmission: { hp: 600, notes: '10R80 reliable to ~600 HP with proper care' }
        },
        brandRecommendations: {
          intakes: ['S&B Filters', 'AFE Power', 'K&N', 'Airaid', 'Roush'],
          exhausts: ['Borla', 'MBRP', 'Magnaflow', 'Flowmaster', 'Corsa'],
          intercoolers: ['CVF', 'Mishimoto', 'Full-Race', 'Levels Performance'],
          tuners: ['5 Star Tuning', 'MPT', 'Unleashed Tuning', 'VR Tuned']
        }
      },
      {
        engineFamily: '5.0L Coyote',
        tuningFocus: 'performance',
        stockWhp: 395, // ~460 crank HP
        stockWtq: 380, // ~420 crank TQ
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['Tune only'], hpGainLow: 20, hpGainHigh: 35, torqueGainLow: 20, torqueGainHigh: 30, costLow: 400, costHigh: 600, requirements: ['Premium fuel recommended'], notes: 'NA engine has limited tune gains' },
          { stage: 'Stage 2', key: 'stage2', components: ['Tune', 'Cold air intake', 'Cat-back exhaust'], hpGainLow: 40, hpGainHigh: 60, torqueGainLow: 40, torqueGainHigh: 55, costLow: 1500, costHigh: 2500, requirements: ['Quality intake and exhaust'], notes: 'Headers add more but require emissions considerations' },
          { stage: 'Stage 3', key: 'stage3', components: ['Supercharger kit (Whipple/ProCharger/Roush)'], hpGainLow: 300, hpGainHigh: 400, torqueGainLow: 250, torqueGainHigh: 350, costLow: 8000, costHigh: 15000, requirements: ['Fuel system support', 'Professional install and tune'], notes: 'Transforms the truck into a performance machine' }
        ],
        tuningPlatforms: [
          { name: 'SCT', priceLow: 400, priceHigh: 500, notes: 'Most popular for Coyote', url: 'https://sctflash.com' },
          { name: 'HP Tuners', priceLow: 700, priceHigh: 1000, notes: 'Pro-level tuning', url: 'https://hptuners.com' },
          { name: 'Lund Racing', priceLow: 400, priceHigh: 600, notes: 'Great Coyote expertise', url: 'https://lundracing.com' }
        ],
        powerLimits: {
          stockInternals: { whp: 700, notes: 'Coyote internals are very strong' },
          stockTransmission: { hp: 600, notes: '10R80 reliable to ~600 HP' },
          stockFuelSystem: { whp: 500, notes: 'Need fuel upgrades for supercharger' }
        },
        brandRecommendations: {
          intakes: ['S&B Filters', 'AFE Power', 'K&N', 'JLT', 'Roush'],
          exhausts: ['Borla', 'Corsa', 'MBRP', 'Flowmaster'],
          superchargers: ['Whipple', 'ProCharger', 'Roush', 'VMP'],
          tuners: ['Lund Racing', '5 Star Tuning', 'Palm Beach Dyno']
        }
      }
    ],
    communityResources: [
      { name: 'F150Forum.com', type: 'forum', url: 'https://f150forum.com', notes: 'Largest F-150 community' },
      { name: 'FordF150.net', type: 'forum', url: 'https://fordf150.net', notes: '173K+ members' },
      { name: 'r/f150', type: 'reddit', url: 'https://reddit.com/r/f150', notes: '~75K subscribers' }
    ],
    issues: [
      { title: '10R80 Transmission CDF Drum Failures', severity: 'critical', description: 'CDF drum can fail under high torque loads, especially with tunes. Most common on 2017-2019 models.', prevention: 'Use conservative tune, avoid aggressive launches, consider transmission cooler', costLow: 3000, costHigh: 6000 },
      { title: 'Timing Chains/Phasers (Gen 2 EcoBoost)', severity: 'high', description: 'Timing chain and cam phaser issues can cause rattling on startup, reduced power, and eventual failure.', symptoms: 'Rattling on cold start, check engine light, rough idle', prevention: 'Regular oil changes with quality synthetic, address early symptoms', costLow: 4000, costHigh: 6000 },
      { title: 'Turbo Coolant Lines (2011-2014)', severity: 'medium', description: 'Early EcoBoost trucks had coolant line failures leading to turbo damage.', prevention: 'Inspect and replace proactively', costLow: 500, costHigh: 1500 }
    ]
  },

  // Jeep Wrangler
  'jeep-wrangler': {
    variants: [
      {
        engineFamily: '3.6L Pentastar',
        tuningFocus: 'off-road',
        stockWhp: 260,
        stockWtq: 240,
        stageProgressions: [
          { stage: 'Entry Trail', key: 'entry', components: ['Calibration tool', 'Leveling kit', 'Recovery gear', 'All-terrain tires'], hpGainLow: 0, hpGainHigh: 0, torqueGainLow: 0, torqueGainHigh: 0, costLow: 500, costHigh: 1500, requirements: [], notes: 'Basic trail readiness' },
          { stage: 'Moderate Trail', key: 'moderate', components: ['2.5-3" lift kit', '35" tires', 'Steel bumper', 'Winch', 'Rock sliders'], hpGainLow: 0, hpGainHigh: 0, torqueGainLow: 0, torqueGainHigh: 0, costLow: 2000, costHigh: 5000, requirements: ['May need fender trimming'], notes: '35" tires recommended maximum without regear' },
          { stage: 'Serious Overland', key: 'serious', components: ['3.5" lift', '37" tires', 'Full armor package', 'Regear (4.88)', 'Upgraded driveshafts'], hpGainLow: 0, hpGainHigh: 0, torqueGainLow: 0, torqueGainHigh: 0, costLow: 5000, costHigh: 15000, requirements: ['4.88 gears required', 'Driveshaft upgrades'], notes: 'Serious off-road capability' },
          { stage: 'Competition', key: 'competition', components: ['Long-arm suspension', '40" tires', 'Dana 60 axles', 'Coilover bypasses', 'Full cage'], hpGainLow: 0, hpGainHigh: 0, torqueGainLow: 0, torqueGainHigh: 0, costLow: 15000, costHigh: 40000, requirements: ['5.13 gears', 'Axle upgrades', 'Professional build'], notes: 'Rock crawling/competition builds' }
        ],
        tuningPlatforms: [
          { name: 'Superchips Flashcal', priceLow: 200, priceHigh: 250, notes: 'Tire size calibration, speedometer correction', url: 'https://superchips.com' },
          { name: 'DiabloSport Trinity', priceLow: 400, priceHigh: 500, notes: 'Performance tuning and monitoring', url: 'https://diablosport.com' },
          { name: 'Z Automotive Tazer', priceLow: 300, priceHigh: 315, notes: 'TPMS bypass, tire calibration, feature unlocks', url: 'https://zautomotive.com' }
        ],
        powerLimits: {
          stockEngine: { hp: 285, notes: 'Pentastar is reliable but not a tuning platform' }
        },
        brandRecommendations: {
          lifts: ['Teraflex', 'MetalCloak', 'AEV', 'Rock Krawler', 'ICON'],
          bumpers: ['ARB', 'Warn', 'Fab Fours', 'Smittybilt', 'Rugged Ridge'],
          winches: ['Warn', 'Smittybilt', 'Superwinch'],
          tires: ['BFGoodrich KO2', 'Nitto Ridge Grappler', 'Toyo Open Country', 'Falken Wildpeak'],
          armor: ['EVO Manufacturing', 'Artec Industries', 'Motobilt']
        }
      }
    ],
    communityResources: [
      { name: 'JLWranglerForums.com', type: 'forum', url: 'https://jlwranglerforums.com', notes: 'JL specific' },
      { name: 'WranglerForum.com', type: 'forum', url: 'https://wranglerforum.com', notes: 'All generations' },
      { name: 'r/Jeep', type: 'reddit', url: 'https://reddit.com/r/Jeep', notes: '~500K subscribers' }
    ],
    issues: [
      { title: 'Death Wobble', severity: 'critical', description: 'Violent steering wheel shaking at highway speeds, typically after hitting bump. Caused by worn track bar bushings, ball joints, or steering stabilizer.', symptoms: 'Violent shaking at 45-65 mph', prevention: 'Regular suspension inspection, quality components', fix: 'Steer Smarts Yeti HD trackbar ($300-400), ball joints, steering stabilizer', costLow: 300, costHigh: 1500 },
      { title: 'Driveshaft Angle Issues', severity: 'high', description: 'Lifts above 2.5" can cause driveshaft vibrations due to incorrect angles.', symptoms: 'Vibration at certain speeds, clunking', prevention: 'Install with proper driveshaft, consider SYE kit', costLow: 500, costHigh: 2000 }
    ],
    gearingGuide: {
      '33"': { lift: 'Stock-2"', gears: 'Stock OK', notes: 'Minimal modification needed' },
      '35"': { lift: '2.5-3"', gears: '4.88 recommended', notes: 'Most popular tire size' },
      '37"': { lift: '3.5-4"', gears: '4.88-5.13 required', notes: 'Driveshaft upgrades needed' },
      '40"': { lift: '4"+', gears: '5.13+ required', notes: 'Axle upgrades typically required' }
    }
  },

  // Ford Mustang GT
  'mustang-gt': {
    variants: [
      {
        engineFamily: '5.0L Coyote',
        tuningFocus: 'performance',
        stockWhp: 390,
        stockWtq: 375,
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['Tune', 'Cold air intake', 'Axle-back exhaust'], hpGainLow: 30, hpGainHigh: 50, torqueGainLow: 25, torqueGainHigh: 40, costLow: 1500, costHigh: 3000, requirements: ['Premium fuel'], notes: 'Basic bolt-ons, great exhaust sound' },
          { stage: 'Stage 2', key: 'stage2', components: ['Long tube headers', 'Full exhaust', 'Tune'], hpGainLow: 60, hpGainHigh: 90, torqueGainLow: 50, torqueGainHigh: 75, costLow: 4000, costHigh: 7000, requirements: ['Off-road use or emissions equipment'], notes: 'Headers unlock significant NA power' },
          { stage: 'Stage 3', key: 'stage3', components: ['Headers', 'Cams', 'Ported heads', 'Fuel system'], hpGainLow: 80, hpGainHigh: 120, torqueGainLow: 70, torqueGainHigh: 100, costLow: 8000, costHigh: 12000, requirements: ['Built engine recommended'], notes: 'Full NA build' },
          { stage: 'Stage 4', key: 'stage4', components: ['Supercharger kit (Whipple/ProCharger/Roush)'], hpGainLow: 300, hpGainHigh: 400, torqueGainLow: 250, torqueGainHigh: 350, costLow: 15000, costHigh: 25000, requirements: ['Fuel system', 'Half-shaft upgrades above 700 WHP'], notes: 'Supercharger transforms the car' }
        ],
        tuningPlatforms: [
          { name: 'Lund Racing', priceLow: 400, priceHigh: 600, notes: 'Industry-leading Coyote tuner', url: 'https://lundracing.com' },
          { name: 'Palm Beach Dyno', priceLow: 350, priceHigh: 500, notes: 'Excellent custom tunes', url: 'https://pbdyno.com' },
          { name: 'HP Tuners', priceLow: 700, priceHigh: 1000, notes: 'Pro-level capability', url: 'https://hptuners.com' },
          { name: 'SCT', priceLow: 400, priceHigh: 650, notes: 'Popular platform', url: 'https://sctflash.com' }
        ],
        powerLimits: {
          stockInternals: { whp: 700, notes: 'Coyote internals are strong' },
          stockTransmission: { tq: 550, notes: 'MT-82 limit ~380 lb-ft; A10 good to 650+' },
          stockHalfshafts: { whp: 700, notes: 'Upgrade above 700 RWHP' }
        },
        brandRecommendations: {
          headers: ['Kooks', 'American Racing', 'Stainless Works', 'Corsa'],
          superchargers: ['Whipple', 'ProCharger', 'Roush', 'VMP'],
          suspension: ['Ohlins', 'KW', 'BC Racing', 'BMR'],
          brakes: ['Brembo', 'StopTech', 'Wilwood', 'AP Racing']
        }
      }
    ],
    communityResources: [
      { name: 'Mustang6G.com', type: 'forum', url: 'https://mustang6g.com', notes: 'S550/S650 focused' },
      { name: 'r/Mustang', type: 'reddit', url: 'https://reddit.com/r/Mustang', notes: '~300K subscribers' }
    ],
    issues: [
      { title: 'MT-82 Transmission Issues', severity: 'high', description: 'Manual transmission known for 3rd gear lockout and limited torque capacity (~380 lb-ft)', symptoms: 'Grinding, difficulty shifting into 3rd', prevention: 'Use MGW shifter, change fluid often, dont money shift', costLow: 200, costHigh: 3500 },
      { title: 'Oil Pump Gear Wear', severity: 'medium', description: 'Oil pump gears can wear prematurely, especially with forced induction', symptoms: 'Low oil pressure warning', prevention: 'Upgrade to billet gears before supercharger', costLow: 500, costHigh: 1500 }
    ]
  },

  // Corvette C8
  'corvette-c8': {
    variants: [
      {
        engineFamily: 'LT2 6.2L V8',
        tuningFocus: 'performance',
        stockWhp: 420,
        stockWtq: 400,
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['Intake', 'Exhaust', 'Tune'], hpGainLow: 30, hpGainHigh: 50, torqueGainLow: 25, torqueGainHigh: 45, costLow: 3000, costHigh: 6000, requirements: ['Premium fuel'], notes: 'NA gains are modest but worthwhile' },
          { stage: 'Stage 2', key: 'stage2', components: ['Headers', 'Full exhaust', 'Tune'], hpGainLow: 50, hpGainHigh: 80, torqueGainLow: 45, torqueGainHigh: 70, costLow: 6000, costHigh: 12000, requirements: ['Quality headers'], notes: 'Headers unlock more power' },
          { stage: 'Stage 3', key: 'stage3', components: ['Supercharger kit (ProCharger/Magnuson)'], hpGainLow: 200, hpGainHigh: 300, torqueGainLow: 180, torqueGainHigh: 280, costLow: 12000, costHigh: 18000, requirements: ['Fuel system support', 'Half-shaft upgrades'], notes: 'Supercharger is the big power adder' }
        ],
        tuningPlatforms: [
          { name: 'HP Tuners', priceLow: 700, priceHigh: 1000, notes: 'Primary platform for GM', url: 'https://hptuners.com' },
          { name: 'Hennessey', priceLow: 0, priceHigh: 0, notes: 'Full packages only', url: 'https://hennesseyperformance.com' },
          { name: 'Lingenfelter', priceLow: 0, priceHigh: 0, notes: 'Full packages only', url: 'https://lingenfelter.com' }
        ],
        powerLimits: {
          stockInternals: { whp: 700, notes: 'LT2 internals are strong' },
          stockTransmission: { hp: 750, notes: 'DCT handles power well' },
          stockHalfshafts: { whp: 700, notes: 'Upgrade above 700 HP' }
        },
        brandRecommendations: {
          superchargers: ['ProCharger', 'Magnuson', 'Lingenfelter'],
          headers: ['Kooks', 'American Racing', 'Corsa'],
          exhausts: ['Corsa', 'Borla', 'Billy Boat'],
          brakes: ['AP Racing', 'Brembo', 'StopTech']
        }
      }
    ],
    communityResources: [
      { name: 'CorvetteForum.com', type: 'forum', url: 'https://corvetteforum.com', notes: '500K+ members' },
      { name: 'MidEngineCorvetteForum.com', type: 'forum', url: 'https://midenginecorvetteforum.com', notes: 'C8 specific' }
    ],
    issues: [
      { title: 'DCT Filter Service', severity: 'medium', description: 'DCT filter requires service at 7,500 miles', symptoms: 'Transmission issues if neglected', prevention: 'Follow service schedule', costLow: 200, costHigh: 500 }
    ]
  },

  // BMW M3/M4 F80/F82
  'bmw-m3': {
    variants: [
      {
        engineFamily: 'S55 Twin-Turbo I6',
        tuningFocus: 'performance',
        stockWhp: 360,
        stockWtq: 380,
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['ECU tune only'], hpGainLow: 50, hpGainHigh: 80, torqueGainLow: 80, torqueGainHigh: 120, costLow: 600, costHigh: 900, requirements: ['93 octane recommended'], notes: 'Excellent gains from tune alone' },
          { stage: 'Stage 2', key: 'stage2', components: ['Tune', 'Downpipes', 'Charge pipe', 'Intake'], hpGainLow: 100, hpGainHigh: 140, torqueGainLow: 130, torqueGainHigh: 180, costLow: 3000, costHigh: 5000, requirements: ['Catless or high-flow cats'], notes: 'Sweet spot for most owners' },
          { stage: 'Stage 3', key: 'stage3', components: ['Pure Turbos', 'FMIC', 'Fuel system', 'Meth injection'], hpGainLow: 200, hpGainHigh: 300, torqueGainLow: 200, torqueGainHigh: 350, costLow: 8000, costHigh: 15000, requirements: ['Built transmission recommended'], notes: 'Big turbo territory' }
        ],
        tuningPlatforms: [
          { name: 'bootmod3 (bm3)', priceLow: 700, priceHigh: 900, notes: 'Most popular platform', url: 'https://bootmod3.net' },
          { name: 'MHD Flasher', priceLow: 350, priceHigh: 550, notes: 'Great value, phone-based', url: 'https://mhdtuning.com' },
          { name: 'Burger Tuning JB4', priceLow: 450, priceHigh: 550, notes: 'Piggyback, no flash required', url: 'https://burgertuning.com' }
        ],
        powerLimits: {
          stockTurbos: { whp: 550, notes: 'Stock turbos limit around 550 WHP' },
          stockTransmission: { tq: 550, notes: 'DCT good to ~550 lb-ft with tune' },
          stockFuelSystem: { whp: 600, notes: 'LPFP upgrade needed above 600 WHP' }
        },
        brandRecommendations: {
          downpipes: ['VRSF', 'Eventuri', 'Active Autowerke', 'Akrapovic'],
          intakes: ['Eventuri', 'aFe', 'Dinan', 'VRSF'],
          intercoolers: ['CSF', 'VRSF', 'Wagner'],
          exhausts: ['Akrapovic', 'Remus', 'Eisenmann', 'Dinan']
        }
      }
    ],
    communityResources: [
      { name: 'F80Post.com', type: 'forum', url: 'https://f80post.com', notes: 'F8x specific' },
      { name: 'Bimmerpost.com', type: 'forum', url: 'https://bimmerpost.com', notes: 'All BMW' }
    ],
    issues: [
      { title: 'Crank Hub Slip', severity: 'critical', description: 'Crank hub can slip on high-power builds, causing catastrophic timing loss', symptoms: 'Misfires, loss of power, check engine light', prevention: 'Install pinned/keyed crank hub before Stage 2+', costLow: 800, costHigh: 2000 }
    ]
  },

  // Subaru WRX STI
  'subaru-wrx': {
    variants: [
      {
        engineFamily: 'EJ257 2.5L Turbo Boxer',
        tuningFocus: 'performance',
        stockWhp: 265,
        stockWtq: 260,
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['Accessport tune', 'Air filter'], hpGainLow: 30, hpGainHigh: 50, torqueGainLow: 40, torqueGainHigh: 60, costLow: 600, costHigh: 900, requirements: ['Premium fuel', '93 octane recommended'], notes: 'COBB Accessport is essential' },
          { stage: 'Stage 2', key: 'stage2', components: ['Tune', 'Downpipe', 'Intake', 'TMIC or FMIC'], hpGainLow: 60, hpGainHigh: 90, torqueGainLow: 70, torqueGainHigh: 110, costLow: 2000, costHigh: 4000, requirements: ['J-pipe/downpipe', 'Protune recommended'], notes: 'Most popular stage for STI' },
          { stage: 'Stage 3', key: 'stage3', components: ['Turbo upgrade', 'Fuel system', 'Built engine recommended'], hpGainLow: 120, hpGainHigh: 180, torqueGainLow: 140, torqueGainHigh: 200, costLow: 6000, costHigh: 12000, requirements: ['Built block highly recommended', 'Fuel system upgrades'], notes: 'EJ257 internals are weak, consider built block' }
        ],
        tuningPlatforms: [
          { name: 'COBB Accessport', priceLow: 650, priceHigh: 750, notes: 'Essential for Subaru tuning', url: 'https://cobbtuning.com' },
          { name: 'EcuTek', priceLow: 500, priceHigh: 700, notes: 'Pro-tuner favorite', url: 'https://ecutek.com' }
        ],
        powerLimits: {
          stockTurbo: { whp: 350, notes: 'VF48 turbo maxes around 350 WHP' },
          stockInternals: { whp: 400, notes: 'EJ257 ringlands fail above 400 WHP - built block recommended' },
          stockFuelSystem: { whp: 350, notes: 'Injectors and pump limit around 350 WHP' }
        },
        brandRecommendations: {
          downpipes: ['Invidia', 'GrimmSpeed', 'COBB', 'Tomei'],
          intakes: ['COBB', 'GrimmSpeed', 'Perrin', 'IAG'],
          intercoolers: ['GrimmSpeed', 'Process West', 'AMS', 'ETS'],
          exhausts: ['Invidia', 'Tomei', 'AWE', 'Borla']
        }
      }
    ],
    communityResources: [
      { name: 'NASIOC', type: 'forum', url: 'https://nasioc.com', notes: 'Largest Subaru community' },
      { name: 'r/WRX', type: 'reddit', url: 'https://reddit.com/r/WRX', notes: '~200K subscribers' }
    ],
    issues: [
      { title: 'Ringland Failure', severity: 'critical', description: 'EJ257 pistons have weak ringlands that crack under boost', symptoms: 'Loss of compression, smoke, misfires', prevention: 'Quality tune, dont run lean, built pistons above 400 WHP', costLow: 4000, costHigh: 8000 },
      { title: 'Rod Bearing Failure', severity: 'high', description: 'Rod bearings can fail, especially with oil starvation in hard corners', symptoms: 'Knocking, low oil pressure', prevention: 'Oil pickup brace, quality oil, avoid low oil', costLow: 3000, costHigh: 7000 }
    ]
  },

  // Dodge Challenger Hellcat
  'dodge-challenger-hellcat': {
    variants: [
      {
        engineFamily: '6.2L Supercharged HEMI',
        tuningFocus: 'performance',
        stockWhp: 620,
        stockWtq: 600,
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['Pulley upgrade (2.85" or 2.75")', 'Tune'], hpGainLow: 50, hpGainHigh: 100, torqueGainLow: 50, torqueGainHigh: 100, costLow: 1500, costHigh: 3000, requirements: ['Premium fuel', 'Quality tune'], notes: 'Pulley swap is most effective mod' },
          { stage: 'Stage 2', key: 'stage2', components: ['2.65" pulley', 'Headers', 'Full exhaust', 'Tune'], hpGainLow: 100, hpGainHigh: 170, torqueGainLow: 100, torqueGainHigh: 150, costLow: 4000, costHigh: 8000, requirements: ['Fuel system support'], notes: 'Headers unlock significant power' },
          { stage: 'Stage 3', key: 'stage3', components: ['Ported supercharger or blower upgrade', 'Built engine', 'Full fuel system'], hpGainLow: 200, hpGainHigh: 400, torqueGainLow: 200, torqueGainHigh: 400, costLow: 15000, costHigh: 40000, requirements: ['Built internals recommended', 'E85 capability'], notes: 'Serious power builds' }
        ],
        tuningPlatforms: [
          { name: 'HP Tuners', priceLow: 700, priceHigh: 1000, notes: 'Most popular for Mopar', url: 'https://hptuners.com' },
          { name: 'DiabloSport', priceLow: 400, priceHigh: 600, notes: 'Good OTS tunes available', url: 'https://diablosport.com' },
          { name: 'Tazer by Z Automotive', priceLow: 300, priceHigh: 400, notes: 'Feature unlocks + basic tuning', url: 'https://zautomotive.com' }
        ],
        powerLimits: {
          stockSupercharger: { whp: 850, notes: 'IHI supercharger maxes around 850 WHP' },
          stockInternals: { hp: 900, notes: 'Forged internals good to ~900 HP' },
          stockTransmission: { tq: 700, notes: 'A8 transmission good to ~700 lb-ft' }
        },
        brandRecommendations: {
          pulleys: ['Metco', 'Fore Innovations', 'Litens'],
          headers: ['Kooks', 'American Racing', 'Stainless Works'],
          superchargers: ['Whipple', 'ProCharger', 'Kenne Bell'],
          exhausts: ['Borla', 'Corsa', 'Magnaflow', 'AWE']
        }
      }
    ],
    communityResources: [
      { name: 'HellcatForum.com', type: 'forum', url: 'https://hellcatforum.com' },
      { name: 'r/Challenger', type: 'reddit', url: 'https://reddit.com/r/Challenger' }
    ],
    issues: []
  },

  // Chevrolet Silverado 1500
  'chevrolet-silverado': {
    variants: [
      {
        engineFamily: '6.2L V8 (L87)',
        tuningFocus: 'performance',
        stockWhp: 360,
        stockWtq: 380,
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['AFM/DFM disabler', 'Intake', 'Tune'], hpGainLow: 10, hpGainHigh: 25, torqueGainLow: 15, torqueGainHigh: 30, costLow: 500, costHigh: 1500, requirements: ['AFM delete recommended'], notes: 'AFM disabler is essential for longevity' },
          { stage: 'Stage 2', key: 'stage2', components: ['Custom tune', 'Exhaust', 'Headers'], hpGainLow: 30, hpGainHigh: 50, torqueGainLow: 35, torqueGainHigh: 60, costLow: 2500, costHigh: 5000, requirements: ['Quality headers'], notes: 'Headers unlock good NA power' },
          { stage: 'Stage 3', key: 'stage3', components: ['Long tube headers', 'Cam', 'Ported heads'], hpGainLow: 80, hpGainHigh: 120, torqueGainLow: 80, torqueGainHigh: 110, costLow: 5000, costHigh: 10000, requirements: ['DOD delete with cam'], notes: 'Full NA build' },
          { stage: 'Stage 4', key: 'stage4', components: ['Supercharger kit (Whipple/Magnuson)'], hpGainLow: 200, hpGainHigh: 300, torqueGainLow: 180, torqueGainHigh: 280, costLow: 10000, costHigh: 18000, requirements: ['Fuel system support'], notes: 'Supercharger transforms the truck' }
        ],
        tuningPlatforms: [
          { name: 'HP Tuners', priceLow: 700, priceHigh: 1000, notes: 'Standard for GM', url: 'https://hptuners.com' },
          { name: 'DiabloSport', priceLow: 350, priceHigh: 500, notes: 'Good OTS options', url: 'https://diablosport.com' },
          { name: 'TRIFECTA', priceLow: 400, priceHigh: 600, notes: 'Good custom tunes', url: 'https://trifectaperformance.com' }
        ],
        powerLimits: {
          stockInternals: { whp: 650, notes: 'L87 internals are strong' },
          stockTransmission: { tq: 600, notes: '10L80 handles 600+ lb-ft' }
        },
        brandRecommendations: {
          superchargers: ['Whipple', 'Magnuson', 'ProCharger'],
          headers: ['Kooks', 'Texas Speed', 'Speed Engineering'],
          exhausts: ['Borla', 'Magnaflow', 'MBRP', 'Flowmaster'],
          intakes: ['K&N', 'aFe', 'S&B', 'Airaid']
        }
      }
    ],
    communityResources: [
      { name: 'SilveradoSierra.com', type: 'forum', url: 'https://silveradosierra.com', notes: '250K+ members' }
    ],
    issues: [
      { title: 'AFM/DFM Lifter Failure', severity: 'critical', description: 'Active Fuel Management can cause lifter failures. Class action lawsuit filed.', symptoms: 'Misfires, ticking, loss of power', prevention: 'AFM disabler or full delete', costLow: 2000, costHigh: 8000 }
    ]
  },

  // Camaro ZL1
  'camaro-zl1': {
    variants: [
      {
        engineFamily: 'LT4 6.2L Supercharged V8',
        tuningFocus: 'performance',
        stockWhp: 560,
        stockWtq: 550,
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['Tune', 'Intake lid', 'Pulley (stock is 1.7")'], hpGainLow: 40, hpGainHigh: 80, torqueGainLow: 40, torqueGainHigh: 80, costLow: 1500, costHigh: 3000, requirements: ['Premium fuel'], notes: 'Great gains from tune and pulley' },
          { stage: 'Stage 2', key: 'stage2', components: ['Headers', 'Full exhaust', 'Smaller pulley', 'Tune'], hpGainLow: 100, hpGainHigh: 150, torqueGainLow: 100, torqueGainHigh: 140, costLow: 4000, costHigh: 8000, requirements: ['Quality headers'], notes: 'Popular configuration' },
          { stage: 'Stage 3', key: 'stage3', components: ['Ported supercharger', 'Cam', 'Heads', 'Fuel system'], hpGainLow: 180, hpGainHigh: 300, torqueGainLow: 150, torqueGainHigh: 280, costLow: 10000, costHigh: 20000, requirements: ['Built engine recommended for 1000+ HP'], notes: 'Serious power territory' }
        ],
        tuningPlatforms: [
          { name: 'HP Tuners', priceLow: 700, priceHigh: 1000, notes: 'Standard for GM vehicles', url: 'https://hptuners.com' },
          { name: 'EFI Live', priceLow: 700, priceHigh: 900, notes: 'Pro tuner favorite', url: 'https://efilive.com' }
        ],
        powerLimits: {
          stockSupercharger: { whp: 750, notes: 'Stock Eaton supercharger maxes around 750 WHP' },
          stockInternals: { hp: 850, notes: 'LT4 internals handle 850+ HP' },
          stockTransmission: { tq: 650, notes: '10L90 handles 650+ lb-ft' }
        },
        brandRecommendations: {
          headers: ['Kooks', 'American Racing', 'Stainless Works', 'Texas Speed'],
          superchargers: ['Magnuson', 'Whipple', 'ProCharger'],
          exhausts: ['Borla', 'Corsa', 'Stainless Works'],
          suspension: ['BMR', 'UMI', 'Pfadt']
        }
      }
    ],
    communityResources: [
      { name: 'Camaro6.com', type: 'forum', url: 'https://camaro6.com' },
      { name: 'CamaroForums.com', type: 'forum', url: 'https://camaroforums.com' }
    ],
    issues: []
  },

  // Toyota Supra A90
  'toyota-supra': {
    variants: [
      {
        engineFamily: 'B58 3.0L Turbo I6',
        tuningFocus: 'performance',
        stockWhp: 340,
        stockWtq: 380,
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['ECU tune only'], hpGainLow: 60, hpGainHigh: 100, torqueGainLow: 80, torqueGainHigh: 130, costLow: 600, costHigh: 900, requirements: ['Premium fuel'], notes: 'B58 responds extremely well to tuning' },
          { stage: 'Stage 2', key: 'stage2', components: ['Tune', 'Downpipe', 'Intake', 'Charge pipe'], hpGainLow: 100, hpGainHigh: 150, torqueGainLow: 130, torqueGainHigh: 180, costLow: 3000, costHigh: 5000, requirements: ['High-flow downpipe'], notes: 'Excellent power gains' },
          { stage: 'Stage 3', key: 'stage3', components: ['Turbo upgrade', 'FMIC', 'Fuel system'], hpGainLow: 180, hpGainHigh: 280, torqueGainLow: 200, torqueGainHigh: 300, costLow: 8000, costHigh: 15000, requirements: ['Big turbo kit'], notes: 'Big turbo builds - 600+ WHP possible' }
        ],
        tuningPlatforms: [
          { name: 'bootmod3 (bm3)', priceLow: 700, priceHigh: 900, notes: 'Most popular, OTS and custom', url: 'https://bootmod3.net' },
          { name: 'MHD Flasher', priceLow: 350, priceHigh: 550, notes: 'Great value option', url: 'https://mhdtuning.com' },
          { name: 'Burger Tuning JB4', priceLow: 450, priceHigh: 550, notes: 'Piggyback option', url: 'https://burgertuning.com' }
        ],
        powerLimits: {
          stockTurbo: { whp: 500, notes: 'Stock turbo good to ~500 WHP' },
          stockInternals: { whp: 700, notes: 'B58 internals are strong' },
          stockTransmission: { tq: 550, notes: 'ZF 8HP handles 550+ lb-ft with tune' }
        },
        brandRecommendations: {
          downpipes: ['HKS', 'CSF', 'VRSF', 'Active Autowerke'],
          intakes: ['Eventuri', 'aFe', 'HKS', 'Injen'],
          turbos: ['Pure Turbos', 'Vargas', 'HKS'],
          exhausts: ['HKS', 'ARK', 'AWE', 'Borla']
        }
      }
    ],
    communityResources: [
      { name: 'SupraMKV.com', type: 'forum', url: 'https://supramkv.com' },
      { name: 'r/ToyotaSupra', type: 'reddit', url: 'https://reddit.com/r/ToyotaSupra' }
    ],
    issues: []
  },

  // Audi RS3
  'audi-rs3': {
    variants: [
      {
        engineFamily: '2.5L TFSI 5-Cylinder',
        tuningFocus: 'performance',
        stockWhp: 340,
        stockWtq: 360,
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['ECU tune only'], hpGainLow: 60, hpGainHigh: 90, torqueGainLow: 80, torqueGainHigh: 120, costLow: 500, costHigh: 800, requirements: ['Premium fuel (93+)'], notes: 'The 2.5 TFSI responds incredibly well to tuning' },
          { stage: 'Stage 2', key: 'stage2', components: ['Tune', 'Downpipe', 'Intake', 'FMIC'], hpGainLow: 100, hpGainHigh: 150, torqueGainLow: 130, torqueGainHigh: 180, costLow: 3000, costHigh: 5000, requirements: ['Catless or high-flow downpipe'], notes: 'Popular power level for daily driving' },
          { stage: 'Stage 3', key: 'stage3', components: ['Turbo upgrade', 'Fuel system', 'Built engine optional'], hpGainLow: 180, hpGainHigh: 280, torqueGainLow: 200, torqueGainHigh: 320, costLow: 8000, costHigh: 15000, requirements: ['Big turbo kit', 'Supporting mods'], notes: '600+ WHP achievable with big turbo' }
        ],
        tuningPlatforms: [
          { name: 'APR', priceLow: 600, priceHigh: 900, notes: 'Industry standard for Audi', url: 'https://goapr.com' },
          { name: 'Unitronic', priceLow: 500, priceHigh: 700, notes: 'Great tunes, popular choice', url: 'https://getunitronic.com' },
          { name: 'Integrated Engineering', priceLow: 450, priceHigh: 650, notes: 'Excellent value', url: 'https://performancebyie.com' },
          { name: 'EQT', priceLow: 175, priceHigh: 300, notes: 'Best value, flat rate', url: 'https://eqtuning.com' }
        ],
        powerLimits: {
          stockTurbo: { whp: 450, notes: 'Stock turbo maxes around 450 WHP' },
          stockInternals: { whp: 600, notes: '2.5 TFSI internals are strong' },
          stockTransmission: { tq: 500, notes: 'DSG handles ~500 lb-ft with tune' }
        },
        brandRecommendations: {
          downpipes: ['AWE', 'IE', 'Unitronic', 'Wagner'],
          intakes: ['IE', 'APR', 'Eventuri', 'CTS'],
          intercoolers: ['Wagner', 'APR', 'CTS', 'IE'],
          exhausts: ['AWE', 'Milltek', 'Remus', 'Akrapovic']
        }
      }
    ],
    communityResources: [
      { name: 'AudiWorld.com', type: 'forum', url: 'https://audiworld.com' },
      { name: 'r/Audi', type: 'reddit', url: 'https://reddit.com/r/Audi' }
    ],
    issues: [
      { title: 'Carbon Buildup', severity: 'medium', description: 'Direct injection causes carbon buildup on intake valves', symptoms: 'Rough idle, misfires, power loss', prevention: 'Walnut blasting every 40-50K miles', costLow: 400, costHigh: 700 }
    ]
  },

  // Ford Bronco
  'ford-bronco': {
    variants: [
      {
        engineFamily: '2.7L EcoBoost V6',
        tuningFocus: 'off-road',
        stockWhp: 280,
        stockWtq: 350,
        stageProgressions: [
          { stage: 'Entry Off-Road', key: 'entry', components: ['Tire upgrade (33")', 'Recovery gear', 'Skid plates'], hpGainLow: 0, hpGainHigh: 0, torqueGainLow: 0, torqueGainHigh: 0, costLow: 1500, costHigh: 3000, requirements: [], notes: 'Basic trail readiness' },
          { stage: 'Moderate Trail', key: 'moderate', components: ['2" lift', '35" tires', 'Steel bumper', 'Winch', 'Rock sliders'], hpGainLow: 0, hpGainHigh: 0, torqueGainLow: 0, torqueGainHigh: 0, costLow: 4000, costHigh: 8000, requirements: ['Regear recommended for 35s'], notes: 'Serious trail capability' },
          { stage: 'Overland Build', key: 'overland', components: ['3"+ lift', '37" tires', 'Roof rack', 'Camping gear', 'Lighting', 'Full armor'], hpGainLow: 0, hpGainHigh: 0, torqueGainLow: 0, torqueGainHigh: 0, costLow: 10000, costHigh: 25000, requirements: ['Regear required (4.70+)', 'Driveshaft upgrades'], notes: 'Full expedition build' }
        ],
        tuningPlatforms: [
          { name: 'SCT', priceLow: 400, priceHigh: 500, notes: 'Tire calibration and tune', url: 'https://sctflash.com' },
          { name: 'HP Tuners', priceLow: 700, priceHigh: 1000, notes: 'Full custom tuning', url: 'https://hptuners.com' }
        ],
        powerLimits: {
          stockEngine: { hp: 400, notes: '2.7L EcoBoost can handle modest power' }
        },
        brandRecommendations: {
          lifts: ['Icon', 'BDS', 'Fabtech', 'ReadyLift'],
          bumpers: ['ARB', 'Warn', 'Ford Performance', 'LoD'],
          tires: ['BFGoodrich KO2', 'Nitto Ridge Grappler', 'Toyo AT3', 'Falken Wildpeak'],
          armor: ['Ford Performance', 'ARB', '4WP Factory']
        }
      }
    ],
    communityResources: [
      { name: 'Bronco6G.com', type: 'forum', url: 'https://bronco6g.com', notes: '6th gen focused' },
      { name: 'r/FordBronco', type: 'reddit', url: 'https://reddit.com/r/FordBronco' }
    ],
    issues: []
  },

  // Honda Civic Type R
  'honda-civic-type-r': {
    variants: [
      {
        engineFamily: 'K20C1 2.0L Turbo',
        tuningFocus: 'performance',
        stockWhp: 275,
        stockWtq: 280,
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['ECU tune'], hpGainLow: 40, hpGainHigh: 70, torqueGainLow: 50, torqueGainHigh: 80, costLow: 500, costHigh: 800, requirements: ['Premium fuel'], notes: 'Significant gains from tune alone' },
          { stage: 'Stage 2', key: 'stage2', components: ['Tune', 'Downpipe', 'Intake', 'Intercooler'], hpGainLow: 80, hpGainHigh: 120, torqueGainLow: 90, torqueGainHigh: 130, costLow: 3000, costHigh: 5000, requirements: ['High-flow downpipe'], notes: 'Popular stage for track use' },
          { stage: 'Stage 3', key: 'stage3', components: ['Turbo upgrade', 'Fuel system', 'Built internals'], hpGainLow: 150, hpGainHigh: 250, torqueGainLow: 150, torqueGainHigh: 250, costLow: 8000, costHigh: 15000, requirements: ['Big turbo kit', 'Supporting mods'], notes: 'Big turbo builds' }
        ],
        tuningPlatforms: [
          { name: 'Hondata FlashPro', priceLow: 700, priceHigh: 850, notes: 'Industry standard for Honda', url: 'https://hondata.com' },
          { name: 'KTuner', priceLow: 400, priceHigh: 500, notes: 'Good alternative', url: 'https://ktuner.com' }
        ],
        powerLimits: {
          stockTurbo: { whp: 400, notes: 'Stock turbo good to ~400 WHP' },
          stockInternals: { whp: 500, notes: 'K20C1 internals handle 500+ WHP' },
          stockTransmission: { tq: 400, notes: '6MT is strong, good to ~400 lb-ft' }
        },
        brandRecommendations: {
          downpipes: ['PRL Motorsports', '27WON', 'RV6', 'MAPerformance'],
          intakes: ['PRL', '27WON', 'Mishimoto', 'Injen'],
          intercoolers: ['PRL', '27WON', 'Mishimoto', 'Full-Race'],
          exhausts: ['AWE', 'Borla', 'Greddy', 'Invidia']
        }
      }
    ],
    communityResources: [
      { name: 'CivicX.com', type: 'forum', url: 'https://civicx.com', notes: 'FK8/FL5 focused' },
      { name: 'r/Civic_Type_R', type: 'reddit', url: 'https://reddit.com/r/Civic_Type_R' }
    ],
    issues: []
  },

  // VW GTI
  'volkswagen-gti': {
    variants: [
      {
        engineFamily: 'EA888 Gen3 (Mk7/Mk8)',
        tuningFocus: 'performance',
        stockWhp: 210,
        stockWtq: 240,
        stageProgressions: [
          { stage: 'Stage 1', key: 'stage1', components: ['ECU tune only'], hpGainLow: 30, hpGainHigh: 70, torqueGainLow: 50, torqueGainHigh: 90, costLow: 175, costHigh: 700, requirements: ['Premium fuel (91+)'], notes: 'Best value mod, instant transformation' },
          { stage: 'Stage 2', key: 'stage2', components: ['Stage 2 tune', 'Downpipe', 'Cold air intake', 'Front mount intercooler'], hpGainLow: 80, hpGainHigh: 120, torqueGainLow: 100, torqueGainHigh: 140, costLow: 2000, costHigh: 4000, requirements: ['High-flow downpipe', 'Stage 1 prerequisites'], notes: 'Sweet spot for most enthusiasts' },
          { stage: 'IS38 Swap', key: 'is38', components: ['Golf R turbo (IS38)', 'Supporting mods', 'Custom tune'], hpGainLow: 150, hpGainHigh: 180, torqueGainLow: 160, torqueGainHigh: 200, costLow: 4000, costHigh: 6000, requirements: ['DSG tune recommended', 'Upgraded clutch for manual'], notes: 'R turbo on GTI is popular upgrade path' },
          { stage: 'Stage 3', key: 'stage3', components: ['Big turbo (Garrett PowerMax, TTE)', 'Fuel system', 'Built internals optional'], hpGainLow: 200, hpGainHigh: 280, torqueGainLow: 250, torqueGainHigh: 350, costLow: 8000, costHigh: 15000, requirements: ['Professional tuning', 'Upgraded fuel system', 'DSG/clutch upgrades'], notes: 'Serious power requires serious supporting mods' }
        ],
        tuningPlatforms: [
          { name: 'EQT (Best Value)', priceLow: 175, priceHigh: 175, notes: 'Flat rate for ANY stage, great reputation', url: 'https://eqtuning.com' },
          { name: 'APR', priceLow: 500, priceHigh: 700, notes: 'Industry standard, dealer network', url: 'https://goapr.com' },
          { name: 'Unitronic', priceLow: 500, priceHigh: 650, notes: 'Great tunes, UniFLEX for E85', url: 'https://getunitronic.com' },
          { name: 'Integrated Engineering', priceLow: 359, priceHigh: 599, notes: 'Excellent value and quality', url: 'https://performancebyie.com' },
          { name: 'COBB Accessport', priceLow: 650, priceHigh: 770, notes: 'Self-tuning, OTS maps, Mk7+ only', url: 'https://cobbtuning.com' }
        ],
        powerLimits: {
          stockTurbo: { whp: 320, notes: 'IS20 turbo limits around 320 whp' },
          is38Turbo: { whp: 400, notes: 'R turbo good to ~400 whp' },
          stockFuelSystem: { whp: 350, notes: 'HPFP upgrade needed beyond this' },
          stockDSG: { tq: 450, notes: 'DSG tune recommended above 350 lb-ft' }
        },
        brandRecommendations: {
          downpipes: ['CTS Turbo', 'Integrated Engineering', 'AWE', 'Unitronic'],
          intakes: ['Integrated Engineering', 'CTS Turbo', 'APR', 'Racingline'],
          intercoolers: ['CTS Turbo', 'Unitronic', 'APR', 'Wagner'],
          exhausts: ['AWE Tuning', 'Milltek', 'Borla', 'Remus'],
          suspension: ['KW', 'Bilstein', 'Eibach', 'H&R'],
          wheels: ['BBS', 'Rotiform', 'Neuspeed', 'Enkei']
        }
      }
    ],
    communityResources: [
      { name: 'VWVortex', type: 'forum', url: 'https://vwvortex.com', notes: 'Largest VW community' },
      { name: 'GolfMK7.com', type: 'forum', url: 'https://golfmk7.com', notes: 'Mk7/Mk8 specific' },
      { name: 'r/GolfGTI', type: 'reddit', url: 'https://reddit.com/r/GolfGTI', notes: '~150K subscribers' }
    ],
    issues: [
      { title: 'Carbon Buildup (Direct Injection)', severity: 'medium', description: 'Direct injection engines are prone to carbon buildup on intake valves, causing rough idle and power loss.', symptoms: 'Rough idle, misfires, power loss', prevention: 'Walnut blasting every 40-60K miles, catch can', costLow: 300, costHigh: 600 },
      { title: 'Water Pump Failure (Plastic Impeller)', severity: 'medium', description: 'Early EA888 engines had plastic water pump impellers that fail.', symptoms: 'Overheating, coolant loss', prevention: 'Upgrade to metal impeller pump', costLow: 400, costHigh: 800 },
      { title: 'Timing Chain Tensioner (Mk6)', severity: 'critical', description: 'Mk6 GTI/R has known timing chain tensioner failure that can cause catastrophic engine damage.', symptoms: 'Rattling on startup, engine warning light', prevention: 'Replace with updated tensioner proactively', costLow: 500, costHigh: 1500 }
    ]
  }
};

/**
 * Convert stage progressions to upgrades_by_objective format (source of truth)
 * This aligns with consolidate-tuning-data.mjs and DATABASE.md requirements
 */
function convertStagesToUpgradesByObjective(stages, brandRecommendations = {}) {
  const objectives = {
    power: [],
    handling: [],
    braking: [],
    cooling: [],
    sound: [],
    aero: []
  };

  if (!stages || !Array.isArray(stages)) return objectives;

  // Component to objective mapping
  const componentObjectiveMap = {
    // Power
    'tune': 'power',
    'intake': 'power',
    'exhaust': 'power',
    'downpipe': 'power',
    'intercooler': 'power',
    'turbo': 'power',
    'supercharger': 'power',
    'header': 'power',
    'fuel': 'power',
    'ecu': 'power',
    'pulley': 'power',
    'cam': 'power',
    'head': 'power',
    'e85': 'power',
    'meth': 'power',
    'boost': 'power',
    
    // Handling
    'suspension': 'handling',
    'coilover': 'handling',
    'spring': 'handling',
    'sway': 'handling',
    'alignment': 'handling',
    'bushing': 'handling',
    'arm': 'handling',
    'strut': 'handling',
    'shock': 'handling',
    'lift': 'handling',
    'wheel': 'handling',
    'tire': 'handling',
    
    // Braking
    'brake': 'braking',
    'rotor': 'braking',
    'caliper': 'braking',
    'pad': 'braking',
    'fluid': 'braking',
    
    // Cooling
    'cooler': 'cooling',
    'radiator': 'cooling',
    'fan': 'cooling',
    
    // Off-road (map to handling for SUVs/trucks)
    'bumper': 'handling',
    'winch': 'handling',
    'skid': 'handling',
    'slider': 'handling',
    'armor': 'handling',
    'gear': 'handling',
    'regear': 'handling',
    'driveshaft': 'handling',
    'axle': 'handling',
    'locker': 'handling'
  };

  function categorizeComponent(componentName) {
    const lower = componentName.toLowerCase();
    for (const [keyword, objective] of Object.entries(componentObjectiveMap)) {
      if (lower.includes(keyword)) {
        return objective;
      }
    }
    // Default to power for unrecognized components
    return 'power';
  }

  for (const stage of stages) {
    if (!stage.components) continue;

    for (const component of stage.components) {
      const objective = categorizeComponent(component);
      
      const upgrade = {
        name: component,
        stage_source: stage.stage || stage.key,
        stage_key: stage.key,
        gains: (stage.hpGainLow !== undefined && stage.hpGainHigh !== undefined) ? {
          hp: { low: stage.hpGainLow, high: stage.hpGainHigh }
        } : null,
        torque_gains: (stage.torqueGainLow !== undefined && stage.torqueGainHigh !== undefined) ? {
          tq: { low: stage.torqueGainLow, high: stage.torqueGainHigh }
        } : null,
        cost: (stage.costLow !== undefined && stage.costHigh !== undefined) ? {
          low: stage.costLow,
          high: stage.costHigh
        } : null,
        requirements: stage.requirements || [],
        notes: stage.notes || null
      };
      
      objectives[objective].push(upgrade);
    }
  }

  return objectives;
}

/**
 * Build platform_insights from research data
 */
function buildPlatformInsights(research, variantResearch, minedData) {
  const insights = {
    strengths: [],
    weaknesses: [],
    community_tips: [],
    youtube_insights: {}
  };

  // Add from research data
  if (variantResearch?.platformNotes) {
    insights.strengths.push(...(Array.isArray(variantResearch.platformNotes) 
      ? variantResearch.platformNotes 
      : [variantResearch.platformNotes]));
  }
  
  if (research?.issues) {
    insights.weaknesses = research.issues.map(i => i.title);
  }

  // Add community resources
  if (research?.communityResources) {
    insights.community_resources = research.communityResources;
  }

  // Add from mined YouTube data
  if (minedData?.insights) {
    insights.youtube_insights = {
      video_count: minedData.youtubeVideos?.length || 0,
      common_pros: minedData.insights.commonPros?.slice(0, 5) || [],
      common_cons: minedData.insights.commonCons?.slice(0, 5) || [],
      avg_sentiment: minedData.insights.avgAftermarketSentiment,
      tuner_mentions: minedData.insights.tunerMentions || [],
      brand_mentions: minedData.insights.brandMentions || []
    };
    
    // Add YouTube-derived strengths/weaknesses
    if (minedData.insights.commonPros?.length > 0) {
      insights.strengths.push(...minedData.insights.commonPros.slice(0, 3));
    }
    if (minedData.insights.commonCons?.length > 0) {
      insights.weaknesses.push(...minedData.insights.commonCons.slice(0, 3));
    }
  }

  // Dedupe
  insights.strengths = [...new Set(insights.strengths)].slice(0, 10);
  insights.weaknesses = [...new Set(insights.weaknesses)].slice(0, 10);

  return insights;
}

/**
 * Determine data quality tier based on available sources
 */
function determineDataQualityTier(options) {
  const { researchData, minedData, hasStages, hasUpgrades } = options;
  
  const hasResearch = researchData && Object.keys(researchData).length > 0;
  const hasYoutube = minedData?.youtubeVideos?.length > 0;
  const hasIssues = minedData?.issues?.length > 0;
  const hasParts = minedData?.parts?.length > 0;
  const hasDyno = minedData?.dynoRuns?.length > 0;
  
  const sourceCount = [hasResearch, hasYoutube, hasIssues, hasParts, hasDyno, hasStages || hasUpgrades].filter(Boolean).length;
  
  if (sourceCount >= 5) return 'researched';
  if (sourceCount >= 3) return 'enriched';
  if (sourceCount >= 1) return 'templated';
  return 'skeleton';
}

/**
 * Create or update a tuning profile
 */
export async function createProfile(options) {
  const {
    carSlug,
    carId,
    engineFamily,
    tuningFocus = 'performance',
    minedData,
    researchData,
    dryRun = false
  } = options;

  console.log(`\n🔧 Creating tuning profile for: ${carSlug}`);
  console.log(`   Engine: ${engineFamily || 'Default'}`);
  console.log(`   Focus: ${tuningFocus}`);

  // Get mined data if not provided
  const mined = minedData || await mineDatabase(carSlug, carId);
  const car = mined.car;

  if (!car) {
    throw new Error(`Car not found: ${carSlug}`);
  }

  // Find matching research data
  const research = researchData || findResearchData(carSlug, car.name);
  const variantResearch = findVariantResearch(research, engineFamily, tuningFocus);

  if (!variantResearch && !research) {
    console.warn('⚠️  No research data found. Profile will be created from mined data only.');
  }

  // Build stage progressions (for backward compatibility)
  const stageProgressions = variantResearch?.stageProgressions || [];
  const tuningPlatforms = variantResearch?.tuningPlatforms || buildPlatformsFromInsights(mined.insights);
  const powerLimits = variantResearch?.powerLimits || {};
  const brandRecommendations = variantResearch?.brandRecommendations || buildBrandsFromMined(mined);

  // Convert stages to upgrades_by_objective (SOURCE OF TRUTH per DATABASE.md)
  const upgradesByObjective = convertStagesToUpgradesByObjective(stageProgressions, brandRecommendations);

  // Build platform insights
  const platformInsights = buildPlatformInsights(research, variantResearch, mined);

  // Determine data quality tier
  const dataQualityTier = determineDataQualityTier({
    researchData: research,
    minedData: mined,
    hasStages: stageProgressions.length > 0,
    hasUpgrades: Object.values(upgradesByObjective).some(arr => arr.length > 0)
  });

  // Track data sources
  const dataSources = {
    has_research_doc: !!research,
    has_youtube: mined.youtubeVideos.length > 0,
    has_issues: mined.issues.length > 0,
    has_parts: mined.parts.length > 0,
    has_dyno: mined.dynoRuns.length > 0,
    youtube_video_count: mined.youtubeVideos.length,
    issues_count: mined.issues.length,
    parts_count: mined.parts.length,
    dyno_runs_count: mined.dynoRuns.length
  };

  // Build the profile
  const profile = {
    car_id: car.id,
    car_variant_id: findVariantId(mined.variants, engineFamily),
    engine_family: engineFamily || variantResearch?.engineFamily || null,
    tuning_focus: tuningFocus,
    
    // SOURCE OF TRUTH: upgrades_by_objective (per DATABASE.md)
    upgrades_by_objective: upgradesByObjective,
    
    // Legacy/supplemental data (for backward compatibility with existing code)
    stage_progressions: stageProgressions,
    tuning_platforms: tuningPlatforms,
    power_limits: powerLimits,
    brand_recommendations: brandRecommendations,
    
    // Platform-specific insights
    platform_insights: platformInsights,
    
    // Stock baseline
    stock_whp: variantResearch?.stockWhp || estimateStockWhp(car),
    stock_wtq: variantResearch?.stockWtq || estimateStockWtq(car),
    
    // YouTube-derived insights (legacy format for existing code)
    youtube_insights: {
      videoCount: mined.youtubeVideos.length,
      commonPros: mined.insights.commonPros?.slice(0, 5) || [],
      commonCons: mined.insights.commonCons?.slice(0, 5) || [],
      avgAftermarketSentiment: mined.insights.avgAftermarketSentiment,
      tunerMentions: mined.insights.tunerMentions || [],
      brandMentions: mined.insights.brandMentions || [],
      keyQuotes: mined.insights.keyQuotes?.slice(0, 3) || []
    },
    research_sources: research ? ['Research & Articles/Top 30 US Automotive Tuning Shop Details.md'] : [],
    
    // Data quality tracking
    data_quality_tier: dataQualityTier,
    data_sources: dataSources,
    
    // Pipeline metadata
    pipeline_version: PIPELINE_VERSION,
    pipeline_run_at: new Date().toISOString(),
    verified: false,
    notes: `Auto-generated by pipeline v${PIPELINE_VERSION}`
  };

  // Count total upgrades in upgrades_by_objective
  const totalUpgrades = Object.values(profile.upgrades_by_objective).reduce((sum, arr) => sum + arr.length, 0);

  console.log('\n📋 Profile Summary:');
  console.log(`   Data Quality Tier: ${profile.data_quality_tier}`);
  console.log(`   Upgrades (by objective): ${totalUpgrades}`);
  console.log(`     - Power: ${profile.upgrades_by_objective.power?.length || 0}`);
  console.log(`     - Handling: ${profile.upgrades_by_objective.handling?.length || 0}`);
  console.log(`     - Braking: ${profile.upgrades_by_objective.braking?.length || 0}`);
  console.log(`     - Cooling: ${profile.upgrades_by_objective.cooling?.length || 0}`);
  console.log(`   Stages (legacy): ${profile.stage_progressions.length}`);
  console.log(`   Platforms: ${profile.tuning_platforms.length}`);
  console.log(`   Power limits: ${Object.keys(profile.power_limits).length}`);
  console.log(`   Brand categories: ${Object.keys(profile.brand_recommendations).length}`);
  console.log(`   Stock WHP: ${profile.stock_whp || 'Unknown'}`);

  if (dryRun) {
    console.log('\n🔍 DRY RUN - Not saving to database');
    return { profile, saved: false };
  }

  // Check for existing profile
  const { data: existing } = await supabase
    .from('car_tuning_profiles')
    .select('id')
    .eq('car_id', car.id)
    .eq('tuning_focus', tuningFocus)
    .is('car_variant_id', profile.car_variant_id || null)
    .limit(1);

  let result;
  if (existing && existing.length > 0) {
    // Update existing
    console.log('\n📝 Updating existing profile...');
    const { data, error } = await supabase
      .from('car_tuning_profiles')
      .update(profile)
      .eq('id', existing[0].id)
      .select()
      .single();
    
    if (error) throw error;
    result = data;
    console.log('   ✓ Profile updated');
  } else {
    // Insert new
    console.log('\n📝 Creating new profile...');
    const { data, error } = await supabase
      .from('car_tuning_profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) throw error;
    result = data;
    console.log('   ✓ Profile created');
  }

  // Also update car.key_resources if we have community data
  if (research?.communityResources && !mined.car.key_resources) {
    console.log('\n📝 Updating car.key_resources...');
    await supabase
      .from('cars')
      .update({ key_resources: research.communityResources })
      .eq('id', car.id);
    console.log('   ✓ Community resources added');
  }

  // Add any new issues from research
  if (research?.issues) {
    await addMissingIssues(car.id, research.issues, mined.issues);
  }

  return { profile: result, saved: true };
}

/**
 * Find research data for a car
 */
function findResearchData(carSlug, carName) {
  // Direct match
  for (const [key, data] of Object.entries(RESEARCH_DATA)) {
    if (carSlug.includes(key) || key.includes(carSlug.split('-')[0])) {
      return data;
    }
  }
  
  // Name-based match
  const nameLower = (carName || '').toLowerCase();
  const slugLower = (carSlug || '').toLowerCase();
  
  if (nameLower.includes('f-150') || nameLower.includes('f150')) {
    return RESEARCH_DATA['ford-f150'];
  }
  if (nameLower.includes('wrangler')) {
    return RESEARCH_DATA['jeep-wrangler'];
  }
  if (nameLower.includes('gti')) {
    return RESEARCH_DATA['volkswagen-gti'];
  }
  if (nameLower.includes('mustang') && nameLower.includes('gt')) {
    return RESEARCH_DATA['mustang-gt'];
  }
  if (nameLower.includes('corvette') && (nameLower.includes('c8') || nameLower.includes('stingray'))) {
    return RESEARCH_DATA['corvette-c8'];
  }
  if (nameLower.includes('m3') || nameLower.includes('m4')) {
    return RESEARCH_DATA['bmw-m3'];
  }
  if (nameLower.includes('wrx') || nameLower.includes('sti')) {
    return RESEARCH_DATA['subaru-wrx'];
  }
  if (nameLower.includes('type r') || nameLower.includes('type-r')) {
    return RESEARCH_DATA['honda-civic-type-r'];
  }
  if (nameLower.includes('hellcat')) {
    return RESEARCH_DATA['dodge-challenger-hellcat'];
  }
  if (nameLower.includes('zl1')) {
    return RESEARCH_DATA['camaro-zl1'];
  }
  if (nameLower.includes('supra') || slugLower.includes('supra')) {
    return RESEARCH_DATA['toyota-supra'];
  }
  if (nameLower.includes('bronco')) {
    return RESEARCH_DATA['ford-bronco'];
  }
  if (nameLower.includes('rs3')) {
    return RESEARCH_DATA['audi-rs3'];
  }
  if (nameLower.includes('silverado')) {
    return RESEARCH_DATA['chevrolet-silverado'];
  }
  if (nameLower.includes('gt350')) {
    return RESEARCH_DATA['mustang-gt']; // GT350 can use similar data
  }
  
  return null;
}

/**
 * Find variant-specific research data
 */
function findVariantResearch(research, engineFamily, tuningFocus) {
  if (!research?.variants) return null;
  
  // Find by engine family
  if (engineFamily) {
    const match = research.variants.find(v => 
      v.engineFamily.toLowerCase().includes(engineFamily.toLowerCase()) ||
      engineFamily.toLowerCase().includes(v.engineFamily.toLowerCase())
    );
    if (match) return match;
  }
  
  // Find by tuning focus
  const focusMatch = research.variants.find(v => v.tuningFocus === tuningFocus);
  if (focusMatch) return focusMatch;
  
  // Return first variant as default
  return research.variants[0];
}

/**
 * Find car_variant_id for a given engine
 */
function findVariantId(variants, engineFamily) {
  if (!variants || !engineFamily) return null;
  
  const match = variants.find(v => 
    v.engine?.toLowerCase().includes(engineFamily.toLowerCase()) ||
    v.display_name?.toLowerCase().includes(engineFamily.toLowerCase())
  );
  
  return match?.id || null;
}

/**
 * Build tuning platforms from YouTube insights
 */
function buildPlatformsFromInsights(insights) {
  const tuners = insights.tunerMentions || [];
  return tuners.map(name => ({
    name,
    priceLow: null,
    priceHigh: null,
    notes: 'Mentioned in YouTube content',
    url: null
  }));
}

/**
 * Build brand recommendations from mined data
 */
function buildBrandsFromMined(mined) {
  const brands = {};
  const brandMentions = mined.insights.brandMentions || [];
  
  // Categorize brands based on known associations
  const brandCategories = {
    exhausts: ['Borla', 'Magnaflow', 'MBRP', 'Flowmaster', 'AWE', 'Milltek', 'Corsa'],
    intakes: ['K&N', 'AFE', 'S&B', 'Airaid', 'Injen', 'CTS'],
    suspension: ['KW', 'Bilstein', 'Ohlins', 'BC Racing', 'Eibach', 'H&R', 'FOX', 'ICON'],
    brakes: ['Brembo', 'StopTech', 'EBC', 'Hawk', 'Wilwood'],
    wheels: ['BBS', 'Rotiform', 'Enkei', 'HRE', 'Forgeline'],
    turbo: ['Garrett', 'BorgWarner', 'Precision'],
    lifts: ['Teraflex', 'MetalCloak', 'AEV', 'BDS', 'Fabtech'],
    bumpers: ['ARB', 'Warn', 'Fab Fours', 'Smittybilt']
  };
  
  for (const [category, knownBrands] of Object.entries(brandCategories)) {
    const matches = brandMentions.filter(b => 
      knownBrands.some(kb => kb.toLowerCase() === b.toLowerCase())
    );
    if (matches.length > 0) {
      brands[category] = matches;
    }
  }
  
  // Also pull from parts data
  const partBrands = [...new Set(mined.parts.filter(p => p.brand).map(p => p.brand))];
  if (partBrands.length > 0) {
    brands.parts = partBrands;
  }
  
  return brands;
}

/**
 * Estimate stock wheel horsepower from crank HP
 */
function estimateStockWhp(car) {
  if (!car.horsepower) return null;
  // Roughly 15% drivetrain loss
  return Math.round(car.horsepower * 0.85);
}

/**
 * Estimate stock wheel torque from crank TQ
 */
function estimateStockWtq(car) {
  if (!car.torque) return null;
  return Math.round(car.torque * 0.85);
}

/**
 * Add missing issues from research data
 */
async function addMissingIssues(carId, researchIssues, existingIssues) {
  const existingTitles = new Set(existingIssues.map(i => i.title.toLowerCase()));
  
  for (const issue of researchIssues) {
    if (!existingTitles.has(issue.title.toLowerCase())) {
      console.log(`   Adding issue: ${issue.title}`);
      
      // Convert symptoms string to array if needed (car_issues.symptoms is TEXT[])
      let symptomsArray = null;
      if (issue.symptoms) {
        symptomsArray = Array.isArray(issue.symptoms) ? issue.symptoms : [issue.symptoms];
      }
      
      const { error } = await supabase.from('car_issues').insert({
        car_id: carId,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        symptoms: symptomsArray,
        prevention: issue.prevention || null,
        fix_description: issue.fix || null,
        estimated_cost_low: issue.costLow || null,
        estimated_cost_high: issue.costHigh || null,
        source_type: 'research',
        source_url: 'Research & Articles/Top 30 US Automotive Tuning Shop Details.md'
      });
      
      if (error) {
        console.warn(`   ⚠️  Failed to add issue: ${error.message}`);
      }
    }
  }
}

// CLI execution
async function main() {
  const { values } = parseArgs({
    options: {
      'car-slug': { type: 'string' },
      'car-id': { type: 'string' },
      'engine': { type: 'string' },
      'focus': { type: 'string', default: 'performance' },
      'dry-run': { type: 'boolean', default: false },
      'help': { type: 'boolean', short: 'h' }
    }
  });

  if (values.help || (!values['car-slug'] && !values['car-id'])) {
    console.log(`
Tuning Shop Enhancement Pipeline - Profile Creation

Usage:
  node create-profile.mjs --car-slug <slug> [options]

Options:
  --car-slug    Car slug to create profile for
  --car-id      Car UUID to create profile for
  --engine      Engine family (e.g., "3.5L EcoBoost", "5.0L Coyote")
  --focus       Tuning focus: performance, off-road, towing, economy (default: performance)
  --dry-run     Preview profile without saving
  -h, --help    Show this help message
`);
    process.exit(0);
  }

  try {
    const result = await createProfile({
      carSlug: values['car-slug'],
      carId: values['car-id'],
      engineFamily: values['engine'],
      tuningFocus: values['focus'],
      dryRun: values['dry-run']
    });

    if (result.saved) {
      console.log('\n✅ Profile creation complete!');
    } else {
      console.log('\n📋 Dry run complete - no changes made');
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  main().catch(console.error);
}
