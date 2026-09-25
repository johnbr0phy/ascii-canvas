// ---------------------------------------------------------------------------
// Scenes: one function per shot. (ctx, t = seconds into the shot, shot)
// ---------------------------------------------------------------------------
const SCENES = {};
const horizonBG = () => cached('horizon', W, H, (x) => {
    gradWash(x, 0, 0, W, H, [[0, '#05051a'], [0.55, '#141433'], [0.85, '#2e2a66'], [1, '#3a3470']], { seed: 1, blot: 20, blotA: 0.15 });
    glow(x, 1180, 900, 700, '#5a4a9a', 0.35, 'screen');
    const r = mulberry(9); let px = -20; const pts = [[-20, H + 10]];
    while (px < W + 40) { const ww = 80 + r() * 140, hh = 860 + r() * 80; pts.push([px, hh], [px + ww * 0.5, hh - 20 - r() * 40], [px + ww, hh]); if (r() < 0.45) pts.push([px + ww * 0.7, hh - 10], [px + ww * 0.7, hh - 60], [px + ww * 0.76, hh - 60], [px + ww * 0.76, hh - 10]); px += ww; }
    pts.push([W + 40, H + 10]); paint(x, pts, '#0a0a1e', { seed: 2, edge: 0.1 });
    for (let i = 0; i < 16; i++) { const wx = r() * W, wy = 900 + r() * 150; x.fillStyle = '#ffcf7a'; x.fillRect(wx, wy, 8, 10); glow(x, wx + 4, wy + 5, 30, '#ffb050', 0.3, 'screen'); }
  });
const goldCloth = () => cached('clothTop_gold', W, H, (x) => {
    const M = KMOOD.gold; paint(x, rectPts(-10, -10, W + 20, H + 20), M.cloth, { seed: 1, blots: 26, top: darken(M.cloth, 0.06) });
    for (let i = 0; i < 26; i++) bgLine(x, [[i * 80, 0], [i * 80, H]], darken(M.cloth, 0.12), 26, 0.18, i);
    for (let i = 0; i < 16; i++) bgLine(x, [[0, i * 80], [W, i * 80]], darken(M.cloth, 0.12), 26, 0.18, 40 + i);
    glow(x, 1500, 100, 1100, '#fff0c0', 0.35, 'screen');
  });
const titleBG = () => cached('title_bg', W, H, (x) => { gradWash(x, 0, 0, W, H, [[0, '#0d0c24'], [0.6, '#1a1840'], [1, '#231d4a']], { seed: 7, blot: 30, blotA: 0.25 }); granulate(x, 0, 0, W, H, 0.4); });
const _dry = mkCanvas(W, H).getContext('2d');
const dry = fn => { _dry.save(); const r = fn(_dry); _dry.restore(); return r; };
// draw the telescope so that its eyepiece sits exactly at (ex, ey)
function telescopeEyeAt(ctx, ex, ey, o) {
  const r = dry(c => telescope(c, Object.assign({}, o, { x: 0, y: 0 })));
  return telescope(ctx, Object.assign({}, o, { x: ex - r.eyepiece[0], y: ey - r.eyepiece[1] }));
}
// year mark, hand-lettered small in a corner, writes itself on
function yearMark(ctx, t, year, col = '#f4e6c8', x = 90, y = 1000) {
  const rv = ease(0.4, 1.6, t);
  letter(ctx, year, x, y, { size: 64, font: 'CaveatBrush', color: col, reveal: rv, seed: +year, alpha: 0.92 * (1 - ease(4.6, 5.6, t) * 0) });
}
// Nell's scanning cycle: reach, scan, turn, place. ph 0..1
function scanPose(ph) {
  const reach = Math.sin(ph * TAU) * 0.5 + 0.5;
  return { aN: [0.5 + reach * 0.9, 0.9 - reach * 0.5], aF: [0.8 + reach * 0.5, 1.2 - reach * 0.4], lean: 0.12 + reach * 0.06, neck: 0.25, gripN: 0.7, gripF: 0.7 };
}
SCENES.S03 = (ctx, t, shot) => {
  setLight(LIGHTS.sodium); setLightDir(0.15, -1);
  const u = t / shot.dur, camX = lerp(-0.2, 0.25, easeIO(u));
  const cam = Object.assign({}, WH.cam, { x: camX });
  const P = persp(cam);
  ctx.drawImage(warehouseBG('night'), -150 - camX * 90, 0);
  sodiumLamps(ctx, t, P);
  // lamp cones with dust in them
  for (let k = 0; k < 3; k++) {
    const Z = 3.6 + k * 10, X = -1.2; const a = P([X, 6.1, Z]), b1 = P([X - 1.8, 0, Z]), b2 = P([X + 1.8, 0, Z]);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const g = ctx.createLinearGradient(a[0], a[1], a[0], b1[1]); g.addColorStop(0, 'rgba(255,170,80,0.22)'); g.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(a[0] - 10, a[1]); ctx.lineTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(a[0] + 10, a[1]); ctx.closePath(); ctx.fill();
    ctx.clip(); dust(ctx, 60, [b1[0], a[1], b2[0] - b1[0], b1[1] - a[1]], t + k * 10, { col: '#ffd9a0', alpha: 0.8, seed: 20 + k, size: 1.4 + (2 - k) * 0.5 });
    ctx.restore();
  }
  // Nell at the line
  const Z = 4.2, np = P([-1.4, 0, Z]);
  const sc = cam.f * 1.62 / Z / 620;
  const ph = (q12(t) / 1.4) % 1;
  figure(ctx, { who: 'nell', age: 49, x: np[0], y: np[1], s: sc, f: 1, view: 'side', outfit: 'work', e: 'focus', pose: scanPose(ph) });
  // scanner red line
  const hp = P([-0.95, 1.0, Z]);
  if (ph > 0.4 && ph < 0.55) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = 'rgba(255,40,30,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hp[0], hp[1]); ctx.lineTo(hp[0] + 30, hp[1] + 16); ctx.stroke(); glow(ctx, hp[0] + 20, hp[1] + 10, 18, '#ff3020', 0.6); ctx.restore(); }
  conveyor(ctx, P, t, { X: -0.95, speed: 0.9 });
  // foreground haze
  vignette(ctx, 0.55, '#120c08');
  yearMark(ctx, t, '2027');
};
function mug(ctx, x, y, col, t, steamOn = true) {
  paint(ctx, rectPts(x - 26, y - 50, 52, 58), col, { seed: 400, top: lighten(col, 0.1) });
  ctx.save(); ctx.strokeStyle = rgba(darken(col, 0.3), 0.8); ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x + 30, y - 22, 14, -1.3, 1.3); ctx.stroke(); ctx.restore();
  if (steamOn) steam(ctx, x, y - 50, t, 0.35, 9);
}
// Nell at the far side of the kitchen table, mug in both hands
function nellAtTable(ctx, t, o) {
  const x = o.x || 930, s = o.s || 0.98;
  const base = { who: 'nell', age: o.age || 49, x, y: 1110, s, f: o.f || 1, view: o.view || '3q', outfit: o.outfit || 'home', e: o.e || 'neutral', noLegs: true,
    pose: Object.assign({ hip: [0, -190], lean: 0.12, neck: 0.2, aN: [0.45, 1.25], aF: [0.55, 1.1], gripN: 0.8, gripF: 0.8 }, o.pose || {}) };
  chair(ctx, x - 20, 1000, 0.95, darken(KMOOD[o.mood].wood, 0.05), 330);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 1000); ctx.clip();
  figure(ctx, Object.assign({}, base, { layer: 'body' }));
  ctx.restore();
  kitchenTable(ctx, o.mood);
  if (o.beforeArms) o.beforeArms();
  const r = figure(ctx, Object.assign({}, base, { layer: 'arms', clipY: 840 }));
  if (o.mugCol) mug(ctx, (r.handN[0] + r.handF[0]) / 2 + 6, Math.max(r.handN[1], r.handF[1]) + 30, o.mugCol, t);
  return r;
}
SCENES.S08 = (ctx, t, shot) => {
  const mood = 'dawn', era = 2027;
  setLight(LIGHTS.dawn); setLightDir(0.8, -0.6);
  ctx.drawImage(kitchenBG(mood, era), 0, 0);
  kitchenShelf(ctx, era, mood);
  kettle(ctx, t, true, KMOOD[mood]);
  const boil = t < 3.0 ? ease(0, 2.5, t) : 1 - ease(3.0, 4.2, t);
  steam(ctx, 1690, 400, t, 0.3 + boil * 1.2, 3);
  // she sits down into frame with her tea; eyes close
  if (t > 3.0) {
    const sitT = easeOut(inv(3.0, 4.0, t));
    nellAtTable(ctx, t, { mood, outfit: 'coat', e: { name: 'tired', blink: ease(5.2, 6.0, t) * 0.92 },
      pose: { hip: [0, lerp(-300, -190, sitT)], lean: 0.12 + ease(4.4, 6, t) * 0.08, neck: 0.2 + ease(4.4, 6, t) * 0.15, aN: [0.35, 1.05], aF: [0.2, 1.25] }, mugCol: '#e8e4d8' });
  } else { chair(ctx, 910, 1000, 0.95, darken(KMOOD[mood].wood, 0.05), 330); kitchenTable(ctx, mood); }
  vignette(ctx, 0.35, '#2a2a24');
};

// ============================== COLD OPEN ==============================
// the hall cupboard: shared by S01 and S19. blade: {x0 (top x of the crack light), w (width)}
function cupboardInterior(ctx, t, blade, o = {}) {
  const draw = (lightId) => {
    setLight(LIGHTS[lightId]); setLightDir(0.7, -0.7);
    // back wall + shelf
    const dark = lightId === 'cupboard';
    ctx.fillStyle = dark ? '#0f0c0b' : '#6a5238'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(cupboardBG(dark), 0, 0);
    // coats hanging on the left
    [[140, '#3a4a5a'], [330, '#6a3a2a'], [500, '#4a4a3a']].forEach(([x, c], i) => {
      line(ctx, path().m(x - 70, 110).q(x, 70, x + 70, 110).m(x, 80).l(x, 40), { lw: 3, seed: 1190 + i, color: '#6a6060' });
      cel(ctx, path().cr([[x - 30, 90], [x + 30, 90], [x + 95, 130], [x + 110, 420], [x + 100, 760], [x - 100, 770], [x - 110, 420], [x - 95, 130]], true), { fill: c, shade: shadeBy(18), lw: 4, seed: 1200 + i });
      line(ctx, path().m(x, 110).l(x + 6, 740), { lw: 2.5, seed: 1205 + i, alpha: 0.6 });
    });
    // boots on the floor
    [[1500, '#3a2a22'], [1620, '#3a2a22']].forEach(([x, c], i) => cel(ctx, path().cr([[x, 820], [x + 70, 820], [x + 72, 980], [x + 150, 1000], [x + 150, 1040], [x - 6, 1040]], true), { fill: c, shade: shadeBy(10), lw: 4, seed: 1210 + i }));
    // the wooden accessory case on the shelf
    cel(ctx, path().rect(1280, 250, 300, 110), { fill: COL.wood, shade: shadeBy(10), lw: 4, seed: 1220 });
    cel(ctx, path().rect(1410, 290, 40, 26), { fill: COL.brass, lw: 3, seed: 1221 });
    // the telescope: folded tripod, leaning, tube across the frame
    const g = o.glint !== undefined ? o.glint : null;
    telescope(ctx, { x: 980, y: 520, s: 1.45, alt: 0.3, az: -0.45, pitch: 0.2, folded: true, yaw: 1.2, cracked: o.cracked !== false, polish: 0.15, lw: 3.4, lightDir: [0.7, -0.7], seed: 40 });
    if (o.after) o.after(lightId);
  };
  draw('cupboard');
  // the blade of light from the door crack: a wedge from upper right falling to lower left
  const b = blade;
  const poly = [[b.x0, -20], [b.x0 + b.w, -20], [b.x1 + b.w1, H + 20], [b.x1, H + 20]];
  ctx.save(); tracePts(ctx, poly); ctx.clip();
  draw('blade');
  ctx.globalCompositeOperation = 'screen';
  const gg = ctx.createLinearGradient(b.x0, 0, b.x1, H); gg.addColorStop(0, 'rgba(255,220,160,0.35)'); gg.addColorStop(1, 'rgba(255,200,130,0.12)');
  ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
  dust(ctx, 90, [Math.min(b.x0, b.x1) - 40, 0, Math.abs(b.x0 - b.x1) + b.w + 160, H], t, { col: '#fff0c8', alpha: 0.9, seed: 31, size: 2.2, vx: -4, vy: 3 });
  ctx.restore();
  // soft edge of the blade
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(10px)'; ctx.globalAlpha = 0.25; tracePts(ctx, poly); ctx.fillStyle = '#ffd8a0'; ctx.fill(); ctx.filter = 'none'; ctx.restore();
}
function cupboardBG(dark) {
  return cached('cup_' + dark, W, H, (x) => {
    const base = dark ? '#171210' : '#8a6a48';
    paint(x, rectPts(-10, -10, W + 20, H + 20), base, { top: dark ? '#0e0b0a' : '#7a5a3a', bot: dark ? '#1d1714' : '#9a7a52', seed: 1, blots: 24, blotA: 0.4 });
    paint(x, rectPts(1180, 360, 740, 22), dark ? '#2a2018' : '#b08a58', { seed: 2 });
    paint(x, rectPts(-10, 980, W + 20, 110), dark ? '#120e0c' : '#6a5038', { seed: 3 });
    for (let i = 0; i < 12; i++) bgLine(x, [[i * 170 + 40, 0], [i * 170 + 40, 980]], dark ? '#0a0808' : '#6a4a30', 2, 0.4, i);
  });
}
SCENES.S01 = (ctx, t, shot) => {
  const push = lerp(1.32, 1.42, t / shot.dur);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2 - 40, -H / 2 + 60);
  // the blade creeps left and widens a hair; the glint follows it down the tube
  const k = easeIO(inv(0.2, 5.6, t));
  const blade = { x0: lerp(1450, 1060, k), w: lerp(26, 44, k), x1: lerp(860, 420, k), w1: lerp(60, 110, k) };
  cupboardInterior(ctx, t, blade, { glint: null });
  // the crack in the eyepiece catches the light
  const ep = [636, 660];
  const cg = ease(3.9, 4.5, t) * (1 - ease(5.2, 6, t) * 0.4);
  if (cg > 0) { glow(ctx, ep[0], ep[1], 120, '#fff4d0', 0.5 * cg); glow(ctx, ep[0], ep[1], 22, '#ffffff', 0.9 * cg); }
  ctx.restore();
  vignette(ctx, 0.75, '#050303');
  if (t < 0.4) { ctx.fillStyle = rgba('#000000', 1 - t / 0.4); ctx.fillRect(0, 0, W, H); }
};
SCENES.S02 = (ctx, t, shot) => {
  setLight(LIGHTS.end);
  ctx.drawImage(titleBG(), 0, 0);
  starfield(ctx, t, 140, 3, { twinkleOne: [1180, 360], dim: 0.35 });
  const rv = ease(0.3, 2.6, t);
  letter(ctx, 'After Work', W / 2, 590, { size: 190, font: 'CaveatBrush', color: '#f6e7c6', align: 'center', reveal: rv, seed: 21, rot: 0.04, double: true });
  // a small hand-drawn underline, like a pen lifting
  const ul = ease(2.6, 3.3, t);
  if (ul > 0) line(ctx, path().m(760, 640).q(960, 652, 760 + 400 * ul, 636 + 6 * ul), { color: '#e9c98a', lw: 4, seed: 23, alpha: 0.8 });
  const fade = ease(3.9, 4.5, t);
  if (fade > 0) { ctx.fillStyle = rgba('#000000', fade); ctx.fillRect(0, 0, W, H); }
};
// a star field; one chosen star twinkles properly, the others hold
function starfield(ctx, t, n, seed, o = {}) {
  const r = mulberry(seed); const tt = q12(t);
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * (o.hMax || H), m = Math.pow(r(), 3);
    const a = (o.dim || 0.5) * (0.3 + m * 0.9);
    ctx.fillStyle = rgba('#fff6e0', a); ctx.beginPath(); ctx.arc(x, y, 0.8 + m * 1.8, 0, TAU); ctx.fill();
  }
  if (o.twinkleOne) {
    const [x, y] = o.twinkleOne; const tw = 0.55 + 0.45 * Math.sin(tt * 2.6) * Math.sin(tt * 1.3 + 1);
    glow(ctx, x, y, 40 * tw + 10, '#fff4d8', 0.55 * tw);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#fff8e8', 0.8 * tw); ctx.lineWidth = 1.6;
    const L = 10 + 16 * tw; ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill(); ctx.restore();
  }
}

