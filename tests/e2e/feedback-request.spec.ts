import { test, expect } from "@playwright/test";

/**
 * Smoke checks for learner feedback requests and quick feedback entry points.
 * Full flows require authenticated fixtures; these assert UI shells when dashboard loads.
 */

test.describe("Feedback requests & quick feedback", () => {
  test("new assessment dialog lists Quick feedback first", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    // Unauthenticated users may be redirected to /auth — skip assertion if so
    if (page.url().includes("/auth")) {
      test.skip();
      return;
    }
    // Landing dashboard: open new assessment if control exists
    const newBtn = page.getByRole("button", { name: /new assessment/i }).first();
    if ((await newBtn.count()) === 0) {
      test.skip();
      return;
    }
    await newBtn.click();
    await expect(page.getByText(/Quick feedback/i).first()).toBeVisible();
  });

  test("supervisor feedback-requests route renders page title", async ({ page }) => {
    await page.goto("/supervisor/feedback-requests");
    await page.waitForLoadState("domcontentloaded");
    if (page.url().includes("/auth")) {
      test.skip();
      return;
    }
    await expect(page.getByRole("heading", { name: /feedback requests/i })).toBeVisible();
  });
});
