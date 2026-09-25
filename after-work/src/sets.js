// ---------------------------------------------------------------------------
// Sets: painted (unlined) watercolour/gouache backgrounds, cached once, used
// as multiplane layers. Characters and moving things are drawn per frame.
// ---------------------------------------------------------------------------
const _bg = new Map();
function cached(key, w, h, fn) {
  if (!_bg.has(key)) { const c = mkCanvas(w, h); const x = c.getContext('2d'); fn(x, w, h); _bg.set(key, c); }
  return _bg.get(key);
}
// static (non-boiling) wobble for painted edges
function wobStatic(pts, amp, seed, closed = true) {
  const r = resample(pts, 6, closed); const n = r.length;
  return r.map((p, i) => {
    const a = r[(i - 1 + n) % n], b = r[(i + 1) % n];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1;
    const d = noise1(seed * 5.1 + i * 0.07) * amp + noise1(seed + i * 0.4) * amp * 0.3;
    return [p[0] + nx / l * d, p[1] + ny / l * d];
  });
}
function bbox(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1 - x0, y1 - y0]; }
function tracePts(ctx, p) { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }

// the background painter's one brush: a flat shape with watercolour life inside it
function paint(ctx, pts, col, o = {}) {
  const seed = o.seed || 1, r = mulberry(seed);
  const poly = o.wob === 0 ? pts : wobStatic(pts, o.wob || 1.1, seed);
  const [bx, by, bw, bh] = bbox(poly);
  ctx.save();
  tracePts(ctx, poly); ctx.fillStyle = col; ctx.globalAlpha = o.alpha || 1; ctx.fill();
  ctx.clip();
  ctx.globalAlpha = 1;
  if (o.top || o.bot) { // wet-into-wet gradient
    const g = o.horiz ? ctx.createLinearGradient(bx, by, bx + bw, by) : ctx.createLinearGradient(bx, by, bx, by + bh);
    g.addColorStop(0, rgba(o.top || col, o.gA || 0.9)); g.addColorStop(1, rgba(o.bot || col, o.gA || 0.9));
    ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh);
  }
  const blots = o.blots !== undefined ? o.blots : Math.min(14, 3 + Math.floor(bw * bh / 30000));
  for (let i = 0; i < blots; i++) {
    const cx = bx + r() * bw, cy = by + r() * bh, rr = (0.15 + r() * 0.5) * Math.max(Math.min(bw, bh), 30);
    const c2 = r() < 0.55 ? darken(col, 0.06 + r() * 0.08) : lighten(col, 0.05 + r() * 0.08);
    const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    gg.addColorStop(0, rgba(c2, o.blotA || 0.35)); gg.addColorStop(0.7, rgba(c2, (o.blotA || 0.35) * 0.4)); gg.addColorStop(1, rgba(c2, 0));
    ctx.fillStyle = gg; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  if (o.gran !== 0) granulate(ctx, bx, by, bw, bh, o.gran || 0.35);
  ctx.restore();
  if (o.edge !== 0) { // pigment pools at the edge
    ctx.save(); tracePts(ctx, poly); ctx.strokeStyle = rgba(darken(col, 0.25), o.edge || 0.35); ctx.lineWidth = o.edgeW || 1.6; ctx.stroke(); ctx.restore();
  }
  return poly;
}
const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
// pencil-ish coloured line for BG detail
function bgLine(ctx, pts, col, w = 1.5, a = 0.6, seed = 3) {
  const p = wobStatic(pts, 0.6, seed, false);
  ctx.save(); ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.stroke(); ctx.restore();
}
function softLight(ctx, x, y, r, col, a, mode = 'source-over') { glow(ctx, x, y, r, col, a, mode); }

// ---------- simple perspective camera for sets ----------
function persp(cam) { // cam: {x,y,z (m), f (px), cx, hy}
  return ([X, Y, Z]) => { const z = Z - cam.z; return [cam.cx + cam.f * (X - cam.x) / z, cam.hy - cam.f * (Y - cam.y) / z, z]; };
}

