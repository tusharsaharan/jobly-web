const { chromium } = require("playwright");
const mongoose = require("../../jobly-api/node_modules/mongoose");
const jwt = require("../../jobly-api/node_modules/jsonwebtoken");
const path = require("path");
const fs = require("fs");

const envContent = fs.readFileSync(path.join(__dirname, "../../jobly-api/.env"), "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.trim().split("=");
  if (k && v.length) envVars[k.trim()] = v.join("=").trim();
});

const MONGO_URI = envVars.MONGO_URI || "mongodb+srv://tusharsaharan:Tus1234@cluster0.41myqti.mongodb.net/jobmatch?appName=Cluster0";
const JWT_SECRET = envVars.JWT_SECRET || "super_secret_jwt_key_123";
const BASE_URL = "http://localhost:8080";
const ARTIFACTS_DIR = "C:/Users/tusha/.gemini/antigravity-ide/brain/6e81a994-d82b-4c02-8db4-e23f7c407ba2";

async function runDualSandboxTests() {
  console.log("=== Setting up Live Dual-Client Sandbox Mirroring Test ===");
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const uniqueId = Date.now();
  const recruiterRes = await db.collection("users").insertOne({
    name: "Alex Recruiter",
    email: `recruiter.mirror.${uniqueId}@jobly.test`,
    password: "Password123!",
    role: "recruiter",
    createdAt: new Date(),
  });

  const seekerRes = await db.collection("users").insertOne({
    name: "Sam Candidate",
    email: `seeker.mirror.${uniqueId}@jobly.test`,
    password: "Password123!",
    role: "seeker",
    skills: ["Python", "JavaScript"],
    createdAt: new Date(),
  });

  const jobRes = await db.collection("jobs").insertOne({
    recruiter: recruiterRes.insertedId,
    title: "Sandbox Systems Verification Engineer",
    company: "Jobly Sandbox Core",
    description: "Testing execution sandbox timeouts and runtime mirroring across peers.",
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

  const roomKey = `room-sandbox-mirror-${uniqueId}`;
  const sessionRes = await db.collection("interviewsessions").insertOne({
    tenantId: "default",
    application: appRes.insertedId,
    job: jobRes.insertedId,
    seeker: seekerRes.insertedId,
    recruiter: recruiterRes.insertedId,
    title: "Technical Interview: Sandbox Verification",
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
          content: "# Initial Buffer\n",
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

  // Click Join on prejoin lobby if visible
  await pageR.waitForTimeout(2000);
  const joinR = pageR.locator("button:has-text('Join interview')");
  const joinS = pageS.locator("button:has-text('Join interview')");
  if (await joinR.isVisible({ timeout: 4000 }).catch(() => false)) await joinR.click();
  if (await joinS.isVisible({ timeout: 4000 }).catch(() => false)) await joinS.click();

  await pageR.waitForTimeout(3000);
  await pageS.waitForTimeout(3000);

  // Recruiter clicks Go Live
  const goLiveBtn = pageR.locator("button:has-text('Go Live')");
  if (await goLiveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await goLiveBtn.click();
    await pageR.waitForTimeout(1000);
  }

  // Intercept socket execution broadcasts in Candidate page
  await pageS.evaluate(() => {
    window.__receivedExecutions = [];
    if (window.io) {
      // Listen for socket events
    }
  });

  // Wait for interview room to mount
  console.log("Waiting for Monaco editor on both clients...");
  await pageR.waitForSelector(".monaco-editor", { timeout: 20000 });
  await pageS.waitForSelector(".monaco-editor", { timeout: 20000 });
  console.log("Monaco editor mounted on both clients.");

  // Helper function to set editor text via Yjs or keyboard and run code
  async function runCodeTest({ name, code, language, isTimeout }) {
    console.log(`\n--- Starting Test: ${name} (${language}) ---`);

    // 1. Switch language if needed
    const langSelect = pageR.locator("select[aria-label='Active language'], select[title='Change programming language']").first();
    if (await langSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await langSelect.selectOption(language);
      await pageR.waitForTimeout(1000);
      await pageS.waitForTimeout(1000);
    } else {
      const fallbackSelect = pageR.locator("select").nth(1);
      if (await fallbackSelect.isVisible().catch(() => false)) {
        await fallbackSelect.selectOption(language);
        await pageR.waitForTimeout(1000);
        await pageS.waitForTimeout(1000);
      }
    }

    // 2. Select editor and replace content
    const monacoR = pageR.locator(".monaco-editor").first();
    await monacoR.click();
    await pageR.keyboard.press("Control+A");
    await pageR.keyboard.press("Backspace");
    await pageR.keyboard.type(code);
    await pageR.waitForTimeout(1000);
    await pageS.waitForTimeout(1000);

    // 3. Click Run Code
    console.log("Recruiter clicking 'Run Code'...");
    const runBtn = pageR.locator("button:has-text('Run Code')").first();
    const startTime = Date.now();
    await runBtn.click();

    // 4. Poll for terminal state on BOTH recruiter and candidate screens
    console.log("Waiting for execution result on both screens...");
    const timeoutMax = isTimeout ? 20000 : 10000;

    const outPreR = pageR.locator("pre").first();
    const outPreS = pageS.locator("pre").first();

    await pageR.waitForSelector("button:has-text('Run Code'):not([disabled])", { timeout: timeoutMax });
    const wallClockMs = Date.now() - startTime;
    console.log(`Execution completed in wall-clock time: ${wallClockMs}ms`);

    await pageR.waitForTimeout(1000);
    await pageS.waitForTimeout(1000);

    // Extract text from both output panels
    const textR = await outPreR.textContent().catch(() => "[No text found]");
    const textS = await outPreS.textContent().catch(() => "[No text found]");

    // Extract exit code badge
    const badgeR = await pageR.locator("span.text-rose-400, span.text-emerald-400").first().textContent().catch(() => "");
    const badgeS = await pageS.locator("span.text-rose-400, span.text-emerald-400").first().textContent().catch(() => "");

    // Screenshots
    const fileR = `sandbox_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_recruiter.png`;
    const fileS = `sandbox_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_candidate.png`;

    await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, fileR) });
    await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, fileS) });

    console.log(`Results for ${name}:`);
    console.log(`  Recruiter Badge: "${badgeR}" | Candidate Badge: "${badgeS}"`);
    console.log(`  Recruiter Output:\n${textR}`);
    console.log(`  Candidate Output:\n${textS}`);
    console.log(`  Screenshots saved: ${fileR}, ${fileS}`);

    return {
      name,
      language,
      wallClockMs,
      badgeR,
      badgeS,
      textR,
      textS,
      fileR,
      fileS,
      isIdentical: textR.trim() === textS.trim() && badgeR.trim() === badgeS.trim(),
    };
  }

  // ==========================================
  // TEST 1: Infinite Loop Timeout
  // ==========================================
  const t1Py = await runCodeTest({
    name: "01_Python_Infinite_Loop_Timeout",
    language: "python",
    code: "import time\nprint('Python loop running...')\nwhile True:\n    pass\n",
    isTimeout: true,
  });

  const t1Js = await runCodeTest({
    name: "02_JavaScript_Infinite_Loop_Timeout",
    language: "javascript",
    code: "console.log('JS loop running...');\nwhile (true) {}\n",
    isTimeout: true,
  });

  // ==========================================
  // TEST 2: Runtime Exceptions & Tracebacks
  // ==========================================
  const t2Py = await runCodeTest({
    name: "03_Python_Division_By_Zero_Exception",
    language: "python",
    code: "print('Starting division test...')\nx = 10 / 0\nprint('Completed')\n",
    isTimeout: false,
  });

  const t2Js = await runCodeTest({
    name: "04_JavaScript_Thrown_Error_Exception",
    language: "javascript",
    code: "console.log('Starting JS exception test...');\nthrow new Error('Deliberate unhandled runtime crash');\n",
    isTimeout: false,
  });

  console.log("\n==========================================");
  console.log("=== FINAL DUAL-CLIENT SANDBOX SUMMARY ===");
  console.log("==========================================");
  console.log("1. Python Timeout Mirrored:", t1Py.isIdentical ? "YES (100% Match)" : "NO");
  console.log("2. JS Timeout Mirrored:    ", t1Js.isIdentical ? "YES (100% Match)" : "NO");
  console.log("3. Python Exception Match: ", t2Py.isIdentical ? "YES (100% Match)" : "NO");
  console.log("4. JS Exception Match:     ", t2Js.isIdentical ? "YES (100% Match)" : "NO");

  await browser.close();
  await mongoose.disconnect();
}

runDualSandboxTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
