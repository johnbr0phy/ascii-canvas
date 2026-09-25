// ---------------------------------------------------------------------------
// People. One parametric model per character; ages are parameters, never
// separate drawings, so Nell at 49 and Nell at 69 are built from the same
// construction: same eye spacing, same nose, same side parting and low bun,
// same mole under her left eye.
// ---------------------------------------------------------------------------
let LDIR = [-0.55, -0.83];
function setLightDir(x, y) { const l = Math.hypot(x, y); LDIR = [x / l, y / l]; }
const shadeBy = k => [LDIR[0] * k, LDIR[1] * k];

// ---------- character canon ----------
function charSpec(who, age) {
  const c = { who, age };
  if (who === 'nell') {
    const old = inv(55, 70, age), mid = inv(45, 60, age);
    c.H = age < 14 ? 390 : lerp(620, 600, old); c.head = age < 14 ? 92 : 104;
    c.hair = age < 14 ? COL.nellHair40 : age < 52 ? COL.nellHair40 : age < 64 ? mix(COL.nellHair50, COL.nellGrey, inv(52, 64, age) * 0.6) : mix(COL.nellGrey, COL.nellHair70, inv(62, 70, age));
    c.streak = age >= 50 && age < 64 ? mix(COL.nellGrey, COL.nellHair70, 0.5) : null;
    c.ageK = age < 14 ? 0 : clamp((age - 40) / 32); // 0 = 40, 1 = 72
    c.stoop = old * 0.12; c.bun = true; c.mole = age >= 14; c.fem = true; c.child = age < 14;
    c.skin = COL.skin;
  } else if (who === 'sam') {
    c.H = age <= 9 ? 410 : age <= 11 ? 450 : age <= 14 ? 540 : age <= 17 ? 610 : 640; c.head = age <= 11 ? 94 : age <= 14 ? 98 : 104;
    c.hair = COL.samHair; c.curls = true; c.child = age < 14; c.ageK = age >= 25 ? 0.1 : 0; c.beard = age >= 25; c.skin = '#eec2a0';
  } else if (who === 'dad') {
    c.H = 650; c.head = 104; c.hair = COL.dadHair; c.cap = true; c.tache = true; c.ageK = 0.15; c.skin = COL.dadSkin;
  } else if (who === 'girl') {
    c.H = 370; c.head = 92; c.hair = COL.samHair; c.curls = true; c.child = true; c.ageK = 0; c.skin = '#f0c4a2'; c.fem = true;
  } else { // neighbour
    c.H = 600 + (age % 7) * 8; c.head = 102; c.hair = ['#3a2a20', '#b0aaa0', '#6a4a30', '#1f1a18', '#c98a4a'][age % 5]; c.ageK = (age % 3) * 0.3; c.skin = ['#f0c7a4', '#c8906a', '#8a5a3c', '#e8b894', '#f4d0b0'][age % 5];
  }
  c.legLen = c.H * (c.child ? 0.43 : 0.455);
  return c;
}

// ---------- geometry helpers ----------
const rot2 = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
// angle 0 = straight down; positive = swing toward +x (forward when facing right)
const dirA = a => [Math.sin(a), Math.cos(a)];
function limbOutline(c, w) {
  const n = c.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    L.push([c[i][0] - dy * w[i], c[i][1] + dx * w[i]]); R.push([c[i][0] + dy * w[i], c[i][1] - dx * w[i]]);
  }
  const d0 = [c[1][0] - c[0][0], c[1][1] - c[0][1]], l0 = Math.hypot(...d0);
  const d1 = [c[n - 1][0] - c[n - 2][0], c[n - 1][1] - c[n - 2][1]], l1 = Math.hypot(...d1);
  const e0 = [c[0][0] - d0[0] / l0 * w[0] * 0.7, c[0][1] - d0[1] / l0 * w[0] * 0.7];
  const e1 = [c[n - 1][0] + d1[0] / l1 * w[n - 1] * 0.7, c[n - 1][1] + d1[1] / l1 * w[n - 1] * 0.7];
  return [...L, e1, ...R.reverse(), e0];
}
// quadratic-ish polyline through joints for a bent limb
function bentLimb(a, b, c, k = 5) {
  const pts = [];
  for (let i = 0; i <= k; i++) { const t = i / k; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]); }
  for (let i = 1; i <= k; i++) { const t = i / k; pts.push([lerp(b[0], c[0], t), lerp(b[1], c[1], t)]); }
  return pts;
}

