/**
 * Quick test script for gpt-image-1 image editing
 * Tests the reference image approach with a single car
 */

require('dotenv').config({ path: '.env.local' });

const OpenAI = require('openai');
const { toFile } = require('openai');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Use env variable or fallback (same as generate-carousel-dalle.cjs)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const OUTPUT_DIR = path.join(__dirname, '../generated-images/gpt-image-test');
const REFERENCE_IMAGE = path.join(__dirname, '../generated-images/c7-corvette-z06-dramatic-side.jpg');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function testEditWithoutMask() {
  console.log('\n🧪 Test 1: Edit WITHOUT mask');
  console.log('   (Let gpt-image-1 understand context and replace the car)\n');
  
  // Prepare reference image as PNG
  const preparedPath = path.join(OUTPUT_DIR, 'reference.png');
  await sharp(REFERENCE_IMAGE)
    .resize(1536, 1024, { fit: 'cover' })
    .png()
    .toFile(preparedPath);
  
  console.log(`   Reference prepared: ${preparedPath}`);
  
  const prompt = `Replace the Corvette in this image with a 2020 Porsche 718 Cayman GT4 with large fixed rear wing.

Keep EXACTLY the same:
- Pure black studio background
- Dark polished floor with subtle car reflection
- Subtle silver rim lighting on the car's silhouette
- Perfect side profile camera angle, car facing left
- Same car position and scale (car centered, ~60% of frame width)
- Dark, moody, dramatic atmosphere

The Cayman GT4 should be dark grey with subtle silver rim light highlights. Photorealistic automotive photography.`;

  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
  
  try {
    // Create proper file object with mime type
    const imageFile = await toFile(fs.readFileSync(preparedPath), 'reference.png', { type: 'image/png' });
    
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: '1536x1024',
    });
    
    console.log('   ✅ API call successful');
    
    let outputBuffer;
    if (response.data[0].b64_json) {
      console.log('   Response format: base64');
      outputBuffer = Buffer.from(response.data[0].b64_json, 'base64');
    } else if (response.data[0].url) {
      console.log(`   Response format: URL`);
      outputBuffer = await downloadImage(response.data[0].url);
    }
    
    const outputPath = path.join(OUTPUT_DIR, 'test-no-mask-cayman-gt4.png');
    await sharp(outputBuffer).png().toFile(outputPath);
    console.log(`   ✅ Saved: ${outputPath}`);
    
    return { success: true, path: outputPath };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    if (error.error) {
      console.error(`   Details: ${JSON.stringify(error.error)}`);
    }
    return { success: false, error: error.message };
  }
}

async function testEditWithMask() {
  console.log('\n🧪 Test 2: Edit WITH mask');
  console.log('   (Explicitly mask the car area for replacement)\n');
  
  // Prepare reference image
  const preparedPath = path.join(OUTPUT_DIR, 'reference.png');
  await sharp(REFERENCE_IMAGE)
    .resize(1536, 1024, { fit: 'cover' })
    .png()
    .toFile(preparedPath);
  
  // Create mask (ellipse covering car area)
  const maskPath = path.join(OUTPUT_DIR, 'mask.png');
  const width = 1536;
  const height = 1024;
  
  // Car bounds based on reference image analysis
  const carCenterX = width * 0.5;
  const carCenterY = height * 0.52;
  const carRadiusX = width * 0.42;
  const carRadiusY = height * 0.32;
  
  // Create RGBA mask where transparent = edit area
  const maskSvg = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      <ellipse cx="${carCenterX}" cy="${carCenterY}" rx="${carRadiusX}" ry="${carRadiusY}" fill="black"/>
    </svg>
  `;
  
  // Convert SVG to PNG with alpha channel
  const rawMask = await sharp(Buffer.from(maskSvg))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const pixels = new Uint8Array(rawMask.data);
  
  // Black -> transparent, White -> opaque
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] < 128) {
      pixels[i] = 0;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 0; // Transparent
    } else {
      pixels[i + 3] = 255; // Opaque
    }
  }
  
  await sharp(pixels, {
    raw: { width: rawMask.info.width, height: rawMask.info.height, channels: 4 }
  }).png().toFile(maskPath);
  
  console.log(`   Mask created: ${maskPath}`);
  
  const prompt = `A 2023 Lotus Emira sports car with flowing organic curves, compact mid-engine proportions.

The car should:
- Be dark grey/matte black colored
- Have subtle silver rim lighting on the silhouette edges
- Be in perfect side profile, facing left
- Match the scale and position of the original car

Photorealistic automotive studio photography with dramatic moody lighting.`;

  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
  
  try {
    // Create proper file objects with mime type
    const imageFile = await toFile(fs.readFileSync(preparedPath), 'reference.png', { type: 'image/png' });
    const maskFile = await toFile(fs.readFileSync(maskPath), 'mask.png', { type: 'image/png' });
    
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      mask: maskFile,
      prompt: prompt,
      n: 1,
      size: '1536x1024',
    });
    
    console.log('   ✅ API call successful');
    
    let outputBuffer;
    if (response.data[0].b64_json) {
      outputBuffer = Buffer.from(response.data[0].b64_json, 'base64');
    } else if (response.data[0].url) {
      outputBuffer = await downloadImage(response.data[0].url);
    }
    
    const outputPath = path.join(OUTPUT_DIR, 'test-with-mask-emira.png');
    await sharp(outputBuffer).png().toFile(outputPath);
    console.log(`   ✅ Saved: ${outputPath}`);
    
    return { success: true, path: outputPath };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    if (error.error) {
      console.error(`   Details: ${JSON.stringify(error.error)}`);
    }
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     GPT-Image-1 Reference Image Test                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  if (!fs.existsSync(REFERENCE_IMAGE)) {
    console.error(`\n❌ Reference image not found: ${REFERENCE_IMAGE}`);
    console.log('   Please ensure c7-corvette-z06-dramatic-side.jpg exists in generated-images/');
    return;
  }
  
  console.log(`\n📸 Reference image: ${REFERENCE_IMAGE}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  
  // Run tests
  const result1 = await testEditWithoutMask();
  
  // Wait between tests
  console.log('\n   Waiting 5 seconds before next test...');
  await new Promise(r => setTimeout(r, 5000));
  
  const result2 = await testEditWithMask();
  
  // Summary
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('                        RESULTS SUMMARY');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`Test 1 (No Mask):   ${result1.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Test 2 (With Mask): ${result2.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log('\n📁 Check output at:', OUTPUT_DIR);
  console.log('════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
