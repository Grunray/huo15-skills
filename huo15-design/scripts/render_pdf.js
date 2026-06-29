// HTML → A4 PDF（通用）：node render_pdf.js <html> <out.pdf> [landscape|portrait] [npages]
//   landscape(默认) / portrait；npages>=2 时额外导出每页单独 PDF：<out>-p1.pdf ...
// 例：node render_pdf.js card_sheet.html card.pdf landscape 2
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');

(async () => {
  const [html, out, orient = 'landscape', npagesStr = '1'] = process.argv.slice(2);
  if (!html || !out) { console.error('用法: node render_pdf.js <html> <out.pdf> [landscape|portrait] [npages]'); process.exit(1); }
  const landscape = orient !== 'portrait';
  const npages = parseInt(npagesStr, 10) || 1;
  const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb'],
  });
  const p = await browser.newPage();
  await p.goto('file://' + path.resolve(html), { waitUntil: 'networkidle0', timeout: 30000 });
  await p.evaluate(async () => { await document.fonts.ready; });
  await new Promise(r => setTimeout(r, 400));

  const opts = { format: 'A4', landscape, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } };
  const dir = path.dirname(path.resolve(out));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.resolve(out), await p.pdf(opts));
  console.log('saved', out, `A4 ${landscape ? 'landscape' : 'portrait'}`);

  if (npages >= 2) {
    const base = out.replace(/\.pdf$/i, '');
    for (let i = 1; i <= npages; i++) {
      const f = `${base}-p${i}.pdf`;
      fs.writeFileSync(path.resolve(f), await p.pdf({ ...opts, pageRanges: String(i) }));
      console.log('saved', f);
    }
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
