/**
 * Article Image Service
 * 
 * Generates AI images for articles using Google Gemini.
 * Uses the optimized approach from clean-regenerate-article-images.mjs
 * that produces fantastic, realistic automotive photography.
 * 
 * Key features:
 *   - Environment diversity (no repetitive mountain overlooks)
 *   - Specific car models with colors for realistic rendering
 *   - Anti-CGI instructions for photorealistic output
 *   - Canon R5 camera specification for documentary style
 * 
 * @module lib/articleImageService
 */

import { put } from '@vercel/blob';

// =============================================================================
// CONFIGURATION
// =============================================================================

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

// Use the model that produces the best results
const MODEL_NAME = 'gemini-2.0-flash-exp-image-generation';

// Image generation settings
const IMAGE_CONFIG = {
  hero: { aspectRatio: '16:9', imageSize: '2K' },
  inline: { aspectRatio: '16:9', imageSize: '2K' },
  detail: { aspectRatio: '1:1', imageSize: '1K' },
};

// Number of inline images to generate per article
const INLINE_IMAGES_COUNT = 3;

// =============================================================================
// ENVIRONMENT DIVERSITY - Different settings for variety
// =============================================================================

const ENVIRONMENTS = {
  comparisons: [
    'at a scenic mountain overlook with blue sky',
    'in an empty parking garage with concrete pillars',
    'on a coastal highway with ocean visible',
    'at a cars and coffee event with other vehicles blurred in background',
    'at a track day paddock area',
    'in front of a modern car dealership',
    'on a desert highway at golden hour',
    'in an industrial area with brick warehouses',
  ],
  technical: [
    'inside a well-lit professional garage',
    'in a clean workshop with tools visible',
    'at a tuning shop with dyno in background',
    'at a race team garage',
    'in a home garage with lift',
  ],
  enthusiast: [
    'at a classic car show on green grass',
    'in a vintage gas station setting',
    'at a drive-in movie theater parking lot',
    'at a European countryside road',
    'at an American diner parking lot',
    'at a Japanese touge mountain road',
  ],
  // Pit Lane - humor and fun articles
  pitlane: [
    'in a quirky vintage gas station with retro signs',
    'at a colorful roadside diner parking lot',
    'in front of a funky mural-covered wall',
    'at a casual backyard BBQ setting',
    'in a classic American drive-in movie theater',
    'at a nostalgic Route 66 roadside attraction',
    'in a playful urban alley with street art',
    'at a lively food truck gathering',
  ],
};

// Track used environments for diversity within a batch
let usedEnvironmentIndex = 0;

// =============================================================================
// SUBJECT EXTRACTION - Specific car models with colors
// =============================================================================

/**
 * Get the specific subject (car models with colors) for an article
 * This is the KEY to getting realistic, specific images instead of generic renders
 */
