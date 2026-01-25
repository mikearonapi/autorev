import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// NOTE: This spec is an "audit generator" (not a typical assertion test).
// It's gated behind MOBILE_AUDIT=1 to keep normal CI fast.
test.describe('mobile audit screenshots', () => {
  test.skip(!process.env.MOBILE_AUDIT, 'Set MOBILE_AUDIT=1 to generate screenshots');

  test('crawl app routes and capture mobile viewport screenshots', async ({ browser, baseURL }, testInfo) => {
    // This is an audit generator (many routes x viewports). Give it ample time when enabled.
    test.setTimeout(10 * 60_000);

    const outputRoot = testInfo.outputPath('mobile-audit');
    fs.mkdirSync(outputRoot, { recursive: true });

    const viewports = [
      { name: 'iphone-se', viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 },
      { name: 'iphone-14', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 },
      { name: 'pixel-7', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625 },
    ];

    const discovered = discoverAppRoutes(path.join(process.cwd(), 'app'));

    const sampleCarSlug = await getSampleCarSlug();
    const routes = normalizeRoutes(discovered, {
      '/browse-cars/[slug]': sampleCarSlug ? `/browse-cars/${sampleCarSlug}` : null,
    });

    // Keep this bounded: deterministic order, no concurrency explosion.
    routes.sort();

    for (const device of viewports) {
      const context = await browser.newContext({
        viewport: device.viewport,
        deviceScaleFactor: device.deviceScaleFactor,
        isMobile: true,
        hasTouch: true,
      });

      // Make screenshots consistent: disable onboarding popups across the site.
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

      // Collect console/page errors but don't fail the run — this is for visual auditing.
      const errors = [];
      page.on('pageerror', (err) => errors.push({ type: 'pageerror', message: String(err) }));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push({ type: 'console', message: msg.text() });
      });

      const layoutSignals = [];

      for (const route of routes) {
        const url = new URL(route, baseURL).toString();
        const safeRoute = toSafePath(route);
        const routeDir = path.join(outputRoot, device.name, safeRoute);
        fs.mkdirSync(routeDir, { recursive: true });

        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        // Screenshot: top
        await page.screenshot({ path: path.join(routeDir, '01-top.png') });
        layoutSignals.push(await getLayoutSignal(page, { route, viewport: device.name, shot: '01-top' }));

        // Scroll + capture a few more viewport snapshots.
        await scrollAndShot(page, routeDir, 2, 700);
        layoutSignals.push(await getLayoutSignal(page, { route, viewport: device.name, shot: '02-scroll' }));
        await scrollAndShot(page, routeDir, 3, 900);
        layoutSignals.push(await getLayoutSignal(page, { route, viewport: device.name, shot: '03-scroll' }));

        // Attempt to reach near-bottom, then screenshot.
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(routeDir, '99-bottom.png') });
        layoutSignals.push(await getLayoutSignal(page, { route, viewport: device.name, shot: '99-bottom' }));

        // Reset to top for next route (avoids odd carry-over on some pages).
        await page.evaluate(() => window.scrollTo(0, 0));
      }

      // Attach any errors for quick review.
      if (errors.length > 0) {
        const errPath = path.join(outputRoot, device.name, 'errors.json');
        fs.writeFileSync(errPath, JSON.stringify(errors, null, 2));
      }

      // Persist layout signals for this viewport.
      {
        const sigPath = path.join(outputRoot, device.name, 'layout-signals.json');
        fs.writeFileSync(sigPath, JSON.stringify(layoutSignals, null, 2));
      }

      await context.close();
    }
  });
});

async function scrollAndShot(page, routeDir, index, deltaY) {
  await page.mouse.wheel(0, deltaY);
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(routeDir, `0${index}-scroll.png`) });
}

async function getLayoutSignal(page, meta) {
  const signal = await page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const de = document.documentElement;
    const docScrollWidth = de.scrollWidth;
    const overflowPx = Math.max(0, docScrollWidth - vw);

    // Track "visible overflow": only count in-flow elements intersecting viewport.
    let visibleOverflowPx = 0;

    // If we have horizontal overflow, try to identify a few likely offenders.
    const offenders = [];
    if (overflowPx > 1) {
      const all = Array.from(document.querySelectorAll('body *'));
      for (let i = 0; i < all.length; i += 1) {
        const el = all[i];
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (cs.position === 'fixed' || cs.position === 'absolute') continue;
        const rect = el.getBoundingClientRect();
        // ignore zero-size
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
          if (offenders.length >= 12) break;
        }
      }
    }

    return {
      viewport: { width: vw, height: vh },
      docScrollWidth,
      overflowPx: Number(overflowPx.toFixed(2)),
      visibleOverflowPx: Number(visibleOverflowPx.toFixed(2)),
      offenders,
    };
  });

  return {
    ...meta,
    ...signal,
    timestamp: new Date().toISOString(),
  };
}

function toSafePath(route) {
  // e.g. "/" -> "home", "/browse-cars" -> "browse-cars"
  const cleaned = route.replace(/^\/+/, '').replace(/\/+$/, '');
  return cleaned.length ? cleaned.replaceAll('/', '__') : 'home';
}

function discoverAppRoutes(appDir) {
  // Walk app/ and find page.{js,jsx,ts,tsx}. This is a pragmatic "site map"
  // that works locally without relying on a deployed sitemap.
  const routes = [];

  function walk(dir, parts) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      // Skip Next internals and route groups.
      if (ent.isDirectory()) {
        const name = ent.name;
        if (name === 'api') continue;
        if (name === 'internal') continue;
        if (name.startsWith('_')) continue;
        if (name.startsWith('.')) continue;
        if (name.startsWith('@')) continue;
        if (name.startsWith('(') && name.endsWith(')')) {
          walk(path.join(dir, name), parts);
          continue;
        }
        walk(path.join(dir, name), [...parts, name]);
        continue;
      }

      if (!ent.isFile()) continue;
      const file = ent.name;
      if (!/^page\.(js|jsx|ts|tsx)$/.test(file)) continue;

      const route = '/' + parts.join('/');
      routes.push(route === '/' ? '/' : route.replaceAll('//', '/'));
    }
  }

  walk(appDir, []);
  return routes;
}

function normalizeRoutes(routes, dynamicSamples) {
  const out = new Set();

  for (const r of routes) {
    // Skip routes we don't want to hit in a public crawl
    if (r.startsWith('/internal')) continue;

    // Replace dynamic segments if we have a sample; otherwise skip.
    if (r.includes('[')) {
      const sample = dynamicSamples[r];
      if (sample) out.add(sample);
      continue;
    }

    out.add(r);
  }

  // Ensure a few key routes are always present (even if discover misses them).
  out.add('/');
  out.add('/browse-cars');
  out.add('/tuning-shop');
  out.add('/community');
  out.add('/encyclopedia');
  out.add('/al');

  return Array.from(out);
}

async function getSampleCarSlug() {
  try {
    // Prefer the canonical data source used by the app.
    const mod = await import('../../data/cars.js');
    const cars = mod.carData || mod.default;
    const first = Array.isArray(cars) ? cars.find((c) => c?.slug) : null;
    return first?.slug || null;
  } catch {
    return null;
  }
}