// ===========================================================================
// WAREHOUSE (2027). Sodium orange / grey-green. Low camera.
// ===========================================================================
const WH = { cam: { x: 0, y: 1.2, z: 0, f: 820, cx: 900, hy: 560 } };
function warehouseBG(mode) { // mode: 'night' | 'machines'
  return cached('wh_' + mode, 2200, 1080, (x, w, h) => {
    const P = persp(Object.assign({}, WH.cam, { cx: 1000 }));
    // ceiling void
    gradWash(x, 0, 0, w, h, [[0, '#15110e'], [0.45, '#2a2018'], [1, '#2a241c']], { seed: 3, blot: 20, blotA: 0.2 });
    // far wall: corrugated grey-green panels
    const wallTop = 120, wallBot = 560;
    paint(x, rectPts(-20, wallTop, w + 40, wallBot - wallTop), '#4a5446', { top: '#2f3530', bot: '#5d6a57', seed: 11, blots: 18 });
    for (let i = 0; i < 90; i++) bgLine(x, [[i * 26, wallTop + 10], [i * 26 + 2, wallBot]], '#2a3028', 1.2, 0.35, i);
    // big roller door, lit from inside by a sliver
    paint(x, rectPts(1260, 250, 420, 310), '#3a4238', { top: '#333a32', bot: '#48523f', seed: 12 });
    for (let i = 0; i < 19; i++) bgLine(x, [[1262, 260 + i * 16], [1678, 260 + i * 16]], '#252a24', 1.2, 0.5, 40 + i);
    paint(x, rectPts(1262, 552, 416, 8), '#d9c890', { seed: 13, edge: 0, gran: 0 });
    // high windows band (grimy)
    for (let i = 0; i < 9; i++) paint(x, rectPts(80 + i * 230, 150, 160, 60), '#3d4a52', { top: '#2a3238', bot: '#566068', seed: 20 + i, blotA: 0.5 });
    // floor
    paint(x, [[-20, 560], [w + 20, 560], [w + 20, h + 10], [-20, h + 10]], '#5a5f4e', { top: '#3a3e34', bot: '#6c705c', seed: 30, blots: 20 });
    // floor lane lines in perspective (yellow, worn)
    [[-2.4, 0.08], [2.2, 0.08]].forEach(([X, wd], k) => {
      const a = P([X, 0, 2]), b = P([X, 0, 60]), a2 = P([X + wd, 0, 2]), b2 = P([X + wd, 0, 60]);
      paint(x, [a, b, b2, a2], '#b3a043', { seed: 40 + k, edge: 0.2, alpha: 0.75 });
    });
    // oil stains
    const r = mulberry(8);
    for (let i = 0; i < 14; i++) { const cx = r() * w, cy = 620 + r() * 420; wash(x, [[cx - 60, cy], [cx, cy - 12], [cx + 70, cy], [cx, cy + 14]].map(p => [p[0], p[1]]), '#2e3028', { alpha: 0.05, layers: 8, seed: 50 + i }); }
    // roof trusses: lattice girders receding
    for (let k = 0; k < 8; k++) {
      const Z = 4 + k * 5;
      const a = P([-12, 7.2, Z]), b = P([12, 7.2, Z]);
      const a2 = P([-12, 6.6, Z]), b2 = P([12, 6.6, Z]);
      const col = mix('#1a1512', '#3a3026', k / 8);
      bgLine(x, [a, b], col, 6 - k * 0.5, 0.95, 60 + k); bgLine(x, [a2, b2], col, 4 - k * 0.3, 0.9, 70 + k);
      for (let j = 0; j < 16; j++) { const t0 = j / 16, t1 = (j + 1) / 16; bgLine(x, [lerp2(a, b, t0), lerp2(a2, b2, t1)], col, 2.2 - k * 0.2, 0.8, 80 + j + k * 20); }
    }
    // haze
    const hz = x.createLinearGradient(0, 100, 0, 700); hz.addColorStop(0, 'rgba(230,130,50,0.05)'); hz.addColorStop(0.55, 'rgba(230,130,50,0.3)'); hz.addColorStop(1, 'rgba(230,130,50,0.12)');
    x.fillStyle = hz; x.fillRect(0, 0, w, h);
    // roll cages on the left, full of parcels
    for (let i = 0; i < 4; i++) {
      const Z = 6 + i * 2.2, X0 = -4.2;
      const tl = P([X0, 1.8, Z]), br = P([X0 + 1.1, 0, Z]);
      paint(x, rectPts(tl[0], tl[1], br[0] - tl[0], br[1] - tl[1]), '#3a3024', { seed: 90 + i, alpha: 0.9 });
      const rr = mulberry(91 + i);
      for (let j = 0; j < 7; j++) { const px = tl[0] + rr() * (br[0] - tl[0]) * 0.8, py = tl[1] + (br[1] - tl[1]) * (0.1 + rr() * 0.7), s2 = (br[0] - tl[0]) * (0.2 + rr() * 0.2); paint(x, rectPts(px, py, s2, s2 * 0.7), mix('#b98a55', '#8a6a44', rr()), { seed: 100 + i * 10 + j, edge: 0.3 }); }
      for (let j = 0; j <= 6; j++) bgLine(x, [[tl[0] + (br[0] - tl[0]) * j / 6, tl[1]], [tl[0] + (br[0] - tl[0]) * j / 6, br[1]]], '#1c1814', 1.6, 0.8, 120 + j);
      for (let j = 0; j <= 4; j++) bgLine(x, [[tl[0], tl[1] + (br[1] - tl[1]) * j / 4], [br[0], tl[1] + (br[1] - tl[1]) * j / 4]], '#1c1814', 1.6, 0.8, 130 + j);
    }
    if (mode === 'machines') {
      // new LED panels: cold white rectangles in the roof
      for (let k = 0; k < 6; k++) { const Z = 5 + k * 5; const a = P([-3, 6.4, Z]), b = P([3, 6.4, Z]); paint(x, [a, b, [b[0], b[1] + 10 - k], [a[0], a[1] + 10 - k]], '#e8f0ea', { seed: 150 + k, edge: 0, gran: 0 }); glow(x, (a[0] + b[0]) / 2, a[1] + 20, 260 - k * 25, '#c8d8d0', 0.18, 'screen'); }
    }
  });
}
// sodium lamps (drawn live so they can flicker)
function sodiumLamps(ctx, t, P, n = 7, flick = 1) {
  for (let k = 0; k < n; k++) {
    const Z = 3.6 + k * 5, X = k % 2 ? 1.8 : -1.2;
    const p = P([X, 6.2, Z]); const s = 1 / (Z * 0.25);
    const f = 1 - flick * (k === 3 ? 0.35 * (noise1(q12(t) * 3) > 0.6 ? 1 : 0) : 0);
    glow(ctx, p[0], p[1] + 30 * s, 520 * s, '#ff8a2a', 0.42 * f, 'screen');
    const fp = P([X, 0, Z]); ctx.save(); ctx.translate(fp[0], fp[1]); ctx.scale(1, 0.28); glow(ctx, 0, 0, 900 * s, '#ff9a40', 0.35 * f, 'screen'); ctx.restore();
    glow(ctx, p[0], p[1] + 8 * s, 90 * s, '#ffd28a', 0.9 * f, 'screen');
    ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 34 * s, 12 * s, 0, Math.PI, TAU); ctx.fill();
    bgLine(ctx, [[p[0], p[1] - 10 * s], [p[0], p[1] - 200 * s]], '#1a1410', 2, 0.9, 200 + k);
  }
}

