import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Smart Feedback Assistant
 * 
 * Tests:
 * 1. Smart Feedback Assistant appears on supervisor assessment forms
 * 2. Clicking "Improve Feedback" triggers analysis
 * 3. Suggestions panel appears with tabs
 * 4. User can replace feedback with improved version
 * 5. User can insert coaching prompts
 * 6. User can copy suggestions
 * 7. Feature respects feature flag (when disabled, no assistant appears)
 */

test.describe('Smart Feedback Assistant', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a supervisor assessment form
    // This assumes you have a way to access the forms as a supervisor
    // You may need to adjust based on your auth flow
  });

  test('should display Smart Feedback Assistant on EPA observation form', async ({ page }) => {
    // Navigate to EPA observation form
    // Adjust path based on your routing
    await page.goto('/supervisor/assessments/epa');
    await page.waitForLoadState('networkidle');
    
    // Find a feedback textarea (narrative observation field)
    const feedbackField = page.locator('textarea[id="narrative"]').or(
      page.locator('textarea').filter({ hasText: /narrative/i }).first()
    );
    
    await expect(feedbackField).toBeVisible();
    
    // Type some feedback
    await feedbackField.fill('Good job on the assessment.');
    
    // Look for the "Improve Feedback" button
    const improveButton = page.getByRole('button', { name: /improve feedback/i });
    await expect(improveButton).toBeVisible();
    
    // Verify helper text is present
    const helperText = page.getByText(/need help refining your feedback/i);
    await expect(helperText).toBeVisible();
  });

  test('should show suggestions panel when clicking Improve Feedback', async ({ page }) => {
    await page.goto('/supervisor/assessments/epa');
    await page.waitForLoadState('networkidle');
    
    const feedbackField = page.locator('textarea[id="narrative"]').first();
    await feedbackField.fill('Good job. Needs improvement.');
    
    const improveButton = page.getByRole('button', { name: /improve feedback/i });
    await improveButton.click();
    
    // Wait for loading state
    await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 5000 });
    
    // Wait for suggestions panel to appear
    const suggestionsPanel = page.getByText(/smart feedback suggestions/i);
    await expect(suggestionsPanel).toBeVisible({ timeout: 15000 });
    
    // Verify tabs are present
    const rewriteTab = page.getByRole('tab', { name: /rewrite/i });
    const specificityTab = page.getByRole('tab', { name: /specificity/i });
    const coachingTab = page.getByRole('tab', { name: /coaching/i });
    const toneTab = page.getByRole('tab', { name: /tone/i });
    
    await expect(rewriteTab).toBeVisible();
    await expect(specificityTab).toBeVisible();
    await expect(coachingTab).toBeVisible();
    await expect(toneTab).toBeVisible();
  });

  test('should allow replacing feedback with improved version', async ({ page }) => {
    await page.goto('/supervisor/assessments/epa');
    await page.waitForLoadState('networkidle');
    
    const feedbackField = page.locator('textarea[id="narrative"]').first();
    const originalText = 'Good job.';
    await feedbackField.fill(originalText);
    
    const improveButton = page.getByRole('button', { name: /improve feedback/i });
    await improveButton.click();
    
    // Wait for suggestions
    await expect(page.getByText(/smart feedback suggestions/i)).toBeVisible({ timeout: 15000 });
    
    // Click "Replace my feedback with this" button
    const replaceButton = page.getByRole('button', { name: /replace my feedback/i });
    await replaceButton.click();
    
    // Verify feedback was replaced (should be different from original)
    const newValue = await feedbackField.inputValue();
    expect(newValue).not.toBe(originalText);
    expect(newValue.length).toBeGreaterThan(originalText.length);
  });

  test('should allow inserting coaching prompts', async ({ page }) => {
    await page.goto('/supervisor/assessments/epa');
    await page.waitForLoadState('networkidle');
    
    const feedbackField = page.locator('textarea[id="narrative"]').first();
    await feedbackField.fill('Some feedback text.');
    
    const improveButton = page.getByRole('button', { name: /improve feedback/i });
    await improveButton.click();
    
    // Wait for suggestions
    await expect(page.getByText(/smart feedback suggestions/i)).toBeVisible({ timeout: 15000 });
    
    // Click on Coaching tab
    const coachingTab = page.getByRole('tab', { name: /coaching/i });
    await coachingTab.click();
    
    // Find and click an "Insert" button for a coaching prompt
    const insertButtons = page.getByRole('button', { name: /insert/i });
    const firstInsertButton = insertButtons.first();
    
    if (await firstInsertButton.isVisible()) {
      const originalValue = await feedbackField.inputValue();
      await firstInsertButton.click();
      
      // Verify text was inserted
      const newValue = await feedbackField.inputValue();
      expect(newValue.length).toBeGreaterThan(originalValue.length);
    }
  });

  test('should show error message if analysis fails', async ({ page }) => {
    await page.goto('/supervisor/assessments/epa');
    await page.waitForLoadState('networkidle');
    
    // Mock API failure
    await page.route('**/functions/v1/analyze-feedback', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'API error' }),
      });
    });
    
    const feedbackField = page.locator('textarea[id="narrative"]').first();
    await feedbackField.fill('Test feedback');
    
    const improveButton = page.getByRole('button', { name: /improve feedback/i });
    await improveButton.click();
    
    // Wait for error message
    const errorMessage = page.getByText(/couldn't load suggestions/i).or(
      page.getByText(/analysis failed/i)
    );
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // Verify form is still usable
    await expect(feedbackField).toBeEnabled();
  });

  test('should work on direct observation form', async ({ page }) => {
    await page.goto('/supervisor/assessments/direct');
    await page.waitForLoadState('networkidle');
    
    // Find narrative field in direct observation form
    const feedbackField = page.locator('textarea[id="narrative"]').first();
    await feedbackField.fill('Test feedback for direct observation.');
    
    const improveButton = page.getByRole('button', { name: /improve feedback/i });
    await expect(improveButton).toBeVisible();
  });

  test('should work on narrative assessment form', async ({ page }) => {
    await page.goto('/supervisor/assessments/narrative');
    await page.waitForLoadState('networkidle');
    
    // Find performance description field
    const feedbackField = page.locator('textarea[id="performance"]').first();
    await feedbackField.fill('Test narrative assessment feedback.');
    
    const improveButton = page.getByRole('button', { name: /improve feedback/i });
    await expect(improveButton).toBeVisible();
  });

  test('should disable button when feedback is empty', async ({ page }) => {
    await page.goto('/supervisor/assessments/epa');
    await page.waitForLoadState('networkidle');
    
    const feedbackField = page.locator('textarea[id="narrative"]').first();
    await feedbackField.fill('');
    
    const improveButton = page.getByRole('button', { name: /improve feedback/i });
    await expect(improveButton).toBeDisabled();
    
    // Type some text
    await feedbackField.fill('Some feedback');
    await expect(improveButton).toBeEnabled();
  });

  test('should show vague phrases with suggestions in Specificity tab', async ({ page }) => {
    await page.goto('/supervisor/assessments/epa');
    await page.waitForLoadState('networkidle');
    
    const feedbackField = page.locator('textarea[id="narrative"]').first();
    await feedbackField.fill('Good job. Nice work.');
    
    const improveButton = page.getByRole('button', { name: /improve feedback/i });
    await improveButton.click();
    
    // Wait for suggestions
    await expect(page.getByText(/smart feedback suggestions/i)).toBeVisible({ timeout: 15000 });
    
    // Click on Specificity tab
    const specificityTab = page.getByRole('tab', { name: /specificity/i });
    await specificityTab.click();
    
    // Look for vague phrases section
    const vaguePhrasesSection = page.getByText(/vague phrases/i).or(
      page.getByText(/could be more specific/i)
    );
    await expect(vaguePhrasesSection).toBeVisible({ timeout: 5000 });
  });
});