// ============================== 2027 ==============================
// hands on the belt: shared composition for S04 (her) and S10 (the gripper)
function beltCloseBG(machines) {
  return cached('beltclose' + machines, W, H, (x) => {
    paint(x, rectPts(-10, -10, W + 20, H + 20), '#3a3830', { top: '#2a2622', bot: '#4a463a', seed: 1, blots: 20 });
    // chute on the right, rollers
    paint(x, [[1500, -10], [W + 10, -10], [W + 10, H + 10], [1560, H + 10]], '#6a7060', { seed: 2, top: '#5a6052' });
    for (let i = 0; i < 16; i++) paint(x, rectPts(1530 + i * 0, i * 72 + 10, 400, 22), '#8a9080', { seed: 10 + i, edge: 0.4 });
    // belt edge rails
    paint(x, rectPts(380, -10, 40, H + 20), '#7a8070', { seed: 3 }); paint(x, rectPts(1460, -10, 40, H + 20), '#7a8070', { seed: 4 });
    if (machines) for (let i = 0; i < 3; i++) glow(x, 300 + i * 700, -100, 700, '#dfe8ea', 0.12, 'screen');
  });
}
function beltSurface(ctx, t, speed) {
  ctx.save(); ctx.beginPath(); ctx.rect(420, 0, 1040, H); ctx.clip();
  ctx.fillStyle = lit('#34332e'); ctx.fillRect(420, 0, 1040, H);
  const off = (q12(t) * speed) % 60;
  ctx.strokeStyle = rgba('#1c1c1a', 0.6); ctx.lineWidth = 3;
  for (let y = -60 + off; y < H + 60; y += 60) { ctx.beginPath(); ctx.moveTo(420, y); ctx.lineTo(1460, y); ctx.stroke(); }
  granulate(ctx, 420, 0, 1040, H, 0.5);
  ctx.restore();
}
function parcel(ctx, cx, cy, w, h, ang, col, o = {}) {
  const M = T(Mtr(cx, cy), Mrot(ang));
  cel(ctx, path().rect(-w / 2 + 8, -h / 2 + 10, w, h), { M, fill: '#1a1612', noLine: true, alpha: 0.4, seed: 1400 }); // shadow
  cel(ctx, path().rect(-w / 2, -h / 2, w, h), { M, fill: col, shade: shadeBy(14), lw: 4, seed: 1401 + (o.seed || 0) });
  cel(ctx, path().rect(-w / 2, -14, w, 28), { M, fill: '#d8c088', lw: 2, seed: 1402, alpha: 0.9 }); // tape
  if (o.label !== false) { cel(ctx, path().rect(w * 0.1, -h * 0.4, w * 0.3, h * 0.26), { M, fill: '#f2eee2', lw: 2, seed: 1403 });
    for (let i = 0; i < 6; i++) line(ctx, path().m(w * 0.12 + i * 7, -h * 0.36).l(w * 0.12 + i * 7, -h * 0.2), { M, lw: 2.2, seed: 1404 + i, color: '#222' }); }
}
function redLine(ctx, y, on) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = rgba('#ff2a20', on ? 0.95 : 0.55); ctx.lineWidth = on ? 4 : 2.5; ctx.beginPath(); ctx.moveTo(420, y); ctx.lineTo(1460, y); ctx.stroke();
  glow(ctx, 940, y, on ? 520 : 300, '#ff2a20', on ? 0.25 : 0.1); ctx.restore();
}
// one sort cycle. returns parcel state + hand targets. p in 0..1
function sortCycle(p) {
  const arrive = easeOut(inv(0, 0.25, p)), turn = easeIO(inv(0.3, 0.55, p)), push = easeIn(inv(0.62, 0.9, p));
  const cx = 940 + push * 900, cy = lerp(-250, 520, arrive);
  const ang = turn * Math.PI / 2 + 0.12 * (1 - arrive);
  return { cx, cy, ang, grip: inv(0.22, 0.32, p) * (1 - inv(0.85, 0.95, p)), scan: p > 0.46 && p < 0.56 };
}
SCENES.S04 = (ctx, t, shot) => {
  setLight(LIGHTS.sodium); setLightDir(-0.2, -1);
  ctx.drawImage(beltCloseBG(false), 0, 0);
  beltSurface(ctx, t, 140);
  const per = 1.6, ph = ((t - 0.2) % per + per) % per / per, k = Math.floor((t - 0.2) / per);
  const c = sortCycle(ph);
  const cols = ['#c49460', '#b08050', '#caa06a', '#a8784a'];
  const w = 360, h = 250;
  parcel(ctx, c.cx, c.cy, w, h, c.ang, cols[(k + 4) % 4], { seed: k });
  redLine(ctx, 520, c.scan);
  // her hands: come in from the bottom, grip the sides, turn it, push it right
  const g = c.grip, dx = Math.cos(c.ang), dy = Math.sin(c.ang);
  const hwL = [lerp(560, c.cx - dx * 200, g), lerp(1150, c.cy - dy * 200 + 60, g)];
  const hwR = [lerp(1320, c.cx + dx * 200, g), lerp(1150, c.cy + dy * 200 + 60, g)];
  bigHand(ctx, hwL[0], hwL[1], -1.2 + c.ang * 0.6, 1.9, { glove: true, curl: g, flip: false });
  bigHand(ctx, hwR[0], hwR[1], -1.9 + c.ang * 0.6 + Math.PI * 0.0, 1.9, { glove: true, curl: g, flip: true });
  vignette(ctx, 0.6, '#140c06');
};
SCENES.S10 = (ctx, t, shot) => {
  setLight(LIGHTS.led); setLightDir(-0.2, -1);
  ctx.drawImage(beltCloseBG(true), 0, 0);
  beltSurface(ctx, t, 280);
  const per = 0.8, ph = ((t + 0.2) % per) / per, k = Math.floor((t + 0.2) / per);
  const c = sortCycle(ph);
  const cols = ['#c49460', '#b08050', '#caa06a', '#a8784a'];
  parcel(ctx, c.cx, c.cy, 360, 250, c.ang, cols[k % 4], { seed: k });
  redLine(ctx, 520, c.scan);
  // the gripper comes down from above: two soft pads either side of the box
  const g = c.grip, dx = Math.cos(c.ang), dy = Math.sin(c.ang);
  const gc = [lerp(940, c.cx, g), lerp(260, c.cy, g)];
  const shell = '#e9e4d6';
  cel(ctx, path().cr(limbOutline([[gc[0] - 40, -120], [gc[0] - 10, gc[1] - 170], [gc[0], gc[1] - 60]], [70, 64, 58]), true), { fill: shell, shade: shadeBy(18), lw: 4, seed: 1500 });
  const M = T(Mtr(gc[0], gc[1]), Mrot(c.ang));
  cel(ctx, path().ellipse(0, 0, 90, 70), { M, fill: shell, shade: shadeBy(18), lw: 4, seed: 1501 });
  [-1, 1].forEach((s2, i) => cel(ctx, path().rect(s2 * (200 + (1 - g) * 40) - 20, -70, 40, 140), { M, fill: '#6a6e6a', shade: shadeBy(8), lw: 3.5, seed: 1502 + i }));
  [-1, 1].forEach((s2, i) => cel(ctx, path().rect(s2 * 70, -12, s2 * (130 + (1 - g) * 40), 24), { M, fill: shell, lw: 3, seed: 1504 + i }));
  const lp = Mapp(M, [0, -30]); ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.arc(lp[0], lp[1], 11, 0, TAU); ctx.fill(); glow(ctx, lp[0], lp[1], 60, '#ffa030', 0.6);
  // her gloved hand: enters at the bottom left, hesitates, withdraws
  const e = ease(1.8, 2.8, t) * (1 - ease(3.8, 4.7, t));
  if (e > 0.01) bigHand(ctx, lerp(200, 640, e), lerp(1300, 820, e), -0.85, 1.9, { glove: true, curl: 0.1, spread: 0.1 });
  vignette(ctx, 0.5, '#0c0e10');
};
SCENES.S05 = (ctx, t, shot) => {
  setLight(LIGHTS.sodium); setLightDir(0.1, -1);
  ctx.drawImage(cached('s05bg', W, H, (x) => {
    gradWash(x, 0, 0, W, H, [[0, '#2a1a10'], [0.5, '#3a2616'], [1, '#1a120c']], { seed: 5, blot: 20, blotA: 0.3 });
    const r = mulberry(9); for (let i = 0; i < 14; i++) glow(x, r() * W, r() * 600, 40 + r() * 90, r() < 0.7 ? '#ff9a3a' : '#c8d8c0', 0.25 + r() * 0.25, 'screen');
    granulate(x, 0, 0, W, H, 0.4);
  }), 0, 0);
  const cs = charSpec('nell', 49);
  const look = ease(2.6, 3.6, t);
  const blink = t > 1.1 && t < 1.55 ? 1 : 0;
  const hx = 900, hy = 560 - look * 12, s = 4.6;
  bust(ctx, hx, hy, s, 1, 'work');
  drawHead(ctx, { x: hx, y: hy, s, view: '3q', cs, tilt: -0.05 - look * 0.1, e: { name: 'tired', blink, look: [0.1 * look, -look], lid: lerp(0.5, 0.3, look), mouth: lerp(-0.15, 0.05, ease(3.8, 4.8, t)) } });
  // warm top light on the hair
  glow(ctx, hx - 60, hy - 330, 420, '#ffb060', 0.35, 'screen');
  vignette(ctx, 0.6, '#0c0604');
};
SCENES.S06 = (ctx, t, shot) => {
  ctx.drawImage(cached('skylight', W, H, (x) => {
    gradWash(x, 0, 0, W, H, [[0, '#0e1430'], [1, '#1a2244']], { seed: 3, blot: 16, blotA: 0.2 });
    const r = mulberry(4);
    for (let i = 0; i < 30; i++) { const cx = r() * W, cy = r() * H, rr = 150 + r() * 250; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, rgba('#4a4436', 0.35 + r() * 0.2)); g.addColorStop(1, rgba('#4a4436', 0)); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
    granulate(x, 0, 0, W, H, 0.7);
    // the clear patch someone once wiped
    x.save(); x.globalCompositeOperation = 'destination-out'; const g = x.createRadialGradient(1120, 420, 20, 1120, 420, 260); g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); x.restore();
    x.globalCompositeOperation = 'destination-over'; x.fillStyle = '#0c1230'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
    // wired glass: diamond mesh
    x.strokeStyle = 'rgba(20,20,24,0.55)'; x.lineWidth = 2;
    for (let i = -30; i < 60; i++) { x.beginPath(); x.moveTo(i * 60, 0); x.lineTo(i * 60 + H, H); x.stroke(); x.beginPath(); x.moveTo(i * 60, 0); x.lineTo(i * 60 - H, H); x.stroke(); }
    // frame bars
    paint(x, rectPts(-10, -10, W + 20, 80), '#1a1612', { seed: 5 }); paint(x, rectPts(-10, H - 80, W + 20, 90), '#1a1612', { seed: 6 });
    paint(x, rectPts(640, -10, 60, H + 20), '#1c1814', { seed: 7 }); paint(x, rectPts(1500, -10, 60, H + 20), '#1c1814', { seed: 8 });
    // a dead leaf
    paint(x, [[400, 700], [470, 650], [540, 690], [520, 740], [450, 760]], '#3a2a1a', { seed: 9 });
    glow(x, W / 2, H + 200, 900, '#ff9a3a', 0.2, 'screen');
  }), 0, 0);
  // the one star, through the clear patch
  const tt = q12(t); const tw = 0.6 + 0.4 * Math.sin(tt * 2.1) * Math.sin(tt * 0.9 + 0.5);
  glow(ctx, 1120, 400, 70 * tw + 20, '#fff4d8', 0.45 * tw);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#fff8e8', 0.7 * tw); ctx.lineWidth = 2;
  const L = 16 + 22 * tw; ctx.beginPath(); ctx.moveTo(1120 - L, 400); ctx.lineTo(1120 + L, 400); ctx.moveTo(1120, 400 - L); ctx.lineTo(1120, 400 + L); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(1120, 400, 3.2, 0, TAU); ctx.fill(); ctx.restore();
  vignette(ctx, 0.5, '#000');
};
SCENES.S07 = (ctx, t, shot) => {
  setLight(LIGHTS.dawn); setLightDir(0.9, -0.3);
  ctx.drawImage(cached('clockbg', W, H, (x) => {
    paint(x, rectPts(-10, -10, W + 20, H + 20), '#6f7a66', { top: '#5d6a57', bot: '#7e8a72', seed: 1, blots: 20 });
    for (let i = 0; i < 12; i++) bgLine(x, [[0, i * 96], [W, i * 96]], '#4a5446', 2, 0.3, i);
    // the open door on the right: grey-green dawn
    paint(x, rectPts(1560, -10, 380, H + 20), '#c9d3bd', { top: '#e8e0c8', bot: '#aab4a0', seed: 2 });
    glow(x, 1700, 400, 900, '#e8ecd8', 0.35, 'screen');
    // card rack on the left
    paint(x, rectPts(160, 160, 360, 700), '#8a8a7a', { seed: 3 });
    for (let j = 0; j < 7; j++) for (let i = 0; i < 3; i++) { paint(x, rectPts(180 + i * 115, 190 + j * 95, 100, 70), '#5a5a4e', { seed: 10 + i + j * 3 }); paint(x, rectPts(195 + i * 115, 150 + j * 95, 70, 100), '#e8e2cc', { seed: 40 + i + j * 3 }); }
  }), 0, 0);
  // the time clock
  cel(ctx, path().cr([[760, 170], [1320, 170], [1340, 190], [1340, 880], [1320, 900], [760, 900], [740, 880], [740, 190]], true, 0.2), { fill: '#8e8a80', shade: shadeBy(18), lw: 5, seed: 1700 });
  cel(ctx, path().ellipse(1040, 380, 160, 160), { fill: '#f0ead8', lw: 4, seed: 1701 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line(ctx, path().m(1040 + Math.cos(a) * 135, 380 + Math.sin(a) * 135).l(1040 + Math.cos(a) * 150, 380 + Math.sin(a) * 150), { lw: 3, seed: 1702 + i }); }
  const mm = 2 + (t > 1.6 ? 0 : 0), ha = (6 + mm / 60) / 12 * TAU - Math.PI / 2, ma = mm / 60 * TAU - Math.PI / 2;
  line(ctx, path().m(1040, 380).l(1040 + Math.cos(ha) * 80, 380 + Math.sin(ha) * 80), { lw: 7, seed: 1720 });
  line(ctx, path().m(1040, 380).l(1040 + Math.cos(ma) * 120, 380 + Math.sin(ma) * 120), { lw: 5, seed: 1721 });
  cel(ctx, path().rect(900, 610, 280, 40), { fill: '#2a2824', lw: 3, seed: 1722 }); // slot
  // the card goes in; CLUNK at 1.6
  const inT = easeOut(inv(0.3, 1.4, t)), clunk = t > 1.6 ? 1 : 0;
  const cy = lerp(1200, 520 + clunk * 18, inT) + (t > 1.6 && t < 1.75 ? 10 : 0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 630, W, H); ctx.clip();
  cel(ctx, path().rect(930, cy, 220, 330), { fill: '#efe8d2', lw: 4, seed: 1730 });
  for (let i = 0; i < 6; i++) line(ctx, path().m(950, cy + 60 + i * 44).l(1130, cy + 60 + i * 44), { lw: 1.5, seed: 1731 + i, color: '#8aa0b0', alpha: 0.8 });
  letter(ctx, 'N. HOLLIS', 950, cy + 44, { size: 28, font: 'Kalam', color: '#3a3028', seed: 5 });
  if (clunk) letter(ctx, '06:02', 1020, cy + 280, { size: 34, font: 'Patrick', color: '#6a2a8a', seed: 6 });
  ctx.restore();
  // her bare hand holding the card, then letting go after the clunk
  const hy = cy + 300 + ease(1.8, 2.6, t) * 200;
  hand(ctx, 1040, hy, -Math.PI / 2 - 0.2, 150, { skin: COL.skin, grip: 0.6, seed: 1740 });
  cel(ctx, path().cr(limbOutline([[1080, hy + 40], [1110, hy + 200], [1140, H + 60]], [56, 60, 64]), true), { fill: COL.rust, shade: shadeBy(20), lw: 5, seed: 1741 });
  vignette(ctx, 0.4, '#1a2018');
};
SCENES.S09 = (ctx, t, shot) => {
  setLight(LIGHTS.led); setLightDir(0.1, -1);
  ctx.drawImage(warehouseBG('machines'), -120, -60);
  ctx.fillStyle = rgba('#2a2e2a', 0.25); ctx.fillRect(0, 0, W, H);
  // floor + conveyor seen side-on
  paint(ctx, rectPts(-10, 820, W + 20, 280), '#5a6052', { seed: 1800, top: '#4a5046' });
  const beltY = 690;
  // arms stand behind the belt
  const walkX = lerp(-160, 1500, t / shot.dur);
  const armXs = [230, 640, 1050, 1460, 1870];
  armXs.forEach((ax, i) => {
    const near = Math.abs(walkX - ax) < 190;
    const cyc = q12(t) * 1.3 + i * 0.37;
    const hold = ease(-40, 0, -Math.abs(walkX + 40 - ax) + 0) ; // 1 when she is right there
    const p = (cyc % 1);
    const dip = Math.sin(p * TAU) * 0.5 + 0.5;
    let a1 = 0.55 + dip * 0.25, a2 = 1.5 + dip * 0.35;
    // the nearest one pauses and lifts a little out of her way
    const pauseK = clamp(1 - Math.abs(walkX - ax) / 220);
    a1 = lerp(a1, 0.2, pauseK); a2 = lerp(a2, 1.2, pauseK);
    sortArm(ctx, ax - 80, beltY - 10, 0.95, a1, a2, { grip: dip > 0.7 ? 1 : 0, lamp: 0.5 + pauseK * 0.5 });
  });
  // the belt
  cel(ctx, path().rect(-20, beltY, W + 40, 30), { fill: '#3a3a36', lw: 3, seed: 1810 });
  cel(ctx, path().rect(-20, beltY + 30, W + 40, 70), { fill: '#7a8070', shade: [0, -6], lw: 3, seed: 1811 });
  for (let i = 0; i < 12; i++) cel(ctx, path().rect(i * 170 + 40, beltY + 100, 20, 220), { fill: '#6a7060', lw: 2.5, seed: 1812 + i });
  const off = (q12(t) * 120) % 260;
  for (let i = -1; i < 9; i++) { const px = i * 260 + off; cel(ctx, path().rect(px, beltY - 70, 120, 70), { fill: ['#c49460', '#b08050', '#caa06a'][((i % 3) + 3) % 3], shade: shadeBy(8), lw: 3, seed: 1830 + i }); }
  // Nell walks the line, side view
  const wp = (q12(t) * 1.6) % 1, sw = Math.sin(wp * TAU);
  figure(ctx, { who: 'nell', age: 49, x: walkX, y: 1000 - Math.abs(Math.cos(wp * TAU)) * 6, s: 0.92, f: 1, view: 'side', outfit: 'work', e: { name: 'neutral', look: [clamp((1050 - walkX) / 300, -1, 1) * 0.3, -0.4] },
    pose: { lN: [sw * 0.42, Math.max(0, -sw) * 0.5 + 0.08], lF: [-sw * 0.42, Math.max(0, sw) * 0.5 + 0.08], aN: [-sw * 0.35, 0.3], aF: [sw * 0.35, 0.3], lean: 0.04, neck: -0.05 } });
  vignette(ctx, 0.5, '#101412');
};

// ============================== THE FEAR ==============================
// top-down on the kitchen table: a letter held in two hands. Shared by S11 and S18.
function letterOnTable(ctx, t, o) {
  const M = KMOOD[o.mood];
  ctx.drawImage(cached('clothTop_' + o.mood, W, H, (x) => {
    paint(x, rectPts(-10, -10, W + 20, H + 20), M.cloth, { seed: 1, blots: 26, top: darken(M.cloth, 0.06) });
    for (let i = 0; i < 26; i++) bgLine(x, [[i * 80, 0], [i * 80, H]], darken(M.cloth, 0.12), 26, 0.18, i);
    for (let i = 0; i < 16; i++) bgLine(x, [[0, i * 80], [W, i * 80]], darken(M.cloth, 0.12), 26, 0.18, 40 + i);
    // a mug ring from years of tea
    x.strokeStyle = rgba(darken(M.cloth, 0.3), 0.3); x.lineWidth = 5; x.beginPath(); x.arc(1560, 260, 70, 0.3, 5.9); x.stroke();
  }), 0, 0);
  const push = o.push || 0;
  const tr = o.tremble ? noise1(q12(t) * 7) * 2.5 : 0;
  setLightDir(-0.3, -1);
  // hands first: fingers go under the paper
  bigHand(ctx, 560 + tr, 1090 + tr, -1.35, 2.4, { skin: COL.skin, curl: 0.1, sleeve: o.sleeve || COL.rust });
  bigHand(ctx, 1380 + tr, 1090 + tr, -1.8, 2.4, { skin: COL.skin, curl: 0.1, flip: true, sleeve: o.sleeve || COL.rust });
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + push, 1 + push); ctx.rotate(-0.03); ctx.translate(-W / 2, -H / 2 + push * 120);
  ctx.translate(tr, tr * 0.6);
  // paper
  const px = 520, py = 90, pw = 880, ph = 980;
  cel(ctx, path().rect(px + 14, py + 18, pw, ph), { fill: '#000', noLine: true, alpha: 0.18, raw: true, seed: 2000 });
  cel(ctx, path().cr([[px, py], [px + pw, py + 4], [px + pw - 3, py + ph], [px + 4, py + ph - 2]], true, 0.1), { fill: COL.paper, lw: 2.5, seed: 2001 });
  // fold creases
  line(ctx, path().m(px + 10, py + ph / 3).l(px + pw - 10, py + ph / 3 + 3), { lw: 1.4, alpha: 0.3, seed: 2002 });
  line(ctx, path().m(px + 10, py + ph * 2 / 3).l(px + pw - 10, py + ph * 2 / 3 - 2), { lw: 1.4, alpha: 0.3, seed: 2003 });
  if (o.head) letter(ctx, o.head, px + 60, py + 80, { size: 30, font: o.headFont || 'Kalam', color: '#6a5a4a', seed: 2004, alpha: 0.9 });
  letterLines(ctx, o.lines, px + 60, py + 190, 72, { size: 44, font: o.font || 'Kalam', color: '#2a2a3a', seed: 2010, rot: 0.03 });
  if (o.after) o.after(px, py, pw, ph);
  ctx.restore();
  // thumbs on top of the paper
  [[600, 985, -1.0], [1330, 985, -2.1]].forEach(([x, y, a], i) => {
    const M = T(Mtr(x + tr, y + tr), Mrot(a), Msc(2.4));
    cel(ctx, path().cr([[-20, -12], [18, -12], [30, -4], [30, 6], [18, 12], [-20, 12]], true), { M, fill: COL.skin, shade: shadeBy(8), lw: 4, seed: 2020 + i });
    line(ctx, path().m(16, -6).q(22, 0, 16, 6), { M, lw: 2, alpha: 0.5, seed: 2022 + i });
  });
}
SCENES.S11 = (ctx, t, shot) => {
  setLight(LIGHTS.greyday);
  letterOnTable(ctx, t, { mood: 'grey', push: easeIO(inv(0, shot.dur, t)) * 0.12, tremble: true,
    head: 'PARCELWORKS  ·  EASTGATE DEPOT',
    lines: ['Dear Nell,', 'The new sorting line comes in this autumn.', "I'm sorry to have to tell you that", 'your job will end on 30 November.', 'Thank you for eleven years of', 'careful, good work.', '        Dave (nights)'] });
  vignette(ctx, 0.45, '#1a1e18');
};
SCENES.S12 = (ctx, t, shot) => {
  setLight(LIGHTS.greyday); setLightDir(0.8, -0.5);
  ctx.save(); ctx.filter = 'blur(7px)'; ctx.drawImage(kitchenBG('grey', 2027), -300, -120, W * 1.3, H * 1.3); ctx.filter = 'none'; ctx.restore();
  ctx.fillStyle = rgba('#8d9582', 0.2); ctx.fillRect(0, 0, W, H);
  const cs = charSpec('nell', 49);
  const hx = 820, hy = 520, s = 4.4;
  const handUp = ease(2.2, 3.2, t);
  bust(ctx, hx, hy, s, 1, 'home');
  drawHead(ctx, { x: hx, y: hy, s, view: '3q', cs, tilt: 0.06, e: { name: 'worry', look: [0.3, 0.9], lid: 0.45, blink: (t > 3.9 && t < 4.2) ? 1 : 0 } });
  if (handUp > 0) bigHand(ctx, lerp(1000, 930, handUp), lerp(1350, 840, handUp), lerp(-1.2, -1.95, handUp), 1.9, { skin: COL.skin, curl: 0.35, sleeve: COL.rust });
  vignette(ctx, 0.5, '#1a1e18');
};
SCENES.S13 = (ctx, t, shot) => {
  setLight(LIGHTS.greyday); setLightDir(0.8, -0.5);
  // the kitchen, seen small through the doorway
  const ks = 0.62, kx = 560, ky = 190;
  ctx.fillStyle = '#1a1c18'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.rect(kx + 120, ky - 40, 1020, 900); ctx.clip();
  ctx.translate(kx, ky); ctx.scale(ks, ks);
  ctx.drawImage(kitchenBG('grey', 2027), 0, 0); kitchenShelf(ctx, 2027, 'grey');
  // rain on the window, starting at 1.5 s
  const rain = ease(1.2, 3.0, t);
  if (rain > 0) { ctx.save(); ctx.beginPath(); ctx.rect(1090, 210, 420, 340); ctx.clip(); const r = mulberry(4), tt = q12(t);
    ctx.strokeStyle = rgba('#e8ecf0', 0.55 * rain); ctx.lineWidth = 2;
    for (let i = 0; i < 70 * rain; i++) { const x = 1090 + r() * 420, y = 210 + ((r() * 340 + tt * (500 + r() * 300)) % 360); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 18); ctx.stroke(); }
    ctx.restore(); }
  chair(ctx, 910, 1000, 0.95, darken(KMOOD.grey.wood, 0.05), 330);
  figure(ctx, { who: 'nell', age: 49, x: 930, y: 1110, s: 0.98, view: 'back', outfit: 'home', noLegs: true, layer: 'body', pose: { hip: [0, -190], lean: 0.25, neck: 0.4 } });
  kitchenTable(ctx, 'grey');
  ctx.restore();
  // hall walls + door frame, dark
  paint(ctx, [[-10, -10], [kx + 120, -10], [kx + 120, H + 10], [-10, H + 10]], '#23261f', { seed: 2100, top: '#1a1c18' });
  paint(ctx, [[kx + 1140, -10], [W + 10, -10], [W + 10, H + 10], [kx + 1140, H + 10]], '#23261f', { seed: 2101 });
  paint(ctx, rectPts(kx + 1140, -10, W, ky - 50), '#23261f', { seed: 2102 });
  paint(ctx, rectPts(kx + 90, -10, 40, H + 20), '#4a4238', { seed: 2103 });
  paint(ctx, rectPts(kx + 1130, -10, 40, H + 20), '#4a4238', { seed: 2104 });
  // Sam: back view, close, half-hidden by the frame
  figure(ctx, { who: 'sam', age: 9, x: 560, y: 1500, s: 2.3, view: 'back', outfit: 'school', pose: { neck: 0.05, aN: [0.1, 0.4], aF: [-0.1, 0.1] } });
  vignette(ctx, 0.55, '#0a0c0a');
};

