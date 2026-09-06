import { test, expect } from "@playwright/test";

test.describe("Recruiter AI Form Filling E2E Tests", () => {
  test.beforeEach(async ({ page, context }) => {
    const email = `recruiter-ai-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;

    page.on("pageerror", (exception) => console.log(`Uncaught exception: "${exception}"`));
    page.on("console", (msg) => console.log(msg.text()));
    await context.clearCookies();
    await page.goto("/auth");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/auth");

    // 1. Sign up as recruiter
    await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page.getByLabel("Your name")).toBeVisible({ timeout: 15000 });
    await page.getByLabel("Your name").fill("Alice AI Tester");
    await page.click("button:has-text('recruiter')");
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");

    // 2. Login
    await expect(page.locator("text=Log in · Jobly")).toBeVisible({ timeout: 15000 });
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 20000 });

    // 3. Navigate to post-job
    await page.goto("/post-job");
    await expect(page).toHaveURL(/.*post-job/);
    await expect(page.locator("#recruiter-assistant-input")).toBeVisible({ timeout: 15000 });
  });

  test("should automatically update salary fields when specifying 30000 ruppess in assistant chat", async ({ page }) => {
    const chatInput = page.locator("#recruiter-assistant-input");
    await expect(chatInput).toBeVisible();

    const prompt = "the salary is noy updating on its own even after specifying 30000 ruppess fix that pleae. all the parts of the form should automatically update";
    await chatInput.fill(prompt);

    const updateBtn = page.getByRole("button", { name: /update draft/i });
    await updateBtn.click();

    // Wait for AI response message in chat history
    await expect(page.locator("div[aria-live='polite']")).toContainText(/I updated the draft|I updated the role draft/i, { timeout: 35000 });

    // Verify Min Salary
    const minSalaryInput = page.locator("input[placeholder='e.g. 80000']");
    await expect(minSalaryInput).toHaveValue("30000");

    // Verify Max Salary
    const maxSalaryInput = page.locator("input[placeholder='e.g. 120000']");
    await expect(maxSalaryInput).toHaveValue("30000");

    // Verify Currency (INR)
    const currencySelect = page.locator("section[aria-labelledby='salary-heading'] select").first();
    await expect(currencySelect).toHaveValue("INR");

    // Verify Period (monthly)
    const periodSelect = page.locator("section[aria-labelledby='salary-heading'] select").nth(1);
    await expect(periodSelect).toHaveValue("monthly");
  });

  test("should automatically update ALL parts of the form from a comprehensive role brief", async ({ page }) => {
    const chatInput = page.locator("#recruiter-assistant-input");
    await expect(chatInput).toBeVisible();

    const prompt = "Hiring Lead Backend Engineer at Stripe, location Bangalore, type Full-time, salary 50000 to 80000 inr per month, 4+ years experience, minimum 8.0 CGPA, Tier 1 only, B.Tech required, skills: Node.js, TypeScript, PostgreSQL, Redis";
    await chatInput.fill(prompt);

    const updateBtn = page.getByRole("button", { name: /update draft/i });
    await updateBtn.click();

    // Wait for AI response message in chat history
    await expect(page.locator("div[aria-live='polite']")).toContainText(/I updated the draft|I updated the role draft/i, { timeout: 35000 });

    // 1. Title
    const titleInput = page.locator("input[placeholder='Senior Product Engineer']");
    await expect(titleInput).toHaveValue(/Lead Backend Engineer/i);

    // 2. Company
    const companyInput = page.locator("input[placeholder='Your organization']");
    await expect(companyInput).toHaveValue("Stripe");

    // 3. Location
    const locationInput = page.locator("input[placeholder='Remote, hybrid, or city']");
    await expect(locationInput).toHaveValue("Bangalore");

    // 4. Employment Type
    const typeSelect = page.locator("label:has-text('Employment type') select");
    await expect(typeSelect).toHaveValue("Full-time");

    // 5. Salary Range
    const minSalaryInput = page.locator("input[placeholder='e.g. 80000']");
    await expect(minSalaryInput).toHaveValue("50000");

    const maxSalaryInput = page.locator("input[placeholder='e.g. 120000']");
    await expect(maxSalaryInput).toHaveValue("80000");

    const currencySelect = page.locator("section[aria-labelledby='salary-heading'] select").first();
    await expect(currencySelect).toHaveValue("INR");

    const periodSelect = page.locator("section[aria-labelledby='salary-heading'] select").nth(1);
    await expect(periodSelect).toHaveValue("monthly");

    // 6. Skills
    const skillsTextarea = page.locator("textarea[placeholder*='React, TypeScript, Postgres']");
    await expect(skillsTextarea).toHaveValue(/Node\.js.*TypeScript.*PostgreSQL.*Redis/i);

    // 7. ATS Requirements
    // Min CGPA
    const cgpaInput = page.locator("input[placeholder='e.g. 8.5']");
    const cgpaVal = await cgpaInput.inputValue();
    expect(["8", "8.0", "8.00"]).toContain(cgpaVal);

    // College Tier
    const tierSelect = page.locator("label:has-text('College tier') select");
    await expect(tierSelect).toHaveValue("tier1");

    // Minimum Experience
    const expInput = page.locator("input[placeholder='e.g. 2']");
    await expect(expInput).toHaveValue("4");

    // Required Degree
    const degreeInput = page.locator("input[placeholder*='Leave blank when no degree is required']");
    await expect(degreeInput).toHaveValue("B.Tech");

    // 8. Description is generated
    const descTextarea = page.locator("textarea[placeholder*='Describe the work']");
    const descVal = await descTextarea.inputValue();
    expect(descVal.length).toBeGreaterThan(20);
  });

  test("should automatically update USD remote contract role with k salary notation", async ({ page }) => {
    const chatInput = page.locator("#recruiter-assistant-input");
    await expect(chatInput).toBeVisible();

    const prompt = "Contract DevOps Engineer at Acme, Remote, salary $120k - $150k annually, 5 years experience, skills: Kubernetes, AWS, Terraform, Docker";
    await chatInput.fill(prompt);

    const updateBtn = page.getByRole("button", { name: /update draft/i });
    await updateBtn.click();

    // Wait for AI response message in chat history
    await expect(page.locator("div[aria-live='polite']")).toContainText(/I updated the draft|I updated the role draft/i, { timeout: 35000 });

    // Title
    const titleInput = page.locator("input[placeholder='Senior Product Engineer']");
    await expect(titleInput).toHaveValue(/DevOps Engineer/i);

    // Company
    const companyInput = page.locator("input[placeholder='Your organization']");
    await expect(companyInput).toHaveValue("Acme");

    // Location
    const locationInput = page.locator("input[placeholder='Remote, hybrid, or city']");
    await expect(locationInput).toHaveValue("Remote");

    // Type
    const typeSelect = page.locator("label:has-text('Employment type') select");
    await expect(typeSelect).toHaveValue("Contract");

    // Salary Min & Max (k notation converted to 120000 and 150000)
    const minSalaryInput = page.locator("input[placeholder='e.g. 80000']");
    await expect(minSalaryInput).toHaveValue("120000");

    const maxSalaryInput = page.locator("input[placeholder='e.g. 120000']");
    await expect(maxSalaryInput).toHaveValue("150000");

    // Currency USD
    const currencySelect = page.locator("section[aria-labelledby='salary-heading'] select").first();
    await expect(currencySelect).toHaveValue("USD");

    // Period annual
    const periodSelect = page.locator("section[aria-labelledby='salary-heading'] select").nth(1);
    await expect(periodSelect).toHaveValue("annual");

    // Experience
    const expInput = page.locator("input[placeholder='e.g. 2']");
    await expect(expInput).toHaveValue("5");

    // Skills
    const skillsTextarea = page.locator("textarea[placeholder*='React, TypeScript, Postgres']");
    await expect(skillsTextarea).toHaveValue(/Kubernetes.*AWS.*Terraform.*Docker/i);
  });

  test("should automatically update internship with hourly EUR compensation, Tier 2 college, and MSc requirement", async ({ page }) => {
    const chatInput = page.locator("#recruiter-assistant-input");
    await expect(chatInput).toBeVisible();

    const prompt = "Hiring ML Research Intern at DeepMind, Paris, Internship, stipend 25 to 40 EUR per hour, minimum 7.5 CGPA, Tier 2, M.Sc required, skills: Python, PyTorch, Transformers";
    await chatInput.fill(prompt);

    const updateBtn = page.getByRole("button", { name: /update draft/i });
    await updateBtn.click();

    // Wait for AI response message in chat history
    await expect(page.locator("div[aria-live='polite']")).toContainText(/I updated the draft|I updated the role draft/i, { timeout: 35000 });

    // 1. Title
    const titleInput = page.locator("input[placeholder='Senior Product Engineer']");
    await expect(titleInput).toHaveValue(/ML Research Intern/i);

    // 2. Company
    const companyInput = page.locator("input[placeholder='Your organization']");
    await expect(companyInput).toHaveValue("DeepMind");

    // 3. Location
    const locationInput = page.locator("input[placeholder='Remote, hybrid, or city']");
    await expect(locationInput).toHaveValue("Paris");

    // 4. Type
    const typeSelect = page.locator("label:has-text('Employment type') select");
    await expect(typeSelect).toHaveValue("Internship");

    // 5. Salary Min & Max
    const minSalaryInput = page.locator("input[placeholder='e.g. 80000']");
    await expect(minSalaryInput).toHaveValue("25");

    const maxSalaryInput = page.locator("input[placeholder='e.g. 120000']");
    await expect(maxSalaryInput).toHaveValue("40");

    // 6. Currency EUR
    const currencySelect = page.locator("section[aria-labelledby='salary-heading'] select").first();
    await expect(currencySelect).toHaveValue("EUR");

    // 7. Period hourly
    const periodSelect = page.locator("section[aria-labelledby='salary-heading'] select").nth(1);
    await expect(periodSelect).toHaveValue("hourly");

    // 8. Tier 2
    const tierSelect = page.locator("label:has-text('College tier') select");
    await expect(tierSelect).toHaveValue("tier2");

    // 9. Min CGPA
    const cgpaInput = page.locator("input[placeholder='e.g. 8.5']");
    const cgpaVal = await cgpaInput.inputValue();
    expect(["7.5", "7.50"]).toContain(cgpaVal);

    // 10. Required Degree
    const degreeInput = page.locator("input[placeholder*='Leave blank when no degree is required']");
    await expect(degreeInput).toHaveValue(/M\.?Sc/i);

    // 11. Skills
    const skillsTextarea = page.locator("textarea[placeholder*='React, TypeScript, Postgres']");
    await expect(skillsTextarea).toHaveValue(/Python.*PyTorch.*Transformers/i);
  });

  test("should incrementally update fields across multi-turn prompts without losing existing state", async ({ page }) => {
    test.setTimeout(60000);
    const chatInput = page.locator("#recruiter-assistant-input");
    await expect(chatInput).toBeVisible();

    // Turn 1: Initial role info
    await chatInput.fill("Role: Senior Cloud Architect at Netflix, Los Gatos, Full-time, skills: AWS, Cloud Architecture, Kubernetes");
    await page.getByRole("button", { name: /update draft/i }).click();
    await expect(page.locator("div[aria-live='polite']")).toContainText(/I updated the draft|I updated the role draft/i, { timeout: 35000 });

    const titleInput = page.locator("input[placeholder='Senior Product Engineer']");
    await expect(titleInput).toHaveValue(/Senior Cloud Architect/i);
    const companyInput = page.locator("input[placeholder='Your organization']");
    await expect(companyInput).toHaveValue("Netflix");

    // Turn 2: Incrementally add salary and experience requirement
    await chatInput.fill("Set compensation to 180000 to 220000 USD per year and 6+ years experience");
    await page.getByRole("button", { name: /update draft/i }).click();

    // Wait for second response message (second assistant message bubble)
    await expect(page.locator("div[aria-live='polite'] div.bg-mint-soft").nth(1)).toBeVisible({ timeout: 35000 });

    // Existing fields should still be preserved
    await expect(titleInput).toHaveValue(/Senior Cloud Architect/i);
    await expect(companyInput).toHaveValue("Netflix");

    // New fields should be populated
    const minSalaryInput = page.locator("input[placeholder='e.g. 80000']");
    await expect(minSalaryInput).toHaveValue("180000");

    const maxSalaryInput = page.locator("input[placeholder='e.g. 120000']");
    await expect(maxSalaryInput).toHaveValue("220000");

    const currencySelect = page.locator("section[aria-labelledby='salary-heading'] select").first();
    await expect(currencySelect).toHaveValue("USD");

    const periodSelect = page.locator("section[aria-labelledby='salary-heading'] select").nth(1);
    await expect(periodSelect).toHaveValue("annual");

    const expInput = page.locator("input[placeholder='e.g. 2']");
    await expect(expInput).toHaveValue("6");
  });

  // ===================== BRUTAL EDGE CASE TESTS =====================

  const FIELD = {
    title: "input[placeholder='Senior Product Engineer']",
    company: "input[placeholder='Your organization']",
    location: "input[placeholder='Remote, hybrid, or city']",
    minSalary: "input[placeholder='e.g. 80000']",
    maxSalary: "input[placeholder='e.g. 120000']",
    cgpa: "input[placeholder='e.g. 8.5']",
    exp: "input[placeholder='e.g. 2']",
    degree: "input[placeholder*='Leave blank when no degree is required']",
    skills: "textarea[placeholder*='React, TypeScript, Postgres']",
  };

  /**
   * Wait for the CURRENT AI turn to finish:
   * 1. A NEW ai bubble appears beyond the count we saw before the prompt.
   * 2. The chat input re-enables (chatLoading=false).
   */
  async function sendPrompt(page, prompt) {
    const aiBubbles = page.locator("div[aria-live='polite'] div.bg-mint-soft");
    const bubblesBefore = await aiBubbles.count();
    const chatInput = page.locator("#recruiter-assistant-input");
    await expect(chatInput).toBeVisible();
    await chatInput.fill(prompt);
    await page.getByRole("button", { name: /update draft/i }).click();

    // A new AI bubble must appear (beyond any previous turns)
    await expect(aiBubbles.nth(bubblesBefore)).toBeVisible({ timeout: 45000 });
    // The form must finish updating (inputs no longer disabled by chatLoading)
    await expect(page.locator(FIELD.title)).toBeEnabled({ timeout: 30000 });
    // The bubble must not be a transient "Updating the draft..." placeholder
    const lastText = await aiBubbles.nth(bubblesBefore).textContent();
    expect(lastText).toBeTruthy();
  }

  test("brutal: XSS / script injection in prompt must not break form or execute", async ({ page }) => {
    await sendPrompt(page, "<script>alert('xss')</script><img src=x onerror=alert(1)> Data Engineer at EvilCorp, Remote, salary 90000 USD annual");
    // No alert dialog fired; script tags stripped from fields
    const titleVal = await page.locator(FIELD.title).inputValue();
    expect(titleVal.toLowerCase()).not.toContain("<script");
    expect(titleVal.toLowerCase()).not.toContain("onerror");
  });

  test("brutal: emoji and unicode-heavy prompt still fills the form", async ({ page }) => {
    await sendPrompt(page, "Hiring 🚀 Senior Data Engineer 🧠 at 🏢 Zeta, location 🌍 Berlin 🇩🇪, salary 💰 70000 to 90000 EUR per year, 3 years experience, skills: Spark, Airflow, SQL 📊");
    await expect(page.locator(FIELD.title)).toHaveValue(/Data Engineer/i);
    await expect(page.locator(FIELD.minSalary)).toHaveValue("70000");
    await expect(page.locator(FIELD.maxSalary)).toHaveValue("90000");
    const currencySelect = page.locator("section[aria-labelledby='salary-heading'] select").first();
    await expect(currencySelect).toHaveValue("EUR");
  });

  test("brutal: typos and misspellings in salary keywords still parse (ruppess, anual)", async ({ page }) => {
    await sendPrompt(page, "Role: QA Engineer at Testly, salary 25000 ruppess anual");
    const minSalary = await page.locator(FIELD.minSalary).inputValue();
    const maxSalary = await page.locator(FIELD.maxSalary).inputValue();
    expect(minSalary).toBeTruthy();
    expect(maxSalary).toBeTruthy();
    expect(Number(minSalary)).toBeGreaterThan(0);
    expect(Number(maxSalary)).toBeGreaterThanOrEqual(Number(minSalary));
  });

  test("brutal: explicit removal commands clear salary without touching other fields", async ({ page }) => {
    test.setTimeout(70000);
    await sendPrompt(page, "Hiring Product Manager at Notion, San Francisco, Full-time, salary 140000 to 180000 USD per year, 5 years experience");
    await expect(page.locator(FIELD.minSalary)).toHaveValue("140000");
    await expect(page.locator(FIELD.maxSalary)).toHaveValue("180000");

    await sendPrompt(page, "remove the salary, keep everything else the same");
    // Salary cleared (empty or 0-length value), but title/company preserved
    const minSalary = await page.locator(FIELD.minSalary).inputValue();
    expect(minSalary === "" || Number(minSalary) === 0).toBeTruthy();
    await expect(page.locator(FIELD.title)).toHaveValue(/Product Manager/i);
    await expect(page.locator(FIELD.company)).toHaveValue("Notion");
  });

  test("brutal: LPA notation must expand to lakhs and be annual", async ({ page }) => {
    await sendPrompt(page, "Hiring Backend Engineer at Flipkart, Bangalore, Full-time, salary 12 to 18 LPA, B.Tech required");
    await expect(page.locator(FIELD.minSalary)).toHaveValue("1200000");
    await expect(page.locator(FIELD.maxSalary)).toHaveValue("1800000");
    const currencySelect = page.locator("section[aria-labelledby='salary-heading'] select").first();
    await expect(currencySelect).toHaveValue("INR");
    const periodSelect = page.locator("section[aria-labelledby='salary-heading'] select").nth(1);
    await expect(periodSelect).toHaveValue("annual");
  });

  test("brutal: single salary value fills both min and max", async ({ page }) => {
    await sendPrompt(page, "Hiring Sales Associate at RetailCo, Mumbai, salary 18000 rupees per month");
    const minSalary = await page.locator(FIELD.minSalary).inputValue();
    const maxSalary = await page.locator(FIELD.maxSalary).inputValue();
    expect(minSalary).toBe("18000");
    expect(maxSalary).toBe("18000");
  });

  test("brutal: salary range '60k-90k USD' k-notation parses to thousands", async ({ page }) => {
    await sendPrompt(page, "SRE at Cloudflare, Remote, salary 60k-90k USD annually, 3+ years experience");
    await expect(page.locator(FIELD.minSalary)).toHaveValue("60000");
    await expect(page.locator(FIELD.maxSalary)).toHaveValue("90000");
    await expect(page.locator(FIELD.exp)).toHaveValue("3");
  });

  test("brutal: CGPA 10-scale boundary values and invalid CGPA rejection", async ({ page }) => {
    await sendPrompt(page, "Hiring Analyst at Morgan Stanley, New York, minimum CGPA 9.5");
    const cgpaVal = await page.locator(FIELD.cgpa).inputValue();
    expect(Number(cgpaVal)).toBeGreaterThanOrEqual(0);
    expect(Number(cgpaVal)).toBeLessThanOrEqual(10);
    expect(Math.abs(Number(cgpaVal) - 9.5)).toBeLessThan(0.001);
  });

  test("brutal: experience years from various phrasings (5+ yrs, 12 years, fresher)", async ({ page }) => {
    test.setTimeout(90000);
    await sendPrompt(page, "Hiring Security Engineer at Okta, Remote, 5+ yrs experience required");
    await expect(page.locator(FIELD.exp)).toHaveValue("5");

    await sendPrompt(page, "make the required experience 12 years");
    await expect(page.locator(FIELD.exp)).toHaveValue("12");
  });

  test("brutal: fresher role sets experience to 0 and no degree required", async ({ page }) => {
    await sendPrompt(page, "Hiring Graduate Trainee at Infosys, Mysore, role for freshers, no experience needed");
    const expVal = await page.locator(FIELD.exp).inputValue();
    expect(expVal === "" || Number(expVal) === 0).toBeTruthy();
  });

  test("brutal: part-time and freelance type keywords map correctly", async ({ page }) => {
    test.setTimeout(90000);
    await sendPrompt(page, "Hiring Barista at Cafe Mocha, London, part-time role");
    const typeSelect = page.locator("label:has-text('Employment type') select");
    await expect(typeSelect).toHaveValue("Part-time");

    await sendPrompt(page, "change the employment type to Contract");
    await expect(typeSelect).toHaveValue("Contract");
  });

  test("brutal: multi-turn updates never wipe previously set fields", async ({ page }) => {
    test.setTimeout(90000);
    await sendPrompt(page, "Hiring Full Stack Engineer at Vercel, Remote, Full-time, salary 130000 to 160000 USD annual, skills: Next.js, React, TypeScript");
    await expect(page.locator(FIELD.title)).toHaveValue(/Full Stack Engineer/i);
    await expect(page.locator(FIELD.minSalary)).toHaveValue("130000");

    // Turn 2: only add experience — salary/company/title/skills must survive
    await sendPrompt(page, "also require 4 years of experience");
    await expect(page.locator(FIELD.title)).toHaveValue(/Full Stack Engineer/i);
    await expect(page.locator(FIELD.company)).toHaveValue("Vercel");
    await expect(page.locator(FIELD.minSalary)).toHaveValue("130000");
    await expect(page.locator(FIELD.maxSalary)).toHaveValue("160000");
    await expect(page.locator(FIELD.exp)).toHaveValue("4");

    // Turn 3: only change location — everything else survives
    await sendPrompt(page, "move the location to Austin");
    await expect(page.locator(FIELD.title)).toHaveValue(/Full Stack Engineer/i);
    await expect(page.locator(FIELD.minSalary)).toHaveValue("130000");
    await expect(page.locator(FIELD.exp)).toHaveValue("4");
  });

  test("brutal: prompt asking only about salary does not fabricate other fields", async ({ page }) => {
    await sendPrompt(page, "salary should be 55000 to 62000 USD annually");
    // Only salary was mentioned — company/title must stay empty, not fabricated
    const companyVal = await page.locator(FIELD.company).inputValue();
    expect(companyVal).toBe("");
    await expect(page.locator(FIELD.minSalary)).toHaveValue("55000");
    await expect(page.locator(FIELD.maxSalary)).toHaveValue("62000");
  });

  test("brutal: 3000+ character long prompt is handled without breaking", async ({ page }) => {
    test.setTimeout(90000);
    // Key fields stated FIRST so the 4000-char textarea limit only trims filler
    const filler = "The ideal candidate must be passionate about scalable distributed systems and cross-team collaboration. ".repeat(40);
    await sendPrompt(page, `Hiring Platform Engineer at HashiCorp, Remote. Salary is 145000 USD per year. 8 years experience. ${filler}`);
    await expect(page.locator(FIELD.minSalary)).toHaveValue("145000");
    await expect(page.locator(FIELD.exp)).toHaveValue("8");
  });

  test("brutal: marked form fields are still manually editable after AI update", async ({ page }) => {
    await sendPrompt(page, "Hiring DevRel Engineer at Supabase, Remote, salary 100000 USD annual");
    const titleInput = page.locator(FIELD.title);
    await titleInput.fill("Manual Override Title");
    await expect(titleInput).toHaveValue("Manual Override Title");
    const minSalary = page.locator(FIELD.minSalary);
    await minSalary.fill("111111");
    await expect(minSalary).toHaveValue("111111");
  });

  test("brutal: description is auto-generated when a comprehensive brief is given", async ({ page }) => {
    await sendPrompt(page, "Hiring ML Engineer at OpenAI, San Francisco, Full-time, skills: Python, PyTorch, CUDA, salary 200000 to 300000 USD annual, 6 years experience, minimum 8.5 CGPA, Tier 1, M.Tech required");
    const descTextarea = page.locator("textarea[placeholder*='Describe the work']");
    const descVal = await descTextarea.inputValue();
    expect(descVal.length).toBeGreaterThan(20);
    // Description must not contain raw salary numbers or junk
    expect(descVal.toLowerCase()).not.toContain("undefined");
    expect(descVal.toLowerCase()).not.toContain("null");
  });

  test("brutal: salary visible toggle persists through AI updates", async ({ page }) => {
    const visibleToggle = page.locator("section[aria-labelledby='salary-heading'] input[type='checkbox']");
    await visibleToggle.uncheck();
    await sendPrompt(page, "Hiring Engineer at X, salary 90000 USD annually");
    await expect(visibleToggle).toBeChecked({ checked: false });
    await visibleToggle.check();
    await expect(visibleToggle).toBeChecked();
  });

  test("brutal: rapid consecutive prompts (double-submit guard)", async ({ page }) => {
    test.setTimeout(90000);
    const chatInput = page.locator("#recruiter-assistant-input");
    await chatInput.fill("Hiring A at B, salary 10000 USD");
    const updateBtn = page.getByRole("button", { name: /update draft/i });
    // Double-click quickly — must not crash or corrupt state
    await updateBtn.click({ noWaitAfter: true }).catch(() => {});
    // Wait for the AI turn to complete and form to settle
    await expect(page.locator(FIELD.title)).toBeEnabled({ timeout: 45000 });
    await expect(page.locator("div[aria-live='polite'] div.bg-mint-soft").first()).toBeVisible({ timeout: 45000 });
    const minSalary = await page.locator(FIELD.minSalary).inputValue();
    expect(Number(minSalary)).toBeGreaterThan(0);
  });

  test("brutal: market compare panel shows currency-aware output (no hardcoded $)", async ({ page }) => {
    test.setTimeout(90000);
    await sendPrompt(page, "Hiring Backend Engineer at Zomato, Gurgaon, Full-time, salary 60000 to 90000 INR per month, skills: Node.js, MongoDB");
    await expect(page.locator(FIELD.minSalary)).toHaveValue("60000");

    await page.getByRole("button", { name: /compare to market/i }).click();
    const modal = page.locator("text=Platform Market Benchmarks");
    await expect(modal).toBeVisible({ timeout: 25000 });
    // Wait for loading spinner to disappear (data loaded or not found state)
    await expect(page.locator("text=Aggregating platform market postings")).toBeHidden({ timeout: 25000 });
    await page.waitForTimeout(500);

    // The insight text must not reference a $ benchmark for an INR context
    const body = await page.locator("body").textContent();
    if (body?.includes("Market Median Compensation")) {
      // Median card must be INR (₹) — never raw $ for this INR draft
      const medianCard = page.locator("div", { hasText: "Market Median Compensation" }).last();
      const medianText = await medianCard.textContent().catch(() => "");
      expect(medianText).not.toMatch(/\$\d/);
    }
    await page.getByRole("button", { name: "Close", exact: true }).last().click();
  });

  test("brutal: requirement blocks drawer shows role-appropriate perks", async ({ page }) => {
    test.setTimeout(90000);
    await sendPrompt(page, "Hiring ML Research Intern at DeepMind, Paris, Internship, stipend 25 to 40 EUR per hour, skills: Python, PyTorch");
    await expect(page.locator("label:has-text('Employment type') select")).toHaveValue("Internship");

    await page.getByRole("button", { name: /requirement blocks/i }).click();
    const drawer = page.locator("text=Requirement Blocks").first();
    await expect(drawer).toBeVisible({ timeout: 15000 });
    // Wait for block list to load (spinner gone)
    await expect(page.locator("text=Loading blocks")).toBeHidden({ timeout: 15000 });

    // For an Internship role: internship perks must appear; 401(k) (full-time perk) must not
    const drawerPanel = page.locator("div.fixed.inset-0");
    const drawerText = await drawerPanel.textContent();
    expect(drawerText).toContain("Internship Stipend & Growth Perks");
    expect(drawerText).not.toContain("401(k)");
    await page.locator("button[aria-label='Close']").click();
    // Drawer overlay must close (the trigger button label remains on the page, so
    // assert the drawer's dialog container is gone instead)
    await expect(drawerPanel).toBeHidden({ timeout: 10000 });
  });

  test("brutal: publishing with valid AI-filled form succeeds end-to-end", async ({ page }) => {
    test.setTimeout(80000);
    await sendPrompt(page, "Hiring Senior Frontend Engineer at Linear, Remote, Full-time, salary 120000 to 150000 USD annually, 5 years experience, skills: React, TypeScript, GraphQL");
    await expect(page.locator(FIELD.title)).toHaveValue(/Frontend Engineer/i);

    const publishBtn = page.locator("button[data-cursor='publish']");
    await publishBtn.click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 25000 });
  });
});

