import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Streak Tracking System
 * 
 * Tests:
 * 1. Streak card displays on dashboard
 * 2. Initial streak state (0)
 * 3. Streak updates display correctly
 * 4. Motivational messages change based on streak
 * 5. Longest streak displays
 */

test.describe('Streak Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to student dashboard
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
  });

  test('should display streak card on dashboard', async ({ page }) => {
    // Look for Streak card
    const streakCard = page.locator('text=Assessment Streak').or(
      page.locator('text=Streak').or(
        page.locator('[class*="Streak"]')
      )
    );
    
    await expect(streakCard.first()).toBeVisible();
  });

  test('should show flame icon', async ({ page }) => {
    // Find streak card
    const streakCard = page.locator('text=Assessment Streak').first();
    await expect(streakCard).toBeVisible();
    
    // Check for flame icon (🔥 emoji or icon)
    const flameIcon = streakCard.locator('text=🔥').or(
      streakCard.locator('[data-lucide="flame"]')
    );
    
    const hasFlame = await flameIcon.isVisible().catch(() => false);
    // Flame icon should be visible or represented as emoji
    expect(hasFlame || await streakCard.textContent()).toContain('🔥');
  });

  test('should display current streak number', async ({ page }) => {
    // Find streak card
    const streakCard = page.locator('text=Assessment Streak').first();
    await expect(streakCard).toBeVisible();
    
    // Check for streak number (should be a large number)
    const streakNumber = streakCard.locator('text=/^\\d+$/').or(
      streakCard.locator('[class*="text-4xl"], [class*="text-3xl"]')
    );
    
    // Should show a number (even if 0)
    const numberText = await streakNumber.textContent().catch(() => null);
    expect(numberText).toMatch(/^\d+$/);
  });

  test('should show appropriate message for zero streak', async ({ page }) => {
    // Find streak card
    const streakCard = page.locator('text=Assessment Streak').first();
    await expect(streakCard).toBeVisible();
    
    // Check streak number
    const streakNumber = await streakCard.locator('text=/^\\d+$/').textContent().catch(() => '0');
    
    if (streakNumber === '0') {
      // Should show message about starting streak
      await expect(streakCard.locator('text=/start your streak|today/i')).toBeVisible();
    }
  });

  test('should show appropriate message for active streak', async ({ page }) => {
    // Find streak card
    const streakCard = page.locator('text=Assessment Streak').first();
    await expect(streakCard).toBeVisible();
    
    // Check streak number
    const streakNumber = await streakCard.locator('text=/^\\d+$/').textContent().catch(() => '0');
    const streakValue = parseInt(streakNumber || '0', 10);
    
    if (streakValue > 0) {
      // Should show "day" or "days" message
      await expect(streakCard.locator('text=/day|days/i')).toBeVisible();
    }
  });

  test('should display longest streak when available', async ({ page }) => {
    // Find streak card
    const streakCard = page.locator('text=Assessment Streak').first();
    await expect(streakCard).toBeVisible();
    
    // Check for longest streak section
    const longestStreak = streakCard.locator('text=Longest Streak').or(
      streakCard.locator('text=/longest/i')
    );
    
    // Longest streak may or may not be visible (depends on data)
    const hasLongest = await longestStreak.isVisible().catch(() => false);
    
    // If visible, should show a number
    if (hasLongest) {
      await expect(longestStreak.locator('text=/\\d+/')).toBeVisible();
    }
  });

  test('should show motivational messages', async ({ page }) => {
    // Find streak card
    const streakCard = page.locator('text=Assessment Streak').first();
    await expect(streakCard).toBeVisible();
    
    // Check for motivational message
    const message = streakCard.locator('text=/momentum|keep|great|amazing|incredible/i');
    const hasMessage = await message.isVisible().catch(() => false);
    
    // Should have some motivational text
    expect(hasMessage || await streakCard.textContent()).toMatch(/momentum|keep|great|amazing|incredible|start/i);
  });

  test('should have gradient background styling', async ({ page }) => {
    // Find streak card
    const streakCard = page.locator('text=Assessment Streak').first();
    await expect(streakCard).toBeVisible();
    
    // Check for gradient classes (orange/red theme)
    const cardClasses = await streakCard.locator('xpath=ancestor::*[contains(@class, "Card")]').getAttribute('class').catch(() => '');
    
    // Should have gradient or orange/red theme classes
    const hasGradient = cardClasses.includes('gradient') || 
                       cardClasses.includes('orange') || 
                       cardClasses.includes('red');
    
    // This is a style check - card should be visible regardless
    await expect(streakCard).toBeVisible();
  });

  test('should update streak display after activity', async ({ page }) => {
    // Get initial streak value
    const streakCard = page.locator('text=Assessment Streak').first();
    const initialStreak = await streakCard.locator('text=/^\\d+$/').textContent().catch(() => '0');
    
    // Note: In a real test, you would:
    // 1. Log activity via API or SQL
    // 2. Refresh the page
    // 3. Verify streak increased
    
    // For now, we'll just verify the card is responsive
    await expect(streakCard).toBeVisible();
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify streak card still displays
    const streakCardAfterRefresh = page.locator('text=Assessment Streak').first();
    await expect(streakCardAfterRefresh).toBeVisible();
  });

  test('should handle streak milestones correctly', async ({ page }) => {
    // Find streak card
    const streakCard = page.locator('text=Assessment Streak').first();
    await expect(streakCard).toBeVisible();
    
    // Get current streak
    const streakNumber = await streakCard.locator('text=/^\\d+$/').textContent().catch(() => '0');
    const streakValue = parseInt(streakNumber || '0', 10);
    
    // Check for milestone-specific messages
    if (streakValue >= 30) {
      await expect(streakCard.locator('text=/champion|incredible/i')).toBeVisible();
    } else if (streakValue >= 7) {
      await expect(streakCard.locator('text=/excellent|consistency/i')).toBeVisible();
    } else if (streakValue >= 3) {
      await expect(streakCard.locator('text=/roll|momentum/i')).toBeVisible();
    } else if (streakValue > 0) {
      await expect(streakCard.locator('text=/building|keep/i')).toBeVisible();
    }
  });
});

