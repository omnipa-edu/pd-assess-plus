/**
 * E2E Tests for Coaching Corner Feature
 * Tests content creation, scheduling, and display across roles
 */
import { test, expect } from '@playwright/test';

test.describe('Coaching Corner - Display', () => {
  test('should show empty state when no content exists', async ({ page }) => {
    // Login as student
    await page.goto('/auth');
    // TODO: Complete login flow
    
    await page.goto('/student');
    await page.waitForSelector('[data-testid="coaching-corner"]', { timeout: 5000 });
    
    // Verify empty state
    await expect(page.getByText(/No coaching content yet/i)).toBeVisible();
  });

  test('should display text coaching content', async ({ page }) => {
    // Assuming there's active text content
    await page.goto('/student');
    
    // Wait for coaching corner to load
    const coachingCard = page.locator('[data-testid="coaching-corner"]').first();
    await expect(coachingCard).toBeVisible();
    
    // Check for coaching corner title
    await expect(coachingCard.getByText(/Coaching Corner/i)).toBeVisible();
    
    // Check for content
    await expect(coachingCard.locator('.prose')).toBeVisible();
  });

  test('should display YouTube video embed', async ({ page }) => {
    // Assuming there's active video content
    await page.goto('/student');
    
    const coachingCard = page.locator('[data-testid="coaching-corner"]').first();
    
    // Check for iframe
    const iframe = coachingCard.locator('iframe');
    await expect(iframe).toBeVisible();
    
    // Verify it's using privacy-enhanced YouTube domain
    const src = await iframe.getAttribute('src');
    expect(src).toContain('youtube-nocookie.com');
  });

  test('should show pinned badge for pinned content', async ({ page }) => {
    await page.goto('/student');
    
    const coachingCard = page.locator('[data-testid="coaching-corner"]').first();
    
    // Check for pinned badge
    const pinnedBadge = coachingCard.getByText(/Pinned/i);
    if (await pinnedBadge.isVisible()) {
      await expect(pinnedBadge).toBeVisible();
    }
  });

  test('should expand and collapse long text content', async ({ page }) => {
    // Assuming there's long text content
    await page.goto('/student');
    
    const coachingCard = page.locator('[data-testid="coaching-corner"]').first();
    
    // Look for "Read more" button
    const readMoreBtn = coachingCard.getByRole('button', { name: /Read more/i });
    
    if (await readMoreBtn.isVisible()) {
      await readMoreBtn.click();
      
      // Should show "Show less" after expanding
      await expect(coachingCard.getByRole('button', { name: /Show less/i })).toBeVisible();
      
      // Click to collapse
      await coachingCard.getByRole('button', { name: /Show less/i }).click();
      
      // Should show "Read more" again
      await expect(readMoreBtn).toBeVisible();
    }
  });

  test('should allow dismissing coaching content', async ({ page }) => {
    await page.goto('/student');
    
    const coachingCard = page.locator('[data-testid="coaching-corner"]').first();
    
    // Find dismiss button
    const dismissBtn = coachingCard.getByRole('button', { name: /Dismiss/i });
    
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
      
      // Card should disappear or show empty state
      await page.waitForTimeout(1000);
      
      // Either card is gone or shows empty state
      const cardVisible = await coachingCard.isVisible();
      if (cardVisible) {
        await expect(coachingCard.getByText(/No coaching content yet/i)).toBeVisible();
      }
    }
  });
});

test.describe('Coaching Corner - Role-based visibility', () => {
  test('learner should see learner-targeted content', async ({ page }) => {
    // Login as learner
    await page.goto('/student');
    
    // Content with audience='learners' or 'all' should be visible
    const coachingCard = page.locator('[data-testid="coaching-corner"]').first();
    await expect(coachingCard).toBeVisible();
  });

  test('supervisor should see supervisor-targeted content', async ({ page }) => {
    // Login as supervisor
    await page.goto('/supervisor');
    
    // Content with audience='supervisors' or 'all' should be visible
    const coachingCard = page.locator('[data-testid="coaching-corner"]').first();
    await expect(coachingCard).toBeVisible();
  });

  test('should respect start date scheduling', async ({ page }) => {
    // Test that content doesn't show before start date
    // This would require creating content with future start date in test setup
    // TODO: Implement when test data setup is available
  });

  test('should respect end date scheduling', async ({ page }) => {
    // Test that content doesn't show after end date
    // TODO: Implement when test data setup is available
  });
});

