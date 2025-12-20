import { test, expect } from "@playwright/test";

test.describe("Protected routes & Navigation", () => {
  test("should redirect unauthenticated users to auth page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*auth/);
  });

  test("should show 404 page for unknown routes", async ({ page }) => {
    await page.goto("/non-existent-page-route-12345");
    await expect(page.locator("text=Off the map")).toBeVisible();
    await expect(page.locator("a:has-text('Take me home')")).toBeVisible();
  });
});
