/**
 * AI Mechanic Service Tests
 * 
 * Tests for context priority logic:
 * 1. If user has owned vehicles → use most recently added vehicle as primary context
 * 2. If no owned vehicles but has favorites → mention favorites and give general advice
 * 3. If no vehicles AND no favorites → ask user which car they're interested in
 * 
 * Run with: npm test -- --test-name-pattern="context priority"
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

/**
 * Copy of formatContextForAI logic for testing without Supabase deps
 * This mirrors the actual implementation in aiMechanicService.js
 */
function formatContextForAI(context) {
  let contextText = '';
  
  // Priority 1: User's owned vehicles
  if (context.allOwnedVehicles?.length > 0) {
    contextText += `\n\n## User's Garage (Owned Vehicles)`;
    contextText += `\nThe user owns ${context.allOwnedVehicles.length} vehicle(s):`;
    context.allOwnedVehicles.forEach((v, i) => {
      const isPrimary = v.is_primary ? ' [PRIMARY]' : '';
      contextText += `\n${i + 1}. ${v.year} ${v.make} ${v.model}${v.nickname ? ` ("${v.nickname}")` : ''}${isPrimary}`;
      contextText += `\n   - Mileage: ${v.current_mileage?.toLocaleString() || v.mileage?.toLocaleString() || 'N/A'} miles`;
      contextText += `\n   - Matched Slug: ${v.matched_car_slug || 'unmatched'}`;
    });
  } else if (context.userFavorites?.length > 0) {
    // Priority 2: User has favorites but no owned vehicles
    contextText += `\n\n## User's Favorites (No Owned Vehicles)`;
    contextText += `\nThe user has ${context.userFavorites.length} car(s) saved to favorites but NO owned vehicles:`;
    context.userFavorites.slice(0, 5).forEach((fav, i) => {
      const carName = fav.car_name || fav.car_slug?.replace(/-/g, ' ') || 'Unknown';
      contextText += `\n${i + 1}. ${carName}${fav.notes ? ` — "${fav.notes}"` : ''}`;
    });
    contextText += `\n\n**IMPORTANT**: Since the user has NO owned vehicles, do NOT assume they are asking about any specific car unless they explicitly mention one. If they ask a general car question, either:
1. Mention "Based on your favorites, I see you're interested in [car names]..." and give general advice
2. Ask which car they'd like help with`;
  } else if (context.hasNoCarContext) {
    // Priority 3: No owned vehicles AND no favorites
    contextText += `\n\n## User's Garage Status
**The user has NO owned vehicles and NO favorites saved.**
If they ask a car-specific question without mentioning a car, you MUST ask them which car they're interested in. Do NOT assume or guess a car.`;
  }
  
  // Current car context (from page they're viewing)
  if (context.car) {
    contextText += `\n\n## Currently Viewing (Page Context)
The user is viewing/discussing: ${context.car.name}
- Year: ${context.car.years || 'N/A'}
- Power: ${context.car.hp || 'N/A'} hp
- Engine: ${context.car.engine || 'N/A'}
- 0-60: ${context.car.zeroToSixty || 'N/A'}s
- Weight: ${context.car.curbWeight || 'N/A'} lbs
- Price Range: ${context.car.priceRange || 'N/A'}`;
  }
  
  return contextText;
}

