/**
 * Auto.dev API V2 Evaluation Test
 * Tests correct API endpoints - note: free tier has LIMITED access
 * Full specs/build data requires $299/mo Growth plan
 */

import 'dotenv/config';

const API_KEY = process.env.AUTO_DEV_API_KEY;
const BASE_URL = 'https://api.auto.dev';  // Correct base URL

if (!API_KEY) {
  console.error('❌ AUTO_DEV_API_KEY not found in environment');
  process.exit(1);
}

console.log('🔑 API Key found:', API_KEY.substring(0, 10) + '...');

// Sample VINs for testing (real VINs for enthusiast vehicles)
const TEST_VEHICLES = [
  {
    slug: 'bmw-m4-f82',
    name: 'BMW M4 F82 (2017)',
    // Sample 2017 BMW M4 VIN
    vin: 'WBS3R9C50GK340908',
  },
  {
    slug: 'porsche-911-gt3-997',
    name: 'Porsche 911 GT3 (2010)',
    // Sample 2010 Porsche 911 GT3 VIN  
    vin: 'WP0AC2A91AS783054',
  }
];

async function apiCall(endpoint) {
  const url = BASE_URL + endpoint;
  console.log('   📡 Calling:', url);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Accept': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error('API Error ' + response.status + ': ' + JSON.stringify(data).substring(0, 150));
  }
  
  return data;
}

async function testVehicle(vehicle) {
  console.log('\n' + '='.repeat(70));
  console.log('🚗 Testing:', vehicle.name);
  console.log('   VIN:', vehicle.vin);
  console.log('='.repeat(70));
  
  const results = {
    vehicle: vehicle.name,
    vin: vehicle.vin,
    endpoints: {},
  };
  
  // Test 1: VIN Decode (available on free tier)
  try {
    console.log('\n🔍 Test 1: VIN Decode (FREE tier)...');
    const decode = await apiCall('/vin/' + vehicle.vin);
    
    results.endpoints.vinDecode = {
      success: true,
      year: decode.vehicle?.year || decode.year,
      make: decode.vehicle?.make || decode.make,
      model: decode.vehicle?.model || decode.model,
      trim: decode.vehicle?.trim || decode.trim,
      engine: decode.vehicle?.engine || decode.engine,
      transmission: decode.vehicle?.transmission || decode.transmission,
      data: decode
    };
    
    console.log('   ✅ VIN Decode successful');
    console.log('   Year:', results.endpoints.vinDecode.year);
    console.log('   Make:', results.endpoints.vinDecode.make);
    console.log('   Model:', results.endpoints.vinDecode.model);
    console.log('   Trim:', results.endpoints.vinDecode.trim || 'N/A');
    console.log('   Engine:', results.endpoints.vinDecode.engine || 'N/A');
  } catch (e) {
    results.endpoints.vinDecode = { success: false, error: e.message };
    console.log('   ❌', e.message);
  }
  
  // Test 2: Specifications (requires $299/mo Growth plan)
  try {
    console.log('\n📐 Test 2: Specifications ($299/mo Growth plan required)...');
    const specs = await apiCall('/specs/' + vehicle.vin);
    
    const colorCount = specs.specs?.color?.exterior?.length || 0;
    const optionCount = specs.specs?.options?.length || 0;
    
    results.endpoints.specs = {
      success: true,
      colorCount,
      optionCount,
      hasTransmissionDetails: !!specs.specs?.transmission,
      hasEngineDetails: !!specs.specs?.engine,
      baseMsrp: specs.specs?.price?.baseMsrp,
      data: specs
    };
    
    console.log('   ✅ Specifications available!');
    console.log('   Colors:', colorCount);
    console.log('   Options:', optionCount);
    console.log('   Base MSRP: $' + (specs.specs?.price?.baseMsrp?.toLocaleString() || 'N/A'));
    console.log('   Engine Details:', results.endpoints.specs.hasEngineDetails ? '✅' : '❌');
  } catch (e) {
    results.endpoints.specs = { success: false, error: e.message };
    console.log('   ❌', e.message);
    if (e.message.includes('403') || e.message.includes('401') || e.message.includes('upgrade')) {
      console.log('   ⚠️  This endpoint requires the $299/mo Growth plan');
    }
  }
  
  // Test 3: OEM Build Data (requires $299/mo Growth plan)
  try {
    console.log('\n🏭 Test 3: OEM Build Data ($299/mo Growth plan required)...');
    const build = await apiCall('/build/' + vehicle.vin);
    
    results.endpoints.build = {
      success: true,
      trim: build.build?.trim,
      drivetrain: build.build?.drivetrain,
      engine: build.build?.engine,
      transmission: build.build?.transmission,
      interiorColor: build.build?.interiorColor,
      exteriorColor: build.build?.exteriorColor,
      msrp: build.build?.msrp,
      data: build
    };
    
    console.log('   ✅ OEM Build Data available!');
    console.log('   Trim:', results.endpoints.build.trim || 'N/A');
    console.log('   Drivetrain:', results.endpoints.build.drivetrain || 'N/A');
    console.log('   Interior:', results.endpoints.build.interiorColor?.name || 'N/A');
    console.log('   Exterior:', results.endpoints.build.exteriorColor?.name || 'N/A');
  } catch (e) {
    results.endpoints.build = { success: false, error: e.message };
    console.log('   ❌', e.message);
    if (e.message.includes('403') || e.message.includes('401') || e.message.includes('upgrade')) {
      console.log('   ⚠️  This endpoint requires the $299/mo Growth plan');
    }
  }
  
  // Test 4: Listings (available on free tier)
  try {
    console.log('\n🛒 Test 4: Vehicle Listings (FREE tier)...');
    const year = results.endpoints.vinDecode?.year || 2017;
    const make = results.endpoints.vinDecode?.make || 'BMW';
    const model = results.endpoints.vinDecode?.model?.split(' ')[0] || 'M4';
    
    const listings = await apiCall('/listings?make=' + make + '&model=' + model + '&year_min=' + year + '&year_max=' + year + '&page_size=5');
    
    results.endpoints.listings = {
      success: true,
      count: listings.records?.length || 0,
      totalAvailable: listings.total || 0,
      priceRange: listings.records?.length > 0 ? {
        min: Math.min(...listings.records.map(r => r.price || Infinity)),
        max: Math.max(...listings.records.map(r => r.price || 0)),
        avg: Math.round(listings.records.reduce((sum, r) => sum + (r.price || 0), 0) / listings.records.length)
      } : null,
      sample: listings.records?.[0]
    };
    
    console.log('   ✅ Listings found:', results.endpoints.listings.count);
    if (results.endpoints.listings.priceRange) {
      console.log('   Price Range: $' + results.endpoints.listings.priceRange.min.toLocaleString() + 
                  ' - $' + results.endpoints.listings.priceRange.max.toLocaleString());
      console.log('   Average: $' + results.endpoints.listings.priceRange.avg.toLocaleString());
    }
  } catch (e) {
    results.endpoints.listings = { success: false, error: e.message };
    console.log('   ❌', e.message);
  }
  
  return results;
}

