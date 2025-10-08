import { test, expect } from '@playwright/test';

test.describe('Authentication Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should render auth page with tabs', async ({ page }) => {
    // Check that tabs are visible
    await expect(page.getByRole('tab', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /create account/i })).toBeVisible();
  });

  test('should show email and password fields on sign in tab', async ({ page }) => {
    // Email input
    const emailInput = page.getByLabel(/email/i).first();
    await expect(emailInput).toBeVisible();
    
    // Password input
    const passwordInput = page.getByLabel(/password/i).first();
    await expect(passwordInput).toBeVisible();
    
    // Sign in button
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i).first();
    const signInButton = page.getByRole('button', { name: /^sign in$/i });
    
    // Enter invalid email
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    
    // Should show error
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test('should show validation error for weak password', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i).first();
    
    // Enter weak password
    await passwordInput.fill('123');
    await passwordInput.blur();
    
    // Click sign in to trigger validation
    await page.getByRole('button', { name: /^sign in$/i }).click();
    
    // Should show error
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i).first();
    
    // Password should be hidden initially
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click show password button
    const showPasswordButton = page.getByRole('button', { name: /show password/i }).first();
    await showPasswordButton.click();
    
    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should switch to magic link flow', async ({ page }) => {
    // Click magic link button
    const magicLinkButton = page.getByRole('button', { name: /sign in with magic link/i });
    await expect(magicLinkButton).toBeVisible();
    await magicLinkButton.click();
    
    // Should show magic link form
    await expect(page.getByText(/we'll send a secure link/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible();
  });

  test('should show password strength indicator on signup', async ({ page }) => {
    // Switch to signup tab
    await page.getByRole('tab', { name: /create account/i }).click();
    
    const passwordInput = page.getByLabel(/password/i).first();
    
    // Enter weak password
    await passwordInput.fill('weak');
    await expect(page.getByText(/weak password/i)).toBeVisible();
    
    // Enter stronger password
    await passwordInput.fill('StrongP@ssw0rd123');
    await expect(page.getByText(/strong password/i)).toBeVisible();
  });

  test('should display Google OAuth button', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i).first();
    
    // Should have aria-describedby
    await expect(emailInput).toHaveAttribute('aria-describedby');
  });

  test('should show helper text', async ({ page }) => {
    // Email helper
    await expect(page.getByText(/we'll only use this to sign you in/i)).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through form fields
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Sign in tab
    await page.keyboard.press('Tab'); // Create account tab
    await page.keyboard.press('Tab'); // Email input
    
    const emailInput = page.getByLabel(/email/i).first();
    await expect(emailInput).toBeFocused();
  });

  test('should display footer with terms and privacy links', async ({ page }) => {
    await expect(page.getByText(/by continuing, you agree to our/i)).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Form should still be visible and usable
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
  });

  test('should have skip to sign in link', async ({ page }) => {
    // Tab to focus skip link
    await page.keyboard.press('Tab');
    
    const skipLink = page.getByRole('link', { name: /skip to sign in/i });
    await expect(skipLink).toBeFocused();
  });

  test('should show signup form fields', async ({ page }) => {
    // Switch to signup tab
    await page.getByRole('tab', { name: /create account/i }).click();
    
    // Should show full name field
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });
});

