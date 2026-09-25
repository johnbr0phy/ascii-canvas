// ---------------------------------------------------------------------------
// Model sheets, drawn by the same production functions as the film.
// ---------------------------------------------------------------------------
const SHEETS = {};
function sheetCanvas(w, h) { const c = mkCanvas(w, h); return { c, x: c.getContext('2d'), w, h }; }
function sheetPaper(S, col = '#f2ead8') {
  S.x.fillStyle = col; S.x.fillRect(0, 0, S.w, S.h);
}
function sheetFinish(S) {
  const x = S.x; x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.45;
  for (let yy = 0; yy < S.h; yy += H) for (let xx = 0; xx < S.w; xx += W) x.drawImage(PAPER, xx, yy); x.restore();
}
function title(S, text, sub) {
  letter(S.x, text, 80, 110, { size: 84, font: 'CaveatBrush', color: '#2a1c14', seed: 1 });
  if (sub) letter(S.x, sub, 84, 160, { size: 34, font: 'Patrick', color: '#6a5a4a', seed: 2 });
}
function label(S, text, x, y, size = 30, col = '#5a4a3a', align = 'center') { letter(S.x, text, x, y, { size, font: 'Patrick', color: col, align, seed: text.length }); }
function panel(S, x, y, w, h, col) { S.x.save(); S.x.fillStyle = col; S.x.fillRect(x, y, w, h); S.x.strokeStyle = 'rgba(60,40,30,0.5)'; S.x.lineWidth = 2; S.x.strokeRect(x, y, w, h); S.x.restore(); }
function crossOut(S, x, y, w, h) {
  line(S.x, path().m(x + 10, y + 10).l(x + w - 10, y + h - 10), { color: '#c0392b', lw: 9, seed: x });
  line(S.x, path().m(x + w - 10, y + 10).l(x + 10, y + h - 10), { color: '#c0392b', lw: 9, seed: y });
}

