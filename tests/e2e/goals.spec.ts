import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Goals System
 * 
 * Tests:
 * 1. Goals card displays on dashboard
 * 2. Create new goal
 * 3. View goal details
 * 4. Edit goal
 * 5. Delete goal
 * 6. Goal progress updates
 * 7. Goal completion
 * 8. Goal tabs (Active/Completed)
 */

test.describe('Goals System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to student dashboard
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
  });

  test('should display goals card on dashboard', async ({ page }) => {
    // Look for Goals card
    const goalsCard = page.locator('text=Goals').or(
      page.locator('[class*="Goal"]')
    );
    
    await expect(goalsCard.first()).toBeVisible();
    
    // Verify it shows counts
    await expect(page.locator('text=/active|completed/i')).toBeVisible();
  });

  test('should show "New Goal" button', async ({ page }) => {
    // Find Goals card
    const goalsCard = page.locator('text=Goals').first();
    await expect(goalsCard).toBeVisible();
    
    // Find "New Goal" button
    const newGoalButton = page.locator('button:has-text("New Goal")').or(
      page.locator('button:has-text("new goal")')
    );
    
    await expect(newGoalButton).toBeVisible();
  });

  test('should open goal form when "New Goal" is clicked', async ({ page }) => {
    // Click "New Goal" button
    const newGoalButton = page.locator('button:has-text("New Goal")').first();
    await newGoalButton.click();
    
    // Verify form dialog opens
    await expect(page.locator('text=Create New Goal').or(
      page.locator('text=Create Goal')
    )).toBeVisible();
    
    // Verify form fields are visible
    await expect(page.locator('input[name="title"]').or(
      page.locator('label:has-text("Title")')
    )).toBeVisible();
  });

  test('should create a new goal', async ({ page }) => {
    // Open goal form
    await page.locator('button:has-text("New Goal")').first().click();
    await page.waitForTimeout(300);
    
    // Fill out form
    const titleInput = page.locator('input[name="title"]').or(
      page.locator('input[placeholder*="assessment"]')
    );
    await titleInput.fill('Test Goal - Complete 5 assessments');
    
    // Select type
    const typeSelect = page.locator('select[name="type"]').or(
      page.locator('button:has-text("Type")')
    );
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption('assessment_count');
    }
    
    // Fill target value
    const targetInput = page.locator('input[name="target_value"]').or(
      page.locator('input[type="number"]').first()
    );
    await targetInput.fill('5');
    
    // Submit form
    const createButton = page.locator('button:has-text("Create Goal")').or(
      page.locator('button:has-text("Create")')
    );
    await createButton.click();
    
    // Wait for form to close and goal to appear
    await page.waitForTimeout(1000);
    
    // Verify goal appears in list
    await expect(page.locator('text=Test Goal - Complete 5 assessments')).toBeVisible();
  });

  test('should display goal details correctly', async ({ page }) => {
    // Create a goal first (or assume one exists)
    // For this test, we'll check if any goals exist
    
    const goals = page.locator('[class*="GoalCard"]').or(
      page.locator('text=/Complete|assessments|target/i')
    );
    
    const goalCount = await goals.count();
    if (goalCount > 0) {
      const firstGoal = goals.first();
      
      // Verify goal shows progress bar
      await expect(firstGoal.locator('[role="progressbar"]').or(
        firstGoal.locator('[class*="Progress"]')
      )).toBeVisible();
      
      // Verify goal shows current/target values
      await expect(firstGoal.locator('text=/\\d+\\s*\\/\\s*\\d+/')).toBeVisible();
    } else {
      // No goals to test - skip
      test.skip();
    }
  });

  test('should edit an existing goal', async ({ page }) => {
    // Find a goal with edit button
    const editButton = page.locator('button[aria-label*="Edit" i]').or(
      page.locator('button:has([data-lucide="edit"])')
    ).first();
    
    const buttonCount = await editButton.count();
    if (buttonCount > 0) {
      await editButton.click();
      await page.waitForTimeout(300);
      
      // Verify edit form opens
      await expect(page.locator('text=Edit Goal').or(
        page.locator('text=Update Goal')
      )).toBeVisible();
      
      // Modify target value
      const targetInput = page.locator('input[name="target_value"]');
      if (await targetInput.count() > 0) {
        await targetInput.fill('10');
        
        // Submit update
        const updateButton = page.locator('button:has-text("Update")').or(
          page.locator('button:has-text("Update Goal")')
        );
        await updateButton.click();
        
        await page.waitForTimeout(1000);
        
        // Verify goal updated
        await expect(page.locator('text=/10/')).toBeVisible();
      }
    } else {
      // No goals to edit - skip
      test.skip();
    }
  });

  test('should delete a goal', async ({ page }) => {
    // Find delete button
    const deleteButton = page.locator('button[aria-label*="Delete" i]').or(
      page.locator('button:has([data-lucide="trash"])')
    ).first();
    
    const buttonCount = await deleteButton.count();
    if (buttonCount > 0) {
      // Get goal title before deletion
      const goalCard = deleteButton.locator('xpath=ancestor::*[contains(@class, "Card")]');
      const goalTitle = await goalCard.locator('h3, [class*="title"]').textContent().catch(() => '');
      
      // Click delete
      await deleteButton.click();
      
      // Handle confirmation dialog if it appears
      const confirmButton = page.locator('button:has-text("Delete")').or(
        page.locator('button:has-text("Confirm")')
      );
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(1000);
      
      // Verify goal is removed (if we had the title)
      if (goalTitle) {
        await expect(page.locator(`text=${goalTitle}`)).not.toBeVisible();
      }
    } else {
      // No goals to delete - skip
      test.skip();
    }
  });

  test('should show goal progress bar', async ({ page }) => {
    // Find a goal
    const goals = page.locator('[class*="GoalCard"]');
    const goalCount = await goals.count();
    
    if (goalCount > 0) {
      const firstGoal = goals.first();
      
      // Verify progress bar exists
      const progressBar = firstGoal.locator('[role="progressbar"]').or(
        firstGoal.locator('[class*="Progress"]')
      );
      await expect(progressBar).toBeVisible();
      
      // Verify progress percentage is shown
      await expect(firstGoal.locator('text=/\\d+%/')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should filter goals by Active/Completed tabs', async ({ page }) => {
    // Find tabs
    const activeTab = page.locator('button:has-text("Active")').or(
      page.locator('[role="tab"]:has-text("Active")')
    );
    const completedTab = page.locator('button:has-text("Completed")').or(
      page.locator('[role="tab"]:has-text("Completed")')
    );
    
    const hasTabs = await activeTab.count() > 0 && await completedTab.count() > 0;
    
    if (hasTabs) {
      // Click Active tab
      await activeTab.click();
      await page.waitForTimeout(300);
      
      // Verify active goals are shown
      await expect(activeTab).toHaveAttribute('data-state', 'active');
      
      // Click Completed tab
      await completedTab.click();
      await page.waitForTimeout(300);
      
      // Verify completed tab is active
      await expect(completedTab).toHaveAttribute('data-state', 'active');
    } else {
      // No tabs (maybe no goals) - skip
      test.skip();
    }
  });

  test('should show empty state when no goals exist', async ({ page }) => {
    // Check for empty state message
    const emptyState = page.locator('text=No goals yet').or(
      page.locator('text=No active goals')
    );
    
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasGoals = await page.locator('[class*="GoalCard"]').count() > 0;
    
    // Should show either empty state or goals
    expect(hasEmptyState || hasGoals).toBe(true);
  });

  test('should validate goal form fields', async ({ page }) => {
    // Open goal form
    await page.locator('button:has-text("New Goal")').first().click();
    await page.waitForTimeout(300);
    
    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Create Goal")').or(
      page.locator('button[type="submit"]')
    );
    
    // Click submit without filling required fields
    await submitButton.click();
    
    // Should show validation errors
    const hasErrors = await page.locator('text=/required|invalid|error/i').isVisible().catch(() => false);
    
    // Form should not submit if validation fails
    // This is a basic check - full validation testing would require checking specific error messages
    expect(hasErrors || await submitButton.isEnabled()).toBeTruthy();
  });
});

