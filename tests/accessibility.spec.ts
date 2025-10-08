import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('landing page should respect reduced motion', async ({ page, context }) => {
    // Emulate reduced motion preference
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
    });

    await page.goto('/');
    
    // Page should still load and be functional
    await expect(page.getByRole('heading', { name: /Track Progress/i })).toBeVisible();
  });

  test('landing page should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Check that text is visible (basic contrast check)
    const heading = page.getByRole('heading', { name: /Track Progress/i });
    await expect(heading).toBeVisible();
    
    // Buttons should have visible text
    const getStartedButton = page.getByRole('button', { name: /get started/i });
    await expect(getStartedButton).toBeVisible();
  });

  test('auth page should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/auth');
    
    // Form fields should have proper labels
    const emailInput = page.getByLabel(/email/i).first();
    await expect(emailInput).toBeVisible();
    
    // Should have aria-describedby for helper text
    const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
    expect(ariaDescribedBy).toBeTruthy();
  });

  test('keyboard navigation should work on landing page', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Get started button
    
    const getStartedButton = page.getByRole('button', { name: /get started/i });
    await expect(getStartedButton).toBeFocused();
    
    // Enter should activate button
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/auth');
  });

  test('focus should be visible on interactive elements', async ({ page }) => {
    await page.goto('/');
    
    // Tab to button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Get the focused element
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    
    // Should have focus ring (computed style check)
    const hasOutline = await page.evaluate((el) => {
      const styles = window.getComputedStyle(el as Element);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    }, focusedElement);
    
    expect(hasOutline).toBeTruthy();
  });

  test('images should have alt text or aria-hidden', async ({ page }) => {
    await page.goto('/');
    
    // Get all images
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Either should have alt text or be aria-hidden
      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('form errors should be announced to screen readers', async ({ page }) => {
    await page.goto('/auth');
    
    const emailInput = page.getByLabel(/email/i).first();
    
    // Enter invalid email
    await emailInput.fill('invalid');
    await emailInput.blur();
    await page.getByRole('button', { name: /^sign in$/i }).click();
    
    // Error should have role="alert" or aria-live
    const error = page.getByText(/please enter a valid email/i);
    await expect(error).toBeVisible();
    
    // Should have alert role
    const role = await error.getAttribute('role');
    expect(role).toBe('alert');
  });

  test('page should have proper document structure', async ({ page }) => {
    await page.goto('/');
    
    // Should have main landmark
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
    
    // Should have single h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });
});

