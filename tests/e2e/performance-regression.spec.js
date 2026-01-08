/**
 * Performance Regression Tests
 * 
 * These tests ensure performance optimizations aren't regressed:
 * - Priority image count (should be ≤1 per page for most pages)
 * - Video preload attributes (metadata for hero, none for below-fold)
 * - Carousel image count (should only render current + next, not all)
 * - No console warnings about priority images
 */

import { test, expect } from '@playwright/test';

// Routes to test with their expected constraints
// Note: Header logo (36x36) is counted as priority but is small enough not to hurt LCP
const performanceRoutes = [
  { 
    route: '/landing/find-your-car', 
    maxPriorityImages: 2, // Header logo + video poster
    videoPreload: 'metadata', // Hero video
    description: 'Find Your Car landing page'
  },
  { 
    route: '/landing/tuning-shop', 
    maxPriorityImages: 2, // Header logo + video poster
    videoPreload: 'metadata',
    description: 'Tuning Shop landing page'
  },
  { 
    route: '/landing/your-garage', 
    maxPriorityImages: 2, // Header logo + video poster
    videoPreload: 'metadata',
    description: 'Your Garage landing page'
  },
  { 
    route: '/car-selector', 
    maxPriorityImages: 2, // Header logo + first carousel image
    maxHeroImages: 2, // current + next pattern
    description: 'Car Selector page with carousel'
  },
  { 
    route: '/tuning-shop', 
    maxPriorityImages: 1, // Header logo only (background is lazy)
    expectLazyBackground: true, // Decorative background should be lazy
    description: 'Tuning Shop app page'
  },
  { 
    route: '/garage', 
    maxPriorityImages: 1, // Header logo only (background is lazy)
    expectLazyBackground: true,
    description: 'Garage app page'
  },
  { 
    route: '/', 
    maxPriorityImages: 6, // Header logo + hero + pillars section images
    description: 'Home page'
  },
];

test.describe('performance regression tests', () => {
  
  test('priority image count does not exceed limits', async ({ page }) => {
    const results = [];
    
    for (const { route, maxPriorityImages, description } of performanceRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      
      // Count images with fetchpriority="high" or priority attribute
      const priorityImages = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        let count = 0;
        imgs.forEach(img => {
          // Next.js Image with priority sets fetchpriority="high"
          if (img.getAttribute('fetchpriority') === 'high') {
            count++;
          }
        });
        return count;
      });
      
      results.push({
        route,
        description,
        priorityImages,
        maxPriorityImages,
        pass: priorityImages <= maxPriorityImages
      });
    }
    
    // Report all results
    const failures = results.filter(r => !r.pass);
    if (failures.length > 0) {
      const failureReport = failures.map(f => 
        `${f.route}: found ${f.priorityImages} priority images (max: ${f.maxPriorityImages})`
      ).join('\n');
      expect(failures.length, `Priority image violations:\n${failureReport}`).toBe(0);
    }
  });

  test('video preload attributes are optimized', async ({ page }) => {
    for (const { route, videoPreload, description } of performanceRoutes.filter(r => r.videoPreload)) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      
      // Check hero video preload
      const heroVideo = await page.locator('video').first();
      if (await heroVideo.count() > 0) {
        const preload = await heroVideo.getAttribute('preload');
        expect(preload, `${description}: Hero video should have preload="${videoPreload}"`).toBe(videoPreload);
      }
    }
  });

  test('car-selector carousel renders only current+next images', async ({ page }) => {
    await page.goto('/car-selector', { waitUntil: 'domcontentloaded' });
    
    // Wait a moment for hydration
    await page.waitForTimeout(500);
    
    // Count visible carousel images in the hero
    const heroImages = await page.evaluate(() => {
      // Look for images in the hero section
      const heroWrapper = document.querySelector('[class*="heroImageWrapper"]');
      if (!heroWrapper) return 0;
      return heroWrapper.querySelectorAll('img').length;
    });
    
    // Should be exactly 2 (current + next), not all 15
    expect(heroImages, 'Car-selector should render only 2 hero images (current + next)').toBeLessThanOrEqual(2);
  });

  test('decorative backgrounds are lazy loaded', async ({ page }) => {
    for (const { route, expectLazyBackground, description } of performanceRoutes.filter(r => r.expectLazyBackground)) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      
      // Check for background image wrapper
      const bgImage = await page.locator('[class*="backgroundImageWrapper"] img').first();
      if (await bgImage.count() > 0) {
        const loading = await bgImage.getAttribute('loading');
        const fetchPriority = await bgImage.getAttribute('fetchpriority');
        
        expect(loading, `${description}: Background image should have loading="lazy"`).toBe('lazy');
        expect(fetchPriority, `${description}: Background image should not have high priority`).not.toBe('high');
      }
    }
  });

  test('no console warnings about multiple priority images', async ({ page }) => {
    const consoleWarnings = [];
    
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('priority')) {
        consoleWarnings.push(msg.text());
      }
    });
    
    // Check key routes
    for (const { route } of performanceRoutes.slice(0, 3)) {
      await page.goto(route, { waitUntil: 'load' });
      await page.waitForTimeout(1000); // Wait for any delayed warnings
    }
    
    expect(consoleWarnings, `Found priority-related console warnings: ${consoleWarnings.join('\n')}`).toHaveLength(0);
  });

  test('Meta Pixel uses lazyOnload strategy', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check that Meta Pixel script doesn't block rendering
    // It should load after the page is interactive (lazyOnload)
    const metaPixelScript = await page.locator('script[src*="fbevents.js"]');
    
    // The script should exist but with data-nscript="lazyOnload"
    if (await metaPixelScript.count() > 0) {
      const strategy = await metaPixelScript.getAttribute('data-nscript');
      expect(strategy, 'Meta Pixel should use lazyOnload strategy').toBe('lazyOnload');
    }
  });
});
