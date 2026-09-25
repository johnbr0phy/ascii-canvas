// After Work: audio engine. DSP primitives + instruments, all synthesised.
// Loaded in headless Chromium after src/shots.js. Everything here is plain JS
// writing Float32Arrays, or Web Audio nodes inside an OfflineAudioContext.
'use strict';
const SR = 48000;

// ---------------------------------------------------------------- randomness
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
let _rng = mulberry32(1);
const seed = s => { _rng = mulberry32(s); };
const rnd = () => _rng();
const rr = (a, b) => a + (b - a) * _rng();
const pick = a => a[Math.floor(_rng() * a.length)];
const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += _rng(); return (u - 3) * 1.4142; };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const db = d => Math.pow(10, d / 20);
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

// ---------------------------------------------------------------- timing
// Every cue is (shot id + offset). Nothing absolute.
function at(id, off = 0) {
  const s = shotById(id);
  if (!s) throw new Error('unknown shot ' + id);
  return s.start + off;
}
const shotDur = id => shotById(id).dur;
const shotEnd = (id, off = 0) => shotById(id).end + off;
const CUES = [], NOTES = [];
function cue(stem, id, off, what) {
  const t = at(id, off);
  CUES.push({ stem, shot: id, off: +off.toFixed(3), t: +t.toFixed(3), what });
  return t;
}
function logNote(t, midi, dur, inst, tag) { NOTES.push({ t: +t.toFixed(4), midi, dur: +dur.toFixed(3), inst, tag }); }

// ---------------------------------------------------------------- JS filters
function bq(type, f, Q = 0.707, gainDb = 0) {
  f = clamp(f, 5, SR * 0.49);
  const w = 2 * Math.PI * f / SR, cw = Math.cos(w), sw = Math.sin(w);
  const A = Math.pow(10, gainDb / 40), al = sw / (2 * Q);
  let b0, b1, b2, a0, a1, a2;
  switch (type) {
    case 'lowpass': b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; break;
    case 'highpass': b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; break;
    case 'bandpass': b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; break;
    case 'peaking': b0 = 1 + al * A; b1 = -2 * cw; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cw; a2 = 1 - al / A; break;
    case 'lowshelf': {
      const s = 2 * Math.sqrt(A) * al;
      b0 = A * ((A + 1) - (A - 1) * cw + s); b1 = 2 * A * ((A - 1) - (A + 1) * cw); b2 = A * ((A + 1) - (A - 1) * cw - s);
      a0 = (A + 1) + (A - 1) * cw + s; a1 = -2 * ((A - 1) + (A + 1) * cw); a2 = (A + 1) + (A - 1) * cw - s; break;
    }
    case 'highshelf': {
      const s = 2 * Math.sqrt(A) * al;
      b0 = A * ((A + 1) + (A - 1) * cw + s); b1 = -2 * A * ((A - 1) + (A + 1) * cw); b2 = A * ((A + 1) + (A - 1) * cw - s);
      a0 = (A + 1) - (A - 1) * cw + s; a1 = 2 * ((A - 1) - (A + 1) * cw); a2 = (A + 1) - (A - 1) * cw - s; break;
    }
    default: throw new Error(type);
  }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}
function filt(x, type, f, Q, g) {
  const [b0, b1, b2, a1, a2] = bq(type, f, Q, g);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i], y = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = xi; y2 = y1; y1 = y; x[i] = y;
  }
  return x;
}
// time-varying biquad: fq(i) -> [f, Q] recomputed every 32 samples
function filtTV(x, type, fq, g = 0) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, c = null;
  for (let i = 0; i < x.length; i++) {
    if ((i & 31) === 0) { const [f, Q] = fq(i); c = bq(type, f, Q, g); }
    const xi = x[i], y = c[0] * xi + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
    x2 = x1; x1 = xi; y2 = y1; y1 = y; x[i] = y;
  }
  return x;
}
function lp1(x, f) { const a = Math.exp(-2 * Math.PI * f / SR); let y = 0; for (let i = 0; i < x.length; i++) { y = (1 - a) * x[i] + a * y; x[i] = y; } return x; }
function hp1(x, f) { const a = Math.exp(-2 * Math.PI * f / SR); let y = 0; for (let i = 0; i < x.length; i++) { y = (1 - a) * x[i] + a * y; x[i] = x[i] - y; } return x; }

