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

async function runCanonicalSequenceAudit() {
  console.log("=== CANONICAL MONOTONIC SEQUENCE AUDIT ===\n");
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const uniqueId = Date.now();
  const recruiterRes = await db.collection("users").insertOne({
    name: "Alex Recruiter",
    email: `recruiter.seq.${uniqueId}@jobly.test`,
    password: "Password123!",
    role: "recruiter",
    createdAt: new Date(),
  });

  const seekerRes = await db.collection("users").insertOne({
    name: "Sam Candidate",
    email: `seeker.seq.${uniqueId}@jobly.test`,
    password: "Password123!",
    role: "seeker",
    skills: ["Python", "JavaScript"],
    createdAt: new Date(),
  });

  const jobRes = await db.collection("jobs").insertOne({
    recruiter: recruiterRes.insertedId,
    title: "Realtime Execution Pipeline Engineer",
    company: "Jobly Sandbox Core",
    description: "Testing canonical execution sequence invariants",
    skills: ["Python", "JavaScript"],
    createdAt: new Date(),
  });

  const appRes = await db.collection("applications").insertOne({
    job: jobRes.insertedId,
    seeker: seekerRes.insertedId,
    recruiter: recruiterRes.insertedId,
    status: "interview_scheduled",
    createdAt: new Date(),
  });

  const roomKey = `room-seq-audit-${uniqueId}`;
  const sessionRes = await db.collection("interviewsessions").insertOne({
    tenantId: "default",
    application: appRes.insertedId,
    job: jobRes.insertedId,
    seeker: seekerRes.insertedId,
    recruiter: recruiterRes.insertedId,
    title: "Technical Interview: Sequence Audit",
    scheduledStart: new Date(),
    status: "SCHEDULED",
    stage: "CODING",
    roomKey,
    allowedLanguages: ["python", "javascript"],
    executionSequence: 0,
    codeWorkspace: {
      activeLanguage: "python",
      files: [{ name: "solution.py", path: "/solution.py", content: "", language: "python" }],
    },
    createdAt: new Date(),
  });
  const sessionId = sessionRes.insertedId.toString();
  console.log(`Created Room: ${roomKey} (SessionId: ${sessionId})`);

  const recruiterToken = jwt.sign({ id: recruiterRes.insertedId.toString(), role: "recruiter" }, JWT_SECRET, { expiresIn: "7d" });
  const seekerToken = jwt.sign({ id: seekerRes.insertedId.toString(), role: "seeker" }, JWT_SECRET, { expiresIn: "7d" });

  // =========================================================================
  // TEST 1: Backend HTTP Ingress Concurrency (100 parallel requests)
  // Prove timestamp collision AND prove monotonic sequence correctness
  // =========================================================================
  console.log("\n--- TEST 1: 100 Concurrent HTTP Ingress Sequence vs Timestamp Collision ---");
  const promises = [];
  const TOTAL_REQUESTS = 100;
  
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    // Generate randomized execution times to scramble completion order
    const duration = Math.floor(Math.random() * 50) + 10;
    const code = `import time\ntime.sleep(${duration / 1000})\nprint("EXEC_${i}_FINISHED")`;
    promises.push(makeExecuteRequest(sessionId, recruiterToken, "python", code));
  }

  console.log(`Dispatched ${TOTAL_REQUESTS} parallel execution requests to backend...`);
  const results = await Promise.all(promises);
  
  let timestampCollisions = 0;
  const timestamps = new Set();
  const sequences = [];

  for (let res of results) {
    if (res.data?.execution) {
      const ts = res.data.execution.triggeredAt;
      const seq = res.data.execution.sequence;
      sequences.push(seq);
      if (timestamps.has(ts)) {
        timestampCollisions++;
      }
      timestamps.add(ts);
    }
  }

  sequences.sort((a, b) => a - b);
  const isSequenceMonotonic = sequences.length === TOTAL_REQUESTS && sequences[0] === 1 && sequences[TOTAL_REQUESTS - 1] === TOTAL_REQUESTS;

  console.log(`Backend Result: ${sequences.length} executions succeeded.`);
  console.log(`Timestamp Collisions Detected (Date.now()): ${timestampCollisions} collisions!`);
  console.log(`Monotonic Sequence 1..100 Correct: ${isSequenceMonotonic ? "PASS" : "FAIL"}`);
  console.log(timestampCollisions > 0 ? ">> Date.now() proven INSUFFICIENT for ordering." : "");

  // =========================================================================
  // TEST 2: Cross-Client Dual Browser Race Verification
  // =========================================================================
  console.log("\n--- TEST 2: Cross-Client Dual-Browser Execution Race (Sequence Enforcement) ---");
  const browser = await chromium.launch({ headless: true });
  const contextR = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const contextS = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  await contextR.addInitScript(({ token, user }) => {
    localStorage.setItem("jm_token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: recruiterToken, user: { _id: recruiterRes.insertedId.toString(), role: "recruiter" } });

  await contextS.addInitScript(({ token, user }) => {
    localStorage.setItem("jm_token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: seekerToken, user: { _id: seekerRes.insertedId.toString(), role: "seeker" } });

  const pageR = await contextR.newPage();
  const pageS = await contextS.newPage();

  console.log("Navigating Recruiter and Candidate to room...");
  await pageR.goto(`${BASE_URL}/interview/${roomKey}`);
  await pageS.goto(`${BASE_URL}/interview/${roomKey}`);

  await pageR.waitForTimeout(2000);
  const joinR = pageR.locator("button:has-text('Join interview')");
  const joinS = pageS.locator("button:has-text('Join interview')");
  if (await joinR.isVisible({ timeout: 4000 }).catch(() => false)) await joinR.click();
  if (await joinS.isVisible({ timeout: 4000 }).catch(() => false)) await joinS.click();

  await pageR.waitForSelector(".monaco-editor", { timeout: 20000 });
  await pageS.waitForSelector(".monaco-editor", { timeout: 20000 });
  console.log("Both clients mounted in interview room.");

  const goLiveBtn = pageR.locator("button:has-text('Go Live')");
  if (await goLiveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await goLiveBtn.click();
    await pageR.waitForTimeout(1000);
  }

  // RECRUITER SUBMITS SLOW A (3 seconds)
  console.log("Recruiter submitting Slow Execution A (takes ~3s)...");
  const slowPromise = makeExecuteRequest(sessionId, recruiterToken, "python", "import time\ntime.sleep(3)\nprint('=== SLOW_EXECUTION_A_COMPLETED ===')\n");
  
  // CANDIDATE SUBMITS FAST B (0 seconds) after 500ms
  await new Promise((r) => setTimeout(r, 500));
  console.log("Candidate submitting Fast Execution B (takes ~0s)...");
  const fastPromise = makeExecuteRequest(sessionId, seekerToken, "python", "print('=== FAST_EXECUTION_B_COMPLETED ===')\n");

  const fastRes = await fastPromise;
  console.log(`Fast B resolved: Seq #${fastRes.data?.execution?.sequence}`);
  
  await pageR.waitForTimeout(1000);
  await pageS.waitForTimeout(1000);
  const midUiR = await pageR.locator(".monaco-editor").evaluate(() => document.body.innerText).catch(() => "");
  console.log(`UI State at T=1.5s (Fast B done, Slow A pending): "${midUiR.includes("FAST_EXECUTION_B_COMPLETED") ? "FAST_B_VISIBLE" : "HIDDEN"}"`);

  // Wait for Slow A to finish
  const slowRes = await slowPromise;
  console.log(`Slow A resolved: Seq #${slowRes.data?.execution?.sequence}`);

  // Give Socket.IO time to broadcast the stale result
  await pageR.waitForTimeout(2000);
  await pageS.waitForTimeout(2000);

  const finalUiR = await pageR.evaluate(() => document.body.innerText).catch(() => "");
  const finalUiS = await pageS.evaluate(() => document.body.innerText).catch(() => "");

  const rHasFast = finalUiR.includes("FAST_EXECUTION_B_COMPLETED");
  const rHasSlow = finalUiR.includes("SLOW_EXECUTION_A_COMPLETED");
  
  const sHasFast = finalUiS.includes("FAST_EXECUTION_B_COMPLETED");
  const sHasSlow = finalUiS.includes("SLOW_EXECUTION_A_COMPLETED");

  console.log(`UI State at T=5.0s (Slow A done):`);
  console.log(`  Recruiter View has Fast B? ${rHasFast}, has Slow A? ${rHasSlow}`);
  console.log(`  Candidate View has Fast B? ${sHasFast}, has Slow A? ${sHasSlow}`);

  const staleOverwritePrevented = (!rHasSlow && rHasFast) && (!sHasSlow && sHasFast);
  console.log(`>> Stale Overwrite Prevented? ${staleOverwritePrevented ? "YES (Invariant UPHELD)" : "NO (RACE CONDITION)"}`);

  // =========================================================================
  // TEST 3: DB Canonical Persistence Validation
  // =========================================================================
  const sessionCheck = await db.collection("interviewsessions").findOne({ _id: sessionRes.insertedId });
  console.log("\n--- TEST 3: DB Canonical Persistence Validation ---");
  console.log(`DB executionSequence: ${sessionCheck.executionSequence}`);
  console.log(`DB lastExecution sequence: ${sessionCheck.lastExecution?.sequence}`);
  const persistCorrect = sessionCheck.lastExecution?.sequence === sessionCheck.executionSequence;
  console.log(`Canonical DB State Correct? ${persistCorrect ? "YES" : "NO"}`);

  console.log("\n=======================================================");
  console.log("=== CANONICAL SEQUENCE ARCHITECTURE AUDIT SUMMARY ===");
  console.log("=======================================================");
  console.log("Date.now() Collisions Detected: ", timestampCollisions > 0 ? `YES (${timestampCollisions})` : "NO");
  console.log("Monotonic Sequence (1..100):    ", isSequenceMonotonic ? "PASS" : "FAIL");
  console.log("Cross-Client Stale Prevention:  ", staleOverwritePrevented ? "PASS" : "FAIL");
  console.log("DB Reconnect State Correct:     ", persistCorrect ? "PASS" : "FAIL");

  await browser.close();
  await mongoose.disconnect();
}

runCanonicalSequenceAudit().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