// ---------- faces ----------
// Head-local units: 100 = head height, origin at the middle of the head, +x = facing.
// view: 'profile' | '3q' | 'front' | 'back'. e = expression spec.
function headShape(view, cs) {
  const ak = cs.ageK || 0, ch = cs.child ? 1 : 0;
  const sag = ak * ak * 5;
  if (view === 'profile') {
    return path().cr([[-2, -52], [18, -48], [28, -38], [34, -22], [36, -12], [34.5, -6], [37, 0], [43 - ch * 4, 12 - ch], [38, 16], [38.5, 22],
      [36, 25], [37.5, 28], [33.5, 33 + sag * 0.2], [35 - sag * 0.3, 41 + sag * 0.2], [29 - ch * 2, 48 + sag * 0.5], [14, 48 + sag * 0.7], [0 + sag * 0.6, 40 + sag * 0.5], [-9, 28], [-14, 12], [-30, 2], [-42, -12], [-36, -38], [-18, -50]], true);
  }
  if (view === '3q') {
    return path().cr([[-8, -52], [16, -48], [32, -34], [37, -16], [40, 0], [39, 16 + sag * 0.3], [32, 34 + sag * 0.5], [21, 45 + sag * 0.4], [8 - ch * 2, 51 + sag * 0.4],
      [-6, 47 + sag * 0.6], [-20, 38 + sag * 0.6], [-28, 24], [-36, 6], [-42, -16], [-32, -42]], true);
  }
  return path().cr([[0, -51], [25, -46], [36, -26], [38, -4], [35, 16 + sag * 0.3], [25, 36 + sag * 0.5], [0, 50 + sag * 0.4], [-25, 36 + sag * 0.5], [-35, 16 + sag * 0.3], [-38, -4], [-36, -26], [-25, -46]], true);
}
// where the features sit, per view. m = mirror (outer corner toward -x)
const FEAT = {
  '3q': { eyes: [{ x: -6, y: 3, w: 18, h: 11, k: 1, m: 1 }, { x: 23, y: 2, w: 14, h: 11, k: 0.62, m: 0 }],
    brows: [{ x: -6, y: -11, w: 20, k: 1, m: 1 }, { x: 24, y: -12, w: 14, k: 0.7, m: 0 }],
    nose: [[22, 11], [28, 16], [29, 19.5], [23.5, 21.5]], mouth: { x: 11, y: 33, w: 17 }, mole: [26, 13], blush: [[-8, 18, 1], [28, 17, 0.6]],
    ear: [-33, 6, 7, 12], naso: [[20, 22], [24, 30]], naso2: [[-2, 22], [-4, 30]] },
  profile: { eyes: [{ x: 28, y: -1, w: 11, h: 10, k: 0.55, m: 1 }], brows: [{ x: 28, y: -12, w: 12, k: 1, m: 1 }],
    nose: null, nostril: [[35, 13], [38, 15.5], [40.5, 13.5]], mouth: { x: 34, y: 26, w: 6, profile: true }, mole: [25, 11], blush: [[20, 18, 1]],
    ear: [-8, 4, 8, 13], naso: [[32, 19], [29, 30]] },
  front: { eyes: [{ x: -17, y: 3, w: 17, h: 11, k: 1, m: 1 }, { x: 17, y: 3, w: 17, h: 11, k: 1, m: 0 }],
    brows: [{ x: -17, y: -10, w: 18, k: 1, m: 1 }, { x: 17, y: -10, w: 18, k: 1, m: 0 }],
    nose: [[-1, 8], [1, 16], [-2, 20], [4, 20]], mouth: { x: 0, y: 33, w: 18 }, mole: [19, 13], blush: [[-22, 19, 1], [22, 19, 1]],
    ear: null, naso: [[-9, 19], [-12, 30]], naso2: [[9, 19], [12, 30]] },
};
function hairShapes(view, cs) {
  const r = {};
  if (cs.who === 'nell') {
    if (view === 'profile') {
      r.front = path().cr([[28, -37], [16, -52], [-6, -59], [-30, -50], [-45, -26], [-46, 2], [-34, 22], [-22, 18], [-16, 0], [-13, -14], [0, -22], [16, -26], [24, -30]], true);
      r.bun = path().ellipse(-47, 12, 16, 14, -0.3);
      r.strands = [path().m(24, -38).q(0, -50, -34, -32), path().m(12, -28).q(-10, -36, -40, -12), path().m(-18, -52).q(-40, -36, -40, 0)];
      r.loose = path().m(29, -32).q(35, -18, 31, -6);
    } else if (view === '3q') {
      r.front = path().cr([[37, -18], [32, -40], [12, -58], [-14, -60], [-38, -46], [-48, -18], [-44, 10], [-34, 22], [-34, 4], [-32, -12], [-24, -28], [-10, -36], [8, -36], [24, -30]], true);
      r.bun = path().ellipse(-46, 12, 15, 13, -0.2);
      r.strands = [path().m(-12, -40).q(-20, -52, -26, -58), path().m(-8, -38).q(14, -44, 34, -26), path().m(-16, -42).q(-34, -40, -44, -14), path().m(-2, -48).q(18, -50, 30, -36)];
      r.part = path().m(-10, -38).q(-16, -50, -22, -58);
      r.loose = path().m(-30, -18).q(-36, -2, -31, 12);
    } else if (view === 'front') {
      r.front = path().cr([[38, -8], [36, -38], [16, -56], [-10, -58], [-34, -46], [-42, -18], [-40, 10], [-36, 6], [-34, -18], [-22, -36], [-12, -40], [6, -38], [24, -30], [34, -14]], true);
      r.back = path().cr([[40, -10], [42, 14], [34, 26], [-34, 26], [-42, 14], [-40, -10], [0, -40]], true);
      r.strands = [path().m(-12, -40).q(10, -44, 32, -20), path().m(-14, -42).q(-30, -40, -38, -14)];
      r.part = path().m(-12, -40).q(-14, -50, -12, -58);
      r.loose = path().m(-36, -10).q(-42, 6, -37, 18);
    } else { // back
      r.front = path().cr([[40, -20], [30, -48], [0, -58], [-30, -48], [-40, -20], [-38, 20], [-18, 38], [18, 38], [38, 20]], true);
      r.bun = path().ellipse(0, 30, 18, 15);
      r.strands = [path().m(0, -56).q(-20, -30, -8, 26), path().m(0, -56).q(20, -30, 8, 26), path().m(-24, -48).q(-40, -10, -20, 30)];
    }
  } else if (cs.curls) {
    const bumps = (pts) => path().cr(pts, true, 0.7);
    if (view === 'profile') r.front = bumps([[30, -34], [24, -52], [4, -62], [-20, -60], [-40, -48], [-50, -26], [-46, 0], [-34, 14], [-20, 10], [-14, -6], [0, -18], [16, -26]]);
    else if (view === '3q') r.front = bumps([[38, -22], [32, -48], [10, -62], [-16, -62], [-40, -50], [-50, -26], [-46, 4], [-34, 14], [-32, -4], [-22, -24], [-4, -32], [18, -32]]);
    else if (view === 'back') r.front = bumps([[42, -12], [40, -44], [18, -62], [-18, -62], [-40, -44], [-44, -10], [-40, 22], [-10, 34], [10, 34], [40, 22]]);
    else r.front = bumps([[40, -12], [38, -44], [18, -62], [-18, -62], [-38, -44], [-42, -12], [-34, -18], [-18, -34], [0, -30], [18, -34], [32, -20]]);
    r.curls = true;
  } else if (cs.who === 'dad') {
    r.front = view === 'profile' ? path().cr([[26, -34], [10, -44], [-20, -44], [-40, -26], [-42, 4], [-34, 16], [-20, 12], [-14, -8], [0, -20], [16, -26]], true)
      : path().cr([[34, -24], [24, -40], [0, -46], [-30, -38], [-42, -12], [-36, 12], [-30, 0], [-20, -20], [0, -28], [20, -28]], true);
  } else if (view === 'back') {
    const bald = cs.age % 11 === 0;
    r.front = bald ? path().cr([[40, -4], [36, 20], [0, 34], [-36, 20], [-40, -4], [0, 8]], true) : path().cr([[42, -18], [34, -48], [0, -58], [-34, -48], [-42, -18], [-38, 22], [-14, 40], [14, 40], [38, 22]], true);
  } else {
    if (view === 'profile' || view === '3q') r.front = path().cr([[30, -30], [16, -50], [-8, -58], [-36, -46], [-46, -16], [-40, 10], [-30, 0], [-16, -20], [4, -30], [20, -32]], true);
    else r.front = path().cr([[38, -16], [30, -48], [0, -58], [-30, -48], [-38, -16], [-30, -26], [0, -36], [30, -26]], true);
  }
  return r;
}

// expression defaults
function exprSpec(e) {
  const E = { lid: 0.18, lidLow: 0, brow: 0, browIn: 0, mouth: 0, open: 0, wide: 0, tear: 0, blink: 0, look: [0, 0], smileEyes: 0 };
  const presets = {
    neutral: {}, tired: { lid: 0.5, brow: -0.1, mouth: -0.15, bags: 1 }, worry: { lid: 0.3, browIn: 0.8, mouth: -0.35 },
    wonder: { lid: 0.0, wide: 1, brow: 0.6, open: 0.35, hi: 2 }, smile: { lid: 0.25, mouth: 0.8, smileEyes: 0.7, brow: 0.15 },
    joy: { lid: 0.3, mouth: 1, open: 0.5, smileEyes: 1, brow: 0.3 }, laugh: { lid: 0.3, mouth: 1, open: 0.8, smileEyes: 1, brow: 0.4 },
    soft: { lid: 0.3, mouth: 0.35, smileEyes: 0.3 }, focus: { lid: 0.35, browIn: 0.3, mouth: 0 }, closed: { blink: 1, mouth: 0.1 },
    fear: { lid: 0.05, wide: 0.6, browIn: 1, brow: 0.4, mouth: -0.4, open: 0.1 },
  };
  return Object.assign(E, presets[e.name || e] || {}, typeof e === 'object' ? e : {});
}

