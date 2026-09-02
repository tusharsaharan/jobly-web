#!/usr/bin/env node
/**
 * Jobly demo orchestrator — single command for demo day.
 *
 * node scripts/demo-up.js full boot: compose + preflight + seed
 * node scripts/demo-up.js --preflight-only just verify environment
 *
 * Exits non-zero on any failed preflight so failures are loud, never silent.
 */
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const API_DIR = path.join(ROOT, "jobly-api");

// Minimal.env loader (no external deps — scripts must run on cold machines)
(function loadEnv(file) {
 try {
 const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
 for (const line of lines) {
 const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
 if (!m) continue;
 const key = m[1];
 let val = m[2];
 if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
 if (!(key in process.env)) process.env[key] = val;
 }
 } catch {}
})(path.join(API_DIR, ".env"));

const c = {
 green: (s) => `\x1b[32m${s}\x1b[0m`,
 red: (s) => `\x1b[31m${s}\x1b[0m`,
 yellow: (s) => `\x1b[33m${s}\x1b[0m`,
 dim: (s) => `\x1b[2m${s}\x1b[0m`,
 bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const results = [];
function record(name, ok, detail) {
 results.push({ name, ok, detail });
}

function sh(cmd, opts = {}) {
 try {
 return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], cwd: opts.cwd || ROOT, timeout: opts.timeout || 30000 }).toString().trim();
 } catch (err) {
 return null;
 }
}

function dockerExec(container, cmd) {
 return sh(`docker exec ${container} ${cmd}`) || "";
}

async function waitHttp(url, timeoutMs = 90000) {
 const start = Date.now();
 while (Date.now() - start < timeoutMs) {
 try {
 const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
 if (res.ok) return true;
 } catch {}
 await new Promise((r) => setTimeout(r, 2000));
 }
 return false;
}

async function preflight() {
 console.log(c.bold("\n──────────────────────────────────────────────"));
 console.log(c.bold(" Jobly Demo — Pre-flight Check"));
 console.log(c.bold("──────────────────────────────────────────────\n"));

 // 1. Docker available
 const dockerVersion = sh("docker --version");
 record("Docker available", Boolean(dockerVersion), dockerVersion || "docker not found on PATH");

 // 2. Compose services healthy
 if (dockerVersion) {
 for (const svc of ["jobly-mongodb", "jobly-redis", "jobly-minio", "jobly-livekit", "jobly-terminal-runner"]) {
 const status = sh(`docker inspect -f "{{.State.Status}}" ${svc}`);
 const health = sh(`docker inspect -f "{{if.State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" ${svc}`);
 const ok = status === "running" && (!health || health === "healthy" || health === "none" || health === "starting");
 record(`Container ${svc}`, ok, `state=${status} health=${health}`);
 }
 }

 // 3. Mongo reachable (via container)
 if (dockerVersion) {
 const ping = dockerExec("jobly-mongodb", "mongosh --quiet --eval 'db.adminCommand(\\\"ping\\\").ok'");
 record("Mongo ping", ping.includes("1"), ping || "no response");
 }

 // 4. Redis reachable
 if (dockerVersion) {
 const ping = dockerExec("jobly-redis", "redis-cli ping");
 record("Redis ping", ping === "PONG", ping || "no response");
 }

 // 5. LiveKit reachable
 const livekitOk = await waitHttp("http://127.0.0.1:7880", 5000);
 record("LiveKit HTTP reachable (7880)", livekitOk, livekitOk? "ok": "not responding");

 // 6. Terminal runner reachable + auth required
 let runnerStatus = "not checked";
 try {
 const res = await fetch("http://127.0.0.1:4100/health", { signal: AbortSignal.timeout(4000) });
 runnerStatus = `health=${res.status}`;
 record("Terminal runner reachable (4100)", res.ok, runnerStatus);
 // Verify auth is enforced: POST /sessions without a token must be 401
 const noAuth = await fetch("http://127.0.0.1:4100/sessions", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ sessionId: "preflight-auth-probe" }),
 signal: AbortSignal.timeout(4000),
 });
 record("Terminal runner auth enforced", noAuth.status === 401, `no-token status=${noAuth.status}`);
 } catch (e) {
 record("Terminal runner reachable (4100)", false, e.message);
 }

 // 7. MinIO reachable
 const minioOk = await waitHttp("http://127.0.0.1:9000/minio/health/live", 5000);
 record("MinIO reachable (9000)", minioOk, minioOk? "ok": "not responding");

 // 8. Gemini key configured + live
 const key = process.env.GEMINI_API_KEY;
 if (!key) {
 record("Gemini API key", false, "GEMINI_API_KEY missing in jobly-api/.env");
 } else {
 try {
 const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent", {
 method: "POST",
 headers: { "Content-Type": "application/json", "x-goog-api-key": key },
 body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with exactly: OK" }] }] }),
 signal: AbortSignal.timeout(15000),
 });
 const data = await res.json();
 const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
 record("Gemini API live", res.ok && text.includes("OK"), `status=${res.status} reply=${text.trim().slice(0, 20)}`);
 } catch (e) {
 record("Gemini API live", false, e.message);
 }
 }

 // 9. LiveKit key match: API signs with devkey; compose runs devkey: secret
 const apiK = process.env.LIVEKIT_API_KEY;
 const apiS = process.env.LIVEKIT_API_SECRET;
 const pub = process.env.LIVEKIT_PUBLIC_URL;
 record("LiveKit credentials set", Boolean(apiK && apiS && pub), `key=${apiK} public=${pub}`);

 // 10. Language runtimes for the interview sandbox
 const runtimes = [
 ["node", "node --version"],
 ["python", "python --version 2>&1"],
 ["javac", "javac -version 2>&1"],
 ["g++", "g++ --version 2>&1"],
 ];
 for (const [name, cmd] of runtimes) {
 const out = sh(cmd);
 record(`Runtime ${name}`, Boolean(out &&!out.toLowerCase().includes("not recognized")), (out || "not found").split("\n")[0]);
 }

 // 11. Seed users present (checked after API boot; skip in preflight-only mode)
 // Handled by seed step below.

 // Print table
 console.log(c.bold("\n──────────────────────────────────────────────"));
 let fails = 0;
 for (const r of results) {
 const icon = r.ok? c.green(""): c.red("✘");
 const line = ` ${icon} ${r.name.padEnd(38)} ${c.dim(r.detail || "")}`;
 console.log(line);
 if (!r.ok) fails++;
 }
 console.log(c.bold("──────────────────────────────────────────────"));
 if (fails > 0) {
 console.log(c.red(` ✘ ${fails} preflight check(s) FAILED — demo is NOT ready\n`));
 process.exit(1);
 }
 console.log(c.green(" All preflight checks passed\n"));
 return true;
}

