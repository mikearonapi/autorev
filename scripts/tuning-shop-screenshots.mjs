#!/usr/bin/env node
/**
 * Tuning Shop Screenshot Automation
 * 
 * Captures screenshots of the tuning shop for a specific car to use in promotional videos.
 * 
 * Usage:
 *   node scripts/tuning-shop-screenshots.mjs <car-slug>
 *   node scripts/tuning-shop-screenshots.mjs bmw-m3-e92
 *   node scripts/tuning-shop-screenshots.mjs --list          # Show available cars
 *   node scripts/tuning-shop-screenshots.mjs --batch slug1 slug2 slug3
 * 
 * Environment Variables:
 *   BASE_URL - Override the default URL (default: http://localhost:3000)
 *   HEADLESS - Set to "false" to see the browser (default: true)
 * 
 * Output:
 *   Screenshots are saved to generated-videos/tuning-shop-screenshots/<car-slug>/
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.HEADLESS !== 'false';
const VIEWPORT = { width: 390, height: 844 }; // iPhone 14 dimensions
const DEVICE_SCALE_FACTOR = 3;
const TOP_OFFSET_PX = 160; // ensures consistent framing below sticky headers

// Timeout settings
const NAVIGATION_TIMEOUT = 30000;
const ELEMENT_TIMEOUT = 10000;

// Build presets to capture (Stock → Street → Track → Time Atk → Power)
// NOTE: keys must match PACKAGES keys in `components/UpgradeCenter.jsx`
const BUILD_PRESETS = [
  { key: 'stock', label: 'Stock' },
  { key: 'streetSport', label: 'Street' },
  { key: 'trackPack', label: 'Track' },
  { key: 'timeAttack', label: 'Time Atk' },
  { key: 'ultimatePower', label: 'Power' },
];

// Categories to capture (order matters for screenshots)
const UPGRADE_CATEGORIES = [
  { key: 'power', label: 'Power' },
  { key: 'forcedInduction', label: 'Turbo/SC' },
  { key: 'chassis', label: 'Chassis' },
  { key: 'brakes', label: 'Brakes' },
  { key: 'cooling', label: 'Cooling' },
  { key: 'aero', label: 'Aero' },
  { key: 'drivetrain', label: 'Drivetrain' },
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

async function scrollLocatorToOffset(page, locator, offsetPx) {
  const handle = await locator.elementHandle();
  if (!handle) throw new Error('scrollLocatorToOffset: element not found');
  await handle.evaluate((el, offset) => {
    function findScrollParent(node) {
      // Prefer the closest scrollable ancestor; fall back to the document scroller.
      let p = node?.parentElement || null;
      while (p) {
        const cs = window.getComputedStyle(p);
        const oy = cs.overflowY;
        if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 2) return p;
        p = p.parentElement;
      }
      return document.scrollingElement || document.documentElement;
    }

    const delta = el.getBoundingClientRect().top - offset;
    if (Math.abs(delta) < 0.5) return;

    const scroller = findScrollParent(el);
    const isDocScroller = scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body;
    if (isDocScroller) {
      window.scrollBy(0, delta);
    } else {
      scroller.scrollTop += delta;
    }
  }, offsetPx);
  await page.waitForTimeout(250);
}

async function waitForStableLayout(page) {
  // Fonts can shift layout; wait for them.
  await page.evaluate(async () => {
    // `document.fonts` may not exist in all contexts; guard.
    // @ts-ignore
    if (document.fonts?.ready) {
      // @ts-ignore
      await document.fonts.ready;
    }
  });
  // Let images/layout settle.
  await page.waitForTimeout(500);
}

/**
 * Check if the dev server is running
 */
