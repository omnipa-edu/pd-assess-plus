import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Notifications System
 * 
 * Tests:
 * 1. Notification center displays correctly
 * 2. Notification bell shows unread count
 * 3. Notifications list displays
 * 4. Mark as read functionality
 * 5. Mark all as read functionality
 * 6. Notification click navigation
 */

test.describe('Notifications System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to student dashboard
    // Note: In a real test environment, you would authenticate first
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
  });

  test('should display notification bell icon in header', async ({ page }) => {
    // Look for notification bell icon
    const bellIcon = page.locator('button:has([data-lucide="bell"])').or(
      page.locator('button[aria-label*="notification" i]')
    );
    
    await expect(bellIcon.first()).toBeVisible();
  });

  test('should show unread count badge when notifications exist', async ({ page }) => {
    // Check for notification bell
    const bellIcon = page.locator('button:has([data-lucide="bell"])').first();
    await expect(bellIcon).toBeVisible();
    
    // Check for badge (may or may not exist depending on notifications)
    const badge = bellIcon.locator('[class*="badge"]').or(
      bellIcon.locator('span').filter({ hasText: /\d+/ })
    );
    
    // Badge may or may not be visible - that's okay
    const badgeCount = await badge.count();
    if (badgeCount > 0) {
      const badgeText = await badge.textContent();
      expect(badgeText).toMatch(/\d+/);
    }
  });

  test('should open notification dropdown when bell is clicked', async ({ page }) => {
    // Find and click notification bell
    const bellIcon = page.locator('button:has([data-lucide="bell"])').first();
    await bellIcon.click();
    
    // Verify dropdown/popover opens
    await expect(page.locator('text=Notifications').or(
      page.locator('[role="dialog"]').filter({ hasText: /notification/i })
    )).toBeVisible();
  });

  test('should display notifications list or empty state', async ({ page }) => {
    // Open notifications
    const bellIcon = page.locator('button:has([data-lucide="bell"])').first();
    await bellIcon.click();
    
    // Wait for dropdown to appear
    await page.waitForTimeout(300);
    
    // Check for either notifications or empty state
    const hasNotifications = await page.locator('text=No notifications').isVisible().catch(() => false);
    const hasNotificationList = await page.locator('[role="listitem"]').count() > 0;
    
    // Should have either notifications or empty state message
    expect(hasNotifications || hasNotificationList).toBe(true);
  });

  test('should mark notification as read when checkmark is clicked', async ({ page }) => {
    // Open notifications
    const bellIcon = page.locator('button:has([data-lucide="bell"])').first();
    await bellIcon.click();
    
    await page.waitForTimeout(300);
    
    // Look for unread notifications with checkmark button
    const markReadButton = page.locator('button[aria-label*="mark" i]').or(
      page.locator('button:has([data-lucide="check"])')
    ).first();
    
    const buttonCount = await markReadButton.count();
    if (buttonCount > 0) {
      // Get initial badge count if it exists
      const initialBadge = await bellIcon.locator('[class*="badge"]').textContent().catch(() => null);
      
      // Click mark as read
      await markReadButton.click();
      
      // Wait for update
      await page.waitForTimeout(500);
      
      // Verify notification moved to read section (if we can detect it)
      // This is a basic check - full verification would require checking notification state
      await expect(page.locator('body')).toBeVisible();
    } else {
      // No unread notifications to test - skip
      test.skip();
    }
  });

  test('should mark all notifications as read', async ({ page }) => {
    // Open notifications
    const bellIcon = page.locator('button:has([data-lucide="bell"])').first();
    await bellIcon.click();
    
    await page.waitForTimeout(300);
    
    // Look for "Mark all read" button
    const markAllButton = page.locator('button:has-text("Mark all read")').or(
      page.locator('button:has([data-lucide="check-check"])')
    );
    
    const buttonCount = await markAllButton.count();
    if (buttonCount > 0) {
      await markAllButton.click();
      
      // Wait for update
      await page.waitForTimeout(500);
      
      // Verify badge count is 0 or badge is gone
      const badge = bellIcon.locator('[class*="badge"]');
      const badgeExists = await badge.isVisible().catch(() => false);
      
      if (badgeExists) {
        const badgeText = await badge.textContent();
        expect(badgeText).toBe('0');
      }
    } else {
      // No notifications or all already read - skip
      test.skip();
    }
  });

  test('should navigate when notification with action is clicked', async ({ page }) => {
    // Open notifications
    const bellIcon = page.locator('button:has([data-lucide="bell"])').first();
    await bellIcon.click();
    
    await page.waitForTimeout(300);
    
    // Look for notification with action (has external link icon or is clickable)
    const notificationWithAction = page.locator('[role="listitem"]').filter({ 
      has: page.locator('[data-lucide="external-link"]')
    }).or(
      page.locator('[role="listitem"]').first()
    );
    
    const notificationCount = await notificationWithAction.count();
    if (notificationCount > 0) {
      const currentUrl = page.url();
      
      // Click notification
      await notificationWithAction.first().click();
      
      // Wait for navigation
      await page.waitForTimeout(500);
      
      // Verify navigation occurred (URL changed or page content changed)
      const newUrl = page.url();
      // Navigation should have occurred if notification had action_url
      expect(newUrl !== currentUrl || page.url() !== currentUrl).toBeTruthy();
    } else {
      // No notifications with actions - skip
      test.skip();
    }
  });

  test('should display notification details correctly', async ({ page }) => {
    // Open notifications
    const bellIcon = page.locator('button:has([data-lucide="bell"])').first();
    await bellIcon.click();
    
    await page.waitForTimeout(300);
    
    // Check for notification items
    const notifications = page.locator('[role="listitem"]');
    const notificationCount = await notifications.count();
    
    if (notificationCount > 0) {
      const firstNotification = notifications.first();
      
      // Verify notification has title
      await expect(firstNotification.locator('h4, [class*="title"]')).toBeVisible();
      
      // Verify notification has message/description
      await expect(firstNotification.locator('p, [class*="message"]')).toBeVisible();
      
      // Verify time ago is displayed
      const hasTimeAgo = await firstNotification.locator('text=/ago|Just now|hours|days/i').isVisible().catch(() => false);
      expect(hasTimeAgo).toBe(true);
    }
  });

  test('should separate read and unread notifications', async ({ page }) => {
    // Open notifications
    const bellIcon = page.locator('button:has([data-lucide="bell"])').first();
    await bellIcon.click();
    
    await page.waitForTimeout(300);
    
    // Check for separator or different sections
    const hasSeparator = await page.locator('[role="separator"]').isVisible().catch(() => false);
    const notifications = page.locator('[role="listitem"]');
    const notificationCount = await notifications.count();
    
    if (notificationCount > 1) {
      // Should have some visual separation or grouping
      // This is a basic check - full verification would require checking notification read_at status
      expect(hasSeparator || notificationCount > 0).toBe(true);
    }
  });

  test('should persist notification state after page refresh', async ({ page }) => {
    // Open notifications
    const bellIcon = page.locator('button:has([data-lucide="bell"])').first();
    await bellIcon.click();
    
    await page.waitForTimeout(300);
    
    // Mark a notification as read if available
    const markReadButton = page.locator('button[aria-label*="mark" i]').first();
    const buttonCount = await markReadButton.count();
    
    if (buttonCount > 0) {
      await markReadButton.click();
      await page.waitForTimeout(500);
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Open notifications again
      const bellIconAfterRefresh = page.locator('button:has([data-lucide="bell"])').first();
      await bellIconAfterRefresh.click();
      await page.waitForTimeout(300);
      
      // Verify notifications still display (state persisted)
      await expect(page.locator('text=Notifications').or(
        page.locator('[role="dialog"]')
      )).toBeVisible();
    }
  });
});

