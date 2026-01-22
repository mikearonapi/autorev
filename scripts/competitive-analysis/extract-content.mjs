#!/usr/bin/env node

/**
 * Competitive Analysis Content Extraction Script
 * 
 * Extracts structured content from competitor websites including:
 * - Page titles and meta descriptions
 * - H1/H2 headlines (hero copy)
 * - CTA button text
 * - Pricing tier information
 * - Social proof elements
 * - Navigation structure
 * 
 * Usage:
 *   node scripts/competitive-analysis/extract-content.mjs
 *   node scripts/competitive-analysis/extract-content.mjs --competitor=bring-a-trailer
 *   node scripts/competitive-analysis/extract-content.mjs --category=automotive
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

// Configuration paths
const CONFIG_PATH = path.join(ROOT_DIR, 'SaaS Strategy/competitor-config.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'SaaS Strategy/competitor-analysis');
const EXTRACTED_DIR = path.join(OUTPUT_DIR, 'extracted-content');

// Common cookie consent selectors to auto-dismiss
const COOKIE_SELECTORS = [
  '[class*="cookie"] button[class*="accept"]',
  '[class*="cookie"] button[class*="agree"]',
  '[class*="consent"] button[class*="accept"]',
  '#onetrust-accept-btn-handler',
  '.cc-btn.cc-dismiss',
  '#CybotCookiebotDialogBodyButtonAccept',
  '.cookie-consent-accept',
];

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    category: null,
    competitor: null,
    verbose: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1];
    } else if (arg.startsWith('--competitor=')) {
      options.competitor = arg.split('=')[1];
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }

  return options;
}

/**
 * Load and filter competitors
 */
async function loadCompetitors(options) {
  const configText = await fs.readFile(CONFIG_PATH, 'utf-8');
  const config = JSON.parse(configText);
  
  let competitors = config.competitors;

  if (options.category) {
    competitors = competitors.filter(c => c.category === options.category);
  }

  if (options.competitor) {
    competitors = competitors.filter(c => c.slug === options.competitor);
  }

  return { competitors, settings: config.captureSettings };
}

/**
 * Helper to wait for a specified time
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Dismiss cookie banners
 */
async function dismissCookies(page) {
  for (const selector of COOKIE_SELECTORS) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await sleep(500);
        return;
      }
    } catch {
      // Continue
    }
  }
}

/**
 * Extract content from a page
 */
