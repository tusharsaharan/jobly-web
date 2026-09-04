const PDFDocument = require("pdfkit");
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const doc = new PDFDocument({ size: "A4", margin: 40 });
const chunks = [];
doc.on("data", (c) => chunks.push(c));
doc.on("end", async () => {
  const buf = Buffer.concat(chunks);
  console.log("PDF bytes:", buf.length, "magic:", buf.slice(0, 5).toString());
  try {
    const d = await pdfParse(buf);
    console.log("PARSED OK (" + d.text.length + " chars):");
    console.log(JSON.stringify(d.text).slice(0, 300));
  } catch (e) {
    console.log("PARSE ERR:", e.message);
  }
  process.exit(0);
});
doc.fontSize(10);
doc.text("Ramesh Kumar - Floor Supervisor", { width: 500 });
doc.text("Skills: floor sweeping, mopping, floor buffing, chemical handling, restroom sanitation, team supervision", { width: 500 });
doc.text("Experience: Floor Supervisor, CleanCo Facilities, 2019 to Present", { width: 500 });
doc.text("Education: 10th Standard, Sarvodaya Vidyalaya", { width: 500 });
doc.text("CGPA: 7.2", { width: 500 });
doc.end();