// the conveyor: belt + rollers + legs, in perspective; parcels slide along
function conveyor(ctx, P, t, o = {}) {
  const X0 = o.X || -0.6, X1 = X0 + 0.7, Y = 0.85, z0 = o.z0 || 2.4, z1 = 60;
  const ink = LIGHT ? LIGHT.ink : '#24150d';
  // side skirt (the face toward camera: X1 side if camera to the right)
  const a = P([X1, Y, z0]), b = P([X1, Y, z1]), c = P([X1, Y - 0.25, z1]), d = P([X1, Y - 0.25, z0]);
  cel(ctx, path().poly([a, b, c, d]), { fill: '#6a7260', shade: [0, -6], lw: 3, seed: 900, amp: 0.6 });
  // belt top
  const e = P([X0, Y, z0]), f = P([X0, Y, z1]);
  cel(ctx, path().poly([e, f, b, a]), { fill: '#3a3a36', lw: 2.5, seed: 901, amp: 0.6 });
  // belt texture lines moving toward camera
  const sp = (o.speed || 0.9) * q12(t);
  for (let i = 0; i < 40; i++) {
    const zz = z0 + ((i * 0.7 - sp) % 28 + 28) % 28;
    const p1 = P([X0, Y, zz]), p2 = P([X1, Y, zz]);
    ctx.strokeStyle = rgba('#1a1a18', 0.5); ctx.lineWidth = Math.max(0.6, 3 / zz); ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
  }
  // end roller at the near end
  { const e0 = P([X0, Y, z0]), e1 = P([X1, Y, z0]), e2 = P([X1, Y - 0.25, z0]), e3 = P([X0, Y - 0.25, z0]); cel(ctx, path().poly([e0, e1, e2, e3]), { fill: '#5a6252', lw: 3, seed: 905, amp: 0.5 }); }
  // legs
  for (let zz = z0 + 0.8; zz < 30; zz += 2.4) {
    const l1 = P([X1 - 0.05, Y - 0.25, zz]), l2 = P([X1 - 0.05, 0, zz]);
    cel(ctx, path().poly([[l1[0] - 5 / zz * 3, l1[1]], [l1[0] + 5 / zz * 3, l1[1]], [l2[0] + 5 / zz * 3, l2[1]], [l2[0] - 5 / zz * 3, l2[1]]]), { fill: '#4a5044', lw: Math.max(1, 3 / Math.sqrt(zz)), seed: 910 + zz, amp: 0.3 });
  }
  // parcels
  const r = mulberry(o.seed || 77);
  const items = [];
  for (let i = 0; i < 24; i++) {
    const w0 = 0.25 + r() * 0.3, h0 = 0.14 + r() * 0.22, d0 = 0.22 + r() * 0.3, off = r() * 0.2;
    const zz = z0 + ((i * 1.25 + r() * 0.4 - sp) % 30 + 30) % 30;
    items.push({ zz, w0, h0, d0, off, col: mix('#c49460', '#9a7446', r()), tape: r() < 0.6, label: r() < 0.7 });
  }
  items.sort((p, q) => q.zz - p.zz);
  for (const it of items) {
    if (it.zz < z0 + 0.1) continue;
    const xa = X0 + 0.05 + it.off, xb = xa + it.w0, y0 = Y, y1 = Y + it.h0, za = it.zz, zb = it.zz + it.d0;
    const f1 = [P([xa, y0, za]), P([xb, y0, za]), P([xb, y1, za]), P([xa, y1, za])];
    const top = [P([xa, y1, za]), P([xb, y1, za]), P([xb, y1, zb]), P([xa, y1, zb])];
    const side = [P([xb, y0, za]), P([xb, y0, zb]), P([xb, y1, zb]), P([xb, y1, za])];
    const lw = Math.max(1, 3.2 / Math.sqrt(it.zz));
    cel(ctx, path().poly(side), { fill: darken(it.col, 0.2), lw, seed: 950 + it.zz * 10, amp: 0.4 });
    cel(ctx, path().poly(f1), { fill: it.col, lw, seed: 951 + it.zz * 10, amp: 0.4 });
    cel(ctx, path().poly(top), { fill: lighten(it.col, 0.12), lw, seed: 952 + it.zz * 10, amp: 0.4 });
    if (it.label && it.zz < 12) { const lp = [lerp2(f1[0], f1[2], 0.3), lerp2(f1[0], f1[2], 0.6)]; ctx.fillStyle = lit('#f0ece0'); const [lx, ly] = lp[0]; ctx.fillRect(lx, ly, (lp[1][0] - lx), (lp[1][1] - ly) * 0.6); }
    if (it.tape) { const m1 = lerp2(top[0], top[1], 0.5), m2 = lerp2(top[3], top[2], 0.5); line(ctx, path().m(...m1).l(...m2), { lw: lw * 2, color: lit('#d8c080'), seed: 960, amp: 0.2, alpha: 0.8 }); }
  }
}

