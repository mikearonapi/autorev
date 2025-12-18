import { test, expect } from '@playwright/test';

test('tuning shop onboarding stays as a fixed overlay while scrolling', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  // Force onboarding to show (component supports this param).
  await page.goto(new URL('/tuning-shop?reset_onboarding=true', baseURL).toString(), {
    waitUntil: 'domcontentloaded',
  });

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Welcome to the Tuning Shop' })).toBeVisible();

  // The overlay element is the dialog's parent (see OnboardingPopup.jsx structure).
  const overlay = dialog.locator('..');

  // Regression guard: overlay must be fixed (not turned into relative by page CSS).
  await expect
    .poll(async () => overlay.evaluate((el) => getComputedStyle(el).position), {
      message: 'Onboarding overlay should remain position: fixed',
    })
    .toBe('fixed');

  const innerHeightBefore = await page.evaluate(() => window.innerHeight);
  const before = await dialog.boundingBox();
  expect(before).toBeTruthy();

  // Scroll the page; the onboarding should not "move into view" or drift.
  for (let i = 0; i < 6; i += 1) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(120);
  }

  await expect(dialog).toBeVisible();
  const after = await dialog.boundingBox();
  expect(after).toBeTruthy();
  const innerHeightAfter = await page.evaluate(() => window.innerHeight);

  // If it becomes inline content, its Y coordinate will shift drastically.
  // Allow shift caused by mobile viewport height changes (address bar hide/show).
  const allowedShift = Math.abs(innerHeightAfter - innerHeightBefore) / 2 + 12;
  expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(allowedShift);
});

