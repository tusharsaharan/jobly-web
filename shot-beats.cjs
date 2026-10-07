/**
 * Screenshot harness for the intro section.
 *
 * Uses `parkAt` rather than `moveTo`, because `moveTo` snaps to whole steps and
 * the pass-through steps (1, 3 and 5) immediately advance away — so the only way
 * to photograph the middle of a transition is to park the camera there.
 *
 *   node shot-beats.cjs                 # all frames
 *   node shot-beats.cjs 6 6.5 7         # just these
 *   node shot-beats.cjs --port 8081 7   # when 8080 is taken
 */
const { chromium } = require("@playwright/test");
const fs = require("fs");

const ALL = [
  // chapters 1-2: hero -> triptych -> thesis
  -0.4, 0, 0.55, 1, 1.6, 2,
  // chapter 3: thesis -> mint -> the page types itself
  2.6, 3.05, 3.5, 3.72, 3.88, 4,
  // step 5: the clutter clears outward while the page grows and resolves
  4.3, 4.6, 4.9, 5.2, 5.45, 5.8,
  // step 6: the ATS title beat
  6,
  // step 7: the scan
  6.2, 6.35, 6.5, 6.65, 6.8, 6.95, 7,
  // step 8: the cap
  7.4, 7.7, 8,
];

(async () => {
  const argv = process.argv.slice(2);
  let port = 8080;
  const portAt = argv.indexOf("--port");
  if (portAt >= 0) {
    port = Number(argv[portAt + 1]);
    argv.splice(portAt, 2);
  }
  const beats = argv.length > 0 ? argv.map(Number) : ALL;

  const out = "C:/Users/tusha/AppData/Local/Temp/opencode/beats";
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  const problems = [];
  page.on("pageerror", (e) => {
    const m = `PAGEEX: ${String(e).slice(0, 500)}`;
    problems.push(m);
    console.log(m);
  });
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = `CONSOLE: ${m.text().slice(0, 300)}`;
      problems.push(t);
      console.log(t);
    }
  });

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForFunction(() => !!window.__joblyLanding, null, { timeout: 30000 });
  // let the preloader clear and the reveal settle
  await page.waitForFunction(() => Math.abs(window.__joblyLanding.getPos() - 0) < 0.02, null, {
    timeout: 30000,
  });
  await page.waitForTimeout(600);

  for (const b of beats) {
    await page.evaluate((s) => window.__joblyLanding.parkAt(s), b);
    // one rAF for the engine, plus a beat for transitions to land
    await page.waitForTimeout(260);
    const name = `beat-${String(b).replace("-", "m").replace(".", "_")}.png`;
    await page.screenshot({ path: `${out}/${name}` });
    const pos = await page.evaluate(() => window.__joblyLanding.getPos());
    console.log("shot", name.padEnd(18), "pos=", Number(pos).toFixed(3));
  }

  await browser.close();
  console.log("\nwrote", beats.length, "frames to", out);
  if (problems.length) {
    console.log(`\n!! ${problems.length} page problem(s) — see above`);
    process.exitCode = 1;
  }
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