SHEETS.style = () => {
  const S = sheetCanvas(3840, 2400); sheetPaper(S); const x = S.x;
  TIME = 0; BOIL = 0; setLight(LIGHTS.neutral); setLightDir(-0.6, -0.8);
  title(S, 'After Work: house style', 'Night-shift picture book. Lined cels over unlined watercolour. Drawings on twos (12 a second). One hard shadow. Paper under everything.');
  // --- palettes per chapter
  label(S, 'COLOUR ARC, CHAPTER BY CHAPTER', 80, 250, 36, '#2a1c14', 'left');
  Object.entries(PAL).forEach(([k, p], i) => {
    const y = 290 + i * 88; label(S, p.name, 80, y + 50, 28, '#3a2a1a', 'left');
    p.swatches.forEach((c, j) => { paint(x, rectPts(700 + j * 110, y, 100, 70), c, { seed: i * 10 + j, edge: 0.3 }); });
  });
  // --- line weights + boil
  const lx = 1600; label(S, 'LINE', lx, 250, 36, '#2a1c14', 'left');
  [[5, 'silhouette / close-ups'], [3.2, 'character outline'], [1.8, 'interior: folds, lids, strands'], [0.9, 'detail: creases, age lines']].forEach(([w, n], i) => {
    line(x, path().m(lx, 320 + i * 70).q(lx + 180, 290 + i * 70, lx + 380, 320 + i * 70), { lw: w, seed: 50 + i, color: '#2a1c14' });
    label(S, w + 'px  ' + n, lx + 420, 330 + i * 70, 26, '#5a4a3a', 'left');
  });
  label(S, 'the boil: one line, three drawings', lx, 640, 26, '#5a4a3a', 'left');
  for (let b = 0; b < 3; b++) { BOIL = b; line(x, path().m(lx + b * 260, 720).c(lx + 60 + b * 260, 660, lx + 160 + b * 260, 780, lx + 220 + b * 260, 700), { lw: 3.4, seed: 60, color: '#2a1c14' }); }
  BOIL = 0;
  // --- shadows
  const sx = 2700; label(S, 'SHADOW: ONE HARD CEL, AWAY FROM THE KEY', sx, 250, 32, '#2a1c14', 'left');
  setLightDir(-0.6, -0.8);
  cel(x, path().ellipse(sx + 150, 450, 120, 120), { fill: '#d9a06a', shade: shadeBy(34), lw: 3.4, seed: 70 });
  cel(x, path().rect(sx + 360, 330, 160, 240), { fill: '#6a8aa0', shade: shadeBy(30), lw: 3.4, seed: 71 });
  drawHead(x, { x: sx + 760, y: 450, s: 2.1, view: '3q', cs: charSpec('nell', 49), e: 'neutral' });
  label(S, 'key upper-left by default; each scene sets its own', sx, 640, 26, '#5a4a3a', 'left');
  label(S, 'night: add a warm rim on the lit edge', sx, 680, 26, '#5a4a3a', 'left');
  // --- eyes
  const ey = 1150; label(S, 'EYES: ALMOND, THICK UPPER LID, ONE HIGHLIGHT. AGE BY ADDING, NEVER RE-DRAWING', 1600, ey - 350, 32, '#2a1c14', 'left');
  [['nell', 49, 'neutral', 'Nell 49'], ['nell', 49, 'tired', 'exhausted'], ['nell', 49, 'wonder', 'sees Saturn'], ['nell', 58, 'smile', 'Nell 58'], ['nell', 69, 'soft', 'Nell 69']].forEach(([w, a, e, n], i) => {
    const cx = 1700 + i * 420, cy = ey - 60;
    x.save(); x.beginPath(); x.rect(cx - 190, cy - 230, 380, 300); x.clip();
    drawHead(x, { x: cx + 40, y: cy - 100, s: 5.2, view: 'front', cs: charSpec(w, a), e });
    x.restore(); x.strokeStyle = 'rgba(60,40,30,0.4)'; x.strokeRect(cx - 190, cy - 230, 380, 300);
    label(S, n, cx, cy + 110, 28);
  });
  // --- background studies
  const by = 1320; label(S, 'BACKGROUND STUDIES', 80, by, 36, '#2a1c14', 'left');
  const studies = [['S03', 'the warehouse at 3am'], ['S14', 'the street in winter'], ['S28', 'the rooftop at golden hour'], ['S32', 'the back step under the stars']];
  studies.forEach(([id, n], i) => {
    const sh = shotById(id); renderAt(sh.start + sh.dur * 0.55);
    const bx = 80 + i * 930; x.drawImage(cv, bx, by + 30, 900, 506); x.strokeStyle = '#3a2a1a'; x.lineWidth = 3; x.strokeRect(bx, by + 30, 900, 506);
    label(S, n, bx + 450, by + 580, 30);
  });
  // --- do not
  const dy = 1960; label(S, 'DO NOT', 80, dy, 44, '#c0392b', 'left');
  const dn = [['a chrome robot', (X, Y) => { cel(x, path().rect(X + 120, Y + 30, 180, 180), { fill: '#c8ccd4', shade: shadeBy(20), lw: 3, raw: true, seed: 90 }); [X + 170, X + 250].forEach((ex, k) => { x.fillStyle = '#40a0ff'; x.beginPath(); x.arc(ex, Y + 100, 16, 0, TAU); x.fill(); }); cel(x, path().rect(X + 170, Y + 160, 80, 14), { fill: '#666', lw: 2, raw: true, seed: 91 }); }],
    ['a glowing blue brain', (X, Y) => { glow(x, X + 210, Y + 120, 140, '#3a8aff', 0.8, 'source-over'); cel(x, path().cr([[X + 110, Y + 140], [X + 120, Y + 60], [X + 210, Y + 30], [X + 300, Y + 70], [X + 310, Y + 150], [X + 210, Y + 190]], true), { fill: '#8ac0ff', lw: 3, raw: true, seed: 92 }); }],
    ['code on a screen', (X, Y) => { cel(x, path().rect(X + 90, Y + 30, 240, 170), { fill: '#141820', lw: 3, raw: true, seed: 93 }); for (let k = 0; k < 7; k++) { x.fillStyle = ['#6aff8a', '#40a0ff', '#ffcf40'][k % 3]; x.fillRect(X + 110 + (k % 3) * 12, Y + 50 + k * 20, 60 + (k * 37) % 120, 8); } }],
    ['gleaming towers', (X, Y) => { [[120, 60], [180, 20], [250, 80], [300, 40]].forEach(([dx, dy2], k) => cel(x, path().rect(X + dx, Y + dy2, 50, 200 - dy2), { fill: '#a8d8f0', shade: [6, 0], lw: 3, raw: true, seed: 94 + k })); }],
    ['glossy 3D render, lens flare', (X, Y) => { const g = x.createRadialGradient(X + 180, Y + 90, 10, X + 210, Y + 120, 110); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#ff9a9a'); g.addColorStop(1, '#6a1a2a'); x.fillStyle = g; x.beginPath(); x.arc(X + 210, Y + 120, 100, 0, TAU); x.fill(); glow(x, X + 330, Y + 40, 60, '#ffffff', 0.9, 'source-over'); }],
    ['a face on the AI', (X, Y) => { glow(x, X + 210, Y + 120, 100, '#ffb040', 0.7, 'source-over'); x.fillStyle = '#2a1c14'; x.beginPath(); x.arc(X + 185, Y + 105, 9, 0, TAU); x.arc(X + 235, Y + 105, 9, 0, TAU); x.fill(); line(x, path().m(X + 180, Y + 140).q(X + 210, Y + 165, X + 240, Y + 140), { lw: 5, seed: 99 }); }],
  ];
  dn.forEach(([n, fn], i) => { const X = 80 + i * 620, Y = dy + 30; panel(S, X, Y, 420, 230, '#efe6d2'); fn(X, Y); crossOut(S, X, Y, 420, 230); label(S, n, X + 210, Y + 280, 30, '#8a2a1a'); });
  label(S, 'The AI is only ever a small warm light and a book that fills with drawings. Never a face, a voice or a screen.', 2600, dy + 380, 26, '#5a4a3a', 'left');
  sheetFinish(S); return S.c;
};

function turnRow(S, who, age, y, sc, outfit, extra = {}) {
  const views = ['front', '3q', 'side', 'back'];
  views.forEach((v, i) => {
    const x0 = 260 + i * 420;
    figure(S.x, Object.assign({ who, age, x: x0, y, s: sc, view: v, outfit, e: 'neutral', f: 1 }, extra));
    label(S, v === '3q' ? 'three-quarter' : v, x0, y + 60, 28);
  });
}
SHEETS.nell = () => {
  const S = sheetCanvas(3840, 2400); sheetPaper(S); const x = S.x;
  TIME = 0; BOIL = 0; setLight(LIGHTS.neutral); setLightDir(-0.6, -0.8);
  title(S, 'Nell Hollis: 49 / 58 / 69', 'One model. Age is a parameter. Same eye spacing, same nose, side parting on her right, low bun, a mole under her left eye.');
  [[49, 'work', 'forties (2027): night shift'], [58, 'gold', 'fifties (2036): teaching'], [69, 'old', 'seventies-ish (2047)']].forEach(([a, o, n], r) => {
    const y = 820 + r * 720;
    turnRow(S, 'nell', a, y, 0.95, o);
    label(S, n, 1900, y - 560, 34, '#2a1c14', 'left');
    // heads at this age: front / 3q / profile
    ['front', '3q', 'profile'].forEach((v, i) => drawHead(x, { x: 2100 + i * 520, y: y - 300, s: 2.6, view: v, cs: charSpec('nell', a), e: 'neutral' }));
  });
  sheetFinish(S); return S.c;
};
SHEETS.nellExpr = () => {
  const S = sheetCanvas(3840, 2160); sheetPaper(S); const x = S.x;
  TIME = 0; BOIL = 0; setLight(LIGHTS.neutral); setLightDir(-0.6, -0.8);
  title(S, 'Nell: expressions and poses', 'Close-up heads at 49. Bottom row: the poses the film asks of her.');
  const ex = [['neutral', 'neutral'], [{ name: 'tired', blink: 0.4 }, 'exhausted (3am)'], ['worry', 'the letter'], ['focus', 'learning'], [{ name: 'wonder', tear: 1 }, 'sees Saturn'], ['joy', 'the promise kept']];
  ex.forEach(([e, n], i) => { const cx = 330 + i * 590; drawHead(x, { x: cx, y: 520, s: 3.4, view: '3q', cs: charSpec('nell', 49), e }); label(S, n, cx, 780, 32); });
  const poses = [
    ['scanning parcels', { outfit: 'work', view: 'side', pose: scanPose(0.25) }],
    ['walking the line', { outfit: 'work', view: 'side', pose: { lN: [0.4, 0.1], lF: [-0.4, 0.5], aN: [-0.35, 0.3], aF: [0.35, 0.3] } }],
    ['exhausted, coat on', { outfit: 'coat', view: '3q', e: { name: 'tired', blink: 0.6 }, pose: { lean: 0.2, neck: 0.4, aN: [0.1, 0.3] } }],
    ['pointing up', { outfit: 'gold', view: 'side', e: 'smile', pose: { aN: [2.7, 0.1], neck: -0.35 } }],
    ['reaching for the cupboard', { outfit: 'winterIn', f: -1, view: '3q', fill: { top: '#6a5a7a' }, pose: { aN: [1.2, 0.3] } }],
    ['at seventy, watching', { outfit: 'old', age: 69, view: '3q', e: 'smile', pose: { neck: -0.2 } }],
  ];
  poses.forEach(([n, o], i) => { const cx = 330 + i * 590; figure(x, Object.assign({ who: 'nell', age: 49, x: cx, y: 1900, s: 0.95, f: 1, e: 'neutral' }, o)); label(S, n, cx, 1960, 30); });
  sheetFinish(S); return S.c;
};
SHEETS.family = () => {
  const S = sheetCanvas(3840, 2160); sheetPaper(S); const x = S.x;
  TIME = 0; BOIL = 0; setLight(LIGHTS.neutral); setLightDir(-0.6, -0.8);
  title(S, 'Sam at 9 / 17 / 29, his daughter, and Arthur', 'Sam: auburn curls, big ears, his mother\'s eyes. Arthur exists only in memory (sepia).');
  [[9, 'school', '9 (2027)'], [17, 'home', '17 (2035)'], [29, 'home', '29 (2047)']].forEach(([a, o, n], i) => {
    ['front', '3q', 'side'].forEach((v, j) => figure(x, { who: 'sam', age: a, x: 180 + i * 700 + j * 200, y: 1100, s: 0.95, view: v, outfit: o, e: 'smile' }));
    label(S, 'Sam ' + n, 380 + i * 700, 1170, 32);
    drawHead(x, { x: 380 + i * 700, y: 440, s: 2.0, view: '3q', cs: charSpec('sam', a), e: i === 0 ? { name: 'laugh', open: 0.7 } : 'smile' });
  });
  ['front', '3q', 'side'].forEach((v, j) => figure(x, { who: 'girl', age: 7, x: 2250 + j * 170, y: 1100, s: 0.95, view: v, outfit: 'coat', hat: COL.girlHat, e: 'smile' }));
  label(S, 'granddaughter, 7 (2047)', 2420, 1170, 32);
  setLight(LIGHTS.memory);
  panel(S, 2800, 240, 960, 1000, '#d8b98a');
  ['front', '3q', 'side'].forEach((v, j) => figure(x, { who: 'dad', age: 44, x: 2960 + j * 300, y: 1100, s: 0.95, view: v, outfit: 'home', e: 'smile', pose: j === 2 ? { aN: [2.7, 0.1], neck: -0.2 } : {} }));
  figure(x, { who: 'nell', age: 8, x: 3620, y: 1100, s: 0.95, view: 'side', outfit: 'home', e: { name: 'wonder', look: [0.4, -1] }, pose: { neck: -0.35 } });
  label(S, 'Arthur, 44, and Nell at 8 (memory, sepia)', 3280, 1170, 30);
  setLight(LIGHTS.neutral);
  // expressions strip for Sam
  [['wonder', 'wonder'], [{ name: 'laugh', open: 0.8 }, 'the laugh'], ['focus', 'homework'], ['worry', 'watching mum']].forEach(([e, n], i) => { drawHead(x, { x: 300 + i * 520, y: 1650, s: 2.4, view: '3q', cs: charSpec('sam', 9), e }); label(S, n, 300 + i * 520, 1850, 30); });
  sheetFinish(S); return S.c;
};
SHEETS.telescope = () => {
  const S = sheetCanvas(3840, 2160); sheetPaper(S); const x = S.x;
  TIME = 0; BOIL = 0; setLight(LIGHTS.neutral);
  title(S, 'The telescope: turnaround', 'Brass tube, wide dew shield, two bands, a finder on top. Wooden tripod, a leather strap three times round the front-left leg, a triangular tray. THE DENT: on top of the tube, just behind the front band. Always.');
  const az = [0, -0.6, -1.2, -1.9, Math.PI, 2.4, 1.3, 0.6];
  const names = ['side (right)', 'three-quarter away', 'toward the eyepiece', 'eyepiece three-quarter', 'side (left)', 'front three-quarter', 'objective on', 'three-quarter front'];
  az.forEach((a, i) => { const cx = 330 + (i % 4) * 900, cy = 620 + Math.floor(i / 4) * 760; telescope(x, { x: cx, y: cy, s: 0.62, alt: 0.3, az: a, cracked: true, polish: 0.4, seed: 40 }); label(S, names[i], cx, cy + 480, 28); });
  sheetFinish(S); return S.c;
};
SHEETS.telescope2 = () => {
  const S = sheetCanvas(3840, 2160); sheetPaper(S); const x = S.x;
  TIME = 0; BOIL = 0; setLight(LIGHTS.neutral);
  title(S, 'The telescope: details, ages, silhouette', 'Recognisable from across a room: long tube, fat dew shield, finder, splayed legs, tray.');
  telescope(x, { x: 700, y: 900, s: 1.9, alt: 0.12, az: -0.25, noTripod: true, cracked: true, polish: 0.2, seed: 40 });
  label(S, '1987-2029: dull brass, cracked eyepiece', 700, 1260, 30);
  telescope(x, { x: 2200, y: 900, s: 1.9, alt: 0.12, az: -0.25, noTripod: true, cracked: false, polish: 1, seed: 40, glint: 0.5 });
  label(S, 'after S23: polished, new eyepiece. The dent stays.', 2200, 1260, 30);
  // dent callout
  const d = dry(c => telescope(c, { x: 2200, y: 900, s: 1.9, alt: 0.12, az: -0.25, noTripod: true, cracked: false, polish: 1, seed: 40 })).dent;
  x.strokeStyle = '#c0392b'; x.lineWidth = 4; x.beginPath(); x.arc(d[0], d[1], 60, 0, TAU); x.stroke();
  label(S, 'the dent (from the night it fell)', d[0] + 60, d[1] - 90, 30, '#c0392b', 'left');
  // silhouettes
  setLight(Object.assign({}, LIGHTS.night, { id: 'silsheet', key: '#1a1a2a', k: 0.97, sat: 0.1 }));
  [0.5, 0.9, 0.2].forEach((alt, i) => telescope(x, { x: 3100 + i * 240, y: 1650, s: 0.4, alt, az: 0.3 + i * 0.4, seed: 40, polish: 0 }));
  setLight(LIGHTS.neutral);
  label(S, 'silhouettes', 3340, 2080, 30);
  // eyepiece close-ups
  telescope(x, { x: 1150, y: 1750, s: 1.2, alt: 0.1, az: -1.9, noTripod: true, cracked: true, polish: 0.3, seed: 40 });
  label(S, 'cracked eyepiece', 900, 2080, 30);
  telescope(x, { x: 2150, y: 1750, s: 1.2, alt: 0.1, az: -1.9, noTripod: true, cracked: false, polish: 1, seed: 40 });
  label(S, 'new eyepiece', 1900, 2080, 30);
  sheetFinish(S); return S.c;
};
SHEETS.tenTimes = () => {
  const S = sheetCanvas(3840, 2160); sheetPaper(S); const x = S.x;
  setLight(LIGHTS.neutral); setLightDir(-0.6, -0.8);
  title(S, 'Nell, drawn ten times', 'Ten separate drawings from the model (drawings 0 to 9 of the boil). The line shivers the way a hand does. The woman does not change.');
  for (let i = 0; i < 10; i++) {
    BOIL = i * 7 + 3; TIME = i;
    const cx = 380 + (i % 5) * 770, cy = 700 + Math.floor(i / 5) * 820;
    drawHead(x, { x: cx, y: cy, s: 4.2, view: '3q', cs: charSpec('nell', 49), e: 'neutral' });
    label(S, 'drawing ' + (i + 1), cx, cy + 330, 30);
  }
  BOIL = 0; sheetFinish(S); return S.c;
};
SHEETS.aging = () => {
  const S = sheetCanvas(3840, 1400); sheetPaper(S); const x = S.x;
  TIME = 0; BOIL = 0; setLight(LIGHTS.neutral); setLightDir(-0.6, -0.8);
  title(S, 'Twenty years, one face', 'Nell every four years, 2027 to 2047. Grey arrives at the temple first.');
  [49, 53, 57, 61, 65, 69].forEach((a, i) => { const cx = 350 + i * 620; drawHead(x, { x: cx, y: 700, s: 3.8, view: '3q', cs: charSpec('nell', a), e: 'soft' }); label(S, String(2027 + (a - 49)) + '  (' + a + ')', cx, 1060, 34); });
  sheetFinish(S); return S.c;
};
window.sheet_or_film = (a) => { const c = SHEETS[a](); return c.toDataURL('image/png'); };
