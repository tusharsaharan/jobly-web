/**
 * Throwaway: shoot the static fallback (`prefers-reduced-motion` / coarse
 * pointer / sub-1024px), which renders a completely different tree from the
 * canvas and so cannot be verified by `shot-beats.cjs`.
 *
 *   node shot-fallback.cjs            # narrow viewport only
 *   node shot-fallback.cjs reduce     # reduced-motion only, desktop width
 *   node shot-fallback.cjs both
 */
const { chromium } = require("@playwright/test");
const fs = require("fs");

(async () => {
  const mode = process.argv[2] ?? "narrow";
  const out = "C:/Users/tusha/AppData/Local/Temp/opencode/beats";
  fs.mkdirSync(out, { recursive: true });

  const narrow = mode === "narrow" || mode === "both";
  const reduce = mode === "reduce" || mode === "both";

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: narrow ? { width: 900, height: 1000 } : { width: 1600, height: 900 },
    ...(reduce ? { reducedMotion: "reduce" } : {}),
  });

  const problems = [];
  page.on("pageerror", (e) => problems.push(`PAGEEX: ${String(e).slice(0, 200)}`));
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`CONSOLE: ${m.text().slice(0, 200)}`);
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);

  const isFallback = await page.$(".landing-intro-fb");
  console.log(`mode=${mode}  fallback rendered: ${Boolean(isFallback)}`);

  if (isFallback) {
    await page.screenshot({ path: `${out}/fallback-${mode}-full.png`, fullPage: true });
    const ats = await page.$(".landing-fb-ats");
    if (ats) await ats.screenshot({ path: `${out}/fallback-${mode}-ats.png` });
    else console.log("!! .landing-fb-ats not found");
  }

  console.log(problems.length ? problems.join("\n") : "no page errors");
  await browser.close();
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
