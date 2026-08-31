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

async function runOutOfOrderTests() {
  console.log("=== OUT-OF-ORDER EXECUTION COMPLETION AUDIT ===\n");
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const uniqueId = Date.now();
  const recruiterRes = await db.collection("users").insertOne({
    name: "Alex Recruiter",
    email: `recruiter.ooo.${uniqueId}@jobly.test`,
    password: "Password123!",
    role: "recruiter",
    createdAt: new Date(),
  });

  const seekerRes = await db.collection("users").insertOne({
    name: "Sam Candidate",
    email: `seeker.ooo.${uniqueId}@jobly.test`,
    password: "Password123!",
    role: "seeker",
    skills: ["Python", "JavaScript"],
    createdAt: new Date(),
  });

  const jobRes = await db.collection("jobs").insertOne({
    recruiter: recruiterRes.insertedId,
    title: "Realtime Execution Pipeline Engineer",
    company: "Jobly Sandbox Core",
    description: "Testing out-of-order execution completion",
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

  const roomKey = `room-ooo-audit-${uniqueId}`;
  const sessionRes = await db.collection("interviewsessions").insertOne({
    tenantId: "default",
    application: appRes.insertedId,
    job: jobRes.insertedId,
    seeker: seekerRes.insertedId,
    recruiter: recruiterRes.insertedId,
    title: "Technical Interview: Out-of-Order Execution Audit",
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
          content: "# Out of Order Buffer\n",
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

  // =========================================================================
  // TEST 1: Python Out-of-Order Test (Slow A @ T=0s, Fast B @ T=1s)
  // =========================================================================
  console.log("\n--- TEST 1: Python Out-of-Order Execution (Slow A=4s vs Fast B=0.1s) ---");
  const codeSlowPy = "import time\ntime.sleep(4)\nprint('=== SLOW_EXECUTION_A_COMPLETED ===')\n";
  const codeFastPy = "print('=== FAST_EXECUTION_B_COMPLETED ===')\n";

  console.log("Triggering Slow Execution A (takes ~4 seconds)...");
  const reqSlowPyPromise = makeExecuteRequest(sessionId, recruiterToken, "python", codeSlowPy);

  // Wait 1 second, then trigger Fast Execution B
  await new Promise((r) => setTimeout(r, 1000));
  console.log("Triggering Fast Execution B (takes ~0.1 seconds)...");
  const reqFastPyPromise = makeExecuteRequest(sessionId, seekerToken, "python", codeFastPy);

  // Await Fast Execution B completion
  const resFastPy = await reqFastPyPromise;
  console.log("Fast Execution B API returned:", resFastPy.data?.execution?.executionId, `stdout: "${resFastPy.data?.execution?.stdout?.trim()}"`);

  // Wait 500ms for UI to reflect Fast Execution B
  await pageR.waitForTimeout(800);
  await pageS.waitForTimeout(800);

  const outMidR_Py = await pageR.locator("pre").first().textContent().catch(() => "");
  const outMidS_Py = await pageS.locator("pre").first().textContent().catch(() => "");
  console.log("UI State at T=1.8s (After Fast B finishes, while Slow A is still running):");
  console.log("  Recruiter View:", outMidR_Py.trim());
  console.log("  Candidate View:", outMidS_Py.trim());

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "ooo_01_py_after_fast_b_recruiter.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "ooo_01_py_after_fast_b_candidate.png") });

  // Now await Slow Execution A completion
  const resSlowPy = await reqSlowPyPromise;
  console.log("Slow Execution A API returned:", resSlowPy.data?.execution?.executionId, `stdout: "${resSlowPy.data?.execution?.stdout?.trim()}"`);

  // Wait for socket broadcast of Slow A
  await pageR.waitForTimeout(1000);
  await pageS.waitForTimeout(1000);

  const outFinalR_Py = await pageR.locator("pre").first().textContent().catch(() => "");
  const outFinalS_Py = await pageS.locator("pre").first().textContent().catch(() => "");
  console.log("UI State at T=5.5s (After Slow A finally resolves):");
  console.log("  Recruiter View:", outFinalR_Py.trim());
  console.log("  Candidate View:", outFinalS_Py.trim());

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "ooo_01_py_after_slow_a_recruiter.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "ooo_01_py_after_slow_a_candidate.png") });

  const pyStaleOverwrite = outFinalR_Py.includes("SLOW_EXECUTION_A_COMPLETED");
  console.log(">> Python Stale Overwrite Detected:", pyStaleOverwrite ? "YES (Stale Slow A overwrote newer Fast B)" : "NO (Fast B preserved)");

  // =========================================================================
  // TEST 2: JavaScript Out-of-Order Test (Slow A @ T=0s, Fast B @ T=1s)
  // =========================================================================
  console.log("\n--- TEST 2: JavaScript Out-of-Order Execution (Slow A=4s vs Fast B=0.1s) ---");
  const codeSlowJs = "const s = Date.now(); while(Date.now() - s < 4000) {} console.log('=== SLOW_JS_A_COMPLETED ===');\n";
  const codeFastJs = "console.log('=== FAST_JS_B_COMPLETED ===');\n";

  console.log("Triggering Slow JS Execution A (takes ~4 seconds)...");
  const reqSlowJsPromise = makeExecuteRequest(sessionId, recruiterToken, "javascript", codeSlowJs);

  await new Promise((r) => setTimeout(r, 1000));
  console.log("Triggering Fast JS Execution B (takes ~0.1 seconds)...");
  const reqFastJsPromise = makeExecuteRequest(sessionId, seekerToken, "javascript", codeFastJs);

  const resFastJs = await reqFastJsPromise;
  console.log("Fast JS Execution B API returned:", resFastJs.data?.execution?.executionId, `stdout: "${resFastJs.data?.execution?.stdout?.trim()}"`);

  await pageR.waitForTimeout(800);
  await pageS.waitForTimeout(800);

  const outMidR_Js = await pageR.locator("pre").first().textContent().catch(() => "");
  const outMidS_Js = await pageS.locator("pre").first().textContent().catch(() => "");
  console.log("UI State at T=1.8s (After Fast JS B finishes):");
  console.log("  Recruiter View:", outMidR_Js.trim());
  console.log("  Candidate View:", outMidS_Js.trim());

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "ooo_02_js_after_fast_b_recruiter.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "ooo_02_js_after_fast_b_candidate.png") });

  const resSlowJs = await reqSlowJsPromise;
  console.log("Slow JS Execution A API returned:", resSlowJs.data?.execution?.executionId, `stdout: "${resSlowJs.data?.execution?.stdout?.trim()}"`);

  await pageR.waitForTimeout(1000);
  await pageS.waitForTimeout(1000);

  const outFinalR_Js = await pageR.locator("pre").first().textContent().catch(() => "");
  const outFinalS_Js = await pageS.locator("pre").first().textContent().catch(() => "");
  console.log("UI State at T=5.5s (After Slow JS A finally resolves):");
  console.log("  Recruiter View:", outFinalR_Js.trim());
  console.log("  Candidate View:", outFinalS_Js.trim());

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "ooo_02_js_after_slow_a_recruiter.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "ooo_02_js_after_slow_a_candidate.png") });

  const jsStaleOverwrite = outFinalR_Js.includes("SLOW_JS_A_COMPLETED");
  console.log(">> JavaScript Stale Overwrite Detected:", jsStaleOverwrite ? "YES (Stale Slow A overwrote newer Fast B)" : "NO (Fast B preserved)");

  // =========================================================================
  // TEST 3: 5 Alternating Slow/Fast Executions
  // =========================================================================
  console.log("\n--- TEST 3: 5 Alternating Slow (3s) vs Fast (0.1s) Execution Pairs ---");
  const pairResults = [];

  for (let i = 1; i <= 5; i++) {
    console.log(`\nExecuting Pair ${i}/5...`);
    const slowCode = `import time\ntime.sleep(3)\nprint('PAIR_${i}_SLOW_3S')\n`;
    const fastCode = `print('PAIR_${i}_FAST_0S')\n`;

    const slowPromise = makeExecuteRequest(sessionId, recruiterToken, "python", slowCode);
    await new Promise((r) => setTimeout(r, 600)); // Trigger fast 600ms after slow
    const fastPromise = makeExecuteRequest(sessionId, seekerToken, "python", fastCode);

    const fastRes = await fastPromise;
    await pageR.waitForTimeout(400);
    const midUi = await pageR.locator("pre").first().textContent().catch(() => "");

    const slowRes = await slowPromise;
    await pageR.waitForTimeout(600);
    const finalUi = await pageR.locator("pre").first().textContent().catch(() => "");

    const staleOccurred = finalUi.includes(`PAIR_${i}_SLOW_3S`);
    console.log(`Pair ${i} Summary:`);
    console.log(`  Fast Result ID: ${fastRes.data?.execution?.executionId} (stdout: "${fastRes.data?.execution?.stdout?.trim()}")`);
    console.log(`  Slow Result ID: ${slowRes.data?.execution?.executionId} (stdout: "${slowRes.data?.execution?.stdout?.trim()}")`);
    console.log(`  UI at Fast finish: "${midUi.trim()}"`);
    console.log(`  UI at Slow finish: "${finalUi.trim()}"`);
    console.log(`  Stale Overwrite on Pair ${i}: ${staleOccurred ? "YES (STALE OVERWRITE)" : "NO"}`);

    pairResults.push({
      pair: i,
      fastId: fastRes.data?.execution?.executionId,
      slowId: slowRes.data?.execution?.executionId,
      midUi: midUi.trim(),
      finalUi: finalUi.trim(),
      staleOccurred,
    });
  }

  console.log("\n=======================================================");
  console.log("=== OUT-OF-ORDER RACE CONDITION AUDIT SUMMARY ===");
  console.log("=======================================================");
  console.log("Python Test 1 Stale Overwrite:     ", pyStaleOverwrite ? "DETECTED" : "NONE");
  console.log("JavaScript Test 2 Stale Overwrite: ", jsStaleOverwrite ? "DETECTED" : "NONE");
  console.log("5 Pairs Stale Overwrite Frequency: ", `${pairResults.filter((p) => p.staleOccurred).length} / 5 Pairs`);

  await browser.close();
  await mongoose.disconnect();
}

runOutOfOrderTests().catch((err) => {
  console.error("Out-of-order test error:", err);
  process.exit(1);
});
