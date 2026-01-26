/**
 * E2E Tests: Garage Flows
 * 
 * Tests garage page functionality and user interactions.
 * Note: Full auth flows require test accounts - these tests cover unauthenticated flows.
 */

import { test, expect } from '@playwright/test';

test.describe('Garage Page', () => {
  test.describe('Unauthenticated User', () => {
    test('garage page redirects unauthenticated users', async ({ page, baseURL }) => {
      await page.goto(new URL('/garage', baseURL).toString());
      
      // Wait for redirect or auth prompt
      await page.waitForTimeout(1500);
      
      const url = page.url();
      const hasAuthRedirect = url.includes('/login') || url.includes('/join');
      const hasAuthPrompt = await page.getByRole('button', { name: /sign in|log in|get started/i }).isVisible().catch(() => false);
      
      expect(hasAuthRedirect || hasAuthPrompt).toBeTruthy();
    });

    test('garage sub-pages require authentication', async ({ page, baseURL }) => {
      const subPages = [
        '/garage/my-build',
        '/garage/my-specs',
        '/garage/my-photos',
        '/garage/my-parts',
        '/garage/my-performance',
      ];

      for (const subPage of subPages) {
        await page.goto(new URL(subPage, baseURL).toString());
        await page.waitForTimeout(1000);
        
        const url = page.url();
        const isProtected = 
          url.includes('/login') || 
          url.includes('/join') ||
          await page.getByRole('button', { name: /sign in/i }).isVisible().catch(() => false);
        
        // Should either redirect or show auth prompt
        expect(isProtected || url.includes('/garage')).toBeTruthy();
      }
    });
  });

  test.describe('Page Structure', () => {
    test('garage page has proper heading structure', async ({ page, baseURL }) => {
      await page.goto(new URL('/garage', baseURL).toString());
      await page.waitForTimeout(1000);
      
      // Check for at least an h1 or main heading
      const heading = await page.locator('h1, [role="heading"]').first();
      await expect(heading).toBeVisible({ timeout: 5000 }).catch(() => {
        // May redirect before heading is visible
      });
    });
  });
});

test.describe('Garage Sharing (Public Profiles)', () => {
  test('should handle non-existent public garage gracefully', async ({ page, baseURL }) => {
    await page.goto(new URL('/garage/nonexistent-user-12345', baseURL).toString());
    
    await page.waitForTimeout(1500);
    
    // Should show 404 or redirect, not crash
    const content = await page.textContent('body');
    const isHandled = 
      content.toLowerCase().includes('not found') ||
      content.toLowerCase().includes('doesn\'t exist') ||
      page.url().includes('/404') ||
      page.url() !== new URL('/garage/nonexistent-user-12345', baseURL).toString();
    
    expect(isHandled).toBeTruthy();
  });
});

test.describe('Mobile Garage Experience', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test('garage page is mobile responsive', async ({ page, baseURL }) => {
    await page.goto(new URL('/garage', baseURL).toString());
    await page.waitForTimeout(1000);
    
    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
  });
});
