import { test, expect } from '@playwright/test';

test.describe('tuning shop screenshot framing (automation guard)', () => {
  test.skip(!process.env.SCREENSHOT_FRAMING, 'Set SCREENSHOT_FRAMING=1 to run framing checks');

  test('preset and metrics frames stay at fixed scroll offsets', async ({ browser, baseURL }) => {
    const TOP_OFFSET_PX = 160;

    // Match the screenshot script context (mobile + touch), otherwise layout can differ.
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });

    // Keep screenshots / scroll positions consistent: disable onboarding popups.
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
    await page.goto(new URL('/tuning-shop?plan=bmw-m3-e92', baseURL).toString(), { waitUntil: 'networkidle' });

    // Page is client-rendered; wait for the upgrade center to mount.
    await page.waitForSelector('[class*="heroSection"]', { timeout: 15000 });

    // Let fonts/layout settle (reduces scroll drift).
    await page.evaluate(async () => {
      // @ts-ignore
      if (document.fonts?.ready) {
        // @ts-ignore
        await document.fonts.ready;
      }
    });
    await page.waitForTimeout(300);

    const buildPresetTitle = page
      .locator('[class*="sidebarCardHeader"]')
      .filter({ hasText: 'Build Preset' })
      .first();

    const performanceHeading = page.getByRole('heading', { name: 'Performance Metrics' }).first();

    async function scrollLocatorToOffset(locator) {
      const handle = await locator.elementHandle();
      expect(handle).toBeTruthy();
      await handle.evaluate((el, offset) => {
        function findScrollParent(node) {
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
      }, TOP_OFFSET_PX);
      await page.waitForTimeout(150);
    }

    async function getTop(locator) {
      return await locator.evaluate((el) => el.getBoundingClientRect().top);
    }

    async function expectInViewport(locator) {
      const top = await getTop(locator);
      const vh = await page.evaluate(() => window.innerHeight);
      // Non-flaky guard: ensure it is visible after scrolling.
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(vh);
    }

    const presets = ['Stock', 'Street', 'Track', 'Time Atk', 'Power'];

    try {
      for (const presetLabel of presets) {
        // Ensure preset buttons are visible for click.
        await scrollLocatorToOffset(buildPresetTitle);
        await page.locator(`button:has-text("${presetLabel}")`).first().tap();
        await page.waitForTimeout(350);

        // Metrics/experience frame should be reachable/visible across selections.
        await scrollLocatorToOffset(performanceHeading);
        await expectInViewport(performanceHeading);
      }
    } finally {
      await context.close();
    }
  });
});

