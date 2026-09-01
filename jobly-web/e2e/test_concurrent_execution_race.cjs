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
const ARTIFACTS_DIR = "C:/Users/tusha/.gemini/antigravity-ide/brain/6e81a994-d82b-4c02-8db4-e23f7c407ba2";

function makeExecuteRequest(sessionId, token, language, code) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ language, code, stdin: "" });
    const req = http.request(
      `${API_URL}/api/interviews/${sessionId}/execute`,
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
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function runRaceConditionTests() {
  console.log("=== RACE CONDITION AUDIT: CONCURRENT CODE EXECUTION ===");
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const uniqueId = Date.now();
  const recruiterRes = await db.collection("users").insertOne({
    name: "Alex Recruiter",
    email: `recruiter.race.${uniqueId}@jobly.test`,
    password: "Password123!",
    role: "recruiter",
    createdAt: new Date(),
  });

  const seekerRes = await db.collection("users").insertOne({
    name: "Sam Candidate",
    email: `seeker.race.${uniqueId}@jobly.test`,
    password: "Password123!",
    role: "seeker",
    skills: ["Python", "JavaScript"],
    createdAt: new Date(),
  });

  const jobRes = await db.collection("jobs").insertOne({
    recruiter: recruiterRes.insertedId,
    title: "Realtime Concurrency Engineer",
    company: "Jobly Infrastructure",
    description: "Race condition testing",
    skills: ["Python", "JavaScript"],
    createdAt: new Date(),
  });

  const appRes = await db.collection("applications").insertOne({
    job: jobRes.insertedId,
    seeker: seekerRes.insertedId,
    recruiter: recruiterRes.insertedId,
    status: "interview_scheduled",
    atsScore: 90,
    createdAt: new Date(),
  });

  const roomKey = `room-race-audit-${uniqueId}`;
  const sessionRes = await db.collection("interviewsessions").insertOne({
    tenantId: "default",
    application: appRes.insertedId,
    job: jobRes.insertedId,
    seeker: seekerRes.insertedId,
    recruiter: recruiterRes.insertedId,
    title: "Technical Interview: Race Condition Audit",
    scheduledStart: new Date(),
    status: "SCHEDULED",
    stage: "CODING",
    roomKey,
    allowedLanguages: ["python", "javascript"],
    codeWorkspace: {
      activeLanguage: "python",
      files: [
        {
          name: "solution.py",
          path: "/solution.py",
          content: "# Initial Race Condition Buffer\n",
          language: "python",
        },
      ],
    },
    createdAt: new Date(),
  });
  const sessionId = sessionRes.insertedId.toString();
  console.log(`Created Room: ${roomKey} (SessionId: ${sessionId})`);

  const recruiterToken = jwt.sign({ id: recruiterRes.insertedId.toString(), role: "recruiter" }, JWT_SECRET, { expiresIn: "7d" });
  const seekerToken = jwt.sign({ id: seekerRes.insertedId.toString(), role: "seeker" }, JWT_SECRET, { expiresIn: "7d" });

  // =========================================================================
  // TEST PART 1: Live Dual-Browser Concurrent Trigger (within 5 milliseconds)
  // =========================================================================
  console.log("\n--- TEST PART 1: Dual-Client Near-Simultaneous Trigger ---");
  const browser = await chromium.launch({ headless: true });
  const contextR = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const contextS = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  await contextR.addInitScript(({ token, user }) => {
    localStorage.setItem("jm_token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: recruiterToken, user: { _id: recruiterRes.insertedId.toString(), role: "recruiter" } });

  await contextS.addInitScript(({ token, user }) => {
    localStorage.setItem("jm_token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: seekerToken, user: { _id: seekerRes.insertedId.toString(), role: "seeker" } });

  const pageR = await contextR.newPage();
  const pageS = await contextS.newPage();

  console.log("Navigating Recruiter and Candidate to room...");
  await pageR.goto(`${BASE_URL}/interview/${roomKey}`);
  await pageS.goto(`${BASE_URL}/interview/${roomKey}`);

  // Auto-join from prejoin lobby
  await pageR.waitForTimeout(2000);
  const joinR = pageR.locator("button:has-text('Join interview')");
  const joinS = pageS.locator("button:has-text('Join interview')");
  if (await joinR.isVisible({ timeout: 4000 }).catch(() => false)) await joinR.click();
  if (await joinS.isVisible({ timeout: 4000 }).catch(() => false)) await joinS.click();

  await pageR.waitForSelector(".monaco-editor", { timeout: 20000 });
  await pageS.waitForSelector(".monaco-editor", { timeout: 20000 });
  console.log("Both clients mounted in interview room.");

  // Recruiter clicks Go Live
  const goLiveBtn = pageR.locator("button:has-text('Go Live')");
  if (await goLiveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await goLiveBtn.click();
    await pageR.waitForTimeout(1000);
  }

  // Instrument socket events in browser contexts
  await pageR.evaluate(() => {
    window.__receivedExecutions = [];
    const origSetRemote = window.setRemoteExecution;
  });

  // Type code in Recruiter editor
  console.log("Setting Recruiter code: print('EXECUTION_FROM_RECRUITER')");
  await pageR.click(".monaco-editor");
  await pageR.keyboard.press("Control+A");
  await pageR.keyboard.type("import time\ntime.sleep(0.5)\nprint('EXECUTION_FROM_RECRUITER')\n");
  await pageR.waitForTimeout(1500);

  // Trigger simultaneous executions:
  // Recruiter clicks Run in UI, Candidate submits simultaneous HTTP execution with different code
  console.log("Firing near-simultaneous execution triggers...");
  const tStart = Date.now();
  const [clickResult, candidateHttpResult] = await Promise.all([
    pageR.click("button:has-text('Run Code')"),
    makeExecuteRequest(
      sessionId,
      seekerToken,
      "python",
      "import time\ntime.sleep(0.2)\nprint('EXECUTION_FROM_CANDIDATE')\n"
    ),
  ]);

  // Wait for both executions to resolve and socket broadcasts to settle
  console.log("Waiting for executions and socket broadcasts to settle...");
  await pageR.waitForSelector("button:has-text('Run Code'):not([disabled])", { timeout: 15000 });
  await pageR.waitForTimeout(2000);
  await pageS.waitForTimeout(2000);

  // Extract visible output panel text on both clients
  const outTextR = await pageR.locator("pre").first().textContent().catch(() => "");
  const outTextS = await pageS.locator("pre").first().textContent().catch(() => "");
  const badgeR = await pageR.locator("span.text-rose-400, span.text-emerald-400").first().textContent().catch(() => "");
  const badgeS = await pageS.locator("span.text-rose-400, span.text-emerald-400").first().textContent().catch(() => "");

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "race_01_recruiter_output.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "race_01_candidate_output.png") });

  // Query MongoDB Timeline to verify both events were recorded with unique executionIds
  const timelineExecutions = await db
    .collection("timelineevents")
    .find({ session: sessionRes.insertedId, eventType: "code.execution" })
    .toArray();

  console.log("\n--- Part 1 Results ---");
  console.log("Recruiter Panel Visible Output:\n", outTextR.trim());
  console.log("Candidate Panel Visible Output:\n", outTextS.trim());
  console.log(`Recruiter Badge: "${badgeR}" | Candidate Badge: "${badgeS}"`);
  console.log(`Candidate HTTP API Response:`, candidateHttpResult.data?.execution?.executionId, `stdout: "${candidateHttpResult.data?.execution?.stdout?.trim()}"`);
  console.log(`Timeline Recorded Executions Count: ${timelineExecutions.length}`);
  timelineExecutions.forEach((evt, idx) => {
    console.log(`  [Event ${idx + 1}] ID: ${evt.payload?.executionId} | Role: ${evt.participantRole} | Snippet: ${evt.payload?.codeSnippet?.trim()}`);
  });

  // =========================================================================
  // TEST PART 2: 5 Simultaneous Run Requests
  // =========================================================================
  console.log("\n--- TEST PART 2: 5 Simultaneous Parallel Execution Requests ---");
  const p5Start = Date.now();
  const p5Promises = [];
  for (let i = 1; i <= 5; i++) {
    const code = `print('BURST_5_REQUEST_${i}_TIMESTAMP_${Date.now()}')`;
    p5Promises.push(makeExecuteRequest(sessionId, recruiterToken, "python", code));
  }
  const p5Results = await Promise.all(p5Promises);
  const p5Duration = Date.now() - p5Start;

  const p5ExecIds = p5Results.map((r) => r.data?.execution?.executionId);
  const p5Stdouts = p5Results.map((r) => r.data?.execution?.stdout?.trim());
  const p5ExitCodes = p5Results.map((r) => r.data?.execution?.exitCode);
  const uniqueP5Ids = new Set(p5ExecIds);

  console.log(`5 Requests resolved in ${p5Duration}ms`);
  console.log(`All 5 Returned Status 200:`, p5Results.every((r) => r.statusCode === 200));
  console.log(`Unique Execution IDs (Expected 5): ${uniqueP5Ids.size} / 5`);
  console.log(`Execution IDs:`, p5ExecIds);
  console.log(`Stdout Matches:`, p5Stdouts);
  console.log(`Exit Codes:`, p5ExitCodes);

  // =========================================================================
  // TEST PART 3: 10 Simultaneous Run Requests
  // =========================================================================
  console.log("\n--- TEST PART 3: 10 Simultaneous Parallel Execution Requests ---");
  const p10Start = Date.now();
  const p10Promises = [];
  for (let i = 1; i <= 10; i++) {
    const code = `
x = ${i} * 10
print(f'BURST_10_TASK_{x}')
`;
    p10Promises.push(makeExecuteRequest(sessionId, seekerToken, "python", code));
  }
  const p10Results = await Promise.all(p10Promises);
  const p10Duration = Date.now() - p10Start;

  const p10ExecIds = p10Results.map((r) => r.data?.execution?.executionId);
  const p10Stdouts = p10Results.map((r) => r.data?.execution?.stdout?.trim());
  const p10ExitCodes = p10Results.map((r) => r.data?.execution?.exitCode);
  const uniqueP10Ids = new Set(p10ExecIds);

  console.log(`10 Requests resolved in ${p10Duration}ms`);
  console.log(`All 10 Returned Status 200:`, p10Results.every((r) => r.statusCode === 200));
  console.log(`Unique Execution IDs (Expected 10): ${uniqueP10Ids.size} / 10`);
  console.log(`Stdout Matches:`, p10Stdouts);
  console.log(`Exit Codes:`, p10ExitCodes);

  // Verify Total Timeline Events in MongoDB
  const allTimelineExecutions = await db
    .collection("timelineevents")
    .find({ session: sessionRes.insertedId, eventType: "code.execution" })
    .toArray();
  console.log(`\nTotal Timeline Execution Records in DB (Expected 17: 2 + 5 + 10): ${allTimelineExecutions.length}`);

  console.log("\n=== RACE CONDITION AUDIT COMPLETE ===");

  await browser.close();
  await mongoose.disconnect();
}

runRaceConditionTests().catch((err) => {
  console.error("Race condition audit error:", err);
  process.exit(1);
});
