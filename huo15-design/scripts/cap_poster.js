// 海报静态截图工具：node cap_poster.js <html> <out.png> <width> <height> [scale]
// 例：node cap_poster.js hhk_poster.html hhk_poster.png 1920 1080 2
const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const [html, out, w, h, scale] = process.argv.slice(2);
  const width = parseInt(w, 10), height = parseInt(h, 10);
  const deviceScaleFactor = scale ? parseFloat(scale) : 2;
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor });
  await page.goto('file://' + path.resolve(html), { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width, height } });
  await browser.close();
  console.log('saved', out, `${width}x${height}@${deviceScaleFactor}x`);
})().catch(e => { console.error(e); process.exit(1); });
