/**
 * Script to enrich the local cars.js file with Performance HUB data
 * 
 * This script updates the car data with hard metrics and performance scores.
 * Run with: node scripts/enrich-cars-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Performance HUB enrichment data
// Sourced from Car and Driver, Motor Trend, and manufacturer specs
const enrichmentData = {
  '718-cayman-gt4': {
    torque: 309,
    curbWeight: 3227,
    zeroToSixty: 4.2,
    quarterMile: 12.5,
    braking60To0: 97,
    lateralG: 1.12,
    perfPowerAccel: 8,
    perfGripCornering: 9,
    perfBraking: 9,
    perfTrackPace: 10,
    perfDrivability: 5,
    perfReliabilityHeat: 8,
    perfSoundEmotion: 9,
  },
  '718-cayman-gts-40': {
    torque: 309,
    curbWeight: 3153,
    zeroToSixty: 4.3,
    quarterMile: 12.6,
    braking60To0: 100,
    lateralG: 1.08,
    perfPowerAccel: 8,
    perfGripCornering: 8,
    perfBraking: 8,
    perfTrackPace: 9,
    perfDrivability: 7,
    perfReliabilityHeat: 9,
    perfSoundEmotion: 9,
  },
  'audi-r8-v8': {
    torque: 317,
    curbWeight: 3594,
    zeroToSixty: 4.1,
    quarterMile: 12.4,
    braking60To0: 103,
    lateralG: 1.01,
    perfPowerAccel: 8,
    perfGripCornering: 7,
    perfBraking: 7,
    perfTrackPace: 7,
    perfDrivability: 8,
    perfReliabilityHeat: 8,
    perfSoundEmotion: 8,
  },
  'audi-r8-v10': {
    torque: 398,
    curbWeight: 3660,
    zeroToSixty: 3.4,
    quarterMile: 11.5,
    braking60To0: 98,
    lateralG: 1.06,
    perfPowerAccel: 9,
    perfGripCornering: 8,
    perfBraking: 8,
    perfTrackPace: 8,
    perfDrivability: 8,
    perfReliabilityHeat: 7,
    perfSoundEmotion: 10,
  },
  'lamborghini-gallardo': {
    torque: 398,
    curbWeight: 3570,
    zeroToSixty: 3.5,
    quarterMile: 11.6,
    braking60To0: 101,
    lateralG: 1.04,
    perfPowerAccel: 9,
    perfGripCornering: 8,
    perfBraking: 7,
    perfTrackPace: 8,
    perfDrivability: 5,
    perfReliabilityHeat: 6,
    perfSoundEmotion: 10,
  },
  'lotus-emira': {
    torque: 310,
    curbWeight: 3097,
    zeroToSixty: 4.2,
    quarterMile: 12.4,
    braking60To0: 105,
    lateralG: 1.06,
    perfPowerAccel: 8,
    perfGripCornering: 9,
    perfBraking: 7,
    perfTrackPace: 8,
    perfDrivability: 6,
    perfReliabilityHeat: 7,
    perfSoundEmotion: 8,
  },
  'dodge-viper': {
    torque: 600,
    curbWeight: 3374,
    zeroToSixty: 3.3,
    quarterMile: 11.0,
    braking60To0: 95,
    lateralG: 1.15,
    perfPowerAccel: 10,
    perfGripCornering: 9,
    perfBraking: 9,
    perfTrackPace: 10,
    perfDrivability: 4,
    perfReliabilityHeat: 6,
    perfSoundEmotion: 10,
  },
  '997-2-carrera-s': {
    torque: 310,
    curbWeight: 3307,
    zeroToSixty: 4.3,
    quarterMile: 12.7,
    braking60To0: 100,
    lateralG: 1.01,
    perfPowerAccel: 7,
    perfGripCornering: 8,
    perfBraking: 8,
    perfTrackPace: 8,
    perfDrivability: 8,
    perfReliabilityHeat: 8,
    perfSoundEmotion: 9,
  },
  '991-1-carrera-s': {
    torque: 325,
    curbWeight: 3296,
    zeroToSixty: 4.1,
    quarterMile: 12.3,
    braking60To0: 96,
    lateralG: 1.05,
    perfPowerAccel: 8,
    perfGripCornering: 8,
    perfBraking: 8,
    perfTrackPace: 8,
    perfDrivability: 8,
    perfReliabilityHeat: 7,
    perfSoundEmotion: 9,
  },
  '981-cayman-gts': {
    torque: 280,
    curbWeight: 3031,
    zeroToSixty: 4.5,
    quarterMile: 13.0,
    braking60To0: 102,
    lateralG: 1.02,
    perfPowerAccel: 7,
    perfGripCornering: 8,
    perfBraking: 7,
    perfTrackPace: 8,
    perfDrivability: 8,
    perfReliabilityHeat: 9,
    perfSoundEmotion: 8,
  },
  'nissan-gt-r': {
    torque: 463,
    curbWeight: 3933,
    zeroToSixty: 2.9,
    quarterMile: 11.1,
    braking60To0: 98,
    lateralG: 1.08,
    perfPowerAccel: 10,
    perfGripCornering: 9,
    perfBraking: 8,
    perfTrackPace: 9,
    perfDrivability: 7,
    perfReliabilityHeat: 6,
    perfSoundEmotion: 7,
  },
  'c8-corvette-stingray': {
    torque: 470,
    curbWeight: 3535,
    zeroToSixty: 2.9,
    quarterMile: 11.3,
    braking60To0: 98,
    lateralG: 1.04,
    perfPowerAccel: 9,
    perfGripCornering: 8,
    perfBraking: 8,
    perfTrackPace: 9,
    perfDrivability: 8,
    perfReliabilityHeat: 8,
    perfSoundEmotion: 8,
  },
  'shelby-gt500': {
    torque: 625,
    curbWeight: 4171,
    zeroToSixty: 3.3,
    quarterMile: 11.4,
    braking60To0: 103,
    lateralG: 1.05,
    perfPowerAccel: 10,
    perfGripCornering: 7,
    perfBraking: 7,
    perfTrackPace: 8,
    perfDrivability: 5,
    perfReliabilityHeat: 6,
    perfSoundEmotion: 9,
  },
  'lotus-evora-gt': {
    torque: 317,
    curbWeight: 3175,
    zeroToSixty: 3.8,
    quarterMile: 12.0,
    braking60To0: 102,
    lateralG: 1.08,
    perfPowerAccel: 8,
    perfGripCornering: 9,
    perfBraking: 7,
    perfTrackPace: 9,
    perfDrivability: 5,
    perfReliabilityHeat: 7,
    perfSoundEmotion: 8,
  },
  '981-cayman-s': {
    torque: 273,
    curbWeight: 2998,
    zeroToSixty: 4.6,
    quarterMile: 13.1,
    braking60To0: 105,
    lateralG: 1.00,
    perfPowerAccel: 7,
    perfGripCornering: 8,
    perfBraking: 7,
    perfTrackPace: 7,
    perfDrivability: 8,
    perfReliabilityHeat: 9,
    perfSoundEmotion: 8,
  },
  'jaguar-f-type-r': {
    torque: 502,
    curbWeight: 3814,
    zeroToSixty: 3.9,
    quarterMile: 12.1,
    braking60To0: 100,
    lateralG: 0.98,
    perfPowerAccel: 9,
    perfGripCornering: 7,
    perfBraking: 7,
    perfTrackPace: 7,
    perfDrivability: 7,
    perfReliabilityHeat: 6,
    perfSoundEmotion: 10,
  },
  'lotus-evora-s': {
    torque: 295,
    curbWeight: 3168,
    zeroToSixty: 4.3,
    quarterMile: 12.5,
    braking60To0: 107,
    lateralG: 1.05,
    perfPowerAccel: 7,
    perfGripCornering: 9,
    perfBraking: 7,
    perfTrackPace: 8,
    perfDrivability: 5,
    perfReliabilityHeat: 7,
    perfSoundEmotion: 7,
  },
  'alfa-romeo-4c': {
    torque: 258,
    curbWeight: 2465,
    zeroToSixty: 4.1,
    quarterMile: 12.8,
    braking60To0: 105,
    lateralG: 1.05,
    perfPowerAccel: 7,
    perfGripCornering: 9,
    perfBraking: 7,
    perfTrackPace: 8,
    perfDrivability: 4,
    perfReliabilityHeat: 6,
    perfSoundEmotion: 8,
  },
  'c7-corvette-grand-sport': {
    torque: 465,
    curbWeight: 3524,
    zeroToSixty: 3.6,
    quarterMile: 11.8,
    braking60To0: 99,
    lateralG: 1.08,
    perfPowerAccel: 8,
    perfGripCornering: 9,
    perfBraking: 8,
    perfTrackPace: 9,
    perfDrivability: 7,
    perfReliabilityHeat: 8,
    perfSoundEmotion: 8,
  },
  'c7-corvette-z06': {
    torque: 650,
    curbWeight: 3599,
    zeroToSixty: 3.2,
    quarterMile: 11.1,
    braking60To0: 96,
    lateralG: 1.14,
    perfPowerAccel: 10,
    perfGripCornering: 9,
    perfBraking: 9,
    perfTrackPace: 10,
    perfDrivability: 5,
    perfReliabilityHeat: 5,
    perfSoundEmotion: 9,
  },
  'camaro-zl1': {
    torque: 650,
    curbWeight: 4078,
    zeroToSixty: 3.5,
    quarterMile: 11.5,
    braking60To0: 98,
    lateralG: 1.06,
    perfPowerAccel: 10,
    perfGripCornering: 8,
    perfBraking: 8,
    perfTrackPace: 9,
    perfDrivability: 5,
    perfReliabilityHeat: 6,
    perfSoundEmotion: 9,
  },
  'shelby-gt350': {
    torque: 429,
    curbWeight: 3760,
    zeroToSixty: 4.3,
    quarterMile: 12.4,
    braking60To0: 104,
    lateralG: 1.05,
    perfPowerAccel: 8,
    perfGripCornering: 8,
    perfBraking: 7,
    perfTrackPace: 9,
    perfDrivability: 6,
    perfReliabilityHeat: 7,
    perfSoundEmotion: 10,
  },
  'aston-martin-v8-vantage': {
    torque: 346,
    curbWeight: 3570,
    zeroToSixty: 4.7,
    quarterMile: 13.0,
    braking60To0: 107,
    lateralG: 0.96,
    perfPowerAccel: 7,
    perfGripCornering: 7,
    perfBraking: 6,
    perfTrackPace: 7,
    perfDrivability: 7,
    perfReliabilityHeat: 6,
    perfSoundEmotion: 9,
  },
  'bmw-m2-competition': {
    torque: 406,
    curbWeight: 3655,
    zeroToSixty: 4.0,
    quarterMile: 12.3,
    braking60To0: 101,
    lateralG: 1.00,
    perfPowerAccel: 8,
    perfGripCornering: 8,
    perfBraking: 7,
    perfTrackPace: 8,
    perfDrivability: 8,
    perfReliabilityHeat: 7,
    perfSoundEmotion: 7,
  },
  'lexus-lc-500': {
    torque: 398,
    curbWeight: 4280,
    zeroToSixty: 4.4,
    quarterMile: 12.8,
    braking60To0: 109,
    lateralG: 0.95,
    perfPowerAccel: 7,
    perfGripCornering: 6,
    perfBraking: 6,
    perfTrackPace: 6,
    perfDrivability: 9,
    perfReliabilityHeat: 9,
    perfSoundEmotion: 9,
  },
  '987-2-cayman-s': {
    torque: 273,
    curbWeight: 2998,
    zeroToSixty: 4.9,
    quarterMile: 13.3,
    braking60To0: 108,
    lateralG: 0.98,
    perfPowerAccel: 6,
    perfGripCornering: 8,
    perfBraking: 7,
    perfTrackPace: 7,
    perfDrivability: 8,
    perfReliabilityHeat: 9,
    perfSoundEmotion: 8,
  },
  'jaguar-f-type-v6-s': {
    torque: 339,
    curbWeight: 3558,
    zeroToSixty: 4.6,
    quarterMile: 13.0,
    braking60To0: 105,
    lateralG: 0.96,
    perfPowerAccel: 7,
    perfGripCornering: 7,
    perfBraking: 7,
    perfTrackPace: 7,
    perfDrivability: 8,
    perfReliabilityHeat: 6,
    perfSoundEmotion: 9,
  },
  'nissan-370z-nismo': {
    torque: 276,
    curbWeight: 3370,
    zeroToSixty: 4.8,
    quarterMile: 13.1,
    braking60To0: 109,
    lateralG: 1.00,
    perfPowerAccel: 6,
    perfGripCornering: 8,
    perfBraking: 6,
    perfTrackPace: 7,
    perfDrivability: 7,
    perfReliabilityHeat: 8,
    perfSoundEmotion: 7,
  },
  'mercedes-c63-amg-w204': {
    torque: 443,
    curbWeight: 3814,
    zeroToSixty: 4.3,
    quarterMile: 12.6,
    braking60To0: 104,
    lateralG: 0.97,
    perfPowerAccel: 8,
    perfGripCornering: 7,
    perfBraking: 7,
    perfTrackPace: 7,
    perfDrivability: 7,
    perfReliabilityHeat: 6,
    perfSoundEmotion: 10,
  },
  'lexus-rc-f': {
    torque: 389,
    curbWeight: 4034,
    zeroToSixty: 4.3,
    quarterMile: 12.8,
    braking60To0: 108,
    lateralG: 0.98,
    perfPowerAccel: 7,
    perfGripCornering: 7,
    perfBraking: 7,
    perfTrackPace: 7,
    perfDrivability: 8,
    perfReliabilityHeat: 9,
    perfSoundEmotion: 8,
  },
  'mustang-gt-pp2': {
    torque: 420,
    curbWeight: 3752,
    zeroToSixty: 4.3,
    quarterMile: 12.6,
    braking60To0: 102,
    lateralG: 1.02,
    perfPowerAccel: 8,
    perfGripCornering: 8,
    perfBraking: 7,
    perfTrackPace: 8,
    perfDrivability: 7,
    perfReliabilityHeat: 8,
    perfSoundEmotion: 8,
  },
  'camaro-ss-1le': {
    torque: 455,
    curbWeight: 3793,
    zeroToSixty: 4.2,
    quarterMile: 12.3,
    braking60To0: 98,
    lateralG: 1.04,
    perfPowerAccel: 8,
    perfGripCornering: 8,
    perfBraking: 8,
    perfTrackPace: 8,
    perfDrivability: 6,
    perfReliabilityHeat: 8,
    perfSoundEmotion: 8,
  },
  'bmw-m4-f82': {
    torque: 406,
    curbWeight: 3580,
    zeroToSixty: 3.9,
    quarterMile: 12.2,
    braking60To0: 102,
    lateralG: 0.99,
    perfPowerAccel: 8,
    perfGripCornering: 7,
    perfBraking: 7,
    perfTrackPace: 8,
    perfDrivability: 7,
    perfReliabilityHeat: 6,
    perfSoundEmotion: 7,
  },
  'toyota-gr-supra': {
    torque: 365,
    curbWeight: 3400,
    zeroToSixty: 3.9,
    quarterMile: 12.1,
    braking60To0: 100,
    lateralG: 1.01,
    perfPowerAccel: 8,
    perfGripCornering: 8,
    perfBraking: 7,
    perfTrackPace: 8,
    perfDrivability: 8,
    perfReliabilityHeat: 8,
    perfSoundEmotion: 6,
  },
  'maserati-granturismo': {
    torque: 361,
    curbWeight: 4145,
    zeroToSixty: 4.7,
    quarterMile: 13.2,
    braking60To0: 112,
    lateralG: 0.92,
    perfPowerAccel: 7,
    perfGripCornering: 6,
    perfBraking: 6,
    perfTrackPace: 6,
    perfDrivability: 7,
    perfReliabilityHeat: 5,
    perfSoundEmotion: 10,
  },
};

// Read the cars.js file
const carsFilePath = path.join(__dirname, '..', 'data', 'cars.js');
let carsContent = fs.readFileSync(carsFilePath, 'utf8');

console.log('🚗 Enriching car data with Performance HUB metrics...\n');

let updatedCount = 0;
let alreadyEnrichedCount = 0;

for (const [slug, data] of Object.entries(enrichmentData)) {
  // Find the car entry by slug
  const slugPattern = new RegExp(`slug:\\s*["']${slug}["']`, 'g');
  
  if (!slugPattern.test(carsContent)) {
    console.log(`⚠️  Car not found: ${slug}`);
    continue;
  }
  
  // Check if already has perfPowerAccel
  const carBlockRegex = new RegExp(
    `(\\{[^}]*slug:\\s*["']${slug}["'][^}]*?)\\}`,
    'gs'
  );
  
  const match = carsContent.match(carBlockRegex);
  if (!match) {
    console.log(`⚠️  Could not find block for: ${slug}`);
    continue;
  }
  
  const carBlock = match[0];
  
  // Check if already enriched
  if (carBlock.includes('perfPowerAccel')) {
    // Update existing values
    let updatedBlock = carBlock;
    
    for (const [key, value] of Object.entries(data)) {
      const keyPattern = new RegExp(`${key}:\\s*[\\d.]+`, 'g');
      if (keyPattern.test(updatedBlock)) {
        updatedBlock = updatedBlock.replace(keyPattern, `${key}: ${value}`);
      }
    }
    
    if (updatedBlock !== carBlock) {
      carsContent = carsContent.replace(carBlock, updatedBlock);
      console.log(`🔄 Updated: ${slug}`);
      updatedCount++;
    } else {
      alreadyEnrichedCount++;
    }
  } else {
    // Add new Performance HUB data before the closing brace
    // Find the notes or highlight field to insert after
    const insertPoint = carBlock.lastIndexOf('notes:') !== -1 
      ? carBlock.lastIndexOf('notes:')
      : carBlock.lastIndexOf('highlight:');
    
    if (insertPoint === -1) {
      console.log(`⚠️  Could not find insert point for: ${slug}`);
      continue;
    }
    
    // Find the position right before notes/highlight
    const priorContent = carBlock.substring(0, insertPoint);
    const afterContent = carBlock.substring(insertPoint);
    
    // Build the enrichment string
    const enrichmentString = `// Extended Specs (Performance HUB)
    torque: ${data.torque},
    curbWeight: ${data.curbWeight},
    zeroToSixty: ${data.zeroToSixty},
    quarterMile: ${data.quarterMile},
    braking60To0: ${data.braking60To0},
    lateralG: ${data.lateralG},
    // Performance HUB Scores (1-10)
    perfPowerAccel: ${data.perfPowerAccel},
    perfGripCornering: ${data.perfGripCornering},
    perfBraking: ${data.perfBraking},
    perfTrackPace: ${data.perfTrackPace},
    perfDrivability: ${data.perfDrivability},
    perfReliabilityHeat: ${data.perfReliabilityHeat},
    perfSoundEmotion: ${data.perfSoundEmotion},
    // Content
    `;
    
    const newBlock = priorContent + enrichmentString + afterContent;
    carsContent = carsContent.replace(carBlock, newBlock);
    
    console.log(`✅ Enriched: ${slug}`);
    updatedCount++;
  }
}

// Write the updated content back
fs.writeFileSync(carsFilePath, carsContent);

console.log(`\n📊 Summary:`);
console.log(`   ✅ Cars enriched/updated: ${updatedCount}`);
console.log(`   ⏭️  Already up to date: ${alreadyEnrichedCount}`);
console.log(`\n✅ Done! The cars.js file has been updated with Performance HUB data.`);


