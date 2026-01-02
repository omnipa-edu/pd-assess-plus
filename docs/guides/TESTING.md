# Testing Guide

## Overview

This project uses a comprehensive testing strategy with:
- **Unit Tests** (Vitest + React Testing Library)
- **E2E Tests** (Playwright)
- **Accessibility Tests** (integrated in Playwright)

## 📦 Test Stack

- **Vitest** - Fast unit test runner with HMR
- **@testing-library/react** - Component testing utilities
- **@testing-library/jest-dom** - Custom DOM matchers
- **@testing-library/user-event** - User interaction simulation
- **Playwright** - End-to-end and cross-browser testing
- **jsdom** - DOM implementation for Node.js

## 🚀 Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage
```

### E2E Tests

```bash
# Run all e2e tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run specific test file
pnpm test:e2e tests/e2e/user-signup-journey.spec.ts

# Run tests matching a pattern
pnpm test:e2e --grep "sign-up"
```

## 📁 Test Structure

```
pd-assess-plus/
├── src/
│   ├── lib/
│   │   ├── __tests__/
│   │   │   ├── validation.test.ts    # Validation logic tests
│   │   │   └── utils.test.ts         # Utility function tests
│   │   ├── validation.ts             # Business logic
│   │   └── utils.ts                  # Helper functions
│   └── test/
│       └── setup.ts                  # Vitest setup & globals
├── tests/
│   ├── accessibility.spec.ts         # Accessibility e2e tests
│   ├── auth.spec.ts                  # Auth page e2e tests
│   ├── landing.spec.ts               # Landing page e2e tests
│   └── e2e/
│       ├── user-signup-journey.spec.ts    # Complete sign-up flow
│       ├── user-signin-journey.spec.ts    # Complete sign-in flow
│       └── assessment-workflow.spec.ts    # Assessment creation
├── vitest.config.ts                  # Vitest configuration
└── playwright.config.ts              # Playwright configuration
```

## 🧪 Test Types

### Unit Tests

**Purpose:** Test individual functions and business logic in isolation

**Location:** `src/**/__tests__/*.test.ts`

**What's Tested:**
- Validation functions (email, password, name)
- Password strength calculation
- Input sanitization
- Error message formatting
- Utility functions (className merging)

**Example:**
```typescript
import { isValidEmail } from '../validation';

describe('isValidEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });
  
  it('should return false for invalid email addresses', () => {
    expect(isValidEmail('notanemail')).toBe(false);
  });
});
```

### E2E Tests

**Purpose:** Test complete user workflows from start to finish

**Location:** `tests/**/*.spec.ts`

**What's Tested:**
- Complete user journeys (sign-up, sign-in, assessment creation)
- Navigation between pages
- Form submissions
- User interactions (clicks, typing, scrolling)
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility features

**Example:**
```typescript
test('complete sign-up flow from landing page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page).toHaveURL('/auth');
  // ... more steps
});
```

## 📊 Test Coverage

### Current Coverage

**Unit Tests:**
- ✅ Email validation (100%)
- ✅ Password validation (100%)
- ✅ Password strength calculation (100%)
- ✅ Name validation (100%)
- ✅ Input sanitization (100%)
- ✅ Role validation (100%)
- ✅ Error formatting (100%)
- ✅ Utility functions (100%)

**E2E Tests:**
- ✅ Landing page rendering and navigation
- ✅ Auth page tabs and forms
- ✅ Email/password validation
- ✅ Magic link flow
- ✅ OAuth buttons
- ✅ Keyboard accessibility
- ✅ Mobile responsiveness
- ✅ Complete sign-up journey
- ✅ Complete sign-in journey
- ✅ Assessment workflows

### Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# View HTML coverage report
open coverage/index.html
```

## 🎯 Testing Best Practices

### Unit Tests

1. **Test behavior, not implementation**
   ```typescript
   // ✅ Good - tests behavior
   expect(calculatePasswordStrength('weak')).toHaveProperty('level', 'weak');
   
   // ❌ Bad - tests implementation
   expect(calculatePasswordStrength).toHaveBeenCalledWith('weak');
   ```

2. **Use descriptive test names**
   ```typescript
   // ✅ Good
   it('should return false for emails without @ symbol', () => {})
   
   // ❌ Bad
   it('test 1', () => {})
   ```

