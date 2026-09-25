// node tools/render.js [--from S03] [--to S10] [--workers 4]
// Renders every drawing (12/s) of the film to frames/NNNNN.jpg
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const { SHOTS, FILM_DUR } = require(path.join(root, 'src/shots.js'));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('--workers', 4);
const from = arg('--from'), to = arg('--to');
const t0 = from ? SHOTS.find(s => s.id === from).start : 0, t1 = to ? SHOTS.find(s => s.id === to).end : FILM_DUR;
const frames = []; for (let i = Math.round(t0 * 12); i < Math.round(t1 * 12); i++) frames.push(i);
fs.mkdirSync(path.join(root, 'frames'), { recursive: true });
(async () => {
  const start = Date.now(); let done = 0;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files'] });
  await Promise.all([...Array(N)].map(async (_, k) => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.on('pageerror', e => console.log('[pageerror]', e.message));
    await page.goto('file://' + path.join(root, 'film.html'));
    await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
    for (let j = k; j < frames.length; j += N) {
      const i = frames[j];
      const url = await page.evaluate(t => frameJPEG(t, 0.93), (i + 0.001) / 12);
      fs.writeFileSync(path.join(root, 'frames', String(i).padStart(5, '0') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
      if (++done % 100 === 0) console.log(done + '/' + frames.length, ((Date.now() - start) / done).toFixed(0) + 'ms/frame');
    }
  }));
  await browser.close();
  console.log('rendered', frames.length, 'in', ((Date.now() - start) / 1000).toFixed(0) + 's');
})();