// draw one eye. cx,cy in screen; sz = eye width px; k = 1 near, <1 foreshortened far eye
function eye(ctx, M, x, y, w, h, E, cs, k, sd, detail, face) {
  const ink = LIGHT ? LIGHT.ink : '#2a1c14';
  const lidDrop = clamp(E.lid + E.blink) * (1 - E.wide * 0.6), ak = cs.ageK || 0;
  const hh = h * (1 + E.wide * 0.35) * (1 - E.smileEyes * 0.35);
  const ww = w * k;
  const droop = ak * 0.18 * h;
  if (E.blink > 0.85) { // closed: a single lid curve
    line(ctx, path().m(x - ww * 0.5, y).q(x, y + hh * 0.45, x + ww * 0.5, y + droop * 0.5), { M, lw: detail * 1.3, seed: sd, amp: 0.3 });
    return;
  }
  // eye white + iris clipped by lids
  const top = y - hh * 0.55 + hh * 1.0 * lidDrop, bot = y + hh * 0.45 - hh * E.smileEyes * 0.25;
  const almond = path().m(x - ww * 0.5, y + droop * 0.3).q(x - ww * 0.05, top - hh * 0.25, x + ww * 0.5, y + droop).q(x + ww * 0.05, bot + hh * 0.15, x - ww * 0.5, y + droop * 0.3);
  const poly = prep(almond, M, sd, 0.2, 2.5);
  ctx.save();
  fillPolys(ctx, poly, lit(COL.white));
  tracePolys(ctx, poly); ctx.clip();
  const ix = x + E.look[0] * ww * 0.25 + ww * 0.04 * (face === 'profile' ? 1 : 0), iy = y + E.look[1] * hh * 0.2 + hh * 0.05;
  const ir = hh * 0.55 * (1 + E.wide * 0.05);
  const ip = prep(path().ellipse(ix, iy, ir * k * 0.95, ir), M, sd + 1, 0.15, 2);
  fillPolys(ctx, ip, lit(COL.eye));
  const hi = E.hi || 1;
  const hp = Mapp(M, [ix - ir * 0.35 * k, iy - ir * 0.4]);
  ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.95;
  ctx.beginPath(); ctx.arc(hp[0], hp[1], Math.max(1, ir * 0.26 * Math.abs(M[0]) * (hi > 1 ? 1.25 : 1)), 0, TAU); ctx.fill();
  if (hi > 1) { const hp2 = Mapp(M, [ix + ir * 0.3 * k, iy + ir * 0.3]); ctx.beginPath(); ctx.arc(hp2[0], hp2[1], Math.max(0.8, ir * 0.13 * Math.abs(M[0])), 0, TAU); ctx.fill(); }
  // upper lid shadow on the eyeball
  ctx.globalAlpha = 0.28; ctx.fillStyle = ink; ctx.translate(0, 0);
  const sh = prep(path().m(x - ww * 0.6, top - hh).l(x + ww * 0.6, top - hh).l(x + ww * 0.6, top + hh * 0.18).q(x, top + hh * 0.3, x - ww * 0.6, top + hh * 0.18), M, sd + 2, 0, 3);
  tracePolys(ctx, sh); ctx.fill();
  ctx.restore();
  // upper lid: the thick line
  line(ctx, path().m(x - ww * 0.55, y + droop * 0.3 + hh * 0.05).q(x - ww * 0.05, top - hh * 0.28, x + ww * 0.55, y + droop - hh * 0.02), { M, lw: detail * 1.6, seed: sd + 3, amp: 0.25, t0: 0.12, t1: 0.3 });
  // lash flick at the outer corner
  line(ctx, path().m(x + ww * 0.5, y + droop - hh * 0.02).l(x + ww * 0.68, y + droop - hh * 0.22), { M, lw: detail * 0.9, seed: sd + 4, amp: 0.2 });
  // crease above
  if (detail > 1.4 || ak > 0.3) line(ctx, path().m(x - ww * 0.35, top - hh * 0.55 - lidDrop * hh * 0.2).q(x + ww * 0.05, top - hh * 0.8, x + ww * 0.45, y - hh * 0.55 + droop * 0.6), { M, lw: detail * 0.55, seed: sd + 5, amp: 0.2, alpha: 0.7 });
  // lower lid, short
  line(ctx, path().m(x - ww * 0.15, bot + hh * 0.12).q(x + ww * 0.15, bot + hh * 0.18, x + ww * 0.42, bot + droop * 0.4), { M, lw: detail * 0.6, seed: sd + 6, amp: 0.2, alpha: 0.75 });
  if (E.bags || ak > 0.35) line(ctx, path().m(x - ww * 0.2, bot + hh * 0.45).q(x + ww * 0.1, bot + hh * 0.62, x + ww * 0.38, bot + hh * 0.4), { M, lw: detail * 0.5, seed: sd + 7, amp: 0.2, alpha: 0.45 + ak * 0.2 });
  if (ak > 0.4) { // crow's feet
    for (let i = 0; i < 2 + (ak > 0.8 ? 1 : 0); i++) line(ctx, path().m(x + ww * 0.72, y + droop + (i - 1) * hh * 0.25).l(x + ww * 0.95, y + droop + (i - 1) * hh * 0.4), { M, lw: detail * 0.45, seed: sd + 8 + i, amp: 0.2, alpha: 0.5 });
  }
  if (E.tear) { const tp = Mapp(M, [x + ww * 0.3, bot + hh * 0.25]); glow(ctx, tp[0], tp[1], ww * Math.abs(M[0]) * 0.18, '#ffffff', 0.7 * E.tear); }
}
function brow(ctx, M, x, y, w, E, k, sd, detail, flip) {
  const up = E.brow * 4, inn = E.browIn * 4;
  const a = [x - w * 0.5 * k, y - up + inn * (flip ? -0.2 : 1)], b = [x + w * 0.5 * k, y - up - 1 + inn * (flip ? 1 : -0.2)];
  line(ctx, path().m(a[0], a[1]).q((a[0] + b[0]) / 2, y - up - 3, b[0], b[1]), { M, lw: detail * 1.5, seed: sd, amp: 0.3, t0: 0.3, t1: 0.4 });
}

