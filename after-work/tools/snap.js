// node tools/snap.js [--sheet name] t1 t2 ... | S05 S06 (mid of shot) | S05@1.2
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const args = process.argv.slice(2);
  const root = path.resolve(__dirname, '..');
  const outDir = path.join(root, 'out/snaps'); fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  const sheet = args[0] === '--sheet';
  await page.goto('file://' + path.join(root, sheet ? 'sheets.html' : 'film.html'));
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  const items = sheet ? args.slice(1) : args;
  for (const a of items) {
    const t0 = Date.now();
    const url = await page.evaluate(a => sheet_or_film(a), a);
    const buf = Buffer.from(url.split(',')[1], 'base64');
    const f = path.join(outDir, (sheet ? 'sheet_' : 'f_') + a.replace(/[^\w.@-]/g, '_') + '.png');
    fs.writeFileSync(f, buf); console.log(f, (Date.now() - t0) + 'ms');
  }
  await browser.close();
})();