function getSubjectForArticle(article) {
  const title = article.title.toLowerCase();
  
  // Head-to-head comparisons - specific models and colors
  if (title.includes('mustang') && title.includes('camaro')) {
    return 'A red Ford Mustang GT and a yellow Chevrolet Camaro SS parked side by side';
  }
  if (title.includes('supra') && title.includes('nissan z')) {
    return 'A white Toyota GR Supra and an orange Nissan Z parked together';
  }
  if (title.includes('porsche 911') && title.includes('corvette')) {
    return 'A silver Porsche 911 and a red Chevrolet Corvette C8 parked together';
  }
  if (title.includes('m3') && title.includes('c63')) {
    return 'A blue BMW M3 G80 and a gray Mercedes-AMG C63 sedan parked side by side';
  }
  if (title.includes('rs3') && title.includes('m2')) {
    return 'A Nardo gray Audi RS3 and a blue BMW M2 parked together';
  }
  if (title.includes('miata') && title.includes('gr86') && title.includes('brz')) {
    return 'A red Mazda MX-5 Miata, a blue Toyota GR86, and a white Subaru BRZ';
  }
  if (title.includes('electric') && title.includes('gas')) {
    return 'A Tesla Model S Plaid and a Porsche 911 GT3 parked side by side';
  }
  
  // Budget articles - NEW cars
  if (title.includes('new') && title.includes('under') && title.includes('50')) {
    return 'A blue Toyota GR86, a red Mazda MX-5 Miata, and a yellow Ford Mustang EcoBoost';
  }
  if (title.includes('new') && title.includes('under') && title.includes('40')) {
    return 'A white Subaru BRZ, a red Mazda MX-5 Miata ND, and a gray Honda Civic Si';
  }
  if (title.includes('first sports car') || title.includes('first car')) {
    return 'A clean blue Mazda MX-5 Miata ND parked in a residential driveway';
  }
  
  // Budget articles - generic (use affordable cars)
  const priceMatch = title.match(/under\s*\$?(\d+)k?/i) || title.match(/\$?(\d+)k?\s*budget/i);
  if (priceMatch) {
    const maxPrice = parseInt(priceMatch[1]) * (priceMatch[1].length <= 3 ? 1000 : 1);
    if (maxPrice <= 30000) {
      return 'A red Mazda MX-5 Miata and a blue Toyota GR86 parked together, affordable sports cars';
    } else if (maxPrice <= 50000) {
      return 'A blue Toyota GR86, a red Mazda MX-5 Miata, and a yellow Ford Mustang EcoBoost';
    } else if (maxPrice <= 75000) {
      return 'A blue BMW M240i and a red Chevrolet Corvette Stingray parked together';
    } else if (maxPrice <= 100000) {
      return 'A silver Porsche 911 Carrera and a red Chevrolet Corvette Z06 parked together';
    }
  }
  
  // Technical articles
  if (title.includes('exhaust')) {
    return 'A modified sports car with visible aftermarket exhaust system, rear quarter view';
  }
  if (title.includes('brake')) {
    return 'Close-up of a sports car wheel showing large red brake calipers behind forged wheels';
  }
  if (title.includes('intake') || title.includes('cold air')) {
    return 'Engine bay of a sports car showing a polished cold air intake system';
  }
  if (title.includes('suspension') || title.includes('coilover')) {
    return 'A lowered sports car showing coilover suspension, wheel and fender gap visible';
  }
  if (title.includes('ecu') || title.includes('tuning')) {
    return 'A sports car on a dyno with laptop showing tuning software';
  }
  if (title.includes('dyno')) {
    return 'A sports car strapped to a Dynojet dyno with technician monitoring';
  }
  if (title.includes('turbo') || title.includes('supercharger') || title.includes('forced induction')) {
    return 'Engine bay showing a turbocharger with polished piping and intercooler';
  }
  if (title.includes('wheel') || title.includes('tire')) {
    return 'A sports car wheel close-up showing premium alloy wheel with performance tire sidewall visible';
  }
  if (title.includes('oil')) {
    return 'Close-up of engine oil being poured into a sports car engine';
  }
  
  // Culture articles
  if (title.includes('jdm')) {
    return 'A group of Japanese sports cars including a Nissan Skyline GT-R, Toyota Supra, and Honda NSX';
  }
  if (title.includes('nurburgring') || title.includes('nürburgring')) {
    return 'A Porsche 911 GT3 driving on the Nürburgring Nordschleife with green forest in background';
  }
  if (title.includes('car meet') || title.includes('cars and coffee')) {
    return 'A diverse group of sports cars gathered at a morning car meet';
  }
  if (title.includes('barn find')) {
    return 'A dusty classic Porsche 911 in an old barn with sunlight streaming through wooden slats';
  }
  if (title.includes('history') && title.includes('911')) {
    return 'A classic air-cooled Porsche 911 in silver parked on a European cobblestone street';
  }
  if (title.includes('manual transmission') || title.includes('manual')) {
    return 'Interior shot of a sports car showing manual gear shifter and pedals';
  }
  if (title.includes('movie') || title.includes('film')) {
    return 'Iconic sports cars from famous movies including a silver Aston Martin DB5';
  }
  if (title.includes('electric') && title.includes('future')) {
    return 'A Porsche Taycan and BMW i4 M50 parked at a charging station';
  }
  if (title.includes('photography') || title.includes('photo')) {
    return 'A photographer with camera tripod shooting a sports car at golden hour';
  }
  if (title.includes('detailing')) {
    return 'A freshly detailed sports car with perfect paint showing reflections';
  }
  
  // Pit Lane - specific articles
  if (title.includes('forum') && title.includes('troll')) {
    return 'A car enthusiast looking bemused at a laptop, surrounded by model cars and posters, with a coffee mug nearby';
  }
  if (title.includes('cars could talk') || title.includes('parking lot drama')) {
    return 'A colorful parking lot scene with a red Ford Mustang, white Tesla Model 3, and blue Honda Civic parked near each other';
  }
  if (title.includes('excuses') && title.includes('buying another car')) {
    return 'A proud car enthusiast showing a new red sports car to a skeptical spouse in a suburban driveway with garage visible';
  }
  if (title.includes('car show') && title.includes('personalities')) {
    return 'A busy cars and coffee event with diverse vehicles including a Miata, lifted truck, and Porsche, with enthusiasts gathered';
  }
  if (title.includes('project car') && (title.includes('grief') || title.includes('stages'))) {
    return 'A classic project car on jackstands in a home garage with tools scattered and an overwhelmed owner standing nearby';
  }
  if (title.includes('mechanic') && title.includes('mean')) {
    return 'A mechanic looking under a car hood with a concerned expression while the car owner watches nervously nearby';
  }
  if (title.includes('car people') && title.includes('normal')) {
    return 'A car enthusiast taking photos of a stranger\'s sports car in a parking lot while regular people walk by confused';
  }
  if (title.includes('dealership') && title.includes('survival')) {
    return 'A confident car buyer at a dealership desk with a salesperson, looking calm and prepared with paperwork';
  }
  if (title.includes('rivalries') && title.includes('high school')) {
    return 'A lineup of sports cars in a parking lot - Mustang, Camaro, Porsche 911, Corvette - as if at a high school gathering';
  }
  if (title.includes('check engine light')) {
    return 'A close-up of a car dashboard with an illuminated amber check engine light, with driver\'s hand on steering wheel';
  }
  
  // Pit Lane - general humor categories
  if (title.includes('worst') || title.includes('terrible') || title.includes('fail')) {
    return 'A quirky vintage car with character flaws, parked at a colorful location';
  }
  if (title.includes('weird') || title.includes('strange') || title.includes('unusual')) {
    return 'An unusual or quirky sports car in an unexpected setting';
  }
  if (title.includes('excuse') || title.includes('justify') || title.includes('convince')) {
    return 'A sports car owner proudly showing off their car to skeptical friends';
  }
  if (title.includes('zodiac') || title.includes('personality') || title.includes('type')) {
    return 'A diverse lineup of different sports cars representing different personalities';
  }
  if (title.includes('dad') || title.includes('parent')) {
    return 'A family-friendly sports car in a suburban driveway setting';
  }
  if (title.includes('date') || title.includes('impress')) {
    return 'A sleek sports car parked outside an upscale restaurant at night';
  }
  if (title.includes('broke') || title.includes('cheap') || title.includes('poor')) {
    return 'An older but beloved sports car that has seen better days';
  }
  if (title.includes('meme') || title.includes('internet')) {
    return 'A popular sports car that has become an internet icon';
  }
  if (title.includes('annoying') || title.includes('hate')) {
    return 'A group of car enthusiasts having an animated discussion about cars';
  }
  if (title.includes('dream') || title.includes('fantasy') || title.includes('wish')) {
    return 'A stunning exotic car in a dreamy, aspirational setting';
  }
  
  // Use car_slugs if available to build specific subject
  if (article.car_slugs && article.car_slugs.length > 0) {
    const carNames = article.car_slugs.slice(0, 2).map(slug => {
      // Convert slug to readable name
      return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    });
    
    if (carNames.length === 1) {
      return `A ${carNames[0]} in a scenic outdoor setting`;
    } else {
      return `A ${carNames[0]} and a ${carNames[1]} parked together`;
    }
  }
  
  // Default
  return 'A modern sports car in a scenic outdoor setting';
}