// the head. o: {x,y (screen centre), s (px per head unit), view, f, tilt, e, cs, detail}
function drawHead(ctx, o) {
  const cs = o.cs, view = o.view || '3q', f = o.f || 1, s = o.s;
  const M = T(Mtr(o.x, o.y), Mrot(o.tilt || 0), Msc(f * s, s));
  const E = exprSpec(o.e || 'neutral');
  const px = s * 100; // head height in px
  const detail = clamp(px / 90, 0.7, 4.5); // line weight scale
  const lw = Math.max(1.4, detail * 1.6);
  const sd = (o.seed || 200) + (cs.who === 'nell' ? 0 : 50);
  const hs = hairShapes(view, cs);
  const sh = shadeBy(Math.min(px * 0.07, 7 + px * 0.02));
  const hairCol = cs.hair;
  if (hs.bun && view !== 'back') cel(ctx, hs.bun, { M, fill: hairCol, shade: sh, lw, seed: sd + 2 });
  if (view === 'back') {
    cel(ctx, path().ellipse(-40, 4, 6, 11), { M, fill: cs.skin || COL.skin, lw: lw * 0.9, seed: sd + 3 });
    cel(ctx, path().ellipse(40, 4, 6, 11), { M, fill: cs.skin || COL.skin, lw: lw * 0.9, seed: sd + 4 });
    cel(ctx, headShape('front', cs), { M, fill: cs.skin || COL.skin, lw, seed: sd + 5 });
    if (hs.front) cel(ctx, hs.front, { M, fill: hairCol, shade: sh, lw, seed: sd + 6 });
    if (hs.bun) cel(ctx, hs.bun, { M, fill: hairCol, shade: sh, lw, seed: sd + 2 });
    (hs.strands || []).forEach((p, i) => line(ctx, p, { M, lw: lw * 0.5, seed: sd + 30 + i, color: lit(darken(hairCol, 0.35)), alpha: 0.8 }));
    if (hs.curls) for (let i = 0; i < 9; i++) { const cx = -30 + (i % 3) * 30, cy = -40 + Math.floor(i / 3) * 26; line(ctx, path().m(cx, cy).q(cx + 6, cy + 5, cx + 1, cy + 9), { M, lw: lw * 0.5, seed: sd + 50 + i, color: lit(darken(hairCol, 0.3)) }); }
    if (cs.streak) line(ctx, path().m(-30, -44).q(-40, -20, -30, 10), { M, lw: px * 0.05, color: lit(cs.streak), seed: sd + 40 });
    if (o.hat) { const hp = path().cr([[44, -20], [36, -50], [0, -66], [-36, -50], [-44, -20], [0, -30]], true); cel(ctx, hp, { M, fill: o.hat, shade: sh, lw, seed: sd + 61 }); }
    return M;
  }
  const skin = cs.skin || COL.skin;
  const F = FEAT[view] || FEAT.front;
  if (o.neck) { // portraits carry their own neck and collar
    const nk = view === 'profile' ? path().cr([[-8, 20], [14, 36], [20, 70], [16, 110], [-30, 110], [-26, 60]], true) : view === '3q' ? path().cr([[-24, 24], [18, 34], [24, 70], [26, 110], [-32, 110], [-28, 60]], true) : path().cr([[-18, 26], [18, 26], [20, 70], [24, 110], [-24, 110], [-20, 70]], true);
    cel(ctx, nk, { M, fill: skin, shade: [sh[0] * 2, sh[1] * 2], lw, seed: sd + 7 });
    if (o.collar) cel(ctx, path().cr(o.collar, true), { M, fill: o.collarCol || COL.rust, shade: sh, lw, seed: sd + 8 });
  }
  if (F.ear) cel(ctx, path().ellipse(F.ear[0], F.ear[1], F.ear[2], F.ear[3], 0.12), { M, fill: skin, shade: sh, lw: lw * 0.9, seed: sd + 3 });
  if (hs.back) cel(ctx, hs.back, { M, fill: hairCol, shade: sh, lw, seed: sd + 1 });
  // face
  cel(ctx, headShape(view, cs), { M, fill: skin, shade: [sh[0] * 1.1, sh[1] * 1.1], lw, seed: sd + 5 });
  if (F.ear && view === '3q') line(ctx, path().m(F.ear[0] + 2, F.ear[1] - 6).q(F.ear[0] - 3, F.ear[1], F.ear[0] + 2, F.ear[1] + 6), { M, lw: lw * 0.45, seed: sd + 4, alpha: 0.6 });
  if (F.ear && view === 'profile') line(ctx, path().m(F.ear[0] + 3, F.ear[1] - 7).q(F.ear[0] - 3, F.ear[1] - 2, F.ear[0] + 2, F.ear[1] + 7), { M, lw: lw * 0.45, seed: sd + 4, alpha: 0.6 });
  F.blush.forEach(([bx, by, k]) => { const p = Mapp(M, [bx, by]); glow(ctx, p[0], p[1], px * 0.12 * k, lit(COL.cheek), 0.3, 'source-over'); });
  // eyes: the drawn eye has its outer corner at +x; m flips it
  F.eyes.forEach((q, i) => {
    const MM = q.m ? T(M, Mtr(q.x, 0), Msc(-1, 1), Mtr(-q.x, 0)) : M;
    const E2 = q.m ? Object.assign({}, E, { look: [-E.look[0], E.look[1]] }) : E;
    eye(ctx, MM, q.x, q.y, q.w, q.h, E2, cs, q.k, sd + 10 + i * 2, detail, view);
  });
  F.brows.forEach((q, i) => {
    const MM = q.m ? T(M, Mtr(q.x, 0), Msc(-1, 1), Mtr(-q.x, 0)) : M;
    brow(ctx, MM, q.x, q.y, q.w, E, q.k, sd + 20 + i, detail, true);
  });
  if (view === '3q') cel(ctx, path().m(22, 4).q(27, 12, 28, 18).q(25, 19, 22, 17).q(22, 10, 20, 5), { M, fill: mul(skin, '#f0d4c8'), noLine: true, seed: sd + 21, alpha: 0.6 });
  if (F.nose) { const n = F.nose; line(ctx, path().m(...n[0]).q(...n[1], ...n[2]).l(...n[3]), { M, lw: lw * 0.75, seed: sd + 22, amp: 0.2, t0: 0.5, t1: 0.2 }); }
  if (F.nostril) { const n = F.nostril; line(ctx, path().m(...n[0]).q(...n[1], ...n[2]), { M, lw: lw * 0.6, seed: sd + 22, amp: 0.2 }); }
  {
    const mo = F.mouth, m = E.mouth, op = E.open;
    if (mo.profile) {
      line(ctx, path().m(mo.x + 2.5, mo.y + 0.5).q(mo.x - 1, mo.y + 1 - m * 2.5, mo.x - 4, mo.y - m * 3.5), { M, lw: lw * 0.8, seed: sd + 23, amp: 0.2 });
      if (op > 0.1) cel(ctx, path().ellipse(mo.x + 1, mo.y + 2, 2.2, 2.5 * op + 1), { M, fill: '#6a2a2a', lw: lw * 0.5, seed: sd + 24 });
    } else {
      const x0 = mo.x - mo.w / 2, x1 = mo.x + mo.w / 2;
      if (op > 0.1) cel(ctx, path().m(x0 + 2, mo.y).q(mo.x, mo.y + 2 + op * 12, x1 - 2, mo.y).q(mo.x, mo.y + 2 + m * 2, x0 + 2, mo.y), { M, fill: '#6a2a2a', lw: lw * 0.6, seed: sd + 24 });
      line(ctx, path().m(x0, mo.y - m * 3).q(mo.x, mo.y + 2 + m * 3, x1, mo.y - m * 3), { M, lw: lw * 0.85, seed: sd + 23, amp: 0.2, t0: 0.25, t1: 0.25 });
      if (detail > 1.2) line(ctx, path().m(mo.x - mo.w * 0.2, mo.y + 6 + op * 8).q(mo.x, mo.y + 7 + op * 8, mo.x + mo.w * 0.2, mo.y + 6 + op * 8), { M, lw: lw * 0.45, seed: sd + 25, alpha: 0.45 });
    }
  }
  if ((cs.ageK || 0) > 0.45 && F.naso) {
    const a1 = (cs.ageK - 0.45) * 1.6;
    line(ctx, path().m(...F.naso[0]).q(F.naso[0][0] + 3, (F.naso[0][1] + F.naso[1][1]) / 2, ...F.naso[1]), { M, lw: lw * 0.45, seed: sd + 26, alpha: clamp(a1) * 0.6 });
    if (F.naso2) line(ctx, path().m(...F.naso2[0]).q(F.naso2[0][0] - 3, (F.naso2[0][1] + F.naso2[1][1]) / 2, ...F.naso2[1]), { M, lw: lw * 0.45, seed: sd + 27, alpha: clamp(a1) * 0.5 });
  }
  if (cs.mole) { const p = Mapp(M, F.mole); ctx.fillStyle = lit('#5a3a2a'); ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(0.9, px * 0.013), 0, TAU); ctx.fill(); }
  if (cs.tache) {
    const tp = view === 'profile' ? path().m(33, 19).q(40, 18, 40, 24).q(34, 25, 28, 23) : view === '3q' ? path().m(8, 22).q(20, 17, 33, 21).q(28, 27, 20, 24).q(12, 27, 8, 22) : path().m(-12, 22).q(0, 16, 12, 22).q(6, 26, 0, 23).q(-6, 26, -12, 22);
    cel(ctx, tp, { M, fill: '#5a4a3a', lw: lw * 0.6, seed: sd + 28 });
  }
  if (cs.beard) {
    const bp = view === 'profile' ? path().cr([[36, 30], [34, 44], [24, 52], [8, 50], [-4, 38], [4, 30], [18, 38], [30, 34]], true) : path().cr([[34, 22], [30, 38], [18, 50], [4, 50], [-12, 40], [-20, 30], [-10, 32], [6, 38], [22, 34]], true);
    cel(ctx, bp, { M, fill: darken(cs.hair, 0.15), shade: sh, lw: lw * 0.8, seed: sd + 29 });
  }
  // hair in front
  if (hs.front) cel(ctx, hs.front, { M, fill: hairCol, shade: sh, lw, seed: sd + 6 });
  if (hs.front && cs.who === 'nell' && view !== 'back') { // sheen: a soft band of light across the hair
    const sp = view === 'profile' ? path().m(18, -46).q(-4, -54, -30, -40) : view === '3q' ? path().m(22, -44).q(0, -54, -30, -46) : path().m(26, -40).q(0, -52, -28, -42);
    line(ctx, sp, { M, lw: px * 0.07, color: lit(lighten(hairCol, 0.22)), seed: sd + 43, amp: 0.3, alpha: 0.7 });
  }
  if (hs.strands) hs.strands.forEach((p, i) => line(ctx, p, { M, lw: lw * 0.5, seed: sd + 30 + i, color: lit(darken(hairCol, 0.35)), alpha: 0.8 }));
  if (cs.streak && hs.front) { // grey streak at the temple
    const sp = view === 'profile' ? path().m(26, -40).q(4, -52, -26, -40) : view === '3q' ? path().m(-6, -44).q(14, -48, 32, -30) : path().m(-10, -44).q(12, -44, 32, -22);
    line(ctx, sp, { M, lw: px * 0.06, color: lit(cs.streak), seed: sd + 40, amp: 0.3 });
  }
  if (hs.part) line(ctx, hs.part, { M, lw: lw * 0.6, seed: sd + 42, color: lit(darken(hairCol, 0.45)) });
  if (hs.loose) line(ctx, hs.loose, { M, lw: lw * 0.55, seed: sd + 41, color: lit(darken(hairCol, 0.2)) });
  if (hs.curls) { for (let i = 0; i < 7; i++) { const a = -2.6 + i * 0.4; const cx = Math.cos(a) * 36, cy = Math.sin(a) * 40 - 14; line(ctx, path().m(cx, cy).q(cx + 6, cy + 5, cx + 1, cy + 9), { M, lw: lw * 0.5, seed: sd + 50 + i, color: lit(darken(hairCol, 0.3)) }); } }
  if (cs.cap) {
    const cp = view === 'profile' ? path().cr([[46, -30], [30, -40], [8, -54], [-24, -52], [-42, -34], [-40, -26], [0, -32], [34, -28]], true) : path().cr([[48, -26], [34, -40], [12, -56], [-20, -56], [-42, -36], [-40, -24], [0, -32], [30, -30]], true);
    cel(ctx, cp, { M, fill: COL.dadCap, shade: sh, lw, seed: sd + 60 });
  }
  if (o.hat) {
    const hp = path().cr([[40, -26], [34, -50], [0, -66], [-34, -52], [-44, -26], [0, -34]], true);
    cel(ctx, hp, { M, fill: o.hat, shade: sh, lw, seed: sd + 61 });
    const bp = Mapp(M, [-2, -66]); cel(ctx, path().ellipse(bp[0], bp[1], px * 0.1, px * 0.09), { fill: lighten(o.hat, 0.2), lw: lw * 0.8, seed: sd + 62 });
  }
  return M;
}

