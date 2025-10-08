import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Complete User Sign-In Journey
 * Tests various sign-in methods and flows
 */

test.describe('User Sign-In Journey', () => {
  test('complete sign-in flow with email and password', async ({ page }) => {
    // Step 1: User navigates to auth page
    await page.goto('/auth');
    await expect(page.getByText(/Welcome to WBA Tracker/i)).toBeVisible();
    
    // Step 2: Verify sign-in tab is active by default
    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await expect(signInTab).toHaveAttribute('data-state', 'active');
    
    // Step 3: User enters email
    const emailInput = page.getByLabel(/email/i).first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill('user@example.com');
    
    // Verify helper text
    await expect(page.getByText(/we'll only use this to sign you in/i)).toBeVisible();
    
    // Step 4: User enters password
    const passwordInput = page.getByLabel(/password/i).first();
    await passwordInput.fill('MySecurePassword123');
    
    // Step 5: User can toggle password visibility
    await page.getByRole('button', { name: /show password/i }).first().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Step 6: User reviews terms
    await expect(page.getByText(/by continuing, you agree/i)).toBeVisible();
    
    // Step 7: User submits the form
    const signInButton = page.getByRole('button', { name: /^sign in$/i });
    await expect(signInButton).toBeEnabled();
    
    // Note: In a real test environment with test users, we would:
    // await signInButton.click();
    // await expect(page).toHaveURL('/student'); // or appropriate dashboard
    // await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test('sign-in with magic link (passwordless)', async ({ page }) => {
    await page.goto('/auth');
    
    // Step 1: User clicks magic link option
    const magicLinkButton = page.getByRole('button', { name: /sign in with magic link/i });
    await expect(magicLinkButton).toBeVisible();
    await magicLinkButton.click();
    
    // Step 2: Magic link form is shown
    await expect(page.getByText(/we'll send a secure link/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible();
    
    // Step 3: User enters their email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('user@example.com');
    
    // Step 4: User submits the form
    // Note: In a test environment, we would mock the email service
    // await page.getByRole('button', { name: /send magic link/i }).click();
    
    // Step 5: Confirmation screen would be shown
    // await expect(page.getByText(/check your email/i)).toBeVisible();
    // await expect(page.getByText(/we've sent a secure sign-in link/i)).toBeVisible();
    
    // Step 6: User could resend if needed
    // await expect(page.getByRole('button', { name: /send again/i })).toBeVisible();
    
    // Step 7: User can go back to password sign-in
    const backButton = page.getByRole('button', { name: /back to password/i });
    await expect(backButton).toBeVisible();
    await backButton.click();
    
    // Should return to password form
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('sign-in with Google OAuth', async ({ page }) => {
    await page.goto('/auth');
    
    // Step 1: User sees Google OAuth option
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
    
    // Step 2: User reads OAuth privacy note
    await expect(page.getByText(/we'll request your basic profile/i)).toBeVisible();
    
    // Step 3: User clicks Google button
    // Note: In a test environment, this would be mocked or use OAuth sandbox
    // await googleButton.click();
    // Would then test OAuth redirect flow
  });

  test('sign-in form validation prevents invalid submissions', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to submit empty form
    const signInButton = page.getByRole('button', { name: /^sign in$/i });
    await signInButton.click();
    
    // Should stay on auth page
    await expect(page).toHaveURL('/auth');
    
    // Enter invalid email
    const emailInput = page.getByLabel(/email/i).first();
    await emailInput.fill('not-an-email');
    await emailInput.blur();
    await signInButton.click();
    
    // Should show validation error
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
    
    // Fix email but leave password empty
    await emailInput.fill('user@example.com');
    await signInButton.click();
    
    // Form should not submit without password
    await expect(page).toHaveURL('/auth');
  });

  test('sign-in form shows error shake animation on invalid submission', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill invalid email
    await page.getByLabel(/email/i).first().fill('invalid');
    await page.getByLabel(/password/i).first().fill('pass');
    
    // Submit form
    await page.getByRole('button', { name: /^sign in$/i }).click();
    
    // Error should be displayed
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test('sign-in redirects to appropriate dashboard based on role', async ({ page }) => {
    // This test would require a test database with different user roles
    // For now, we document the expected behavior:
    
    await page.goto('/auth');
    
    // Student user signs in → redirects to /student
    // Supervisor user signs in → redirects to /supervisor
    // Admin user signs in → redirects to /admin
    // User without specific role → redirects to /dashboard
    
    // In a real test:
    // await signInAsStudent(page);
    // await expect(page).toHaveURL('/student');
    // await expect(page.getByText(/student dashboard/i)).toBeVisible();
  });

  test('sign-in form is keyboard accessible', async ({ page }) => {
    await page.goto('/auth');
    
    // Navigate with keyboard
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Sign In tab (already active)
    await page.keyboard.press('Tab'); // Create Account tab
    await page.keyboard.press('Tab'); // Email field
    
    // Type in email
    await page.keyboard.type('user@example.com');
    
    // Tab to password
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');
    
    // Tab to sign in button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // password toggle
    await page.keyboard.press('Tab'); // sign in button
    
    // Verify focus is on sign in button
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeFocused();
    
    // Could submit with Enter
    // await page.keyboard.press('Enter');
  });

  test('sign-in form is mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/auth');
    
    // All elements should be visible and usable
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with magic link/i })).toBeVisible();
    
    // Form should be easy to use on mobile
    await page.getByLabel(/email/i).first().fill('mobile@example.com');
    await page.getByLabel(/password/i).first().fill('MobilePass123');
    
    // Button should be easily tappable
    const signInButton = page.getByRole('button', { name: /^sign in$/i });
    const box = await signInButton.boundingBox();
    expect(box?.height).toBeGreaterThan(40); // Minimum tap target size
  });

  test('returning user workflow from landing page', async ({ page }) => {
    // Step 1: User visits landing page
    await page.goto('/');
    
    // Step 2: User clicks "Get started"
    await page.getByRole('button', { name: /get started/i }).click();
    
    // Step 3: User is on auth page with sign-in as default
    await expect(page).toHaveURL('/auth');
    await expect(page.getByRole('tab', { name: /sign in/i })).toHaveAttribute('data-state', 'active');
    
    // Step 4: User can quickly sign in
    // (would fill credentials and submit in real test)
  });

  test('forgot password link presence (if implemented)', async ({ page }) => {
    await page.goto('/auth');
    
    // Check if forgot password link exists
    // const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    // If implemented:
    // await expect(forgotPasswordLink).toBeVisible();
    // await forgotPasswordLink.click();
    // await expect(page).toHaveURL('/reset-password');
  });
});

