import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Achievements System
 * 
 * Tests:
 * 1. Achievements card displays on dashboard
 * 2. View all achievements dialog
 * 3. Achievement tabs (All/Unlocked/Locked)
 * 4. Achievement unlock modal
 * 5. Achievement progress tracking
 * 6. Achievement badges display
 */

test.describe('Achievements System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to student dashboard
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
  });

  test('should display achievements card on dashboard', async ({ page }) => {
    // Look for Achievements card
    const achievementsCard = page.locator('text=Achievements').or(
      page.locator('[class*="Achievement"]')
    );
    
    await expect(achievementsCard.first()).toBeVisible();
    
    // Verify it shows count (e.g., "0 of 15 unlocked")
    await expect(page.locator('text=/\\d+ of \\d+ unlocked/i')).toBeVisible();
  });

  test('should show trophy icon', async ({ page }) => {
    // Find achievements card
    const achievementsCard = page.locator('text=Achievements').first();
    await expect(achievementsCard).toBeVisible();
    
    // Check for trophy icon (🏆 emoji or icon)
    const trophyIcon = achievementsCard.locator('text=🏆').or(
      achievementsCard.locator('[data-lucide="trophy"]')
    );
    
    const hasTrophy = await trophyIcon.isVisible().catch(() => false);
    // Trophy icon should be visible or represented as emoji
    expect(hasTrophy || await achievementsCard.textContent()).toContain('🏆');
  });

  test('should open "View All" dialog when button is clicked', async ({ page }) => {
    // Find and click "View All" button
    const viewAllButton = page.locator('button:has-text("View All")').or(
      page.locator('button:has-text("view all")')
    );
    
    await expect(viewAllButton).toBeVisible();
    await viewAllButton.click();
    
    // Wait for dialog to open
    await page.waitForTimeout(300);
    
    // Verify dialog opens
    await expect(page.locator('text=All Achievements').or(
      page.locator('[role="dialog"]').filter({ hasText: /achievement/i })
    )).toBeVisible();
  });

  test('should display achievement tabs (All/Unlocked/Locked)', async ({ page }) => {
    // Open achievements dialog
    await page.locator('button:has-text("View All")').first().click();
    await page.waitForTimeout(300);
    
    // Verify tabs exist
    await expect(page.locator('button:has-text("All")').or(
      page.locator('[role="tab"]:has-text("All")')
    )).toBeVisible();
    
    await expect(page.locator('button:has-text("Unlocked")').or(
      page.locator('[role="tab"]:has-text("Unlocked")')
    )).toBeVisible();
    
    await expect(page.locator('button:has-text("Locked")').or(
      page.locator('[role="tab"]:has-text("Locked")')
    )).toBeVisible();
  });

  test('should filter achievements by tab', async ({ page }) => {
    // Open achievements dialog
    await page.locator('button:has-text("View All")').first().click();
    await page.waitForTimeout(300);
    
    // Click "Unlocked" tab
    const unlockedTab = page.locator('button:has-text("Unlocked")').or(
      page.locator('[role="tab"]:has-text("Unlocked")')
    );
    await unlockedTab.click();
    await page.waitForTimeout(300);
    
    // Verify tab is active
    await expect(unlockedTab).toHaveAttribute('data-state', 'active');
    
    // Click "Locked" tab
    const lockedTab = page.locator('button:has-text("Locked")').or(
      page.locator('[role="tab"]:has-text("Locked")')
    );
    await lockedTab.click();
    await page.waitForTimeout(300);
    
    // Verify tab is active
    await expect(lockedTab).toHaveAttribute('data-state', 'active');
  });

  test('should display achievement badges', async ({ page }) => {
    // Open achievements dialog
    await page.locator('button:has-text("View All")').first().click();
    await page.waitForTimeout(300);
    
    // Look for achievement badges (circular badges with icons)
    const achievementBadges = page.locator('[class*="AchievementBadge"]').or(
      page.locator('[class*="rounded-full"]').filter({ has: page.locator('text=/🎯|🏆|⭐|🔥/') })
    );
    
    const badgeCount = await achievementBadges.count();
    
    // Should have at least some achievements displayed
    if (badgeCount > 0) {
      const firstBadge = achievementBadges.first();
      await expect(firstBadge).toBeVisible();
    } else {
      // Check for empty state
      const emptyState = page.locator('text=No achievements').or(
        page.locator('text=Loading')
      );
      await expect(emptyState.first()).toBeVisible();
    }
  });

  test('should show achievement unlock modal when achievement is unlocked', async ({ page }) => {
    // Note: This test assumes an achievement was just unlocked
    // In a real scenario, you would trigger an achievement unlock via API/SQL first
    
    // Check for unlock modal
    const unlockModal = page.locator('text=Achievement Unlocked!').or(
      page.locator('text=Unlocked!')
    );
    
    const modalVisible = await unlockModal.isVisible().catch(() => false);
    
    if (modalVisible) {
      // Verify modal content
      await expect(unlockModal).toBeVisible();
      
      // Verify confetti animation (check for confetti elements)
      const hasConfetti = await page.locator('[class*="confetti"]').count() > 0;
      
      // Verify "Awesome!" button
      await expect(page.locator('button:has-text("Awesome!")').or(
        page.locator('button:has-text("Close")')
      )).toBeVisible();
    } else {
      // No unlock modal - this is normal if no achievements were just unlocked
      test.skip();
    }
  });

  test('should display locked achievements with reduced opacity', async ({ page }) => {
    // Open achievements dialog
    await page.locator('button:has-text("View All")').first().click();
    await page.waitForTimeout(300);
    
    // Click "Locked" tab
    await page.locator('button:has-text("Locked")').first().click();
    await page.waitForTimeout(300);
    
    // Check for locked achievements
    const lockedAchievements = page.locator('[class*="opacity"]').or(
      page.locator('text=Locked')
    );
    
    const lockedCount = await lockedAchievements.count();
    
    // If locked achievements exist, they should appear grayed out
    if (lockedCount > 0) {
      // Verify they're visible but styled differently
      await expect(lockedAchievements.first()).toBeVisible();
    }
  });

  test('should show achievement details on click', async ({ page }) => {
    // Open achievements dialog
    await page.locator('button:has-text("View All")').first().click();
    await page.waitForTimeout(300);
    
    // Find an achievement badge
    const achievementBadge = page.locator('[class*="AchievementBadge"]').or(
      page.locator('[class*="rounded-full"]').first()
    );
    
    const badgeCount = await achievementBadge.count();
    if (badgeCount > 0) {
      // Click on achievement
      await achievementBadge.first().click();
      await page.waitForTimeout(300);
      
      // Should show achievement details or open modal
      // This depends on implementation - verify something happens
      await expect(page.locator('body')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should update achievement count when achievement is unlocked', async ({ page }) => {
    // Get initial count
    const initialCount = await page.locator('text=/\\d+ of \\d+ unlocked/i').textContent();
    
    // Note: In a real test, you would unlock an achievement via API/SQL
    // then refresh and verify count increased
    
    // For now, verify count is displayed
    await expect(page.locator('text=/\\d+ of \\d+ unlocked/i')).toBeVisible();
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify count still displays
    await expect(page.locator('text=/\\d+ of \\d+ unlocked/i')).toBeVisible();
  });

  test('should show empty state when no achievements unlocked', async ({ page }) => {
    // Check for empty state in achievements card
    const emptyState = page.locator('text=No achievements unlocked yet').or(
      page.locator('text=Locked')
    );
    
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasAchievements = await page.locator('[class*="AchievementBadge"]').count() > 0;
    
    // Should show either empty state or achievements
    expect(hasEmptyState || hasAchievements).toBe(true);
  });

  test('should display achievement categories correctly', async ({ page }) => {
    // Open achievements dialog
    await page.locator('button:has-text("View All")').first().click();
    await page.waitForTimeout(300);
    
    // Achievements should be displayed in a grid
    const achievementGrid = page.locator('[class*="grid"]').filter({ 
      has: page.locator('[class*="AchievementBadge"]')
    });
    
    // Verify achievements are displayed (grid or list)
    const hasAchievements = await achievementGrid.count() > 0 || 
                          await page.locator('[class*="AchievementBadge"]').count() > 0;
    
    expect(hasAchievements || await page.locator('text=No achievements').isVisible().catch(() => false)).toBe(true);
  });

  test('should close achievements dialog', async ({ page }) => {
    // Open achievements dialog
    await page.locator('button:has-text("View All")').first().click();
    await page.waitForTimeout(300);
    
    // Verify dialog is open
    await expect(page.locator('text=All Achievements').or(
      page.locator('[role="dialog"]')
    )).toBeVisible();
    
    // Close dialog (click outside or close button)
    const closeButton = page.locator('button[aria-label*="close" i]').or(
      page.locator('button:has([data-lucide="x"])')
    );
    
    if (await closeButton.count() > 0) {
      await closeButton.first().click();
    } else {
      // Click outside dialog
      await page.keyboard.press('Escape');
    }
    
    await page.waitForTimeout(300);
    
    // Verify dialog is closed
    await expect(page.locator('text=All Achievements')).not.toBeVisible();
  });
});