// ---------- hands ----------
// a simple picture-book hand at the end of a forearm. a = forearm direction angle (screen), sz px
function hand(ctx, x, y, ang, sz, o = {}) {
  const M = T(Mtr(x, y), Mrot(ang), Msc(sz / 40, (o.flip ? -1 : 1) * sz / 40));
  const glove = o.glove;
  const fill = glove ? COL.glove : (o.skin || COL.skin);
  const g = o.grip || 0; // 0 open, 1 fist
  const p = path().cr([[0, -9], [18, -12], [30 - g * 10, -10], [40 - g * 16, -6], [42 - g * 18, 0], [38 - g * 16, 6], [26 - g * 6, 9], [22, 14], [14, 16], [6, 11], [0, 9]], true);
  cel(ctx, p, { M, fill, shade: shadeBy(sz * 0.12), lw: o.lw || Math.max(1.2, sz / 16), seed: o.seed || 300 });
  if (sz > 30) { line(ctx, path().m(28 - g * 8, -2).l(38 - g * 14, -2), { M, lw: Math.max(0.8, sz / 40), seed: 301, alpha: 0.6 }); line(ctx, path().m(26 - g * 8, 3).l(36 - g * 14, 3), { M, lw: Math.max(0.8, sz / 40), seed: 302, alpha: 0.6 }); }
  if (glove && sz > 20) line(ctx, path().m(4, -9).l(4, 9), { M, lw: Math.max(1, sz / 18), seed: 303, color: lit(COL.gloveDk) });
}