// Klatt-style two-pole resonator (unity gain at DC)
class Reson {
  constructor(F = 500, BW = 100) { this.y1 = 0; this.y2 = 0; this.set(F, BW); }
  set(F, BW) {
    const C = -Math.exp(-2 * Math.PI * BW / SR), B = 2 * Math.exp(-Math.PI * BW / SR) * Math.cos(2 * Math.PI * F / SR);
    this.A = 1 - B - C; this.B = B; this.C = C;
  }
  tick(x) { const y = this.A * x + this.B * this.y1 + this.C * this.y2; this.y2 = this.y1; this.y1 = y; return y; }
}
class AntiReson {
  constructor(F = 1000, BW = 150) { this.x1 = 0; this.x2 = 0; this.set(F, BW); }
  set(F, BW) {
    const C = -Math.exp(-2 * Math.PI * BW / SR), B = 2 * Math.exp(-Math.PI * BW / SR) * Math.cos(2 * Math.PI * F / SR), A = 1 - B - C;
    this.a = 1 / A; this.b = -B / A; this.c = -C / A;
  }
  tick(x) { const y = this.a * x + this.b * this.x1 + this.c * this.x2; this.x2 = this.x1; this.x1 = x; return y; }
}
// modal strike: sum of exponentially decaying sines [[freq, amp, T60], ...]
function modal(modes, len, { attack = 0.0005 } = {}) {
  const out = buf(len), na = Math.max(1, Math.round(attack * SR));
  for (const [f, a, T] of modes) {
    if (f >= SR / 2) continue;
    const w = 2 * Math.PI * f / SR, d = Math.exp(-6.9 / (T * SR)); let e = a; const p = rr(0, 6.28);
    for (let i = 0; i < out.length; i++) { out[i] += Math.sin(p + w * i) * e * Math.min(1, i / na); e *= d; if (e < 1e-6) break; }
  }
  return out;
}

// ---------------------------------------------------------------- noise + buffers
const buf = s => new Float32Array(Math.max(1, Math.round(s * SR)));
function white(s) { const b = buf(s); for (let i = 0; i < b.length; i++) b[i] = rnd() * 2 - 1; return b; }
function pink(s) {
  const b = buf(s); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < b.length; i++) {
    const w = rnd() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856; b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
    b[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
  }
  return b;
}
function brown(s) { const b = buf(s); let y = 0; for (let i = 0; i < b.length; i++) { y = (y + 0.02 * (rnd() * 2 - 1)) * 0.998; b[i] = y * 3.5; } return b; }
function peak(x) { let m = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > m) m = a; } return m; }
function norm(x, p = 1) { const m = peak(x) || 1; const k = p / m; for (let i = 0; i < x.length; i++) x[i] *= k; return x; }
function scale(x, k) { for (let i = 0; i < x.length; i++) x[i] *= k; return x; }
function mixInto(dst, src, off = 0, g = 1) { for (let i = 0; i < src.length; i++) { const j = i + off; if (j >= 0 && j < dst.length) dst[j] += src[i] * g; } return dst; }
// apply envelope defined by breakpoints [[t, v], ...] (seconds), linear
function envBP(x, pts) {
  let k = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    while (k < pts.length - 2 && t > pts[k + 1][0]) k++;
    const [t0, v0] = pts[k], [t1, v1] = pts[k + 1];
    const u = t1 > t0 ? clamp((t - t0) / (t1 - t0), 0, 1) : 1;
    x[i] *= v0 + (v1 - v0) * u;
  }
  return x;
}
function fadeEdges(x, a = 0.005, r = 0.02) {
  const na = Math.round(a * SR), nr = Math.round(r * SR);
  for (let i = 0; i < na && i < x.length; i++) x[i] *= i / na;
  for (let i = 0; i < nr && i < x.length; i++) x[x.length - 1 - i] *= i / nr;
  return x;
}
// smooth random curve in [-1,1] sampled per-sample, sum of slow sines
function smoothRand(s, rates = [0.07, 0.13, 0.31]) {
  const b = buf(s), ph = rates.map(() => rr(0, 6.283)), amps = rates.map(() => rr(0.5, 1));
  const tot = amps.reduce((a, c) => a + c, 0);
  for (let i = 0; i < b.length; i++) { let v = 0; for (let k = 0; k < rates.length; k++) v += amps[k] * Math.sin(ph[k] + 2 * Math.PI * rates[k] * i / SR); b[i] = v / tot; }
  return b;
}

// ---------------------------------------------------------------- reverb IR
function makeIR({ dur = 2, pre = 0.01, lpA = 9000, lpB = 2500, early = [], density = 1, s = 7, width = 1 }) {
  seed(s);
  const N = Math.round((dur + pre) * SR), out = [new Float32Array(N), new Float32Array(N)];
  for (let ch = 0; ch < 2; ch++) {
    let y = 0;
    const n0 = Math.round(pre * SR);
    for (let i = n0; i < N; i++) {
      const t = (i - n0) / SR;
      const env = Math.exp(-6.9 * t / dur) * Math.min(1, t / 0.006);
      const fc = lpA * Math.pow(lpB / lpA, t / dur), a = Math.exp(-2 * Math.PI * fc / SR);
      let n = rnd() * 2 - 1;
      if (density < 1 && rnd() > density) n = 0; else if (density < 1) n /= Math.sqrt(density);
      y = (1 - a) * n + a * y;
      out[ch][i] = y * env;
    }
    for (const [et, eg] of early) {
      const j = Math.round((pre + et * (ch ? 1.07 : 1)) * SR);
      if (j < N) out[ch][j] += eg * (ch ? 0.8 : 1) * 0.25;
    }
  }
  // mild decorrelation control + energy normalise
  if (width < 1) for (let i = 0; i < N; i++) { const m = (out[0][i] + out[1][i]) / 2; out[0][i] = m + (out[0][i] - m) * width; out[1][i] = m + (out[1][i] - m) * width; }
  for (let ch = 0; ch < 2; ch++) { let e = 0; for (let i = 0; i < N; i++) e += out[ch][i] ** 2; const k = 1 / Math.sqrt(e); for (let i = 0; i < N; i++) out[ch][i] *= k; }
  return out;
}