async function extractPageContent(page) {
  return await page.evaluate(() => {
    // Helper to get text content safely
    const getText = (selector) => {
      const el = document.querySelector(selector);
      return el ? el.textContent.trim() : null;
    };

    // Helper to get all matching elements' text
    const getAllText = (selector, limit = 10) => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements)
        .slice(0, limit)
        .map(el => el.textContent.trim())
        .filter(t => t.length > 0 && t.length < 500);
    };

    // Helper to get button/CTA text
    const getCTAs = () => {
      const ctaSelectors = [
        'a[class*="cta"]',
        'button[class*="cta"]',
        'a[class*="btn-primary"]',
        'button[class*="btn-primary"]',
        'a[class*="button-primary"]',
        'button[class*="button-primary"]',
        '.hero button',
        '.hero a[class*="button"]',
        '[class*="hero"] button',
        '[class*="hero"] a[class*="btn"]',
        'header a[class*="btn"]',
        'nav a[class*="btn"]',
        'a[href*="signup"]',
        'a[href*="sign-up"]',
        'a[href*="get-started"]',
        'a[href*="try"]',
        'a[href*="demo"]',
        'button[type="submit"]',
      ];

      const ctas = new Set();
      for (const selector of ctaSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text.length > 0 && text.length < 100) {
            ctas.add(text);
          }
        });
      }
      return Array.from(ctas).slice(0, 10);
    };

    // Get social proof elements
    const getSocialProof = () => {
      const proof = [];
      
      // Look for stat numbers
      const statSelectors = [
        '[class*="stat"]',
        '[class*="number"]',
        '[class*="counter"]',
        '[class*="metric"]',
      ];
      
      for (const selector of statSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          // Look for numbers with units (e.g., "10M users", "$1B", "99%")
          if (/\d+[MKB%+]|\d{1,3}(,\d{3})+|\d+\s*(users|customers|members|downloads)/i.test(text)) {
            proof.push(text);
          }
        });
      }

      // Look for testimonials
      const testimonialSelectors = [
        '[class*="testimonial"]',
        '[class*="quote"]',
        '[class*="review"]',
        'blockquote',
      ];

      for (const selector of testimonialSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text.length > 20 && text.length < 500) {
            proof.push(text.substring(0, 200) + (text.length > 200 ? '...' : ''));
          }
        });
      }

      // Look for partner/client logos (get alt text)
      const logoSelectors = [
        '[class*="partner"] img',
        '[class*="client"] img',
        '[class*="logo"] img',
        '[class*="trusted"] img',
      ];

      const logos = [];
      for (const selector of logoSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const alt = el.alt || el.title;
          if (alt && alt.length > 0 && alt.length < 100) {
            logos.push(alt);
          }
        });
      }

      return {
        stats: proof.slice(0, 10),
        logos: logos.slice(0, 20),
      };
    };

    // Get navigation structure
    const getNavigation = () => {
      const navItems = [];
      const navSelectors = ['nav a', 'header a', '[class*="nav"] a'];
      
      for (const selector of navSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          const href = el.href;
          if (text.length > 0 && text.length < 50 && href) {
            navItems.push({ text, href });
          }
        });
      }

      // Deduplicate by text
      const seen = new Set();
      return navItems.filter(item => {
        if (seen.has(item.text)) return false;
        seen.add(item.text);
        return true;
      }).slice(0, 20);
    };

    // Get pricing information
    const getPricing = () => {
      const pricing = {
        tiers: [],
        prices: [],
        features: [],
      };

      // Look for pricing cards/tiers
      const tierSelectors = [
        '[class*="pricing"] [class*="card"]',
        '[class*="pricing"] [class*="tier"]',
        '[class*="pricing"] [class*="plan"]',
        '[class*="plan-card"]',
        '[class*="price-card"]',
      ];

      for (const selector of tierSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const name = el.querySelector('h2, h3, [class*="name"], [class*="title"]');
          const price = el.querySelector('[class*="price"], [class*="amount"]');
          const features = el.querySelectorAll('li, [class*="feature"]');

          if (name || price) {
            pricing.tiers.push({
              name: name ? name.textContent.trim() : null,
              price: price ? price.textContent.trim() : null,
              features: Array.from(features).slice(0, 10).map(f => f.textContent.trim()),
            });
          }
        });
      }

      // Look for standalone price mentions
      const pricePattern = /\$\d+(?:\.\d{2})?(?:\/(?:mo|month|yr|year|user))?|\d+(?:\.\d{2})?\s*(?:USD|EUR|GBP)/gi;
      const bodyText = document.body.textContent;
      const priceMatches = bodyText.match(pricePattern);
      if (priceMatches) {
        pricing.prices = [...new Set(priceMatches)].slice(0, 10);
      }

      return pricing;
    };

    return {
      meta: {
        title: document.title,
        description: getText('meta[name="description"]') || getText('meta[property="og:description"]'),
        ogTitle: document.querySelector('meta[property="og:title"]')?.content,
        ogImage: document.querySelector('meta[property="og:image"]')?.content,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
      },
      headlines: {
        h1: getAllText('h1', 5),
        h2: getAllText('h2', 10),
        heroText: getAllText('[class*="hero"] h1, [class*="hero"] h2, [class*="hero"] p', 5),
      },
      ctas: getCTAs(),
      socialProof: getSocialProof(),
      navigation: getNavigation(),
      pricing: getPricing(),
    };
  });
}

/**
 * Extract content from a competitor
 */
