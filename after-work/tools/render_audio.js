// node tools/render_audio.js            -> audio/afterwork.wav (+ music.wav, sfx.wav, cues.json)
// node tools/render_audio.js --test laugh [--out dir]  -> renders a single instrument test
// All synthesis runs in headless Chromium (Web Audio OfflineAudioContext); see audio/*.js.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const args = process.argv.slice(2);
  const root = path.resolve(__dirname, '..');
  const audioDir = path.join(root, 'audio');
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--js-flags=--max-old-space-size=8192'],
  });
  const page = await browser.newPage();
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => { console.log('[pageerror]', e.message); process.exitCode = 1; });
  await page.goto('file://' + path.join(audioDir, 'render.html'));
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  const fetchOut = async (name, file) => {
    const total = await page.evaluate(n => window.outSize(n), name);
    const size = 3 * 1024 * 1024, parts = [];
    for (let i = 0; i * size < total; i++) parts.push(Buffer.from(await page.evaluate(([n, i, s]) => window.getChunk(n, i, s), [name, i, size]), 'base64'));
    fs.writeFileSync(file, Buffer.concat(parts));
    console.log('wrote', file, (total / 1e6).toFixed(1) + ' MB');
  };
  const t0 = Date.now();
  if (args[0] === '--test') {
    const outDir = args[2] === '--out' ? args[3] : audioDir;
    for (const name of args[1].split(',')) {
      const d = await page.evaluate(n => window.renderTest(n), name);
      await fetchOut('test_' + name, path.join(outDir, 'test_' + name + '.wav'));
      console.log(name, d.toFixed(2) + ' s');
    }
  } else {
    const info = await page.evaluate(() => window.renderAll());
    console.log('timing:', JSON.stringify(info.meta));
    console.log(`integrated loudness pre ${info.preLufs.toFixed(2)} LUFS, post ${info.postLufs.toFixed(2)} LUFS, master gain ${info.masterGainDb.toFixed(2)} dB, limiter active ${info.limitedSeconds.toFixed(2)} s`);
    await fetchOut('afterwork', path.join(audioDir, 'afterwork.wav'));
    await fetchOut('music', path.join(audioDir, 'music.wav'));
    await fetchOut('sfx', path.join(audioDir, 'sfx.wav'));
    fs.writeFileSync(path.join(audioDir, 'cues.json'), JSON.stringify({ filmDur: info.filmDur, lufs: info.postLufs, masterGainDb: info.masterGainDb, meta: info.meta, cues: info.cues, notes: info.notes }, null, 1));
    console.log('wrote cues.json with', info.cues.length, 'cues,', info.notes.length, 'notes');
  }
  console.log('done in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  await browser.close();
})();
