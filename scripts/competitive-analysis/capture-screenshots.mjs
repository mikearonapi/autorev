#!/usr/bin/env node

/**
 * Competitive Analysis Screenshot Capture Script
 * 
 * Captures homepage, pricing, features, and about pages for all competitors
 * in both desktop and mobile viewports.
 * 
 * Usage:
 *   node scripts/competitive-analysis/capture-screenshots.mjs
 *   node scripts/competitive-analysis/capture-screenshots.mjs --category=automotive
 *   node scripts/competitive-analysis/capture-screenshots.mjs --competitor=bring-a-trailer
 *   node scripts/competitive-analysis/capture-screenshots.mjs --dry-run
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
const OUTPUT_DIR = path.join(ROOT_DIR, 'SaaS Strategy/competitor-screenshots');

// Common cookie consent selectors to auto-dismiss
const COOKIE_SELECTORS = [
  // Generic patterns
  '[class*="cookie"] button[class*="accept"]',
  '[class*="cookie"] button[class*="agree"]',
  '[class*="cookie"] button[class*="close"]',
  '[class*="consent"] button[class*="accept"]',
  '[class*="consent"] button[class*="agree"]',
  '[id*="cookie"] button[class*="accept"]',
  '[id*="consent"] button[class*="accept"]',
  'button[class*="cookie-accept"]',
  'button[class*="accept-cookies"]',
  'button[class*="acceptAll"]',
  'button[class*="accept-all"]',
  // Specific platforms
  '#onetrust-accept-btn-handler',
  '.cc-btn.cc-dismiss',
  '#CybotCookiebotDialogBodyButtonAccept',
  '.cookie-consent-accept',
  '[data-testid="cookie-policy-accept"]',
  '[data-action="accept-cookies"]',
  '.js-accept-cookies',
  '.gdpr-accept',
  '.privacy-accept',
  // Text-based
  'button:has-text("Accept")',
  'button:has-text("Accept All")',
  'button:has-text("I Accept")',
  'button:has-text("Got it")',
  'button:has-text("OK")',
  'button:has-text("Agree")',
];

// Common popup/modal close selectors
const POPUP_SELECTORS = [
  '[class*="modal"] [class*="close"]',
  '[class*="popup"] [class*="close"]',
  '[class*="overlay"] [class*="close"]',
  '[aria-label="Close"]',
  '[aria-label="close"]',
  'button[class*="close-modal"]',
  '.modal-close',
  '.popup-close',
  '[data-dismiss="modal"]',
];

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    category: null,
    competitor: null,
    dryRun: false,
    verbose: false,
    pageTypes: ['homepage', 'pricing', 'features', 'about'],
    skipMobile: false,
    skipFullPage: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1];
    } else if (arg.startsWith('--competitor=')) {
      options.competitor = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--skip-mobile') {
      options.skipMobile = true;
    } else if (arg === '--skip-full-page') {
      options.skipFullPage = true;
    } else if (arg.startsWith('--pages=')) {
      options.pageTypes = arg.split('=')[1].split(',');
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Competitive Analysis Screenshot Capture

Usage:
  node capture-screenshots.mjs [options]

Options:
  --category=NAME       Only capture competitors in this category
  --competitor=SLUG     Only capture a specific competitor by slug
  --pages=TYPES         Comma-separated page types (default: homepage,pricing,features,about)
  --skip-mobile         Skip mobile viewport captures
  --skip-full-page      Skip full-page scroll captures
  --dry-run             Show what would be captured without actually capturing
  --verbose, -v         Verbose logging
  --help, -h            Show this help

Examples:
  node capture-screenshots.mjs --category=automotive
  node capture-screenshots.mjs --competitor=bring-a-trailer
  node capture-screenshots.mjs --pages=homepage,pricing --skip-mobile
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Load and filter competitors based on options
 */
