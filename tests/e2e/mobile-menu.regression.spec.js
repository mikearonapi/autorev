import { test, expect } from '@playwright/test';

// Keep this test small + deterministic: it guards the reported regression
// ("menu only visible at top of page on mobile").
test('mobile menu works after scrolling down', async ({ page, baseURL }) => {
  // Use a realistic mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(new URL('/browse-cars', baseURL).toString(), { waitUntil: 'domcontentloaded' });

  // Scroll down enough that sticky/fixed widgets appear
  for (let i = 0; i < 4; i += 1) {
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(150);
  }

  // Open menu
  // In dev, hydration can be slightly delayed; first click may land before handlers attach.
  await page.getByTestId('mobile-menu-toggle').click();
  await page.waitForTimeout(150);
  if ((await page.getByTestId('mobile-nav').getAttribute('data-open')) !== 'true') {
    await page.getByTestId('mobile-menu-toggle').click();
  }

  // Scope to the *mobile* menu panel to avoid footer link collisions.
  const mobileMenuPanel = page.getByTestId('mobile-nav');
  await expect(mobileMenuPanel).toHaveAttribute('data-open', 'true');
  await expect(mobileMenuPanel).toBeVisible();

  // If the menu is behind other layers, this click will often fail due to intercept.
  await mobileMenuPanel.getByRole('link', { name: 'Encyclopedia' }).click();
  await expect(page).toHaveURL(/\/encyclopedia(?:\?|#|$)/);
});