// ============================== WINTER 2028 ==============================
SCENES.S14 = (ctx, t, shot) => {
  setLight(LIGHTS.winter); setLightDir(0.9, -0.3);
  ctx.drawImage(streetBG('winter'), 0, 0);
  streetLamp(ctx, true);
  const walk = t / shot.dur, wx = lerp(260, 1150, walk), wp = (q12(t) * 1.4) % 1, sw = Math.sin(wp * TAU);
  figure(ctx, { who: 'nell', age: 50, x: wx, y: 790, s: 0.34, f: 1, view: 'side', outfit: 'coat', pose: { lN: [sw * 0.38, Math.max(0, -sw) * 0.5 + 0.08], lF: [-sw * 0.38, Math.max(0, sw) * 0.5 + 0.08], aN: [0.25, 0.9], aF: [-sw * 0.3, 0.3], lean: 0.1, neck: 0.15 } });
  // her shopping bag
  cel(ctx, path().rect(wx + 14, 700, 24, 30), { fill: '#e8e4d8', lw: 1.5, seed: 2200 });
  breath(ctx, wx + 22, 590, t, 1, 1.3, 3);
  snow(ctx, t, 260, { wind: 40 });
  yearMark(ctx, t, '2028', '#eef2fa');
  vignette(ctx, 0.45, '#0a1020');
};
SCENES.S15 = (ctx, t, shot) => {
  const mood = 'winter';
  setLight(LIGHTS.winterIn); setLightDir(0.8, -0.6);
  ctx.drawImage(kitchenBG(mood, 2028), 0, 0);
  kitchenShelf(ctx, 2028, mood);
  // frost creeping in the window corners
  ctx.save(); ctx.globalCompositeOperation = 'screen'; [[1090, 210], [1510, 210], [1090, 550], [1510, 550]].forEach(([x, y]) => glow(ctx, x, y, 90, '#e8f0ff', 0.22)); ctx.restore();
  kettle(ctx, t, false, KMOOD[mood]);
  // Sam at the right end in his hat
  chair(ctx, 1300, 1000, 0.8, darken(KMOOD[mood].wood, 0.05), 340);
  figure(ctx, { who: 'sam', age: 10, x: 1300, y: 1090, s: 0.95, f: -1, view: '3q', outfit: 'coat', noLegs: true, hat: '#3a6a8a', e: { name: 'focus', look: [0, 1] }, pose: { hip: [0, -170], lean: 0.25, neck: 0.35, aN: [0.5, 1.1], aF: [0.6, 1.0] } });
  const r = nellAtTable(ctx, t, { mood, outfit: 'coat', x: 820, e: { name: 'focus', look: [0.2, 1], lid: 0.45 }, pose: { lean: 0.22, neck: 0.4, aN: [0.3 + Math.sin(q12(t) * 6) * 0.03, 1.2], aF: [0.4, 1.3] },
    beforeArms: () => { // notebook of sums + bills
      cel(ctx, path().cr([[860, 900], [1080, 890], [1090, 960], [870, 972]], true, 0.1), { fill: '#f0ece0', lw: 2, seed: 2300 });
      for (let i = 0; i < 4; i++) line(ctx, path().m(880, 910 + i * 14).l(1060 + i * 3, 906 + i * 14), { lw: 1.4, seed: 2301 + i, color: '#5a5a7a', alpha: 0.7 });
      cel(ctx, path().rect(1110, 880, 110, 70), { fill: '#e8e0f0', lw: 2, seed: 2305 });
    } });
  // a pencil in her hand
  line(ctx, path().m(r.handN[0] + 4, r.handN[1] - 4).l(r.handN[0] + 34, r.handN[1] - 30), { lw: 5, color: lit('#c9a24a'), seed: 2310 });
  breath(ctx, 900, 700, t + 0.5, 1, 2.2, 5);
  vignette(ctx, 0.5, '#0a1020');
};
function hallExteriorBG() {
  return cached('hallExt', W, H, (x) => {
    gradWash(x, 0, 0, W, 700, [[0, '#0e1430'], [1, '#2c3a64']], { seed: 1, blot: 12 });
    paint(x, rectPts(-10, 760, W + 20, 330), '#c8d2e8', { seed: 2, top: '#aebfdc' });
    // the hall: brick, gabled, three tall arched windows
    paint(x, [[430, 330], [960, 150], [1490, 330], [1490, 780], [430, 780]], '#5a4a5a', { seed: 3, top: '#3a3048' });
    paint(x, [[410, 340], [960, 130], [1510, 340], [1490, 350], [960, 160], [430, 350]], '#eef2f8', { seed: 4 });
    [[560, 420], [1250, 420]].forEach(([wx, wy], i) => {
      paint(x, [[wx, wy + 60], [wx + 55, wy], [wx + 110, wy + 60], [wx + 110, wy + 260], [wx, wy + 260]], '#ffcf7a', { seed: 5 + i, top: '#ffe2a8' });
      glow(x, wx + 55, wy + 150, 300, '#ffa040', 0.4, 'screen');
      bgLine(x, [[wx + 55, wy + 10], [wx + 55, wy + 260]], '#5a3a2a', 4, 0.8, 7 + i); bgLine(x, [[wx, wy + 140], [wx + 110, wy + 140]], '#5a3a2a', 4, 0.8, 9 + i);
    });
    letter(x, 'ST. JUDE’S HALL', 960, 300, { size: 44, font: 'Patrick', color: '#e8e0d0', align: 'center', seed: 12 });
    // snowy path
    paint(x, [[880, 780], [1040, 780], [1180, 1090], [740, 1090]], '#dfe6f4', { seed: 13 });
  });
}
SCENES.S16 = (ctx, t, shot) => {
  setLight(LIGHTS.winter); setLightDir(0.2, -1);
  ctx.drawImage(hallExteriorBG(), 0, 0);
  // the doors: closed, then opening at 3.0 with warm light spilling onto the snow
  const op = ease(2.8, 3.6, t);
  cel(ctx, path().rect(880, 560, 160, 220), { fill: '#ffd28a', noLine: true, seed: 2400, alpha: op, raw: true });
  if (op > 0) { glow(ctx, 960, 700, 360, '#ffb050', 0.55 * op); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba('#ffc070', 0.35 * op); ctx.beginPath(); ctx.moveTo(880, 780); ctx.lineTo(1040, 780); ctx.lineTo(1260, 1090); ctx.lineTo(660, 1090); ctx.closePath(); ctx.fill(); ctx.restore(); }
  cel(ctx, path().rect(880 - op * 70, 560, 80, 220), { fill: '#5a3a2a', lw: 3, seed: 2401 });
  cel(ctx, path().rect(960 + op * 70, 560, 80, 220), { fill: '#5a3a2a', lw: 3, seed: 2402 });
  // neighbours arriving with dishes; silhouettes against the snow
  const r = mulberry(8);
  for (let i = 0; i < 5; i++) {
    const side = i % 2 ? 1 : -1, start = r() * 1.5, sp = 0.12 + r() * 0.05;
    const k = clamp((t - start) * sp); const x = side < 0 ? lerp(-80, 820, k) : lerp(2000, 1100, k);
    const wp = (q12(t) * 1.3 + i * 0.3) % 1, sw = Math.sin(wp * TAU) * (k < 1 ? 1 : 0);
    silhouette(ctx, { who: 'n', age: i * 3 + 1, x, y: 860 + i * 18, s: 0.42, f: -side, view: 'side', outfit: 'coat', pose: { lN: [sw * 0.4, 0.2], lF: [-sw * 0.4, 0.2], aN: [0.9, 1.2] } });
  }
  // Nell and Sam at the door: hesitate, then go in
  const go = ease(4.0, 5.4, t);
  const ny = lerp(900, 790, go), ns = lerp(0.5, 0.38, go);
  silhouette(ctx, { who: 'sam', age: 10, x: 990 + go * 10, y: ny + 8, s: ns * 1.1, view: 'back', outfit: 'coat' }, null);
  silhouette(ctx, { who: 'nell', age: 50, x: 920 + go * 20, y: ny, s: ns * 1.02, view: 'back', outfit: 'coat', pose: { aN: [0.3, 0.2] } });
  snow(ctx, t, 200, { wind: 25, seed: 21 });
  vignette(ctx, 0.5, '#050814');
};
SCENES.S17 = (ctx, t, shot) => {
  setLight(LIGHTS.hallWarm); setLightDir(-0.5, -1);
  const pan = easeIO(inv(0, shot.dur, t)) * 520;
  ctx.save(); ctx.translate(-pan, 0);
  ctx.drawImage(cached('board', W + 600, H, (x, w, h) => {
    paint(x, rectPts(-10, -10, w + 20, h + 20), '#d8b888', { seed: 1, top: '#e8c898', blots: 20 });
    paint(x, rectPts(160, 100, w - 320, 880), '#b88a58', { seed: 2, blots: 30, blotA: 0.4 }); // cork
    granulate(x, 160, 100, w - 320, 880, 0.9);
    paint(x, rectPts(140, 80, w - 280, 30), '#8a5a3a', { seed: 3 }); paint(x, rectPts(140, 970, w - 280, 30), '#8a5a3a', { seed: 4 });
  }), 0, 0);
  const cards = [
    [260, 180, 360, 230, '#fff4d8', 'Kalam', ['BIKES FIXED', 'ask Des, no. 14'], -0.05],
    [300, 480, 380, 300, '#e8f0ff', 'Caveat', ["I'll mind your kids", "on Tuesdays if you'll", 'teach me to cook?', '  Maggie'], 0.04],
    [700, 150, 340, 250, '#f4e0e8', 'Patrick', ['Lifts to the hospital', 'Mon & Thurs', 'ring Pat'], 0.03],
    [760, 440, 560, 400, '#fffbe8', 'CaveatBrush', ['LEARNING', 'TOGETHER', 'Thursdays, 7pm', 'bring a question'], -0.02],
    [1360, 190, 380, 260, '#e8f4e0', 'Kalam', ['Spare veg from', 'the allotment,', 'help yourself'], 0.06],
    [1400, 520, 360, 240, '#fff0e0', 'Gochi', ['Anyone good', 'with forms?', '  Jean, no. 9'], -0.04],
    [1800, 200, 320, 220, '#e0ecf4', 'Patrick', ['SOUP', 'Wednesdays'], 0.02],
    [1820, 500, 340, 300, '#f8f0d8', 'Caveat', ["What's next?", 'Come and talk.', 'Everyone', 'welcome'], -0.03],
  ];
  cards.forEach(([x, y, w, h, c, font, lines, rot], i) => {
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-x - w / 2, -y - h / 2);
    cel(ctx, path().rect(x + 8, y + 10, w, h), { fill: '#3a2a1a', noLine: true, alpha: 0.25, raw: true, seed: 2500 + i });
    cel(ctx, path().rect(x, y, w, h), { fill: c, lw: 2, seed: 2510 + i });
    const big = i === 3;
    letterLines(ctx, lines, x + 26, y + (big ? 90 : 62), big ? 78 : 50, { size: big ? 70 : 40, font, color: ['#2a2a4a', '#6a2a2a', '#2a4a2a', '#3a2a5a'][i % 4], seed: 2520 + i * 7 });
    cel(ctx, path().ellipse(x + w / 2, y + 16, 9, 9), { fill: ['#c0473a', '#3a6aa0', '#e0b030'][i % 3], lw: 2, seed: 2530 + i });
    ctx.restore();
  });
  ctx.restore();
  // tea urn steam drifting across the left edge
  steam(ctx, 60, 1000, t, 0.8, 12);
  vignette(ctx, 0.45, '#2a1a0a');
};
SCENES.S18 = (ctx, t, shot) => {
  setLight(LIGHTS.thaw);
  const sun = ease(1.5, 4.5, t);
  letterOnTable(ctx, t, { mood: 'thaw', push: 0.04,
    head: 'A LETTER TO EVERY HOUSEHOLD', headFont: 'Patrick',
    lines: ['From March, a payment will', 'be made to every household,', 'every month.', '', "You don't need to apply.", 'It is yours.'] });
  // winter sun crossing the table: the thaw
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = sun * 0.5;
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,236,190,0.9)'); g.addColorStop(1, 'rgba(255,236,190,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-100, -100); ctx.lineTo(900, -100); ctx.lineTo(1700, H + 100); ctx.lineTo(300, H + 100); ctx.closePath(); ctx.fill(); ctx.restore();
  vignette(ctx, 0.4, '#1a1e18');
};

