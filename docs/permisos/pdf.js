// Pasa el HTML de generar.py a PDF con Chromium (Playwright). Uso: node docs/permisos/pdf.js <entrada.html> <salida.pdf>
const { chromium } = require(process.env.PLAYWRIGHT || "playwright");
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const p = await b.newPage();
  await p.goto("file://" + require("path").resolve(process.argv[2]), { waitUntil: "load" });
  await p.pdf({
    path: process.argv[3], format: "A4", printBackground: true, displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#888">SampCity · Permisos y comandos · <span class="pageNumber"></span>/<span class="totalPages"></span></div>',
    margin: { top: "14mm", bottom: "16mm", left: "12mm", right: "12mm" },
  });
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