// ===========================================================================
// KITCHEN: the clock of the film. One camera, many states.
// state: {mood, era} mood in dawn|grey|winter|thaw|gold|goldEve ; era 2027..2045
// ===========================================================================
const KMOOD = {
  dawn:   { wall: '#b9b9a0', wallTop: '#9a9c88', floor: '#8a7e6a', wood: '#8a6a4a', sky: ['#e8c9a8', '#b8c4c0'], light: '#fff0d8', lightA: 0.25, shade: '#5a5a50', cloth: '#b4c4b0' },
  grey:   { wall: '#a9ae98', wallTop: '#8d9582', floor: '#7a7466', wood: '#7a6650', sky: ['#9aa296', '#b8bcae'], light: '#e8ece0', lightA: 0.12, shade: '#4a5048', cloth: '#aab8a6' },
  winter: { wall: '#8e9cb8', wallTop: '#6f80a4', floor: '#6a6e84', wood: '#6a6070', sky: ['#aebfdc', '#dfe8f4'], light: '#dfe8f8', lightA: 0.12, shade: '#3a4262', cloth: '#9aaecc' },
  thaw:   { wall: '#b4b4a0', wallTop: '#9c9e8c', floor: '#857c6a', wood: '#8a6a4c', sky: ['#c8ccc0', '#e8e4d4'], light: '#fff4e0', lightA: 0.2, shade: '#5a5a50', cloth: '#b8c8b4' },
  gold:   { wall: '#e6d3a4', wallTop: '#d8bc84', floor: '#a88a60', wood: '#a0744a', sky: ['#bcdce8', '#fdf0d0'], light: '#fff0c0', lightA: 0.4, shade: '#8a6a58', cloth: '#d6e0bc' },
};
const KIT = { vp: [1000, 470] };
function kitchenBG(mood, era) {
  const M = KMOOD[mood];
  return cached('kit_' + mood + '_' + era, 1920, 1080, (x, w, h) => {
    // back wall
    paint(x, rectPts(-10, -10, w + 20, 800), M.wall, { top: M.wallTop, bot: M.wall, seed: 1, blots: 22, blotA: 0.3 });
    // faded wallpaper stripe
    for (let i = 0; i < 40; i++) bgLine(x, [[i * 52 + 10, 0], [i * 52 + 10, 760]], darken(M.wall, 0.08), 6, 0.25, i);
    // left wall in perspective
    paint(x, [[-10, -10], [230, 60], [230, 780], [-10, 1090]], darken(M.wall, 0.12), { top: darken(M.wallTop, 0.1), seed: 2 });
    // hall door on the left wall (open, dark hall beyond)
    paint(x, [[40, 160], [190, 190], [190, 790], [40, 870]], darken(M.shade, 0.3), { seed: 3, top: darken(M.shade, 0.5) });
    paint(x, [[190, 190], [230, 196], [230, 784], [190, 790]], M.wood, { seed: 4 });
    // right wall
    paint(x, [[1700, 60], [w + 10, -10], [w + 10, 1090], [1700, 780]], darken(M.wall, 0.1), { seed: 5 });
    // floor
    paint(x, [[-10, 1090], [230, 780], [1700, 780], [w + 10, 1090]], M.floor, { top: darken(M.floor, 0.15), bot: M.floor, seed: 6, blots: 12 });
    for (let i = -8; i <= 8; i++) { const a = [1000 + i * 90, 780], b = [1000 + i * 260, 1090]; bgLine(x, [a, b], darken(M.floor, 0.2), 1.3, 0.35, 10 + i); }
    // window
    const wx = 1090, wy = 210, ww = 420, wh = 340;
    paint(x, rectPts(wx - 18, wy - 18, ww + 36, wh + 36), lighten(M.wall, 0.2), { seed: 20 });
    paint(x, rectPts(wx, wy, ww, wh), M.sky[1], { top: M.sky[0], bot: M.sky[1], seed: 21, blots: 6, blotA: 0.2 });
    // garden beyond: fence + shed roof + tree
    paint(x, [[wx, wy + wh * 0.62], [wx + ww, wy + wh * 0.55], [wx + ww, wy + wh], [wx, wy + wh]], mood === 'winter' ? '#dfe6f0' : mood === 'gold' ? '#8fae6a' : '#7c8a70', { seed: 22 });
    paint(x, [[wx, wy + wh * 0.5], [wx + ww * 0.6, wy + wh * 0.5], [wx + ww * 0.6, wy + wh * 0.72], [wx, wy + wh * 0.75]], mood === 'winter' ? '#6a7090' : '#6a5a48', { seed: 23 });
    for (let i = 0; i < 8; i++) bgLine(x, [[wx + i * 30, wy + wh * 0.5], [wx + i * 30, wy + wh * 0.74]], '#3a3028', 1.2, 0.4, 24 + i);
    paint(x, [[wx + ww * 0.62, wy + wh * 0.45], [wx + ww, wy + wh * 0.3], [wx + ww, wy + wh * 0.6], [wx + ww * 0.62, wy + wh * 0.62]], mood === 'winter' ? '#e8eef6' : '#5a4a3e', { seed: 25 });
    // window frame
    paint(x, rectPts(wx + ww / 2 - 7, wy, 14, wh), '#f0ece0', { seed: 26, edge: 0.3 });
    paint(x, rectPts(wx, wy + wh * 0.42, ww, 12), '#f0ece0', { seed: 27, edge: 0.3 });
    paint(x, rectPts(wx - 30, wy + wh + 8, ww + 60, 22), '#e8e2d2', { seed: 28 });
    // counter + sink under the window
    paint(x, rectPts(1000, 600, 700, 180), darken(M.wall, 0.05), { seed: 30 });
    paint(x, rectPts(990, 590, 720, 26), '#d8d0bc', { seed: 31, top: '#e8e2d2' });
    for (let i = 0; i < 4; i++) { paint(x, rectPts(1012 + i * 172, 628, 160, 140), mix(M.wood, M.wall, 0.4), { seed: 32 + i }); bgLine(x, [[1080 + i * 172, 700], [1100 + i * 172, 700]], '#3a3028', 3, 0.6, 36 + i); }
    // tap
    bgLine(x, [[1300, 590], [1300, 548], [1330, 540]], '#9aa0a0', 6, 0.9, 40);
    // stove on the right
    paint(x, [[1710, 520], [1920, 500], [1920, 800], [1710, 790]], '#e8e4da', { seed: 41, top: '#f4f0e8' });
    paint(x, [[1700, 505], [1920, 485], [1920, 505], [1710, 525]], '#3a3a3a', { seed: 42 });
    // fridge on the left
    paint(x, [[250, 300], [440, 312], [440, 780], [250, 790]], '#ecebe2', { seed: 50, top: '#f6f5ee', bot: '#d6d4c8' });
    bgLine(x, [[258, 470], [436, 476]], '#9a9890', 2, 0.6, 51);
    bgLine(x, [[420, 380], [420, 440]], '#9a9890', 5, 0.8, 52);
    // THE SHELF (two boards on the back wall)
    paint(x, rectPts(500, 300, 460, 16), M.wood, { seed: 60, top: lighten(M.wood, 0.1) });
    paint(x, rectPts(500, 430, 460, 16), M.wood, { seed: 61, top: lighten(M.wood, 0.1) });
    // wall calendar (its year changes)
    paint(x, rectPts(820, 490, 110, 130), '#f4efe2', { seed: 62 });
    paint(x, rectPts(820, 490, 110, 48), mood === 'winter' ? '#8aa0c0' : '#c98a5a', { seed: 63 });
    // pendant lamp
    bgLine(x, [[760, 0], [760, 150]], '#3a3028', 2, 0.8, 64);
    paint(x, [[710, 150], [810, 150], [790, 118], [730, 118]], '#cfb07a', { seed: 65 });
    // window light pooling on the wall and floor
    softLight(x, wx + ww / 2, wy + wh / 2, 700, M.light, M.lightA, 'screen');
    x.save(); x.globalCompositeOperation = 'screen'; const bg2 = x.createLinearGradient(wx, wy, wx - 500, 1000); bg2.addColorStop(0, rgba(M.light, M.lightA * 0.9)); bg2.addColorStop(1, rgba(M.light, 0));
    x.fillStyle = bg2; x.beginPath(); x.moveTo(wx, wy); x.lineTo(wx + ww, wy); x.lineTo(wx + ww - 380, 1080); x.lineTo(wx - 520, 1080); x.closePath(); x.fill(); x.restore();
    softLight(x, wx + ww / 2 - 250, 900, 500, M.light, M.lightA * 0.6, 'screen');
  });
}
// shelf contents per era (drawn as small painted objects, cached with BG era)
function kitchenShelf(ctx, era, mood) {
  const M = KMOOD[mood];
  const put = (fn) => fn();
  const r = mulberry(era);
  // always: Dad's photo, the radio, a tin, two mugs
  paint(ctx, rectPts(520, 236, 50, 64), '#5a4a3a', { seed: 70 });
  paint(ctx, rectPts(527, 244, 36, 48), mood === 'winter' ? '#b8c0cc' : '#d8c8a8', { seed: 71 });
  paint(ctx, [[540, 262], [548, 256], [556, 262], [556, 292], [540, 292]], '#4a4a5a', { seed: 72, edge: 0 }); // tiny figure in the photo
  paint(ctx, rectPts(600, 252, 90, 48), '#7a4a3a', { seed: 73 }); ctx.fillStyle = rgba('#3a2a22', 0.8); ctx.beginPath(); ctx.arc(625, 276, 12, 0, TAU); ctx.fill();
  paint(ctx, rectPts(720, 262, 34, 38), '#c9a24a', { seed: 74 });
  [[780, '#e8e4d8'], [812, '#6a8aa0']].forEach(([x, c], i) => paint(ctx, rectPts(x, 272, 24, 28), c, { seed: 75 + i }));
  // plant: size follows the era; winter it's bare
  const pg = era < 2029 ? 0.4 : clamp((era - 2028) / 10, 0.4, 1.3);
  paint(ctx, [[880, 270], [920, 270], [915, 300], [885, 300]], '#b8643a', { seed: 80 });
  if (mood === 'winter') { bgLine(ctx, [[900, 270], [896, 244]], '#5a4a3a', 2, 0.9, 81); bgLine(ctx, [[898, 256], [908, 246]], '#5a4a3a', 1.5, 0.9, 82); }
  else for (let i = 0; i < 5 + pg * 8; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.2; const L = 26 * pg + r() * 22 * pg; const ex = 900 + Math.cos(a) * L, ey = 270 + Math.sin(a) * L; wash(ctx, [[900, 270], [ex - 6, ey], [ex, ey - 6], [ex + 6, ey]], mood === 'gold' ? '#6a9a4a' : '#5a7a4a', { alpha: 0.35, layers: 4, seed: 83 + i, spread: 0.1 }); }
  // lower shelf: books arrive with learning
  const nb = era < 2029 ? 2 : Math.min(16, 3 + (era - 2029) * 2);
  let bx = 510;
  for (let i = 0; i < nb; i++) { const bw = 14 + r() * 12, bh = 70 + r() * 36; paint(ctx, rectPts(bx, 430 - bh, bw, bh), ['#8a4a3a', '#3a5a7a', '#6a7a4a', '#c9a24a', '#5a4a6a', '#b07a5a'][i % 6], { seed: 90 + i, blots: 1 }); bx += bw + 2; }
  if (era >= 2031) { // a Saturn model made of wire and a ping-pong ball
    bgLine(ctx, [[bx + 40, 430], [bx + 40, 380]], '#4a3a2a', 2, 0.9, 120);
    paint(ctx, rectPts(bx + 26, 360, 28, 28).map((p, i) => p), '#e8d49a', { seed: 121 });
    ctx.save(); ctx.strokeStyle = rgba('#a0804a', 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(bx + 40, 374, 34, 9, -0.25, 0, TAU); ctx.stroke(); ctx.restore();
  }
  if (era >= 2033) { // jar of lenses
    paint(ctx, rectPts(bx + 90, 380, 40, 50), '#b8d0d8', { seed: 122, alpha: 0.8 });
    for (let i = 0; i < 5; i++) { ctx.strokeStyle = rgba('#ffffff', 0.7); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(bx + 100 + (i % 3) * 8, 395 + i * 6, 7, 3, 0, 0, TAU); ctx.stroke(); }
  }
  if (era >= 2036) { // a fiddle on the wall + a birdhouse on top
    paint(ctx, [[640, 200], [660, 150], [680, 200], [676, 220], [644, 220]], '#9a5a2a', { seed: 130 });
    bgLine(ctx, [[660, 150], [660, 110]], '#3a2a1a', 4, 0.9, 131);
    paint(ctx, [[400, 300], [440, 272], [480, 300], [476, 312], [404, 312]], '#8a6a4a', { seed: 132 });
  }
  // calendar year
  letter(ctx, String(era), 875, 590, { size: 30, font: 'Kalam', color: '#3a3028', align: 'center', seed: era });
  // the crayon rocket on the fridge (Sam's), always there
  paint(ctx, rectPts(300, 340, 90, 110), '#f6f2e6', { seed: 140 });
  ctx.save(); ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.strokeStyle = rgba('#c0473a', 0.85); ctx.beginPath(); ctx.moveTo(345, 360); ctx.lineTo(360, 400); ctx.lineTo(330, 400); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = rgba('#e0a030', 0.85); ctx.beginPath(); ctx.moveTo(338, 405); ctx.lineTo(345, 430); ctx.moveTo(352, 405); ctx.lineTo(350, 432); ctx.stroke();
  ctx.fillStyle = rgba('#3a5a9a', 0.8); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(310 + i * 17, 350 + (i % 2) * 70, 2.5, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function kitchenTable(ctx, mood) {
  const M = KMOOD[mood];
  // tabletop in perspective, oilcloth over wood
  const top = [[700, 830], [1360, 830], [1500, 1000], [560, 1000]];
  const legs = [[600, 1000], [1460, 1000]];
  legs.forEach(([x0, y0], i) => paint(ctx, rectPts(x0 - 14, y0, 28, 90), darken(M.wood, 0.2), { seed: 150 + i }));
  paint(ctx, [[560, 1000], [1500, 1000], [1500, 1028], [560, 1028]], darken(M.wood, 0.1), { seed: 152 });
  paint(ctx, top, M.cloth, { top: darken(M.cloth, 0.08), bot: lighten(M.cloth, 0.06), seed: 153, blots: 10 });
  // gingham hint
  for (let i = 0; i < 18; i++) { const t = i / 17; bgLine(ctx, [lerp2(top[0], top[1], t), lerp2(top[3], top[2], t)], darken(M.cloth, 0.12), 3, 0.25, 160 + i); }
  for (let i = 0; i < 8; i++) { const t = i / 7; bgLine(ctx, [lerp2(top[0], top[3], t), lerp2(top[1], top[2], t)], darken(M.cloth, 0.12), 3, 0.25, 180 + i); }
}
// a kitchen chair (painted, simple)
function chair(ctx, x, y, s, col, seed = 1, back = true) {
  const w = 110 * s, h = 22 * s;
  if (back) { paint(ctx, rectPts(x - w / 2, y - 260 * s, w, 24 * s), col, { seed }); [-0.4, 0, 0.4].forEach((k, i) => paint(ctx, rectPts(x + k * w - 6 * s, y - 238 * s, 12 * s, 180 * s), col, { seed: seed + 1 + i })); }
  paint(ctx, rectPts(x - w / 2 - 6 * s, y - 60 * s, w + 12 * s, h), lighten(col, 0.08), { seed: seed + 5 });
  [-0.45, 0.45].forEach((k, i) => paint(ctx, rectPts(x + k * w - 6 * s, y - 40 * s, 12 * s, 160 * s), darken(col, 0.1), { seed: seed + 6 + i }));
}
// kettle: live element (steam)
function kettle(ctx, t, on, M) {
  const kx = 1800, ky = 440;
  paint(ctx, [[kx - 70, ky + 45], [kx + 70, ky + 45], [kx + 56, ky - 40], [kx - 56, ky - 40]], '#c8c4ba', { seed: 190, top: '#e8e6e0' });
  bgLine(ctx, [[kx - 30, ky - 40], [kx - 20, ky - 70], [kx + 20, ky - 70], [kx + 30, ky - 40]], '#3a3a3a', 5, 0.9, 191);
  bgLine(ctx, [[kx - 56, ky + 5], [kx - 108, ky - 34]], '#b8b4aa', 14, 1, 192);
}
function steam(ctx, x, y, t, amt = 1, seed = 1) {
  const tt = q12(t);
  for (let i = 0; i < 7; i++) {
    const ph = (tt * 0.45 + i / 7) % 1;
    const sx = x + noise1(seed + i * 3.1 + tt * 0.6) * 30 * ph - ph * 30, sy = y - ph * 260;
    const pts = [];
    for (let k = 0; k < 12; k++) { const u = k / 11; pts.push([sx + Math.sin(u * 5 + tt * 2 + i) * 12 * (0.4 + ph), sy - u * 60 * (0.5 + ph)]); }
    ctx.save(); ctx.globalAlpha = amt * 0.55 * Math.sin(ph * Math.PI);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3 + ph * 10; ctx.lineCap = 'round'; ctx.filter = 'blur(2px)';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.stroke();
    ctx.filter = 'none'; ctx.restore();
  }
}

// ===========================================================================
// THE STREET: same houses across twenty years. state: winter | spring | summer | autumn | night2047
// ===========================================================================
const STREET_STATES = {
  winter: { sky: ['#2c3a64', '#6f86b2', '#aebfdc'], brick: '#6a5a6a', roof: '#e8eef6', snow: true, road: '#5a6280', pave: '#8a94b0', lit: 0.5, lamp: true },
  spring: { sky: ['#8fbad4', '#c8e0ea', '#f4ecd2'], brick: '#b06a4a', roof: '#5a4a50', snow: false, road: '#7a7a78', pave: '#b8b0a0', lit: 0, lamp: false },
  summer: { sky: ['#7ab4d8', '#b8dcea', '#fbf0d0'], brick: '#b8704a', roof: '#5a4a50', snow: false, road: '#7a7a78', pave: '#c0b8a4', lit: 0, lamp: false },
  autumn: { sky: ['#e8b070', '#f4d49a', '#fbecc8'], brick: '#b0684a', roof: '#4a3a44', snow: false, road: '#7a7068', pave: '#b8a890', lit: 0.3, lamp: true },
};
function streetBG(state) {
  const S = STREET_STATES[state];
  return cached('street_' + state, W, H, (x) => {
    gradWash(x, 0, 0, W, 520, [[0, S.sky[0]], [0.6, S.sky[1]], [1, S.sky[2]]], { seed: 3, blot: 20, blotA: 0.18 });
    // distant hills/roofs behind
    paint(x, [[-10, 330], [300, 300], [700, 320], [1100, 290], [1500, 315], [1930, 300], [1930, 420], [-10, 420]], mix(S.sky[1], '#3a3a5a', 0.35), { seed: 4 });
    // the terrace across the road: 7 houses + corner shop
    const baseY = 760, top = 250;
    for (let i = 0; i < 7; i++) {
      const hx = -40 + i * 230, hw = 230;
      paint(x, rectPts(hx, top + 80, hw, baseY - top - 80), mix(S.brick, '#000', (i % 2) * 0.06), { seed: 10 + i, blots: 8 });
      // roof + chimney
      paint(x, [[hx - 4, top + 84], [hx + hw + 4, top + 84], [hx + hw - 10, top + 20], [hx + 10, top + 20]], S.roof, { seed: 20 + i, top: S.snow ? '#ffffff' : darken(S.roof, 0.1) });
      paint(x, rectPts(hx + hw - 60, top - 30, 36, 60), darken(S.brick, 0.1), { seed: 30 + i });
      if (S.snow) paint(x, rectPts(hx + hw - 64, top - 38, 44, 12), '#f4f8fc', { seed: 31 + i, edge: 0.2 });
      // door + windows
      const doorC = ['#3a5a7a', '#7a3a3a', '#3a6a4a', '#c9a24a', '#5a4a6a', '#2a3a4a', '#8a5a3a'][i];
      paint(x, rectPts(hx + 30, baseY - 170, 64, 170), doorC, { seed: 40 + i });
      paint(x, rectPts(hx + 36, baseY - 196, 52, 20), '#e8e0c8', { seed: 50 + i, edge: 0.3 });
      [[hx + 120, baseY - 180, 90, 110], [hx + 40, top + 130, 70, 90], [hx + 130, top + 130, 70, 90]].forEach(([wx, wy, ww, wh], k) => {
        const lit = ((i * 3 + k) % 5) / 5 < S.lit;
        paint(x, rectPts(wx - 6, wy - 6, ww + 12, wh + 12), '#e8e4d8', { seed: 60 + i * 3 + k, edge: 0.2 });
        paint(x, rectPts(wx, wy, ww, wh), lit ? '#ffcf7a' : mix(S.sky[1], '#2a2a3a', 0.5), { seed: 90 + i * 3 + k, top: lit ? '#ffe0a0' : undefined });
        if (lit) glow(x, wx + ww / 2, wy + wh / 2, 120, '#ffb050', 0.35, 'screen');
        bgLine(x, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], '#e8e4d8', 4, 0.9, 120 + k);
      });
    }
    // the corner shop at the right end
    const sx = 1570;
    paint(x, rectPts(sx, top + 40, 380, baseY - top - 40), darken(S.brick, 0.05), { seed: 150 });
    paint(x, [[sx - 6, top + 44], [sx + 386, top + 44], [sx + 370, top - 10], [sx + 10, top - 10]], S.roof, { seed: 151, top: S.snow ? '#ffffff' : undefined });
    paint(x, rectPts(sx + 20, top + 150, 340, 50), '#3a4a3a', { seed: 152 });
    if (state === 'winter') {
      paint(x, rectPts(sx + 30, baseY - 260, 320, 260), '#7a7e86', { seed: 153 });
      for (let k = 0; k < 16; k++) bgLine(x, [[sx + 30, baseY - 256 + k * 16], [sx + 350, baseY - 256 + k * 16]], '#5a5e66', 2, 0.6, 154 + k);
    } else {
      paint(x, rectPts(sx + 30, baseY - 260, 320, 260), '#f0d8a0', { seed: 153, top: '#fff0c8' });
      paint(x, rectPts(sx + 50, baseY - 200, 90, 200), '#8a5a3a', { seed: 155 });
    }
    // road + far pavement + near pavement
    paint(x, rectPts(-10, baseY, W + 20, 30), S.pave, { seed: 170 });
    paint(x, rectPts(-10, baseY + 30, W + 20, 150), S.road, { seed: 171, top: darken(S.road, 0.08) });
    paint(x, rectPts(-10, baseY + 180, W + 20, 160), S.pave, { seed: 172, top: lighten(S.pave, 0.05) });
    for (let k = 0; k < 12; k++) bgLine(x, [[k * 180, baseY + 180], [k * 180 - 40, H]], darken(S.pave, 0.15), 1.5, 0.5, 173 + k);
    if (S.snow) { for (let k = 0; k < 40; k++) { const r = mulberry(200 + k); wash(x, [[r() * W, baseY + 30 + r() * 150], [r() * W, baseY + 40 + r() * 150], [r() * W, baseY + 50 + r() * 140]], '#dfe6f2', { alpha: 0.08, layers: 5, seed: 210 + k }); }
      paint(x, rectPts(-10, baseY + 176, W + 20, 20), '#eef2f8', { seed: 260 }); paint(x, rectPts(-10, baseY - 8, W + 20, 14), '#eef2f8', { seed: 261 }); }
    // lamp post near right
    paint(x, rectPts(1380, 360, 16, baseY + 180 - 360), '#2a2a34', { seed: 270 });
    paint(x, [[1360, 350], [1416, 350], [1404, 330], [1372, 330]], '#2a2a34', { seed: 271 });
  });
}
function streetLamp(ctx, on) { if (!on) return; glow(ctx, 1388, 362, 380, '#ffc870', 0.38, 'screen'); glow(ctx, 1388, 356, 30, '#fff0c8', 0.9, 'screen'); }
// snow drawn as individual short lines, on twos
function snow(ctx, t, n, o = {}) {
  const r = mulberry(o.seed || 17), tt = q12(t);
  ctx.save(); ctx.strokeStyle = o.col || '#f4f8ff'; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const depth = 0.3 + r() * 0.9, sp = 60 + depth * 90, x0 = r() * (W + 200), ph = r() * 1000;
    const y = ((ph + tt * sp) % (H + 60)) - 30, x = (x0 + noise1(ph + tt * 0.4) * 40 - tt * (o.wind || 30) * depth) % (W + 200);
    const L = 4 + depth * 9;
    ctx.globalAlpha = 0.45 + depth * 0.45; ctx.lineWidth = 0.8 + depth * 1.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L * 0.35, y + L); ctx.stroke();
  }
  ctx.restore();
}
function breath(ctx, x, y, t, dir = 1, period = 1.4, seed = 1) {
  const ph = (q12(t) % period) / period;
  if (ph > 0.6) return;
  const k = ph / 0.6;
  ctx.save(); ctx.globalAlpha = 0.5 * Math.sin(k * Math.PI); ctx.fillStyle = '#f4f8ff'; ctx.filter = 'blur(3px)';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x + dir * (10 + k * 60 + i * 12), y - k * 18 + i * 3, 10 + k * 26 - i * 4, 6 + k * 12, 0, 0, TAU); ctx.fill(); }
  ctx.filter = 'none'; ctx.restore();
}