3. **Test edge cases**
   - Empty strings
   - Null/undefined values
   - Wrong data types
   - Boundary conditions

4. **Keep tests isolated**
   - Each test should be independent
   - No shared state between tests
   - Clean up after each test

### E2E Tests

1. **Use semantic selectors**
   ```typescript
   // ✅ Good - accessible and resilient
   page.getByRole('button', { name: /sign in/i })
   
   // ❌ Bad - fragile
   page.locator('.btn-primary')
   ```

2. **Wait for elements properly**
   ```typescript
   // ✅ Good - automatic waiting
   await expect(page.getByText('Success')).toBeVisible();
   
   // ❌ Bad - arbitrary timeout
   await page.waitForTimeout(1000);
   ```

3. **Test user flows, not implementation**
   - Think like a user
   - Test complete workflows
   - Include happy paths and error cases

4. **Handle test data**
   - Use unique identifiers (timestamps, UUIDs)
   - Clean up after tests
   - Use fixtures for consistent state

## 🔧 Configuration

### Vitest Configuration

**File:** `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'tests'],
  },
});
```

### Playwright Configuration

**File:** `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
  },
});
```

## 🐛 Debugging Tests

### Unit Tests

```bash
# Run specific test file
pnpm test validation.test.ts

# Run in watch mode for debugging
pnpm test --watch

# Use Vitest UI for visual debugging
pnpm test:ui
```

### E2E Tests

```bash
# Run in headed mode to see browser
pnpm test:e2e:headed

# Use Playwright UI for step-by-step debugging
pnpm test:e2e:ui

# Generate trace for failed tests
pnpm test:e2e --trace on

# View trace
pnpm exec playwright show-trace trace.zip
```

### Common Issues

**Unit tests fail with "Cannot find module":**
- Check `vitest.config.ts` path aliases
- Verify imports use `@/` prefix correctly

**E2E tests timeout:**
- Ensure dev server is running
- Check network connectivity
- Increase timeout in `playwright.config.ts`

**Tests pass locally but fail in CI:**
- Check for timing issues
- Ensure proper waiting for elements
- Verify environment variables

## 🎭 Test Data

### Mock Data

For unit tests, create mock data in test files:

```typescript
const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
  role: 'student',
};
```

### Test Database

For e2e tests with authentication:

1. Create test database
2. Seed with test data
3. Use API to create/clean up test users
4. Store test credentials in environment variables

**Example:**
```typescript
// playwright.config.ts
use: {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
},
```

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test --run
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
```

## 🎨 Testing Components

### Component Testing Pattern

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

## ♿ Accessibility Testing

All e2e tests include accessibility checks:

```typescript
test('page should be keyboard navigable', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /get started/i })).toBeFocused();
});

test('form fields should have proper ARIA labels', async ({ page }) => {
  await page.goto('/auth');
  const emailInput = page.getByLabel(/email/i);
  await expect(emailInput).toHaveAttribute('aria-describedby');
});
```

## 📝 Test Checklist

Before pushing code:

- [ ] All unit tests pass (`pnpm test --run`)
- [ ] All e2e tests pass (`pnpm test:e2e`)
- [ ] New features have unit tests
- [ ] New features have e2e tests
- [ ] Tests cover edge cases
- [ ] Tests are properly named
- [ ] No console errors in tests
- [ ] Coverage threshold maintained

## 🚀 Adding New Tests

### Adding a Unit Test

1. Create test file: `src/path/__tests__/feature.test.ts`
2. Import function to test
3. Write test cases
4. Run tests: `pnpm test feature.test.ts`

### Adding an E2E Test

1. Create test file: `tests/e2e/feature.spec.ts`
2. Write test scenarios
3. Run tests: `pnpm test:e2e --grep "feature"`
4. Debug with: `pnpm test:e2e:ui`

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing

When contributing:

1. Write tests for new features
2. Ensure all tests pass
3. Follow existing test patterns
4. Update this documentation if adding new test types

---

**Test Coverage Goal:** 80%+ for critical business logic  
**Test Types:** Unit (fast), E2E (slow but comprehensive)  
**Run Tests:** Before every commit and in CI/CD

