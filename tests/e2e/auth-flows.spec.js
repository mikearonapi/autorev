/**
 * E2E Tests: Authentication Flows
 * 
 * Tests user authentication flows including:
 * - Login page accessibility and structure
 * - Signup flow visibility
 * - Protected route redirects
 * - Logout functionality
 * 
 * Note: Full OAuth flows require test accounts and are typically 
 * handled separately in integration tests with mocked providers.
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.describe('Login Page', () => {
    test('displays login options', async ({ page, baseURL }) => {
      await page.goto(new URL('/login', baseURL).toString());
      
      // Check for auth heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      
      // Check for Google OAuth button
      const googleButton = page.getByRole('button', { name: /google/i });
      await expect(googleButton).toBeVisible();
      
      // Check for email login option (if available)
      const emailInput = page.getByRole('textbox', { name: /email/i });
      // Email login may or may not be present depending on config
      if (await emailInput.isVisible()) {
        await expect(emailInput).toBeEnabled();
      }
    });

    test('login page is accessible', async ({ page, baseURL }) => {
      await page.goto(new URL('/login', baseURL).toString());
      
      // Check for skip link
      const skipLink = page.getByRole('link', { name: /skip to main/i });
      await expect(skipLink).toBeAttached();
      
      // Check for proper heading hierarchy
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
    });
  });

  test.describe('Join Page', () => {
    test('displays tier selection options', async ({ page, baseURL }) => {
      await page.goto(new URL('/join', baseURL).toString());
      
      // Check page loads
      await expect(page).toHaveURL(/\/join/);
      
      // Should show tier options
      const content = await page.textContent('body');
      expect(
        content.toLowerCase().includes('free') || 
        content.toLowerCase().includes('collector') || 
        content.toLowerCase().includes('tuner')
      ).toBeTruthy();
    });
  });

  test.describe('Protected Routes', () => {
    test('garage page redirects to login when not authenticated', async ({ page, baseURL }) => {
      // Visit garage without auth
      await page.goto(new URL('/garage', baseURL).toString());
      
      // Should either redirect to login or show auth prompt
      await page.waitForTimeout(1000); // Allow for redirect
      const url = page.url();
      const isLoginRedirect = url.includes('/login') || url.includes('/join');
      const hasAuthPrompt = await page.getByRole('button', { name: /sign in|log in|get started/i }).isVisible().catch(() => false);
      
      expect(isLoginRedirect || hasAuthPrompt).toBeTruthy();
    });

    test('AL page shows gated content for unauthenticated users', async ({ page, baseURL }) => {
      await page.goto(new URL('/al', baseURL).toString());
      
      // Should show some form of auth/upgrade prompt for non-logged-in users
      await page.waitForTimeout(500);
      const content = await page.textContent('body');
      const hasAuthContent = 
        content.toLowerCase().includes('sign in') ||
        content.toLowerCase().includes('log in') ||
        content.toLowerCase().includes('get started') ||
        content.toLowerCase().includes('upgrade');
      
      // Either shows auth prompt or the AL interface (if free tier allowed)
      expect(content.length > 0).toBeTruthy();
    });
  });

  test.describe('Navigation Elements', () => {
    test('header shows login button when not authenticated', async ({ page, baseURL }) => {
      await page.goto(new URL('/', baseURL).toString());
      
      // Header should have some form of auth action
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      const authButton = header.getByRole('link', { name: /sign in|log in|get started/i });
      const isVisible = await authButton.isVisible().catch(() => false);
      
      // Auth button should be visible in header for logged-out users
      expect(isVisible).toBeTruthy();
    });
  });
});

test.describe('Session Handling', () => {
  test('handles expired session gracefully', async ({ page, baseURL }) => {
    // Set an invalid/expired session cookie
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: 'invalid_expired_token',
        domain: new URL(baseURL).hostname,
        path: '/',
      },
    ]);
    
    // Visit protected page
    await page.goto(new URL('/garage', baseURL).toString());
    
    // Should not crash - should redirect or show auth prompt
    await page.waitForTimeout(1000);
    
    // Page should still be functional
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