// ============================== THE TURN, 2029 ==============================
SCENES.S19 = (ctx, t, shot) => {
  setLight(LIGHTS.hallNight); setLightDir(-0.9, -0.3);
  const push = lerp(1, 1.05, t / shot.dur);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);
  ctx.drawImage(cached('hall', W, H, (x) => {
    paint(x, rectPts(-10, -10, W + 20, H + 20), '#2a2e44', { seed: 1, top: '#1e2236', blots: 20 });
    paint(x, rectPts(-10, 900, W + 20, 200), '#3a3448', { seed: 2 }); // runner carpet
    paint(x, [[300, 1090], [700, 900], [1400, 900], [1800, 1090]], '#5a3a4a', { seed: 3 });
    // stair banister at right
    for (let i = 0; i < 8; i++) paint(x, rectPts(1500 + i * 50, 380 - i * 30, 12, 520 + i * 30), '#3a2e30', { seed: 4 + i });
    paint(x, [[1480, 380], [1920, 140], [1920, 170], [1480, 410]], '#4a3a36', { seed: 20 });
    // coat hooks + a mirror
    paint(x, rectPts(1150, 260, 180, 240), '#4a4a60', { seed: 21 }); paint(x, rectPts(1165, 275, 150, 210), '#6a7090', { seed: 22 });
  }), 0, 0);
  // the cupboard door (left of centre); opens from 2.4 s, revealing the interior
  const op = easeIO(inv(2.4, 4.2, t));
  const dx = 420, dy = 150, dw = 460, dh = 760;
  // interior through the opening (the cold-open image, now from outside)
  ctx.save(); ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip();
  ctx.translate(dx, dy); ctx.scale(dw / W * 1.5, dh / H * 1.05); ctx.translate(-420, 0);
  const blade = { x0: 1200, w: 40 + op * 200, x1: 700, w1: 100 + op * 400 };
  cupboardInterior(ctx, t + 10, blade, {});
  ctx.restore();
  // the door panel swinging toward camera-left
  const pw = dw * (1 - op * 0.82);
  cel(ctx, path().poly([[dx, dy], [dx + pw, dy - op * 40], [dx + pw, dy + dh + op * 40], [dx, dy + dh]]), { fill: '#5a4a4a', shade: shadeBy(10), lw: 4, seed: 2600 });
  if (pw > 60) cel(ctx, path().ellipse(dx + pw - 40, dy + dh / 2, 12, 12), { fill: COL.brass, lw: 2.5, seed: 2601 });
  // the thin blade of streetlight from the front-door glass, lying across the door
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(255,200,130,0.3)'; ctx.beginPath(); ctx.moveTo(1400, 120); ctx.lineTo(1450, 120); ctx.lineTo(520, 1080); ctx.lineTo(430, 1080); ctx.closePath(); ctx.fill(); ctx.restore();
  // Nell: dressing gown, standing at the door, hand to the knob
  const reach = ease(1.0, 2.2, t);
  figure(ctx, { who: 'nell', age: 51, x: 1080 - op * 40, y: 1060, s: 1.12, f: -1, view: '3q', outfit: 'winterIn', fill: { top: '#6a5a7a', coat: false }, e: { name: 'soft', look: [0.5, 0.1] },
    pose: { aN: [lerp(0.1, 1.2, reach * (1 - ease(4.4, 5.4, t) * 0.8)), lerp(0.2, 0.3, reach)], aF: [0.05, 0.2], lean: 0.05 + op * 0.06, neck: ease(4.4, 5.4, t) * 0.15 } });
  ctx.restore();
  vignette(ctx, 0.65, '#05060e');
};
SCENES.S20 = (ctx, t, shot) => {
  setLight(LIGHTS.gold); setLightDir(-0.6, -0.8);
  ctx.drawImage(goldCloth(), 0, 0);
  // the telescope tube lying on the table (top edge), the open accessory case below
  telescope(ctx, { x: 1180, y: 170, s: 1.1, alt: 0, az: -0.05, pitch: 0.9, noTripod: true, cracked: true, polish: 0.2, seed: 41 });
  cel(ctx, path().rect(300, 420, 900, 560), { fill: COL.wood, shade: shadeBy(14), lw: 4, seed: 2700 }); // case base
  cel(ctx, path().rect(330, 450, 840, 500), { fill: '#6a2a3a', lw: 3, seed: 2701 }); // velvet
  [[430, 560], [620, 560], [810, 560]].forEach(([x, y], i) => cel(ctx, path().ellipse(x, y, 60, 60), { fill: '#4a1a2a', lw: 2.5, seed: 2702 + i }));
  cel(ctx, path().ellipse(620, 560, 40, 40), { fill: COL.brass, shade: shadeBy(6), lw: 3, seed: 2705 });
  // the note: pulled out of the lid and unfolded
  const unfold = easeOut(inv(0.8, 2.4, t));
  const nx = 1180, ny = 360, nw = 580, nh = lerp(170, 620, unfold);
  cel(ctx, path().rect(nx + 10, ny + 12, nw, nh), { fill: '#000', noLine: true, alpha: 0.15, raw: true, seed: 2710 });
  cel(ctx, path().cr([[nx, ny], [nx + nw, ny + 6], [nx + nw - 4, ny + nh], [nx + 2, ny + nh - 4]], true, 0.1), { fill: '#efe2c4', lw: 2.5, seed: 2711 });
  if (unfold > 0.6) {
    line(ctx, path().m(nx + 6, ny + nh / 2).l(nx + nw - 6, ny + nh / 2 + 4), { lw: 1.4, alpha: 0.35, seed: 2712 });
    const rv = ease(2.2, 4.4, t);
    letterLines(ctx, ['Nell,', "first clear night I'm off,", "we'll find Saturn.", 'Promise.', '       Dad  x'], nx + 44, ny + 110, 100, { size: 64, font: 'Reenie', color: '#4a4440', seed: 2720, reveal: rv, rot: 0.05 });
  }
  // her fingertips at the edges of the note
  bigHand(ctx, nx - 30, ny + nh * 0.92, 0.1, 1.4, { skin: COL.skin, curl: 0.4, sleeve: '#6a8aa0' });
  bigHand(ctx, nx + nw + 40, ny + nh * 0.92, Math.PI - 0.1, 1.4, { skin: COL.skin, curl: 0.4, flip: true, sleeve: '#6a8aa0' });
  vignette(ctx, 0.35, '#3a2616');
};
SCENES.S21 = (ctx, t, shot) => {
  setLight(LIGHTS.memory); setLightDir(0.9, -0.4);
  ctx.drawImage(backStepBG('sepia', 1987), 0, 0);
  nightSky(ctx, t, { n: 30, dim: 0.35, seed: 5, hMax: 400, twinkle: false });
  // one early star he points at
  glow(ctx, 1460, 180, 30, '#fff8e0', 0.7); ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(1460, 180, 3, 0, TAU); ctx.fill();
  telescope(ctx, { x: 1080, y: 640, s: 0.7, alt: 0.55, az: 0.35, polish: 0.9, cracked: false, seed: 44 });
  const check = ease(3.0, 3.5, t) * (1 - ease(3.9, 4.2, t));
  const leave = ease(4.3, 6.3, t);
  const point = 1 - ease(2.6, 3.0, t);
  // little Nell, 8, looking up
  figure(ctx, { who: 'nell', age: 8, x: 900, y: 960, s: 1.0, f: 1, view: 'side', outfit: 'home', e: { name: 'wonder', look: [0.4, -1] }, pose: { neck: -0.35, aN: [0.3, 0.4], aF: [0.1, 0.3] } });
  // her father: points up, checks his watch, takes his lunch tin, goes to his shift
  const dx = lerp(1230, 2150, leave), wp = (q12(t) * 1.5) % 1, sw = Math.sin(wp * TAU) * (leave > 0 && leave < 1 ? 1 : 0);
  if (leave < 0.3) cel(ctx, path().rect(1360, 880, 90, 56), { fill: '#6a6a6a', shade: shadeBy(8), lw: 3, seed: 2800 }); // lunch tin on the wall
  const r = figure(ctx, { who: 'dad', age: 44, x: dx, y: 1000, s: 1.05, f: leave > 0.02 ? 1 : -1, view: leave > 0.02 ? 'side' : '3q', outfit: 'home', e: { name: leave > 0.02 ? 'neutral' : 'smile', look: [0, -0.6 * point] },
    pose: { aN: leave > 0.02 ? [-sw * 0.3, 0.3] : [lerp(0.2, 2.7, point) + check * 0.6, lerp(0.2, 0.1, point) + check * 1.6], aF: leave > 0.02 ? [0.3, 1.2] : [0.1, 0.2], neck: -0.2 * point + check * 0.3,
      lN: [sw * 0.4, Math.max(0, -sw) * 0.5 + 0.08], lF: [-sw * 0.4, Math.max(0, sw) * 0.5 + 0.08] } });
  if (leave > 0.02 && r.handF) cel(ctx, path().rect(r.handF[0] - 20, r.handF[1] - 6, 70, 44), { fill: '#6a6a6a', shade: shadeBy(8), lw: 3, seed: 2800 });
  // memory: soft oval edge, faint flicker
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(120,80,40,1)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.fillStyle = rgba('#f4e0b0', 0.05 + 0.03 * hash1(drawingIndex(TIME))); ctx.fillRect(0, 0, W, H);
};
// the small warm light: the only way the AI ever appears
function warmLight(ctx, x, y, s, t, k = 1) {
  const tt = q12(t), pulse = 0.85 + 0.15 * Math.sin(tt * 1.6);
  glow(ctx, x, y + 10 * s, 420 * s * k, '#ffb040', 0.32 * pulse * k);          // light pooling on the cloth
  cel(ctx, path().ellipse(x + 8 * s, y + 30 * s, 62 * s, 14 * s), { fill: '#5a3010', noLine: true, alpha: 0.25, raw: true, seed: 2900 });
  const peb = path().cr([[x - 56 * s, y + 18 * s], [x - 50 * s, y - 10 * s], [x - 10 * s, y - 30 * s], [x + 40 * s, y - 20 * s], [x + 58 * s, y + 12 * s], [x + 10 * s, y + 30 * s]], true);
  cel(ctx, peb, { fill: '#f6b85a', raw: true, lw: 2.6 * s, seed: 2901, line: '#7a4a1a', shade: [-6 * s, -8 * s], shadeCol: '#d8883a' });
  glow(ctx, x - 4 * s, y - 4 * s, 60 * s, '#ffe0a0', 0.85 * pulse * k);         // the light inside the stone
  glow(ctx, x - 12 * s, y - 12 * s, 18 * s, '#fffaf0', 0.8 * k);
}
// a drawing that draws itself on a page: list of polylines, progress 0..1
function drawOn(ctx, strokes, p, col, lw = 2.5, seed = 1) {
  const total = strokes.length;
  strokes.forEach((s, i) => {
    const k = clamp(p * total - i); if (k <= 0) return;
    const n = Math.max(2, Math.ceil(s.length * k));
    const pp = path().m(...s[0]); for (let j = 1; j < n; j++) pp.l(...s[j]);
    line(ctx, pp, { color: col, lw, seed: seed + i, amp: 0.5 });
  });
}
function circlePts(cx, cy, r, n = 24, a0 = 0, a1 = TAU) { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; }
SCENES.S22 = (ctx, t, shot) => {
  // days pass: gold morning -> afternoon -> lamp-lit evening -> gold again
  const day = t / shot.dur;
  setLight(day < 0.66 ? LIGHTS.gold : LIGHTS.hallWarm); setLightDir(-0.6, -0.8);
  ctx.drawImage(goldCloth(), 0, 0);
  const warm = Math.sin(day * Math.PI * 2) * 0.5 + 0.5;
  ctx.fillStyle = rgba('#3a2010', 0.25 * (day > 0.55 && day < 0.8 ? 1 : 0)); ctx.fillRect(0, 0, W, H);
  // the book, open
  const bx = 560, by = 220, bw = 900, bh = 640;
  cel(ctx, path().rect(bx - 20, by - 10, bw + 40, bh + 30), { fill: '#6a3a2a', lw: 4, seed: 3000 });
  cel(ctx, path().cr([[bx, by], [bx + bw / 2, by + 16], [bx + bw / 2, by + bh + 10], [bx, by + bh]], true, 0.1), { fill: '#f6eed8', lw: 3, seed: 3001 });
  cel(ctx, path().cr([[bx + bw / 2, by + 16], [bx + bw, by], [bx + bw, by + bh], [bx + bw / 2, by + bh + 10]], true, 0.1), { fill: '#f6eed8', lw: 3, seed: 3002 });
  const pageIdx = Math.min(2, Math.floor(t / (shot.dur / 3))), pp = (t % (shot.dur / 3)) / (shot.dur / 3);
  const ink = '#c9782a';
  const L = bx + 50, R = bx + bw / 2 + 50;
  if (pageIdx === 0) { // the sky: constellations join up, Saturn's path along the ecliptic
    const st = [[L + 60, by + 140], [L + 150, by + 100], [L + 230, by + 170], [L + 300, by + 120], [L + 360, by + 220]];
    st.forEach(([x, y]) => { ctx.fillStyle = '#3a3050'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); });
    drawOn(ctx, [st], pp * 1.5, ink, 3, 3010);
    drawOn(ctx, [circlePts(L + 200, by + 420, 150, 30, Math.PI, TAU)], pp * 1.3 - 0.3, ink, 2.5, 3011);
    letter(ctx, 'where is it?', R + 20, by + 120, { size: 40, font: 'Caveat', color: '#4a3a5a', reveal: clamp(pp * 2), seed: 3 });
    drawOn(ctx, [circlePts(R + 190, by + 380, 110, 30)], pp * 1.4 - 0.4, '#4a3a5a', 2.5, 3012);
  } else if (pageIdx === 1) { // lenses: light bending through glass to a point
    ctx.save(); ctx.strokeStyle = '#3a3050'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(L + 120, by + 300, 24, 140, 0, 0, TAU); ctx.stroke(); ctx.restore();
    const rays = [-100, -50, 0, 50, 100].map(o => [[L - 20, by + 300 + o], [L + 120, by + 300 + o], [L + 360, by + 300]]);
    drawOn(ctx, rays, pp * 1.4, ink, 2.8, 3020);
    letter(ctx, 'focal length', L + 200, by + 520, { size: 36, font: 'Caveat', color: '#4a3a5a', reveal: clamp(pp * 2 - 0.4), seed: 4 });
    // her copy on the right page, slightly wobblier
    ctx.save(); ctx.strokeStyle = '#4a4a5a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(R + 100, by + 300, 20, 110, 0.03, 0, TAU); ctx.stroke(); ctx.restore();
    drawOn(ctx, [-80, 0, 80].map(o => [[R, by + 300 + o], [R + 100, by + 300 + o * 0.9], [R + 330, by + 305]]), pp * 1.3 - 0.3, '#4a4a5a', 2.4, 3030);
  } else { // Saturn, drawn from a photograph, and her question
    drawOn(ctx, [circlePts(L + 200, by + 280, 70, 30)], pp * 1.6, ink, 3, 3040);
    ctx.save(); ctx.translate(L + 200, by + 280); ctx.rotate(-0.3); const rk = clamp(pp * 1.6 - 0.4);
    if (rk > 0) { ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 150, 34, 0, 0, TAU * rk); ctx.stroke(); } ctx.restore();
    letter(ctx, 'how big does it look', R + 10, by + 200, { size: 36, font: 'Caveat', color: '#4a3a5a', reveal: clamp(pp * 2 - 0.2), seed: 5 });
    letter(ctx, 'through a 60mm?', R + 10, by + 250, { size: 36, font: 'Caveat', color: '#4a3a5a', reveal: clamp(pp * 2 - 0.5), seed: 6 });
    letter(ctx, 'small. but real.', R + 40, by + 420, { size: 44, font: 'Caveat', color: ink, reveal: clamp(pp * 2 - 1.0), seed: 7 });
  }
  // page turn at each boundary: a page sweeping over the spine
  const turnP = inv(0, 0.35, (t % (shot.dur / 3)) / (shot.dur / 3) * 3);
  if (pageIdx > 0 && turnP < 1) { const k = easeIO(turnP); const px = bx + bw / 2 + Math.cos(k * Math.PI) * bw / 2;
    cel(ctx, path().poly([[bx + bw / 2, by + 16], [px, by + (1 - Math.abs(Math.cos(k * Math.PI))) * -30], [px, by + bh + (1 - Math.abs(Math.cos(k * Math.PI))) * 20], [bx + bw / 2, by + bh + 10]]), { fill: '#fbf5e4', lw: 3, seed: 3050 }); }
  line(ctx, path().m(bx + bw / 2, by + 16).l(bx + bw / 2, by + bh + 10), { lw: 3, seed: 3051 });
  warmLight(ctx, 360, 690, 1.6, t, 0.9 + 0.3 * Math.max(0, Math.sin(pp * Math.PI)));
  // her hand with a pencil on the right, writing
  const wr = [R + 250 + Math.sin(q12(t) * 5) * 20, by + 470 + Math.cos(q12(t) * 3) * 10];
  line(ctx, path().m(wr[0], wr[1]).l(wr[0] + 130, wr[1] + 80), { lw: 8, color: lit('#c9a24a'), seed: 3060 });
  bigHand(ctx, wr[0] + 150, wr[1] + 130, -2.45, 1.5, { skin: COL.skin, curl: 0.75, sleeve: '#6a8aa0' });
  // a mug, and the plant pot at the corner growing a leaf a day
  mug(ctx, 1600, 330, '#e8e4d8', t, true);
  cel(ctx, path().ellipse(1650, 900, 80, 80), { fill: '#b8643a', lw: 3, seed: 3070 });
  for (let i = 0; i < 3 + Math.floor(day * 6); i++) { const a = i * 2.4; cel(ctx, path().ellipse(1650 + Math.cos(a) * 40, 900 + Math.sin(a) * 40, 34, 16, a), { fill: '#6a9a4a', lw: 2, seed: 3071 + i }); }
  vignette(ctx, 0.35, '#3a2616');
};
SCENES.S23 = (ctx, t, shot) => {
  setLight(LIGHTS.gold); setLightDir(-0.6, -0.8);
  ctx.drawImage(goldCloth(), 0, 0);
  const fixed = t > 2.6;
  const polish = lerp(0.25, 1.0, ease(2.8, 4.8, t));
  const glint = t > 3.0 ? lerp(0.1, 0.95, inv(3.0, 4.8, t)) : null;
  const tel = telescope(ctx, { x: 1250, y: 560, s: 2.5, alt: 0.02, az: -0.08, pitch: 0.55, noTripod: true, cracked: !fixed, polish, glint, seed: 41 });
  // the old eyepiece rolls away at left once swapped
  if (fixed) cel(ctx, path().cr([[190, 820], [300, 800], [310, 860], [200, 880]], true), { fill: COL.brassOld, lw: 3, seed: 3100 });
  // left hand steadies the tube; right hand turns the eyepiece, then polishes with a cloth
  bigHand(ctx, 830, 650, -1.7, 1.6, { skin: COL.skin, curl: 0.55, sleeve: '#6a8aa0' });
  const tw = Math.sin(q12(t) * 9) * 0.15;
  if (t < 2.6) bigHand(ctx, tel.eyepiece[0] + 20, tel.eyepiece[1] + 70, -1.45 + tw, 1.6, { skin: COL.skin, curl: 0.8, flip: true, sleeve: '#6a8aa0' });
  else { const cx = lerp(1000, 1700, (Math.sin(q12(t) * 2.2) * 0.5 + 0.5));
    cel(ctx, path().cr([[cx - 90, 470], [cx + 80, 460], [cx + 110, 560], [cx + 60, 640], [cx - 100, 620]], true), { fill: '#e8dcc0', shade: shadeBy(10), lw: 3.5, seed: 3101 });
    bigHand(ctx, cx + 10, 600, -1.6, 1.6, { skin: COL.skin, curl: 0.7, flip: true, sleeve: '#6a8aa0' }); }
  vignette(ctx, 0.4, '#3a2616');
};