// ---------- the full figure ----------
// o: {who, age, x, y (feet), s, f, view:'side'|'3q'|'front'|'back', outfit, pose, e, hat}
function figure(ctx, o) {
  const cs = charSpec(o.who, o.age);
  const s = o.s || 1, f = o.f || 1, view = o.view || 'side';
  const P0 = Object.assign({ lean: 0, neck: 0, aN: [0.1, 0.25], aF: [-0.1, 0.25], lN: [0, 0], lF: [0, 0], hip: null, sit: false, headView: null, gripN: 0.3, gripF: 0.3, headTurn: 0 }, o.pose || {});
  const H = cs.H, hd = cs.head;
  const legL = cs.legLen, thigh = legL * 0.52, shin = legL * 0.48;
  const torso = H - legL - hd * 1.1;
  const stoop = (cs.stoop || 0) + P0.lean;
  const hip = P0.hip || [0, -legL];
  const shoulderUp = [0, -torso];
  const shoulder = add2(hip, rot2(shoulderUp, stoop));
  const neckTop = add2(shoulder, rot2([0, -hd * 0.12], stoop + (cs.stoop || 0) * 1.5 + P0.neck * 0.4));
  const headC = add2(neckTop, rot2([hd * 0.04, -hd * 0.46], stoop + P0.neck * 0.6 + (cs.stoop || 0) * 2));
  const ink = LIGHT ? LIGHT.ink : '#2a1c14';
  const lw = Math.max(1.3, 3.0 * s * (H / 620));
  const S = p => [o.x + f * p[0] * s, o.y + p[1] * s];
  const sd = o.seed || (cs.who === 'nell' ? 500 : cs.who === 'sam' ? 600 : 700);
  const fill = {};
  const out = o.outfit || 'home';
  // outfit colours
  if (cs.who === 'nell') {
    fill.top = out === 'work' ? COL.rust : out === 'coat' || out === 'winterIn' ? COL.coatWinter : out === 'old' ? '#8a6a8a' : out === 'gold' ? '#6a8aa0' : COL.rust;
    fill.sleeve = fill.top; fill.legs = out === 'work' ? '#3a3f4a' : out === 'old' ? '#5a4a5a' : COL.denim; fill.shoe = '#3a2a22';
    fill.vest = out === 'work' ? COL.vest : null; fill.coat = out === 'coat' || out === 'winterIn';
    fill.scarf = (out === 'coat' || out === 'winterIn') ? COL.scarf : null; fill.cardigan = out === 'home' || out === 'gold';
    if (cs.child) { fill.top = '#d9a0a0'; fill.legs = '#6a5a8a'; fill.sleeve = fill.top; fill.coat = false; fill.cardigan = false; }
  } else if (cs.who === 'sam') {
    fill.top = out === 'coat' ? COL.samCoat : out === 'school' ? '#3a4a6a' : o.age >= 25 ? '#4a6a5a' : COL.samJumper; fill.sleeve = fill.top;
    fill.legs = o.age >= 17 ? '#4a4a5a' : '#5a6a8a'; fill.shoe = '#2a2a2a'; fill.scarf = out === 'coat' ? '#e0c050' : null;
  } else if (cs.who === 'dad') {
    fill.top = COL.dadJacket; fill.sleeve = fill.top; fill.legs = '#3a3a3a'; fill.shoe = '#2a2018';
  } else if (cs.who === 'girl') {
    fill.top = COL.girlCoat; fill.sleeve = fill.top; fill.legs = '#6a4a6a'; fill.shoe = '#8a3a3a';
  } else {
    const tops = ['#7a6a9a', '#6a8a6a', '#b07a4a', '#4a6a8a', '#a05a5a', '#8a8a5a', '#5a7a7a'];
    fill.top = o.top || tops[cs.age % tops.length]; fill.sleeve = fill.top; fill.legs = ['#4a4a5a', '#5a4a3a', '#3a4a5a'][cs.age % 3]; fill.shoe = '#2a2a2a';
  }
  if (o.fill) Object.assign(fill, o.fill);
  const shadeK = shadeBy(12 * s);

  // ---- legs ----
  const hipW = view === 'side' ? 0 : H * 0.045;
  function leg(which) {
    const [ha, ka] = which === 'N' ? P0.lN : P0.lF;
    const off = view === 'side' ? [which === 'N' ? 4 : -4, 0] : [(which === 'N' ? 1 : -1) * hipW * (view === 'back' ? -1 : 1), 0];
    const hp = add2(hip, off);
    const knee = add2(hp, rot2([0, thigh], -ha));
    const ank = add2(knee, rot2([0, shin], -ha + ka));
    const wT = H * 0.056, wK = H * 0.04, wA = H * 0.03;
    const cl = bentLimb(hp, knee, ank, 4).map(S);
    const ws = cl.map((_, i) => { const t = i / (cl.length - 1); return (t < 0.5 ? lerp(wT, wK, t * 2) : lerp(wK, wA, (t - 0.5) * 2)) * s; });
    cel(ctx, path().cr(limbOutline(cl, ws), true), { fill: fill.legs, shade: shadeK, lw, seed: sd + (which === 'N' ? 10 : 11) });
    // shoe
    const fa = -ha + ka; // shin angle
    const toe = view === 'side' || view === '3q' ? [H * 0.075, 0] : [0, H * 0.012];
    const ap = ank, tp = add2(ank, rot2(add2(toe, [0, H * 0.03]), fa * 0.3));
    if (view === 'front' || view === 'back') {
      const c0 = S(add2(ank, [0, H * 0.018]));
      cel(ctx, path().ellipse(c0[0], c0[1], H * 0.036 * s, H * 0.024 * s), { fill: fill.shoe, shade: shadeK, lw, seed: sd + (which === 'N' ? 12 : 13) });
      return { hp, knee, ank };
    }
    const sh = [S(add2(ap, [-H * 0.025, -H * 0.015])), S(add2(ap, [H * 0.01, -H * 0.02])), S(add2(tp, [0, -H * 0.012])), S(add2(tp, [H * 0.012, H * 0.008])), S(add2(ap, [H * 0.01, H * 0.035])), S(add2(ap, [-H * 0.03, H * 0.03]))];
    cel(ctx, path().cr(sh, true), { fill: fill.shoe, shade: shadeK, lw, seed: sd + (which === 'N' ? 12 : 13) });
    return { hp, knee, ank };
  }
  // ---- arms ----
  const shW = view === 'side' ? H * 0.012 : H * (cs.child ? 0.088 : 0.1);
  function arm(which) {
    const [sa, ea] = which === 'N' ? P0.aN : P0.aF;
    let off = view === 'side' ? [which === 'N' ? H * 0.01 : -H * 0.01, 0] : [(which === 'N' ? 1 : -1) * shW * (view === 'back' ? -1 : 1), 0];
    if (view === '3q') off = [which === 'N' ? -H * 0.035 : H * 0.03, which === 'N' ? 0 : -H * 0.005];
    const sp = add2(add2(shoulder, rot2([0, H * 0.02], stoop)), off);
    const upper = H * 0.19, fore = H * 0.17;
    const el = add2(sp, rot2([0, upper], -sa - stoop * 0.3));
    const wr = add2(el, rot2([0, fore], -sa - ea - stoop * 0.3));
    const cl = bentLimb(sp, el, wr, 4).map(S);
    const wS = H * 0.036, wE = H * 0.028, wW = H * 0.023;
    const ws = cl.map((_, i) => { const t = i / (cl.length - 1); return (t < 0.5 ? lerp(wS, wE, t * 2) : lerp(wE, wW, (t - 0.5) * 2)) * s; });
    const sleeveCol = fill.coat ? COL.coatWinter : fill.cardigan ? COL.rust : fill.sleeve;
    const hs = S(wr), he = S(el);
    const handAng = Math.atan2(hs[1] - he[1], hs[0] - he[0]);
    const drawHand = () => hand(ctx, hs[0], hs[1], handAng, H * 0.075 * s, { glove: out === 'work' && cs.who === 'nell' && !o.bare, grip: which === 'N' ? P0.gripN : P0.gripF, skin: cs.skin, flip: f < 0, seed: sd + (which === 'N' ? 20 : 21), lw: lw * 0.85 });
    if (o.handsBehind) drawHand();
    cel(ctx, path().cr(limbOutline(cl, ws), true), { fill: sleeveCol, shade: shadeK, lw, seed: sd + (which === 'N' ? 22 : 23) });
    // cuff
    const cf = bentLimb(el, el, wr, 1); const c0 = S(lerp2(el, wr, 0.9)), c1 = S(wr);
    line(ctx, path().m(c0[0] + Math.sin(handAng) * wW * s, c0[1] - Math.cos(handAng) * wW * s).l(c0[0] - Math.sin(handAng) * wW * s, c0[1] + Math.cos(handAng) * wW * s), { lw: lw * 0.6, seed: sd + 24 });
    if (!o.handsBehind) drawHand();
    return { sp, el, wr, hs };
  }
  // ---- torso ----
  function body() {
    const tl = torso, dp = H * (cs.child ? 0.1 : 0.11);
    let pts;
    if (view === 'side') {
      const bust = cs.fem && !cs.child ? 1 : 0;
      pts = [[-dp * 0.25, -tl - hd * 0.02], [-dp * 0.58, -tl * 0.86], [-dp * 0.52, -tl * 0.5], [-dp * 0.44, -tl * 0.28], [-dp * 0.6, -tl * 0.02], [-dp * 0.5, tl * 0.14],
        [dp * 0.5, tl * 0.14], [dp * 0.55, -tl * 0.18], [dp * (0.52 + bust * 0.12), -tl * 0.55], [dp * (0.56 + bust * 0.1), -tl * 0.72], [dp * 0.36, -tl * 0.95], [dp * 0.15, -tl - hd * 0.02]];
      if (fill.coat) pts = [[-dp * 0.3, -tl - hd * 0.05], [-dp * 0.66, -tl * 0.86], [-dp * 0.62, -tl * 0.4], [-dp * 0.75, tl * 0.2], [-dp * 0.85, tl * 0.75], [dp * 0.75, tl * 0.75], [dp * 0.7, tl * 0.1], [dp * 0.66, -tl * 0.6], [dp * 0.4, -tl * 0.96], [dp * 0.2, -tl - hd * 0.05]];
    } else {
      const wd = H * (cs.child ? 0.1 : 0.115);
      pts = [[-wd * 0.95, -tl * 0.96], [-wd, -tl * 0.8], [-wd * 0.8, -tl * 0.4], [-wd * 0.9, 0], [-wd * 0.85, tl * 0.14], [wd * 0.85, tl * 0.14], [wd * 0.9, 0], [wd * 0.8, -tl * 0.4], [wd, -tl * 0.8], [wd * 0.95, -tl * 0.96], [wd * 0.3, -tl - hd * 0.04], [-wd * 0.3, -tl - hd * 0.04]];
      if (fill.coat) pts = [[-wd * 1.0, -tl * 0.96], [-wd * 1.05, -tl * 0.7], [-wd * 1.0, 0], [-wd * 1.05, tl * 0.75], [wd * 1.05, tl * 0.75], [wd * 1.0, 0], [wd * 1.05, -tl * 0.7], [wd * 1.0, -tl * 0.96], [wd * 0.3, -tl - hd * 0.06], [-wd * 0.3, -tl - hd * 0.06]];
      if (view === '3q') pts = pts.map(p => [p[0] * 0.82 + H * 0.01, p[1]]);
    }
    const tp = pts.map(p => S(add2(hip, rot2(p, stoop))));
    cel(ctx, path().cr(tp, true), { fill: fill.coat ? COL.coatWinter : fill.top, shade: shadeK, lw, seed: sd + 30 });
    if (fill.vest) {
      const vp = (view === 'side' ? [[-dp * 0.54, -tl * 0.86], [-dp * 0.5, -tl * 0.4], [-dp * 0.56, 0], [dp * 0.52, 0], [dp * 0.56, -tl * 0.6], [dp * 0.3, -tl * 0.9], [dp * 0.05, -tl * 0.95]]
        : [[-H * 0.1, -tl * 0.9], [-H * 0.09, 0], [H * 0.09, 0], [H * 0.1, -tl * 0.9], [H * 0.04, -tl * 0.95], [0, -tl * 0.6], [-H * 0.04, -tl * 0.95]]).map(p => S(add2(hip, rot2(p, stoop))));
      cel(ctx, path().cr(vp, true, 0.3), { fill: fill.vest, shade: shadeK, lw, seed: sd + 31 });
      const b1 = [-dp * 0.55, -tl * 0.3], b2 = [dp * 0.55, -tl * 0.3];
      const bw = view === 'side' ? [[-dp * 0.53, -tl * 0.36], [dp * 0.54, -tl * 0.36], [dp * 0.54, -tl * 0.26], [-dp * 0.52, -tl * 0.26]] : [[-H * 0.095, -tl * 0.36], [H * 0.095, -tl * 0.36], [H * 0.095, -tl * 0.26], [-H * 0.095, -tl * 0.26]];
      cel(ctx, path().poly(bw.map(p => S(add2(hip, rot2(p, stoop))))), { fill: COL.vestBand, lw: lw * 0.6, seed: sd + 32 });
    }
    if (fill.cardigan && view !== 'back') {
      // cardigan edge: a line down the front + pocket
      const a = view === 'side' ? [dp * 0.25, -tl * 0.95] : [H * 0.02, -tl * 0.98], b = view === 'side' ? [dp * 0.5, tl * 0.12] : [H * 0.03, tl * 0.14];
      line(ctx, path().m(...S(add2(hip, rot2(a, stoop)))).l(...S(add2(hip, rot2(b, stoop)))), { lw: lw * 0.7, seed: sd + 33 });
    }
    if (fill.scarf) {
      const sc = (view === 'side' ? [[-dp * 0.4, -tl * 1.02], [dp * 0.45, -tl * 1.0], [dp * 0.5, -tl * 0.86], [-dp * 0.45, -tl * 0.86]] : [[-H * 0.07, -tl * 1.02], [H * 0.07, -tl * 1.02], [H * 0.075, -tl * 0.88], [-H * 0.075, -tl * 0.88]]).map(p => S(add2(hip, rot2(p, stoop))));
      cel(ctx, path().cr(sc, true, 0.4), { fill: fill.scarf, shade: shadeK, lw, seed: sd + 34 });
      const tail = (view === 'side' ? [[dp * 0.3, -tl * 0.9], [dp * 0.55, -tl * 0.9], [dp * 0.5, -tl * 0.45], [dp * 0.3, -tl * 0.48]] : [[H * 0.02, -tl * 0.9], [H * 0.06, -tl * 0.9], [H * 0.055, -tl * 0.4], [H * 0.02, -tl * 0.42]]).map(p => S(add2(hip, rot2(p, stoop))));
      cel(ctx, path().poly(tail), { fill: fill.scarf, shade: shadeK, lw: lw * 0.9, seed: sd + 35 });
    }
    // neck
  }
  function neck() {
    const nw = H * 0.03;
    const a = S(add2(shoulder, rot2([0, -hd * 0.02], stoop))), b = S(neckTop);
    const np = limbOutline([a, b], [nw * s, nw * s * 0.95]);
    cel(ctx, path().cr(np, true), { fill: cs.skin || COL.skin, shade: shadeK, lw: lw * 0.9, seed: sd + 36 });
  }
  function headDraw() {
    const hv = P0.headView || (view === 'side' ? 'profile' : view);
    const hc = S(headC);
    drawHead(ctx, { x: hc[0], y: hc[1], s: hd * s / 100, view: hv, f, tilt: f * (stoop * 0.5 + P0.neck * 0.5 + (cs.stoop || 0)), e: o.e, cs, seed: sd + 100, hat: o.hat });
  }
  // ---- sitting: thighs forward along the seat ----
  if (P0.sit) { P0.lN = P0.lN[0] ? P0.lN : [1.5, 1.45]; P0.lF = P0.lF[0] ? P0.lF : [1.45, 1.4]; }

  // draw order. o.layer: undefined = all, 'body' = no arms, 'arms' = arms only (far arm clipped to y > o.clipY)
  if (view === 'back') {
    if (o.layer !== 'arms') { if (o.layer !== 'body') { arm('F'); arm('N'); } if (!o.noLegs) { leg('F'); leg('N'); } body(); neck(); headDraw(); }
    return { head: S(headC), shoulder: S(shoulder) };
  }
  if (o.layer === 'arms') {
    ctx.save(); if (o.clipY !== undefined) { ctx.beginPath(); ctx.rect(0, o.clipY, W * 3, H * 3); ctx.clip(); }
    const aF2 = arm('F'); ctx.restore();
    const aN2 = arm('N');
    return { handN: aN2.hs, handF: aF2.hs };
  }
  const aF = (o.farArm !== false && o.layer !== 'body') ? arm('F') : null;
  if (!o.noLegs) leg('F');
  if (view !== 'side' && !o.noLegs) leg('N');
  body();
  if (view === 'side' && !o.noLegs) leg('N');
  neck(); headDraw();
  const aN = o.layer !== 'body' ? arm('N') : null;
  return { head: S(headC), shoulder: S(shoulder), handN: aN && aN.hs, handF: aF && aF.hs, hip: S(hip) };
}
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// quick silhouette/rim version for night & backlit scenes
function silhouette(ctx, o, rimCol, rimDir) {
  const saveL = LIGHT;
  setLight(Object.assign({}, LIGHT || LIGHTS.night, { id: 'sil' + (LIGHT ? LIGHT.id : '') + (o.silTone || ''), key: o.silTone || '#2a2848', k: 0.92, sat: 0.4 }));
  const r = figure(ctx, o);
  setLight(saveL);
  return r;
}