async function loadCompetitors(options) {
  const configText = await fs.readFile(CONFIG_PATH, 'utf-8');
  const config = JSON.parse(configText);
  
  let competitors = config.competitors;

  // Filter by category
  if (options.category) {
    competitors = competitors.filter(c => c.category === options.category);
    if (competitors.length === 0) {
      console.error(`No competitors found in category: ${options.category}`);
      console.log('Available categories:', Object.keys(config.categories).join(', '));
      process.exit(1);
    }
  }

  // Filter by specific competitor
  if (options.competitor) {
    competitors = competitors.filter(c => c.slug === options.competitor);
    if (competitors.length === 0) {
      console.error(`Competitor not found: ${options.competitor}`);
      process.exit(1);
    }
  }

  // Sort by category priority
  competitors.sort((a, b) => {
    const priorityA = config.categories[a.category]?.priority || 99;
    const priorityB = config.categories[b.category]?.priority || 99;
    return priorityA - priorityB;
  });

  return { competitors, settings: config.captureSettings, categories: config.categories };
}

/**
 * Ensure output directories exist
 */
async function ensureDirectories(competitor) {
  const categoryDir = path.join(OUTPUT_DIR, competitor.category);
  const competitorDir = path.join(categoryDir, competitor.slug);
  const desktopDir = path.join(competitorDir, 'desktop');
  const mobileDir = path.join(competitorDir, 'mobile');

  await fs.mkdir(desktopDir, { recursive: true });
  await fs.mkdir(mobileDir, { recursive: true });

  return { competitorDir, desktopDir, mobileDir };
}

/**
 * Helper to wait for a specified time
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Attempt to dismiss cookie banners and popups
 */
async function dismissOverlays(page) {
  // Try cookie consent buttons
  for (const selector of COOKIE_SELECTORS) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await sleep(500);
        return true;
      }
    } catch {
      // Continue trying other selectors
    }
  }

  // Try popup close buttons
  for (const selector of POPUP_SELECTORS) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await sleep(500);
      }
    } catch {
      // Continue
    }
  }

  return false;
}

/**
 * Capture a single page with retries
 */
