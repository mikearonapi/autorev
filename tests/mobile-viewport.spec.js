/**
 * Cross-Device Mobile Viewport Tests
 * 
 * Tests critical pages at multiple viewport sizes to catch
 * layout issues across different phone widths.
 * 
 * Key viewports tested:
 * - 320px: Minimum (iPhone SE 1st gen, older Android)
 * - 360px: Samsung Galaxy S/A series (CRITICAL - ~30% of Android)
 * - 375px: iPhone SE 2/3, iPhone 12 mini
 * - 390px: iPhone 14/15 standard
 * - 412px: Pixel phones, Samsung Galaxy Note
 * - 430px: iPhone 14/15 Pro Max
 */

const { test, expect } = require('@playwright/test');

// Critical viewport widths to test
const VIEWPORTS = [
  { name: 'xs-minimum', width: 320, height: 568 },
  { name: 'sm-samsung', width: 360, height: 800 },
  { name: 'md-iphone-se', width: 375, height: 667 },
  { name: 'md-iphone', width: 390, height: 844 },
  { name: 'lg-pixel', width: 412, height: 915 },
  { name: 'xl-iphone-max', width: 430, height: 932 },
];

// Pages that have mobile-critical layouts
const CRITICAL_PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/browse-cars', name: 'Browse Cars' },
  { path: '/car-selector', name: 'Car Selector' },
  { path: '/features/ask-al', name: 'Ask AL' },
];

test.describe('Mobile Viewport Compatibility', () => {
  
  // Test that hero section renders without horizontal overflow
  test.describe('Homepage Hero Section', () => {
    for (const viewport of VIEWPORTS) {
      test(`Hero renders correctly at ${viewport.width}px (${viewport.name})`, async ({ page }) => {
        // Set viewport
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to homepage
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        
        // Wait for hero to be visible
        await page.waitForSelector('h1', { timeout: 10000 });
        
        // Check for horizontal overflow (no scrollbar)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        expect(hasHorizontalScroll, 
          `Page has horizontal scroll at ${viewport.width}px - likely content overflow`
        ).toBe(false);
        
        // Check that hero title is fully visible (not clipped)
        const heroTitle = await page.locator('h1').first();
        const titleBox = await heroTitle.boundingBox();
        
        // Title should not extend beyond viewport
        if (titleBox) {
          expect(titleBox.x >= 0, 
            `Hero title is clipped on left at ${viewport.width}px`
          ).toBe(true);
          
          expect(titleBox.x + titleBox.width <= viewport.width, 
            `Hero title extends beyond viewport at ${viewport.width}px`
          ).toBe(true);
        }
      });
    }
  });

  // Test that no page has horizontal overflow at critical widths
  test.describe('No Horizontal Overflow', () => {
    for (const viewport of VIEWPORTS) {
      for (const pageInfo of CRITICAL_PAGES) {
        test(`${pageInfo.name} has no h-scroll at ${viewport.width}px`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(pageInfo.path, { waitUntil: 'domcontentloaded' });
          
          // Small delay for any dynamic content
          await page.waitForTimeout(500);
          
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
          
          expect(scrollWidth, 
            `${pageInfo.name} has horizontal overflow at ${viewport.width}px (scroll: ${scrollWidth}, client: ${clientWidth})`
          ).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance for rounding
        });
      }
    }
  });

  // Test touch target sizes (44px minimum)
  test.describe('Touch Target Compliance', () => {
    test('Header buttons meet 44px minimum', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Check hamburger menu button
      const menuButton = await page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
      
      if (await menuButton.count() > 0) {
        const box = await menuButton.boundingBox();
        if (box) {
          expect(box.width, 'Menu button width too small').toBeGreaterThanOrEqual(44);
          expect(box.height, 'Menu button height too small').toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  // Samsung-specific test (most constrained common viewport)
  test.describe('Samsung Galaxy S Series (360px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
    });

    test('Homepage hero text is not truncated', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Get the hero title
      const heroTitle = await page.locator('h1').first();
      await heroTitle.waitFor({ state: 'visible' });
      
      // Check computed styles - text should not have overflow hidden
      const overflow = await heroTitle.evaluate((el) => {
        return window.getComputedStyle(el).overflow;
      });
      
      // Overflow should be visible (not hidden/clip)
      expect(['visible', 'initial', '']).toContain(overflow);
    });

    test('CTA buttons are not cut off', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Find any CTA buttons
      const buttons = await page.locator('button, a[href*="join"]').all();
      
      for (const button of buttons.slice(0, 5)) { // Check first 5
        const box = await button.boundingBox();
        if (box && box.y > 0 && box.y < 800) { // Only visible buttons
          // Button should be fully within viewport
          expect(box.x, 'Button left edge outside viewport').toBeGreaterThanOrEqual(-1);
          expect(box.x + box.width, 'Button right edge outside viewport').toBeLessThanOrEqual(361);
        }
      }
    });
  });
});

/**
 * Visual regression tests (optional - requires baseline screenshots)
 * Uncomment and configure if using Playwright visual comparisons
 */
/*
test.describe('Visual Regression', () => {
  for (const viewport of VIEWPORTS) {
    test(`Homepage screenshot at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'networkidle' });
      
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });
  }
});
*/