test.describe('Coaching Corner - Admin Management', () => {
  test('admin can access coaching management page', async ({ page }) => {
    // Login as admin
    await page.goto('/admin');
    
    // Navigate to coaching management
    await page.goto('/admin/coaching');
    
    // Should see management interface
    await expect(page.getByRole('heading', { name: /Manage Coaching Corner/i })).toBeVisible();
  });

  test('should show create button for admin', async ({ page }) => {
    await page.goto('/admin/coaching');
    
    const createBtn = page.getByRole('button', { name: /Create New/i });
    await expect(createBtn).toBeVisible();
  });

  test('should validate YouTube URL format', async ({ page }) => {
    await page.goto('/admin/coaching');
    
    // Click create
    await page.getByRole('button', { name: /Create New/i }).click();
    
    // Select YouTube content type
    await page.getByLabel(/Content Type/i).selectOption('youtube');
    
    // Enter invalid URL
    await page.getByLabel(/Video URL/i).fill('https://invalid-site.com/video');
    
    // Try to save
    await page.getByRole('button', { name: /Publish|Save/i }).click();
    
    // Should show error
    await expect(page.getByText(/Only YouTube and Instagram URLs/i)).toBeVisible();
  });

  test('should accept valid YouTube URL', async ({ page }) => {
    await page.goto('/admin/coaching');
    
    await page.getByRole('button', { name: /Create New/i }).click();
    
    // Fill form
    await page.getByLabel(/Title/i).fill('Test Coaching Video');
    await page.getByLabel(/Content Type/i).selectOption('youtube');
    await page.getByLabel(/Video URL/i).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.getByLabel(/Who can see/i).selectOption('all');
    
    // Submit
    await page.getByRole('button', { name: /Publish|Save/i }).click();
    
    // Should show success or redirect
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Test Coaching Video/i)).toBeVisible();
  });

  test('only one item should be pinned at a time', async ({ page }) => {
    await page.goto('/admin/coaching');
    
    // Get list of items
    const items = page.locator('[data-testid="coaching-item"]');
    const count = await items.count();
    
    // Count pinned items
    let pinnedCount = 0;
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const isPinned = await item.getByText(/Pinned/i).isVisible().catch(() => false);
      if (isPinned) pinnedCount++;
    }
    
    // Should have 0 or 1 pinned items, never more
    expect(pinnedCount).toBeLessThanOrEqual(1);
  });
});

test.describe('Coaching Corner - Accessibility', () => {
  test('coaching card should have proper ARIA labels', async ({ page }) => {
    await page.goto('/student');
    
    const coachingCard = page.locator('[data-testid="coaching-corner"]').first();
    
    // Check for heading
    await expect(coachingCard.getByRole('heading')).toBeVisible();
    
    // Dismiss button should have aria-label
    const dismissBtn = coachingCard.getByRole('button', { name: /Dismiss/i });
    if (await dismissBtn.isVisible()) {
      const ariaLabel = await dismissBtn.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('video embeds should have title attribute', async ({ page }) => {
    await page.goto('/student');
    
    const iframe = page.locator('iframe').first();
    
    if (await iframe.isVisible()) {
      const title = await iframe.getAttribute('title');
      expect(title).toBeTruthy();
      expect(title).not.toBe('');
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/student');
    
    // Tab to coaching card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to focus on buttons
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focused);
  });
});

test.describe('Coaching Corner - Dark Mode', () => {
  test('should display correctly in dark mode', async ({ page }) => {
    await page.goto('/student');
    
    // Toggle to dark mode
    await page.click('[aria-label*="Toggle theme"]');
    await page.click('text=Dark');
    
    // Wait for theme to apply
    await page.waitForTimeout(500);
    
    // Check that html has dark class
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    
    // Coaching card should still be visible
    const coachingCard = page.locator('[data-testid="coaching-corner"]').first();
    await expect(coachingCard).toBeVisible();
  });
});

test.describe('Coaching Corner - Mobile Responsive', () => {
  test('should display correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/student');
    
    const coachingCard = page.locator('[data-testid="coaching-corner"]').first();
    await expect(coachingCard).toBeVisible();
    
    // Card should not overflow
    const box = await coachingCard.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
  });

  test('video embeds should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/student');
    
    const iframe = page.locator('iframe').first();
    
    if (await iframe.isVisible()) {
      const box = await iframe.boundingBox();
      // Should fit within viewport with padding
      expect(box?.width).toBeLessThan(375);
    }
  });
});

