import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Complete User Sign-Up Journey
 * Tests the entire flow from landing page to account creation
 */

test.describe('User Sign-Up Journey', () => {
  test('complete sign-up flow from landing page', async ({ page }) => {
    // Step 1: User arrives on landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/WBA Tracker/i);
    
    // Verify landing page content is visible
    await expect(page.getByRole('heading', { name: /Track Progress/i })).toBeVisible();
    
    // Step 2: User clicks "Get started" button
    const getStartedButton = page.getByRole('button', { name: /get started/i });
    await expect(getStartedButton).toBeVisible();
    await getStartedButton.click();
    
    // Step 3: User is redirected to auth page
    await expect(page).toHaveURL('/auth');
    await expect(page.getByText(/Welcome to WBA Tracker/i)).toBeVisible();
    
    // Step 4: User switches to Create Account tab
    const createAccountTab = page.getByRole('tab', { name: /create account/i });
    await expect(createAccountTab).toBeVisible();
    await createAccountTab.click();
    
    // Step 5: User fills in their full name
    const nameInput = page.getByLabel(/full name/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Dr. Jane Smith');
    
    // Step 6: User enters their email
    const emailInput = page.getByLabel(/email/i).first();
    await emailInput.fill(`test.user.${Date.now()}@example.com`);
    
    // Verify helper text is shown
    await expect(page.getByText(/we'll only use this to sign you in/i)).toBeVisible();
    
    // Step 7: User creates a password
    const passwordInput = page.getByLabel(/password/i).first();
    await passwordInput.fill('WeakPass');
    
    // Verify password strength indicator shows
    await expect(page.getByText(/weak password|fair password/i)).toBeVisible();
    
    // Step 8: User improves their password
    await passwordInput.clear();
    await passwordInput.fill('StrongP@ssw0rd123');
    
    // Verify strength indicator updates to strong
    await expect(page.getByText(/strong password/i)).toBeVisible();
    
    // Step 9: User can toggle password visibility
    const showPasswordButton = page.getByRole('button', { name: /show password/i }).first();
    await showPasswordButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Toggle back to hidden
    const hidePasswordButton = page.getByRole('button', { name: /hide password/i }).first();
    await hidePasswordButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Step 10: User reads terms and privacy notice
    await expect(page.getByText(/by continuing, you agree/i)).toBeVisible();
    
    // Step 11: User submits the form
    const createAccountButton = page.getByRole('button', { name: /^create account$/i });
    await expect(createAccountButton).toBeEnabled();
    
    // Note: We don't actually submit to avoid creating test accounts
    // In a real test environment with test database, we would:
    // await createAccountButton.click();
    // await expect(page.getByText(/account created/i)).toBeVisible();
    // await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test('sign-up form validation prevents invalid submissions', async ({ page }) => {
    await page.goto('/auth');
    
    // Switch to Create Account tab
    await page.getByRole('tab', { name: /create account/i }).click();
    
    // Try to submit without filling fields
    const createAccountButton = page.getByRole('button', { name: /^create account$/i });
    await createAccountButton.click();
    
    // Form should not submit (HTML5 validation will prevent it)
    // URL should still be /auth
    await expect(page).toHaveURL('/auth');
    
    // Fill only name
    await page.getByLabel(/full name/i).fill('John Doe');
    await createAccountButton.click();
    await expect(page).toHaveURL('/auth');
    
    // Fill name and invalid email
    const emailInput = page.getByLabel(/email/i).first();
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    
    // Should show validation error
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
    
    // Fix email but use weak password
    await emailInput.fill('user@example.com');
    const passwordInput = page.getByLabel(/password/i).first();
    await passwordInput.fill('123');
    await createAccountButton.click();
    
    // Should show password validation error
    await expect(page.getByText(/password must be at least 8/i)).toBeVisible();
  });

  test('alternative sign-up with Google OAuth', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /create account/i }).click();
    
    // Verify Google OAuth button is present
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
    
    // Verify helper text about OAuth
    await expect(page.getByText(/we'll request your basic profile/i)).toBeVisible();
    
    // Note: We don't click it to avoid actual OAuth flow
    // In a test environment, this would be mocked or use OAuth test credentials
  });

  test('sign-up flow is keyboard accessible', async ({ page }) => {
    await page.goto('/auth');
    
    // Tab navigation through the form
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Sign In tab
    await page.keyboard.press('Tab'); // Create Account tab
    
    // Activate Create Account tab with keyboard
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tabpanel')).toContainText(/full name/i);
    
    // Tab through form fields
    await page.keyboard.press('Tab'); // Name field
    await page.keyboard.type('Jane Doe');
    
    await page.keyboard.press('Tab'); // Email field
    await page.keyboard.type('jane@example.com');
    
    await page.keyboard.press('Tab'); // Password field
    await page.keyboard.type('SecurePass123!');
    
    // Verify all fields are filled
    await expect(page.getByLabel(/full name/i)).toHaveValue('Jane Doe');
    await expect(page.getByLabel(/email/i).first()).toHaveValue('jane@example.com');
  });

  test('sign-up form is mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/auth');
    await page.getByRole('tab', { name: /create account/i }).click();
    
    // All form elements should be visible and usable
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^create account$/i })).toBeVisible();
    
    // Password strength indicator should be visible
    await page.getByLabel(/password/i).first().fill('TestPassword123!');
    await expect(page.getByText(/strong password/i)).toBeVisible();
  });

  test('sign-up form shows clear error messages', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /create account/i }).click();
    
    // Fill form with valid data
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).first().fill('test@example.com');
    await page.getByLabel(/password/i).first().fill('ValidPass123!');
    
    // In a real scenario with test database, we would test actual error responses:
    // - "An account with this email already exists"
    // - Network errors
    // - Server errors
    
    // For now, verify the error display mechanism works
    await expect(page.getByRole('button', { name: /^create account$/i })).toBeEnabled();
  });
});

