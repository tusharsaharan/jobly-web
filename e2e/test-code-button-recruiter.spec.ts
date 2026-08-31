import { test, expect } from "@playwright/test";

test("code button recruiter does not snap", async ({ page, request }) => {
  const pageErrors: string[] = [];
  const consoleMessages: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message + " " + err.stack));
  page.on("console", (msg) => consoleMessages.push(`${msg.type()}: ${msg.text()}`));

  const loginRes = await request.post("http://localhost:5000/api/auth/login", {
    data: { email: "sarah@techcorp.com", password: "password123" },
  });
  // Fallback to recruiter.live
  let token: string | null = null;
  if (loginRes.ok()) {
    token = (await loginRes.json()).token;
  } else {
    const r2 = await request.post("http://localhost:5000/api/auth/login", { data: { email: "recruiter@techcorp.com", password: "password123" } });
    if (r2.ok()) token = (await r2.json()).token;
    else {
      const r3 = await request.post("http://localhost:5000/api/auth/login", { data: { email: "recruiter.live@jobly.test", password: "password123" } });
      token = r3.ok() ? (await r3.json()).token : null;
    }
  }
  console.log("login status", loginRes.status(), "token", !!token);
  expect(token).toBeTruthy();

  await page.goto("http://localhost:8080/auth");
  await page.evaluate((tok) => {
    localStorage.setItem("jm_token", tok);
    localStorage.setItem("token", tok);
  }, token!);

  const roomKey = "room-demo-techcorp-live";
  await page.goto(`http://localhost:8080/interview/${roomKey}`);
  await page.waitForLoadState("networkidle", { timeout: 15000 });
  await page.waitForTimeout(3000);

  let body = await page.textContent("body");
  console.log("before join", body?.slice(0, 600));

  const joinBtn = page.getByRole("button", { name: /join interview/i });
  if (await joinBtn.count() > 0) {
    await joinBtn.first().click();
    await page.waitForTimeout(4000);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  }

  body = await page.textContent("body");
  console.log("after join", body?.slice(0, 1000));
  console.log("console", consoleMessages.slice(0, 20).join("\n").slice(0, 2000));

  // Check for snapped before clicking code
  let snappedBefore = body?.toLowerCase().includes("something snapped") || body?.toLowerCase().includes("something went wrong");
  console.log("snappedBefore", snappedBefore, "pageErrors", pageErrors);

  // Find Code button
  const codeBtn = page.getByRole("button", { name: /^code$/i }).first();
  console.log("codeBtn count", await codeBtn.count());
  if (await codeBtn.count() > 0) {
    await codeBtn.click();
    console.log("clicked Code");
    await page.waitForTimeout(4000);
    body = await page.textContent("body");
    console.log("after Code click", body?.slice(0, 1500));
    console.log("pageErrors after", pageErrors);
    console.log("console after", consoleMessages.slice(0, 30).join("\n").slice(0, 3000));
    const hasMonaco = await page.locator(".monaco-editor, [data-testid='monaco']").count();
    console.log("hasMonaco", hasMonaco);
    const hasAiPanel = await page.locator("text=AI Interviewer Copilot").count();
    console.log("hasAiPanel", hasAiPanel);
    const hasSignalHUD = await page.locator("text=Live Interview Signals").count();
    console.log("hasSignalHUD", hasSignalHUD);

    const snappedAfter = body?.toLowerCase().includes("something snapped");
    expect(snappedAfter).toBeFalsy();
    expect(pageErrors.join(" ")).not.toContain("snapped");
    // Also ensure Monaco or at least no error boundary
    expect(body?.toLowerCase()).not.toContain("something snapped");
  } else {
    console.log("Code button not found, buttons:", await page.locator("button").allTextContents().then(a=>a.slice(0,20)));
    expect(await codeBtn.count()).toBeGreaterThan(0);
  }
});
