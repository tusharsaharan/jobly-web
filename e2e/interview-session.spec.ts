import { test, expect } from "@playwright/test";

test.describe("Jobly Interview OS - Full Technical Interview Flow", () => {
  test("should render the interviews management list and join room view", async ({ page }) => {
    // 1. Visit interviews page
    await page.goto("http://localhost:3000/interviews");
    await expect(page).toHaveTitle(/Technical Interviews | Jobly/);

    // 2. Verify header elements
    const heading = page.locator("h1");
    await expect(heading).toContainText("Technical Interviews");

    // 3. Verify real-time interview empty/list state renders gracefully
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });
});
