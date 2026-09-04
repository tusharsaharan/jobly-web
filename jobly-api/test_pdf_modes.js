const fs = require("fs");
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const PDFDocument = require("pdfkit");

const doc = new PDFDocument({ size: "A4", margin: 40 });
const chunks = [];
doc.on("data", (c) => chunks.push(c));
doc.on("end", async () => {
  const buf = Buffer.concat(chunks);
  console.log("bytes:", buf.length);

  // Attempt 1: Buffer (current worker behavior)
  try {
    const d = await pdfParse(buf);
    console.log("A1 Buffer: OK ->", JSON.stringify(d.text).slice(0, 80));
  } catch (e) { console.log("A1 Buffer ERR:", e.message); }

  // Attempt 2: Uint8Array
  try {
    const d = await pdfParse(new Uint8Array(buf));
    console.log("A2 Uint8Array: OK ->", JSON.stringify(d.text).slice(0, 80));
  } catch (e) { console.log("A2 Uint8Array ERR:", e.message); }

  // Attempt 3: pass { data } object
  try {
    const d = await pdfParse({ data: new Uint8Array(buf) });
    console.log("A3 obj: OK ->", JSON.stringify(d.text).slice(0, 80));
  } catch (e) { console.log("A3 obj ERR:", e.message); }

  // Attempt 4: newer pdf.js via different version option
  try {
    const d = await pdfParse(buf, { version: "v2.0.550" });
    console.log("A4 v2.0.550: OK ->", JSON.stringify(d.text).slice(0, 80));
  } catch (e) { console.log("A4 v2 ERR:", e.message); }

  process.exit(0);
});
doc.fontSize(10);
doc.text("Hello world test resume", { width: 500 });
doc.end();