// ---------------------------------------------------------------- Stem (one OfflineAudioContext)
class Stem {
  constructor(name) {
    this.name = name;
    this.len = Math.round(FILM_DUR * SR);
    this.ctx = new OfflineAudioContext({ numberOfChannels: 2, length: this.len, sampleRate: SR });
    this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
    this.verbs = {};
    this._noise = null;
  }
  addVerb(name, spec, ret = 1) {
    const c = this.ctx.createConvolver(); c.normalize = false; c.buffer = this.toBuffer(makeIR(spec));
    const inp = this.ctx.createGain(), g = this.ctx.createGain(); g.gain.value = ret;
    inp.connect(c); c.connect(g); g.connect(this.master); this.verbs[name] = inp;
  }
  toBuffer(data) {
    const chs = Array.isArray(data) ? data : [data];
    const b = this.ctx.createBuffer(chs.length, chs[0].length, SR);
    chs.forEach((c, i) => b.copyToChannel(c, i));
    return b;
  }
  // connect a node to master via gain -> panner, plus reverb send
  route(node, { gain = 1, pan = 0, verb = null, send = 0, dry = 1 } = {}) {
    const g = this.ctx.createGain(); g.gain.value = gain; node.connect(g);
    const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p);
    if (dry > 0) { if (dry === 1) p.connect(this.master); else { const d = this.ctx.createGain(); d.gain.value = dry; p.connect(d); d.connect(this.master); } }
    if (verb && send > 0) { const s = this.ctx.createGain(); s.gain.value = send; p.connect(s); s.connect(this.verbs[verb]); }
    return g;
  }
  play(data, t, opts = {}) {
    const src = this.ctx.createBufferSource();
    src.buffer = data instanceof AudioBuffer ? data : this.toBuffer(data);
    if (opts.rate) src.playbackRate.value = opts.rate;
    let node = src;
    for (const [type, f, Q] of (opts.filters || [])) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (Q) b.Q.value = Q; node.connect(b); node = b; }
    const g = this.route(node, opts);
    if (t < 0) src.start(0, -t); else src.start(t);
    return g;
  }
  // long white noise buffer shared by node-based beds
  noiseBuf(kind = 'white') {
    this._nb = this._nb || {};
    if (!this._nb[kind]) { seed(kind.length * 97); this._nb[kind] = this.toBuffer(kind === 'pink' ? pink(13.7) : kind === 'brown' ? brown(13.7) : white(13.7)); }
    return this._nb[kind];
  }
  noise(t0, t1, kind = 'white') {
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf(kind); s.loop = true;
    s.start(Math.max(0, t0), rr(0, 13)); s.stop(t1); return s;
  }
  osc(t0, t1, type, f) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(Math.max(0, t0)); o.stop(t1); return o;
  }
  filter(node, type, f, Q = 0.707, gain = 0) {
    const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = Q; b.gain.value = gain; node.connect(b); return b;
  }
  // gain envelope with ~80 ms crossfade edges; pts: [[t, v], ...] absolute
  gainEnv(node, pts) {
    const g = this.ctx.createGain(); g.gain.value = 0; node.connect(g);
    g.gain.setValueAtTime(pts[0][1], Math.max(0, pts[0][0]));
    for (let i = 1; i < pts.length; i++) g.gain.linearRampToValueAtTime(pts[i][1], Math.max(0, pts[i][0]));
    return g;
  }
}
// bed envelope: fade in over xf around t0, out around t1
const bedPts = (t0, t1, v = 1, xf = 0.08) => [[t0 - xf / 2, 0], [t0 + xf / 2, v], [t1 - xf / 2, v], [t1 + xf / 2, 0]];

