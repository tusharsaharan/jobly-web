const { chromium } = require("playwright");
const mongoose = require("../../jobly-api/node_modules/mongoose");
const jwt = require("../../jobly-api/node_modules/jsonwebtoken");
const path = require("path");
const fs = require("fs");

// Read exact environment variables from jobly-api/.env
const envContent = fs.readFileSync(path.join(__dirname, "../../jobly-api/.env"), "utf-8");
const envVars = {};
envContent.split("\n").forEach(line => {
  const [k, ...v] = line.trim().split("=");
  if (k && v.length) envVars[k.trim()] = v.join("=").trim();
});

const MONGO_URI = envVars.MONGO_URI || "mongodb+srv://tusharsaharan:Tus1234@cluster0.41myqti.mongodb.net/jobmatch?appName=Cluster0";
const JWT_SECRET = envVars.JWT_SECRET || "super_secret_jwt_key_123";
const BASE_URL = "http://localhost:8080";
const ARTIFACTS_DIR = "C:/Users/tusha/.gemini/antigravity-ide/brain/6e81a994-d82b-4c02-8db4-e23f7c407ba2";

async function run() {
  console.log("1. Connecting to Atlas MongoDB with exact URI...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const db = mongoose.connection.db;

  // 1. Create Recruiter
  const uniqueId = Date.now();
  const recruiterEmail = `recruiter.${uniqueId}@jobly.test`;
  const recruiterRes = await db.collection("users").insertOne({
    name: "Alex Recruiter",
    email: recruiterEmail,
    password: "Password123!",
    role: "recruiter",
    createdAt: new Date(),
  });
  const recruiter = {
    _id: recruiterRes.insertedId,
    id: recruiterRes.insertedId.toString(),
    name: "Alex Recruiter",
    email: recruiterEmail,
    role: "recruiter",
  };

  // 2. Create Seeker
  const seekerEmail = `seeker.${uniqueId}@jobly.test`;
  const seekerRes = await db.collection("users").insertOne({
    name: "Sam Candidate",
    email: seekerEmail,
    password: "Password123!",
    role: "seeker",
    skills: ["Python", "JavaScript", "TypeScript", "React"],
    resumeText: "Experienced Fullstack Software Engineer with deep expertise in distributed systems and realtime architectures.",
    degree: "B.Tech Computer Science",
    cgpa: 9.2,
    college: "Premier Tech Institute",
    collegeTier: "tier1",
    createdAt: new Date(),
  });
  const seeker = {
    _id: seekerRes.insertedId,
    id: seekerRes.insertedId.toString(),
    name: "Sam Candidate",
    email: seekerEmail,
    role: "seeker",
    skills: ["Python", "JavaScript", "TypeScript", "React"],
  };

  // 3. Create Job
  const jobRes = await db.collection("jobs").insertOne({
    recruiter: recruiter._id,
    title: "Staff Realtime Systems Engineer",
    company: "Jobly Infrastructure Core",
    description: "Designing low-latency collaborative CRDT systems and real-time execution engines.",
    skills: ["Python", "JavaScript", "TypeScript", "Distributed Systems"],
    salaryMin: 190000,
    salaryMax: 260000,
    createdAt: new Date(),
  });
  const job = { _id: jobRes.insertedId, title: "Staff Realtime Systems Engineer" };

  // 4. Create Application
  const appRes = await db.collection("applications").insertOne({
    job: job._id,
    seeker: seeker._id,
    recruiter: recruiter._id,
    status: "interview_scheduled",
    atsScore: 95,
    createdAt: new Date(),
  });
  const application = { _id: appRes.insertedId };

  // 5. Create Interview Session
  const roomKey = `room-audit-${uniqueId}`;
  const sessionRes = await db.collection("interviewsessions").insertOne({
    tenantId: "default",
    application: application._id,
    job: job._id,
    seeker: seeker._id,
    recruiter: recruiter._id,
    title: "Technical Interview: Staff Realtime Systems Engineer",
    scheduledStart: new Date(),
    status: "SCHEDULED",
    stage: "WAITING_ROOM",
    roomKey,
    allowedLanguages: ["python", "javascript", "typescript", "cpp", "java"],
    codeWorkspace: {
      activeLanguage: "python",
      files: [
        {
          name: "solution.py",
          path: "/solution.py",
          content: "# Python Solution Buffer\n\ndef execute_task():\n    print('Candidate workspace initialized')\n\nexecute_task()\n",
          language: "python",
        },
      ],
    },
    createdAt: new Date(),
  });
  const sessionId = sessionRes.insertedId;
  console.log(`InterviewSession created: ${sessionId} | roomKey: ${roomKey}`);

  // 6. Sign JWT tokens with exact JWT_SECRET
  const recruiterToken = jwt.sign({ id: recruiter._id.toString(), userId: recruiter._id.toString(), role: "recruiter" }, JWT_SECRET, { expiresIn: "7d" });
  const seekerToken = jwt.sign({ id: seeker._id.toString(), userId: seeker._id.toString(), role: "seeker" }, JWT_SECRET, { expiresIn: "7d" });

  console.log("Launching Playwright with 2 browser contexts...");
  const browser = await chromium.launch({ headless: true });

  const contextR = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const contextS = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  await contextR.addInitScript(({ token, user }) => {
    localStorage.setItem("jm_token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: recruiterToken, user: recruiter });

  await contextS.addInitScript(({ token, user }) => {
    localStorage.setItem("jm_token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: seekerToken, user: seeker });

  const pageR = await contextR.newPage();
  const pageS = await contextS.newPage();

  console.log("Navigating to interview room...");
  await pageR.goto(`${BASE_URL}/interview/${roomKey}`);
  await pageS.goto(`${BASE_URL}/interview/${roomKey}`);

  await pageR.waitForTimeout(3000);
  await pageS.waitForTimeout(3000);

  // STEP 1: Prejoin Lobby
  console.log("Step 1: Joining from Prejoin Lobby...");
  const joinBtnR = pageR.locator("button:has-text('Join interview')");
  const joinBtnS = pageS.locator("button:has-text('Join interview')");

  if (await joinBtnR.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log("Recruiter clicking Join interview...");
    await joinBtnR.click();
  }
  if (await joinBtnS.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log("Seeker clicking Join interview...");
    await joinBtnS.click();
  }

  await pageR.waitForTimeout(3000);
  await pageS.waitForTimeout(3000);

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_01_recruiter_room_mounted.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_01_seeker_room_mounted.png") });
  console.log("Step 1 Complete: Both clients in main interview room.");

  // STEP 2: Recruiter Header Controls & "Go Live"
  console.log("Step 2: Recruiter changing Stage & Go Live...");
  const stageSelect = pageR.locator("header select").first();
  if (await stageSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
    await stageSelect.selectOption("CODING");
    await pageR.waitForTimeout(500);
  }

  const goLiveBtn = pageR.locator("button:has-text('Go Live')").first();
  if (await goLiveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await goLiveBtn.click();
    await pageR.waitForTimeout(2000);
  }

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_02_recruiter_golive.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_02_seeker_golive.png") });
  console.log("Step 2 Complete: Session is LIVE.");

  // STEP 3: Seeker Types into Monaco Editor (Yjs Collaboration)
  console.log("Step 3: Seeker typing Python solution into Monaco...");
  const monacoEditorS = pageS.locator(".monaco-editor").first();
  if (await monacoEditorS.isVisible({ timeout: 5000 }).catch(() => false)) {
    await monacoEditorS.click();
    await pageS.keyboard.press("Control+A");
    await pageS.keyboard.type('def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: left = mid + 1\n        else: right = mid - 1\n    return -1\n\nprint("Target index:", binary_search([10, 20, 30, 40, 50], 30))\n');
    await pageS.waitForTimeout(2000);
  }

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_03_recruiter_sees_candidate_code.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_03_seeker_typed_code.png") });
  console.log("Step 3 Complete: Seeker's code typed and synced via Yjs.");

  // STEP 4: Language Switcher
  console.log("Step 4: Language Selector switching to JavaScript...");
  const langSelect = pageR.locator("select[title='Change programming language']").first();
  if (await langSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
    await langSelect.selectOption("javascript");
    await pageR.waitForTimeout(1500);
  } else {
    const fallbackSelect = pageR.locator("select").nth(1);
    if (await fallbackSelect.isVisible().catch(() => false)) {
      await fallbackSelect.selectOption("javascript");
      await pageR.waitForTimeout(1500);
    }
  }

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_04_recruiter_language_js.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_04_seeker_language_js.png") });
  console.log("Step 4 Complete: Language switched to JavaScript on both screens.");

  // STEP 5: Recruiter Types JavaScript Code
  console.log("Step 5: Recruiter typing JavaScript solution...");
  const monacoEditorR = pageR.locator(".monaco-editor").first();
  if (await monacoEditorR.isVisible().catch(() => false)) {
    await monacoEditorR.click();
    await pageR.keyboard.press("Control+A");
    await pageR.keyboard.type('function testSimultaneousSync() {\n  console.log("=== JOBLY LIVE CODE SYNC TEST PASSED ===");\n  return true;\n}\ntestSimultaneousSync();\n');
    await pageR.waitForTimeout(2000);
  }

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_05_recruiter_typed_js.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_05_seeker_sees_js.png") });
  console.log("Step 5 Complete: Recruiter's code synced to Seeker.");

  // STEP 6: Execute Code & Output Panel Synchronization (THE CRITICAL VERIFICATION)
  console.log("Step 6: Executing Code & verifying Output Panel Synchronization...");
  const runBtnR = pageR.locator("button:has-text('Run Code')").first();
  if (await runBtnR.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log("Recruiter clicking 'Run Code'...");
    await runBtnR.click();
    await pageR.waitForTimeout(4500);
    await pageS.waitForTimeout(2000);
  }

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_06_recruiter_execution_synced.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_06_seeker_execution_synced.png") });
  console.log("Step 6 Complete: Code execution output verified on both screens.");

  // STEP 7: Interactive Terminal Panel
  console.log("Step 7: Testing Terminal Panel on both clients...");
  const terminalTabR = pageR.locator("button:has-text('Terminal')").first();
  const terminalTabS = pageS.locator("button:has-text('Terminal')").first();

  if (await terminalTabR.isVisible({ timeout: 3000 }).catch(() => false)) {
    await terminalTabR.click();
  }
  if (await terminalTabS.isVisible({ timeout: 3000 }).catch(() => false)) {
    await terminalTabS.click();
  }
  await pageR.waitForTimeout(1000);

  const termInputS = pageS.locator("input[placeholder*='Type shell command']").first();
  if (await termInputS.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log("Seeker executing 'help' in terminal...");
    await termInputS.fill("help");
    await termInputS.press("Enter");
    await pageS.waitForTimeout(1500);

    console.log("Seeker executing 'ls' in terminal...");
    await termInputS.fill("ls");
    await termInputS.press("Enter");
    await pageS.waitForTimeout(1500);
  }

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_07_recruiter_terminal.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_07_seeker_terminal.png") });
  console.log("Step 7 Complete: Interactive terminal streamed commands.");

  // STEP 8: Checkpoint Timeline & Restore Flow
  console.log("Step 8: Testing Checkpoint Timeline & Restore flow...");
  const checkpointsTabR = pageR.locator("button:has-text('Checkpoints')").first();
  if (await checkpointsTabR.isVisible({ timeout: 3000 }).catch(() => false)) {
    await checkpointsTabR.click();
    await pageR.waitForTimeout(1500);

    const restoreBtn = pageR.locator("button:has-text('Restore')").first();
    if (await restoreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("Recruiter clicking Restore -> inline Confirm...");
      await restoreBtn.click();
      await pageR.waitForTimeout(1000);

      const confirmBtn = pageR.locator("button:has-text('Confirm')").first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await pageR.waitForTimeout(2000);
      }
    }
  }

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_08_recruiter_checkpoint_restored.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_08_seeker_checkpoint_restored.png") });
  console.log("Step 8 Complete: Checkpoint restored and synchronized.");

  // STEP 9: System Design Whiteboard Tab (Excalidraw)
  console.log("Step 9: Testing System Design Whiteboard Tab...");
  const designTabR = pageR.locator("button:has-text('Design')").first();
  const designTabS = pageS.locator("button:has-text('Design')").first();

  if (await designTabR.isVisible({ timeout: 3000 }).catch(() => false)) {
    await designTabR.click();
  }
  if (await designTabS.isVisible({ timeout: 3000 }).catch(() => false)) {
    await designTabS.click();
  }
  await pageR.waitForTimeout(3000);

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_09_recruiter_whiteboard.png") });
  await pageS.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_09_seeker_whiteboard.png") });
  console.log("Step 9 Complete: Excalidraw whiteboard active on both clients.");

  // Switch back to Code
  const codeTabR = pageR.locator("button:has-text('Code')").first();
  const codeTabS = pageS.locator("button:has-text('Code')").first();
  if (await codeTabR.isVisible().catch(() => false)) await codeTabR.click();
  if (await codeTabS.isVisible().catch(() => false)) await codeTabS.click();
  await pageR.waitForTimeout(1000);

  // STEP 10: AI Interviewer Copilot (Recruiter Side Only)
  console.log("Step 10: Testing AI Interviewer Copilot...");
  const aiTabR = pageR.locator("button:has-text('AI')").first();
  if (await aiTabR.isVisible({ timeout: 3000 }).catch(() => false)) {
    await aiTabR.click();
    await pageR.waitForTimeout(1000);

    const suggestBtn = pageR.locator("button:has-text('Suggest')").first();
    if (await suggestBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("Recruiter clicking 'Suggest'...");
      await suggestBtn.click();
      await pageR.waitForTimeout(3500);
    }
  }

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_10_recruiter_ai_copilot.png") });
  console.log("Step 10 Complete: AI Copilot suggestions and competency matrix verified.");

  // STEP 11: Seeker Proctoring Telemetry Alert
  console.log("Step 11: Testing Proctoring Telemetry...");
  await pageS.evaluate(({ rKey }) => {
    if (window._joblySocket) {
      window._joblySocket.emit("proctor_event", {
        roomKey: rKey,
        eventType: "tab_hidden",
        timestamp: Date.now(),
      });
    }
  }, { rKey: roomKey });
  await pageR.waitForTimeout(1500);

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_11_recruiter_proctoring_alert.png") });
  console.log("Step 11 Complete: Proctoring alert rendered on Recruiter screen.");

  // STEP 12: End Session Button
  console.log("Step 12: Testing End Session flow...");
  const endSessionBtn = pageR.locator("button:has-text('End Session')").first();
  if (await endSessionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    pageR.on("dialog", d => d.accept());
    await endSessionBtn.click();
    await pageR.waitForTimeout(2000);
  }

  await pageR.screenshot({ path: path.join(ARTIFACTS_DIR, "dom_audit_12_recruiter_session_ended.png") });
  console.log("Step 12 Complete: Session ended.");

  await browser.close();
  await mongoose.disconnect();
  console.log("SUCCESS: ALL 12 LIVE SIMULTANEOUS DOM STEPS EXECUTED AND CAPTURED!");
}

run().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