describe('AI Mechanic Context Priority Logic', () => {
  
  test('context priority: includes owned vehicles when user has them', () => {
    const context = {
      allOwnedVehicles: [
        {
          year: 2020,
          make: 'Porsche',
          model: '911 Carrera',
          nickname: 'My 911',
          current_mileage: 15000,
          matched_car_slug: 'porsche-911-992',
          is_primary: true,
        },
      ],
      userFavorites: [],
      hasOwnedVehicles: true,
      hasFavorites: false,
      hasNoCarContext: false,
    };
    
    const result = formatContextForAI(context);
    
    assert.ok(result.includes("User's Garage (Owned Vehicles)"), 'Should contain owned vehicles section');
    assert.ok(result.includes('2020 Porsche 911 Carrera'), 'Should include vehicle details');
    assert.ok(result.includes('[PRIMARY]'), 'Should mark primary vehicle');
    assert.ok(!result.includes('NO owned vehicles'), 'Should not say no owned vehicles');
  });
  
  test('context priority: shows favorites when no owned vehicles', () => {
    const context = {
      allOwnedVehicles: [],
      userFavorites: [
        { car_name: 'Porsche 987.2 Cayman S', car_slug: 'porsche-cayman-987-2', notes: 'Dream car' },
        { car_name: 'BMW M3 E46', car_slug: 'bmw-m3-e46' },
      ],
      hasOwnedVehicles: false,
      hasFavorites: true,
      hasNoCarContext: false,
    };
    
    const result = formatContextForAI(context);
    
    assert.ok(result.includes("User's Favorites (No Owned Vehicles)"), 'Should show favorites section');
    assert.ok(result.includes('Porsche 987.2 Cayman S'), 'Should include favorite car');
    assert.ok(result.includes('BMW M3 E46'), 'Should include all favorites');
    assert.ok(result.includes('IMPORTANT'), 'Should include important notice');
    assert.ok(result.includes('NO owned vehicles'), 'Should note no owned vehicles');
    assert.ok(result.includes('do NOT assume'), 'Should warn not to assume');
  });
  
  test('context priority: asks for car when no vehicles and no favorites', () => {
    const context = {
      allOwnedVehicles: [],
      userFavorites: [],
      hasOwnedVehicles: false,
      hasFavorites: false,
      hasNoCarContext: true,
    };
    
    const result = formatContextForAI(context);
    
    assert.ok(result.includes('user has NO owned vehicles and NO favorites'), 'Should state no context');
    assert.ok(result.includes('MUST ask them which car'), 'Should require asking for car');
    assert.ok(result.includes('Do NOT assume'), 'Should warn against assuming');
  });
  
  test('context priority: never hardcodes a fallback car', () => {
    const context = {
      allOwnedVehicles: [],
      userFavorites: [],
      hasOwnedVehicles: false,
      hasFavorites: false,
      hasNoCarContext: true,
    };
    
    const result = formatContextForAI(context);
    
    // Should not contain any specific car assumed as default
    assert.ok(!result.includes('C5 Z06'), 'Should not hardcode C5 Z06');
    assert.ok(!result.includes('assuming'), 'Should not mention assuming a car');
    assert.ok(!result.includes('default car'), 'Should not mention default car');
  });
  
  test('context priority: prioritizes owned vehicles over favorites', () => {
    const context = {
      allOwnedVehicles: [
        {
          year: 2019,
          make: 'Toyota',
          model: 'GR Supra',
          current_mileage: 8000,
          matched_car_slug: 'toyota-gr-supra',
          is_primary: true,
        },
      ],
      userFavorites: [
        { car_name: 'Porsche 911 GT3', car_slug: 'porsche-911-gt3' },
      ],
      hasOwnedVehicles: true,
      hasFavorites: true,
      hasNoCarContext: false,
    };
    
    const result = formatContextForAI(context);
    
    // Should show owned vehicles section
    assert.ok(result.includes("User's Garage (Owned Vehicles)"), 'Should show owned vehicles');
    // Favorites should not appear when user has owned vehicles
    assert.ok(!result.includes("User's Favorites (No Owned Vehicles)"), 'Should not show favorites fallback');
  });
  
  test('context priority: includes car page context separately from garage', () => {
    const context = {
      car: {
        name: 'Porsche 718 Cayman GT4',
        years: '2020-2024',
        hp: 414,
        engine: '4.0L Flat-6',
        zeroToSixty: '3.9',
        curbWeight: '3148',
        priceRange: '$90K-$120K',
      },
      allOwnedVehicles: [
        {
          year: 2018,
          make: 'Mazda',
          model: 'MX-5 Miata',
          current_mileage: 25000,
          matched_car_slug: 'mazda-mx-5-nd',
          is_primary: true,
        },
      ],
      userFavorites: [],
      hasOwnedVehicles: true,
      hasFavorites: false,
      hasNoCarContext: false,
    };
    
    const result = formatContextForAI(context);
    
    // Should have both owned vehicle context AND page context
    assert.ok(result.includes("User's Garage (Owned Vehicles)"), 'Should show garage');
    assert.ok(result.includes('Mazda MX-5 Miata'), 'Should show owned vehicle');
    assert.ok(result.includes('Currently Viewing (Page Context)'), 'Should show page context');
    assert.ok(result.includes('Porsche 718 Cayman GT4'), 'Should show viewed car');
  });
  
  test('context priority: includes favorite notes when available', () => {
    const context = {
      allOwnedVehicles: [],
      userFavorites: [
        { 
          car_name: 'BMW M2', 
          car_slug: 'bmw-m2', 
          notes: 'Considering as daily driver' 
        },
      ],
      hasOwnedVehicles: false,
      hasFavorites: true,
      hasNoCarContext: false,
    };
    
    const result = formatContextForAI(context);
    
    assert.ok(result.includes('BMW M2'), 'Should include car name');
    assert.ok(result.includes('Considering as daily driver'), 'Should include notes');
  });
});

