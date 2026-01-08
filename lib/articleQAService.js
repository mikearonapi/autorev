/**
 * Unified Article QA Service
 * 
 * Comprehensive quality assurance for articles including:
 * - Content length validation (1500-2000 words)
 * - Content quality assessment
 * - Image quality analysis
 * - Automated fixes for failing articles
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// QA Configuration
export const QA_CONFIG = {
  content: {
    minWords: 1500,
    maxWords: 2000,
    targetWords: 1750,
  },
  image: {
    autoApproveThreshold: 75,
    autoRejectThreshold: 45,
    maxRegenerationAttempts: 3,
  },
  // Date validation - prevent outdated references
  dates: {
    currentYear: new Date().getFullYear(),
    // Years to flag as outdated (more than 1 year behind current)
    outdatedYears: () => {
      const current = new Date().getFullYear();
      return [current - 2, current - 3, current - 4]; // 2024, 2023, 2022 if current is 2026
    },
    // Acceptable year references (current and last year)
    acceptableYears: () => {
      const current = new Date().getFullYear();
      return [current, current - 1]; // 2026, 2025
    },
  },
};

// ============================================
// CONTENT QA
// ============================================

/**
 * Calculate word count from HTML content
 */
export function calculateWordCount(htmlContent) {
  if (!htmlContent) return 0;
  const text = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(w => w.length > 0).length;
}

/**
 * Check for outdated year references in content
 * Returns issues found with outdated years like "2024" when we're in 2026
 */
export function checkOutdatedYearReferences(htmlContent, articleTitle = '') {
  const issues = [];
  const currentYear = QA_CONFIG.dates.currentYear;
  const outdatedYears = QA_CONFIG.dates.outdatedYears();
  
  // Convert HTML to text for analysis
  const text = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const fullText = `${articleTitle} ${text}`;
  
  for (const year of outdatedYears) {
    // Match year references like "2024", "in 2024", "as of 2024", "the 2024"
    const yearRegex = new RegExp(`\\b(in|as of|for|the|new|latest|current|upcoming)\\s*${year}\\b`, 'gi');
    const matches = fullText.match(yearRegex);
    
    if (matches && matches.length > 0) {
      issues.push({
        type: 'outdated_year',
        year,
        count: matches.length,
        severity: year === currentYear - 2 ? 'warning' : 'error',
        suggestion: `Replace "${year}" references with "${currentYear}" or remove date references`,
      });
    }
    
    // Also check for "2024 model", "2024 edition", etc.
    const modelYearRegex = new RegExp(`\\b${year}\\s*(model|edition|lineup|release|update)\\b`, 'gi');
    const modelMatches = fullText.match(modelYearRegex);
    
    if (modelMatches && modelMatches.length > 0) {
      issues.push({
        type: 'outdated_model_year',
        year,
        count: modelMatches.length,
        severity: 'warning',
        suggestion: `Update model year references to ${currentYear} or use generic "current" language`,
      });
    }
  }
  
  return issues;
}

/**
 * Fix outdated year references in content
 */
