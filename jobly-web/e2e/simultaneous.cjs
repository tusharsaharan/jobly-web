const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  console.log("Launching recruiter context...");
  const recruiterContext = await browser.newContext();
  const recruiterPage = await recruiterContext.newPage();
  
  console.log("Launching seeker context...");
  const seekerContext = await browser.newContext();
  const seekerPage = await seekerContext.newPage();
  
  const baseUrl = 'http://localhost:8080';
  
  // 1. Recruiter registers and logs in
  const recruiterEmail = `recruiter-${Date.now()}@example.com`;
  await recruiterPage.goto(`${baseUrl}/auth`);
  await recruiterPage.click("text=Create an account");
  await recruiterPage.fill("input[type='text']", "Recruiter Bob");
  await recruiterPage.click("button:has-text('recruiter')");
  await recruiterPage.fill("input[type='email']", recruiterEmail);
  await recruiterPage.fill("input[type='password']", "password123");
  await recruiterPage.click("button[type='submit']");
  await recruiterPage.waitForTimeout(2000);
  await recruiterPage.screenshot({ path: "auth_debug_1.png" });
  await recruiterPage.waitForSelector("text=Hey, welcome back.");
  await recruiterPage.fill("input[type='email']", recruiterEmail);
  await recruiterPage.fill("input[type='password']", "password123");
  await recruiterPage.click("button[type='submit']");
  await recruiterPage.waitForURL(/.*dashboard/);
  console.log("Recruiter logged in.");

  // Recruiter posts job
  await recruiterPage.click("nav a:has-text('Post a role')");
  await recruiterPage.waitForURL(/.*post-job/);
  await recruiterPage.fill("input[placeholder='Senior Product Engineer']", "React Ninja");
  await recruiterPage.fill("input[placeholder='Your organization']", "Ninja Corp");
  await recruiterPage.fill("input[placeholder='Remote, hybrid, or city']", "NYC");
  await recruiterPage.fill("textarea[placeholder*='Describe the work']", "We need an experienced React engineer who can architect modular systems and mentor junior developers. 5+ years of experience expected. This is a critical role for our infrastructure team.");
  await recruiterPage.click("button:has-text('Publish role')");
  await recruiterPage.waitForURL(/.*dashboard/);
  console.log("Job posted.");

  // 2. Seeker registers and logs in
  const seekerEmail = `seeker-${Date.now()}@example.com`;
  await seekerPage.goto(`${baseUrl}/auth`);
  await seekerPage.click("text=Create an account");
  await seekerPage.fill("input[type='text']", "Seeker Alice");
  await seekerPage.click("button:has-text('seeker')");
  await seekerPage.fill("input[type='email']", seekerEmail);
  await seekerPage.fill("input[type='password']", "password123");
  await seekerPage.click("button[type='submit']");
  
  await seekerPage.waitForSelector("text=Hey, welcome back.");
  await seekerPage.fill("input[type='email']", seekerEmail);
  await seekerPage.fill("input[type='password']", "password123");
  await seekerPage.click("button[type='submit']");
  await seekerPage.waitForURL(/.*dashboard/);
  console.log("Seeker logged in.");
  
  // Seeker uploads resume
  await seekerPage.click("nav a:has-text('Resume')");
  await seekerPage.waitForURL(/.*resume/);
  const fileChooserPromise = seekerPage.waitForEvent("filechooser");
  await seekerPage.click("button:has-text('Browse PDF')");
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.join(__dirname, "fixtures/mock-resume.pdf"));
  await seekerPage.waitForSelector("text='javascript'", { timeout: 15000 });
  console.log("Seeker resume uploaded.");

  // Seeker applies
  await seekerPage.click("nav a:has-text('Jobs')");
  await seekerPage.waitForURL(/.*jobs/);
  
  // Ensure job is listed
  await seekerPage.waitForSelector("article:first-child", {timeout: 15000});
  // Use more robust locator for Apply button
  const applyBtn = seekerPage.locator("article").first().getByRole("button", {name: "Apply"});
  await applyBtn.waitFor({timeout: 10000});
  await applyBtn.click();
  // Wait for Applied state with increased timeout and fallback to check button text
  try {
    await seekerPage.waitForSelector("text=Applied", {timeout: 15000});
  } catch {
    const html = await seekerPage.content();
    console.log("Apply failed, page content snippet:", html.slice(0, 3000));
    // Try alternative: button now says Applied
    await seekerPage.locator("button:has-text('Applied')").waitFor({timeout: 5000});
  }
  console.log("Seeker applied to job.");

  // 3. Recruiter views applicants and messages
  await recruiterPage.click("nav a:has-text('Applicants')");
  await recruiterPage.waitForURL(/.*applicants/);
  await recruiterPage.waitForSelector("article");
  await recruiterPage.click("article button:has-text('Message')");
  await recruiterPage.fill("textarea", "Let's do an interview!");
  await recruiterPage.click("button[type='submit']");
  console.log("Recruiter messaged seeker.");

  // 4. Recruiter creates interview
  await recruiterPage.click("nav a:has-text('Messages')");
  await recruiterPage.waitForURL(/.*messages/);
  await recruiterPage.waitForSelector("text=Launch Technical Interview");
  await recruiterPage.click("button:has-text('Launch Technical Interview')");
  console.log("Recruiter clicked Launch Technical Interview.");
  
  // Wait for redirect to interview room
  await recruiterPage.waitForURL(/.*interview\/.*/);
  const interviewUrl = recruiterPage.url();
  console.log(`Recruiter in interview room: ${interviewUrl}`);
  
  // 5. Seeker goes to messages and joins interview
  await seekerPage.click("nav a:has-text('Messages')");
  await seekerPage.waitForURL(/.*messages/);
  await seekerPage.waitForSelector("text=Join Interview Room");
  await seekerPage.click("button:has-text('Join Interview Room')");
  await seekerPage.waitForURL(/.*interview\/.*/);
  console.log(`Seeker in interview room: ${seekerPage.url()}`);
  
  // 6. Both are in the room. Wait and take screenshots.
  await new Promise(r => setTimeout(r, 5000));
  await recruiterPage.screenshot({ path: path.join(__dirname, "recruiter_interview.png") });
  await seekerPage.screenshot({ path: path.join(__dirname, "seeker_interview.png") });
  
  console.log("Screenshots captured.");
  
  await browser.close();
})();
