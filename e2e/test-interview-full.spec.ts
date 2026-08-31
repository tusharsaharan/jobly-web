import { test, expect } from "@playwright/test";

test("interview full suite no snap", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type()==="error") errors.push(m.text()); });

  // login as recruiter
  const login = await request.post("http://localhost:5000/api/auth/login", { data: { email: "sarah@techcorp.com", password: "password123" } });
  let token = login.ok() ? (await login.json()).token : null;
  if (!token) {
    const r2 = await request.post("http://localhost:5000/api/auth/login", { data: { email: "alex@example.com", password: "password123" } });
    token = (await r2.json()).token;
  }
  expect(token).toBeTruthy();
  await page.goto("http://localhost:8080/auth");
  await page.evaluate((t)=>{ localStorage.setItem("jm_token",t); localStorage.setItem("token",t); }, token!);

  const roomKey = "room-demo-techcorp-live";
  await page.goto(`http://localhost:8080/interview/${roomKey}`);
  await page.waitForLoadState("networkidle", {timeout:15000});
  await page.waitForTimeout(2000);
  const join = page.getByRole("button", {name:/join interview/i});
  if (await join.count()) { await join.first().click(); await page.waitForTimeout(4000); }

  // helper to check no snap after action
  async function check(step:string){
    await page.waitForTimeout(1500);
    const body = await page.textContent("body");
    const snapped = body?.toLowerCase().includes("something snapped");
    console.log(step, "snapped", snapped, "errors", errors.slice(0,3));
    expect(snapped).toBeFalsy();
    expect(body?.toLowerCase()).not.toContain("something snapped");
  }

  await check("after join");

  // Code
  const codeBtn = page.getByRole("button", {name:/^code$/i}).first();
  if (await codeBtn.count()) {
    await codeBtn.click();
    await page.waitForTimeout(4000);
    await check("after Code");
    // check monaco eventually appears (wait up to 8s)
    const monaco = page.locator(".monaco-editor");
    await monaco.waitFor({timeout:8000}).catch(()=>{});
    console.log("monaco count", await monaco.count());
    // also check that file explorer has files
    const explorer = page.locator("text=solution.py").first();
    console.log("explorer solution.py", await explorer.count());
    // click back to Video via Leave Editor
    const leave = page.getByRole("button", {name:/leave editor/i});
    if (await leave.count()) { await leave.first().click(); await page.waitForTimeout(2000); await check("after Leave Editor"); }
    else {
      // fallback via FloatingToolbar not visible in CODING, need to use videoElement toggle
      // Instead go back via clicking Code again? Actually need to find Leave Editor
      await page.goBack().catch(()=>{});
    }
  }

  // Whiteboard
  // Need to be back in VIDEO to see FloatingToolbar Whiteboard
  await page.goto(`http://localhost:8080/interview/${roomKey}`);
  await page.waitForTimeout(2000);
  const join2 = page.getByRole("button", {name:/join interview/i});
  if (await join2.count()) { await join2.first().click(); await page.waitForTimeout(4000); }
  const wbBtn = page.getByRole("button", {name:/whiteboard/i}).first();
  if (await wbBtn.count()) {
    await wbBtn.click();
    await page.waitForTimeout(4000);
    await check("after Whiteboard");
    const excal = page.locator("canvas").first();
    console.log("whiteboard canvas", await excal.count());
    const leaveWb = page.getByRole("button", {name:/leave/i}).first();
    if (await leaveWb.count()) { await leaveWb.click(); await page.waitForTimeout(2000); }
  }

  // Video mode panels: Timeline, Checkpoints, Notes
  for (const name of ["Timeline","Checkpoints","Notes"]) {
    const btn = page.getByRole("button", {name: new RegExp(name,"i")}).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(1500);
      await check(`after ${name}`);
      await btn.click().catch(()=>{}); // toggle off
      await page.waitForTimeout(1000);
    }
  }

  // In CODING, test right panel tabs
  const codeBtn2 = page.getByRole("button", {name:/^code$/i}).first();
  if (await codeBtn2.count()) {
    await codeBtn2.click();
    await page.waitForTimeout(4000);
    for (const tab of ["Output","Tests","Terminal","Chkpt","AI"]) {
      const tbtn = page.getByRole("button", {name: new RegExp(tab,"i")}).first();
      if (await tbtn.count()) {
        await tbtn.click();
        await page.waitForTimeout(1000);
        await check(`after tab ${tab}`);
      }
    }
    // Run Code
    const runBtn = page.getByRole("button", {name:/run code/i}).first();
    if (await runBtn.count()) {
      await runBtn.click();
      await page.waitForTimeout(3000);
      await check("after Run Code");
    }
  }

  expect(errors.join(" ")).not.toContain("snapped");
});
