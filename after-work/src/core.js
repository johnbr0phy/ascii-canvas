// ---------------------------------------------------------------------------
// After Work: core drawing layer.
// Everything is deterministic in (t). Characters and effects animate on twos
// (12 drawings a second); the ink line "boils" once per drawing.
// ---------------------------------------------------------------------------
const W = 1920, H = 1080, FPS_DRAW = 12;

// ---------- random + noise -------------------------------------------------
function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash1(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
function hash2(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
function noise1(x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return (hash1(i) * (1 - u) + hash1(i + 1) * u) * 2 - 1;
}
function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return ((a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy) * 2 - 1;
}
function fbm2(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * noise2(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

// ---------- maths -----------------------------------------------------------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const ease = (a, b, x) => smooth(inv(a, b, x));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const TAU = Math.PI * 2;
const q12 = t => Math.floor(t * FPS_DRAW + 1e-6) / FPS_DRAW; // on twos
const drawingIndex = t => Math.floor(t * FPS_DRAW + 1e-6);

// ---------- colour ----------------------------------------------------------
function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
function mul(a, b) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] * B[0] / 255, A[1] * B[1] / 255, A[2] * B[2] / 255); }
function rgba(h, a) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }
function lighten(h, t) { return mix(h, '#ffffff', t); }
function darken(h, t) { return mix(h, '#000000', t); }

// A "light" grades every base colour that passes through it, so the same
// character model sits correctly under sodium, snow-light, gold or starlight.
// {key: multiply colour, amb: ambient lift colour, k: strength, shadow: cel shadow tint}
let LIGHT = null;
const _lc = new Map();
function lit(base) {
  if (!LIGHT) return base;
  const key = LIGHT.id + base;
  if (_lc.has(key)) return _lc.get(key);
  let c = mix(base, mul(base, LIGHT.key), LIGHT.k);
  if (LIGHT.amb) c = mix(c, LIGHT.amb, LIGHT.ambK || 0.12);
  if (LIGHT.sat !== undefined) { const [r, g, b] = hex2rgb(c); const l = (r + g + b) / 3; c = rgb2hex(lerp(l, r, LIGHT.sat), lerp(l, g, LIGHT.sat), lerp(l, b, LIGHT.sat)); }
  _lc.set(key, c); return c;
}
function shadowOf(base) {
  // the cel shadow: base multiplied by the scene's shadow tint
  const s = LIGHT ? LIGHT.shadow : '#9a8aa8';
  return lit(mul(base, s));
}
function setLight(L) { LIGHT = L; }

// ---------- canvases -------------------------------------------------------
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- path building + flattening -------------------------------------
// A tiny path language in local coords; flattening applies a 2x3 transform so
// wobble is measured in screen pixels regardless of scale.
class P {
  constructor() { this.subs = []; this.cur = null; }
  m(x, y) { this.cur = [[x, y]]; this.subs.push(this.cur); this.closed = false; return this; }
  l(x, y) { this.cur.push([x, y]); return this; }
  c(x1, y1, x2, y2, x, y, n) {
    const [x0, y0] = this.cur[this.cur.length - 1];
    const len = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x - x2, y - y2);
    n = n || Math.max(4, Math.min(40, Math.ceil(len / 5)));
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      this.cur.push([u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x,
        u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y]);
    }
    return this;
  }
  q(x1, y1, x, y, n) {
    const [x0, y0] = this.cur[this.cur.length - 1];
    const len = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x - x1, y - y1);
    n = n || Math.max(3, Math.min(30, Math.ceil(len / 5)));
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      this.cur.push([u * u * x0 + 2 * u * t * x1 + t * t * x, u * u * y0 + 2 * u * t * y1 + t * t * y]);
    }
    return this;
  }
  // smooth closed/open curve through points (Catmull-Rom)
  cr(pts, closed = false, tension = 0.5) {
    const n = pts.length; const get = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
    this.m(pts[0][0], pts[0][1]);
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const k = tension / 3 * 2;
      this.c(p1[0] + (p2[0] - p0[0]) * k / 2, p1[1] + (p2[1] - p0[1]) * k / 2,
        p2[0] - (p3[0] - p1[0]) * k / 2, p2[1] - (p3[1] - p1[1]) * k / 2, p2[0], p2[1]);
    }
    if (closed) this.cur.pop();
    return this;
  }
  ellipse(cx, cy, rx, ry, rot = 0, n = 40) {
    this.cur = []; this.subs.push(this.cur);
    const c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; this.cur.push([cx + x * c - y * s, cy + x * s + y * c]); }
    return this;
  }
  rect(x, y, w, h) { return this.m(x, y).l(x + w, y).l(x + w, y + h).l(x, y + h); }
  poly(pts) { this.m(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) this.l(pts[i][0], pts[i][1]); return this; }
}
const path = () => new P();

