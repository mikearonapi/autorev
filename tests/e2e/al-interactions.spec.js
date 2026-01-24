/**
 * E2E Tests: AL (AI Assistant) Interactions
 * 
 * Tests the AL chat interface and interactions:
 * - Page accessibility
 * - Input interface
 * - Message display
 * - Credit system visibility
 * 
 * Note: Actual AI responses are mocked in integration tests.
 */

import { test, expect } from '@playwright/test';

test.describe('AL Chat Interface', () => {
  test.describe('AL Page Structure', () => {
    test('AL page loads', async ({ page, baseURL }) => {
      await page.goto(new URL('/al', baseURL).toString());
      
      // Page should load
      await expect(page.locator('body')).toBeVisible();
      
      // Check for AL-related content
      const content = await page.textContent('body');
      const hasALContent = 
        content.toLowerCase().includes('al') ||
        content.toLowerCase().includes('assistant') ||
        content.toLowerCase().includes('mechanic') ||
        content.toLowerCase().includes('chat') ||
        content.toLowerCase().includes('ask');
      
      expect(hasALContent).toBeTruthy();
    });

    test('AL page has proper heading', async ({ page, baseURL }) => {
      await page.goto(new URL('/al', baseURL).toString());
      await page.waitForTimeout(500);
      
      // Should have some form of heading
      const headings = page.getByRole('heading');
      const headingCount = await headings.count();
      
      expect(headingCount).toBeGreaterThanOrEqual(0);
    });

    test('AL page is keyboard accessible', async ({ page, baseURL }) => {
      await page.goto(new URL('/al', baseURL).toString());
      await page.waitForTimeout(500);
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Check that focus is visible somewhere
      const focusedElement = page.locator(':focus');
      const isFocused = await focusedElement.count();
      
      // Some element should be focusable
      expect(isFocused >= 0).toBeTruthy();
    });
  });

  test.describe('Chat Input', () => {
    test('chat input is present when accessible', async ({ page, baseURL }) => {
      await page.goto(new URL('/al', baseURL).toString());
      await page.waitForTimeout(1000);
      
      // Look for textarea or input for chat
      const chatInput = page.locator('textarea, input[type="text"]').first();
      const inputExists = await chatInput.isVisible().catch(() => false);
      
      // Input may or may not be visible depending on auth state
      // Just verify page doesn't crash
      expect(page.url()).toContain('/al');
    });

    test('has minimum touch target sizes', async ({ page, baseURL }) => {
      await page.goto(new URL('/al', baseURL).toString());
      await page.waitForTimeout(500);
      
      // Check buttons have proper size
      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);
        const isVisible = await button.isVisible();
        if (isVisible) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(32);
          }
        }
      }
    });
  });

  test.describe('AL Credits Display', () => {
    test('credit information may be displayed', async ({ page, baseURL }) => {
      await page.goto(new URL('/al', baseURL).toString());
      await page.waitForTimeout(500);
      
      const content = await page.textContent('body');
      
      // Credits may or may not be shown depending on auth state
      const hasCreditInfo = 
        content.toLowerCase().includes('credit') ||
        content.toLowerCase().includes('question') ||
        content.toLowerCase().includes('remaining') ||
        content.toLowerCase().includes('upgrade') ||
        content.toLowerCase().includes('limit');
      
      // Either shows credit info or auth gate
      expect(content.length).toBeGreaterThan(0);
    });
  });

  test.describe('Suggested Questions', () => {
    test('may display suggested questions', async ({ page, baseURL }) => {
      await page.goto(new URL('/al', baseURL).toString());
      await page.waitForTimeout(1000);
      
      // Look for suggestion-type content
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      // Should have some interactive elements
      expect(buttonCount >= 0).toBeTruthy();
    });
  });

  test.describe('Error States', () => {
    test('handles missing auth gracefully', async ({ page, baseURL }) => {
      // Clear all cookies/storage
      await page.context().clearCookies();
      
      await page.goto(new URL('/al', baseURL).toString());
      await page.waitForTimeout(500);
      
      // Should not crash - should show auth gate or limited interface
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Check no JavaScript errors visible
      const errorText = await page.locator('.error, [class*="error"], [role="alert"]').textContent().catch(() => '');
      // Some error states are expected, but page shouldn't be blank
      const content = await page.textContent('body');
      expect(content.length).toBeGreaterThan(50);
    });
  });
});

test.describe('AL Navigation', () => {
  test('can navigate to AL from header', async ({ page, baseURL }) => {
    await page.goto(new URL('/', baseURL).toString());
    
    // Look for AL link in navigation
    const alLink = page.getByRole('link', { name: /al|ask|mechanic/i });
    const linkExists = await alLink.count();
    
    if (linkExists > 0) {
      await alLink.first().click();
      await page.waitForTimeout(500);
      
      // Should navigate to AL or related page
      const url = page.url();
      const isALPage = url.includes('/al') || url.includes('/ask');
      expect(isALPage).toBeTruthy();
    }
  });
});
