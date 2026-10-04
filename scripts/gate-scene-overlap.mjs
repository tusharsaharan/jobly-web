import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "package.json"));
const { chromium } = require("playwright");

const ORIGIN = process.argv[2] ?? "http://127.0.0.1:5199";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto(ORIGIN, { waitUntil: "networkidle" });
await page.waitForFunction(() => Boolean(window.__joblyLanding?.moveTo), undefined, { timeout: 30000 });
await page.waitForTimeout(600);

async function sceneOps() {
  return page.evaluate(() =>
    [...document.querySelectorAll(".landing-stage > section")].map((s) =>
      parseFloat(getComputedStyle(s).opacity),
    ),
  );
}

let fails = 0;
// At rest: exactly 1 scene > 0.5
for (let step = 0; step <= 11; step++) {
  await page.evaluate((s) => window.__joblyLanding.moveTo(s), step);
  await page.waitForTimeout(2400);
  const ops = await sceneOps();
  const vis = ops.filter((o) => o > 0.5).length;
  const ok = vis === 1 ? "OK  " : "FAIL";
  if (vis !== 1) fails++;
  console.log(`${ok} rest step ${String(step).padStart(2)}: visible=${vis} ops=[${ops.map((o) => o.toFixed(2)).join(" ")}]`);
}
// Mid-glide: at most 2 scenes > 0.25
for (let step = 0; step < 11; step++) {
  await page.evaluate((s) => window.__joblyLanding.moveTo(s), step);
  await page.waitForTimeout(2400);
  await page.evaluate((s) => window.__joblyLanding.moveTo(s + 1), step);
  await page.waitForTimeout(800);
  const ops = await sceneOps();
  const vis = ops.filter((o) => o > 0.25).length;
  const ok = vis <= 2 ? "OK  " : "FAIL";
  if (vis > 2) fails++;
  console.log(`${ok} glide ${step}→${step + 1}: visible>0.25=${vis} ops=[${ops.map((o) => o.toFixed(2)).join(" ")}]`);
}
console.log(fails === 0 ? "GATE PASS" : `GATE FAIL (${fails})`);
await browser.close();
process.exit(fails === 0 ? 0 : 1);
