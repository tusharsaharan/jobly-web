import { test, expect } from "@playwright/test";

test("code button does not snap", async ({ page, request }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  // Login via API
  const loginRes = await request.post("http://localhost:5000/api/auth/login", {
    data: { email: "alex@example.com", password: "password123" },
  });
  expect(loginRes.ok()).toBeTruthy();
  const { token } = await loginRes.json();
  // Also try sarah as fallback
  let t = token;
  if (!t) {
    const r2 = await request.post("http://localhost:5000/api/auth/login", { data: { email: "sarah@techcorp.com", password: "password123" } });
    t = (await r2.json()).token;
  }
  expect(t).toBeTruthy();

  // Set localStorage before goto
  await page.goto("http://localhost:8080/auth");
  await page.evaluate((tok) => {
    localStorage.setItem("jm_token", tok);
    localStorage.setItem("token", tok);
  }, t);

  // Go to interview room directly
  const roomKey = "room-demo-techcorp-live";
  await page.goto(`http://localhost:8080/interview/${roomKey}`);
  // Wait for page to load, check for loading or error
  await page.waitForLoadState("networkidle", { timeout: 15000 });
  await page.waitForTimeout(3000);

  // Handle PrejoinLobby -> click Join interview
  let bodyText = await page.textContent("body");
  console.log("BODY snippet before join", bodyText?.slice(0, 800));
  const joinBtn = page.getByRole("button", { name: /join interview/i });
  if (await joinBtn.count() > 0) {
    console.log("Found Join interview, clicking...");
    await joinBtn.first().click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  }

  bodyText = await page.textContent("body");
  console.log("BODY snippet after join", bodyText?.slice(0, 800));

  // Now find code button in FloatingToolbar
  const allButtons = await page.locator("button").allTextContents();
  console.log("All buttons after join", allButtons.slice(0, 40));

  // The FloatingToolbar has Code button with Code2 icon
  let clicked = false;
  const codeBtn = page.getByRole("button", { name: /^code$/i }).or(page.locator('button:has-text("Code")')).first();
  if (await codeBtn.count() > 0) {
    console.log("Found Code button, clicking...");
    await codeBtn.click();
    clicked = true;
  } else {
    // fallback: find by icon test or toolbar container
    const toolbar = page.locator("div").filter({ hasText: "Timeline" }).first();
    if (await toolbar.count() > 0) console.log("found Timeline toolbar");
    // Inside FloatingToolbar, the Code button is in center mode switch
    const codeFallback = page.locator("button").filter({ hasText: /^Code$/ }).first();
    if (await codeFallback.count() > 0) {
      await codeFallback.click();
      clicked = true;
      console.log("clicked fallback Code");
    } else {
      // Try nth button in toolbar
      const toolbarButtons = page.locator("button");
      const count = await toolbarButtons.count();
      console.log("toolbarButtons count", count);
      // Log button texts with index
      for (let i = 0; i < Math.min(count, 10); i++) {
        const txt = await toolbarButtons.nth(i).textContent();
        console.log(`btn ${i}: ${txt}`);
      }
      // Try clicking the Code button which is second in mode switch (index 1 in center group)
      // We can try to locate via Code2 icon
      const byIcon = page.locator("button:has(svg.lucide-code2), button:has(svg.lucide-code-2)");
      if (await byIcon.count() > 0) {
        await byIcon.first().click();
        clicked = true;
        console.log("clicked by Code2 icon");
      }
    }
  }
  console.log("clicked", clicked);

  await page.waitForTimeout(4000);

  // After clicking, check for "something snapped" or error boundary
  const afterText = await page.textContent("body");
  console.log("AFTER snippet", afterText?.slice(0, 1500));
  console.log("pageErrors", pageErrors);
  console.log("consoleErrors", consoleErrors);

  // Fail if snapped text appears
  const snapped = afterText?.toLowerCase().includes("snapped") || afterText?.toLowerCase().includes("something went wrong") || pageErrors.some((m) => m.toLowerCase().includes("snapped"));
  if (snapped) {
    console.log("SNAPPED DETECTED");
  }

  // Also check for Monaco errors
  const hasMonaco = await page.locator(".monaco-editor").count();
  console.log("hasMonaco", hasMonaco);

  expect(snapped).toBeFalsy();
  expect(pageErrors.join(" ")).not.toContain("snapped");
});