export async function fixOutdatedYearReferences(article) {
  const currentYear = QA_CONFIG.dates.currentYear;
  const outdatedYears = QA_CONFIG.dates.outdatedYears();
  
  let updatedContent = article.content_html;
  let changesMade = 0;
  
  for (const year of outdatedYears) {
    // Replace "in 2024" → "in 2026", "as of 2024" → "as of 2026", etc.
    const patterns = [
      { regex: new RegExp(`\\b(in|as of|for)\\s+${year}\\b`, 'gi'), replacement: `$1 ${currentYear}` },
      { regex: new RegExp(`\\b(the|new|latest|current)\\s+${year}\\b`, 'gi'), replacement: `$1 ${currentYear}` },
      // For model years, be more careful - only update if it's about "new" or "upcoming"
      { regex: new RegExp(`\\b(new|upcoming|latest)\\s+${year}\\s+(model|edition)`, 'gi'), replacement: `$1 ${currentYear} $2` },
    ];
    
    for (const { regex, replacement } of patterns) {
      const before = updatedContent;
      updatedContent = updatedContent.replace(regex, replacement);
      if (before !== updatedContent) changesMade++;
    }
  }
  
  if (changesMade > 0) {
    // Update the database
    const { error } = await supabase
      .from('al_articles')
      .update({
        content_html: updatedContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', article.id);
    
    if (error) {
      return { success: false, error: error.message, changesMade: 0 };
    }
    
    return { success: true, changesMade, updatedContent };
  }
  
  return { success: true, changesMade: 0 };
}

/**
 * Analyze content quality
 */
export async function analyzeContentQuality(article) {
  const wordCount = calculateWordCount(article.content_html);
  const yearIssues = checkOutdatedYearReferences(article.content_html, article.title);
  
  const result = {
    wordCount,
    meetsMinimum: wordCount >= QA_CONFIG.content.minWords,
    meetsMaximum: wordCount <= QA_CONFIG.content.maxWords,
    wordsNeeded: Math.max(0, QA_CONFIG.content.minWords - wordCount),
    readTimeMinutes: Math.ceil(wordCount / 200),
    yearIssues,
    hasOutdatedYears: yearIssues.length > 0,
    status: 'pending',
  };

  if (result.meetsMinimum && result.meetsMaximum && !result.hasOutdatedYears) {
    result.status = 'approved';
  } else if (!result.meetsMinimum) {
    result.status = 'needs_expansion';
  } else if (result.hasOutdatedYears) {
    result.status = 'needs_date_update';
  } else {
    result.status = 'over_limit'; // Not necessarily bad
  }

  return result;
}

/**
 * Expand article content to meet word count requirements
 */
export async function expandArticleContent(article) {
  const currentWordCount = calculateWordCount(article.content_html);
  const targetWords = QA_CONFIG.content.targetWords;
  
  if (currentWordCount >= QA_CONFIG.content.minWords) {
    return { success: true, expanded: false, wordCount: currentWordCount };
  }

  const currentYear = QA_CONFIG.dates.currentYear;
  const lastYear = currentYear - 1;
  
  const systemPrompt = `You are AL, AutoRev's AI automotive expert. You write comprehensive, authoritative articles about cars for enthusiasts.

Your writing style:
- Authoritative but approachable
- Data-driven with specific numbers and specs
- Practical advice enthusiasts can actually use
- NO fluff or filler content - every paragraph must add real value
- Use proper HTML: <h2>, <h3>, <p>, <ul>/<li>, <strong>

CRITICAL DATE RULE: The current year is ${currentYear}. 
- Use "${currentYear}" for current/new releases
- Use "${lastYear}" for recent/last year references  
- NEVER use 2024 or earlier as "current" or "new" - these are outdated!

CRITICAL: Output ONLY HTML content. No preamble, no markdown code fences, no explanation.`;

  const userPrompt = `Expand this article to ${targetWords} words with rich, valuable content.

ARTICLE: ${article.title}
CATEGORY: ${article.category}/${article.subcategory || 'general'}
CURRENT WORDS: ${currentWordCount}
TARGET WORDS: ${targetWords}
CURRENT YEAR: ${currentYear} (use this for any "current" or "new" references)

CURRENT CONTENT:
${article.content_html}

REQUIREMENTS:
1. Expand to ${targetWords} words total
2. Add MORE depth, specific data, real examples
3. Include actionable advice readers can use
4. Every new section must provide genuine value
5. Maintain existing structure but enhance it
6. For comparisons: add specific specs, pricing, pros/cons
7. For technical: add step-by-step guidance, costs
8. For enthusiast: add cultural context, history
9. YEAR AWARENESS: Use ${currentYear} for current info, ${lastYear} for "last year" - NEVER use 2024 or earlier as current!
10. If article mentions specific budgets (e.g., "under $50k"), only reference cars that fit that budget

Output ONLY the expanded HTML content, starting with <p> or <h2>.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const expandedContent = response.content[0].text.trim();
    const newWordCount = calculateWordCount(expandedContent);
    const newReadTime = Math.ceil(newWordCount / 200);

    // Update database
    const { error } = await supabase
      .from('al_articles')
      .update({
        content_html: expandedContent,
        read_time_minutes: newReadTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', article.id);

    if (error) throw error;

    return {
      success: true,
      expanded: true,
      previousWordCount: currentWordCount,
      newWordCount,
      readTimeMinutes: newReadTime,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// IMAGE QA
// ============================================

/**
 * Build context hints for image relevance checking
 * Analyzes article title/category to determine what cars SHOULD be shown
 */
function buildContextHints(articleContext) {
  const { title, category, carSlugs, expectedCars } = articleContext;
  const hints = [];
  
  // Price-based context (CRITICAL for budget articles)
  const priceMatches = title.match(/under\s*\$?(\d+)k?/i) || title.match(/\$?(\d+)k?\s*budget/i);
  if (priceMatches) {
    const maxPrice = parseInt(priceMatches[1]) * (priceMatches[1].length <= 3 ? 1000 : 1);
    hints.push(`PRICE CONSTRAINT: Cars shown must realistically be available under $${maxPrice.toLocaleString()}`);
    hints.push(`REJECT if: Supercars, hypercars, or vehicles that cost 2x+ the budget (e.g., Ford GT, McLaren, Ferrari for a $50k article)`);
    
    // Suggest appropriate cars for budget
    if (maxPrice <= 30000) {
      hints.push(`EXPECTED CARS: Miata, BRZ/86, Mustang EcoBoost, Golf GTI, Civic Si, used 370Z`);
    } else if (maxPrice <= 50000) {
      hints.push(`EXPECTED CARS: Supra, Nissan Z, M2, Cayman, 370Z Nismo, Mustang GT, S2000, Evo, STI, Golf R`);
    } else if (maxPrice <= 75000) {
      hints.push(`EXPECTED CARS: M3/M4, C63 AMG, RS3, Cayman S, Corvette, Supra, GT350`);
    } else if (maxPrice <= 100000) {
      hints.push(`EXPECTED CARS: M5, RS6, GT-R, 911 Carrera, Corvette Z06, CT5-V Blackwing`);
    }
  }

  // Category-based context
  if (title.toLowerCase().includes('jdm')) {
    hints.push(`EXPECTED: Japanese Domestic Market cars (Nissan, Toyota, Honda, Mazda, Subaru, Mitsubishi)`);
    hints.push(`REJECT if: European or American cars shown`);
  }
  
  if (title.toLowerCase().includes('first sports car') || title.toLowerCase().includes('first car')) {
    hints.push(`EXPECTED: Entry-level, reliable, affordable sports cars`);
    hints.push(`REJECT if: Exotic supercars or track-only vehicles shown`);
  }

  if (title.toLowerCase().includes('daily') || title.toLowerCase().includes('daily driver')) {
    hints.push(`EXPECTED: Practical sports cars with comfortable interiors and usable trunks`);
    hints.push(`REJECT if: Track-only, stripped-out race cars shown`);
  }

  // Comparison articles - extract car names
  if (category === 'comparisons' && title.toLowerCase().includes(' vs ')) {
    const vsParts = title.split(/\s+vs\.?\s+/i);
    if (vsParts.length >= 2) {
      hints.push(`MUST SHOW: Both "${vsParts[0].trim()}" AND "${vsParts[1].trim().replace(/:.*/,'')}"`);
    }
  }

  // Use expected cars if provided
  if (expectedCars && expectedCars.length > 0) {
    hints.push(`SPECIFIC CARS EXPECTED: ${expectedCars.join(', ')}`);
  }

  // Use car slugs from article if available
  if (carSlugs && carSlugs.length > 0) {
    hints.push(`ARTICLE FEATURES THESE CARS: ${carSlugs.join(', ')}`);
  }

  return hints.length > 0 ? hints.join('\n') : null;
}

/**
 * Detect image type from binary data
 */
function detectImageType(buffer) {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'image/webp';
  return 'image/jpeg';
}

/**
 * Analyze image quality using Claude Vision
 * Now includes CONTEXTUAL RELEVANCE validation
 */
export async function analyzeImageQuality(imageUrl, articleContext) {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mediaType = detectImageType(arrayBuffer);

    // Build context hints for relevance checking
    const contextHints = buildContextHints(articleContext);

    const prompt = `You are an expert automotive image QA analyst. Analyze this car image with STRICT professional standards.

Article: "${articleContext.title}"
Category: ${articleContext.category}
${contextHints ? `\nCONTEXT REQUIREMENTS:\n${contextHints}` : ''}

Score each criterion 0-100. BE HARSH - we need magazine-quality images:

1. CAR_COMPLETENESS (25%): Is the ENTIRE car visible? All parts without cropping?
2. CAR_ACCURACY (20%): Real, identifiable car model enthusiasts would recognize?
3. CONTEXTUAL_RELEVANCE (25%): Does this car MATCH the article topic? ${contextHints ? 'Must match the context requirements above!' : 'Is it appropriate for the subject matter?'}
4. REALISM (15%): Photorealistic? Check for AI artifacts, impossible physics, merged objects
5. COMPOSITION (10%): Professional automotive photography framing?
6. QUALITY (5%): Sharp, well-lit, high resolution?

CRITICAL AUTO-REJECT (any = immediate rejection):
- Car does NOT match article context (e.g., $400k supercar for "under $50k" article)
- Car partially cut off
- Extra/merged car parts
- Distorted proportions
- Obvious AI artifacts
- Text/watermarks
- Wrong car segment/type for the article

Return ONLY this JSON:
{
  "scores": { "car_completeness": <0-100>, "car_accuracy": <0-100>, "contextual_relevance": <0-100>, "realism": <0-100>, "composition": <0-100>, "quality": <0-100> },
  "weighted_total": <0-100>,
  "critical_issues": [],
  "car_identified": "<Make Model>",
  "context_match": true|false,
  "context_issue": "<why it doesn't match article context, if applicable>",
  "estimated_price_range": "<$XX,XXX - $XX,XXX or 'unknown'>",
  "recommendation": "approve|reject|review",
  "issues_found": "<brief description>"
}`;

    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: prompt },
        ],
      }],
    });

    const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse response');
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    // Calculate weighted score with contextual relevance
    const weights = { 
      car_completeness: 0.25, 
      car_accuracy: 0.20, 
      contextual_relevance: 0.25,  // HIGH weight - wrong context = fail
      realism: 0.15, 
      composition: 0.10, 
      quality: 0.05 
    };
    analysis.weighted_total = Math.round(
      Object.entries(analysis.scores).reduce((sum, [key, score]) => sum + (score * (weights[key] || 0)), 0)
    );

    // Auto-fail if context doesn't match
    if (analysis.context_match === false) {
      analysis.critical_issues = analysis.critical_issues || [];
      analysis.critical_issues.push('context_mismatch');
      analysis.recommendation = 'reject';
      // Cap score at 50 for context mismatch
      if (analysis.weighted_total > 50) {
        analysis.weighted_total = 50;
      }
    }

    return analysis;
  } catch (error) {
    return {
      scores: { car_completeness: 0, car_accuracy: 0, realism: 0, composition: 0, quality: 0 },
      weighted_total: 0,
      critical_issues: ['analysis_failed'],
      recommendation: 'review',
      issues_found: error.message,
    };
  }
}

/**
 * Generate new image using DALL-E 3
 */
export async function generateImageDALLE(article, attempt = 1) {
  const prompt = buildImagePrompt(article, attempt);
  
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024', // Wide format for hero images
      quality: 'hd',
      style: 'natural', // More photorealistic
    });

    return {
      success: true,
      url: response.data[0].url,
      revised_prompt: response.data[0].revised_prompt,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get context-appropriate cars for an article
 * This ensures we generate images with the RIGHT cars for the topic
 */
function getContextAppropriateCars(article) {
  const title = article.title.toLowerCase();
  
  // Price-based articles
  const priceMatch = title.match(/under\s*\$?(\d+)k?/i) || title.match(/\$?(\d+)k?\s*budget/i);
  if (priceMatch) {
    const maxPrice = parseInt(priceMatch[1]) * (priceMatch[1].length <= 3 ? 1000 : 1);
    
    if (maxPrice <= 30000) {
      return ['Mazda MX-5 Miata', 'Toyota GR86', 'Subaru BRZ', 'Volkswagen Golf GTI', 'Ford Mustang EcoBoost'];
    } else if (maxPrice <= 50000) {
      return ['Toyota GR Supra', 'Nissan Z', 'Ford Mustang GT', 'Porsche Boxster', 'Honda S2000', 'BMW M240i', 'Chevrolet Camaro SS'];
    } else if (maxPrice <= 75000) {
      return ['BMW M3', 'BMW M4', 'Porsche Cayman S', 'Chevrolet Corvette Stingray', 'Ford Mustang GT350', 'Mercedes-AMG C63'];
    } else if (maxPrice <= 100000) {
      return ['Porsche 911 Carrera', 'BMW M5', 'Nissan GT-R', 'Chevrolet Corvette Z06', 'Audi RS6'];
    }
  }

  // JDM articles
  if (title.includes('jdm')) {
    return ['Nissan Skyline GT-R R34', 'Toyota Supra MK4', 'Honda NSX', 'Mazda RX-7 FD', 'Mitsubishi Lancer Evolution', 'Subaru Impreza WRX STI'];
  }

  // First car / beginner articles
  if (title.includes('first sports car') || title.includes('first car') || title.includes('beginner')) {
    return ['Mazda MX-5 Miata', 'Toyota GR86', 'Subaru BRZ', 'Ford Mustang EcoBoost', 'Honda Civic Si'];
  }

  // Daily driver articles
  if (title.includes('daily driver') || title.includes('daily')) {
    return ['BMW M340i', 'Audi S4', 'Mercedes-AMG C43', 'Porsche Taycan', 'Tesla Model 3 Performance'];
  }

  // Track day articles
  if (title.includes('track') || title.includes('lap time')) {
    return ['Porsche 911 GT3', 'Chevrolet Corvette Z06', 'BMW M4 CSL', 'McLaren 570S', 'Lotus Exige'];
  }

  // Default - use car_slugs if available
  if (article.car_slugs && article.car_slugs.length > 0) {
    return article.car_slugs.map(slug => slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  }

  return null; // Let the generic prompt handle it
}

/**
 * Build optimized image generation prompt based on article
 * Now with CONTEXTUAL AWARENESS for appropriate cars
 */
function buildImagePrompt(article, attempt) {
  // Get context-appropriate cars
  const appropriateCars = getContextAppropriateCars(article);
  
  const basePrompts = {
    comparisons: `Professional automotive photography of {cars} parked side by side in a clean studio or scenic outdoor location. Full vehicles visible from a 3/4 front angle. Sharp focus, dramatic lighting, magazine-quality composition. Photorealistic, no text or watermarks.`,
    enthusiast: `Stunning automotive photography capturing the essence of {topic}. Full car visible, professional composition. Rich atmosphere, dramatic lighting. Magazine editorial style, photorealistic.`,
    technical: `Clean, well-lit automotive photography showing {topic}. Professional workshop or studio setting. Sharp detail, full vehicle or component visible. Technical yet aesthetic, magazine-quality.`,
  };

  let prompt = basePrompts[article.category] || basePrompts.enthusiast;
  
  // Customize based on article
  if (article.category === 'comparisons') {
    // Extract car names from title
    const cars = article.title.replace(/vs\.?|versus|:.*$/gi, ' and ').trim();
    prompt = prompt.replace('{cars}', cars);
  } else if (appropriateCars && appropriateCars.length > 0) {
    // Use context-appropriate cars!
    const selectedCars = appropriateCars.slice(0, 2 + (attempt - 1) % 3); // Vary which cars
    const carsText = selectedCars.join(' and ');
    prompt = `Professional automotive photography featuring ${carsText}. ${basePrompts.enthusiast.replace('{topic}', article.title.substring(0, 30))}`;
  } else {
    prompt = prompt.replace('{topic}', article.title.substring(0, 50));
  }

  // Add variation instructions for retry attempts
  if (attempt > 1) {
    const angles = ['front 3/4 view', 'rear 3/4 view', 'profile side view', 'dramatic low angle'];
    const settings = ['modern studio backdrop', 'scenic mountain road', 'urban cityscape at dusk', 'coastal highway'];
    prompt += ` Different perspective: ${angles[attempt % angles.length]}, setting: ${settings[attempt % settings.length]}.`;
  }

  // CRITICAL instructions to avoid common AI issues
  prompt += ` CRITICAL REQUIREMENTS: 
1. Show the COMPLETE car(s) without any cropping - all wheels, bumpers, and body panels must be fully visible
2. NO cut-off parts, NO half-cars
3. These must be REALISTIC car models that actually exist and cost under the budget if this is a budget article
4. NO supercars or exotic vehicles unless the article is specifically about them`;

  return prompt;
}

/**
 * Upload image to Vercel Blob storage
 */
export async function uploadImageToStorage(imageUrl, articleSlug) {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const imageBuffer = await response.arrayBuffer();
    
    // Upload to Vercel Blob
    const { put } = await import('@vercel/blob');
    const blob = await put(`articles/${articleSlug}/hero.webp`, Buffer.from(imageBuffer), {
      access: 'public',
      contentType: 'image/webp',
    });

    return { success: true, url: blob.url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Regenerate image with QA loop
 */
export async function regenerateImageWithQA(article, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`   🎨 Generating image (attempt ${attempt}/${maxAttempts})...`);
    
    // Generate new image
    const genResult = await generateImageDALLE(article, attempt);
    if (!genResult.success) {
      console.log(`   ❌ Generation failed: ${genResult.error}`);
      continue;
    }

    console.log(`   🔍 Analyzing generated image...`);
    
    // Analyze the new image
    const analysis = await analyzeImageQuality(genResult.url, {
      title: article.title,
      category: article.category,
    });

    console.log(`   Score: ${analysis.weighted_total}/100`);

    // Check if it passes - STRICT context matching
    const hasContextMismatch = analysis.context_match === false || 
      (analysis.context_issue && analysis.context_issue.length > 0);
    
    if (analysis.weighted_total >= QA_CONFIG.image.autoApproveThreshold && 
        !hasContextMismatch &&
        (!analysis.critical_issues || analysis.critical_issues.length === 0)) {
      
      console.log(`   ✅ Image approved! Uploading...`);
      
      // Upload to storage
      const uploadResult = await uploadImageToStorage(genResult.url, article.slug);
      if (!uploadResult.success) {
        console.log(`   ❌ Upload failed: ${uploadResult.error}`);
        continue;
      }

      // Update database
      await supabase
        .from('al_articles')
        .update({
          hero_image_url: uploadResult.url,
          image_qa_status: 'approved',
          image_qa_score: analysis.weighted_total,
          image_qa_details: analysis,
          image_qa_reviewed_at: new Date().toISOString(),
        })
        .eq('id', article.id);

      return {
        success: true,
        attempt,
        url: uploadResult.url,
        score: analysis.weighted_total,
      };
    }

    console.log(`   ⚠️ Image did not pass (${analysis.issues_found || 'Below threshold'})`);
  }

  // All attempts failed
  return { success: false, error: `Failed after ${maxAttempts} attempts` };
}

// ============================================
// UNIFIED QA PIPELINE
// ============================================

/**
 * Run complete QA on a single article
 */
export async function runArticleQA(articleId, options = {}) {
  const { autoFix = true, verbose = true } = options;
  
  // Fetch article
  const { data: article, error } = await supabase
    .from('al_articles')
    .select('*')
    .eq('id', articleId)
    .single();

  if (error || !article) {
    return { success: false, error: 'Article not found' };
  }

  const results = {
    articleId,
    title: article.title,
    content: { status: 'pending' },
    image: { status: 'pending' },
    overallStatus: 'pending',
  };

  if (verbose) console.log(`\n📋 QA: ${article.title}`);

  // ---- CONTENT QA ----
  if (verbose) console.log(`\n   📝 Content QA...`);
  const contentAnalysis = await analyzeContentQuality(article);
  results.content = contentAnalysis;

  if (verbose) {
    console.log(`   Words: ${contentAnalysis.wordCount} (target: ${QA_CONFIG.content.minWords}-${QA_CONFIG.content.maxWords})`);
  }

  // Check for outdated year references
  if (contentAnalysis.hasOutdatedYears && autoFix) {
    if (verbose) {
      console.log(`   ⚠️ Found ${contentAnalysis.yearIssues.length} outdated year reference(s)`);
      contentAnalysis.yearIssues.forEach(issue => {
        console.log(`      - Year ${issue.year}: ${issue.count} occurrence(s) - ${issue.suggestion}`);
      });
      console.log(`   ⚙️ Auto-fixing year references...`);
    }
    
    const yearFixResult = await fixOutdatedYearReferences(article);
    if (yearFixResult.success && yearFixResult.changesMade > 0) {
      results.content.yearFixed = true;
      results.content.yearChangesMade = yearFixResult.changesMade;
      if (verbose) console.log(`   ✅ Fixed ${yearFixResult.changesMade} year reference(s)`);
      // Refresh article content for further processing
      article.content_html = yearFixResult.updatedContent;
    }
  }

  if (contentAnalysis.status === 'needs_expansion' && autoFix) {
    if (verbose) console.log(`   ⚙️ Auto-expanding content...`);
    const expansionResult = await expandArticleContent(article);
    
    if (expansionResult.success && expansionResult.expanded) {
      results.content.status = 'fixed';
      results.content.newWordCount = expansionResult.newWordCount;
      if (verbose) console.log(`   ✅ Expanded: ${expansionResult.previousWordCount} → ${expansionResult.newWordCount} words`);
    } else if (expansionResult.success) {
      results.content.status = 'approved';
    } else {
      results.content.status = 'failed';
      results.content.error = expansionResult.error;
      if (verbose) console.log(`   ❌ Expansion failed: ${expansionResult.error}`);
    }
  } else if (contentAnalysis.status === 'approved') {
    if (verbose) console.log(`   ✅ Content approved`);
  } else if (contentAnalysis.status === 'needs_date_update' && !autoFix) {
    if (verbose) console.log(`   ⚠️ Needs manual date update`);
  }

  // ---- IMAGE QA ----
  if (article.hero_image_url) {
    if (verbose) console.log(`\n   🖼️ Image QA...`);
    
    const imageAnalysis = await analyzeImageQuality(article.hero_image_url, {
      title: article.title,
      category: article.category,
    });

    results.image = {
      score: imageAnalysis.weighted_total,
      issues: imageAnalysis.critical_issues,
      carIdentified: imageAnalysis.car_identified,
    };

    if (verbose) console.log(`   Score: ${imageAnalysis.weighted_total}/100`);

    // Determine if image passes
    const imageNeedsWork = imageAnalysis.weighted_total < QA_CONFIG.image.autoApproveThreshold ||
      (imageAnalysis.critical_issues && imageAnalysis.critical_issues.length > 0);

    if (imageNeedsWork && autoFix) {
      if (verbose) console.log(`   ⚙️ Regenerating image...`);
      const regenResult = await regenerateImageWithQA(article);
      
      if (regenResult.success) {
        results.image.status = 'regenerated';
        results.image.newUrl = regenResult.url;
        results.image.newScore = regenResult.score;
        results.image.attempts = regenResult.attempt;
        if (verbose) console.log(`   ✅ New image: ${regenResult.score}/100 (attempt ${regenResult.attempt})`);
      } else {
        results.image.status = 'failed';
        results.image.error = regenResult.error;
        if (verbose) console.log(`   ❌ Regeneration failed`);
      }
    } else if (!imageNeedsWork) {
      results.image.status = 'approved';
      
      // Update DB status
      await supabase
        .from('al_articles')
        .update({
          image_qa_status: 'approved',
          image_qa_score: imageAnalysis.weighted_total,
          image_qa_details: imageAnalysis,
          image_qa_reviewed_at: new Date().toISOString(),
        })
        .eq('id', article.id);
      
      if (verbose) console.log(`   ✅ Image approved`);
    }
  } else {
    results.image.status = 'missing';
    if (verbose) console.log(`\n   ⚠️ No hero image`);
  }

  // ---- OVERALL STATUS ----
  const contentOk = ['approved', 'fixed', 'over_limit'].includes(results.content.status);
  const imageOk = ['approved', 'regenerated'].includes(results.image.status);
  
  results.overallStatus = (contentOk && imageOk) ? 'passed' : 'needs_attention';

  if (verbose) {
    console.log(`\n   📊 Result: ${results.overallStatus.toUpperCase()}`);
  }

  return { success: true, results };
}

/**
 * Run QA on all articles
 */
export async function runBatchArticleQA(options = {}) {
  const { autoFix = true, verbose = true } = options;
  
  const { data: articles, error } = await supabase
    .from('al_articles')
    .select('id, title')
    .eq('is_published', true)
    .order('title');

  if (error) {
    return { success: false, error: error.message };
  }

  const results = {
    total: articles.length,
    passed: 0,
    needsAttention: 0,
    details: [],
  };

  for (const article of articles) {
    const qaResult = await runArticleQA(article.id, { autoFix, verbose });
    
    if (qaResult.success) {
      if (qaResult.results.overallStatus === 'passed') {
        results.passed++;
      } else {
        results.needsAttention++;
      }
      results.details.push(qaResult.results);
    }

    // Rate limit between articles
    await new Promise(r => setTimeout(r, 2000));
  }

  return { success: true, results };
}

const articleQAService = {
  QA_CONFIG,
  calculateWordCount,
  analyzeContentQuality,
  checkOutdatedYearReferences,
  fixOutdatedYearReferences,
  expandArticleContent,
  analyzeImageQuality,
  generateImageDALLE,
  regenerateImageWithQA,
  runArticleQA,
  runBatchArticleQA,
};

export default articleQAService;

