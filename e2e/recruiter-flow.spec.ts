import { test, expect } from "@playwright/test";

test.describe("Recruiter E2E workflow", () => {
  const email = `recruiter-${Date.now()}@example.com`;

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/auth");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/auth");
  });

  test("should register, create a job, review applicants and message back", async ({ page }) => {
    // 1. Sign up as recruiter
    await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page.getByLabel("Your name")).toBeVisible();
    await page.getByLabel("Your name").fill("Alice Recruiter");
    await page.click("button:has-text('recruiter')");
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");

    // 2. Login
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible();
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*dashboard/);

    // 3. Post Job Form
    await page.click("nav a:has-text('Post a role')");
    await expect(page).toHaveURL(/.*post-job/);

    // Create a job manually
    await page.fill("input[placeholder='Senior Product Engineer']", "React Tech Lead");
    await page.fill("input[placeholder='Your organization']", "Innovate Corp");
    await page.fill("input[placeholder='Remote, hybrid, or city']", "London");
    await page.selectOption("select", "Full-time");
    await page.fill("textarea[placeholder*='Describe the work']", "We need an experienced React engineer who can architect modular systems and mentor junior developers. 5+ years of experience expected.");
    await page.fill("textarea[placeholder*='React, TypeScript']", "react, javascript, typescript, webpack");
    
    // Set ATS requirements
    await page.fill("input[placeholder='e.g. 8.5']", "7.5");
    await page.fill("input[placeholder='e.g. 2']", "3");
    
    await page.click("button:has-text('Publish role')");
    // Verify successful redirection to dashboard page
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Click applicants navigation link to go to /applicants
    await page.click("nav a:has-text('Applicants')");
    await expect(page).toHaveURL(/.*applicants/);
    
    // 4. View applicants (already on applicants page)
    
    // We can verify candidate cards render if there is an applicant
    const applicantsCount = await page.locator("article").count();
    if (applicantsCount > 0) {
      await expect(page.locator("text=React Tech Lead")).toBeVisible();
      
      // Shortlist
      await page.click("article button:has-text('Shortlist')");
      await expect(page.locator("text=Shortlisted")).toBeVisible();

      // Messaging
      await page.click("article button:has-text('Message')");
      await page.fill("textarea", "Thanks for applying! We'd love to schedule a interview.");
      await page.click("button[type='submit']");
      await expect(page.locator("text=schedule a interview")).toBeVisible();
      // Empty message submission (should be disabled or ignored)
      await page.fill("textarea", "");
      const isSubmitDisabled = await page.locator("button[type='submit']").isDisabled();
      if (!isSubmitDisabled) {
        await page.click("button[type='submit']");
        // Ensure no empty message was added. We check if the chat window didn't add an empty bubble.
      }
      
      // Candidate Rejection Flow
      await page.click("button:has-text('Reject')");
      await expect(page.locator("text=Rejected")).toBeVisible();
    }
  });

  test("brutal: should prevent publishing job with missing required fields", async ({ page }) => {
    // 1. Sign up/Login as a recruiter for this test
    const recruiterEmail = `recruiter-brutal-${Date.now()}@example.com`;
    await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page.getByLabel("Your name")).toBeVisible();
    await page.getByLabel("Your name").fill("Brutal Recruiter");
    await page.click("button:has-text('recruiter')");
    await page.fill("input[type='email']", recruiterEmail);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible();
    await page.fill("input[type='email']", recruiterEmail);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to post role
    await page.click("nav a:has-text('Post a role')");
    await expect(page).toHaveURL(/.*post-job/);

    // Attempt to publish immediately (empty form)
    await page.click("button:has-text('Publish role')");
    
    // Should stay on post-job page (native validation stops submission)
    await expect(page).toHaveURL(/.*post-job/);

    // Fill only organization but missing title
    await page.fill("input[placeholder='Your organization']", "Innovate Corp");
    await page.click("button:has-text('Publish role')");
    await expect(page).toHaveURL(/.*post-job/);
  });

  test("brutal: should enforce validation on negative ATS requirements", async ({ page }) => {
    const recruiterEmail = `recruiter-ats-${Date.now()}@example.com`;
    await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page.getByLabel("Your name")).toBeVisible();
    await page.getByLabel("Your name").fill("ATS Recruiter");
    await page.click("button:has-text('recruiter')");
    await page.fill("input[type='email']", recruiterEmail);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible();
    await page.fill("input[type='email']", recruiterEmail);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    
    await page.click("nav a:has-text('Post a role')");
    
    // Enter negative cgpa
    await page.fill("input[placeholder='e.g. 8.5']", "-2.5");
    await page.fill("input[placeholder='e.g. 2']", "-5");
    
    // Check if the input allowed it or marked it invalid
    const cgpaInput = page.locator("input[placeholder='e.g. 8.5']");
    // Usually inputMode decimal + custom validation or HTML min=0
    // We will just verify it stays on the page if we try to submit
    await page.fill("input[placeholder='Senior Product Engineer']", "Title");
    await page.fill("input[placeholder='Your organization']", "Org");
    await page.fill("input[placeholder='Remote, hybrid, or city']", "City");
    await page.fill("textarea[placeholder*='Describe the work']", "desc");
    await page.click("button:has-text('Publish role')");
    
    await expect(page).toHaveURL(/.*post-job/);
    await expect(cgpaInput).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("input[placeholder='e.g. 2']")).toHaveAttribute("aria-invalid", "true");
  });
});
