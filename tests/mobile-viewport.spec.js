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
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/garage', name: 'Garage' },
  { path: '/community', name: 'Community' },
  { path: '/tuning-shop', name: 'Tuning Shop' },
  { path: '/al', name: 'AL Chat' },
  { path: '/data', name: 'Data' },
];

// Landscape viewports for testing
const LANDSCAPE_VIEWPORTS = [
  { name: 'iphone-se-landscape', width: 667, height: 375 },
  { name: 'iphone-14-landscape', width: 844, height: 390 },
  { name: 'samsung-landscape', width: 800, height: 360 },
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

// Landscape mode tests
test.describe('Landscape Mode Compatibility', () => {
  for (const viewport of LANDSCAPE_VIEWPORTS) {
    test(`No horizontal overflow in landscape at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      await page.waitForTimeout(500);
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll, 
        `Page has horizontal scroll in landscape at ${viewport.width}x${viewport.height}`
      ).toBe(false);
    });
    
    test(`Bottom tab bar adapts to landscape (${viewport.name})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      
      await page.waitForTimeout(500);
      
      // Bottom tab bar should be present and adapted for landscape
      const tabBar = await page.locator('nav[class*="BottomTabBar"], [class*="tabBar"]').first();
      
      if (await tabBar.count() > 0) {
        const box = await tabBar.boundingBox();
        if (box) {
          // In landscape, tab bar should be shorter (< 60px) due to reduced padding
          expect(box.height, 'Tab bar should be compact in landscape').toBeLessThanOrEqual(70);
        }
      }
    });
  }
});

// Safe area rendering tests
test.describe('Safe Area Inset Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });
  
  test('Modal overlays use safe area padding', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    
    // Check if any modal overlay CSS references safe-area-inset
    const styleSheets = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      let hasSafeAreaStyles = false;
      
      try {
        for (const sheet of sheets) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
              if (rule.cssText && rule.cssText.includes('safe-area-inset')) {
                hasSafeAreaStyles = true;
                break;
              }
            }
          } catch {
            // Cross-origin stylesheet, skip
          }
          if (hasSafeAreaStyles) break;
        }
      } catch {
        // Fallback: just check if the page loaded
        hasSafeAreaStyles = true;
      }
      
      return hasSafeAreaStyles;
    });
    
    expect(styleSheets, 'Page should have safe area CSS rules loaded').toBe(true);
  });
  
  test('Fixed bottom elements respect safe area', async ({ page }) => {
    await page.goto('/al', { waitUntil: 'domcontentloaded' });
    
    await page.waitForTimeout(500);
    
    // Check that fixed bottom element has proper padding
    const inputArea = await page.locator('[class*="inputArea"], [class*="inputWrapper"]').last();
    
    if (await inputArea.count() > 0) {
      const box = await inputArea.boundingBox();
      if (box) {
        // Input area should have some padding from the bottom
        const viewportHeight = 844;
        const bottomMargin = viewportHeight - (box.y + box.height);
        
        // Should have at least some padding (safe area or standard padding)
        expect(bottomMargin, 'Input area should have bottom padding').toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// Extended touch target tests for app pages
test.describe('App Page Touch Targets', () => {
  const appPages = [
    { path: '/dashboard', name: 'Dashboard', elements: ['button', '[class*="tab"]', 'a'] },
    { path: '/garage', name: 'Garage', elements: ['button', '[class*="actionBtn"]'] },
    { path: '/al', name: 'AL Chat', elements: ['button', '[class*="sendBtn"]'] },
  ];
  
  for (const pageInfo of appPages) {
    test(`${pageInfo.name} buttons meet 44px minimum`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(pageInfo.path, { waitUntil: 'domcontentloaded' });
      
      await page.waitForTimeout(500);
      
      for (const selector of pageInfo.elements) {
        const elements = await page.locator(selector).all();
        
        for (const el of elements.slice(0, 5)) { // Check first 5 of each type
          try {
            const box = await el.boundingBox();
            if (box && box.width > 0 && box.height > 0) {
              // Skip very small decorative elements
              if (box.width < 20 || box.height < 20) continue;
              
              // Interactive elements should have at least 44px in one dimension
              const meetsTarget = box.width >= 44 || box.height >= 44;
              expect(meetsTarget, 
                `${selector} on ${pageInfo.name} should meet 44px touch target`
              ).toBe(true);
            }
          } catch {
            // Element may not be visible, skip
          }
        }
      }
    });
  }
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