async function seedDemoUsers() {
 console.log(c.bold("Seeding demo users..."));
 const out = sh("node scripts/demo-seed.js", { timeout: 90000 });
 if (out === null) {
 console.log(c.red(" ✘ Seed failed (is Mongo up? is jobly-api/.env correct?)"));
 process.exit(1);
 }
 console.log(c.green("demo users ready: recruiter@demo.jobly / seeker@demo.jobly (DemoPass123!)"));
}

async function main() {
 const preflightOnly = process.argv.includes("--preflight-only");

 if (!preflightOnly) {
 // Boot infrastructure via compose (infra services only)
 console.log(c.bold("Starting infrastructure via docker compose (mongo, redis, minio, livekit, terminal-runner)..."));
 const up = sh(`docker compose up -d mongo redis minio livekit terminal-runner`, { timeout: 300000 });
 if (up === null) {
 console.log(c.red(" ✘ docker compose up failed. Is Docker Desktop running?"));
 process.exit(1);
 }
 console.log(c.dim("compose services requested; waiting for health..."));
 await new Promise((r) => setTimeout(r, 20000));
 }

 const ok = await preflight();
 if (!ok) process.exit(1);

 if (!preflightOnly) {
 await seedDemoUsers();

 console.log(c.bold("\n──────────────────────────────────────────────"));
 console.log(c.green(" DEMO READY"));
 console.log(c.bold("──────────────────────────────────────────────"));
 console.log(` Frontend: ${c.bold("http://localhost:8080")}`);
 console.log(` API: ${c.bold("http://localhost:5000")}`);
 console.log(` Recruiter: ${c.bold("recruiter@demo.jobly")} / DemoPass123!`);
 console.log(` Candidate: ${c.bold("seeker@demo.jobly")} / DemoPass123!`);
 console.log(c.dim("\n Start the app servers (new terminals):"));
 console.log(c.dim(" 1. cd jobly-api && npm run dev"));
 console.log(c.dim(" 2. cd jobly-web && npm run dev"));
 console.log(c.bold("──────────────────────────────────────────────\n"));
 }
}

main().catch((e) => {
 console.error(c.red("demo-up crashed: " + e.message));
 process.exit(1);
});
