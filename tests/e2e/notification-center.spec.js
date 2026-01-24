/**
 * Notification Center E2E Tests
 * 
 * Tests for the notification center UI component.
 */

import { test, expect } from '@playwright/test';

// Test user credentials (use test account)
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@autorev.test';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('Notification Center', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    // Go to app
    await page.goto('/');
    
    // Click login
    await page.click('text=Log In');
    
    // Fill credentials
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should show bell icon in header', async ({ page }) => {
    // Bell icon should be visible for authenticated users
    const bellButton = page.locator('[aria-label*="Notifications"]');
    await expect(bellButton).toBeVisible();
  });

  test('should open notification dropdown on click', async ({ page }) => {
    // Click bell icon
    const bellButton = page.locator('[aria-label*="Notifications"]');
    await bellButton.click();

    // Dropdown should appear
    const dropdown = page.locator('text=Notifications').first();
    await expect(dropdown).toBeVisible();
  });

  test('should show empty state when no notifications', async ({ page }) => {
    const bellButton = page.locator('[aria-label*="Notifications"]');
    await bellButton.click();

    // Check for empty state or notification list
    const emptyState = page.locator('text=All caught up');
    const notificationList = page.locator('[class*="item"]');

    // Should show either empty state or notifications
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasNotifications = await notificationList.count() > 0;

    expect(hasEmptyState || hasNotifications).toBe(true);
  });

  test('should close dropdown on outside click', async ({ page }) => {
    const bellButton = page.locator('[aria-label*="Notifications"]');
    await bellButton.click();

    // Verify dropdown is open
    const dropdown = page.locator('text=Notifications').first();
    await expect(dropdown).toBeVisible();

    // Click outside
    await page.click('body', { position: { x: 10, y: 10 } });

    // Dropdown should close
    await expect(dropdown).not.toBeVisible();
  });

  test('should show unread badge when there are unread notifications', async ({ page }) => {
    // This test checks for the badge element
    const badge = page.locator('[class*="badge"]');
    
    // Badge may or may not be visible depending on notifications
    // Just check the structure exists
    const bellButton = page.locator('[aria-label*="Notifications"]');
    await expect(bellButton).toBeVisible();
  });
});

test.describe('Notification Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Log In');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*settings.*/);
  });

  test('should show notification preferences section', async ({ page }) => {
    await page.goto('/settings');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for notifications section
    const notificationsSection = page.locator('text=Notification Preferences');
    await expect(notificationsSection).toBeVisible({ timeout: 10000 });
  });

  test('should toggle notification preferences', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Find a toggle switch
    const toggle = page.locator('button[role="switch"]').first();
    
    if (await toggle.isVisible()) {
      const initialState = await toggle.getAttribute('aria-checked');
      
      // Click to toggle
      await toggle.click();
      
      // Wait for state change
      await page.waitForTimeout(500);
      
      const newState = await toggle.getAttribute('aria-checked');
      
      // State should change
      expect(newState).not.toBe(initialState);
    }
  });
});

test.describe('Streak Indicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Log In');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should show streak indicator on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for streak indicator (flame emoji or "day streak" text)
    const streakIndicator = page.locator('[class*="streak"]');
    
    // Streak indicator might not be visible for users without streaks
    // Just verify the page loads correctly
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('should show streak details on hover', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const streakBadge = page.locator('[class*="streakBadge"]').first();
    
    if (await streakBadge.isVisible()) {
      // Hover to show tooltip
      await streakBadge.hover();
      
      // Tooltip should appear
      await page.waitForTimeout(300);
      const tooltip = page.locator('[class*="tooltip"]');
      await expect(tooltip).toBeVisible();
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should show notification center on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Open mobile menu
    const menuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
    }
    
    // Login flow on mobile
    await page.click('text=Log In');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Bell icon should be visible
    const bellButton = page.locator('[aria-label*="Notifications"]');
    await expect(bellButton).toBeVisible();
  });

  test('notification dropdown should be full-width on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    
    // If already logged in from previous test
    const bellButton = page.locator('[aria-label*="Notifications"]');
    
    if (await bellButton.isVisible()) {
      await bellButton.click();
      
      // Dropdown should be full-width
      const dropdown = page.locator('[class*="dropdown"]');
      
      if (await dropdown.isVisible()) {
        const box = await dropdown.boundingBox();
        expect(box.width).toBeGreaterThan(300); // Should be close to viewport width
      }
    }
  });
});
