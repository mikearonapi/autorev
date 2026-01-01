import { test, expect } from '@playwright/test';

test('landing pages load and primary CTAs navigate', async ({ page, baseURL }) => {
  const cases = [
    {
      route: '/landing/find-your-car',
      heading: 'Find Your Perfect Sports Car in 2 Minutes',
      cta: 'Take the Quiz',
      expectedUrl: /\/car-selector(?:\?|#|$)/,
    },
    {
      route: '/landing/your-garage',
      heading: "Your Car's Command Center",
      cta: 'Add Your Car',
      expectedUrl: /\/garage(?:\?|#|$)/,
    },
    {
      route: '/landing/tuning-shop',
      heading: 'Stop Guessing. Start Building.',
      cta: 'Explore Parts',
      expectedUrl: /\/tuning-shop(?:\?|#|$)/,
    },
  ];

  for (const c of cases) {
    await page.goto(new URL(c.route, baseURL).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: c.heading })).toBeVisible();

    await page.getByRole('link', { name: c.cta, exact: true }).click();
    await expect(page).toHaveURL(c.expectedUrl);
  }
});