// ===========================================================================
// THE BACK STEP: memory (sepia dusk), Saturn night 2029, 2047 night.
// ===========================================================================
const STEP_MOODS = {
  sepia: { sky: ['#6e4c2c', '#c9a070', '#efdcb8'], wall: '#a47b4f', brick: '#8a6440', door: '#6e4c2c', yard: '#b89468', far: '#7a5a3a', win: '#f4d8a0', stars: 0.2 },
  night: { sky: ['#070b1c', '#16213d', '#2c3b66'], wall: '#3a3a5a', brick: '#2e2e4a', door: '#2a2438', yard: '#34344e', far: '#141a30', win: '#ffcf7a', stars: 1 },
  end:   { sky: ['#05051a', '#141433', '#2e2a66'], wall: '#34305a', brick: '#2a264c', door: '#241e3a', yard: '#2e2a4c', far: '#0e0c26', win: '#ffcf7a', stars: 1.2 },
};
function backStepBG(mood, era = 2029) {
  const M = STEP_MOODS[mood];
  return cached('step_' + mood + era, W, H, (x) => {
    gradWash(x, 0, 0, W, 760, [[0, M.sky[0]], [0.65, M.sky[1]], [1, M.sky[2]]], { seed: 2, blot: 16, blotA: 0.15 });
    // neighbours' roofs and chimneys along the horizon
    const r = mulberry(5);
    let px = 700; const roof = [[700, 760]];
    while (px < W + 60) { const w2 = 120 + r() * 160, h2 = 520 + r() * 90; roof.push([px, h2], [px + w2 * 0.5, h2 - 40 - r() * 30], [px + w2, h2]); if (r() < 0.6) { roof.push([px + w2 * 0.7, h2 - 20], [px + w2 * 0.7, h2 - 80], [px + w2 * 0.78, h2 - 80], [px + w2 * 0.78, h2 - 20]); } px += w2; }
    roof.push([W + 60, 760]);
    paint(x, roof, M.far, { seed: 6, edge: 0.2 });
    if (mood !== 'sepia') for (let i = 0; i < 9; i++) { const wx = 760 + r() * 1100, wy = 600 + r() * 120; if (r() < 0.55) { paint(x, rectPts(wx, wy, 22, 28), M.win, { seed: 7 + i, edge: 0 }); glow(x, wx + 11, wy + 14, 60, '#ffb050', 0.25, 'screen'); } }
    // yard: paving + back fence
    paint(x, [[-10, 760], [W + 10, 760], [W + 10, H + 10], [-10, H + 10]], M.yard, { seed: 8, top: darken(M.yard, 0.1), bot: lighten(M.yard, 0.04) });
    for (let i = 0; i < 9; i++) bgLine(x, [[600 + i * 170, 760], [300 + i * 240, H]], darken(M.yard, 0.2), 2, 0.4, 9 + i);
    for (let i = 0; i < 4; i++) bgLine(x, [[560, 800 + i * 70], [W, 800 + i * 70 + i * 6]], darken(M.yard, 0.2), 2, 0.3, 20 + i);
    paint(x, rectPts(640, 680, W - 620, 90), darken(M.brick, 0.1), { seed: 30 });
    for (let i = 0; i < 18; i++) bgLine(x, [[640 + i * 72, 680], [640 + i * 72, 770]], darken(M.brick, 0.3), 2, 0.4, 31 + i);
    // washing-line pole
    paint(x, rectPts(1760, 360, 14, 400), darken(M.far, 0.2), { seed: 50 });
    bgLine(x, [[1767, 370], [620, 330]], darken(M.far, 0.1), 1.5, 0.6, 51);
    // the house wall on the left with the back door + step
    paint(x, [[-10, -10], [600, -10], [600, 900], [-10, 960]], M.brick, { seed: 60, top: darken(M.brick, 0.1), blots: 20 });
    for (let j = 0; j < 30; j++) bgLine(x, [[-10, j * 32], [600, j * 32]], darken(M.brick, 0.25), 1.4, 0.35, 61 + j);
    paint(x, rectPts(200, 330, 250, 520), M.door, { seed: 100, top: darken(M.door, 0.1) });
    paint(x, rectPts(240, 370, 170, 180), M.win, { seed: 101 });
    if (mood !== 'sepia') glow(x, 325, 460, 260, '#ffb050', 0.35, 'screen');
    paint(x, rectPts(180, 850, 300, 50), lighten(M.wall, 0.12), { seed: 102, top: lighten(M.wall, 0.2) });
    paint(x, rectPts(150, 900, 380, 60), lighten(M.wall, 0.06), { seed: 103, top: lighten(M.wall, 0.16) });
    paint(x, rectPts(540, -10, 22, 920), darken(M.brick, 0.25), { seed: 104 }); // drainpipe
    // kitchen window from outside
    paint(x, rectPts(-10, 330, 150, 220), M.win, { seed: 105 }); if (mood !== 'sepia') glow(x, 60, 440, 220, '#ffb050', 0.3, 'screen');
    // plant pots on the step in later eras
    if (era >= 2031) [[470, 850, '#b8643a'], [500, 900, '#a8583a']].forEach(([px2, py2, c], i) => { paint(x, [[px2, py2 - 40], [px2 + 44, py2 - 40], [px2 + 38, py2], [px2 + 6, py2]], c, { seed: 110 + i }); wash(x, [[px2 - 10, py2 - 40], [px2 + 22, py2 - 100], [px2 + 54, py2 - 40]], mood === 'end' ? '#3a5a4a' : '#5a7a4a', { alpha: 0.2, layers: 6, seed: 112 + i }); });
  });
}
function nightSky(ctx, t, o = {}) {
  const r = mulberry(o.seed || 77), tt = q12(t);
  const n = o.n || 220, hMax = o.hMax || 700;
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * hMax * (0.2 + r() * 0.8), m = Math.pow(r(), 3.5), ph = r() * 100;
    let a = (o.dim || 0.8) * (0.25 + m);
    // stars twinkle one at a time: each star gets a rare, brief twinkle window
    const w = Math.sin(tt * 0.7 + ph) ; if (w > 0.985) a *= 1.8;
    ctx.fillStyle = rgba(m > 0.6 ? '#fff4d8' : '#dfe6ff', clamp(a)); ctx.beginPath(); ctx.arc(x, y, 0.7 + m * 2.2, 0, TAU); ctx.fill();
    if (m > 0.7) glow(ctx, x, y, 10 + m * 14, '#fff4d8', 0.25 * a);
  }
  // one star at a time does a proper twinkle (a cross of light), then hands it on
  const rr = mulberry((o.seed || 77) + 5); const bright = [];
  for (let i = 0; i < 40; i++) bright.push([rr() * W, rr() * hMax * 0.8]);
  const slot = Math.floor(tt / 1.6), k = Math.floor(hash1(slot + (o.seed || 0)) * bright.length), ph = (tt % 1.6) / 1.6;
  if (o.twinkle !== false) { const [x, y] = o.twinkleAt && slot % 2 === 0 ? o.twinkleAt : bright[k]; const a = Math.sin(ph * Math.PI);
    glow(ctx, x, y, 34 * a + 6, '#fff4d8', 0.5 * a);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#fff8e8', 0.8 * a); ctx.lineWidth = 1.4; const L = 6 + 16 * a;
    ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill(); ctx.restore(); }
  if (o.milky) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.18; ctx.translate(W * 0.55, 200); ctx.rotate(-0.5); const g = ctx.createLinearGradient(0, -140, 0, 140); g.addColorStop(0, 'rgba(160,150,220,0)'); g.addColorStop(0.5, 'rgba(200,190,240,0.9)'); g.addColorStop(1, 'rgba(160,150,220,0)'); ctx.fillStyle = g; ctx.fillRect(-1400, -140, 2800, 280); ctx.restore(); }
}
