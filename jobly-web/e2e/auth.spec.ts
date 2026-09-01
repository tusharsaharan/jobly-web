import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/auth");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/auth");
  });

  test("should load the landing page successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toContainText("Find your next good fit.");
  });

  test("should navigate to auth and show login form", async ({ page }) => {
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });

  test("should return to the landing page from auth", async ({ page }) => {
    await page.getByRole("link", { name: "Back to home" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("h1").first()).toContainText("Find your next good fit.");
  });

  test("should fail login with wrong credentials", async ({ page }) => {
    await page.fill("input[type='email']", "nonexistent@example.com");
    await page.fill("input[type='password']", "wrongpassword");
    await page.click("button[type='submit']");
    
    // We should remain on the auth page
    await expect(page).toHaveURL(/.*auth/);
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible();
  });

  test("should toggle between login and signup modes", async ({ page }) => {
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible();
    
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page.locator("text=Nice to meet you.")).toBeVisible();
    await expect(page.getByLabel("Your name")).toBeVisible();
    
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible();
  });

  test("should successfully register and login a seeker", async ({ page }) => {
    const email = `test-seeker-${Date.now()}@example.com`;
    
    await page.getByRole("link", { name: "Create an account" }).click();
    
    await page.getByLabel("Your name").fill("Ada Test Seeker");
    await page.click("button:has-text('seeker')");
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");

    // After registration, it returns registration message. Then we log in.
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible();
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    
    // Check redirection to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("brutal: should prevent registration with duplicate email", async ({ page }) => {
    const duplicateEmail = `duplicate-${Date.now()}@example.com`;
    
    // First registration
    await page.getByRole("link", { name: "Create an account" }).click();
    await page.getByLabel("Your name").fill("Ada Duplicate");
    await page.click("button:has-text('seeker')");
    await page.fill("input[type='email']", duplicateEmail);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    
    // Wait for toggle back to login mode
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible();

    // Second registration attempt
    await page.getByRole("link", { name: "Create an account" }).click();
    await page.getByLabel("Your name").fill("Ada Imposter");
    await page.click("button:has-text('seeker')");
    await page.fill("input[type='email']", duplicateEmail);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    
    // Should NOT toggle to login mode because it should fail
    await expect(page.locator("text=Nice to meet you.")).toBeVisible();
    await expect(page).toHaveURL(/.*auth/);
  });

  test("brutal: should reject empty login submission", async ({ page }) => {
    // Attempt to submit empty login
    await page.click("button[type='submit']");
    
    // The native HTML validation should prevent form submission. 
    // We can verify we are still on the auth page and no api call went through.
    await expect(page).toHaveURL(/.*auth/);
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible();
    
    // Check if the native validity API marks the email field as invalid
    const emailInput = page.locator("input[type='email']");
    const isEmailValid = await emailInput.evaluate((node: HTMLInputElement) => node.checkValidity());
    expect(isEmailValid).toBe(false);
  });

  test("brutal: should reject invalid email format on login", async ({ page }) => {
    await page.fill("input[type='email']", "invalid-email-format");
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    
    await expect(page).toHaveURL(/.*auth/);
    
    const emailInput = page.locator("input[type='email']");
    const isEmailValid = await emailInput.evaluate((node: HTMLInputElement) => node.checkValidity());
    expect(isEmailValid).toBe(false);
  });
});
