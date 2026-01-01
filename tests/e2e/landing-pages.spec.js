import { test, expect } from '@playwright/test';

test('landing pages load and primary CTAs navigate', async ({ page, baseURL }) => {
  const cases = [
    {
      route: '/landing/find-your-car',
      heading: 'Which Sports Car Actually Fits You?',
      cta: 'Find Your Perfect Match',
      expectedUrl: /\/car-selector(?:\?|#|$)/,
    },
    {
      route: '/landing/your-garage',
      heading: 'All Your Car Details in One Place',
      cta: 'Add Your Car',
      expectedUrl: /\/garage(?:\?|#|$)/,
    },
    {
      route: '/landing/tuning-shop',
      heading: 'Plan Your Build Before You Buy',
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