// ================================================================= INSTRUMENTS
// ---- Piano: additive with inharmonic partials, 1-3 detuned strings, two-stage decay
function piano(midi, { vel = 0.6, len = 5, detune = 0, spread = 1.0, box = 0, hard = 0.5, sustain = 1, s = 0 } = {}) {
  seed(midi * 131 + Math.round(vel * 100) + s * 7919);
  const f0 = mtof(midi) * Math.pow(2, detune / 1200);
  const N = Math.round(len * SR), L = new Float32Array(N), R = new Float32Array(N);
  const B = 0.00022 * Math.pow(2, (midi - 60) / 20);
  const baseT60 = clamp(14 * Math.pow(2, -(midi - 40) / 15), 1.5, 16) * sustain;
  const ns = midi < 40 ? 1 : midi < 50 ? 2 : 3;
  let ampSum = 0;
  for (let n = 1; n <= 40; n++) {
    const fn = n * f0 * Math.sqrt(1 + B * n * n);
    if (fn > 15000) break;
    const amp = (1 / Math.pow(n, 1.25 + (1 - vel) * 1.1 - hard * 0.35)) * (0.3 + Math.abs(Math.sin(Math.PI * n * 0.121))) * (fn > 5000 ? 5000 / fn : 1);
    ampSum += amp;
    const T60 = baseT60 / (1 + 0.28 * (n - 1) * Math.sqrt(f0 / 260));
    const d1 = Math.exp(-6.9 / (T60 * 0.3 * SR)), d2 = Math.exp(-6.9 / (T60 * SR));
    const nsN = n > 8 ? Math.min(ns, 2) : ns;
    for (let k = 0; k < nsN; k++) {
      const cents = (k - (nsN - 1) / 2) * spread + rr(-0.3, 0.3);
      const w = 2 * Math.PI * fn * Math.pow(2, cents / 1200) / SR;
      const c = Math.cos(w), sn = Math.sin(w);
      let x = Math.cos(rr(0, 6.28)), y = Math.sin(rr(0, 6.28)); const r0 = Math.hypot(x, y); x /= r0; y /= r0;
      const a = amp / nsN; let e1 = 0.62 * a, e2 = 0.38 * a;
      const pl = 0.5 + 0.35 * (nsN > 1 ? (k / (nsN - 1) - 0.5) : 0) + (n % 2 ? 0.05 : -0.05);
      for (let i = 0; i < N; i++) {
        const nx = x * c - y * sn; y = x * sn + y * c; x = nx;
        const e = e1 + e2; const v = x * e;
        L[i] += v * (1 - pl) * 2; R[i] += v * pl * 2;
        e1 *= d1; e2 *= d2;
        if ((i & 1023) === 0 && e < 1e-6 * a + 1e-9) break;
      }
    }
  }
  // music-box tine (bell partials an octave up)
  if (box > 0) {
    const fb = f0 * 2;
    [[1, 1, 1.4], [2.76, 0.35, 0.45], [5.40, 0.15, 0.18]].forEach(([r, a, T]) => {
      const w = 2 * Math.PI * fb * r / SR, d = Math.exp(-6.9 / (T * SR * sustain));
      let e = a * box * ampSum * 0.18;
      for (let i = 0; i < N; i++) { const v = Math.sin(w * i) * e; L[i] += v * 0.9; R[i] += v * 1.1; e *= d; }
    });
  }
  // hammer thump
  const hn = Math.round(0.014 * SR); let hy = 0;
  for (let i = 0; i < hn; i++) { hy = 0.8 * hy + 0.2 * (rnd() * 2 - 1); const v = hy * (1 - i / hn) * 0.06 * vel * ampSum * (0.5 + hard); L[i] += v; R[i] += v; }
  // attack ramp + release fade
  const na = Math.round((0.004 - hard * 0.0025) * SR);
  for (let i = 0; i < na; i++) { const g = 0.5 - 0.5 * Math.cos(Math.PI * i / na); L[i] *= g; R[i] *= g; }
  const nr = Math.round(0.3 * SR);
  for (let i = 0; i < nr; i++) { const g = i / nr; L[N - 1 - i] *= g; R[N - 1 - i] *= g; }
  const k = vel / ampSum * 0.9;
  for (let i = 0; i < N; i++) { L[i] *= k; R[i] *= k; }
  return [L, R];
}

// ---- Karplus-Strong plucked string (guitar / harp / pizz)
function pluck(midi, { len = 3, bright = 0.6, T60 = 3, pickPos = 0.18, body = 'guitar', vel = 0.7, s = 0 } = {}) {
  seed(midi * 71 + s * 13 + 5);
  const f0 = mtof(midi), P = SR / f0;
  const Nd = Math.floor(P - 0.5), d = P - Nd - 0.5, C = (1 - d) / (1 + d);
  const line = new Float32Array(Nd);
  // excitation: filtered noise with pick-position comb
  let y = 0; const a = Math.exp(-2 * Math.PI * (500 + bright * 3200) / SR);
  const ex = new Float32Array(Nd);
  for (let i = 0; i < Nd; i++) { y = (1 - a) * (rnd() * 2 - 1) + a * y; ex[i] = y; }
  const pk = Math.max(1, Math.round(pickPos * Nd));
  for (let i = 0; i < Nd; i++) line[i] = ex[i] - (i >= pk ? ex[i - pk] : 0);
  const g = Math.pow(10, -3 / (T60 * f0));
  const N = Math.round(len * SR), out = new Float32Array(N);
  let idx = 0, prev = 0, apx = 0, apy = 0;
  const S = 0.5 - bright * 0.08;
  for (let i = 0; i < N; i++) {
    const cur = line[idx];
    out[i] = cur;
    const avg = (1 - S) * cur + S * prev; prev = cur;
    const v = g * avg;
    const ap = C * v + apx - C * apy; apx = v; apy = ap;
    line[idx] = ap; idx = idx + 1 === Nd ? 0 : idx + 1;
  }
  hp1(out, 50);
  if (body === 'guitar') { filt(out, 'peaking', 105, 2, 5); filt(out, 'peaking', 220, 1.5, 3); filt(out, 'peaking', 2600, 1, 2); filt(out, 'lowpass', 5000, 0.7); }
  else if (body === 'harp') { filt(out, 'peaking', 300, 1, 2); filt(out, 'highshelf', 3000, 0.7, 1); filt(out, 'lowpass', 7000, 0.7); }
  else if (body === 'pizz') { filt(out, 'peaking', 250, 1.2, 4); filt(out, 'lowpass', 2500, 0.7); }
  fadeEdges(out, 0.002, 0.2);
  return norm(out, vel);
}

