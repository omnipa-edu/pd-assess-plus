import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render landing page', async ({ page }) => {
    // Check that the hero section is visible
    await expect(page.getByRole('heading', { name: /Track Progress.*Coach Better.*Grow Faster/i })).toBeVisible();
  });

  test('should have primary CTA that navigates to auth', async ({ page }) => {
    // Click "Get started" button
    const getStartedButton = page.getByRole('button', { name: /get started/i });
    await expect(getStartedButton).toBeVisible();
    await getStartedButton.click();

    // Should navigate to auth page
    await expect(page).toHaveURL('/auth');
  });

  test('should have secondary CTA that scrolls to "How it works"', async ({ page }) => {
    // Click "Learn more" button
    const learnMoreButton = page.getByRole('button', { name: /learn more/i });
    await expect(learnMoreButton).toBeVisible();
    await learnMoreButton.click();

    // Should scroll to how-it-works section
    const howItWorksSection = page.locator('#how-it-works');
    await expect(howItWorksSection).toBeInViewport();
  });

  test('should display all three features', async ({ page }) => {
    // Check all three feature cards are visible
    await expect(page.getByText('Capture in seconds')).toBeVisible();
    await expect(page.getByText('See meaningful trends')).toBeVisible();
    await expect(page.getByText('Export & share')).toBeVisible();
  });

  test('should display "How it works" section with 3 steps', async ({ page }) => {
    await expect(page.getByText('Observe')).toBeVisible();
    await expect(page.getByText('Coach')).toBeVisible();
    await expect(page.getByText('Grow')).toBeVisible();
  });

  test('should display footer with links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /privacy policy/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /terms of service/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contact us/i })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Hero should still be visible
    await expect(page.getByRole('heading', { name: /Track Progress/i })).toBeVisible();
    
    // CTAs should be visible
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
  });

  test('should have skip to content link for accessibility', async ({ page }) => {
    // Tab to focus skip link
    await page.keyboard.press('Tab');
    
    // Skip link should be focused and visible when focused
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeFocused();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Get all headings
    const h1 = await page.locator('h1').count();
    const h2 = await page.locator('h2').count();
    
    // Should have exactly one h1
    expect(h1).toBe(1);
    
    // Should have multiple h2s for sections
    expect(h2).toBeGreaterThan(0);
  });
});