// ============================== SATURN ==============================
SCENES.S24 = (ctx, t, shot) => {
  setLight(LIGHTS.night); setLightDir(-0.9, -0.2); setRim([-4, -2], '#ffc890');
  const tilt = easeIO(inv(0, shot.dur, t)) * 70;
  ctx.save(); ctx.translate(0, tilt);
  ctx.drawImage(backStepBG('night', 2029), 0, 0);
  nightSky(ctx, t, { n: 260, seed: 9, hMax: 700, dim: 0.9 });
  ctx.fillStyle = '#070b1c'; ctx.fillRect(0, -200, W, 200);
  nightSky(ctx, t + 3, { n: 60, seed: 19, hMax: 200, dim: 0.8, twinkle: false });
  // Sam on the step, knees up, looking up
  figure(ctx, { who: 'sam', age: 11, x: 330, y: 905, s: 0.9, f: 1, view: '3q', outfit: 'coat', e: { name: 'wonder', look: [0.4, -0.8] }, pose: { hip: [0, -120], lN: [1.5, 2.4], lF: [1.4, 2.3], aN: [0.6, 1.6], aF: [0.5, 1.7], neck: -0.3, lean: 0.2 } });
  // the telescope, fixed; Nell setting it up
  const tel = telescope(ctx, { x: 1180, y: 690, s: 0.78, alt: 0.62, az: 0.35, polish: 1, cracked: false, seed: 45 });
  const adj = Math.sin(q12(t) * 1.3) * 0.08;
  figure(ctx, { who: 'nell', age: 51, x: 980, y: 1000, s: 1.02, f: 1, view: 'side', outfit: 'home', e: { name: 'focus', look: [0.5, -0.3] }, pose: { aN: [1.4 + adj, 0.5], aF: [1.2, 0.8], lean: 0.12, neck: 0.05 } });
  ctx.restore();
  vignette(ctx, 0.55, '#02030a');
};
function saturn(ctx, x, y, s, o = {}) {
  // tiny, pale gold, rings clearly separate from the ball, shadow of the ball on the rings
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.42); ctx.scale(s, s);
  if (o.blur) ctx.filter = `blur(${o.blur}px)`;
  const ringBack = () => { ctx.beginPath(); ctx.ellipse(0, 0, 64, 17, 0, Math.PI, TAU); };
  ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(230,210,160,0.9)'; ringBack(); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(40,30,20,0.7)'; ctx.beginPath(); ctx.ellipse(0, 0, 58, 15.4, 0, Math.PI, TAU); ctx.stroke();
  const g = ctx.createRadialGradient(-8, -8, 2, 0, 0, 28); g.addColorStop(0, '#fff2cc'); g.addColorStop(0.6, '#e8d094'); g.addColorStop(1, '#a88a50');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(180,140,80,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-25, -5); ctx.lineTo(25, -5); ctx.moveTo(-24, 6); ctx.lineTo(24, 6); ctx.stroke();
  ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(236,216,168,0.95)'; ctx.beginPath(); ctx.ellipse(0, 0, 64, 17, 0, 0, Math.PI); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(40,30,20,0.7)'; ctx.beginPath(); ctx.ellipse(0, 0, 58, 15.4, 0, 0, Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(20,16,12,0.6)'; ctx.beginPath(); ctx.ellipse(20, -12, 10, 4, 0.3, 0, TAU); ctx.fill(); // shadow on the ring
  ctx.restore();
}
SCENES.S25 = (ctx, t, shot) => {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, R = 420;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, '#0e1430'); g.addColorStop(1, '#05070f'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // the sky drifts through the field until she tracks it
  const drift = (1 - easeOut(inv(0.6, 3.2, t))) * 520;
  const focus = 1 - ease(2.2, 3.4, t);
  const r = mulberry(33);
  for (let i = 0; i < 40; i++) { const x = cx - R + r() * 2 * R + drift, y = cy - R + r() * 2 * R, m = r(); ctx.fillStyle = rgba('#dfe6ff', 0.3 + m * 0.5); ctx.beginPath(); ctx.arc(x, y, 0.8 + m * 1.2 + focus * 3, 0, TAU); ctx.fill(); }
  // the air makes it tremble
  const tt = q12(t), jx = noise1(tt * 3.1) * 2.2, jy = noise1(tt * 2.7 + 9) * 2.2, sc = 1 + noise1(tt * 5) * 0.02;
  if (t > 0.9) saturn(ctx, cx + drift + jx, cy + jy, 1.0 * sc, { blur: focus * 7 + 0.4 });
  ctx.restore();
  // the field stop: a soft ring of the eyepiece
  ctx.save(); ctx.strokeStyle = 'rgba(80,90,120,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke(); ctx.restore();
  const vg = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.02); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.85)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
};
SCENES.S26 = (ctx, t, shot) => {
  setLight(LIGHTS.night); setLightDir(-1, -0.3); setRim([-5, -2], '#ffcf8a');
  ctx.save(); ctx.filter = 'blur(4px)'; ctx.drawImage(backStepBG('night', 2029), -500, -520, W * 1.7, H * 1.7); ctx.filter = 'none'; ctx.restore();
  nightSky(ctx, t, { n: 140, seed: 12, hMax: 520, dim: 0.9 });
  glow(ctx, -100, 700, 900, '#ffb050', 0.22, 'screen');
  const back = easeOut(inv(1.3, 2.1, t));       // she pulls back from the eyepiece
  const samIn = easeOut(inv(2.9, 3.7, t));
  const laugh = t > 3.8;
  const beck = t > 2.3 && t < 3.3;
  const nellSpec = (bk) => ({ who: 'nell', age: 51, x: lerp(1010, 1180, bk), y: 1560, s: 1.7, f: -1, view: bk > 0.4 ? '3q' : 'side', outfit: 'home',
    pose: { lean: lerp(0.34, 0.0, bk), neck: lerp(0.2, -0.12, bk), aN: [beck ? 1.5 : 0.3, beck ? 0.5 + Math.sin((t - 2.3) * 10) * 0.35 : 0.4], aF: [0.2, 0.3] } });
  // the eyepiece is fixed in space where her eye was
  const h0 = dry(c => figure(c, nellSpec(0))).head;
  const eyeX = h0[0] - 29 * 1.7 * 1.04 - 14, eyeY = h0[1] - 2;
  telescopeEyeAt(ctx, eyeX, eyeY, { s: 1.35, alt: 0.55, az: Math.PI - 0.3, polish: 1, cracked: false, noTripod: true, seed: 45, pitch: 0.1 });
  // Sam comes in from the left and puts his eye to it, then laughs out loud
  if (samIn > 0) {
    const samSpec = { who: 'sam', age: 11, x: 0, y: 1500, s: 1.65, f: 1, view: 'side', outfit: 'coat', pose: { lean: 0.28, neck: 0.25, aN: [0.9, 1.0], aF: [0.6, 1.0] } };
    const sh = dry(c => figure(c, samSpec)).head;
    const sx = eyeX - (sh[0] + 30 * 1.65 * 0.94) - 12 + (1 - samIn) * -700;
    const sy = 1500 + (eyeY - sh[1] + 2);
    figure(ctx, Object.assign(samSpec, { x: sx, y: sy, view: laugh ? '3q' : 'side', e: laugh ? { name: 'laugh', open: 0.6 + 0.3 * Math.abs(Math.sin(q12(t) * 9)) } : { name: 'focus', blink: 0.85 },
      pose: laugh ? { lean: 0.05, neck: -0.25, aN: [0.9, 1.0], aF: [0.6, 1.0] } : samSpec.pose }));
  }
  const e = t < 1.3 ? { name: 'focus', blink: 0.9 } : laugh ? { name: 'joy', tear: 1 } : { name: 'wonder', tear: ease(1.7, 2.3, t), hi: 2 };
  figure(ctx, Object.assign(nellSpec(back), { e }));
  vignette(ctx, 0.5, '#02030a');
};
// ============================== OPENING UP ==============================
function chalkLine(ctx, pts, col, w = 5, seed = 1, prog = 1) {
  const n = Math.max(2, Math.floor(pts.length * prog)); if (prog <= 0) return;
  const r = mulberry(seed);
  for (let k = 0; k < 3; k++) {
    ctx.save(); ctx.strokeStyle = rgba(col, 0.35 + r() * 0.2); ctx.lineWidth = w * (0.5 + r() * 0.6); ctx.lineCap = 'round'; ctx.setLineDash([2 + r() * 8, 1 + r() * 4]);
    ctx.beginPath(); for (let i = 0; i < n; i++) { const [x, y] = pts[i]; const ox = (r() - 0.5) * 2.5, oy = (r() - 0.5) * 2.5; i ? ctx.lineTo(x + ox, y + oy) : ctx.moveTo(x + ox, y + oy); } ctx.stroke(); ctx.restore();
  }
}
SCENES.S27 = (ctx, t, shot) => {
  setLight(LIGHTS.gold); setLightDir(-0.6, -0.8);
  ctx.drawImage(cached('stepTop', W, H, (x) => {
    paint(x, rectPts(-10, -10, W + 20, H + 20), '#b8a88a', { seed: 1, top: '#c8b898', blots: 30, blotA: 0.4 });
    granulate(x, 0, 0, W, H, 0.9);
    paint(x, rectPts(-10, -10, W + 20, 120), '#8a5a3a', { seed: 2 }); // the doorway threshold at the top
    for (let i = 0; i < 5; i++) bgLine(x, [[0, 360 + i * 180 + (i % 2) * 20], [W, 350 + i * 185]], '#8a7a60', 3, 0.35, i);
    glow(x, 1500, 300, 1100, '#fff0c0', 0.3, 'screen');
  }), 0, 0);
  const p = inv(0.2, 4.2, t);
  // Saturn, in chalk
  chalkLine(ctx, circlePts(960, 560, 110, 40), '#f8f4ea', 6, 1, clamp(p * 3));
  chalkLine(ctx, (() => { const a = []; for (let i = 0; i <= 50; i++) { const th = i / 50 * TAU; a.push([960 + Math.cos(th) * 240 * Math.cos(-0.3) - Math.sin(th) * 60 * Math.sin(-0.3), 560 + Math.cos(th) * 240 * Math.sin(-0.3) + Math.sin(th) * 60 * Math.cos(-0.3)]); } return a; })(), '#f4d88a', 6, 2, clamp(p * 3 - 0.8));
  // orbits and the sun, Sam's side
  chalkLine(ctx, circlePts(360, 820, 60, 24), '#f4b84a', 7, 3, clamp(p * 3 - 1.2));
  [180, 300, 420].forEach((rr, i) => chalkLine(ctx, circlePts(360, 820, rr, 60, -1.2, 0.3), '#e8f0ff', 4, 4 + i, clamp(p * 3 - 1.4 - i * 0.2)));
  const rs = mulberry(27); for (let i = 0; i < 18; i++) { const sx = 200 + rs() * 1500, sy = 180 + rs() * 780; if (clamp(p * 3 - 0.5) * 18 > i) chalkLine(ctx, [[sx - 10, sy], [sx + 10, sy], [sx, sy], [sx, sy - 10], [sx, sy + 10]], '#f8f4ea', 3, 60 + i); }
  letter(ctx, 'SATURN', 1300, 830, { size: 80, font: 'Gochi', color: '#f8f4ea', reveal: clamp(p * 2.4 - 1.3), seed: 8, alpha: 0.85 });
  // two hands with chalk: hers (left), his (right)
  const hp = circlePts(960, 560, 240, 50)[Math.floor(clamp(p * 3 - 0.8) * 50)] || [1200, 500];
  bigHand(ctx, hp[0] + 60, hp[1] + 110, -2.0, 1.5, { skin: COL.skin, curl: 0.7, sleeve: '#6a8aa0' });
  const sp2 = [520 + Math.cos(q12(t) * 1.4) * 220, 820 + Math.sin(q12(t) * 1.4) * 60 - 200];
  bigHand(ctx, sp2[0] - 40, sp2[1] + 140, -1.2, 1.2, { skin: '#eec2a0', curl: 0.7, sleeve: COL.samJumper });
  yearMark(ctx, t, '2031', '#fff8e6');
  vignette(ctx, 0.3, '#4a3322');
};
SCENES.S28 = (ctx, t, shot) => {
  setLight(LIGHTS.goldHour); setLightDir(0.9, -0.3); setRim([5, -2], '#fff0b0');
  const tilt = easeIO(inv(0, shot.dur, t)) * 120;
  ctx.save(); ctx.translate(0, tilt);
  ctx.drawImage(cached('roof', W, H + 200, (x, w, h) => {
    gradWash(x, 0, 0, w, 820, [[0, '#6a78b0'], [0.4, '#e8a870'], [0.75, '#f9dc8e'], [1, '#fdf3dc']], { seed: 1, blot: 18, blotA: 0.2 });
    glow(x, 1560, 700, 700, '#fff0b0', 0.8, 'screen'); glow(x, 1560, 700, 120, '#ffffff', 0.9, 'screen');
    // town roofs below, backlit
    const r = mulberry(7); let px = -20; const pts = [[-20, 900]];
    while (px < w + 40) { const ww = 90 + r() * 150, hh = 700 + r() * 120; pts.push([px, hh], [px + ww * 0.5, hh - 30 - r() * 40], [px + ww, hh]); if (r() < 0.4) pts.push([px + ww * 0.8, hh - 10], [px + ww * 0.8, hh - 70], [px + ww * 0.86, hh - 70], [px + ww * 0.86, hh - 10]); px += ww; }
    pts.push([w + 40, 900]); paint(x, pts, '#8a5a4a', { seed: 8, top: '#6a4a4a' });
    // the flat roof + parapet
    paint(x, rectPts(-10, 880, w + 20, 330), '#a07a5a', { seed: 9, top: '#b89070' });
    paint(x, rectPts(-10, 860, w + 20, 40), '#7a5a48', { seed: 10 });
  }), 0, -100);
  const r = mulberry(4);
  // neighbours on folding chairs, rim-lit by the low sun
  for (let i = 0; i < 6; i++) {
    const x = 180 + i * 150 + (i > 2 ? 520 : 0), y = 1030 + (i % 2) * 20;
    silhouette(ctx, { who: 'n', age: 3 + i * 5, x, y, s: 0.62, f: i > 2 ? -1 : 1, view: 'side', outfit: 'home', silTone: '#4a3040', pose: { sit: true, hip: [0, -200], aN: [0.6, 1.2], neck: -0.3, lean: -0.05 } });
  }
  // chalkboard on an easel with orbits
  cel(ctx, path().poly([[620, 1020], [680, 700], [700, 700], [650, 1020]]), { fill: '#5a3a2a', lw: 3, seed: 3200 });
  cel(ctx, path().rect(560, 640, 300, 220), { fill: '#2e3a34', lw: 4, seed: 3201 });
  chalkLine(ctx, circlePts(710, 750, 30, 20), '#f4d88a', 4, 11); [60, 90].forEach((rr, i) => chalkLine(ctx, circlePts(710, 750, rr, 40), '#e8f0ff', 3, 12 + i));
  // the telescope against the sun, and Nell pointing up
  telescope(ctx, { x: 1240, y: 790, s: 0.62, alt: 0.8, az: 0.3, polish: 1, cracked: false, seed: 46, glint: 0.9, glintA: 0.8 });
  figure(ctx, { who: 'nell', age: 54, x: 1000, y: 1040, s: 0.82, f: 1, view: 'side', outfit: 'gold', e: { name: 'smile', look: [0.3, -1] }, pose: { aN: [2.7, 0.1], aF: [0.2, 0.3], neck: -0.35 } });
  ctx.restore();
  // swifts
  const tt = q12(t);
  for (let i = 0; i < 5; i++) { const bx = ((i * 400 + tt * (160 + i * 30)) % (W + 200)) - 100, by = 180 + Math.sin(tt * 1.5 + i) * 60 + i * 40; line(ctx, path().m(bx - 14, by - 6).q(bx - 6, by - 2, bx, by + 2).q(bx + 6, by - 2, bx + 14, by - 6), { lw: 3, color: '#3a2a3a', seed: 3300 + i }); }
  vignette(ctx, 0.3, '#4a2a1a');
};
SCENES.S29 = (ctx, t, shot) => {
  setLight(LIGHTS.gold); setLightDir(-0.6, -0.8);
  const k = Math.min(3, Math.floor(t / (shot.dur / 4))), lt = t - k * shot.dur / 4;
  const st = ['spring', 'summer', 'summer', 'autumn'][k], year = ['2031', '2033', '2036', '2040'][k];
  ctx.drawImage(streetBG(st), 0, 0);
  const tt = q12(t);
  // the road: raised beds get dug in, then grow
  const bedG = [0.1, 0.7, 1, 1.1][k];
  for (let i = 0; i < 5; i++) {
    const bx = 120 + i * 360, by = 900;
    cel(ctx, path().rect(bx, by - 40, 260, 60), { fill: '#7a5a3a', lw: 3, seed: 3400 + i });
    cel(ctx, path().rect(bx + 8, by - 44, 244, 14), { fill: '#4a3424', lw: 2, seed: 3410 + i });
    for (let j = 0; j < 7 * bedG; j++) cel(ctx, path().ellipse(bx + 20 + j * 34, by - 50 - bedG * 20, 18 * bedG, 26 * bedG), { fill: k === 3 ? (j % 2 ? '#c98a3a' : '#7a8a3a') : '#6a9a4a', lw: 2, seed: 3420 + i * 10 + j });
  }
  if (k >= 1) { // bunting across the street
    for (let i = 0; i < 24; i++) { const x = i * 84, y = 420 + Math.sin(i / 23 * Math.PI) * 60 + Math.sin(tt * 2 + i) * 3; cel(ctx, path().poly([[x, y], [x + 40, y + 2], [x + 20, y + 44]]), { fill: ['#c0473a', '#e0b030', '#3a6aa0', '#6a9a4a'][i % 4], lw: 2, seed: 3500 + i }); }
    line(ctx, path().m(0, 420).q(W / 2, 540, W, 420), { lw: 2, seed: 3530 });
    // the old shop is a workshop now, door open, bikes outside
    letter(ctx, 'REPAIR & MAKE', 1760, 430, { size: 40, font: 'Patrick', color: '#f4e6c8', align: 'center', seed: 31 });
    [1620, 1700].forEach((bx, i) => { ctx.save(); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(bx, 740, 22, 0, TAU); ctx.arc(bx + 56, 740, 22, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx, 740); ctx.lineTo(bx + 26, 712); ctx.lineTo(bx + 56, 740); ctx.stroke(); ctx.restore(); });
  }
  if (k >= 2) { // benches, and a hand-painted sign
    cel(ctx, path().rect(700, 1000, 300, 20), { fill: '#8a5a3a', lw: 3, seed: 3540 });
    cel(ctx, path().rect(600, 560, 320, 110), { fill: '#f4ecd8', lw: 3, seed: 3541 });
    letterLines(ctx, ['NIGHT SCHOOL', 'all welcome, St Jude’s'], 620, 604, 44, { size: 34, font: 'Kalam', color: '#3a2a5a', seed: 3542 });
  }
  // people: many more of them, of all ages, each state
  const crowd = [[2, 3], [4, 6], [7, 9], [8, 10]][k];
  const r = mulberry(40 + k);
  for (let i = 0; i < crowd[1]; i++) {
    const x = 100 + r() * 1700, dir = r() < 0.5 ? 1 : -1, walk = r() < 0.6, speed = 40 + r() * 40;
    const xx = walk ? x + dir * lt * speed : x, age = [8, 30, 72, 12, 45, 66, 20, 9, 50, 80][i % 10];
    const wp = (tt * 1.5 + i * 0.37) % 1, sw = walk ? Math.sin(wp * TAU) : 0;
    const who = age < 14 ? 'girl' : 'n';
    figure(ctx, { who, age: who === 'n' ? age : 7, x: xx, y: 830 + r() * 30, s: age < 14 ? 0.36 : 0.32, f: dir, view: 'side', outfit: 'home', pose: { lN: [sw * 0.4, 0.2], lF: [-sw * 0.4, 0.2], aN: [-sw * 0.3, 0.3], aF: [sw * 0.3, 0.3], lean: age > 65 ? 0.12 : 0 } });
  }
  // Sam, growing up in the same street: 13, 15, 18, 22
  const samAge = [13, 15, 18, 22][k];
  figure(ctx, { who: 'sam', age: samAge, x: 520 + lt * 30, y: 1020, s: 0.5, f: 1, view: 'side', outfit: 'home', pose: { aN: [0.2, 0.4] } });
  yearMark(ctx, lt, year, '#fff8e6');
  vignette(ctx, 0.3, '#4a3322');
};
SCENES.S30 = (ctx, t, shot) => {
  setLight(LIGHTS.gold); setLightDir(0.8, -0.6);
  const k = Math.min(3, Math.floor(t / (shot.dur / 4)));
  const era = [2032, 2035, 2038, 2041][k], samAge = [14, 17, 20, 23][k], nellAge = [54, 57, 60, 63][k];
  ctx.drawImage(kitchenBG('gold', era), 0, 0);
  kitchenShelf(ctx, era, 'gold');
  kettle(ctx, t, false, KMOOD.gold);
  // Sam at the right end, doing something different each time
  chair(ctx, 1300, 1000, 0.8, KMOOD.gold.wood, 340);
  figure(ctx, { who: 'sam', age: samAge, x: 1300, y: 1090, s: samAge > 16 ? 1.05 : 0.98, f: -1, view: '3q', outfit: 'home', noLegs: true, e: { name: 'focus', look: [0, 1] }, pose: { hip: [0, -170], lean: 0.25, neck: 0.35, aN: [0.5, 1.1], aF: [0.6, 1.0] } });
  nellAtTable(ctx, t, { mood: 'gold', age: nellAge, x: 800, outfit: 'gold', e: { name: 'soft', look: [0.3, 1] }, pose: { lean: 0.18, neck: 0.3, aN: [0.35, 1.2], aF: [0.4, 1.2] },
    beforeArms: () => {
      cel(ctx, path().rect(820, 880, 200, 90), { fill: '#f6eed8', lw: 2.5, seed: 3600 + k }); // her book
      line(ctx, path().m(920, 880).l(920, 970), { lw: 2, seed: 3601 });
      // what Sam is learning this year
      if (k === 0) { cel(ctx, path().poly([[1120, 900], [1220, 880], [1260, 920], [1160, 950]]), { fill: '#9a5a2a', lw: 3, seed: 3610 }); line(ctx, path().m(1150, 910).l(1260, 885), { lw: 2, seed: 3611 }); } // a fiddle
      if (k === 1) for (let i = 0; i < 6; i++) cel(ctx, path().rect(1110 + (i % 3) * 44, 880 + Math.floor(i / 3) * 40, 38, 34), { fill: '#6a4a3a', lw: 2, seed: 3620 + i }); // seed trays
      if (k === 2) { cel(ctx, path().rect(1100, 870, 200, 110), { fill: '#e8e0c8', lw: 2, seed: 3630 }); chalkLine(ctx, [[1110, 900], [1160, 930], [1210, 890], [1280, 940]], '#3a5a9a', 3, 3631); } // a map
      if (k === 3) { cel(ctx, path().poly([[1180, 960], [1200, 860], [1220, 960]]), { fill: '#e8e4d8', lw: 2.5, seed: 3640 }); cel(ctx, path().poly([[1180, 960], [1165, 985], [1235, 985], [1220, 960]]), { fill: '#c0473a', lw: 2.5, seed: 3641 }); } // a model rocket
    } });
  warmLight(ctx, 1060, 860, 0.7, t, 0.8);
  vignette(ctx, 0.3, '#4a3322');
};
SCENES.S31 = (ctx, t, shot) => {
  setLight(LIGHTS.goldHour); setLightDir(0.2, -1);
  ctx.drawImage(cached('hallIn', W, H, (x) => {
    paint(x, rectPts(-10, -10, W + 20, H + 20), '#c8a070', { seed: 1, top: '#a88058', blots: 20 });
    [[140, 120], [1620, 120]].forEach(([wx, wy], i) => { paint(x, [[wx, wy + 60], [wx + 80, wy], [wx + 160, wy + 60], [wx + 160, wy + 420], [wx, wy + 420]], '#fff0c0', { seed: 2 + i }); glow(x, wx + 80, wy + 240, 500, '#ffe0a0', 0.4, 'screen'); });
    // the big chalkboard: the planets
    paint(x, rectPts(430, 170, 1060, 520), '#2e3a34', { seed: 4, blots: 14 });
    paint(x, rectPts(410, 150, 1100, 30), '#7a5a3a', { seed: 5 }); paint(x, rectPts(410, 680, 1100, 30), '#7a5a3a', { seed: 6 });
  }), 0, 0);
  // what she's drawn: the sun and the planets, Saturn circled
  chalkLine(ctx, circlePts(540, 430, 70, 30), '#f4b84a', 6, 21);
  [[700, 18], [790, 24], [890, 26], [990, 20], [1130, 56], [1300, 46]].forEach(([px, pr], i) => chalkLine(ctx, circlePts(px, 430, pr, 24), '#e8f0ff', 4, 22 + i));
  chalkLine(ctx, (() => { const a = []; for (let i = 0; i <= 40; i++) { const th = i / 40 * TAU; a.push([1300 + Math.cos(th) * 90, 430 + Math.sin(th) * 22]); } return a; })(), '#f4d88a', 4, 30);
  chalkLine(ctx, circlePts(1300, 430, 120, 40), '#f8f4ea', 3, 31, ease(0.5, 2.0, t));
  letter(ctx, 'bring a question', 960, 640, { size: 48, font: 'Gochi', color: '#f8f4ea', align: 'center', seed: 32, alpha: 0.85 });
  // Nell at the board, pointing at Saturn
  figure(ctx, { who: 'nell', age: 58, x: 1420, y: 900, s: 0.62, f: -1, view: '3q', outfit: 'gold', e: 'smile', pose: { aN: [2.1, 0.2], aF: [0.1, 0.3] } });
  // the full room from behind: every age, backs of heads, a hand going up
  const r = mulberry(3);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 8 - row; i++) {
    const x = 40 + i * (260 + row * 50) + (row % 2) * 120 + r() * 50, y = 930 + row * 90, s = 0.62 + row * 0.22;
    const age = Math.floor(r() * 90), who = age % 7 === 0 ? 'girl' : 'n';
    const hand = row === 1 && i === 4 && t > 2.8;
    figure(ctx, { who, age: who === 'girl' ? 7 : age, x, y: y + 300 * s, s, view: 'back', outfit: 'home', noLegs: true, pose: hand ? { aN: [2.9, 0.1] } : { aN: [0.2, 0.6], aF: [0.2, 0.6] }, layer: hand ? undefined : 'body' });
  }
  vignette(ctx, 0.4, '#3a2012');
};

