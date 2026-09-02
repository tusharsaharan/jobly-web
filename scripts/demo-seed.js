#!/usr/bin/env node
/**
 * Seed the two fixed demo accounts (idempotent — updates passwords/roles).
 *   node scripts/demo-seed.js
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const API_DIR = path.join(ROOT, "jobly-api");

// Minimal .env loader (no external deps)
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

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI missing in jobly-api/.env");
  process.exit(1);
}

const seedScript = `
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");
(async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  const ensure = async (name, email, password, role) => {
    const hashed = await bcrypt.hash(password, 10);
    const existing = await User.findOne({ email });
    if (existing) {
      await User.findByIdAndUpdate(existing._id, { name, password: hashed, role });
      console.log("updated: " + email);
    } else {
      await User.create({ name, email, password: hashed, role });
      console.log("created: " + email);
    }
  };
  await ensure("Demo Recruiter", "recruiter@demo.jobly", "DemoPass123!", "recruiter");
  await ensure("Demo Candidate", "seeker@demo.jobly", "DemoPass123!", "seeker");
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
`;

fs.writeFileSync(path.join(API_DIR, ".demo-seed-tmp.js"), seedScript);
try {
  execSync("node .demo-seed-tmp.js", { cwd: API_DIR, stdio: "inherit", timeout: 60000 });
  process.exit(0);
} catch {
  process.exit(1);
} finally {
  fs.unlinkSync(path.join(API_DIR, ".demo-seed-tmp.js"));
}