// ---- Bowed strings / pads: polyBLEP saws with vibrato, bow noise, body EQ
function bowed(midi, dur, { vel = 0.5, att = 0.5, rel = 1.0, vib = 0.0045, vibRate = 5.3, bright = 0.5, players = 1, spread = 7, cello = false, s = 0, noise = 0.03 } = {}) {
  seed(midi * 53 + players * 11 + s * 3 + 1);
  const N = Math.round((dur + rel) * SR), L = new Float32Array(N), R = new Float32Array(N);
  const f0 = mtof(midi);
  for (let p = 0; p < players; p++) {
    const det = players > 1 ? rr(-spread, spread) : 0;
    const vr = vibRate * rr(0.9, 1.1), vph = rr(0, 6.28), vd = vib * rr(0.8, 1.2);
    const pan = players > 1 ? rr(0.2, 0.8) : 0.5;
    const dly = players > 1 ? rr(0, 0.12) : 0;
    let ph = rnd(), drift = 0, press = 0;
    const tmp = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / SR - dly;
      if (t < 0) continue;
      drift = drift * 0.99995 + (rnd() - 0.5) * 0.00002;
      press = press * 0.9995 + (rnd() - 0.5) * 0.0012;
      const vibAmt = vd * clamp((t - 0.25) / 0.6, 0, 1);
      const f = f0 * Math.pow(2, det / 1200) * (1 + vibAmt * Math.sin(vph + 2 * Math.PI * vr * t) + drift);
      const dt = f / SR; ph += dt; if (ph >= 1) ph -= 1;
      let v = 2 * ph - 1;
      if (ph < dt) { const x = ph / dt; v -= x + x - x * x - 1; } else if (ph > 1 - dt) { const x = (ph - 1) / dt; v -= x * x + x + x + 1; }
      let e;
      if (t < att) e = 0.5 - 0.5 * Math.cos(Math.PI * t / att);
      else if (t < dur) e = 1;
      else e = Math.max(0, 1 - (t - dur) / rel) ** 1.6;
      tmp[i] = v * e * (1 + press) + (rnd() * 2 - 1) * noise * e;
    }
    for (let i = 0; i < N; i++) { L[i] += tmp[i] * (1 - pan) * 2 / players; R[i] += tmp[i] * pan * 2 / players; }
  }
  for (const ch of [L, R]) {
    hp1(ch, 35);
    if (cello) { filt(ch, 'peaking', 110, 1.5, 4); filt(ch, 'peaking', 480, 1.2, 2); filt(ch, 'lowpass', 1400 + bright * 2400, 0.6); }
    else { filt(ch, 'peaking', 290, 1.2, 3); filt(ch, 'peaking', 2800, 1.0, bright * 4 - 2); filt(ch, 'lowpass', 1800 + bright * 4500, 0.6); }
  }
  const k = vel / (peak(L) + 1e-9 > peak(R) ? peak(L) + 1e-9 : peak(R) + 1e-9);
  scale(L, k); scale(R, k);
  return [L, R];
}