// =============================================================================
// PROMPT GENERATION - Optimized for realism
// =============================================================================

/**
 * Generate an optimized prompt for article hero image
 * Uses the same approach as clean-regenerate-article-images.mjs
 * 
 * @param {Object} article - Article data
 * @param {number} environmentIndex - Index for environment diversity
 * @returns {string} - Image generation prompt
 */
export function generateImagePrompt(article, environmentIndex = null) {
  const category = article.category || 'comparisons';
  
  // Select environment based on category with diversity
  const envList = ENVIRONMENTS[category] || ENVIRONMENTS.comparisons;
  const envIndex = environmentIndex !== null ? environmentIndex : usedEnvironmentIndex++;
  const environment = envList[envIndex % envList.length];
  
  // Get specific subject for this article
  const subject = getSubjectForArticle(article);
  
  // Camera and realism specifications
  const cameraSpec = 'Shot on Canon EOS R5, 24-70mm f/2.8 lens';
  const lighting = 'natural daylight, soft shadows';
  const style = 'editorial automotive photography, documentary style';
  
  const prompt = `${subject} ${environment}. ${cameraSpec}, ${lighting}. ${style}.

CRITICAL REQUIREMENTS:
1. Show the COMPLETE car(s) - NO cropping at all
2. All wheels, bumpers, headlights, and taillights fully visible
3. Realistic camera distance of 15-25 feet away
4. Real outdoor environment with visible sky and natural surroundings
5. Natural imperfections: realistic reflections, subtle road dust
6. This must look like a REAL PHOTOGRAPH, not a render

ABSOLUTELY AVOID:
- Dark studio backgrounds with reflective floors
- CGI or 3D render appearance
- Overly saturated or HDR look
- Impossibly perfect chrome reflections
- Any text, watermarks, or license plate text
- Dramatic cinematic lighting
- Video game graphics style`;

  return prompt;
}