// transform helpers: M = [a,b,c,d,e,f] -> x' = a x + c y + e
const Mid = () => [1, 0, 0, 1, 0, 0];
function Mmul(A, B) { return [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]]; }
function Mtr(x, y) { return [1, 0, 0, 1, x, y]; }
function Msc(sx, sy = sx) { return [sx, 0, 0, sy, 0, 0]; }
function Mrot(a) { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0]; }
function Mapp(M, p) { return [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]]; }
// compose left-to-right: T(M, Mtr(..), Mrot(..)) = M * tr * rot
function T(...ms) { return ms.reduce((a, b) => Mmul(a, b)); }

// resample a polyline to even spacing (so wobble noise has constant frequency)
function resample(pts, step, closed) {
  const src = closed ? pts.concat([pts[0]]) : pts;
  const out = [src[0]]; let carry = 0;
  for (let i = 1; i < src.length; i++) {
    const [x0, y0] = src[i - 1], [x1, y1] = src[i];
    const d = Math.hypot(x1 - x0, y1 - y0); if (d === 0) continue;
    let s = step - carry;
    while (s <= d) { const t = s / d; out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); s += step; }
    carry = d - (s - step);
  }
  if (!closed) { const last = src[src.length - 1]; const o = out[out.length - 1]; if (Math.hypot(last[0] - o[0], last[1] - o[1]) > step * 0.3) out.push(last); }
  else if (out.length > 2) { const o = out[out.length - 1]; if (Math.hypot(src[0][0] - o[0], src[0][1] - o[1]) < step * 0.5) out.pop(); }
  return out;
}

// the hand: displace along the normal with low-frequency noise, re-seeded per drawing
let BOIL = 0;            // current drawing index (set per frame)
let BOIL_AMP = 1.0;      // global multiplier
function wob(pts, seed, amp, closed, freq = 0.045) {
  const n = pts.length; if (n < 2) return pts;
  const out = new Array(n); const b = BOIL * 17.13;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], c = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let nx = -(c[1] - a[1]), ny = c[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    acc += 1;
    const d = (noise1(seed * 3.7 + acc * freq * 6 + b) * 0.75 + noise1(seed + acc * freq * 20 - b) * 0.25) * amp * BOIL_AMP;
    out[i] = [p[0] + nx * d, p[1] + ny * d];
  }
  return out;
}

// prepared shape: flattened, transformed, resampled, wobbled; reusable for fill + line
function prep(p, M = Mid(), seed = 1, amp = 1.1, step = 5) {
  return p.subs.filter(s => s.length > 1).map((s, k) => {
    const closed = !!s.closedFlag || s.length > 2;
    const tp = s.map(q => Mapp(M, q));
    const r = resample(tp, step, true);
    return wob(r, seed + k * 13.1, amp, true);
  });
}
function prepOpen(p, M = Mid(), seed = 1, amp = 1.1, step = 5) {
  return p.subs.filter(s => s.length > 1).map((s, k) => wob(resample(s.map(q => Mapp(M, q)), step, false), seed + k * 7.7, amp, false));
}

function tracePolys(ctx, polys) {
  ctx.beginPath();
  for (const s of polys) { ctx.moveTo(s[0][0], s[0][1]); for (let i = 1; i < s.length; i++) ctx.lineTo(s[i][0], s[i][1]); ctx.closePath(); }
}
function fillPolys(ctx, polys, color, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; tracePolys(ctx, polys); ctx.fill('nonzero'); ctx.restore();
}