// ---------- close-up hands (top-down, back of hand visible) ----------
// pointing along +x. o: {glove, curl 0..1 (fingers over an edge), spread, skin, flip}
function bigHand(ctx, x, y, ang, s, o = {}) {
  const M = T(Mtr(x, y), Mrot(ang), Msc(s, (o.flip ? -1 : 1) * s));
  const fill = o.glove ? COL.glove : (o.skin || COL.skin);
  const lw = Math.max(1.5, 3.2 * Math.sqrt(s));
  const sh = shadeBy(8 * s);
  const c = o.curl || 0, sp = o.spread || 0;
  // sleeve / cuff
  if (o.glove) cel(ctx, path().cr([[-80, -28], [-22, -30], [-20, 30], [-80, 28], [-96, 0]], true), { M, fill: COL.gloveDk, shade: sh, lw, seed: 810 });
  else cel(ctx, path().cr([[-110, -30], [-24, -30], [-22, 30], [-110, 30]], true), { M, fill: o.sleeve || COL.rust, shade: sh, lw, seed: 810 });
  // one silhouette: back of hand, four fingers as a scalloped edge, thumb tucked along the side
  const tipX = [60, 70, 72, 66].map(v => v - c * 22), tipY = [24 + sp * 6, 9 + sp * 2, -6 - sp * 2, -20 - sp * 6];
  const pts = [[-24, 27], [8, 32], [30, 32], [tipX[0] - 6, tipY[0] + 6], [tipX[0], tipY[0]], [tipX[0] - 5, tipY[0] - 6],
    [tipX[1] - 3, tipY[1] + 6], [tipX[1] + 1, tipY[1]], [tipX[1] - 3, tipY[1] - 6], [tipX[2] - 3, tipY[2] + 6], [tipX[2] + 1, tipY[2]], [tipX[2] - 3, tipY[2] - 6],
    [tipX[3] - 3, tipY[3] + 6], [tipX[3] + 1, tipY[3]], [tipX[3] - 6, tipY[3] - 6], [34, -30], [18, -32],
    [30 - c * 6, -44 - sp * 6], [38 - c * 8, -50 - sp * 8], [32 - c * 8, -56 - sp * 8], [16, -48], [-4, -36], [-24, -27]];
  cel(ctx, path().cr(pts, true, 0.35), { M, fill, shade: sh, lw, seed: 811 });
  // finger separations + knuckle hints
  for (let i = 0; i < 3; i++) { const yy = (tipY[i] + tipY[i + 1]) / 2; line(ctx, path().m(36, yy * 0.8).q((36 + Math.min(tipX[i], tipX[i + 1])) / 2, yy, Math.min(tipX[i], tipX[i + 1]) - 8, yy), { M, lw: lw * 0.55, seed: 812 + i, alpha: 0.8 }); }
  line(ctx, path().m(14, -30).q(6, -24, 0, -26), { M, lw: lw * 0.5, seed: 816, alpha: 0.7 });
  if (!o.glove) { for (let i = 0; i < 4; i++) cel(ctx, path().ellipse(tipX[i] - 7, tipY[i], 4.5, 4), { M, fill: '#f8dcc8', lw: lw * 0.35, seed: 820 + i, alpha: 0.9 }); }
  else { line(ctx, path().m(-16, -22).q(10, -26, 28, -18), { M, lw: lw * 0.4, seed: 831, alpha: 0.5 }); line(ctx, path().m(-16, 22).q(10, 26, 28, 20), { M, lw: lw * 0.4, seed: 832, alpha: 0.5 }); }
}

