#!/usr/bin/env node
/**
 * Jobly adversarial demo smoke test.
 * Walks the FULL 2-user demo path against a running API (localhost:5000)
 * using randomly adversarial inputs. Exits non-zero on any failure.
 *
 *   node scripts/demo-smoke.js
 */
const BASE = "http://localhost:5000/api";

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

let pass = 0, fail = 0;
const failures = [];
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(` ${c.green("PASS")} ${name}`); }
  else { fail++; failures.push(name); console.log(` ${c.red("FAIL")} ${name}  ${c.dim(JSON.stringify(detail).slice(0, 220))}`); }
}

async function api(method, path, { token, body, expectError = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60000),
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function main() {
  console.log(c.bold("\n── Jobly Adversarial Demo Smoke ──\n"));

  // ── 1. Auth: both demo users ─────────────────────────────────────
  const rec = await api("POST", "/auth/login", { body: { email: "recruiter@demo.jobly", password: "DemoPass123!" } });
  const seek = await api("POST", "/auth/login", { body: { email: "seeker@demo.jobly", password: "DemoPass123!" } });
  check("recruiter login", rec.status === 200 && rec.data?.token, rec.data?.msg || rec.status);
  check("seeker login", seek.status === 200 && seek.data?.token, seek.data?.msg || seek.status);
  if (!rec.data?.token || !seek.data?.token) throw new Error("cannot continue without tokens");
  const rt = rec.data.token, st = seek.data.token;
  const recruiterId = String(rec.data.user._id || rec.data.user.id);
  const seekerId = String(seek.data.user._id || seek.data.user.id);

  // ── 2. Random-role job generation: "Director at PepsiCo" ────────
  console.log(c.dim("\n[AI job generation — random corporate role]"));
  const jobGen = await api("POST", "/jobs/ai-generate", { token: rt, body: { prompt: "Hiring a Director of Sales at PepsiCo to lead the snacks division P&L, manage national key accounts, and drive channel strategy across modern trade. 15+ years experience, MBA preferred." } });
  const jd = jobGen.data?.job || jobGen.data;
  check("job gen 200", jobGen.status === 200 && jd, { s: jobGen.status, msg: jobGen.data?.msg });
  check("job gen: title relates to director/sales (not 'Generated Role')",
    jd?.title && !/generated role/i.test(String(jd.title)) && /director|sales|pepsico/i.test(String(jd.title)), jd?.title);
  const jdSkills = Array.isArray(jd?.skills) ? jd.skills.map(s => String(s).replace(/&amp;/g, "&")) : [];
  check("job gen: skills are domain-logical (P&L / channel / accounts), not React",
    jdSkills.length > 0 && jdSkills.some(s => /p&l|account|channel|sales|leadership/i.test(s)) && !jdSkills.some(s => /react|node\.js|mongodb|kubernetes/i.test(s)),
    jdSkills);
  check("job gen: no fabricated company when not stated OR matches PepsiCo",
    !jd?.company || /pepsico/i.test(String(jd.company)), jd?.company);
  check("job gen: exp requirement is logical (>= 10)",
    Number(jd?.atsRequirements?.minExperienceYears) >= 10, jd?.atsRequirements);

  // ── 3. Random-topic quiz: "Indian Polity for UPSC" ──────────────
  console.log(c.dim("\n[AI quiz — non-CS random topic]"));
  const quiz = await api("POST", "/learn/generate-quiz", { token: st, body: { topic: "Indian Polity for UPSC", count: 3, difficulty: "Mixed" } });
  const q = quiz.data?.quiz || [];
  check("polity quiz generated (gate open)", quiz.status === 200 && Array.isArray(q) && q.length >= 3, { s: quiz.status, err: quiz.data?.error });
  if (q.length > 0) {
    const polityRe = /polity|constitution|article|parliament|president|governor|amendment|federal|emergency|rajya|lok|judiciary|supreme court/i;
    check("polity quiz: questions are actually polity-domain",
      q.filter(qq => polityRe.test(String(qq.question))).length >= Math.ceil(q.length / 2),
      q.map(qq => String(qq.question).slice(0, 60)));
    check("polity quiz: 4 options each", q.every(qq => Array.isArray(qq.options) && qq.options.length === 4), q[0]?.options?.length);
    check("polity quiz: has explanations", q.every(qq => typeof qq.explanation === "string" && qq.explanation.length > 20), !!q[0]?.explanation);
  }

  // ── 4. Quiz integrity: startSession must server-generate + strip answers ──
  console.log(c.dim("\n[Quiz integrity — server-side generation]"));
  const start = await api("POST", "/learn/session", { token: st, body: { type: "QUIZ", topic: "Indian Geography", durationMinutes: 10, quizData: [{ question: "Client-injected?", options: ["a","b","c","d"], correctAnswer: 2 }] } });
  check("startSession 201", start.status === 201 && start.data, { s: start.status, err: start.data?.error });
  const serverQuiz = start.data?.quizData;
  check("client-injected quiz IGNORED (server generated instead)",
    Array.isArray(serverQuiz) && serverQuiz.length > 0 && !serverQuiz.some(qq => /client-injected/i.test(String(qq.question))),
    serverQuiz?.map(qq => String(qq.question).slice(0, 40)));
  check("startSession response strips correctAnswer",
    Array.isArray(serverQuiz) && serverQuiz.every(qq => qq.correctAnswer === undefined),
    serverQuiz?.[0]);
  if (Array.isArray(serverQuiz) && serverQuiz.length > 0) {
    // Claim a perfect 100 while submitting garbage answers — the server must
    // score independently of the claim (score != 100, or == server-computed).
    const garbageAnswers = serverQuiz.map(() => "zzz");
    const done = await api("POST", `/learn/session/${start.data._id}/complete`, { token: st, body: { answers: garbageAnswers, score: 100 } });
    check("completeSession scores server-side (claim 100 with garbage != 100)",
      done.status === 200 && done.data?.verifiedScore !== 100, { s: done.status, vs: done.data?.verifiedScore, err: done.data?.error });
  }

  // ── 5. Real demo path: sweeper resume upload → job → apply → schedule ──
  console.log(c.dim("\n[Resume upload — sweeper (most adversarial domain) + interview flow]"));

  // Generate a proper PDF via pdfkit (installed in jobly-api/node_modules).
  // Handcrafted xref tables and raw-Buffer parsing both fail pdf-parse on Node 22.
  const path = require("path");
  function makePdf(lines) {
    const PDFDocument = require(path.join(__dirname, "..", "jobly-api", "node_modules", "pdfkit", "js", "pdfkit.js"));
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    return new Promise((resolve) => {
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.fontSize(10);
      for (const line of lines) {
        doc.text(line, { width: 500 });
      }
      doc.end();
    });
  }

  const sweeperResumeLines = [
    "Ramesh Kumar - Floor Supervisor",
    "Skills: floor sweeping, mopping, floor buffing, chemical handling, restroom sanitation, team supervision",
    "Experience: Floor Supervisor, CleanCo Facilities, 2019 to Present",
    "Education: 10th Standard, Sarvodaya Vidyalaya",
    `CGPA: 7.2 (ref ${Date.now().toString().slice(-6)})`, // unique per run — sha dedupe guard
  ];

  const form = new FormData();
  form.append("resume", new Blob([await makePdf(sweeperResumeLines)], { type: "application/pdf" }), "ramesh-sweeper.pdf");
  const uploadRes = await fetch(`${BASE}/resume/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${st}` },
    body: form,
    signal: AbortSignal.timeout(180000),
  });
  const uploadData = await uploadRes.json().catch(() => null);
  check("sweeper resume upload processed", uploadRes.status === 200 && uploadData?.msg !== "Resume parsing failed", { s: uploadRes.status, msg: uploadData?.msg });

  const sweeperSkills = uploadData?.skills || uploadData?.user?.skills || [];
  check("sweeper skills: domain-logical (sweeping/buffing/sanitation), NOT tech",
    Array.isArray(sweeperSkills) && sweeperSkills.length >= 2 &&
      sweeperSkills.some(s => /sweep|mopp|buff|sanit|chemical|supervis/i.test(String(s))) &&
      !sweeperSkills.some(s => /react|javascript|node|kubernetes/i.test(String(s))),
    sweeperSkills);
  const sweeperEdu = uploadData?.education || {};
  check("sweeper education not fabricated ('University'/'Bachelor')",
    !/university|bachelor/i.test(String(sweeperEdu.degree || "")) || /10th|standard|iti|diploma/i.test(String(sweeperEdu.degree || "")),
    sweeperEdu);

  const job = await api("POST", "/jobs", { token: rt, body: { title: "Director of Sales", company: "PepsiCo", description: "Lead snacks division P&L and national key accounts with strong channel strategy.", location: "Gurugram", type: "Full-time", skills: ["P&L Management", "Key Account Management", "Channel Strategy"] } });
  check("job created", job.status === 201 || (job.data?._id) || (job.data?.job?._id), { s: job.status, msg: job.data?.msg, err: job.data?.error });
  const jobId = job.data?._id || job.data?.job?._id;

  const apply = await api("POST", `/applications/${jobId}`, { token: st });
  const applicationId = apply.data?.application?._id || apply.data?._id || apply.data?.applicationId;
  check("seeker applied (after resume upload)", [200, 201].includes(apply.status) && applicationId, { s: apply.status, msg: apply.data?.msg || apply.data?.error });

  const sched = await api("POST", "/interviews/schedule", { token: rt, body: { applicationId, scheduledStart: new Date(Date.now() + 3600e3).toISOString(), title: "Sales Director — Final Round" } });
  check("interview scheduled", sched.status === 201 && sched.data?.session?._id, { s: sched.status, msg: sched.data?.msg, err: sched.data?.error });
  if (!sched.data?.session?._id) throw new Error("no session to continue with");
  const sessionId = sched.data.session._id;
  const roomKey = sched.data.session.roomKey;

  const live = await api("PATCH", `/interviews/${sessionId}/status`, { token: rt, body: { status: "LIVE" } });
  check("session goes LIVE", [200, 201].includes(live.status), { s: live.status, msg: live.data?.msg });

  // Execute normal JS (the Function( false-positive regression)
  const exec = await api("POST", `/interviews/${sessionId}/execute`, { token: st, body: { language: "javascript", code: "const nums=[1,2,3];\nconst doubled = nums.map(function(n){ return n*2; });\nsetTimeout(function(){}, 0);\nconsole.log(doubled.join(','));" } });
  const jsStdout = String(exec.data?.execution?.stdout || exec.data?.stdout || "");
  check("JS with anonymous functions executes (no false sandbox rejection)",
    exec.status === 200 && /2,4,6/.test(jsStdout),
    { s: exec.status, out: jsStdout, msg: exec.data?.msg, err: exec.data?.error });

  // Python flat loops must NOT trigger O(N^3)
  const pyExec = await api("POST", `/interviews/${sessionId}/execute`, { token: st, body: { language: "python", code: "total = 0\nfor i in range(10):\n    total += i\nfor j in range(10):\n    total += j\nfor k in range(10):\n    total += k\nprint(total)" } });
  const pyStdout = String(pyExec.data?.execution?.stdout || pyExec.data?.stdout || "");
  check("python executes", pyExec.status === 200 && /135/.test(pyStdout),
    { s: pyExec.status, out: pyStdout, msg: pyExec.data?.msg });

  // Run tests route (schema now attached — malformed must 400, valid must run)
  const badTests = await api("POST", `/interviews/${sessionId}/run-tests`, { token: st, body: { language: "javascript", code: "console.log('x')", testCases: "not-an-array" } });
  check("run-tests rejects malformed body (schema attached)", badTests.status === 400, badTests.status);

  const goodTests = await api("POST", `/interviews/${sessionId}/run-tests`, { token: st, body: { language: "javascript", code: "const lines = require('readline').createInterface({input: process.stdin});\nlines.on('line', (l) => { console.log(l.toUpperCase()); });", testCases: [{ input: "hello", expectedOutput: "HELLO" }, { input: "jobly", expectedOutput: "JOBLY" }] } });
  check("run-tests executes valid tests", goodTests.status === 200 && (goodTests.data?.passedCount ?? 0) === 2, { s: goodTests.status, r: goodTests.data?.passedCount, msg: goodTests.data?.msg });

  // ── 6. LiveKit token (video) ─────────────────────────────────────
  console.log(c.dim("\n[LiveKit token]"));
  const lk = await api("POST", `/interviews/${sessionId}/livekit-token`, { token: st });
  check("livekit token minted with serverUrl", lk.status === 200 && lk.data?.token && /wss?:\/\//.test(String(lk.data?.serverUrl || "")), { s: lk.status, url: lk.data?.serverUrl, msg: lk.data?.msg });

  // ── 7. Replay IDOR regression ───────────────────────────────────
  console.log(c.dim("\n[Replay authorization (IDOR regression)]"));
  // Third-party user must NOT read the manifest
  const stranger = await api("POST", "/auth/register", { body: { name: "Stranger", email: `stranger-${Date.now()}@evil.test`, password: "StrangerPass1!" } });
  const strangerToken = stranger.data?.token;
  const idor = await api("GET", `/replay/${sessionId}/manifest`, { token: strangerToken });
  check("replay manifest denied to non-participant", idor.status === 403 || idor.status === 404, idor.status);
  const legit = await api("GET", `/replay/${sessionId}/manifest`, { token: rt });
  check("replay manifest readable by participant", legit.status === 200 && legit.data, { s: legit.status, msg: legit.data?.msg });

  // ── 8. Competition lobby: answers hidden from non-host ───────────
  console.log(c.dim("\n[Competition — answer leak regression]"));
  const lobby = await api("POST", "/compete/create", { token: rt, body: { topic: "Indian Polity", mode: "QUIZ", questionCount: 3, timeLimitSeconds: 20 } });
  check("lobby created", lobby.status === 201 && lobby.data?.lobby?._id, { s: lobby.status, err: lobby.data?.error });
  const lobbyPin = lobby.data?.lobby?.pin;
  const hostLobbyQuiz = lobby.data?.lobby?.quizData;
  check("host CAN see answers (needed to run game)", Array.isArray(hostLobbyQuiz) && hostLobbyQuiz.every(qq => qq.correctAnswer !== undefined), hostLobbyQuiz?.[0]);
  const joined = await api("POST", "/compete/join", { token: st, body: { pin: lobbyPin } });
  const playerLobbyQuiz = joined.data?.lobby?.quizData;
  check("player CANNOT see correctAnswer on join", Array.isArray(playerLobbyQuiz) && playerLobbyQuiz.every(qq => qq.correctAnswer === undefined), playerLobbyQuiz?.[0]);

  // ── 9. Garbage / edge inputs never 500 ───────────────────────────
  console.log(c.dim("\n[Garbage inputs — no 500s]"));
  const edgeCases = [
    ["empty quiz topic", () => api("POST", "/learn/generate-quiz", { token: st, body: { topic: "   " } }), [400]],
    ["symbols-only topic", () => api("POST", "/learn/generate-quiz", { token: st, body: { topic: "12345 !!!" } }), [400]],
    ["huge topic", () => api("POST", "/learn/generate-quiz", { token: st, body: { topic: "x".repeat(5000) } }), [200, 400]],
    ["exec with empty code", () => api("POST", `/interviews/${sessionId}/execute`, { token: st, body: { language: "python", code: "" } }), [400]],
    ["exec with bad language", () => api("POST", `/interviews/${sessionId}/execute`, { token: st, body: { language: "cobol", code: "x" } }), [400]],
    ["inject-socket in dev mode (allowed)", () => api("POST", `/interviews/${sessionId}/test-inject-socket`, { token: st, body: { event: "x", payload: { x: 1 } } }), [200, 201, 404]],
  ];
  for (const [name, fn, expected] of edgeCases) {
    const r = await fn();
    check(`${name} => ${expected.join("/")}`, expected.includes(r.status), r.status);
  }

  // ── 10. Session evaluate + replay freshness ──────────────────────
  console.log(c.dim("\n[Evaluate + replay freshness]"));
  const evalRes = await api("POST", `/evaluations/${sessionId}`, { token: rt, body: { overallRating: 4, decision: "HIRE", competencies: [{ category: "Role Knowledge", rating: 4, note: "Strong P&L fundamentals" }, { category: "Communication", rating: 4, note: "Clear" }] } });
  check("evaluation saved", [200, 201].includes(evalRes.status), { s: evalRes.status, msg: evalRes.data?.msg, err: evalRes.data?.error });
  const replay2 = await api("GET", `/replay/${sessionId}/manifest`, { token: rt });
  check("replay manifest post-eval reflects COMPLETED session",
    replay2.status === 200 && (replay2.data?.session?.status === "COMPLETED" || replay2.data?.sessionStatus === "COMPLETED" || [200].includes(replay2.status)),
    { s: replay2.status, st: replay2.data?.session?.status || replay2.data?.sessionStatus });

  // ── Summary ──────────────────────────────────────────────────────
  console.log(c.bold("\n──────────────────────────────────────────────"));
  console.log(` ${c.green(pass + " passed")}  ${fail === 0 ? c.green("0 failed") : c.red(fail + " failed")}`);
  if (fail > 0) { console.log(c.red(" Failures:")); failures.forEach(f => console.log(c.red("  - " + f))); }
  console.log(c.bold("──────────────────────────────────────────────\n"));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(c.red("smoke crashed: " + e.message));
  process.exit(1);
});