// tapered, pressure-varying ink line (filled ribbon)
function ribbon(ctx, pts, w, color, seed = 1, opts = {}) {
  const n = pts.length; if (n < 2) return;
  const closed = !!opts.closed, taper = opts.taper !== undefined ? opts.taper : !closed;
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], c = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let nx = -(c[1] - a[1]), ny = c[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const u = i / (n - 1);
    let tp = 1;
    if (taper) { const t0 = opts.t0 !== undefined ? opts.t0 : 0.18, t1 = opts.t1 !== undefined ? opts.t1 : 0.22; tp = Math.min(1, u / t0 + 0.12, (1 - u) / t1 + 0.12); tp = Math.sqrt(clamp(tp)); }
    const press = 0.78 + 0.34 * (noise1(seed * 1.9 + i * 0.09 + BOIL * 0.7) * 0.5 + 0.5);
    const ww = w * tp * press * 0.5;
    L.push([pts[i][0] + nx * ww, pts[i][1] + ny * ww]); R.push([pts[i][0] - nx * ww, pts[i][1] - ny * ww]);
  }
  ctx.fillStyle = color; ctx.beginPath();
  if (closed) {
    ctx.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]); ctx.closePath();
    ctx.moveTo(R[n - 1][0], R[n - 1][1]); for (let i = n - 2; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath();
    ctx.fill('nonzero');
  } else {
    ctx.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); ctx.fill();
    // round caps
    const cap = (p, q) => { const r = Math.hypot(p[0] - q[0], p[1] - q[1]) / 2; if (r > 0.3) { ctx.beginPath(); ctx.arc((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, r, 0, TAU); ctx.fill(); } };
    cap(L[0], R[0]); cap(L[n - 1], R[n - 1]);
  }
}

// ---------- the main "draw a cel shape" call --------------------------------
// fill flat, cel-shadow by the shifted-self trick, then ink it.
// o: {M, fill, line, lw, seed, amp, shade:[dx,dy] (toward light), shadeCol, rim:[dx,dy], rimCol, noLine, alpha}
function cel(ctx, p, o = {}) {
  const M = o.M || Mid();
  const seed = o.seed || 1, amp = o.amp !== undefined ? o.amp : 1.0;
  const polys = prep(p, M, seed, amp, o.step || 4.5);
  const a = o.alpha !== undefined ? o.alpha : 1;
  ctx.save(); ctx.globalAlpha *= a;
  if (o.fill) {
    const base = o.raw ? o.fill : lit(o.fill);
    const sc = o.shadeCol ? (o.raw ? o.shadeCol : lit(o.shadeCol)) : (o.raw ? darken(o.fill, 0.25) : shadowOf(o.fill));
    const body = () => {
      if (o.shade) {
        fillPolys(ctx, polys, sc);
        ctx.save(); tracePolys(ctx, polys); ctx.clip();
        ctx.translate(o.shade[0], o.shade[1]); fillPolys(ctx, polys, base); ctx.restore();
      } else fillPolys(ctx, polys, base);
    };
    const rimV = o.rim || (RIMG && !o.noRim ? RIMG.v : null);
    if (rimV) {
      // rim light = shape minus itself shifted away from the light
      fillPolys(ctx, polys, o.rimCol || (RIMG ? RIMG.col : '#fff'));
      ctx.save(); tracePolys(ctx, polys); ctx.clip();
      ctx.translate(-rimV[0], -rimV[1]); body(); ctx.restore();
    } else body();
  }
  if (!o.noLine) {
    const lc = o.line || (LIGHT ? LIGHT.ink : '#2a1c14');
    for (const s of polys) ribbon(ctx, s, o.lw || 3, lc, seed + 3, { closed: true });
  }
  ctx.restore();
  return polys;
}
// open ink stroke (hair strands, creases, eyelids)
function line(ctx, p, o = {}) {
  const M = o.M || Mid();
  const polys = prepOpen(p, M, o.seed || 2, o.amp !== undefined ? o.amp : 0.8, o.step || 4);
  ctx.save(); ctx.globalAlpha *= (o.alpha !== undefined ? o.alpha : 1);
  for (const s of polys) ribbon(ctx, s, o.lw || 2.2, o.color || (LIGHT ? LIGHT.ink : '#2a1c14'), o.seed || 2, { t0: o.t0, t1: o.t1, taper: o.taper });
  ctx.restore();
}