// =============================================================================
// INLINE IMAGE PROMPTS
// =============================================================================

/**
 * Generate prompts for inline images (different perspectives/contexts)
 * 
 * @param {Object} article - Article data
 * @param {number} count - Number of inline images to generate
 * @returns {Array<{prompt: string, alt: string, position: number}>}
 */
export function generateInlineImagePrompts(article, count = INLINE_IMAGES_COUNT) {
  const category = article.category || 'comparisons';
  const subject = getSubjectForArticle(article).replace(/^A /, '').replace(/parked.*$/, '').trim();
  
  const inlineContexts = {
    comparisons: [
      { context: 'interior cockpit view, natural light through windows', style: 'documentary interior shot' },
      { context: 'rear 3/4 angle showing exhaust and taillights', style: 'editorial car photography' },
      { context: 'side profile showing body lines', style: 'automotive portrait' },
      { context: 'detail shot of badge or grille', style: 'macro automotive detail' },
    ],
    enthusiast: [
      { context: 'POV from driver seat looking at dashboard and road', style: 'driving experience shot' },
      { context: 'enthusiasts chatting near the car at a meet', style: 'candid documentary' },
      { context: 'open hood with owner inspecting', style: 'lifestyle automotive' },
      { context: 'row of similar cars at an event', style: 'community gathering' },
    ],
    technical: [
      { context: 'hands working on engine bay component', style: 'how-to instructional' },
      { context: 'undercarriage detail on lift', style: 'technical documentation' },
      { context: 'tool being used on car part', style: 'DIY tutorial' },
      { context: 'before/after comparison on bench', style: 'product documentation' },
    ],
    // Pit Lane - playful, fun perspectives
    pitlane: [
      { context: 'candid shot of friends laughing near the car', style: 'lifestyle candid' },
      { context: 'quirky angle showing car personality', style: 'playful automotive' },
      { context: 'owner giving thumbs up next to their car', style: 'authentic enthusiast moment' },
      { context: 'fun detail like bumper sticker or personalization', style: 'character detail shot' },
    ],
  };
  
  const contexts = inlineContexts[category] || inlineContexts.comparisons;
  const prompts = [];
  
  for (let i = 0; i < Math.min(count, contexts.length); i++) {
    const ctx = contexts[i];
    const prompt = `${subject}, ${ctx.context}. Shot on Canon EOS R5, ${ctx.style}. 
Real photograph, not CGI. Natural lighting.

AVOID: Studio backgrounds, CGI appearance, text, watermarks.`;
    
    prompts.push({
      prompt,
      alt: `${subject} - ${ctx.context.split(',')[0]}`,
      position: i + 1,
    });
  }
  
  return prompts;
}