// ============================== 2047 ==============================
SCENES.S32 = (ctx, t, shot) => {
  setLight(LIGHTS.end); setLightDir(-0.9, -0.2); setRim([-4, -2], '#ffc890');
  const tilt = easeIO(inv(0, shot.dur, t)) * 90;
  ctx.save(); ctx.translate(0, tilt);
  ctx.drawImage(backStepBG('end', 2047), 0, 0);
  nightSky(ctx, t, { n: 320, seed: 47, hMax: 700, dim: 1, milky: true });
  ctx.fillStyle = '#05051a'; ctx.fillRect(0, -200, W, 200);
  nightSky(ctx, t, { n: 80, seed: 48, hMax: 200, dim: 0.9, twinkle: false });
  // Nell in her chair by the step, under a blanket
  chair(ctx, 560, 1000, 0.9, '#3a2e44', 3700);
  figure(ctx, { who: 'nell', age: 69, x: 560, y: 1080, s: 0.98, f: 1, view: '3q', outfit: 'old', e: { name: 'soft', look: [0.6, -0.4] }, pose: { sit: true, hip: [0, -250], aN: [0.5, 1.3], aF: [0.4, 1.3], lean: 0.08 } });
  cel(ctx, path().cr([[470, 830], [650, 820], [700, 1000], [680, 1060], [440, 1060], [450, 960]], true), { fill: COL.blanket, shade: shadeBy(10), lw: 3, seed: 3701 });
  for (let i = 0; i < 4; i++) line(ctx, path().m(470 + i * 55, 840).l(460 + i * 60, 1050), { lw: 3, color: lit(COL.blanket2), seed: 3702 + i, alpha: 0.7 });
  // the telescope; Sam (29) and his daughter (7) at the eyepiece
  const tel = telescope(ctx, { x: 1260, y: 700, s: 0.8, alt: 0.55, az: 0.35, polish: 0.85, cracked: false, seed: 47 });
  cel(ctx, path().rect(tel.eyepiece[0] - 110, tel.eyepiece[1] + 190, 130, 90), { fill: '#6a5a4a', lw: 3, seed: 3710 }); // the box she stands on
  figure(ctx, { who: 'sam', age: 29, x: tel.eyepiece[0] - 190, y: 1010, s: 1.05, f: 1, view: 'side', outfit: 'home', e: 'smile', pose: { aN: [0.9, 1.0], aF: [0.5, 0.4], lean: 0.08 } });
  figure(ctx, { who: 'girl', age: 7, x: tel.eyepiece[0] - 60, y: tel.eyepiece[1] + 195, s: 1.0, f: 1, view: 'side', outfit: 'coat', hat: COL.girlHat, e: { name: 'focus', blink: 0.7 }, pose: { lean: 0.25, neck: 0.2, aN: [1.1, 0.6], aF: [1.2, 0.5] } });
  ctx.restore();
  yearMark(ctx, t, '2047', '#fff8e6');
  vignette(ctx, 0.55, '#010108');
};
function launchLine(ctx, t, x0, y0, o = {}) {
  // a slow bright point climbing on a slight arc, its trail drawn like a chalk line in light
  const p = o.p !== undefined ? o.p : ease(0.6, 6.6, t);
  const pts = []; const N = 60;
  for (let i = 0; i <= N; i++) { const u = i / N * p; pts.push([x0 + u * u * (o.lean || 180), y0 - u * (o.rise || 520)]); }
  if (p <= 0) return pts;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 1; i < pts.length; i++) {
    const a = (i / pts.length);
    ctx.strokeStyle = rgba('#ffe6b0', 0.15 + a * 0.6); ctx.lineWidth = (o.w || 2.2) * (0.6 + a * 0.6);
    ctx.beginPath(); ctx.moveTo(...pts[i - 1]); ctx.lineTo(...pts[i]); ctx.stroke();
  }
  const tip = pts[pts.length - 1];
  glow(ctx, tip[0], tip[1], (o.w || 2.2) * 20, '#fff0c8', 0.8); glow(ctx, tip[0], tip[1], (o.w || 2.2) * 4, '#ffffff', 1);
  ctx.restore();
  return pts;
}
SCENES.S33 = (ctx, t, shot) => {
  ctx.drawImage(horizonBG(), 0, 0);
  nightSky(ctx, t, { n: 360, seed: 33, hMax: 820, dim: 1, twinkleAt: [520, 260] });
  glow(ctx, 1180, 885, 90 + ease(0.6, 3, t) * 60, '#ffd890', 0.35 * ease(0.4, 1.2, t));
  launchLine(ctx, t, 1180, 880);
};
SCENES.S34 = (ctx, t, shot) => {
  setLight(LIGHTS.end); setLightDir(0.9, -0.5); setRim([7, -3], '#ffe6b8');
  ctx.drawImage(horizonBG(), -300, -80, W * 1.3, H * 1.3);
  ctx.fillStyle = rgba('#05051a', 0.35); ctx.fillRect(0, 0, W, H);
  nightSky(ctx, t, { n: 200, seed: 34, hMax: 700, dim: 0.9, twinkle: false });
  launchLine(ctx, t, 1500, 820, { p: 0.85 + ease(0, 6.5, t) * 0.15, rise: 400, lean: 120, w: 1.6 });
  const cs = charSpec('nell', 69);
  const smile = ease(2.0, 4.0, t);
  const hx = 820, hy = 540, s = 4.4;
  bust(ctx, hx, hy, s, 1, 'old', { shawl: COL.blanket });
  drawHead(ctx, { x: hx, y: hy, s, view: 'profile', cs, tilt: -0.12, e: { name: 'soft', mouth: lerp(0.2, 0.9, smile), smileEyes: smile * 0.6, look: [0.4, -1], hi: 2 } });
  // the launch reflected, tiny, in her eye
  const ep = [hx + 29 * s * 0.98, hy - 1 * s - 6];
  glow(ctx, ep[0] + 4, ep[1] - 6, 10, '#fff0c8', 0.9);
  // cool starlight rim on her profile, warm on the far side
  glow(ctx, hx + 260, hy - 100, 500, '#9c8fd0', 0.12, 'screen');
  vignette(ctx, 0.55, '#010108');
};
// the pull-back: nested layers, each one the centre of the next
function pbLens(ctx) { // extreme close-up of the objective: the sky reflected in glass
  ctx.fillStyle = '#0a0a1a'; ctx.fillRect(-W, -H, 3 * W, 3 * H);
  cel(ctx, path().ellipse(W / 2, H / 2, 520, 520), { fill: '#c29240', lw: 8, seed: 3800, raw: true, line: '#2a1a0a' });
  cel(ctx, path().ellipse(W / 2, H / 2, 440, 440), { fill: '#0e1030', lw: 5, seed: 3801, raw: true, line: '#1a1208' });
  const r = mulberry(5); for (let i = 0; i < 80; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 420; ctx.fillStyle = rgba('#fff4d8', 0.3 + r() * 0.6); ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d, 1 + r() * 2, 0, TAU); ctx.fill(); }
  glow(ctx, W / 2 - 160, H / 2 - 180, 200, '#bcd6e8', 0.35);
  launchLine(ctx, 7, W / 2 + 60, H / 2 + 200, { p: 1, rise: 380, lean: 90, w: 3 });
}
function pbStep(ctx) { // the back step from high above: three people round the telescope, the lit house, the neighbours
  ctx.drawImage(cached('pbStep', W, H, (x) => {
    paint(x, rectPts(-10, -10, W + 20, H + 20), '#1c1a3a', { seed: 1 });
    for (let k = -2; k <= 2; k++) { // terrace roofs in a row, with yards
      const y0 = H / 2 - 700 + (k + 2) * 0;
      paint(x, rectPts(W / 2 - 760, H / 2 - 160 + k * 320, 700, 300), k === 0 ? '#3a3462' : '#2a2650', { seed: 10 + k, wob: 2 });
      for (let i = 0; i < 10; i++) bgLine(x, [[W / 2 - 760, H / 2 - 150 + k * 320 + i * 30], [W / 2 - 60, H / 2 - 150 + k * 320 + i * 30]], '#1a1834', 2, 0.5, 20 + i + k * 10);
      paint(x, rectPts(W / 2 - 40, H / 2 - 150 + k * 320, 620, 280), k === 0 ? '#34305a' : '#262248', { seed: 40 + k });
      if (k !== 0 && (k + 5) % 2) { paint(x, rectPts(W / 2 + 200, H / 2 - 100 + k * 320, 26, 34), '#ffcf7a', { seed: 50 + k, edge: 0 }); glow(x, W / 2 + 213, H / 2 - 83 + k * 320, 80, '#ffb050', 0.3, 'screen'); }
      [0.2, 0.6].forEach((q, j) => { const tx = W / 2 + 60 + q * 500, ty = H / 2 - 120 + k * 320 + (j ? 180 : 40); paint(x, circlePts(tx, ty, 34 + j * 10, 16), '#243a34', { seed: 60 + k * 3 + j }); });
      bgLine(x, [[W / 2 - 40, H / 2 + 140 + k * 320], [W / 2 + 600, H / 2 + 140 + k * 320]], '#141230', 5, 0.8, 70 + k);
    }
    glow(x, W / 2 - 30, H / 2, 260, '#ffb050', 0.35, 'screen'); // the open back door
  }), 0, 0);
  // three people round a telescope, seen from above
  const c = [W / 2 + 180, H / 2 + 10];
  [[-50, -30, 30, '#e2ddd6', '#8a4a4a'], [70, 40, 30, '#8a4a2a', '#4a6a5a'], [120, -20, 20, COL.girlHat, COL.girlCoat]].forEach(([dx, dy, rr, hair, body], i) => {
    cel(ctx, path().ellipse(c[0] + dx, c[1] + dy + rr * 0.5, rr * 1.5, rr * 1.2), { fill: body, lw: 3, seed: 3810 + i, raw: true, line: '#0a0a1c' });
    cel(ctx, path().ellipse(c[0] + dx, c[1] + dy, rr * 0.8, rr * 0.8), { fill: hair, lw: 3, seed: 3813 + i, raw: true, line: '#0a0a1c' });
  });
  cel(ctx, path().poly([[c[0] + 140, c[1] - 30], [c[0] + 320, c[1] - 60], [c[0] + 326, c[1] - 36], [c[0] + 146, c[1] - 12]]), { fill: '#c29240', lw: 3, seed: 3816, raw: true, line: '#2a1a0a' });
  glow(ctx, c[0] + 324, c[1] - 48, 50, '#fff0c8', 0.9);
}
function pbTown(ctx) { // the town at night from above: terraces in curving rows, streetlights, gardens, the dark fields beyond
  ctx.drawImage(cached('pbTown', W, H, (x) => {
    paint(x, rectPts(-10, -10, W + 20, H + 20), '#0c0c22', { seed: 1 });
    const r = mulberry(8);
    for (let j = -9; j <= 9; j++) {
      const y = H / 2 + j * 58 + Math.sin(j) * 8, bend = (r() - 0.5) * 0.08;
      for (let i = -14; i <= 14; i++) {
        if (Math.hypot(i * 70, j * 58) > 900 + r() * 150) continue;
        const xx = W / 2 + i * 70 + j * 12, yy = y + i * 70 * bend;
        if (r() < 0.12) { paint(x, circlePts(xx, yy, 22, 10), '#1e3428', { seed: 100 + i + j * 40, edge: 0 }); continue; }
        paint(x, rectPts(xx - 30, yy - 16, 62, 30), r() < 0.5 ? '#1e1c40' : '#26224a', { seed: 200 + i + j * 40, edge: 0.1 });
        if (r() < 0.45) { x.fillStyle = '#ffcf7a'; x.fillRect(xx - 10 + r() * 20, yy - 6 + r() * 10, 4, 4); }
      }
      x.save(); x.globalCompositeOperation = 'screen'; x.strokeStyle = 'rgba(255,190,110,0.25)'; x.lineWidth = 3; x.beginPath(); x.moveTo(W / 2 - 900, y + 29); x.quadraticCurveTo(W / 2, y + 29 + j * 4, W / 2 + 900, y + 29); x.stroke(); x.restore();
      for (let i = -12; i <= 12; i += 2) if (Math.abs(i * 70) < 800) glow(x, W / 2 + i * 70, y + 29, 16, '#ffc070', 0.5, 'screen');
    }
  }), 0, 0);
  glow(ctx, W / 2, H / 2, 30, '#fff0c8', 0.9);
}
function pbPlanet(ctx) { // the night side of the planet: city lights, a thin blue line of air
  ctx.fillStyle = '#03030c'; ctx.fillRect(-W, -H, 3 * W, 3 * H);
  const R = 2200, cy = H / 2 + R - 200;
  ctx.save(); ctx.beginPath(); ctx.arc(W / 2, cy, R, 0, TAU); ctx.fillStyle = '#0a0c20'; ctx.fill(); ctx.clip();
  const r = mulberry(12);
  for (let i = 0; i < 900; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 1.0, d = R - r() * 900; const x = W / 2 + Math.cos(a) * d, y = cy + Math.sin(a) * d; const c = r() < 0.8 ? 1 : 3; ctx.fillStyle = rgba('#ffcf7a', 0.3 + r() * 0.6); ctx.fillRect(x, y, c, c); }
  glow(ctx, W / 2, H / 2, 60, '#ffe0a0', 0.8);
  ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(120,160,255,0.55)'; ctx.lineWidth = 10; ctx.filter = 'blur(6px)'; ctx.beginPath(); ctx.arc(W / 2, cy, R + 6, 0, TAU); ctx.stroke(); ctx.filter = 'none'; ctx.restore();
}
function pbSpace(ctx, t) { // the planet small; warm lights drift outward like seeds, and far stars gain a warm companion
  ctx.fillStyle = '#02020a'; ctx.fillRect(-W, -H, 3 * W, 3 * H);
  const r = mulberry(21), stars = [];
  for (let i = 0; i < 500; i++) { const sx = -W + r() * 3 * W, sy = -H + r() * 3 * H, m = r(); stars.push([sx, sy]); ctx.fillStyle = rgba('#dfe6ff', 0.2 + m * 0.6); ctx.beginPath(); ctx.arc(sx, sy, 0.6 + m * 1.4, 0, TAU); ctx.fill(); }
  const g = ctx.createRadialGradient(W / 2 - 20, H / 2 - 20, 4, W / 2, H / 2, 70); g.addColorStop(0, '#4a6ab0'); g.addColorStop(0.7, '#1a2a60'); g.addColorStop(1, '#0a0c20');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, 70, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(120,160,255,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2, 72, 0, TAU); ctx.stroke();
  glow(ctx, W / 2 - 20, H / 2 - 10, 26, '#ffcf7a', 0.5); // the night side's own lights
  const tt = q12(t) - 10, rr = mulberry(31);
  for (let i = 0; i < 26; i++) {
    const a0 = rr() * TAU, sp = 0.5 + rr() * 0.6, born = rr() * 2.4, sway = rr() * 6;
    const age = tt - born; if (age < 0) continue;
    const d = 80 + age * sp * 110, a = a0 + Math.sin(age * 0.8 + sway) * 0.05;
    const x = W / 2 + Math.cos(a) * d, y = H / 2 + Math.sin(a) * d;
    const tw = 0.75 + 0.25 * Math.sin(age * 3 + sway);
    glow(ctx, x, y, 22, '#ffcf7a', 0.45 * tw); ctx.fillStyle = '#fff4d8'; ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill();
  }
  // a few far stars, warmed: somebody got there
  const warmK = ease(11.2, 12.6, q12(t));
  [[300, 220], [1640, 180], [1500, 880], [260, 860], [960, 90]].forEach(([x, y], i) => { const k = clamp(warmK * 1.4 - i * 0.12); if (k > 0) glow(ctx, x, y, 30 * k, '#ffcf7a', 0.55 * k); });
}
SCENES.S35 = (ctx, t, shot) => {
  // zoom z runs from 1 (lens) down by ~10x per stage
  const stages = [[pbLens, 0], [pbStep, 2.6], [pbTown, 5.2], [pbPlanet, 7.8], [pbSpace, 10.2]];
  const u = t; // seconds
  const z = Math.exp(-u * 0.62); // continuous zoom-out
  for (let i = 0; i < stages.length; i++) {
    const [fn, t0] = stages[i];
    const t1 = i + 1 < stages.length ? stages[i + 1][1] : 99;
    const fin = i === 0 ? 1 : ease(t0 - 0.2, t0 + 0.9, u), fout = 1 - ease(t1 - 0.2, t1 + 0.9, u);
    const a = Math.min(fin, fout); if (a <= 0.001) continue;
    const zi = Math.exp(-t0 * 0.62) * (i === 0 ? 1 : 0.35); // the zoom at which this layer is 1:1
    const sc = z / zi;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
    fn(ctx, t); ctx.restore();
  }
  vignette(ctx, 0.5, '#000');
};
SCENES.S36 = (ctx, t, shot) => {
  ctx.fillStyle = '#02020a'; ctx.fillRect(0, 0, W, H);
  nightSky(ctx, t, { n: 420, seed: 36, hMax: H, dim: 0.9, twinkleAt: [960, 380] });
  const a = ease(0.6, 1.6, t) * (1 - ease(4.2, 5.0, t));
  letter(ctx, 'For everyone who ever worked nights.', W / 2, 600, { size: 58, font: 'Caveat', color: '#f6e7c6', align: 'center', seed: 36, alpha: a });
};
SCENES.S37 = (ctx, t, shot) => {
  ctx.drawImage(titleBG(), 0, 0);
  nightSky(ctx, t, { n: 160, seed: 37, hMax: 600, dim: 0.5, twinkle: true });
  const a = ease(0.2, 1.0, t) * (1 - ease(7.2, 8.0, t));
  ctx.save(); ctx.globalAlpha = a;
  letter(ctx, 'After Work', W / 2, 250, { size: 110, font: 'CaveatBrush', color: '#f6e7c6', align: 'center', seed: 21 });
  const L = [
    ['Nell · Sam · Arthur', 46, 'Patrick', '#e9d8b4'],
    ['', 20],
    ['Story, drawings, animation, score and sound', 36, 'Patrick', '#cfc0e8'],
    ['made by Claude (Anthropic), line by line in code,', 36, 'Patrick', '#cfc0e8'],
    ['for John Brophy', 36, 'Patrick', '#cfc0e8'],
    ['', 20],
    ['Lettering: Caveat, Kalam, Reenie Beanie, Patrick Hand, Gochi Hand (SIL Open Font License)', 26, 'Patrick', '#a89cc8'],
    ['', 20],
    ['Thank you to everyone who works while the rest of us sleep.', 38, 'Caveat', '#f6e7c6'],
  ];
  let y = 380; L.forEach(([s, sz, f, c], i) => { if (s) letter(ctx, s, W / 2, y, { size: sz, font: f, color: c, align: 'center', seed: 100 + i }); y += sz * 1.45; });
  ctx.restore();
  // the telescope, small, at the bottom
  setLight(LIGHTS.end);
  ctx.save(); ctx.globalAlpha = a; telescope(ctx, { x: 960, y: 930, s: 0.22, alt: 0.6, az: 0.35, polish: 1, cracked: false, seed: 49, lw: 2 }); ctx.restore();
};
