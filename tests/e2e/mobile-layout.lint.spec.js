import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iphone-14', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 },
  { name: 'iphone-se', viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 },
  { name: 'pixel-7', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625 },
];

// Key public routes where horizontal overflow / “zoomed” layouts are most painful.
const ROUTES = ['/', '/browse-cars', '/tuning-shop', '/community', '/encyclopedia', '/al'];

for (const vp of VIEWPORTS) {
  test.describe(`mobile layout lint (${vp.name})`, () => {
    test(`no horizontal overflow on key routes`, async ({ page, baseURL }) => {
      await page.setViewportSize(vp.viewport);

      for (const route of ROUTES) {
        await page.goto(new URL(route, baseURL).toString(), { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(250);

        // Check at top, mid scroll, and bottom.
        await assertNoHorizontalOverflow(page, `${vp.name}:${route}:top`);

        await page.mouse.wheel(0, 900);
        await page.waitForTimeout(200);
        await assertNoHorizontalOverflow(page, `${vp.name}:${route}:mid`);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(250);
        await assertNoHorizontalOverflow(page, `${vp.name}:${route}:bottom`);

        await page.evaluate(() => window.scrollTo(0, 0));
      }
    });
  });
}

async function assertNoHorizontalOverflow(page, label) {
  const report = await page.evaluate(() => {
    const vw = window.innerWidth;
    const de = document.documentElement;
    const docScrollWidth = de.scrollWidth;
    const overflowPx = Math.max(0, docScrollWidth - vw);

    // Prefer a "visible overflow" metric: only count elements that
    // (a) are in normal flow (not fixed/absolute) and
    // (b) intersect the viewport horizontally.
    //
    // This avoids false positives from off-canvas UI (e.g. the closed mobile menu
    // uses transform translateX(100%) and can look "overflowing" in rects).
    let visibleOverflowPx = 0;

    const offenders = [];
    if (overflowPx > 1) {
      const all = Array.from(document.querySelectorAll('body *'));
      for (let i = 0; i < all.length; i += 1) {
        const el = all[i];
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (cs.position === 'fixed' || cs.position === 'absolute') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) continue;
        if (rect.right <= 0 || rect.left >= vw) continue; // not intersecting viewport horizontally
        const rightOverflow = rect.right - vw;
        const leftOverflow = 0 - rect.left;
        if (rightOverflow > 1 || leftOverflow > 1) {
          visibleOverflowPx = Math.max(visibleOverflowPx, rightOverflow, leftOverflow);
          offenders.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: typeof el.className === 'string' ? el.className.slice(0, 120) : null,
            rightOverflow: Number(rightOverflow.toFixed(2)),
            leftOverflow: Number(leftOverflow.toFixed(2)),
            width: Number(rect.width.toFixed(2)),
          });
          if (offenders.length >= 8) break;
        }
      }
    }

    return {
      vw,
      docScrollWidth,
      overflowPx: Number(overflowPx.toFixed(2)),
      visibleOverflowPx: Number(visibleOverflowPx.toFixed(2)),
      offenders,
    };
  });

  // If this fails, the error message includes top offenders to speed up fixes.
  expect(
    report.visibleOverflowPx,
    `${label}: visible horizontal overflow detected. vw=${report.vw} scrollWidth=${report.docScrollWidth} overflowPx=${report.overflowPx} offenders=${JSON.stringify(
      report.offenders,
    )}`,
  ).toBeLessThanOrEqual(1);
}

