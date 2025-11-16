/**
 * E2E Tests for Onboarding Flow
 * Tests the first-login onboarding experience for different roles
 */
import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.describe('Student Onboarding', () => {
    test('should show onboarding checklist on first login', async ({ page }) => {
      // Navigate to auth page
      await page.goto('/auth');

      // Sign up as a new student
      await page.click('text=Create Account');
      await page.fill('input[type="email"]', `student-${Date.now()}@test.com`);
      await page.fill('input[name="fullName"]', 'Test Student');
      await page.fill('input[type="password"]', 'testpassword123');
      
      // Note: In real test, you'd need to handle email confirmation
      // For now, we'll test the UI components
      
      // Check if onboarding checklist is visible
      await expect(page.getByRole('region', { name: /onboarding checklist/i })).toBeVisible();
      await expect(page.getByText(/Welcome to WBA Tracker!/i)).toBeVisible();
      await expect(page.getByText(/Let's get you started/i)).toBeVisible();
    });

    test('should display correct tasks for student role', async ({ page }) => {
      // Assuming logged in as student
      await page.goto('/student');
      
      // Wait for onboarding to load
      await page.waitForSelector('[role="region"][aria-label*="onboarding"]', { timeout: 5000 });
      
      // Verify student-specific tasks
      await expect(page.getByText(/Complete your profile/i)).toBeVisible();
      await expect(page.getByText(/Explore your assessments/i)).toBeVisible();
      await expect(page.getByText(/Learn about O-scores/i)).toBeVisible();
    });

    test('should mark task as completed when clicked', async ({ page }) => {
      await page.goto('/student');
      
      // Find first task
      const firstTask = page.getByRole('button', { name: /Complete your profile/i }).first();
      
      // Check it's not completed initially
      await expect(firstTask).not.toHaveAttribute('aria-pressed', 'true');
      
      // Click the task
      await firstTask.click();
      
      // Verify it's marked as completed
      await expect(firstTask).toHaveAttribute('aria-pressed', 'true');
      
      // Verify checkmark icon is visible
      const checkIcon = firstTask.locator('svg').first();
      await expect(checkIcon).toBeVisible();
    });

    test('should update progress indicator', async ({ page }) => {
      await page.goto('/student');
      
      // Check initial progress
      await expect(page.getByText(/0 of 3 completed/i)).toBeVisible();
      
      // Complete a task
      await page.getByRole('button', { name: /Complete your profile/i }).first().click();
      
      // Check updated progress
      await expect(page.getByText(/1 of 3 completed/i)).toBeVisible();
    });

    test('should dismiss onboarding when close button clicked', async ({ page }) => {
      await page.goto('/student');
      
      // Find and click dismiss button
      const dismissButton = page.getByRole('button', { name: /Dismiss onboarding/i });
      await dismissButton.click();
      
      // Verify checklist is hidden
      await expect(page.getByRole('region', { name: /onboarding checklist/i })).not.toBeVisible();
    });

    test('should collapse and expand checklist', async ({ page }) => {
      await page.goto('/student');
      
      // Find collapse button
      const collapseButton = page.getByRole('button', { name: /Collapse checklist/i });
      await collapseButton.click();
      
      // Verify tasks are hidden
      await expect(page.getByText(/Complete your profile/i)).not.toBeVisible();
      
      // Find expand button
      const expandButton = page.getByRole('button', { name: /Expand checklist/i });
      await expandButton.click();
      
      // Verify tasks are visible again
      await expect(page.getByText(/Complete your profile/i)).toBeVisible();
    });
  });

  test.describe('Supervisor Onboarding', () => {
    test('should display correct tasks for supervisor role', async ({ page }) => {
      // Assuming logged in as supervisor
      await page.goto('/supervisor');
      
      // Wait for onboarding
      await page.waitForSelector('[role="region"][aria-label*="onboarding"]', { timeout: 5000 });
      
      // Verify supervisor-specific tasks
      await expect(page.getByText(/Set up your profile/i)).toBeVisible();
      await expect(page.getByText(/Create your first assessment/i)).toBeVisible();
      await expect(page.getByText(/Connect with learners/i)).toBeVisible();
      await expect(page.getByText(/View analytics dashboard/i)).toBeVisible();
    });

    test('should navigate to create assessment when task clicked', async ({ page }) => {
      await page.goto('/supervisor');
      
      // Click create assessment task
      const createAssessmentTask = page.getByText(/Create your first assessment/i);
      await createAssessmentTask.click();
      
      // Verify assessment dialog or form appears
      // This depends on your implementation
      await expect(page.getByText(/New.*Assessment/i)).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Admin Onboarding', () => {
    test('should display correct tasks for admin role', async ({ page }) => {
      // Assuming logged in as admin
      await page.goto('/admin');
      
      // Wait for onboarding
      await page.waitForSelector('[role="region"][aria-label*="onboarding"]', { timeout: 5000 });
      
      // Verify admin-specific tasks
      await expect(page.getByText(/Set up your institution/i)).toBeVisible();
      await expect(page.getByText(/Import EPA frameworks/i)).toBeVisible();
      await expect(page.getByText(/Invite team members/i)).toBeVisible();
      await expect(page.getByText(/Create promo codes/i)).toBeVisible();
    });
  });

  test.describe('Empty States', () => {
    test('should show empty state when no assessments exist', async ({ page }) => {
      await page.goto('/student');
      
      // Navigate to assessments tab
      await page.click('text=EPA Assessments');
      
      // Verify empty state
      await expect(page.getByText(/No assessments yet/i)).toBeVisible();
      await expect(page.getByText(/Your supervisors will add observations/i)).toBeVisible();
    });

    test('should show call-to-action buttons in empty state', async ({ page }) => {
      await page.goto('/student');
      
      // Navigate to assessments tab
      await page.click('text=EPA Assessments');
      
      // Verify CTA buttons
      await expect(page.getByRole('button', { name: /Learn about assessments/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /View demo/i })).toBeVisible();
    });
  });

  test.describe('Skeleton Loaders', () => {
    test('should show skeleton loaders while data is loading', async ({ page }) => {
      // Slow down network to see loaders
      await page.route('**/supabase/**', route => {
        setTimeout(() => route.continue(), 1000);
      });
      
      await page.goto('/student');
      
      // Check for skeleton elements (they have specific styling)
      const skeletons = page.locator('[class*="animate-pulse"]');
      await expect(skeletons.first()).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('onboarding checklist should be keyboard navigable', async ({ page }) => {
      await page.goto('/student');
      
      // Focus on first task
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Press Enter to complete task
      await page.keyboard.press('Enter');
      
      // Verify task is completed
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('aria-pressed'));
      expect(focusedElement).toBe('true');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/student');
      
      // Check for proper ARIA attributes
      const checklist = page.getByRole('region', { name: /onboarding checklist/i });
      await expect(checklist).toHaveAttribute('aria-label');
      
      // Check progress bar has label
      const progressBar = page.locator('[role="progressbar"]');
      await expect(progressBar.first()).toHaveAttribute('aria-label');
    });
  });

  test.describe('Dark Mode', () => {
    test('onboarding should work in dark mode', async ({ page }) => {
      await page.goto('/student');
      
      // Toggle dark mode (adjust selector based on your implementation)
      await page.click('[aria-label*="Toggle theme"]');
      await page.click('text=Dark');
      
      // Verify onboarding is still visible and styled correctly
      await expect(page.getByRole('region', { name: /onboarding checklist/i })).toBeVisible();
      
      // Check that dark mode classes are applied
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);
    });
  });

  test.describe('Persistence', () => {
    test('onboarding state should persist across page reloads', async ({ page }) => {
      await page.goto('/student');
      
      // Complete a task
      await page.getByRole('button', { name: /Complete your profile/i }).first().click();
      
      // Wait for state to save
      await page.waitForTimeout(500);
      
      // Reload page
      await page.reload();
      
      // Verify task is still completed
      const task = page.getByRole('button', { name: /Complete your profile/i }).first();
      await expect(task).toHaveAttribute('aria-pressed', 'true');
    });

    test('dismissed onboarding should stay hidden', async ({ page }) => {
      await page.goto('/student');
      
      // Dismiss onboarding
      await page.getByRole('button', { name: /Dismiss onboarding/i }).click();
      
      // Wait for state to save
      await page.waitForTimeout(500);
      
      // Reload page
      await page.reload();
      
      // Verify onboarding is still hidden
      await expect(page.getByRole('region', { name: /onboarding checklist/i })).not.toBeVisible();
    });
  });
});



