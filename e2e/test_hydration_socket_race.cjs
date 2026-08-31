const { chromium } = require("playwright");
const mongoose = require("../../jobly-api/node_modules/mongoose");
const jwt = require("../../jobly-api/node_modules/jsonwebtoken");
const path = require("path");
const fs = require("fs");
const http = require("http");

const envContent = fs.readFileSync(path.join(__dirname, "../../jobly-api/.env"), "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.trim().split("=");
  if (k && v.length) envVars[k.trim()] = v.join("=").trim();
});

const MONGO_URI = envVars.MONGO_URI || "mongodb+srv://tusharsaharan:Tus1234@cluster0.41myqti.mongodb.net/jobmatch?appName=Cluster0";
const JWT_SECRET = envVars.JWT_SECRET || "super_secret_jwt_key_123";
const BASE_URL = "http://localhost:8080";
const API_URL = "http://localhost:5000";

function injectSocketEvent(sessionId, token, sequence, stdout) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      execution: {
        sequence,
        executionId: `EXEC_ID_${sequence}`,
        stdout,
        stderr: "",
        exitCode: 0,
        durationMs: 10,
      },
      language: "python",
    });
    const req = http.request(
      `${API_URL}/api/interviews/${sessionId}/test-inject-socket`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(JSON.parse(body)));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function runHydrationRaceAudit() {
  console.log("=== HYDRATION VS STALE SOCKET EVENT RACE AUDIT ===\n");
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const recruiterRes = await db.collection("users").findOne({ role: "recruiter" });
  const seekerRes = await db.collection("users").findOne({ role: "seeker" });
  const recruiterToken = jwt.sign({ id: recruiterRes._id.toString(), role: "recruiter" }, JWT_SECRET, { expiresIn: "7d" });

  const uniqueId = Date.now();
  const roomKey = `room-hydrate-${uniqueId}`;

  const sessionRes = await db.collection("interviewsessions").insertOne({
    tenantId: "default",
    application: (await db.collection("applications").findOne())._id,
    job: (await db.collection("jobs").findOne())._id,
    seeker: seekerRes._id,
    recruiter: recruiterRes._id,
    title: "Technical Interview: Hydration Audit",
    scheduledStart: new Date(),
    status: "SCHEDULED",
    stage: "CODING",
    roomKey,
    allowedLanguages: ["python", "javascript"],
    executionSequence: 102,
    lastExecution: {
      sequence: 102,
      executionId: "CANONICAL_EXEC_102",
      stdout: "CANONICAL_SEQ_102",
      stderr: "",
      exitCode: 0,
      durationMs: 50,
      timedOut: false,
    },
    codeWorkspace: {
      activeLanguage: "python",
      files: [{ name: "solution.py", path: "/solution.py", content: "", language: "python" }],
    },
    createdAt: new Date(),
  });
  const sessionId = sessionRes.insertedId.toString();
  console.log(`Created Seeded Room: ${roomKey} with canonical sequence 102`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  
  await context.addInitScript(({ token, user }) => {
    localStorage.setItem("jm_token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: recruiterToken, user: { _id: recruiterRes._id.toString(), role: "recruiter" } });

  const page = await context.newPage();

  // Background UI Poller to catch any transient flashes of sequence 101
  let transientStale101Visible = false;
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${text}`);
    if (msg.type() === 'warning') console.log(`[BROWSER WARN] ${text}`);
    if (text.includes("STALE_SEQ_101")) transientStale101Visible = true;
  });

  await page.exposeFunction('reportStaleUI', () => {
    transientStale101Visible = true;
  });
  
  await page.addInitScript(() => {
    setInterval(() => {
      if (document.body.innerText.includes('STALE_SEQ_101')) {
        window.reportStaleUI();
      }
    }, 10); // Check DOM every 10ms
  });

  const TOTAL_ITERATIONS = 50;
  let staleEventsInjected = 0;
  let canonicalMismatches = 0;
  let failedIterations = 0;

  for (let i = 1; i <= TOTAL_ITERATIONS; i++) {
    transientStale101Visible = false;
    
    // Clear logs
    await page.addInitScript(() => {
      window.__executionRaceLogs = [];
    });

    const hydrationDelay = Math.floor(Math.random() * 2000);
    const staleInjectionOffset = Math.floor(Math.random() * 2500); // Can happen before, during, or after hydration
    
    let injected101 = false;
    let injected102 = false;
    let injected103 = false;

    // Route Interception for GET session
    let hydrationTriggered = false;
    await page.route(`**/api/interviews/room/${roomKey}`, async (route) => {
      hydrationTriggered = true;
      if (typeof window !== "undefined") window.__executionRaceLogs?.push("HYDRATION_API_REQUEST_STARTED");
      await new Promise(r => setTimeout(r, hydrationDelay));
      await route.continue();
    });

    await page.goto(`${BASE_URL}/interview/${roomKey}`);
    
    const joinBtn = page.locator("button:has-text('Join interview')");
    if (await joinBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await joinBtn.click();
    }
    
    // Now the room is mounting. Fire injections relative to NOW.
    setTimeout(() => {
      injectSocketEvent(sessionId, recruiterToken, 101, "STALE_SEQ_101").catch(()=>{});
      staleEventsInjected++;
    }, staleInjectionOffset);

    // We inject 102 right after
    setTimeout(() => {
      injectSocketEvent(sessionId, recruiterToken, 102, "LATE_CANONICAL_102").catch(()=>{});
    }, staleInjectionOffset + 200 + Math.floor(Math.random() * 500));
    
    // Wait for hydration to complete and UI to render either the canonical 102 or (incorrectly) 101
    await page.waitForTimeout(Math.max(3000, hydrationDelay + 2000));
    
    // Now the room is definitively loaded and listening. Inject 103 to prove we can accept new events.
    await injectSocketEvent(sessionId, recruiterToken, 103, "FRESH_SEQ_103");
    
    // Give UI a moment to render 103
    await page.waitForTimeout(1000);
    
    const finalDom = await page.evaluate(() => document.body.innerText);
    const isStale101Visible = finalDom.includes("STALE_SEQ_101") || transientStale101Visible;
    const isFresh103Visible = finalDom.includes("FRESH_SEQ_103");
    
    if (isStale101Visible || !isFresh103Visible) {
      canonicalMismatches++;
      failedIterations++;
      console.log(`\n❌ ITERATION ${i} FAILED`);
      console.log(`Hydration Delay: ${hydrationDelay}ms, Stale Inject Offset: ${staleInjectionOffset}ms`);
      console.log(`Stale 101 Visible: ${isStale101Visible}`);
      console.log(`Fresh 103 Visible: ${isFresh103Visible}`);
      
      const logs = await page.evaluate(() => window.__executionRaceLogs || []);
      console.log("--- Browser Execution Race Logs ---");
      logs.forEach((l) => console.log(l));
    } else {
      if (i % 10 === 0) console.log(`✓ Iteration ${i}/${TOTAL_ITERATIONS} passed`);
    }

    await page.unroute(`**/api/interviews/${sessionId}`);
  }

  console.log("\n=======================================================");
  console.log("=== HYDRATION VS STALE SOCKET EVENT AUDIT SUMMARY ===");
  console.log("=======================================================");
  console.log(`Total Iterations:          ${TOTAL_ITERATIONS}`);
  console.log(`Stale Events Injected:     ${staleEventsInjected}`);
  console.log(`Stale Events Displayed:    ${canonicalMismatches}`);
  console.log(`Final Canonical Mismatches:${canonicalMismatches}`);
  console.log(`Verdict:                   ${failedIterations === 0 ? "PASS (Zero Race Conditions)" : "FAIL"}`);
  console.log("=======================================================\n");

  await browser.close();
  await mongoose.disconnect();
}

runHydrationRaceAudit().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