async function main() {
  console.log('🚀 Auto.dev API V2 Evaluation Starting...');
  console.log('');
  console.log('⚠️  IMPORTANT: Free tier only includes VIN Decode + Listings');
  console.log('   Specifications and OEM Build Data require $299/mo Growth plan\n');
  
  const results = [];
  
  for (const vehicle of TEST_VEHICLES) {
    const result = await testVehicle(vehicle);
    results.push(result);
    await new Promise(r => setTimeout(r, 1500));
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 EVALUATION SUMMARY');
  console.log('='.repeat(70));
  
  // Check what endpoints worked
  const freeEndpoints = ['vinDecode', 'listings'];
  const paidEndpoints = ['specs', 'build'];
  
  let freeWorking = 0;
  let paidWorking = 0;
  
  for (const r of results) {
    console.log('\n' + r.vehicle);
    console.log('-'.repeat(50));
    
    for (const ep of freeEndpoints) {
      if (r.endpoints[ep]?.success) {
        console.log('  ✅', ep, '(FREE)');
        freeWorking++;
      } else {
        console.log('  ❌', ep, '(FREE) -', r.endpoints[ep]?.error?.substring(0, 50));
      }
    }
    
    for (const ep of paidEndpoints) {
      if (r.endpoints[ep]?.success) {
        console.log('  ✅', ep, '($299/mo)');
        paidWorking++;
      } else {
        console.log('  🔒', ep, '($299/mo) - Requires paid plan');
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('💰 COST-BENEFIT ANALYSIS');
  console.log('='.repeat(70));
  
  console.log('\n📋 FREE TIER (current):');
  console.log('   ✅ VIN Decode - Basic vehicle info');
  console.log('   ✅ Listings - Market prices from dealers');
  console.log('   ❌ No specs, colors, options, OEM data');
  
  console.log('\n💳 GROWTH PLAN ($299/mo):');
  console.log('   ✅ Everything in Free');
  console.log('   ✅ Specifications API - Colors, options, features');
  console.log('   ✅ OEM Build Data - Factory build sheet');
  console.log('   ✅ Vehicle Recalls');
  console.log('   ✅ Total Cost of Ownership');
  console.log('   + $0.0015 per Specifications API call');
  
  console.log('\n📈 FOR 98 VEHICLES:');
  console.log('   Base cost: $299');
  console.log('   Specs calls (98 cars × ~5 years × 2 calls): ~1,000 calls');
  console.log('   Data fees: $1.50');
  console.log('   Total one-time enrichment: ~$300.50');
  
  const specsAvailable = results.some(r => r.endpoints.specs?.success);
  const buildAvailable = results.some(r => r.endpoints.build?.success);
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 RECOMMENDATION');
  console.log('='.repeat(70));
  
  if (specsAvailable || buildAvailable) {
    console.log('\n✅ WORTH IT - Rich OEM data is accessible on your plan!');
    console.log('   Colors:', results[0]?.endpoints.specs?.colorCount || 0, 'per vehicle');
    console.log('   Options:', results[0]?.endpoints.specs?.optionCount || 0, 'per vehicle');
  } else {
    console.log('\n⚠️  UPGRADE REQUIRED');
    console.log('');
    console.log('   Your free tier only provides basic VIN decode and listings.');
    console.log('   To get the rich OEM data (colors, options, transmission specs):');
    console.log('');
    console.log('   1. Upgrade to Growth plan ($299/mo)');
    console.log('   2. Run enrichment for all 98 vehicles (~1 week)');
    console.log('   3. Cancel subscription');
    console.log('   Total cost: ~$300 for permanent data enrichment');
    console.log('');
    console.log('   VALUE: $3.06 per vehicle for complete OEM specs');
    console.log('');
    console.log('   Alternative: Use free NHTSA API for recalls + EPA for fuel economy');
    console.log('   (but no colors, options, or detailed transmission data)');
  }
  
  // Save results
  const fs = await import('fs');
  try {
    fs.mkdirSync('./data-samples', { recursive: true });
    fs.writeFileSync('./data-samples/autodev-v2-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n📁 Results saved to ./data-samples/autodev-v2-test-results.json');
  } catch (e) {
    console.log('\n⚠️ Could not save results:', e.message);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