// ---------- the sorting arm: pale, rounded, polite ----------
// side view. base at (x,y). a1 = shoulder angle from vertical, a2 = elbow bend. s scale. lamp 0..1
function sortArm(ctx, x, y, s, a1, a2, o = {}) {
  const lw = Math.max(1.4, 3 * s);
  const shell = o.shell || '#e9e4d6', joint = '#b9b4a8', sh = shadeBy(14 * s);
  const L1 = 230 * s, L2 = 200 * s;
  // pedestal
  cel(ctx, path().cr([[x - 44 * s, y], [x - 36 * s, y - 120 * s], [x + 36 * s, y - 120 * s], [x + 44 * s, y]], true, 0.2), { fill: '#8e948a', shade: sh, lw, seed: 850 });
  const sp = [x, y - 150 * s];
  cel(ctx, path().ellipse(x, y - 130 * s, 50 * s, 26 * s), { fill: joint, shade: sh, lw, seed: 851 });
  const el = [sp[0] + Math.sin(a1) * L1, sp[1] - Math.cos(a1) * L1];
  const wr = [el[0] + Math.sin(a1 + a2) * L2, el[1] - Math.cos(a1 + a2) * L2];
  const seg = (a, b, w0, w1, seed) => cel(ctx, path().cr(limbOutline([a, lerp2(a, b, 0.5), b], [w0, (w0 + w1) / 2, w1]), true), { fill: shell, shade: sh, lw, seed });
  seg(sp, el, 34 * s, 28 * s, 852);
  cel(ctx, path().ellipse(sp[0], sp[1], 30 * s, 30 * s), { fill: joint, shade: sh, lw, seed: 853 });
  seg(el, wr, 26 * s, 20 * s, 854);
  cel(ctx, path().ellipse(el[0], el[1], 26 * s, 26 * s), { fill: joint, shade: sh, lw, seed: 855 });
  // wrist head with the little amber lamp, and two soft pads
  const ha = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
  const M = T(Mtr(wr[0], wr[1]), Mrot(ha), Msc(s));
  cel(ctx, path().cr([[-10, -24], [30, -22], [40, 0], [30, 22], [-10, 24]], true), { M, fill: shell, shade: sh, lw, seed: 856 });
  const g = o.grip || 0;
  [-1, 1].forEach((k, i) => cel(ctx, path().cr([[34, k * (12 + 10 * (1 - g))], [74, k * (12 + 10 * (1 - g))], [78, k * (22 + 10 * (1 - g))], [34, k * (24 + 10 * (1 - g))]], true), { M, fill: '#6a6e6a', lw: lw * 0.8, seed: 857 + i }));
  const lp = Mapp(M, [4, -10]);
  const la = o.lamp !== undefined ? o.lamp : 0.7;
  ctx.fillStyle = mix('#8a5a20', '#ffb040', la); ctx.beginPath(); ctx.arc(lp[0], lp[1], 6 * s, 0, TAU); ctx.fill();
  glow(ctx, lp[0], lp[1], 40 * s * (0.5 + la), '#ffa030', 0.6 * la);
  return { wr, el, head: Mapp(M, [56, 0]), ang: ha };
}

// ---------- bust for close-ups: shoulders turned with the head ----------
// (hx,hy) head centre, s = px per head unit, f facing. outfit: work|home|coat|old|night
function bust(ctx, hx, hy, s, f, outfit, o = {}) {
  const M = T(Mtr(hx, hy - 8 * s), Msc(f * s, s));
  const lw = Math.max(2, 1.7 * s);
  const sh = shadeBy(Math.min(12, 3 * s));
  const skin = o.skin || COL.skin;
  const top = outfit === 'work' ? COL.rust : outfit === 'coat' ? COL.coatWinter : outfit === 'old' ? '#8a6a8a' : outfit === 'night' ? '#6a5a7a' : outfit === 'gold' ? '#6a8aa0' : COL.rust;
  // neck (behind the collar)
  cel(ctx, path().cr([[-26, 26], [16, 36], [22, 64], [24, 92], [-30, 92], [-30, 50]], true), { M, fill: skin, shade: [sh[0] * 1.5, sh[1] * 1.5], lw, seed: 1900 });
  // torso: near shoulder (left, toward -x) broad, far shoulder foreshortened
  const body = path().cr([[-128, 270], [-118, 130], [-90, 94], [-38, 74], [26, 76], [70, 92], [94, 132], [104, 270]], true);
  cel(ctx, body, { M, fill: top, shade: sh, lw: lw * 1.1, seed: 1901 });
  // crew collar
  cel(ctx, path().cr([[-40, 70], [-8, 90], [30, 74], [26, 84], [-6, 102], [-46, 80]], true), { M, fill: darken(top, 0.12), lw, seed: 1902 });
  if (outfit === 'work') { // hi-vis straps over both shoulders + reflective band
    cel(ctx, path().cr([[-104, 270], [-104, 136], [-78, 96], [-54, 86], [-70, 140], [-72, 270]], true, 0.3), { M, fill: COL.vest, shade: sh, lw, seed: 1903 });
    cel(ctx, path().cr([[84, 270], [80, 140], [60, 96], [42, 88], [52, 150], [54, 270]], true, 0.3), { M, fill: COL.vest, shade: sh, lw, seed: 1904 });
    cel(ctx, path().rect(-106, 210, 36, 14), { M, fill: COL.vestBand, lw: lw * 0.7, seed: 1905 });
  }
  if (outfit === 'coat') cel(ctx, path().cr([[-60, 66], [30, 66], [44, 96], [-10, 120], [-70, 96]], true), { M, fill: COL.scarf, shade: sh, lw, seed: 1906 });
  if (outfit === 'old' || outfit === 'night') cel(ctx, path().cr([[-136, 272], [-122, 170], [-92, 124], [-40, 140], [0, 176], [60, 150], [96, 160], [110, 272]], true), { M, fill: o.shawl || COL.blanket, shade: sh, lw, seed: 1907 });
  if (outfit === 'home' || outfit === 'gold') line(ctx, path().m(-8, 102).q(-12, 180, -4, 262), { M, lw: lw * 0.8, seed: 1908 });
}