// ---- Voice: glottal pulse train (Rosenberg) through formant cascade
// ctl: { dur, f0(t), amp(t), breath(t), formants(t) -> [[F,BW],...], nasal: [Fz, BWz] | null, tilt (Hz of one-pole), jitter, shimmer, oq }
function voice(ctl) {
  const N = Math.round(ctl.dur * SR), out = new Float32Array(N);
  const res = [new Reson(), new Reson(), new Reson(), new Reson(), new Reson()];
  const anti = ctl.nasal ? new AntiReson(ctl.nasal[0], ctl.nasal[1]) : null;
  const oq = ctl.oq || 0.6, tp = oq * 0.62, tn = oq - tp;
  const jitter = ctl.jitter ?? 0.006, shimmer = ctl.shimmer ?? 0.05;
  let ph = 0, prevFlow = 0, jf = 1, sa = 1, tiltY = 0, aspY = 0;
  const ta = Math.exp(-2 * Math.PI * (ctl.tilt || 3000) / SR);
  let fm = null;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    if ((i & 63) === 0) { fm = ctl.formants(t); for (let k = 0; k < res.length; k++) if (fm[k]) res[k].set(fm[k][0], fm[k][1]); }
    const f0 = ctl.f0(t) * jf;
    ph += f0 / SR;
    if (ph >= 1) { ph -= 1; jf = 1 + jitter * gauss(); sa = 1 + shimmer * gauss(); }
    let flow;
    if (ph < tp) flow = 0.5 - 0.5 * Math.cos(Math.PI * ph / tp);
    else if (ph < oq) flow = Math.cos(0.5 * Math.PI * (ph - tp) / tn);
    else flow = 0;
    const dflow = (flow - prevFlow) * SR / Math.max(60, f0) * 0.12; prevFlow = flow;
    const amp = ctl.amp(t), br = ctl.breath ? ctl.breath(t) : 0;
    aspY = 0.6 * aspY + 0.4 * (rnd() * 2 - 1);
    const asp = aspY * (0.35 + 0.65 * flow) * br;
    let x = dflow * sa * (1 - br) + asp * 1.2;
    tiltY = (1 - ta) * x + ta * tiltY; x = tiltY;
    x *= amp;
    for (let k = 0; k < fm.length && k < res.length; k++) x = res[k].tick(x);
    if (anti) x = anti.tick(x);
    out[i] = x;
  }
  hp1(out, 70);
  return out;
}
// build f0 contour from notes [{t, midi, dur}] with glides + vibrato
function melodyContour(notes, { glide = 0.07, vib = 0.006, vibRate = 5.2, vibDelay = 0.25, wobble = 0, wobRate = 0.6, scoop = 0 }) {
  return t => {
    let n = notes[0];
    for (const m of notes) if (t >= m.t - glide * 0.5) n = m;
    const idx = notes.indexOf(n), prev = notes[idx - 1];
    let midi = n.midi;
    if (prev && t < n.t + glide * 0.5) { const u = clamp((t - (n.t - glide * 0.5)) / glide, 0, 1); midi = prev.midi + (n.midi - prev.midi) * (0.5 - 0.5 * Math.cos(Math.PI * u)); }
    if (scoop && t >= n.t) midi -= scoop * Math.exp(-(t - n.t) / 0.045);
    const tv = t - n.t;
    const v = vib * clamp((tv - vibDelay) / 0.3, 0, 1) * Math.sin(2 * Math.PI * vibRate * t);
    const w = wobble * (Math.sin(2 * Math.PI * wobRate * t) + 0.5 * Math.sin(2 * Math.PI * wobRate * 2.3 * t + 1));
    return mtof(midi) * (1 + v) * Math.pow(2, w / 1200);
  };
}

// ---- Hum ("mmm") on a note list. notes: [{t (rel s), midi, dur}]
function hum(notes, { gender = 'f', breathy = 0.25, wobble = 0, vib = 0.006, vibRate = 5, oq = 0.7, s = 0, tilt = 1400, comp = null } = {}) {
  if (comp === null) comp = gender === 'f' ? 1.1 : 0.2;   // dB per semitone above D4: evens out the nasal-formant boost
  seed(4001 + s);
  const end = notes[notes.length - 1].t + notes[notes.length - 1].dur + 0.35;
  const f0 = melodyContour(notes, { glide: 0.09, vib, vibRate, wobble, wobRate: 0.55 });
  const nasal = gender === 'f' ? [[290, 190], [1250, 200], [2500, 250], [3500, 300]] : [[240, 160], [1050, 180], [2250, 250], [3200, 300]];
  const amp = t => {
    let a = 0;
    for (const n of notes) {
      const u = t - n.t;
      if (u < -0.06 || u > n.dur + 0.3) continue;
      const on = clamp((u + 0.06) / 0.14, 0, 1), off = clamp(1 - (u - n.dur + 0.05) / 0.3, 0, 1);
      a = Math.max(a, on * off * (0.85 + 0.15 * Math.sin(Math.PI * clamp(u / n.dur, 0, 1))) * db(comp * (n.midi - (gender === 'f' ? 62 : 50))) * (n.vel || 1));
    }
    return a;
  };
  const breath = t => { let b = breathy; for (const n of notes) { const u = t - n.t; if (u > -0.1 && u < 0.12) b = Math.max(b, 0.75 * (1 - Math.abs(u - 0.01) / 0.12)); } return clamp(b, 0, 1); };
  const x = voice({ dur: end, f0, amp, breath, formants: () => nasal, nasal: gender === 'f' ? [950, 160] : [800, 150], tilt, oq, jitter: 0.005, shimmer: 0.04 });
  filt(x, 'lowpass', gender === 'f' ? 2400 : 1800, 0.7);
  return norm(x, 1);
}

