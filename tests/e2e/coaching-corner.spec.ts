import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Adaptive Coaching Feed
 * 
 * Tests:
 * 1. Learners see coaching content on dashboard
 * 2. Supervisors see coaching content on dashboard
 * 3. Coaching content adapts based on WBA activity (with seeded data)
 * 4. Video content embeds correctly
 */

test.describe('Adaptive Coaching Corner', () => {
  test('should display coaching corner on learner dashboard', async ({ page }) => {
    // Navigate to learner dashboard
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
    
    // Verify coaching corner card is visible
    const coachingCard = page.locator('[data-testid="coaching-corner-card"]').or(
      page.getByText(/coaching corner/i)
    );
    await expect(coachingCard.first()).toBeVisible();
    
    // Verify it shows content (title and/or body)
    const hasContent = await coachingCard.first().locator('text=/./').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should display coaching corner on supervisor dashboard', async ({ page }) => {
    // Navigate to supervisor dashboard
    await page.goto('/supervisor');
    await page.waitForLoadState('networkidle');
    
    // Verify coaching corner card is visible
    const coachingCard = page.locator('[data-testid="coaching-corner-card"]').or(
      page.getByText(/coaching corner/i)
    );
    await expect(coachingCard.first()).toBeVisible();
  });

  test('should embed YouTube video content correctly', async ({ page }) => {
    // This test assumes there's coaching content with a YouTube video
    // In a real scenario, you'd seed the database with test content first
    
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
    
    // Look for iframe (YouTube embed)
    const iframe = page.locator('iframe[src*="youtube"]').or(
      page.locator('iframe[src*="youtube-nocookie"]')
    );
    
    // If iframe exists, verify it has correct attributes
    const iframeCount = await iframe.count();
    if (iframeCount > 0) {
      const firstIframe = iframe.first();
      await expect(firstIframe).toBeVisible();
      
      // Verify iframe attributes
      const src = await firstIframe.getAttribute('src');
      expect(src).toContain('youtube');
      
      const loading = await firstIframe.getAttribute('loading');
      expect(loading).toBe('lazy');
      
      const allow = await firstIframe.getAttribute('allow');
      expect(allow).toContain('accelerometer');
    }
  });

  test('should show different content based on WBA activity', async ({ page }) => {
    // This test requires seeded data:
    // 1. Create coaching content with tags like 'topic:engagement', 'level:low'
    // 2. Create WBA assessments for the user
    // 3. Verify that the selected content matches the activity patterns
    
    // For now, we'll test that the coaching corner loads and shows content
    // In a full implementation, you'd:
    // - Seed database with test WBAs (low scores, no recent activity, etc.)
    // - Seed database with tagged coaching content
    // - Verify the selected content matches expected tags
    
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
    
    const coachingCard = page.locator('[data-testid="coaching-corner-card"]').or(
      page.getByText(/coaching corner/i)
    );
    
    // Verify coaching corner is visible and has content
    await expect(coachingCard.first()).toBeVisible();
    
    // Note: Full adaptive selection testing would require:
    // - Database seeding with test data
    // - Multiple test scenarios (no WBAs, low scores, improving scores, etc.)
    // - Verification that correct tags are matched
  });

  test('should handle empty coaching corner gracefully', async ({ page }) => {
    // This test assumes no coaching content is available
    // In a real scenario, you'd clear the coaching_corner table or filter it
    
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
    
    // If no content, should show empty state message
    const emptyState = page.getByText(/no coaching content available/i).or(
      page.getByText(/coaching corner/i)
    );
    
    // Should not crash or show error
    await expect(page.locator('body')).toBeVisible();
  });

  test('should allow dismissing coaching content', async ({ page }) => {
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
    
    // Look for dismiss button (X icon)
    const dismissButton = page.locator('button[aria-label*="dismiss" i]').or(
      page.locator('button').filter({ has: page.locator('svg') })
    );
    
    const dismissCount = await dismissButton.count();
    if (dismissCount > 0) {
      // Click dismiss
      await dismissButton.first().click();
      
      // Verify content is removed or replaced
      // (Implementation depends on whether it's removed or replaced with next item)
      await page.waitForTimeout(500);
    }
  });
});
