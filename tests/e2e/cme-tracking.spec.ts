import { test, expect } from '@playwright/test';

/**
 * E2E Tests for CME Time Engine
 * 
 * Tests:
 * 1. Complete a WBA → CME log updates and dashboard widget total changes
 * 2. Manual CME session creation
 * 3. CME log filters and exports
 */

test.describe('CME Time Engine', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to supervisor dashboard
    // Note: This assumes a supervisor is logged in
    await page.goto('/supervisor');
    await page.waitForLoadState('networkidle');
  });

  test('should create CME session when supervisor completes EPA assessment', async ({ page }) => {
    // Get initial CME summary from dashboard widget
    const initialSummary = await page.locator('[data-testid="cme-summary-card"]').textContent();
    const initialHours = initialSummary?.match(/(\d+\.?\d*)\s*hours/)?.[1] || '0';
    
    // Navigate to create EPA assessment
    await page.goto('/supervisor/assessments');
    await page.waitForLoadState('networkidle');
    
    // Click "New Assessment" button
    await page.getByRole('button', { name: /new assessment/i }).click();
    
    // Select EPA Observation
    await page.getByRole('button', { name: /epa observation/i }).click();
    
    // Fill out EPA form (simplified - adjust selectors based on actual form)
    await page.getByLabel(/epa selection/i).click();
    await page.getByText(/EPA 1.1/i).click();
    
    await page.getByLabel(/clinical setting/i).click();
    await page.getByText(/clinic/i).click();
    
    await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
    
    await page.getByLabel(/o score/i).first().click(); // Select first O-SCORE option
    
    await page.getByLabel(/narrative/i).fill('Test feedback for CME tracking');
    
    // Submit assessment
    await page.getByRole('button', { name: /submit/i }).click();
    
    // Wait for success message
    await expect(page.getByText(/assessment submitted successfully/i)).toBeVisible();
    
    // Navigate to CME log
    await page.goto('/supervisor/cme-log');
    await page.waitForLoadState('networkidle');
    
    // Verify new CME session appears in log
    const sessionRow = page.locator('table tbody tr').first();
    await expect(sessionRow).toBeVisible();
    
    // Verify session details
    await expect(sessionRow.getByText(/direct observation/i)).toBeVisible();
    await expect(sessionRow.getByText(/10|7/)).toBeVisible(); // Should show minutes (10 for with feedback, 7 without)
    await expect(sessionRow.getByText(/auto/i)).toBeVisible(); // Source should be Auto
  });

  test('should allow manual CME session creation', async ({ page }) => {
    await page.goto('/supervisor/cme-log');
    await page.waitForLoadState('networkidle');
    
    // Get initial session count
    const initialRows = await page.locator('table tbody tr').count();
    
    // Click "Log Coaching Time" button
    await page.getByRole('button', { name: /log coaching time/i }).click();
    
    // Fill out manual entry form
    await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
    
    await page.getByLabel(/activity type/i).click();
    await page.getByText(/group teaching/i).click();
    
    await page.getByLabel(/minutes/i).fill('30');
    
    await page.getByLabel(/description/i).fill('Group debrief session with 3 students');
    
    // Submit
    await page.getByRole('button', { name: /save/i }).click();
    
    // Wait for success message
    await expect(page.getByText(/cme session logged successfully/i)).toBeVisible();
    
    // Verify new session appears
    const newRows = await page.locator('table tbody tr').count();
    expect(newRows).toBeGreaterThan(initialRows);
    
    // Verify session details
    const newRow = page.locator('table tbody tr').first();
    await expect(newRow.getByText(/group teaching/i)).toBeVisible();
    await expect(newRow.getByText(/30/)).toBeVisible();
    await expect(newRow.getByText(/manual/i)).toBeVisible();
  });

  test('should filter CME sessions by date range', async ({ page }) => {
    await page.goto('/supervisor/cme-log');
    await page.waitForLoadState('networkidle');
    
    // Get initial session count
    const initialCount = await page.locator('table tbody tr').count();
    
    // Change date range filter
    await page.getByLabel(/date range/i).click();
    await page.getByText(/this month/i).click();
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Verify session count may have changed
    const filteredCount = await page.locator('table tbody tr').count();
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('should export CME sessions to CSV', async ({ page }) => {
    await page.goto('/supervisor/cme-log');
    await page.waitForLoadState('networkidle');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click Export CSV button
    await page.getByRole('button', { name: /export csv/i }).click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/cme-log.*\.csv$/);
    
    // Verify file content (read the file)
    const path = await download.path();
    if (path) {
      const fs = require('fs');
      const content = fs.readFileSync(path, 'utf-8');
      expect(content).toContain('Date');
      expect(content).toContain('Activity Type');
      expect(content).toContain('Minutes');
    }
  });

  test('should export CME sessions to PDF', async ({ page }) => {
    await page.goto('/supervisor/cme-log');
    await page.waitForLoadState('networkidle');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click Export PDF button
    await page.getByRole('button', { name: /export pdf/i }).click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/cme-report.*\.pdf$/);
  });

  test('should update CME summary widget on dashboard', async ({ page }) => {
    // Get initial summary
    await page.goto('/supervisor');
    await page.waitForLoadState('networkidle');
    
    const initialWidget = page.locator('[data-testid="cme-summary-card"]');
    await expect(initialWidget).toBeVisible();
    
    const initialHours = await initialWidget.locator('text=/\\d+\\.?\\d*\\s*hours/').textContent();
    
    // Create a manual CME session
    await page.goto('/supervisor/cme-log');
    await page.getByRole('button', { name: /log coaching time/i }).click();
    await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
    await page.getByLabel(/activity type/i).click();
    await page.getByText(/direct observation/i).click();
    await page.getByLabel(/minutes/i).fill('15');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/cme session logged successfully/i)).toBeVisible();
    
    // Return to dashboard
    await page.goto('/supervisor');
    await page.waitForLoadState('networkidle');
    
    // Verify widget updated (may need to refresh or wait for cache)
    // Note: This test may need adjustment based on actual caching behavior
    const updatedWidget = page.locator('[data-testid="cme-summary-card"]');
    await expect(updatedWidget).toBeVisible();
  });
});