async function checkServerRunning() {
  try {
    const response = await fetch(BASE_URL, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Main screenshot capture function
 */
async function captureTuningShopScreenshots(carSlug) {
  console.log(`\n🚗 Starting screenshot capture for: ${carSlug}`);
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👁️ Headless: ${HEADLESS}`);
  
  // Check if server is running
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.error(`\n❌ Server not running at ${BASE_URL}`);
    console.error('   Please start the dev server: npm run dev');
    process.exit(1);
  }
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'generated-videos', 'tuning-shop-screenshots', carSlug);
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Output directory: ${outputDir}\n`);
  
  // Ensure each run produces a clean, consistent set (prevents stale images mixing in).
  for (const entry of fs.readdirSync(outputDir)) {
    if (entry.endsWith('.png') || entry === 'manifest.json') {
      try {
        fs.unlinkSync(path.join(outputDir, entry));
      } catch {
        // ignore
      }
    }
  }
  
  // Launch browser
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  
  // Dismiss onboarding popups
  await context.addInitScript(() => {
    const keys = [
      'garage_onboarding_dismissed',
      'autorev_tuningshop_onboarding_dismissed',
      'autorev_garage_onboarding_dismissed',
      'autorev_onboarding_dismissed',
    ];
    for (const k of keys) {
      try {
        localStorage.setItem(k, 'true');
      } catch {
        // ignore
      }
    }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to tuning shop with the car selected
    const url = `${BASE_URL}/tuning-shop?plan=${carSlug}`;
    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });
    
    // Wait for the upgrade center to load - try multiple selectors
    try {
      await page.waitForSelector('[class*="heroSection"]', { timeout: ELEMENT_TIMEOUT });
    } catch {
      // Try alternative selector
      await page.waitForSelector('[class*="upgradeCenter"]', { timeout: ELEMENT_TIMEOUT });
    }
    await waitForStableLayout(page);

    // IMPORTANT:
    // - The blue outline you like is Chromium's focus ring (from automation interactions).
    // - It was getting clipped because the surrounding card uses `overflow: hidden`.
    // Fix: replace the default focus ring with an "inset" outline (negative outline-offset)
    // so it stays fully inside the button bounds and cannot be clipped.
    await page.addStyleTag({
      content: `
        /* Preset buttons (CSS module class contains "pkgBtn") */
        [class*="pkgBtn"]:focus,
        [class*="pkgBtn"]:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.95) !important; /* blue */
          outline-offset: -2px !important; /* draw inside */
        }

        /* Category buttons (CSS module class contains "catBtn") */
        [class*="catBtn"]:focus,
        [class*="catBtn"]:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.8) !important;
          outline-offset: -2px !important;
        }
      `,
    });
    
    // ================================================================
    // 1. MAIN HERO IMAGE (top of tuning page)
    // ================================================================
    console.log('📸 Capturing: 01 hero (top)...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(250);
    await page.screenshot({
      path: path.join(outputDir, '01-hero.png'),
      fullPage: false,
    });

    // ================================================================
    // 2. FACTORY CONFIGURATION + WHEELS & TIRES (consistent framing)
    // ================================================================
    console.log('📸 Capturing: 02 factory config + wheels/tires (framed)...');
    const factoryConfigTitle = page.getByText('Factory Configuration', { exact: true }).first();
    await scrollLocatorToOffset(page, factoryConfigTitle, TOP_OFFSET_PX);
    await waitForStableLayout(page);
    await page.screenshot({
      path: path.join(outputDir, '02-config-and-wheels.png'),
      fullPage: false,
    });

    // ================================================================
    // 3. BUILD PRESET + UPGRADE CATEGORIES (same scroll position per preset)
    // ================================================================
    const buildPresetTitle = page
      .locator('[class*="sidebarCardHeader"]')
      .filter({ hasText: 'Build Preset' })
      .first();

    const categoriesTitle = page.getByText('Upgrade Categories', { exact: true }).first();

    console.log('📸 Capturing: Build preset + categories (framed)...');
    // Ensure we can always click preset buttons (they must be visible on mobile)
    await scrollLocatorToOffset(page, buildPresetTitle, TOP_OFFSET_PX);
    await waitForStableLayout(page);

    let shotIndex = 3;
    for (const preset of BUILD_PRESETS) {
      console.log(`📸 Capturing: ${pad2(shotIndex)} preset/categories (${preset.label})...`);

      // Click the preset button (ensure it's visible first)
      await scrollLocatorToOffset(page, buildPresetTitle, TOP_OFFSET_PX);
      const presetBtn = page.locator(`button:has-text("${preset.label}")`).first();
      await presetBtn.tap();
      await page.waitForTimeout(450);
      await waitForStableLayout(page);
      // Ensure focus ring is visible for the screenshot (consistent blue highlight).
      await presetBtn.focus();

      // Lock framing to the same anchor each time
      await scrollLocatorToOffset(page, buildPresetTitle, TOP_OFFSET_PX);
      await page.screenshot({
        path: path.join(outputDir, `${pad2(shotIndex)}-preset-and-categories-${preset.key}.png`),
        fullPage: false,
      });
      shotIndex += 1;
    }

    // ================================================================
    // 4. PERFORMANCE METRICS + EXPERIENCE SCORES (same scroll position per preset)
    // ================================================================
    const performanceHeading = page.getByRole('heading', { name: 'Performance Metrics' }).first();

    for (const preset of BUILD_PRESETS) {
      console.log(`📸 Capturing: ${pad2(shotIndex)} metrics/experience (${preset.label})...`);

      // Change preset (button is above; scroll up, click, then return)
      await scrollLocatorToOffset(page, buildPresetTitle, TOP_OFFSET_PX);
      const presetBtn = page.locator(`button:has-text("${preset.label}")`).first();
      await presetBtn.tap();
      await page.waitForTimeout(450);
      await waitForStableLayout(page);
      await presetBtn.focus();

      // Now lock framing to performance metrics so the view stays identical across presets
      await scrollLocatorToOffset(page, performanceHeading, TOP_OFFSET_PX);
      await page.screenshot({
        path: path.join(outputDir, `${pad2(shotIndex)}-metrics-and-experience-${preset.key}.png`),
        fullPage: false,
      });
      shotIndex += 1;
    }

    // ================================================================
    // 5. CATEGORY POPUPS (vehicle-specific lists)
    // ================================================================
    console.log('📸 Capturing: Category popups...');

    // Ensure categories are framed consistently in background before opening popups.
    await scrollLocatorToOffset(page, categoriesTitle, TOP_OFFSET_PX);
    await waitForStableLayout(page);

    const categoryList = page.locator('[class*="categoryList"]').first();
    let capturedDetailModal = false;

    for (const category of UPGRADE_CATEGORIES) {
      console.log(`📸 Capturing: ${pad2(shotIndex)} category popup (${category.label})...`);

      // IMPORTANT: scope to category list to avoid matching the Build Preset buttons
      const catBtn = categoryList.locator('button').filter({ hasText: category.label }).first();
      if (!(await catBtn.isVisible())) {
        console.warn(`⚠️  Category not visible for this car: ${category.label}`);
        continue;
      }

      await catBtn.tap();
      await page.waitForTimeout(350);
      await waitForStableLayout(page);
      await catBtn.focus();

      const popup = page.locator('[class*="categoryPopup"]').first();
      if (!(await popup.isVisible())) {
        console.warn(`⚠️  Category popup did not open: ${category.label}`);
        continue;
      }

      await page.screenshot({
        path: path.join(outputDir, `${pad2(shotIndex)}-category-${category.key}.png`),
        fullPage: false,
      });
      shotIndex += 1;

      // ================================================================
      // 6. ONE "LEARN MORE" DETAIL MODAL (keep chain-of-effects visible)
      // ================================================================
      if (!capturedDetailModal) {
        console.log(`📸 Capturing: ${pad2(shotIndex)} upgrade detail modal (Learn more)...`);
        const learnMoreBtn = popup.locator('button:has-text("Learn more")').first();
        if (await learnMoreBtn.isVisible()) {
          await learnMoreBtn.tap();
          await page.waitForTimeout(400);
          await waitForStableLayout(page);
          await learnMoreBtn.focus();

          const detailModal = page.locator('[class*="overlay"]').first();
          if (await detailModal.isVisible()) {
            // Scroll the modal so "Chain of Effects" is visible (matches your example framing)
            const modalPanel = page.locator('[class*="panel"]').first();
            if (await modalPanel.isVisible()) {
              await modalPanel.evaluate((el) => {
                // Find the "Chain of Effects" section; if missing, keep near top.
                const chain = Array.from(el.querySelectorAll('h3')).find((h) =>
                  h.textContent?.toLowerCase().includes('chain of effects')
                );
                if (chain) {
                  const chainTop = chain.getBoundingClientRect().top - el.getBoundingClientRect().top;
                  el.scrollTop = Math.max(0, Math.round(chainTop - 140));
                } else {
                  el.scrollTop = 200;
                }
              });
              await page.waitForTimeout(300);
            }

            await page.screenshot({
              path: path.join(outputDir, `${pad2(shotIndex)}-upgrade-detail.png`),
              fullPage: false,
            });
            shotIndex += 1;
            capturedDetailModal = true;

            // Close detail modal (top-right X)
            const closeDetail = page.locator('[class*="closeBtn"]').first();
            if (await closeDetail.isVisible()) {
              await closeDetail.tap();
              await page.waitForTimeout(250);
            } else {
              await page.keyboard.press('Escape');
            }
          }
        }
      }

      // Close the category popup
      const closePopupBtn = popup.locator('[class*="popupClose"]').first();
      if (await closePopupBtn.isVisible()) {
        await closePopupBtn.tap();
        await page.waitForTimeout(250);
      } else {
        await page.mouse.click(10, 10);
        await page.waitForTimeout(250);
      }
    }
    
    // Generate manifest file
    const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png')).sort();
    const manifest = {
      carSlug,
      capturedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
      topOffsetPx: TOP_OFFSET_PX,
      totalScreenshots: files.length,
      screenshots: files.map(f => ({
        filename: f,
        path: path.join(outputDir, f),
      })),
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log(`\n✅ Screenshots saved to: ${outputDir}`);
    console.log(`📷 Total screenshots: ${files.length}`);
    
    // List all captured files
    console.log('\n📋 Captured files:');
    files.forEach(f => console.log(`   - ${f}`));
    
    return { success: true, outputDir, files };
    
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * List available cars from the database
 */
async function listAvailableCars() {
  try {
    const carsModule = await import('../data/cars.js');
    const cars = carsModule.carData || carsModule.default || [];
    
    console.log('\n📋 Available cars:\n');
    cars.forEach(car => {
      console.log(`   ${car.slug.padEnd(40)} - ${car.name}`);
    });
    console.log(`\n   Total: ${cars.length} cars`);
  } catch (error) {
    console.error('❌ Could not load car data:', error.message);
    console.log('\nTry providing a car slug directly:');
    console.log('   node scripts/tuning-shop-screenshots.mjs bmw-m3-e92');
  }
}

/**
 * Process multiple cars in batch
 */
async function processBatch(carSlugs) {
  console.log(`\n📦 Batch processing ${carSlugs.length} cars...\n`);
  
  const results = { success: [], failed: [] };
  
  for (const slug of carSlugs) {
    try {
      await captureTuningShopScreenshots(slug);
      results.success.push(slug);
    } catch (error) {
      console.error(`❌ Failed to capture ${slug}: ${error.message}`);
      results.failed.push({ slug, error: error.message });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${results.success.length}`);
  if (results.success.length > 0) {
    results.success.forEach(s => console.log(`   - ${s}`));
  }
  console.log(`❌ Failed: ${results.failed.length}`);
  if (results.failed.length > 0) {
    results.failed.forEach(f => console.log(`   - ${f.slug}: ${f.error}`));
  }
  console.log('='.repeat(60) + '\n');
  
  return results;
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
📸 Tuning Shop Screenshot Automation

Captures screenshots of the tuning shop for promotional videos.

Usage:
  node scripts/tuning-shop-screenshots.mjs <car-slug>
  node scripts/tuning-shop-screenshots.mjs --list
  node scripts/tuning-shop-screenshots.mjs --batch <slug1> <slug2> ...

Options:
  --list    Show available car slugs
  --batch   Process multiple cars in sequence

Environment Variables:
  BASE_URL=http://localhost:3000   Override the server URL
  HEADLESS=false                   Show the browser window

Examples:
  # Single car
  node scripts/tuning-shop-screenshots.mjs bmw-m3-e92
  
  # Multiple cars
  node scripts/tuning-shop-screenshots.mjs --batch bmw-m3-e92 ford-mustang-gt-s550 nissan-gtr-r35
  
  # With visible browser (for debugging)
  HEADLESS=false node scripts/tuning-shop-screenshots.mjs bmw-m3-e92

Output:
  Screenshots saved to: generated-videos/tuning-shop-screenshots/<car-slug>/
  `);
  process.exit(0);
}

if (args[0] === '--list') {
  await listAvailableCars();
} else if (args[0] === '--batch') {
  const carSlugs = args.slice(1);
  if (carSlugs.length === 0) {
    console.error('❌ No car slugs provided for batch processing');
    console.error('   Usage: --batch slug1 slug2 slug3');
    process.exit(1);
  }
  await processBatch(carSlugs);
} else {
  const carSlug = args[0];
  await captureTuningShopScreenshots(carSlug);
}
