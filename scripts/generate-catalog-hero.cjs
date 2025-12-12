/**
 * Car Catalog Hero Image Generator
 * 
 * Generates high-quality hero images for the car catalog page using OpenAI's gpt-image-1.
 * Creates multiple options showing diverse sports car collections.
 * 
 * Usage:
 *   node scripts/generate-catalog-hero.cjs generate <variant>
 *   node scripts/generate-catalog-hero.cjs generate all
 *   node scripts/generate-catalog-hero.cjs list
 */

require('dotenv').config({ path: '.env.local' });

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Load from env or use fallback (same pattern as generate-carousel-gpt-image.cjs)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const OUTPUT_DIR = path.join(__dirname, '../generated-images/catalog-hero');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Hero image variants - different compositions of multiple sports cars
 */
const HERO_VARIANTS = {
  courtyard: {
    filename: 'catalog-hero-courtyard.png',
    description: 'Elegant courtyard gathering - 9 sports cars on cobblestone',
    prompt: `A stunning photograph from an elevated perspective looking down at exactly 9 premium sports cars arranged artfully on an elegant European-style cobblestone courtyard. 

The 9 cars should include this EXACT variety of recognizable shapes:
- A silver Porsche 911 (iconic round headlights, sloping rear)
- A red Chevrolet Corvette C8 (mid-engine, angular and modern)
- A yellow Porsche 718 Cayman (compact, mid-engine sports car)
- A blue BMW M4 coupe (long hood, muscular fenders)
- A white Ford Mustang GT (classic muscle car proportions)
- A black Nissan GT-R (aggressive Japanese supercar)
- A red Mazda Miata MX-5 (small, cute roadster)
- A silver Mercedes-AMG GT (long hood, dramatic curves)
- A green Lotus (lightweight, compact British sports car)

The cars are arranged in 3 loose rows facing different directions, creating visual interest. The setting is a luxury venue courtyard with lush green trees and manicured hedges forming a natural backdrop. Beautiful dappled golden afternoon sunlight creates warm tones and gentle shadows. 

The atmosphere is aspirational yet welcoming - this is a curated collection of attainable enthusiast cars, not an exotic hypercar show. Shot with professional automotive photography quality, sharp focus on all vehicles, natural outdoor lighting. The image invites viewers to browse and discover their perfect car. Ultra high resolution, photorealistic.`
  },

  parking: {
    filename: 'catalog-hero-parking.png',
    description: 'Premium parking structure - dramatic angle of 9 cars',
    prompt: `A cinematic photograph of exactly 9 sports cars parked in a modern, clean parking structure with dramatic architectural lighting. Shot from a slightly elevated angle showing the cars arranged in a visually pleasing pattern.

The 9 cars should include:
- A Guards Red Porsche 911 GT3
- A Torch Red Chevrolet Corvette Stingray
- A Velocity Blue Ford Mustang
- A Alpine White BMW M2
- A Soul Red Mazda MX-5 Miata
- A Gunmetal Grey Nissan 370Z
- A Racing Yellow Porsche Cayman
- A Apex Blue Subaru BRZ
- A Black Honda Civic Type R

The parking structure has clean white concrete walls, modern LED lighting creating soft illumination, and large window openings letting in natural light. The cars are positioned at slight angles to each other, showcasing their profiles. 

The mood is sophisticated and modern - like a premium car showroom or private collection. Professional automotive photography, sharp details, balanced exposure showing each car clearly. Ultra high resolution, photorealistic.`
  },

  mansion: {
    filename: 'catalog-hero-mansion.png',
    description: 'Mansion driveway - prestigious gathering of 9 sports cars',
    prompt: `An aerial-view photograph of exactly 9 beautiful sports cars arranged on a circular mansion driveway made of cream-colored brick. The setting is an elegant estate with manicured green lawns and sculpted hedges visible at the edges.

The 9 cars positioned around the circular driveway:
- Porsche 911 Carrera in GT Silver
- Chevrolet Corvette Z06 in Rapid Blue
- BMW M4 in Isle of Man Green
- Ford Mustang GT in Orange Fury
- Nissan GT-R in Pearl White
- Audi R8 in Nardo Grey
- Lotus Evora in British Racing Green
- Mercedes-AMG C63 in Obsidian Black
- Toyota GR Supra in Renaissance Red

Golden hour lighting bathes the scene in warm light, creating long shadows and a luxurious atmosphere. Some cars face inward toward a central fountain, others face outward showing their front fascias. 

The composition feels like a private car collection gathering - prestigious but approachable, featuring attainable dream cars. Shot with professional photography quality from drone perspective, ultra-sharp detail on each vehicle. Photorealistic, high resolution.`
  },

  trackday: {
    filename: 'catalog-hero-trackday.png',
    description: 'Track paddock - 9 sports cars ready for action',
    prompt: `A dynamic photograph of exactly 9 sports cars gathered in a racetrack paddock area, captured from an elevated position. The scene shows the excitement of a track day event with the cars positioned ready for action.

The 9 cars in the paddock:
- Red Porsche 718 Cayman GT4 with front splitter
- Yellow Chevrolet Corvette Z06
- Blue Ford Mustang GT350 with racing stripes
- White BMW M2 Competition
- Black Nissan GT-R
- Orange Mazda MX-5 Miata
- Grey Porsche 911 GT3
- Green Lotus Exige
- Red Honda Civic Type R with rear wing

The paddock has clean asphalt, white pit lane markings visible, and track fencing in the background. Blue sky with some clouds, bright daylight creating crisp shadows. Some cars have their hoods open, drivers milling about (small, not the focus).

The atmosphere is energetic and enthusiast-focused - these are regular people's cars at an amateur track day, not professional racing. Professional sports photography quality, action-ready feel, high resolution and sharp detail on all vehicles.`
  },

  coastal: {
    filename: 'catalog-hero-coastal.png', 
    description: 'Coastal overlook - 9 sports cars with ocean backdrop',
    prompt: `A breathtaking photograph of exactly 9 sports cars parked at a scenic coastal overlook at golden hour. The Pacific Ocean is visible in the background with dramatic cliffs and the sun creating warm golden light.

The 9 cars arranged in a loose group on the gravel overlook:
- Silver Porsche 911 Turbo
- Red Chevrolet Corvette C7 Grand Sport
- Blue Porsche 718 Boxster (convertible top down)
- White BMW M3
- Yellow Mazda MX-5 Miata (top down)
- Black Dodge Challenger Hellcat
- Grey Aston Martin Vantage
- Green Jaguar F-Type
- Orange Toyota Supra

The cars are positioned casually as if their owners stopped here together to enjoy the view during a group drive. Ocean breeze, coastal vegetation, guard rail with ocean vista beyond. 

The mood is aspirational and adventurous - capturing the lifestyle of sports car ownership, the drives and experiences. Stunning sunset colors reflecting off the car paint. Porsche press photo quality, cinematic composition, photorealistic detail.`
  }
};

