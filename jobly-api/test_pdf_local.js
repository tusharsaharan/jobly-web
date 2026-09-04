/* Debug: test makePdf output against pdf-parse directly */
const fs = require("fs");

function makePdf(lines) {
  const safe = lines.map((l) => l.replace(/[()\\]/g, ""));
  let content = "BT /F1 10 Tf 40 750 Td 14 TL\n";
  for (const line of safe) content += `(${line}) Tj T*\n`;
  content += "ET";

  const enc = (s) => Buffer.from(s, "latin1");
  let pdf = Buffer.from("%PDF-1.4\n", "latin1");
  const objStarts = [];
  const obj = (body) => {
    objStarts.push(pdf.length);
    const n = objStarts.length;
    pdf = Buffer.concat([pdf, enc(`${n} 0 obj\n${body}\nendobj\n`)]);
    return n;
  };

  const catalogNum = obj("<</Type/Catalog/Pages 2 0 R>>");
  const pagesNum = obj("<</Type/Pages/Kids[3 0 R]/Count 1>>");
  obj(`<</Type/Page/Parent ${pagesNum} 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>`);
  obj(`<</Length ${content.length}>>\nstream\n${content}\nendstream`);
  obj("<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>");

  const xrefPos = pdf.length;
  let xref = `xref\n0 ${objStarts.length + 1}\n0000000000 65535 f \n`;
  for (const off of objStarts) xref += String(off).padStart(10, "0") + " 00000 n \n";
  xref += `trailer\n<</Size ${objStarts.length + 1}/Root ${catalogNum} 0 R>>\nstartxref\n${xrefPos}\n%%EOF\n`;
  pdf = Buffer.concat([pdf, enc(xref)]);
  return pdf;
}

const lines = [
  "Ramesh Kumar - Floor Supervisor",
  "Skills: floor sweeping, mopping, floor buffing, chemical handling, restroom sanitation, team supervision",
  "Experience: Floor Supervisor, CleanCo Facilities, 2019 to Present",
  "Education: 10th Standard, Sarvodaya Vidyalaya",
  "CGPA: 7.2",
];

const pdf = makePdf(lines);
fs.writeFileSync("test-sweeper.pdf", pdf);
console.log("PDF size:", pdf.length, "magic:", pdf.slice(0, 5).toString());

const pdfParse = require("pdf-parse");
pdfParse(fs.readFileSync("test-sweeper.pdf"))
  .then((d) => {
    console.log("EXTRACTED (" + d.text.length + " chars):");
    console.log(JSON.stringify(d.text));
  })
  .catch((e) => console.log("PARSE ERR:", e.message));