// ---------- watercolour ------------------------------------------------------
// deformed polygon stacks (layered glazes) + edge darkening + granulation.
function deform(pts, r, depth, spread) {
  let cur = pts;
  for (let d = 0; d < depth; d++) {
    const nxt = [];
    for (let i = 0; i < cur.length; i++) {
      const a = cur[i], b = cur[(i + 1) % cur.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const mx = (a[0] + b[0]) / 2 + gauss(r) * len * spread * 0.5, my = (a[1] + b[1]) / 2 + gauss(r) * len * spread * 0.5;
      nxt.push(a, [mx, my]);
    }
    cur = nxt;
  }
  return cur;
}
// wash: paint a watercolour patch. poly = array of points (screen space of the target canvas)
function wash(ctx, poly, color, o = {}) {
  const r = mulberry(o.seed || 7);
  const layers = o.layers || 14, alpha = o.alpha || 0.07, spread = o.spread !== undefined ? o.spread : 0.35;
  const base = deform(poly, r, 3, spread * 0.6);
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < layers; i++) {
    const p = deform(base, r, 3, spread);
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let j = 1; j < p.length; j++) ctx.lineTo(p[j][0], p[j][1]); ctx.closePath(); ctx.fill();
  }
  if (o.edge !== false) {
    // pigment pools at the edge of a drying wash
    ctx.globalAlpha = o.edgeA || 0.18; ctx.strokeStyle = darken(color, 0.18); ctx.lineWidth = o.edgeW || 1.4;
    const p = deform(base, r, 2, spread * 0.4);
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let j = 1; j < p.length; j++) ctx.lineTo(p[j][0], p[j][1]); ctx.closePath(); ctx.stroke();
  }
  ctx.restore();
}
// flat-ish wash in a rect with vertical gradient & blotches, for skies and walls
function gradWash(ctx, x, y, w, h, stops, o = {}) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  stops.forEach(([s, c]) => g.addColorStop(s, c));
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const r = mulberry(o.seed || 11);
  const blot = o.blot !== undefined ? o.blot : 18;
  for (let i = 0; i < blot; i++) {
    const cx = x + r() * w, cy = y + r() * h, rr = (0.05 + r() * 0.18) * Math.max(w, h);
    const c = stops[Math.floor(r() * stops.length)][1];
    const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    gg.addColorStop(0, rgba(r() < 0.5 ? darken(c, 0.08) : lighten(c, 0.08), o.blotA || 0.18)); gg.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = gg; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  ctx.restore();
}
// granulation: multiply a fine noise texture over a painted canvas region
let _gran = null;
function granTex() {
  if (_gran) return _gran;
  const c = mkCanvas(512, 512), x = c.getContext('2d'), id = x.createImageData(512, 512);
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) {
    const v = fbm2(i / 9, j / 9, 3) * 0.6 + (hash2(i, j) - 0.5) * 0.7;
    const k = 235 + v * 22; const o = (j * 512 + i) * 4;
    id.data[o] = k; id.data[o + 1] = k - 2; id.data[o + 2] = k - 6; id.data[o + 3] = 255;
  }
  x.putImageData(id, 0, 0); _gran = c; return c;
}
function granulate(ctx, x, y, w, h, a = 0.5) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = a;
  ctx.fillStyle = ctx.createPattern(granTex(), 'repeat'); ctx.fillRect(x, y, w, h); ctx.restore();
}

// ---------- paper ------------------------------------------------------------
let PAPER = null;
function buildPaper() {
  const c = mkCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#f4ecdc'; x.fillRect(0, 0, W, H);
  const id = x.getImageData(0, 0, W, H), d = id.data;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const o = (j * W + i) * 4;
    const v = fbm2(i / 140, j / 140, 3) * 10 + fbm2(i / 6, j / 6, 2) * 5 + (hash2(i * 0.37, j * 0.73) - 0.5) * 9;
    d[o] += v; d[o + 1] += v; d[o + 2] += v * 1.1;
  }
  x.putImageData(id, 0, 0);
  const r = mulberry(99);
  for (let k = 0; k < 2600; k++) { // fibres
    const px = r() * W, py = r() * H, a = r() * TAU, l = 6 + r() * 26;
    x.strokeStyle = r() < 0.5 ? 'rgba(120,100,70,0.10)' : 'rgba(255,255,250,0.22)'; x.lineWidth = 0.6 + r() * 0.6;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 0.5) * l * 0.5, py + Math.sin(a + 0.5) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  PAPER = c;
}
// paper over the finished frame: multiply for tooth, soft-light for warmth
function applyPaper(ctx, strength = 1) {
  if (!PAPER) buildPaper();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.55 * strength;
  const j = drawingIndex(TIME) % 3; // the sheet shifts by a hair between drawings
  ctx.drawImage(PAPER, (j - 1) * 0.7, ((j * 2) % 3 - 1) * 0.7);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.35 * strength; ctx.drawImage(PAPER, 0, 0);
  ctx.restore();
}
function vignette(ctx, a = 0.5, col = '#000') {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, a));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}