/**
 * Generate a single hero image variant
 */
async function generateVariant(variantId) {
  const variant = HERO_VARIANTS[variantId];
  if (!variant) {
    console.error(`❌ Unknown variant: ${variantId}`);
    console.log('Available variants:', Object.keys(HERO_VARIANTS).join(', '));
    return null;
  }

  console.log(`\n🎨 Generating: ${variantId}`);
  console.log(`   Description: ${variant.description}`);
  console.log(`   Prompt length: ${variant.prompt.length} chars`);

  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: variant.prompt,
      n: 1,
      size: '1536x1024', // 3:2 aspect ratio, high resolution
      quality: 'high',
    });

    let outputBuffer;
    if (response.data[0].b64_json) {
      outputBuffer = Buffer.from(response.data[0].b64_json, 'base64');
    } else if (response.data[0].url) {
      // Download from URL
      const https = require('https');
      outputBuffer = await new Promise((resolve, reject) => {
        https.get(response.data[0].url, (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });
    }

    const outputPath = path.join(OUTPUT_DIR, variant.filename);
    fs.writeFileSync(outputPath, outputBuffer);

    console.log(`✅ Saved: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error(`❌ Generation failed: ${error.message}`);
    if (error.response?.data) {
      console.error('   API response:', JSON.stringify(error.response.data));
    }
    return null;
  }
}

/**
 * Generate all variants
 */
async function generateAll() {
  console.log('\n🚀 Generating all catalog hero variants...\n');
  
  const results = { success: [], failed: [] };
  const variantIds = Object.keys(HERO_VARIANTS);

  for (let i = 0; i < variantIds.length; i++) {
    const variantId = variantIds[i];
    console.log(`\n📍 Progress: ${i + 1}/${variantIds.length}`);
    
    const result = await generateVariant(variantId);
    if (result) {
      results.success.push(variantId);
    } else {
      results.failed.push(variantId);
    }

    // Rate limit delay between generations
    if (i < variantIds.length - 1) {
      console.log('⏳ Waiting 5 seconds before next generation...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.success.length > 0) {
    console.log(`\n📁 Output directory: ${OUTPUT_DIR}`);
    console.log('\n🖼️  Generated images:');
    results.success.forEach(id => {
      console.log(`   - ${HERO_VARIANTS[id].filename}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed variants:');
    results.failed.forEach(id => console.log(`   - ${id}`));
  }

  return results;
}

/**
 * List all available variants
 */
function listVariants() {
  console.log('\n📋 Available Catalog Hero Variants\n');
  console.log('='.repeat(60));
  
  Object.entries(HERO_VARIANTS).forEach(([id, variant]) => {
    const outputPath = path.join(OUTPUT_DIR, variant.filename);
    const exists = fs.existsSync(outputPath);
    const status = exists ? '✅' : '⬜';
    
    console.log(`${status} ${id}`);
    console.log(`   File: ${variant.filename}`);
    console.log(`   Desc: ${variant.description}`);
    console.log('');
  });
  
  console.log(`Total: ${Object.keys(HERO_VARIANTS).length} variants`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
}

// Main CLI
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  if (!command) {
    console.log(`
🖼️  Car Catalog Hero Image Generator

Uses OpenAI's gpt-image-1 to create high-quality hero images
for the car catalog page featuring multiple sports cars.

Usage:
  node scripts/generate-catalog-hero.cjs <command> [args]

Commands:
  list                    List all available variants
  generate <variant>      Generate a specific variant
  generate all            Generate all variants

Variants:
${Object.entries(HERO_VARIANTS).map(([id, v]) => `  - ${id}: ${v.description}`).join('\n')}

Example:
  node scripts/generate-catalog-hero.cjs generate courtyard
  node scripts/generate-catalog-hero.cjs generate all
`);
    return;
  }

  switch (command) {
    case 'list':
      listVariants();
      break;

    case 'generate':
      if (!arg) {
        console.error('❌ Please specify a variant or "all"');
        console.log('Run with no arguments to see available variants');
        return;
      }
      
      if (arg === 'all') {
        await generateAll();
      } else {
        await generateVariant(arg);
      }
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run with no arguments to see usage');
  }
}

main().catch(console.error);
