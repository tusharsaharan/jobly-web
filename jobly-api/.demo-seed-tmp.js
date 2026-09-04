
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