async function capturePage(browser, url, outputPath, viewport, settings, options, isFullPage = false) {
  const maxRetries = settings.maxRetries || 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const page = await browser.newPage();
    
    try {
      // Set viewport
      await page.setViewport(viewport);

      // Set user agent for mobile
      if (viewport.isMobile) {
        await page.setUserAgent(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        );
      }

      // Navigate with timeout
      await page.goto(url, {
        waitUntil: settings.waitStrategy || 'networkidle2',
        timeout: 30000,
      });

      // Additional wait for animations/lazy loading
      await sleep(settings.additionalWaitMs || 2000);

      // Try to dismiss cookie banners and popups
      await dismissOverlays(page);
      await sleep(500);

      // Take screenshot
      await page.screenshot({
        path: outputPath,
        fullPage: isFullPage,
      });

      if (options.verbose) {
        console.log(`    ✓ Captured: ${path.basename(outputPath)}`);
      }

      await page.close();
      return true;

    } catch (error) {
      lastError = error;
      await page.close();
      
      if (attempt < maxRetries) {
        if (options.verbose) {
          console.log(`    ⟳ Retry ${attempt}/${maxRetries} for ${url}`);
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  console.error(`    ✗ Failed after ${maxRetries} attempts: ${lastError.message}`);
  return false;
}

/**
 * Capture all screenshots for a competitor
 */
async function captureCompetitor(browser, competitor, settings, options) {
  const { desktopDir, mobileDir } = await ensureDirectories(competitor);
  const results = { success: 0, failed: 0, skipped: 0 };

  for (const pageType of options.pageTypes) {
    const url = competitor.urls[pageType];
    
    if (!url) {
      if (options.verbose) {
        console.log(`  → Skipping ${pageType} (no URL)`);
      }
      results.skipped++;
      continue;
    }

    // Desktop viewport capture
    const desktopViewport = {
      width: settings.desktop.width,
      height: settings.desktop.height,
    };
    
    const desktopPath = path.join(desktopDir, `${pageType}.png`);
    const desktopSuccess = await capturePage(
      browser, url, desktopPath, desktopViewport, settings, options, false
    );
    
    if (desktopSuccess) {
      results.success++;
    } else {
      results.failed++;
    }

    // Desktop full-page capture (homepage and pricing only)
    if (!options.skipFullPage && ['homepage', 'pricing'].includes(pageType)) {
      const fullPagePath = path.join(desktopDir, `${pageType}-full.png`);
      const fullPageSuccess = await capturePage(
        browser, url, fullPagePath, desktopViewport, settings, options, true
      );
      
      if (fullPageSuccess) {
        results.success++;
      } else {
        results.failed++;
      }
    }

    // Mobile viewport capture
    if (!options.skipMobile) {
      const mobileViewport = {
        width: settings.mobile.width,
        height: settings.mobile.height,
        deviceScaleFactor: settings.mobile.deviceScaleFactor || 3,
        isMobile: settings.mobile.isMobile ?? true,
        hasTouch: settings.mobile.hasTouch ?? true,
      };
      
      const mobilePath = path.join(mobileDir, `${pageType}.png`);
      const mobileSuccess = await capturePage(
        browser, url, mobilePath, mobileViewport, settings, options, false
      );
      
      if (mobileSuccess) {
        results.success++;
      } else {
        results.failed++;
      }
    }

    // Rate limiting between pages
    await new Promise(r => setTimeout(r, 1000));
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  const { competitors, settings, categories } = await loadCompetitors(options);

  console.log('\n🔍 Competitive Analysis Screenshot Capture');
  console.log('━'.repeat(50));
  console.log(`📊 Competitors to capture: ${competitors.length}`);
  console.log(`📄 Page types: ${options.pageTypes.join(', ')}`);
  console.log(`📱 Mobile captures: ${options.skipMobile ? 'No' : 'Yes'}`);
  console.log(`📜 Full-page captures: ${options.skipFullPage ? 'No' : 'Yes'}`);
  
  if (options.dryRun) {
    console.log('\n🏃 DRY RUN - No screenshots will be taken\n');
    
    for (const competitor of competitors) {
      console.log(`\n[${competitor.category}] ${competitor.name} (${competitor.slug})`);
      for (const pageType of options.pageTypes) {
        const url = competitor.urls[pageType];
        if (url) {
          console.log(`  → ${pageType}: ${url}`);
        } else {
          console.log(`  → ${pageType}: (no URL)`);
        }
      }
    }
    
    console.log('\n✅ Dry run complete. Run without --dry-run to capture screenshots.');
    return;
  }

  // Launch browser
  console.log('\n🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const totalResults = { success: 0, failed: 0, skipped: 0 };
  const startTime = Date.now();

  try {
    for (let i = 0; i < competitors.length; i++) {
      const competitor = competitors[i];
      const categoryName = categories[competitor.category]?.displayName || competitor.category;
      
      console.log(`\n[${i + 1}/${competitors.length}] ${competitor.name}`);
      console.log(`    Category: ${categoryName}`);
      console.log(`    URL: ${competitor.urls.homepage}`);

      const results = await captureCompetitor(browser, competitor, settings, options);
      
      totalResults.success += results.success;
      totalResults.failed += results.failed;
      totalResults.skipped += results.skipped;

      console.log(`    Results: ✓${results.success} ✗${results.failed} ⊘${results.skipped}`);

      // Rate limiting between competitors
      if (i < competitors.length - 1) {
        const delay = settings.delayBetweenSitesMs || 3000;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  } finally {
    await browser.close();
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log('\n' + '━'.repeat(50));
  console.log('📊 CAPTURE SUMMARY');
  console.log('━'.repeat(50));
  console.log(`✓ Successful: ${totalResults.success}`);
  console.log(`✗ Failed: ${totalResults.failed}`);
  console.log(`⊘ Skipped: ${totalResults.skipped}`);
  console.log(`⏱ Duration: ${duration} minutes`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log('━'.repeat(50) + '\n');

  // Write capture log
  const logPath = path.join(OUTPUT_DIR, 'capture-log.json');
  await fs.writeFile(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    options,
    results: totalResults,
    durationMinutes: parseFloat(duration),
    competitorCount: competitors.length,
  }, null, 2));

  if (totalResults.failed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
