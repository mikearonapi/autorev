import { test, expect } from '@playwright/test';

test('landing pages load and primary CTAs navigate', async ({ page, baseURL }) => {
  const cases = [
    {
      route: '/landing/find-your-car',
      heading: 'Find the Perfect Sports Car for You',
      cta: 'Find Your Perfect Match',
      expectedUrl: /\/car-selector(?:\?|#|$)/,
    },
    {
      route: '/landing/your-garage',
      heading: 'Everything About Your Car. One Place.',
      cta: 'Add Your Car',
      expectedUrl: /\/garage(?:\?|#|$)/,
    },
    {
      route: '/landing/tuning-shop',
      heading: 'Build Smarter, Not Random',
      cta: 'Open Tuning Shop',
      expectedUrl: /\/tuning-shop(?:\?|#|$)/,
    },
  ];

  for (const c of cases) {
    await page.goto(new URL(c.route, baseURL).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: c.heading })).toBeVisible();

    await page.getByRole('link', { name: c.cta, exact: true }).first().click();
    await expect(page).toHaveURL(c.expectedUrl);
  }
});