// ---- Whistle: sine + tracked breath noise, vibrato, scoops
function whistle(notes, { vib = 0.008, vibRate = 5.6, breath = 0.1 } = {}) {
  seed(777);
  const end = notes[notes.length - 1].t + notes[notes.length - 1].dur + 0.2;
  const N = Math.round(end * SR), out = new Float32Array(N);
  const fc = melodyContour(notes, { glide: 0.05, vib, vibRate, vibDelay: 0.18, scoop: 0.6 });
  const r = new Reson(1000, 80);
  let ph = 0, nz = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, f = fc(t);
    let a = 0;
    for (const n of notes) {
      const u = t - n.t;
      if (u < -0.02 || u > n.dur + 0.1) continue;
      const on = clamp((u + 0.02) / 0.05, 0, 1), off = clamp(1 - (u - n.dur + 0.06) / 0.14, 0, 1);
      a = Math.max(a, on * off * (0.9 - 0.2 * clamp(u / Math.max(0.2, n.dur), 0, 1)));
    }
    ph += f / SR; if (ph > 1) ph -= 1;
    const tone = Math.sin(2 * Math.PI * ph) + 0.03 * Math.sin(4 * Math.PI * ph);
    if ((i & 63) === 0) r.set(f, f / 9);
    nz = rnd() * 2 - 1;
    const tracked = r.tick(nz) * 6;
    out[i] = a * (tone * (1 - breath) + tracked * breath) + a * nz * 0.012;
  }
  hp1(out, 300);
  return norm(out, 1);
}

// ---- Laugh: "ha-ha-ha" bursts. bursts: [{t, f0, dur, amp}]
function laugh(bursts, { F = [[950, 110], [1550, 120], [2850, 160], [4000, 260], [5000, 300]], inhale = null, breathy = 0.3, s = 0, tilt = 12000, oq = 0.5 } = {}) {
  seed(9100 + s);
  const last = bursts[bursts.length - 1];
  const end = (inhale ? inhale.t + inhale.dur : last.t + last.dur) + 0.3;
  const f0 = t => {
    let b = bursts[0]; for (const x of bursts) if (t >= x.t - 0.05) b = x;
    const u = clamp((t - b.t) / b.dur, 0, 1);
    // rise then fall inside each burst
    return b.f0 * (1 + 0.08 * Math.sin(Math.PI * Math.min(1, u * 1.6)) - 0.14 * u * u);
  };
  const amp = t => {
    let a = 0;
    for (const b of bursts) {
      const u = t - b.t; if (u < 0 || u > b.dur + 0.05) continue;
      const hEnd = b.h ?? 0.045;       // aspirated onset (voicing gated off)
      const on = clamp((u - hEnd * 0.6) / 0.02, 0, 1), off = clamp(1 - (u - b.dur + 0.06) / 0.07, 0, 1);
      a = Math.max(a, on * off * b.amp);
    }
    return a;
  };
  const breath = t => {
    let v = breathy;
    for (const b of bursts) { const u = t - b.t; if (u >= -0.01 && u < (b.h ?? 0.045)) v = 1; }
    return v;
  };
  // aspiration needs amplitude too: add a separate h-noise envelope via amp floor
  const ampH = t => {
    let a = amp(t);
    for (const b of bursts) { const u = t - b.t; const h = b.h ?? 0.045; if (u >= -0.005 && u < h + 0.02) a = Math.max(a, b.amp * 0.55 * Math.sin(Math.PI * clamp((u + 0.005) / (h + 0.025), 0, 1))); }
    if (inhale) { const u = t - inhale.t; if (u > 0 && u < inhale.dur) a = Math.max(a, inhale.amp * Math.sin(Math.PI * u / inhale.dur) ** 0.7); }
    return a;
  };
  const breathAll = t => {
    if (inhale) { const u = t - inhale.t; if (u > 0 && u < inhale.dur) return 1; }
    return breath(t);
  };
  const formants = t => {
    let b = bursts[0]; for (const x of bursts) if (t >= x.t - 0.05) b = x;
    const k = b.fk || 1;
    if (inhale && t > inhale.t) return [[700, 200], [1700, 250], [2900, 300], [4100, 350], [5200, 400]];
    return F.map(([f, bw]) => [f * k, bw]);
  };
  const x = voice({ dur: end, f0, amp: ampH, breath: breathAll, formants, tilt, oq, jitter: 0.012, shimmer: 0.08 });
  filt(x, 'peaking', 1500, 1.2, 5); filt(x, 'peaking', 2900, 1.4, 8); filt(x, 'highshelf', 6000, 0.7, -4);
  return norm(x, 1);
}

