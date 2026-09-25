// ---------------------------------------------------------------------------
// Film runtime: fonts, frame composition, transitions, square crop.
// ---------------------------------------------------------------------------
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const FONTS = [['Kalam', 'Kalam-Regular.ttf'], ['Caveat', 'Caveat.ttf'], ['CaveatBrush', 'CaveatBrush-Regular.ttf'],
  ['Reenie', 'ReenieBeanie.ttf'], ['Patrick', 'PatrickHand-Regular.ttf'], ['Cedarville', 'Cedarville-Cursive.ttf'],
  ['Gochi', 'GochiHand-Regular.ttf'], ['Amatic', 'AmaticSC-Bold.ttf']];
async function loadFonts() {
  for (const [n, f] of FONTS) { try { const ff = new FontFace(n, `url(fonts/${f})`); await ff.load(); document.fonts.add(ff); } catch (e) { console.log('font fail', n, e.message); } }
}
// per-frame
function renderAt(t, opt = {}) {
  TIME = t; BOIL = drawingIndex(t);
  const tq = q12(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const shot = opt.shot ? shotById(opt.shot) : shotAt(t);
  const lt = opt.shot ? t : tq - shot.start;
  const fn = SCENES[shot.id] || SCENES.MISSING;
  setRim(null);
  ctx.save(); fn(ctx, lt, shot); ctx.restore();
  setLight(null); setRim(null);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (!shot.noPaper) applyPaper(ctx, shot.paper || 1);
  return shot;
}
SCENES.MISSING = (ctx, t, shot) => {
  ctx.fillStyle = '#333'; ctx.fillRect(0, 0, W, H);
  letter(ctx, shot.id + '  ' + shot.name, W / 2, H / 2, { size: 60, color: '#ddd', align: 'center' });
};
window.sheet_or_film = (a) => {
  if (a.startsWith('TEST')) { TIME = 0; BOIL = 0; SCENES[a](ctx, 0); return cv.toDataURL('image/png'); }
  let t;
  if (/^S\d\d/.test(a)) { const [id, off] = a.split('@'); const s = shotById(id); t = off !== undefined ? s.start + parseFloat(off) : s.start + s.dur * 0.5; }
  else t = parseFloat(a);
  renderAt(t);
  return cv.toDataURL('image/png');
};
window.frameJPEG = (t, q = 0.95) => { renderAt(t); return cv.toDataURL('image/jpeg', q); };
(async () => {
  await loadFonts(); buildPaper();
  window.READY = true;
  const m = location.search.match(/t=([\d.]+)/);
  if (m) renderAt(parseFloat(m[1]));
})();