async function extractCompetitor(browser, competitor, options) {
  const result = {
    id: competitor.id,
    name: competitor.name,
    slug: competitor.slug,
    category: competitor.category,
    subcategory: competitor.subcategory,
    businessModel: competitor.businessModel,
    studyFocus: competitor.studyFocus,
    topPattern: competitor.topPattern,
    urls: competitor.urls,
    extractedAt: new Date().toISOString(),
    pages: {},
  };

  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1440, height: 900 });

    for (const [pageType, url] of Object.entries(competitor.urls)) {
      if (!url) continue;

      try {
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        await sleep(2000);
        await dismissCookies(page);
        await sleep(500);

        const content = await extractPageContent(page);
        result.pages[pageType] = {
          url,
          ...content,
        };

        if (options.verbose) {
          console.log(`    ✓ Extracted: ${pageType}`);
        }
      } catch (error) {
        console.error(`    ✗ Failed ${pageType}: ${error.message}`);
        result.pages[pageType] = {
          url,
          error: error.message,
        };
      }

      // Rate limiting
      await sleep(1000);
    }
  } finally {
    await page.close();
  }

  return result;
}

/**
 * Generate summary from extracted content
 */
function generateSummary(extracted) {
  const homepage = extracted.pages.homepage || {};
  const pricing = extracted.pages.pricing || {};

  return {
    // Core messaging
    primaryHeadline: homepage.headlines?.h1?.[0] || null,
    secondaryHeadlines: homepage.headlines?.h2?.slice(0, 3) || [],
    heroMessage: homepage.headlines?.heroText?.[0] || null,
    
    // Meta
    metaTitle: homepage.meta?.title || null,
    metaDescription: homepage.meta?.description || null,
    
    // CTAs
    primaryCTA: homepage.ctas?.[0] || null,
    allCTAs: [...new Set([...(homepage.ctas || []), ...(pricing.ctas || [])])].slice(0, 5),
    
    // Pricing
    hasPricingPage: !!extracted.urls.pricing,
    pricingTiers: pricing.pricing?.tiers || [],
    pricePoints: pricing.pricing?.prices || [],
    
    // Social proof
    stats: homepage.socialProof?.stats || [],
    partnerLogos: homepage.socialProof?.logos || [],
    
    // Navigation
    mainNavItems: homepage.navigation?.slice(0, 10) || [],
  };
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  const { competitors } = await loadCompetitors(options);

  console.log('\n📝 Competitive Analysis Content Extraction');
  console.log('━'.repeat(50));
  console.log(`📊 Competitors to extract: ${competitors.length}`);

  // Ensure output directory
  await fs.mkdir(EXTRACTED_DIR, { recursive: true });

  // Launch browser
  console.log('\n🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allExtracted = [];
  const startTime = Date.now();

  try {
    for (let i = 0; i < competitors.length; i++) {
      const competitor = competitors[i];
      
      console.log(`\n[${i + 1}/${competitors.length}] ${competitor.name}`);

      const extracted = await extractCompetitor(browser, competitor, options);
      extracted.summary = generateSummary(extracted);
      allExtracted.push(extracted);

      // Save individual file
      const outputPath = path.join(EXTRACTED_DIR, `${competitor.slug}.json`);
      await fs.writeFile(outputPath, JSON.stringify(extracted, null, 2));
      
      console.log(`    📁 Saved: ${competitor.slug}.json`);

      // Rate limiting between competitors
      if (i < competitors.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  } finally {
    await browser.close();
  }

  // Save combined file
  const combinedPath = path.join(EXTRACTED_DIR, '_all-competitors.json');
  await fs.writeFile(combinedPath, JSON.stringify({
    extractedAt: new Date().toISOString(),
    count: allExtracted.length,
    competitors: allExtracted,
  }, null, 2));

  // Generate summary report
  const summaryReport = allExtracted.map(c => ({
    name: c.name,
    slug: c.slug,
    category: c.category,
    primaryHeadline: c.summary.primaryHeadline,
    primaryCTA: c.summary.primaryCTA,
    pricingTierCount: c.summary.pricingTiers.length,
    pricePoints: c.summary.pricePoints,
    statsCount: c.summary.stats.length,
    topPattern: c.topPattern,
  }));

  const summaryPath = path.join(EXTRACTED_DIR, '_summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summaryReport, null, 2));

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n' + '━'.repeat(50));
  console.log('📊 EXTRACTION SUMMARY');
  console.log('━'.repeat(50));
  console.log(`✓ Extracted: ${allExtracted.length} competitors`);
  console.log(`⏱ Duration: ${duration} minutes`);
  console.log(`📁 Output: ${EXTRACTED_DIR}`);
  console.log('━'.repeat(50) + '\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