// ---- Speech-like babble voice (no words): syllables with random vowel formants
const VOWELS = [[730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010], [570, 840, 2410], [300, 870, 2240], [500, 1500, 2500], [660, 1720, 2410], [440, 1020, 2240]];
function babbleVoice(dur, { f0 = 130, fs = 1.0, rate = 4.5, s = 0 } = {}) {
  seed(3000 + s);
  // plan syllables
  const syl = []; let t = rr(0, 0.8);
  while (t < dur) {
    const phraseLen = rr(0.8, 2.6), p0 = t, accent = rr(1.05, 1.3);
    while (t < p0 + phraseLen && t < dur) {
      const d = rr(0.6, 1.4) / rate;
      syl.push({ t, d, v: pick(VOWELS), a: rr(0.5, 1), p: 1 + 0.12 * (1 - (t - p0) / phraseLen) * accent + rr(-0.05, 0.05), fric: rnd() < 0.3 });
      t += d;
    }
    t += rr(0.25, 1.3);
  }
  const find = tt => { let lo = 0, hi = syl.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (syl[m].t <= tt) { r = m; lo = m + 1; } else hi = m - 1; } return r; };
  const cur = tt => { const k = find(tt); if (k < 0) return null; const s0 = syl[k]; return tt < s0.t + s0.d ? s0 : null; };
  return voice({
    dur,
    f0: tt => { const s0 = cur(tt) || syl[Math.max(0, find(tt))] || { p: 1 }; return f0 * s0.p; },
    amp: tt => { const s0 = cur(tt); if (!s0) return 0; const u = (tt - s0.t) / s0.d; return s0.a * Math.sin(Math.PI * u) ** 0.8; },
    breath: tt => { const s0 = cur(tt); if (!s0) return 0.2; const u = (tt - s0.t) / s0.d; return s0.fric && u < 0.25 ? 0.9 : 0.15; },
    formants: tt => { const s0 = cur(tt); const v = s0 ? s0.v : VOWELS[5]; return [[v[0] * fs, 90], [v[1] * fs, 120], [v[2] * fs, 180], [3500 * fs, 300]]; },
    tilt: 2500, oq: 0.6, jitter: 0.01, shimmer: 0.06,
  });
}

// ---- birds
function chirp(t0, dur, fA, fB, amp, out, { vib = 0, vibRate = 30, curve = 1, harm = 0.08 } = {}) {
  const n0 = Math.round(t0 * SR), n = Math.round(dur * SR); let ph = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n, f = fA + (fB - fA) * Math.pow(u, curve), fv = f * (1 + vib * Math.sin(2 * Math.PI * vibRate * i / SR));
    ph += fv / SR; const e = Math.sin(Math.PI * u) ** 0.6;
    const j = n0 + i; if (j < out.length) out[j] += amp * e * (Math.sin(2 * Math.PI * ph) + harm * Math.sin(4 * Math.PI * ph));
  }
}
function birdSong(kind, s = 0) {
  seed(500 + s * 17 + kind.length);
  let out;
  if (kind === 'blackbird') {
    out = buf(2.6); let t = 0.02;
    const nn = Math.floor(rr(4, 7));
    for (let k = 0; k < nn; k++) { const d = rr(0.08, 0.24), fa = rr(1300, 2600), fb = fa * rr(0.8, 1.35); chirp(t, d, fa, fb, rr(0.5, 1), out, { vib: rr(0, 0.015), vibRate: rr(20, 40), curve: rr(0.5, 2) }); t += d + rr(0.02, 0.08); }
    const tw = Math.floor(rr(4, 10));
    for (let k = 0; k < tw; k++) { const d = rr(0.015, 0.035); chirp(t, d, rr(3500, 6000), rr(3000, 6500), rr(0.2, 0.45), out); t += d + rr(0.005, 0.02); }
  } else if (kind === 'sparrow') {
    out = buf(1.4); let t = 0.02; const nn = Math.floor(rr(2, 6));
    for (let k = 0; k < nn; k++) { const d = rr(0.05, 0.09); chirp(t, d, rr(4200, 5200), rr(2800, 3500), rr(0.6, 1), out, { curve: 0.6 }); chirp(t + d, 0.02, 3300, 4500, 0.3, out); t += d + rr(0.07, 0.16); }
  } else if (kind === 'robin') {
    out = buf(2.0); let t = 0.02; const nn = Math.floor(rr(6, 12));
    for (let k = 0; k < nn; k++) { const d = rr(0.03, 0.12); chirp(t, d, rr(3000, 7000), rr(2500, 7500), rr(0.3, 0.8), out, { vib: rr(0, 0.05), vibRate: rr(40, 90) }); t += d + rr(0.01, 0.06); }
  } else if (kind === 'swift') {
    out = buf(0.7); const d = rr(0.25, 0.5), f = rr(6000, 8000); const n = Math.round(d * SR); let ph = 0;
    for (let i = 0; i < n; i++) { const u = i / n, fv = f * (1 + 0.06 * Math.sin(2 * Math.PI * 95 * i / SR) - 0.1 * u); ph += fv / SR; const am = 0.6 + 0.4 * Math.sin(2 * Math.PI * 43 * i / SR); out[i] += Math.sin(Math.PI * u) ** 0.5 * am * (Math.sin(2 * Math.PI * ph) + 0.3 * (rnd() * 2 - 1)); }
  } else if (kind === 'evening') {
    out = buf(1.6); let t = 0.05; const nn = Math.floor(rr(3, 6));
    for (let k = 0; k < nn; k++) { const d = rr(0.1, 0.25); chirp(t, d, rr(2200, 3200), rr(1800, 3400), rr(0.4, 0.9), out, { vib: 0.01, vibRate: 25 }); t += d + rr(0.08, 0.2); }
  }
  hp1(out, 900);
  return norm(fadeEdges(out), 1);
}
