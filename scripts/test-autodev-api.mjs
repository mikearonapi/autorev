/**
 * Auto.dev API Evaluation Test
 * Tests API endpoints for BMW M4 F82 and Porsche 911 GT3 997
 */

import 'dotenv/config';

const API_KEY = process.env.AUTO_DEV_API_KEY;
const BASE_URL = 'https://auto.dev/api';

if (!API_KEY) {
  console.error('❌ AUTO_DEV_API_KEY not found in environment');
  process.exit(1);
}

console.log('🔑 API Key found:', API_KEY.substring(0, 10) + '...');

const TEST_VEHICLES = [
  {
    slug: 'bmw-m4-f82',
    name: 'BMW M4 F82',
    make: 'BMW',
    model: 'M4',
    year: 2017,
  },
  {
    slug: 'porsche-911-gt3-997',
    name: 'Porsche 911 GT3 997',
    make: 'Porsche',
    model: '911',
    year: 2010,
  }
];

async function apiCall(endpoint, params = {}) {
  const url = new URL(BASE_URL + endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  console.log('   📡 Calling:', endpoint, '?', url.searchParams.toString());
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error('API Error ' + response.status + ': ' + error.substring(0, 100));
  }
  
  return response.json();
}

async function testVehicle(vehicle) {
  console.log('\n' + '='.repeat(60));
  console.log('🚗 Testing:', vehicle.name);
  console.log('='.repeat(60));
  
  const results = {
    vehicle: vehicle.name,
    endpoints: {},
    errors: []
  };
  
  // Test 1: Listings
  try {
    console.log('\n📋 Test 1: Listings...');
    const listings = await apiCall('/listings', {
      make: vehicle.make,
      model: vehicle.model,
      year_min: vehicle.year,
      year_max: vehicle.year,
      apikey: API_KEY
    });
    
    results.endpoints.listings = {
      success: true,
      count: listings.records?.length || 0,
      sample: listings.records?.[0]
    };
    console.log('   ✅ Found', results.endpoints.listings.count, 'listings');
    if (listings.records?.[0]) {
      console.log('   Sample:', listings.records[0].year, listings.records[0].make, listings.records[0].model);
      console.log('   Price: $' + (listings.records[0].price?.toLocaleString() || 'N/A'));
    }
  } catch (e) {
    results.endpoints.listings = { success: false, error: e.message };
    console.log('   ❌', e.message);
  }
  
  // Test 2: Specs
  try {
    console.log('\n📐 Test 2: Specs...');
    const specs = await apiCall('/specs', {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      apikey: API_KEY
    });
    
    results.endpoints.specs = {
      success: true,
      data: specs
    };
    console.log('   ✅ Specs retrieved');
    if (specs.records) {
      console.log('   Found', specs.records.length, 'spec records');
    }
  } catch (e) {
    results.endpoints.specs = { success: false, error: e.message };
    console.log('   ❌', e.message);
  }
  
  // Test 3: Trims
  try {
    console.log('\n🏷️ Test 3: Trims...');
    const trims = await apiCall('/trims', {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      apikey: API_KEY
    });
    
    const trimsList = trims.records || trims;
    results.endpoints.trims = {
      success: true,
      count: Array.isArray(trimsList) ? trimsList.length : 0,
      data: trimsList
    };
    console.log('   ✅ Found', results.endpoints.trims.count, 'trims');
    if (Array.isArray(trimsList) && trimsList.length > 0) {
      console.log('   Sample trims:', trimsList.slice(0, 3).map(t => t.name || t.trim || t).join(', '));
    }
  } catch (e) {
    results.endpoints.trims = { success: false, error: e.message };
    console.log('   ❌', e.message);
  }
  
  // Test 4: Makes
  try {
    console.log('\n🏭 Test 4: Makes coverage...');
    const makes = await apiCall('/makes', { apikey: API_KEY });
    
    const makesList = makes.records || makes;
    const hasMake = Array.isArray(makesList) && makesList.some(m => 
      (m.name || m).toString().toLowerCase() === vehicle.make.toLowerCase()
    );
    
    results.endpoints.makes = {
      success: true,
      totalMakes: Array.isArray(makesList) ? makesList.length : 0,
      hasMake
    };
    console.log('   ✅', results.endpoints.makes.totalMakes, 'makes,', vehicle.make + ':', hasMake ? '✅' : '❌');
  } catch (e) {
    results.endpoints.makes = { success: false, error: e.message };
    console.log('   ❌', e.message);
  }
  
  return results;
}

async function main() {
  console.log('🚀 Auto.dev API Evaluation Starting...\n');
  
  const results = [];
  
  for (const vehicle of TEST_VEHICLES) {
    const result = await testVehicle(vehicle);
    results.push(result);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 EVALUATION SUMMARY');
  console.log('='.repeat(60));
  
  let totalSuccess = 0;
  let totalEndpoints = 0;
  
  for (const r of results) {
    const successCount = Object.values(r.endpoints).filter(e => e.success).length;
    const count = Object.keys(r.endpoints).length;
    totalSuccess += successCount;
    totalEndpoints += count;
    
    console.log('\n' + r.vehicle + ': ' + successCount + '/' + count + ' endpoints successful');
    
    for (const [name, ep] of Object.entries(r.endpoints)) {
      if (ep.success) {
        console.log('  ✅', name);
      } else {
        console.log('  ❌', name + ':', ep.error);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💰 COST-BENEFIT ANALYSIS');
  console.log('='.repeat(60));
  console.log('\nAutoRev has 98 vehicles in database');
  console.log('Auto.dev subscription: $299/month');
  console.log('');
  console.log('If we can enrich all 98 vehicles in one month:');
  console.log('  Cost per vehicle: $' + (299 / 98).toFixed(2));
  console.log('');
  
  const successRate = (totalSuccess / totalEndpoints * 100).toFixed(0);
  console.log('API Success Rate:', successRate + '%');
  
  if (parseInt(successRate) >= 75) {
    console.log('\n✅ RECOMMENDATION: Worth trying the $299 subscription');
    console.log('   The API provides good coverage for enthusiast vehicles.');
  } else if (parseInt(successRate) >= 50) {
    console.log('\n⚠️ RECOMMENDATION: Proceed with caution');
    console.log('   Partial coverage - may need to supplement with other sources.');
  } else {
    console.log('\n❌ RECOMMENDATION: Not worth it');
    console.log('   Limited coverage for enthusiast vehicles.');
  }
  
  // Save results
  const fs = await import('fs');
  try {
    fs.mkdirSync('./data-samples', { recursive: true });
    fs.writeFileSync('./data-samples/autodev-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n📁 Results saved to ./data-samples/autodev-test-results.json');
  } catch (e) {
    console.log('\n⚠️ Could not save results:', e.message);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