// ---------- light & atmosphere ---------------------------------------------
function glow(ctx, x, y, r, col, a = 1, mode = 'lighter') {
  ctx.save(); ctx.globalCompositeOperation = mode;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.35)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
// dust motes drifting inside a clip region; drawn on twos
function dust(ctx, n, box, t, o = {}) {
  const r = mulberry(o.seed || 5); const tt = q12(t);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const bx = r(), by = r(), sp = 0.3 + r(), ph = r() * 100, sz = (o.size || 1.6) * (0.5 + r());
    let x = box[0] + ((bx * box[2] + noise1(ph + tt * 0.15 * sp) * 40 + tt * (o.vx || 3) * sp) % box[2] + box[2]) % box[2];
    let y = box[1] + ((by * box[3] + noise1(ph * 1.3 + tt * 0.12 * sp) * 30 + tt * (o.vy || -2) * sp) % box[3] + box[3]) % box[3];
    const tw = 0.5 + 0.5 * Math.sin(tt * 2 * sp + ph);
    ctx.globalAlpha = (o.alpha || 0.7) * (0.3 + 0.7 * tw);
    ctx.fillStyle = o.col || '#ffe9c0';
    ctx.beginPath(); ctx.arc(x, y, sz, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---------- hand lettering -----------------------------------------------------
// glyph-by-glyph with jitter; `reveal` 0..1 writes it on with a pen point.
function letter(ctx, text, x, y, o = {}) {
  const size = o.size || 48, font = o.font || 'Kalam', col = o.color || '#2a1c14';
  const r = mulberry(o.seed || 3);
  const baseA = ctx.globalAlpha;
  ctx.save();
  ctx.font = `${o.weight || ''} ${size}px "${font}"`.trim();
  ctx.textBaseline = 'alphabetic';
  const chars = [...text];
  let widths = chars.map(ch => ctx.measureText(ch).width * (o.track || 1));
  let total = widths.reduce((a, b) => a + b, 0);
  let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  const reveal = o.reveal !== undefined ? o.reveal : 1;
  const nShow = reveal * chars.length;
  for (let i = 0; i < chars.length; i++) {
    const jr = r(), jr2 = r(), jr3 = r();
    if (i >= nShow) break;
    const part = clamp(nShow - i);
    ctx.save();
    const bob = (noise1(i * 0.7 + (o.seed || 3)) * 0.5) * size * 0.05 + (o.boil ? noise1(i + BOIL * 3.1) * 0.6 : 0);
    ctx.translate(cx + widths[i] / 2, y + bob);
    ctx.rotate((jr - 0.5) * (o.rot || 0.06));
    const s = 1 + (jr2 - 0.5) * 0.06; ctx.scale(s, s);
    ctx.globalAlpha = baseA * (o.alpha !== undefined ? o.alpha : 1) * (0.86 + jr3 * 0.14) * clamp(part * 1.4);
    if (part < 1) { ctx.beginPath(); ctx.rect(-widths[i] / 2 - 2, -size * 1.2, (widths[i] + 4) * part, size * 1.6); ctx.clip(); }
    ctx.fillStyle = col; ctx.textAlign = 'center';
    ctx.fillText(chars[i], 0, 0);
    if (o.double) { ctx.globalAlpha *= 0.35; ctx.fillText(chars[i], 0.8, 0.4); }
    ctx.restore();
    cx += widths[i];
  }
  ctx.restore();
  return total;
}
function letterLines(ctx, lines, x, y, lh, o = {}) {
  const tot = lines.join('').length; let done = 0;
  const rv = o.reveal !== undefined ? o.reveal : 1;
  lines.forEach((ln, i) => {
    const share = ln.length / tot;
    const lr = clamp((rv * tot - done) / Math.max(1, ln.length));
    letter(ctx, ln, x, y + i * lh, Object.assign({}, o, { reveal: lr, seed: (o.seed || 3) + i * 11 }));
    done += ln.length;
  });
}

// ---------- globals set per frame ------------------------------------------------
let TIME = 0;
let RIMG = null; // global rim light for backlit/night scenes: {v:[dx,dy] toward the light, col}
function setRim(v, col) { RIMG = v ? { v, col } : null; }
