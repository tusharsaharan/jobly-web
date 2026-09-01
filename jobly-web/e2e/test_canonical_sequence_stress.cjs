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
const API_URL = "http://localhost:5000";

// Custom agent to handle extreme concurrency without socket exhaustion
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 2000 });

function makeExecuteRequest(sessionId, token, language, code, reqId) {
  const tStart = Date.now();
  return new Promise((resolve) => {
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
        agent: httpAgent
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          const tEnd = Date.now();
          try {
            resolve({ reqId, statusCode: res.statusCode, data: JSON.parse(body), roundtripMs: tEnd - tStart });
          } catch (e) {
            resolve({ reqId, statusCode: res.statusCode, raw: body, error: "Parse error", roundtripMs: tEnd - tStart });
          }
        });
      }
    );
    req.on("error", (e) => resolve({ reqId, error: e.message, roundtripMs: Date.now() - tStart }));
    req.write(data);
    req.end();
  });
}

async function stressTest(level, db, recruiterToken, seekerToken) {
  console.log(`\n======================================================`);
  console.log(`=== STRESS TEST LEVEL: ${level} CONCURRENT REQUESTS ===`);
  console.log(`======================================================`);

  const uniqueId = Date.now();
  const roomKey = `room-stress-${level}-${uniqueId}`;
  
  const appRes = await db.collection("applications").findOne();
  const jobRes = await db.collection("jobs").findOne();
  const seekerRes = await db.collection("users").findOne({ role: "seeker" });
  const recruiterRes = await db.collection("users").findOne({ role: "recruiter" });

  const sessionRes = await db.collection("interviewsessions").insertOne({
    tenantId: "default",
    application: appRes._id,
    job: jobRes._id,
    seeker: seekerRes._id,
    recruiter: recruiterRes._id,
    title: `Stress Test: ${level}`,
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

  const promises = [];
  const startStamp = Date.now();

  console.log(`Dispatching ${level} requests...`);
  for (let i = 1; i <= level; i++) {
    // Deliberately randomize duration 1-100ms so OS completion order is highly scrambled
    const durationMs = Math.floor(Math.random() * 100) + 1;
    const code = `import time\ntime.sleep(${durationMs / 1000})\nprint("EXEC_${i}")`;
    // We alternate tokens just to simulate cross-client
    const token = i % 2 === 0 ? recruiterToken : seekerToken;
    promises.push(makeExecuteRequest(sessionId, token, "python", code, i));
  }

  const results = await Promise.all(promises);
  const endStamp = Date.now();
  console.log(`All ${level} requests resolved in ${endStamp - startStamp}ms.`);

  const sequences = [];
  let successful = 0;
  let failedSandbox = 0;
  let failedNetwork = 0;
  let missingSequences = 0;
  let duplicates = 0;
  const seqSet = new Set();
  
  for (const res of results) {
    if (res.error) {
      failedNetwork++;
      continue;
    }
    if (res.statusCode !== 200) {
      failedNetwork++;
      continue;
    }
    
    if (res.data?.execution) {
      const seq = res.data.execution.sequence;
      if (res.data.execution.exitCode !== 0) failedSandbox++;
      else successful++;

      if (seq) {
        if (seqSet.has(seq)) {
          duplicates++;
        }
        seqSet.add(seq);
        sequences.push(seq);
      } else {
        missingSequences++;
      }
    } else {
      missingSequences++;
    }
  }

  sequences.sort((a, b) => a - b);
  
  // Validation
  let hasGaps = false;
  if (sequences.length > 0) {
    for (let i = 0; i < sequences.length; i++) {
      if (sequences[i] !== i + 1) {
        hasGaps = true;
        break;
      }
    }
  }

  const expectedMaxSeq = sequences.length;
  const actualMaxSeq = sequences.length > 0 ? sequences[sequences.length - 1] : 0;
  
  // Verify MongoDB canonical state
  const finalSession = await db.collection("interviewsessions").findOne({ _id: sessionRes.insertedId });
  const dbMaxSeq = finalSession.executionSequence;
  const dbLastExecutionSeq = finalSession.lastExecution?.sequence || 0;

  console.log(`\n--- SUMMARY FOR ${level} REQUESTS ---`);
  console.log(`Total Requests Sent:        ${level}`);
  console.log(`Network/Timeout Errors:     ${failedNetwork}`);
  console.log(`Sandbox Exceptions (OOM/1): ${failedSandbox}`);
  console.log(`Successful Executions (0):  ${successful}`);
  console.log(`Total Sequences Assigned:   ${sequences.length} / ${level}`);
  console.log(`Missing Sequence Assignments: ${missingSequences}`);
  console.log(`Duplicate Sequence Assigned:  ${duplicates}`);
  console.log(`Sequence Integrity (1..N):  ${!hasGaps && sequences.length === level ? "PERFECT" : "GAPS DETECTED"}`);
  console.log(`Max Sequence Assigned:      ${actualMaxSeq}`);
  console.log(`MongoDB executionSequence:  ${dbMaxSeq}`);
  console.log(`MongoDB lastExecution Seq:  ${dbLastExecutionSeq}`);
  console.log(`Canonical DB State matches? ${dbMaxSeq === dbLastExecutionSeq && dbMaxSeq === actualMaxSeq ? "YES" : "NO"}`);
  
  return {
    level,
    success: duplicates === 0 && !hasGaps && sequences.length === level && dbMaxSeq === level && dbLastExecutionSeq === level
  };
}

async function runTests() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const recruiterRes = await db.collection("users").findOne({ role: "recruiter" });
  const seekerRes = await db.collection("users").findOne({ role: "seeker" });
  const recruiterToken = jwt.sign({ id: recruiterRes._id.toString(), role: "recruiter" }, JWT_SECRET, { expiresIn: "7d" });
  const seekerToken = jwt.sign({ id: seekerRes._id.toString(), role: "seeker" }, JWT_SECRET, { expiresIn: "7d" });

  try {
    const res100 = await stressTest(100, db, recruiterToken, seekerToken);
    const res500 = await stressTest(500, db, recruiterToken, seekerToken);
    const res1000 = await stressTest(1000, db, recruiterToken, seekerToken);

    console.log("\n=======================================================");
    console.log("=== EXTREME CONCURRENCY ARCHITECTURE AUDIT SUMMARY ===");
    console.log("=======================================================");
    console.log(`100 Concurrent Requests:  ${res100.success ? "PASS (Zero Race Conditions)" : "FAIL"}`);
    console.log(`500 Concurrent Requests:  ${res500.success ? "PASS (Zero Race Conditions)" : "FAIL"}`);
    console.log(`1000 Concurrent Requests: ${res1000.success ? "PASS (Zero Race Conditions)" : "FAIL"}`);
    console.log("=======================================================\n");

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