// =============================================================================
// IMAGE GENERATION (Google Gemini)
// =============================================================================

/**
 * Core function to generate a single image using Google Gemini
 * 
 * @param {string} prompt - The image generation prompt
 * @param {Object} config - Image configuration (aspectRatio, imageSize)
 * @returns {Promise<{success: boolean, imageBuffer?: Buffer, mimeType?: string, error?: string}>}
 */
async function generateImageWithGemini(prompt, _config = IMAGE_CONFIG.hero) {
  if (!GOOGLE_AI_API_KEY) {
    return { success: false, error: 'GOOGLE_AI_API_KEY not configured' };
  }
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GOOGLE_AI_API_KEY}`;
    
    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ArticleImage] API Error:', errorText.substring(0, 200));
      return { success: false, error: `Google API error: ${response.status}` };
    }
    
    const data = await response.json();
    
    // Extract image from response
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(part => part.inlineData?.mimeType?.startsWith('image/'));
    
    if (!imagePart) {
      return { success: false, error: 'No image in response' };
    }
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    
    return { 
      success: true, 
      imageBuffer,
      mimeType: imagePart.inlineData.mimeType,
    };
  } catch (error) {
    console.error('[ArticleImage] Generation error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate hero image for an article using Google Gemini
 * 
 * @param {Object} article - Article data with title, category, car_slugs
 * @returns {Promise<{success: boolean, imageUrl?: string, imageBuffer?: Buffer, error?: string}>}
 */
export async function generateArticleImage(article) {
  const prompt = generateImagePrompt(article);
  console.log(`[ArticleImage] Generating hero for: ${article.title}`);
  console.log(`[ArticleImage] Model: ${MODEL_NAME}`);
  console.log(`[ArticleImage] Prompt: ${prompt.substring(0, 150)}...`);
  
  const result = await generateImageWithGemini(prompt, IMAGE_CONFIG.hero);
  
  if (result.success) {
    console.log(`[ArticleImage] Generated hero: ${result.imageBuffer.length} bytes`);
    return { ...result, prompt };
  }
  
  return result;
}

/**
 * Upload generated image to Vercel Blob
 * 
 * @param {Buffer} imageBuffer - Image data
 * @param {string} articleSlug - Article slug for naming
 * @param {string} filename - Filename (e.g., 'hero', 'inline-1')
 * @param {string} mimeType - Image mime type
 * @returns {Promise<{success: boolean, blobUrl?: string, error?: string}>}
 */
export async function uploadToBlob(imageBuffer, articleSlug, filename = 'hero', mimeType = 'image/png') {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { success: false, error: 'BLOB_READ_WRITE_TOKEN not configured' };
  }
  
  try {
    // Determine extension from mime type
    const ext = mimeType.includes('webp') ? 'webp' : mimeType.includes('jpeg') ? 'jpg' : 'png';
    
    // Add timestamp to filename to ensure uniqueness and cache-busting
    const timestamp = Date.now();
    
    // Upload to Vercel Blob
    const blob = await put(`articles/${articleSlug}/${filename}-${timestamp}.${ext}`, imageBuffer, {
      access: 'public',
      contentType: mimeType,
    });
    
    console.log(`[ArticleImage] Uploaded ${filename}: ${blob.url.substring(0, 60)}...`);
    return { success: true, blobUrl: blob.url };
  } catch (error) {
    console.error('[ArticleImage] Upload error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate and upload hero image for an article
 * Complete workflow: generate -> upload -> return URL
 * 
 * @param {Object} article - Article data
 * @returns {Promise<{success: boolean, imageUrl?: string, error?: string}>}
 */
export async function createArticleHeroImage(article) {
  // Generate the image
  const genResult = await generateArticleImage(article);
  if (!genResult.success) {
    return genResult;
  }
  
  // Upload to Vercel Blob
  const uploadResult = await uploadToBlob(
    genResult.imageBuffer, 
    article.slug,
    'hero',
    genResult.mimeType
  );
  
  if (!uploadResult.success) {
    return { success: false, error: uploadResult.error };
  }
  
  return { success: true, imageUrl: uploadResult.blobUrl };
}

/**
 * Generate and upload inline images for an article
 * Creates 3 additional images with different perspectives
 * 
 * @param {Object} article - Article data
 * @param {number} count - Number of inline images (default: 3)
 * @param {number} delayMs - Delay between API calls (default: 5000ms)
 * @returns {Promise<{success: boolean, images?: Array, error?: string}>}
 */
export async function createArticleInlineImages(article, count = INLINE_IMAGES_COUNT, delayMs = 5000) {
  const prompts = generateInlineImagePrompts(article, count);
  const images = [];
  
  for (let i = 0; i < prompts.length; i++) {
    const { prompt, alt, position } = prompts[i];
    
    console.log(`[ArticleImage] Generating inline ${position}/${prompts.length} for: ${article.slug}`);
    
    // Generate image
    const genResult = await generateImageWithGemini(prompt, IMAGE_CONFIG.inline);
    
    if (!genResult.success) {
      console.error(`[ArticleImage] Failed inline ${position}: ${genResult.error}`);
      continue; // Continue with other images even if one fails
    }
    
    // Upload to blob
    const uploadResult = await uploadToBlob(
      genResult.imageBuffer,
      article.slug,
      `inline-${position}`,
      genResult.mimeType
    );
    
    if (uploadResult.success) {
      images.push({
        url: uploadResult.blobUrl,
        alt,
        position,
        caption: null, // Can be set manually later
      });
    }
    
    // Delay between requests to avoid rate limiting
    if (i < prompts.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return {
    success: images.length > 0,
    images,
    generated: images.length,
    requested: count,
  };
}

/**
 * Generate all images for an article (hero + inline)
 * Creates 4-5 images total with appropriate delays
 * 
 * @param {Object} article - Article data
 * @param {Object} options - Options like delayMs
 * @returns {Promise<{success: boolean, heroUrl?: string, inlineImages?: Array, error?: string}>}
 */
export async function createAllArticleImages(article, options = {}) {
  const { delayMs = 5000, inlineCount = INLINE_IMAGES_COUNT } = options;
  
  console.log(`[ArticleImage] Creating all images for: ${article.title}`);
  
  // 1. Generate hero image first
  const heroResult = await createArticleHeroImage(article);
  
  if (!heroResult.success) {
    return { 
      success: false, 
      error: `Hero image failed: ${heroResult.error}` 
    };
  }
  
  // Wait before starting inline images
  await new Promise(resolve => setTimeout(resolve, delayMs));
  
  // 2. Generate inline images
  const inlineResult = await createArticleInlineImages(article, inlineCount, delayMs);
  
  return {
    success: true,
    heroUrl: heroResult.imageUrl,
    inlineImages: inlineResult.images || [],
    totalGenerated: 1 + (inlineResult.generated || 0),
  };
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Generate images for multiple articles
 * 
 * @param {Array} articles - Array of article objects
 * @param {Object} options - Options like delay between requests
 * @returns {Promise<Array>} - Results for each article
 */
export async function batchGenerateImages(articles, options = {}) {
  const { delayMs = 3000 } = options;
  const results = [];
  
  // Reset environment index for batch diversity
  usedEnvironmentIndex = 0;
  
  for (const article of articles) {
    const result = await createArticleHeroImage(article);
    results.push({
      slug: article.slug,
      title: article.title,
      ...result,
    });
    
    // Delay between requests to avoid rate limiting
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  getSubjectForArticle,
  ENVIRONMENTS,
  MODEL_NAME,
};
