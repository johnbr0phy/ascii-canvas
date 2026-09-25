// After Work: sound design. Every event is (shot id + offset), computed from SHOTS.
'use strict';

// ================================================================= one-shot generators (JS DSP)
function beep(f = 2800, dur = 0.09) {
  const x = buf(dur + 0.01);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = Math.sin(2 * Math.PI * f * t) * Math.min(1, t / 0.002) * clamp((dur - t) / 0.008, 0, 1); }
  return x;
}
function slide(dur = 0.35, { f0 = 700, f1 = 1300, grit = 0.5 } = {}) {
  const x = white(dur);
  filtTV(x, 'bandpass', i => [f0 + (f1 - f0) * (i / x.length), 0.9]);
  let g = 0; for (let i = 0; i < x.length; i++) { if (i % 160 === 0) g = 1 - grit + grit * rnd(); x[i] *= g; }
  envBP(x, [[0, 0], [dur * 0.25, 1], [dur * 0.7, 0.8], [dur, 0]]);
  return norm(x, 1);
}
function thump(f = 90, dur = 0.15, noiseAmt = 0.4) {
  const x = buf(dur); let ph = 0;
  for (let i = 0; i < x.length; i++) { const t = i / SR; const ff = f * (1 + 0.8 * Math.exp(-t / 0.015)); ph += ff / SR; x[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / (dur * 0.3)); }
  const n = lp1(white(dur), 900); envBP(n, [[0, 1], [0.03, 0.2], [dur, 0]]);
  mixInto(x, n, 0, noiseAmt);
  return norm(fadeEdges(x, 0.0008, 0.01), 1);
}
function click(f = 3000, bw = 600, dur = 0.03) {
  const x = buf(dur), r = new Reson(f, bw);
  for (let i = 0; i < x.length; i++) x[i] = r.tick(i < SR * 0.0015 ? rnd() * 2 - 1 : 0);
  return norm(hp1(x, 400), 1);
}
function clunk() {
  const x = thump(62, 0.3, 0.6);
  mixInto(x, modal([[620, 0.5, 0.22], [1370, 0.35, 0.16], [2230, 0.25, 0.12], [3410, 0.15, 0.08]], 0.3), 0, 0.5);
  mixInto(x, click(4200, 1500, 0.02), 0, 0.6);
  mixInto(x, click(2600, 900, 0.03), Math.round(0.055 * SR), 0.35);   // stamp release
  return norm(x, 1);
}
// stick-slip friction: creaks (doors, chairs, tripods)
function creak(dur, { r0 = 40, r1 = 70, wob = 0.35, modes = [[230, 30], [560, 45], [1240, 70], [2400, 120]], bright = 1, s = 0 } = {}) {
  seed(8000 + s);
  const x = buf(dur), rs = modes.map(([f, bw]) => new Reson(f, bw));
  const wph = rr(0, 6), wr = rr(1.5, 3.5);
  let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const u = i / x.length, t = i / SR;
    const rate = (r0 + (r1 - r0) * u) * (1 + wob * Math.sin(wph + 2 * Math.PI * wr * t) + 0.15 * (rnd() - 0.5));
    ph += rate / SR;
    let e = 0; if (ph >= 1) { ph -= 1; e = rr(0.6, 1.2); }
    let y = 0; for (let k = 0; k < rs.length; k++) y += rs[k].tick(e + (rnd() - 0.5) * 0.02 * bright) * (k === 0 ? 1 : 0.7 * bright);
    x[i] = y;
  }
  envBP(x, [[0, 0], [dur * 0.15, 1], [dur * 0.8, 0.8], [dur, 0]]);
  return norm(hp1(x, 90), 1);
}
function crinkle(dur, density = 180) {
  const x = buf(dur); const n = Math.round(dur * density);
  for (let k = 0; k < n; k++) {
    const t = rnd() * dur, j = Math.round(t * SR), a = Math.pow(rnd(), 3), len = Math.round(rr(0.0005, 0.004) * SR);
    for (let i = 0; i < len && j + i < x.length; i++) x[j + i] += (rnd() * 2 - 1) * a * (1 - i / len);
  }
  filt(x, 'highpass', 1500, 0.7); filt(x, 'peaking', 4000, 1, 4);
  envBP(x, [[0, 0], [0.05, 1], [dur * 0.5, 0.6], [dur * 0.7, 1], [dur, 0]]);
  return norm(x, 1);
}
function pageTurn() {
  const d = 0.55, x = white(d);
  filtTV(x, 'bandpass', i => { const u = i / x.length; return [1200 + 3500 * Math.sin(Math.PI * u), 0.8]; });
  envBP(x, [[0, 0], [0.12, 0.7], [0.35, 1], [0.45, 0.4], [d, 0]]);
  mixInto(x, thump(140, 0.08, 0.8), Math.round(0.42 * SR), 0.25);
  return norm(x, 1);
}
// writing strokes: pencil (fine) or chalk (gritty, squeakier)
function strokes(dur, { chalk = false, rate = 3.2, s = 0 } = {}) {
  seed(6100 + s);
  const x = white(dur);
  if (chalk) { filt(x, 'bandpass', 2600, 0.8); filt(x, 'peaking', 5200, 3, 6); } else { filt(x, 'highpass', 2800, 0.7); filt(x, 'lowpass', 9000, 0.7); }
  // stroke envelopes + grain
  let t = 0; const env = new Float32Array(x.length);
  while (t < dur) { const d = rr(0.08, 0.35) * (3.2 / rate); const a = rr(0.5, 1); const j0 = Math.round(t * SR), n = Math.round(d * SR); for (let i = 0; i < n && j0 + i < env.length; i++) env[j0 + i] = a * Math.sin(Math.PI * i / n) ** 0.5; t += d + rr(0.03, 0.2); }
  let g = 1; for (let i = 0; i < x.length; i++) { if (i % 96 === 0) g = chalk ? rr(0.2, 1) : rr(0.6, 1); x[i] *= env[i] * g; }
  return norm(x, 1);
}
function clockTick(tock = false) {
  const x = modal([[tock ? 2150 : 2450, 1, 0.035], [tock ? 3900 : 4300, 0.5, 0.02], [6200, 0.25, 0.012]], 0.08);
  mixInto(x, click(tock ? 1800 : 2100, 800, 0.02), 0, 0.5);
  return norm(x, 1);
}
function drip() {
  const d = 0.09, x = buf(d); let ph = 0; const f0 = rr(900, 1400);
  for (let i = 0; i < x.length; i++) { const t = i / SR; const f = f0 * (1 + 1.2 * (1 - Math.exp(-t / 0.012))); ph += f / SR; x[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.018) * Math.min(1, t / 0.001); }
  mixInto(x, click(rr(3000, 5000), 1500, 0.01), 0, 0.3);
  return norm(x, 1);
}
function crunch(s = 0) {
  seed(7300 + s);
  const d = 0.26, x = buf(d);
  const ng = Math.round(rr(60, 110));
  for (let k = 0; k < ng; k++) {
    const t = Math.pow(rnd(), 1.6) * d * 0.85, j = Math.round(t * SR), a = rr(0.1, 1) * (1 - t / d), len = Math.round(rr(0.0004, 0.003) * SR);
    for (let i = 0; i < len && j + i < x.length; i++) x[j + i] += (rnd() * 2 - 1) * a * (1 - i / len);
  }
  filt(x, 'lowpass', 3200, 0.7); filt(x, 'highpass', 180, 0.7);
  mixInto(x, thump(85, 0.1, 0.9), 0, 0.3);
  return norm(x, 1);
}
function concreteStep(s = 0) { seed(7400 + s); const x = thump(110, 0.08, 0.9); mixInto(x, click(rr(1500, 2500), 1200, 0.02), Math.round(0.02 * SR), 0.15); return norm(x, 1); }
function dogBark(s = 0) {
  seed(7500 + s);
  const d = 0.22;
  const x = voice({ dur: d, f0: t => 520 * (1 - 0.35 * t / d), amp: t => Math.sin(Math.PI * clamp(t / 0.16, 0, 1)) ** 0.5 * (t < 0.16 ? 1 : 0), breath: () => 0.35, formants: () => [[650, 180], [1350, 220], [2500, 300]], tilt: 5000, oq: 0.45, jitter: 0.06, shimmer: 0.2 });
  return norm(x, 1);
}
function clink(f = 2400) { return norm(modal([[f, 1, 0.35], [f * 2.32, 0.6, 0.2], [f * 4.25, 0.35, 0.1], [f * 6.8, 0.2, 0.06]], 0.45), 1); }
function bikeBell() {
  const x = buf(1.6);
  [0, 0.14].forEach(t => mixInto(x, modal([[2850, 1, 1.1], [2871, 0.8, 1.1], [6150, 0.35, 0.5], [8950, 0.15, 0.25]], 1.4), Math.round(t * SR), t ? 0.8 : 1));
  return norm(x, 1);
}
function hiss(dur = 0.45) { const x = white(dur); filt(x, 'highpass', 2500, 0.7); filt(x, 'lowpass', 9000, 0.7); envBP(x, [[0, 0], [0.015, 1], [dur * 0.4, 0.5], [dur, 0]]); return norm(x, 1); }
function whir(dur = 0.6, f0 = 180, f1 = 420) {
  const x = buf(dur); let ph = 0;
  for (let i = 0; i < x.length; i++) { const u = i / x.length; const f = f0 + (f1 - f0) * Math.sin(Math.PI * u * 0.5); ph += f / SR; x[i] = (2 * (ph % 1) - 1) * Math.sin(Math.PI * u) ** 0.7; }
  filt(x, 'bandpass', 1100, 1.2); filt(x, 'lowpass', 3000, 0.7);
  return norm(x, 1);
}
function breathNoise(dur, { inhale = false, tremble = 0, s = 0 } = {}) {
  seed(7700 + s);
  const x = white(dur);
  const r = [new Reson(inhale ? 900 : 650, 400), new Reson(inhale ? 1900 : 1400, 500), new Reson(2700, 600)];
  for (let i = 0; i < x.length; i++) { const v = x[i]; x[i] = r[0].tick(v) * 0.6 + r[1].tick(v) * 0.5 + r[2].tick(v) * 0.25; }
  hp1(x, 250);
  envBP(x, inhale ? [[0, 0], [dur * 0.4, 1], [dur * 0.85, 0.7], [dur, 0]] : [[0, 0], [dur * 0.12, 1], [dur * 0.5, 0.6], [dur, 0]]);
  if (tremble) for (let i = 0; i < x.length; i++) x[i] *= 1 - tremble * (0.5 + 0.5 * Math.sin(2 * Math.PI * 7 * i / SR));
  return norm(x, 1);
}
function metalRattle(dur = 0.7) {
  const x = buf(dur + 0.3); let t = 0;
  while (t < dur) { mixInto(x, modal([[rr(300, 500), 0.6, 0.2], [rr(900, 1300), 0.5, 0.15], [rr(2000, 3000), 0.3, 0.1]], 0.25), Math.round(t * SR), rr(0.3, 1)); t += rr(0.03, 0.09); }
  envBP(x, [[0, 1], [dur, 0.5], [dur + 0.3, 0]]);
  return norm(x, 1);
}
function tinClank() { const x = modal([[880, 0.6, 0.35], [2130, 0.5, 0.25], [3710, 0.3, 0.15], [5210, 0.15, 0.1]], 0.5); mixInto(x, thump(160, 0.06, 0.8), 0, 0.3); return norm(x, 1); }
function screwTicks(dur, s = 0) {
  seed(7900 + s);
  const x = buf(dur + 0.1); let t = 0.02;
  while (t < dur) {
    const turn = rr(0.25, 0.5); let u = 0;
    while (u < turn) { mixInto(x, modal([[rr(4800, 5600), 0.5, 0.02], [rr(7000, 7800), 0.3, 0.015], [rr(2400, 2800), 0.2, 0.02]], 0.04), Math.round((t + u) * SR), rr(0.3, 1)); u += rr(0.05, 0.1); }
    t += turn + rr(0.12, 0.3);
  }
  return norm(x, 1);
}
function rub(dur, s = 0) {
  seed(8100 + s);
  const x = white(dur); filt(x, 'bandpass', 1800, 0.7); filt(x, 'peaking', 3500, 2, 3);
  const rate = rr(2.2, 2.8);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] *= Math.abs(Math.sin(Math.PI * rate * t)) ** 1.5 * (0.7 + 0.3 * rnd()); }
  envBP(x, [[0, 0], [0.1, 1], [dur - 0.15, 1], [dur, 0]]);
  return norm(x, 1);
}
// kettle: boil rumble, rising whistle to tOff, switch click, whistle collapses
function kettle(tOff = 3.0, len = 5.5) {
  seed(8200);
  const x = buf(len);
  const boil = brown(len); filt(boil, 'lowpass', 500, 0.7);
  const bub = white(len); filt(bub, 'bandpass', 900, 1.2);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR, up = clamp(t / tOff, 0, 1), down = t < tOff ? 1 : Math.exp(-(t - tOff) / 0.6);
    const am = 0.5 + 0.5 * Math.sin(2 * Math.PI * (9 + 5 * up) * t + 3 * Math.sin(2 * Math.PI * 1.7 * t));
    x[i] = (boil[i] * (0.3 + 0.7 * up) + bub[i] * 0.4 * am * up) * down * 0.5;
  }
  // whistle tone + tracked noise
  const r = new Reson(1500, 60); let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR; if (t < 0.7) continue;
    const u = clamp((t - 0.7) / (tOff - 0.7), 0, 1);
    const after = t < tOff ? 1 : Math.exp(-(t - tOff) / 0.09);
    const f = (1450 + 700 * u * u) * (t < tOff ? 1 : 1 - 0.25 * (1 - after)) * (1 + 0.004 * Math.sin(2 * Math.PI * 6 * t));
    ph += f / SR;
    if ((i & 63) === 0) r.set(f, 40);
    const a = u * u * after;
    x[i] += a * (0.55 * Math.sin(2 * Math.PI * ph) + r.tick(rnd() * 2 - 1) * 4);
  }
  mixInto(x, click(2200, 700, 0.03), Math.round(tOff * SR), 0.9);
  mixInto(x, thump(180, 0.05, 1), Math.round((tOff + 0.012) * SR), 0.3);
  return norm(fadeEdges(x, 0.2, 0.2), 1);
}
function chairScrape(dur = 0.55) {
  const x = creak(dur, { r0: 140, r1: 260, wob: 0.25, modes: [[180, 40], [420, 60], [950, 90], [2100, 150]], s: 3 });
  const n = white(dur); filt(n, 'bandpass', 1400, 0.8); envBP(n, [[0, 0], [0.05, 1], [dur * 0.8, 0.7], [dur, 0]]);
  mixInto(x, n, 0, 0.25);
  mixInto(x, thump(120, 0.1, 0.8), Math.round((dur - 0.02) * SR), 0.5);
  return norm(x, 1);
}
function doorOpen(creakDur = 0.9, s = 0) {
  const x = buf(creakDur + 0.4);
  mixInto(x, click(2300, 900, 0.03), 0, 0.7);                   // latch
  mixInto(x, click(1500, 700, 0.03), Math.round(0.07 * SR), 0.4);
  mixInto(x, creak(creakDur, { r0: 35, r1: 60, wob: 0.4, s }), Math.round(0.12 * SR), 0.6);
  return norm(x, 1);
}
function doorClose() {
  const x = buf(0.6);
  mixInto(x, thump(75, 0.3, 0.7), 0, 1);
  mixInto(x, click(2000, 800, 0.04), Math.round(0.035 * SR), 0.5);
  mixInto(x, modal([[340, 0.3, 0.2], [760, 0.2, 0.15]], 0.3), 0, 0.3);
  return norm(x, 1);
}
function rumble(dur, s = 0) {
  seed(8300 + s);
  const x = brown(dur); filt(x, 'lowpass', 90, 0.7); filt(x, 'lowpass', 90, 0.7);
  const n = pink(dur); filt(n, 'lowpass', 260, 0.7);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = x[i] * 1.0 + n[i] * 0.35 + 0.25 * Math.sin(2 * Math.PI * 31 * t) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.37 * t)) + 0.15 * Math.sin(2 * Math.PI * 47 * t); }
  // crackle of distant engine, very low
  hp1(x, 18);
  envBP(x, [[0, 0], [4.0, 1], [5.5, 0.9], [dur, 0]]);
  return norm(x, 1);
}
function rainBuf(dur, ramp = 3.0) {
  seed(8400);
  const L = pink(dur), R = pink(dur);
  for (const x of [L, R]) { filt(x, 'highpass', 450, 0.7); filt(x, 'lowpass', 6500, 0.7); }
  const low = brown(dur); filt(low, 'lowpass', 350, 0.7);
  for (let i = 0; i < L.length; i++) { const t = i / SR, g = clamp(t / ramp, 0, 1) ** 1.5; L[i] = (L[i] * 0.5 + low[i] * 0.25) * g; R[i] = (R[i] * 0.5 + low[i] * 0.25) * g; }
  // droplets on the window, density rising
  let t = 0;
  while (t < dur) {
    const dens = 3 + 45 * clamp(t / ramp, 0, 1) ** 1.3;
    t += -Math.log(1 - rnd()) / dens;
    const x = modal([[rr(1500, 6000), 1, rr(0.004, 0.015)]], 0.03), a = Math.pow(rnd(), 2) * 0.9;
    const pan = rnd();
    mixInto(L, x, Math.round(t * SR), a * (1 - pan)); mixInto(R, x, Math.round(t * SR), a * pan);
  }
  const m = Math.max(peak(L), peak(R)); scale(L, 1 / m); scale(R, 1 / m);
  return [L, R];
}
function cricketsBuf(dur, s = 0) {
  seed(8500 + s);
  const fc = rr(4200, 5000), pulse = rr(0.012, 0.018), pp = rr(0.028, 0.04), np = Math.floor(rr(3, 5)), cp = rr(0.45, 0.9);
  const x = buf(dur); let t = rr(0, cp);
  while (t < dur - 0.3) {
    const a = rr(0.7, 1);
    for (let k = 0; k < np; k++) {
      const j0 = Math.round((t + k * pp) * SR), n = Math.round(pulse * SR);
      for (let i = 0; i < n && j0 + i < x.length; i++) x[j0 + i] += a * Math.sin(2 * Math.PI * fc * (j0 + i) / SR) * Math.sin(Math.PI * i / n);
    }
    t += cp * rr(0.93, 1.07);
  }
  return x;
}
function childBurst(s) {
  seed(8600 + s);
  if (rnd() < 0.4) { // squeal: high glide
    const d = rr(0.25, 0.5), f = rr(700, 1000);
    return norm(voice({ dur: d + 0.1, f0: t => f * (1 + 0.3 * Math.sin(Math.PI * t / d)), amp: t => Math.sin(Math.PI * clamp(t / d, 0, 1)), breath: () => 0.3, formants: () => [[1000, 150], [1800, 180], [3000, 250], [4200, 300]], tilt: 6000, oq: 0.5 }), 1);
  }
  const f = rr(330, 450), n = Math.floor(rr(3, 6));
  return laugh(Array.from({ length: n }, (_, i) => ({ t: 0.03 + i * rr(0.18, 0.24), f0: f * (1 - i * 0.04), dur: rr(0.11, 0.15), amp: rr(0.6, 1) * (1 - i * 0.08), h: 0.03, fk: rr(0.95, 1.1) })), { s });
}

// Sam (11): five 'ha' bursts, pitch falling across bursts, slowing, then an inhale
function samLaughBursts(sc = 1) {
  const T = [0, 0.205, 0.415, 0.64, 0.885], F = [455, 440, 418, 392, 362], D = [0.15, 0.15, 0.155, 0.165, 0.19], A = [0.85, 1, 0.92, 0.78, 0.6];
  return T.map((t, i) => ({ t: 0.05 + t * sc, f0: F[i], dur: D[i], amp: A[i], h: i === 0 ? 0.06 : 0.04, fk: [1, 1.03, 0.99, 0.97, 0.95][i] }));
}

// ================================================================= node-based beds
function fillCurve(n, fn) { const c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = fn(i); return c; }
function gustCurve(t0, t1, rate = 20, s = 0) {
  seed(9000 + s); const ph = [rr(0, 6), rr(0, 6), rr(0, 6)];
  const n = Math.max(2, Math.ceil((t1 - t0) * rate) + 1);
  return fillCurve(n, i => { const t = t0 + i / rate; return clamp(0.5 + 0.5 * (0.6 * Math.sin(ph[0] + 2 * Math.PI * 0.085 * t) + 0.3 * Math.sin(ph[1] + 2 * Math.PI * 0.21 * t) + 0.15 * Math.sin(ph[2] + 2 * Math.PI * 0.53 * t)), 0, 1); });
}
function windBed(st, t0, t1, { level = 1, lo = 250, hi = 900, q = 0.8, moan = 0, moanLo = 450, moanHi = 800, pan = 0, verb = null, send = 0, s = 0, lp = 8000 } = {}) {
  const a = Math.max(0, t0 - 0.1), b = t1 + 0.1, rate = 20, gc = gustCurve(a, b, rate, s), dur = (gc.length - 1) / rate;
  const src = st.noise(a, b, 'pink');
  const bp = st.filter(src, 'bandpass', lo, q);
  bp.frequency.setValueCurveAtTime(gc.map(g => lo + (hi - lo) * g), a, dur);
  const gg = st.ctx.createGain(); gg.gain.setValueCurveAtTime(gc.map(g => 0.25 + 0.75 * g * g), a, dur); bp.connect(gg);
  const l = st.filter(gg, 'lowpass', lp, 0.7);
  if (moan > 0) {
    const m = st.filter(src, 'bandpass', moanLo, 18);
    m.frequency.setValueCurveAtTime(gc.map(g => moanLo + (moanHi - moanLo) * g), a, dur);
    const mg = st.ctx.createGain(); mg.gain.setValueCurveAtTime(gc.map(g => moan * g * g * g), a, dur); m.connect(mg); mg.connect(l);
  }
  const env = st.gainEnv(l, bedPts(t0, t1, 1));
  return st.route(env, { gain: level, pan, verb, send });
}
// generic filtered-noise bed (room tone, air, town)
function noiseBed(st, t0, t1, { kind = 'pink', lp = 400, hp = 30, level = 1, pan = 0, verb = null, send = 0, xf = 0.08, bp = null } = {}) {
  const src = st.noise(t0 - xf, t1 + xf, kind);
  let n = st.filter(src, 'lowpass', lp, 0.7); n = st.filter(n, 'highpass', hp, 0.7);
  if (bp) n = st.filter(n, 'bandpass', bp[0], bp[1]);
  const env = st.gainEnv(n, bedPts(t0, t1, 1, xf));
  return st.route(env, { gain: level, pan, verb, send });
}
function playBed(st, data, t0, t1, opts = {}) {
  const src = st.ctx.createBufferSource(); src.buffer = st.toBuffer(data); src.loop = !!opts.loop;
  let node = src;
  for (const [type, f, Q] of (opts.filters || [])) node = st.filter(node, type, f, Q || 0.707);
  const env = st.gainEnv(node, opts.pts || bedPts(t0, t1, 1, opts.xf || 0.08));
  src.start(Math.max(0, t0 - 0.05)); src.stop(t1 + 0.2);
  return st.route(env, opts);
}
function rollerRattle(dur) {
  seed(9100);
  const x = buf(dur); let t = 0;
  while (t < dur) { const m = modal([[rr(600, 1500), 1, rr(0.01, 0.04)], [rr(2000, 3500), 0.4, 0.01]], 0.06); mixInto(x, m, Math.round(t * SR), rr(0.1, 1) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.4 * t))); t += rr(0.02, 0.07); }
  return norm(x, 1);
}

// warehouse bed: hum + rumble + buzz + rollers, with per-shot automation
// prof: [[t, level, lp, detuneCents], ...] (absolute times, applied as ~80ms ramps)
function warehouseBed(st, t0, t1, prof, { thin = false } = {}) {
  const ctx = st.ctx, sum = ctx.createGain();
  const oscs = [];
  [[60, 0.5], [120, 0.42], [180, 0.14], [240, 0.08], [300, 0.05], [360, 0.03]].forEach(([f, g]) => {
    const o = st.osc(t0 - 0.1, t1 + 0.3, 'sine', f * (1 + rr(-0.002, 0.002))); const gg = ctx.createGain(); gg.gain.value = g * (thin && f < 150 ? 0.35 : 1); o.connect(gg); gg.connect(sum); oscs.push(o);
  });
  const rum = st.noise(t0 - 0.1, t1 + 0.3, 'brown'); const rl = st.filter(rum, 'lowpass', 170, 0.7); const rg = ctx.createGain(); rg.gain.value = thin ? 0.25 : 0.6; rl.connect(rg); rg.connect(sum);
  const air = st.noise(t0 - 0.1, t1 + 0.3, 'pink'); const ab = st.filter(air, 'bandpass', 600, 0.5); const ag = ctx.createGain(); ag.gain.value = 0.2; ab.connect(ag); ag.connect(sum);
  const bz = st.osc(t0 - 0.1, t1 + 0.3, 'sawtooth', 100); const bz2 = st.osc(t0 - 0.1, t1 + 0.3, 'sawtooth', 100.35);
  const bzs = ctx.createGain(); bzs.gain.value = 0.5; bz.connect(bzs); bz2.connect(bzs);
  const bb = st.filter(st.filter(bzs, 'bandpass', 2300, 1.3), 'highpass', 700, 0.7); const bg = ctx.createGain(); bg.gain.value = thin ? 0.03 : 0.045; bb.connect(bg); bg.connect(sum);
  oscs.push(bz, bz2);
  if (!thin) {
    const rb = ctx.createBufferSource(); rb.buffer = st.toBuffer(rollerRattle(7.3)); rb.loop = true; rb.start(Math.max(0, t0 - 0.1)); rb.stop(t1 + 0.3);
    const rbf = st.filter(rb, 'bandpass', 1200, 0.6); const rbg = ctx.createGain(); rbg.gain.value = 0.18; rbf.connect(rbg); rbg.connect(sum);
  }
  const lp = st.filter(sum, 'lowpass', 12000, 0.6);
  const out = thin ? st.filter(lp, 'highpass', 90, 0.7) : lp;
  const env = ctx.createGain(); env.gain.value = 0; out.connect(env);
  // automation
  const first = prof[0];
  env.gain.setValueAtTime(0, Math.max(0, first[0])); lp.frequency.setValueAtTime(first[2], Math.max(0, first[0]));
  for (let i = 0; i < prof.length; i++) {
    const [t, lv, f, det, ramp = 0.08] = prof[i];
    const ta = Math.max(0, t - (i === 0 ? 0 : ramp / 2)), tb = t + (i === 0 ? ramp : ramp / 2);
    env.gain.setValueAtTime(i === 0 ? 0 : prof[i - 1][1], ta); env.gain.linearRampToValueAtTime(lv, tb);
    lp.frequency.setValueAtTime(i === 0 ? f : prof[i - 1][2], ta); lp.frequency.exponentialRampToValueAtTime(f, tb);
    for (const o of oscs) { o.detune.setValueAtTime(i === 0 ? det : prof[i - 1][3], ta); o.detune.linearRampToValueAtTime(det, tb); }
  }
  return st.route(env, { gain: 1, pan: 0, verb: 'warehouse', send: 0.22 });
}

// ================================================================= BUILD
function buildSfx(st) {
  seed(4242);
  st.addVerb('warehouse', { dur: 3.8, pre: 0.035, lpA: 6000, lpB: 1200, early: [[0.03, 0.6], [0.055, 0.5], [0.08, 0.4], [0.11, 0.3]], s: 21 });
  st.addVerb('room', { dur: 0.5, pre: 0.003, lpA: 8000, lpB: 3000, early: [[0.004, 0.6], [0.007, 0.5], [0.011, 0.4]], s: 22 });
  st.addVerb('hall', { dur: 1.4, pre: 0.012, lpA: 7000, lpB: 2200, early: [[0.012, 0.5], [0.023, 0.4], [0.037, 0.3]], s: 23 });
  st.addVerb('outdoor', { dur: 1.1, pre: 0.02, lpA: 6000, lpB: 1800, density: 0.2, early: [[0.03, 0.3]], s: 24 });
  st.addVerb('night', { dur: 2.4, pre: 0.03, lpA: 5000, lpB: 1500, density: 0.3, early: [[0.04, 0.3], [0.09, 0.2]], s: 25 });
  st.addVerb('memory', { dur: 2.6, pre: 0.02, lpA: 3500, lpB: 1200, s: 26 });
  const P = (id, off, what, x, o) => { const t = cue('sfx', id, off, what); st.play(x, t, o); return t; };
  const E = id => shotEnd(id);

  // ---------------------------------------------------------------- room tone for every shot (never digital silence)
  const TONE = {
    S01: ['cupboard', { lp: 260, level: db(-54) }], S02: ['air', { lp: 500, level: db(-60) }],
    S08: ['kitchen', { lp: 350, level: db(-52) }], S11: ['kitchen', { lp: 350, level: db(-52) }], S12: ['kitchen', { lp: 350, level: db(-52) }],
    S13: ['hall', { lp: 300, level: db(-53) }], S15: ['kitchen-cold', { lp: 300, level: db(-53) }], S17: ['hall-in', { lp: 600, level: db(-50) }],
    S18: ['kitchen', { lp: 350, level: db(-52) }], S19: ['hall', { lp: 280, level: db(-54) }], S20: ['kitchen-day', { lp: 500, level: db(-51) }],
    S21: ['memory', { lp: 700, hp: 150, level: db(-52) }], S22: ['kitchen-day', { lp: 500, level: db(-51) }], S23: ['kitchen-day', { lp: 500, level: db(-51) }],
    S24: ['night', { lp: 450, level: db(-50) }], S25: ['night', { lp: 400, level: db(-56) }], S26: ['night', { lp: 450, level: db(-51) }],
    S27: ['day-out', { lp: 1200, level: db(-50) }], S28: ['roof', { lp: 1500, level: db(-49) }], S29: ['street-day', { lp: 1500, level: db(-48) }],
    S30: ['kitchen-day', { lp: 500, level: db(-51) }], S31: ['hall-in', { lp: 600, level: db(-50) }],
    S32: ['night', { lp: 450, level: db(-50) }], S33: ['night', { lp: 450, level: db(-50) }], S34: ['night', { lp: 450, level: db(-50) }],
    S35: ['night', { lp: 450, level: db(-51) }], S36: ['space', { lp: 300, level: db(-55) }], S37: ['air', { lp: 400, level: db(-58) }],
    S14: ['street-snow', { lp: 300, level: db(-54) }], S16: ['street-snow', { lp: 300, level: db(-54) }],
    S07: ['warehouse-door', { lp: 900, level: db(-54) }], S09: ['warehouse-new', { lp: 1500, level: db(-55) }], S10: ['warehouse-new', { lp: 1500, level: db(-55) }],
    S03: ['warehouse', { lp: 800, level: db(-58) }], S04: ['warehouse', { lp: 800, level: db(-58) }], S05: ['warehouse', { lp: 800, level: db(-58) }], S06: ['warehouse', { lp: 800, level: db(-58) }],
  };
  for (const s of SHOTS) { const tn = TONE[s.id]; if (!tn) continue; const [, o] = tn; noiseBed(st, s.start, s.end, { kind: 'pink', lp: o.lp, hp: o.hp || 30, level: o.level }); }
  cue('sfx', 'S01', 0, 'Room tone on every shot (pink noise, per-location filtering), 80 ms crossfades');

  // ---------------------------------------------------------------- S01-S02: cupboard, clock in another room
  cue('sfx', 'S01', 0, 'Distant clock in another room (muffled ticks)');
  for (let k = 0; at('S01', 0.4 + k) < E('S01') - 0.05; k++) st.play(clockTick(k % 2 === 1), at('S01', 0.4 + k), { gain: db(-44), pan: -0.4, filters: [['lowpass', 1800]], verb: 'room', send: 0.4 });

  // ---------------------------------------------------------------- warehouse bed S02 (pre-lap) .. S07 (door)
  {
    const tIn = cue('sfx', 'S02', shotDur('S02') - 1.0, 'Conveyor hum pre-laps under the last second of the title');
    const tCut = cue('sfx', 'S07', 2.3, 'Warehouse hum cut as the door opens');
    const prof = [
      [tIn, 0.45, 9000, 0, 1.0],
      [at('S03'), db(-17) / db(-17), 12000, 0],
      [at('S04'), 0.72, 10000, 0],
      [at('S05'), 1.0, 380, -300],
      [at('S06'), 0.8, 1600, -120],
      [at('S07'), 0.85, 12000, 0],
      [tCut, 0.0, 3000, 0, 0.18],
    ];
    const g = warehouseBed(st, tIn, tCut + 0.2, prof);
    g.gain.value = db(-23);
    cue('sfx', 'S05', 0, 'Hum muffled and pitched down (inside her head)');
  }
  // S03: distant scanner beeps, cage rattle, clatter, parcels sliding
  {
    cue('sfx', 'S03', 0.7, 'Distant scanner beeps, cage rattle (3.2 s), clatter (5.2 s), cardboard slides');
    [0.7, 2.1, 3.4, 4.6, 5.9].forEach(o => st.play(beep(rr(2500, 3100), 0.08), at('S03', o), { gain: db(-42), pan: rr(-0.8, 0.8), filters: [['lowpass', 5000]], verb: 'warehouse', send: 0.9, dry: 0.4 }));
    st.play(metalRattle(0.8), at('S03', 3.2), { gain: db(-36), pan: -0.7, filters: [['lowpass', 2500]], verb: 'warehouse', send: 1.0, dry: 0.35 });
    st.play(thump(95, 0.2, 0.7), at('S03', 5.2), { gain: db(-34), pan: 0.6, verb: 'warehouse', send: 0.9, dry: 0.5 });
    st.play(slide(0.4), at('S03', 5.25), { gain: db(-40), pan: 0.6, verb: 'warehouse', send: 0.8, dry: 0.5 });
    [1.3, 3.8].forEach(o => st.play(slide(0.35, { f0: 600, f1: 1100 }), at('S03', o), { gain: db(-34), pan: 0.25, verb: 'warehouse', send: 0.4 }));
  }
  // S04: her hands: beep on each scan (1.0, 2.6, 4.2), cardboard slides, the rhythm of it
  {
    [1.0, 2.6, 4.2].forEach((o, k) => {
      const t = cue('sfx', 'S04', o, `Scan beep ${k + 1} (2.8 kHz)`);
      st.play(beep(2800, 0.09), t, { gain: db(-24), pan: 0.05, verb: 'warehouse', send: 0.12 });
      st.play(slide(0.32, { f0: 800, f1: 1500 }), t - 0.55, { gain: db(-27), pan: -0.15, verb: 'room', send: 0.2 });
      st.play(slide(0.28, { f0: 1100, f1: 700 }), t + 0.35, { gain: db(-28), pan: 0.2, verb: 'room', send: 0.2 });
      st.play(thump(120, 0.08, 0.9), t + 0.62, { gain: db(-29), pan: 0.25, verb: 'room', send: 0.2 });
      st.play(breathNoise(0.15, { s: k }), t - 0.2, { gain: db(-44), pan: 0, filters: [['highpass', 2000]] });  // glove rustle
    });
  }
  // S05: her slow breath inside the muffled hum
  P('S05', 1.2, 'Her slow tired breath (exhale)', breathNoise(1.8, { s: 5 }), { gain: db(-38), pan: 0, verb: 'room', send: 0.2 });
  // S07: time card slide, CLUNK at 1.6, door, early birds, outdoor dawn air
  {
    P('S07', 1.15, 'Time card slides in', slide(0.3, { f0: 1500, f1: 2500, grit: 0.3 }), { gain: db(-30), verb: 'warehouse', send: 0.2 });
    P('S07', 1.6, 'Time card CLUNK (thump + stamp click + metal)', clunk(), { gain: db(-15), verb: 'warehouse', send: 0.3 });
    P('S07', 2.2, 'Door (push bar) opening', doorOpen(0.6, 1), { gain: db(-28), pan: 0.4, verb: 'warehouse', send: 0.25 });
    const t = cue('sfx', 'S07', 2.3, 'Outdoor dawn air + early birds');
    noiseBed(st, t, E('S07'), { kind: 'pink', lp: 2500, hp: 200, level: db(-44), xf: 0.2 });
    [[2.6, 'sparrow', 0.5], [3.2, 'robin', -0.3]].forEach(([o, k, p], i) => st.play(birdSong(k, i + 1), at('S07', o), { gain: db(-36), pan: p, verb: 'outdoor', send: 0.4 }));
  }
  // S08: kitchen at dawn: kettle rising, click off at 3.0, chair scrape 3.1, blackbird outside
  {
    P('S08', 0, 'Kettle boiling, whistle rising to 3.0 s then clicks off', kettle(3.0, 5.5), { gain: db(-22), pan: -0.3, verb: 'room', send: 0.3 });
    cue('sfx', 'S08', 3.0, 'Kettle switch click');
    P('S08', 3.1, 'Chair scrape', chairScrape(0.55), { gain: db(-22), pan: 0.15, verb: 'room', send: 0.3 });
    P('S08', 3.8, 'Coat rustle as she sits', breathNoise(0.5, { s: 8 }), { gain: db(-40), pan: 0.1, filters: [['highpass', 1500]] });
    P('S08', 4.7, 'A tired sigh', breathNoise(1.4, { s: 9 }), { gain: db(-36), pan: 0.1, verb: 'room', send: 0.3 });
    [[1.1, 0], [4.4, 1]].forEach(([o, s]) => P('S08', o, 'Blackbird outside the window', birdSong('blackbird', 10 + s), { gain: db(-33), pan: 0.55, filters: [['lowpass', 5000]], verb: 'outdoor', send: 0.3 }));
  }
  // S09-S10: the new machines; old hum thinner
  {
    const t0 = cue('sfx', 'S09', 0, 'Warehouse hum returns thinner (new machines)');
    const prof = [[t0, 0.5, 7000, 0, 0.08], [at('S10'), 0.45, 7000, 0], [E('S10'), 0, 7000, 0]];
    const g = warehouseBed(st, t0, E('S10'), prof, { thin: true }); g.gain.value = db(-21);
    cue('sfx', 'S09', 0.4, 'Pneumatic hisses + servo whirs in a gentle rhythm, clean high beeps, footsteps');
    for (let k = 0; at('S09', 0.4 + k * 1.3) < E('S09') - 0.3; k++) {
      const t = at('S09', 0.4 + k * 1.3), pan = [-0.6, -0.2, 0.2, 0.6][k % 4];
      const paused = k === 2;   // the nearest arm pauses to let her pass
      st.play(whir(paused ? 0.35 : 0.6, 170, paused ? 260 : 420), t, { gain: db(-33), pan, verb: 'warehouse', send: 0.25 });
      if (!paused) st.play(hiss(0.4), t + 0.62, { gain: db(-34), pan, verb: 'warehouse', send: 0.25 });
      if (paused) st.play(whir(0.5, 200, 400), t + 1.0, { gain: db(-33), pan, verb: 'warehouse', send: 0.25 });
      if (k % 2 === 1) { st.play(beep(3600, 0.05), t + 0.9, { gain: db(-36), pan, verb: 'warehouse', send: 0.3 }); st.play(beep(3600, 0.05), t + 1.0, { gain: db(-38), pan, verb: 'warehouse', send: 0.3 }); }
    }
    for (let k = 0; at('S09', 0.3 + k * 0.62) < E('S09') - 0.2; k++) st.play(concreteStep(k), at('S09', 0.3 + k * 0.62), { gain: db(-38), pan: -0.3 + k * 0.06, verb: 'warehouse', send: 0.3 });
    // S10: gripper at double tempo: beep every 0.8 s from 0.6 s
    for (let k = 0; at('S10', 0.6 + k * 0.8) < E('S10') - 0.1; k++) {
      const t = cue('sfx', 'S10', 0.6 + k * 0.8, `Gripper scan beep ${k + 1}`);
      st.play(beep(2800, 0.09), t, { gain: db(-24), pan: 0.05, verb: 'warehouse', send: 0.12 });
      st.play(whir(0.28, 220, 480), t - 0.32, { gain: db(-32), pan: -0.1, verb: 'room', send: 0.2 });
      st.play(slide(0.2, { f0: 900, f1: 1400 }), t + 0.18, { gain: db(-30), pan: 0.15, verb: 'room', send: 0.2 });
      st.play(thump(130, 0.06, 0.9), t + 0.4, { gain: db(-31), pan: 0.2, verb: 'room', send: 0.2 });
    }
    P('S10', 2.3, 'Her glove enters, hesitates (rustle)', breathNoise(0.3, { s: 12 }), { gain: db(-42), pan: -0.4, filters: [['highpass', 2000]] });
    P('S10', 3.5, 'Glove withdraws (rustle)', breathNoise(0.35, { s: 13 }), { gain: db(-43), pan: -0.4, filters: [['highpass', 2000]] });
  }
  // S11-S13: fear. Clock tick (1 Hz), fridge hum, breath, rain
  {
    const t0 = cue('sfx', 'S11', 0.35, 'Kitchen clock tick 1 Hz (S11-S13), fridge hum');
    for (let k = 0; t0 + k < E('S13') - 0.05; k++) {
      const t = t0 + k, far = t >= at('S13');
      st.play(clockTick(k % 2 === 1), t, { gain: db(far ? -35 : -28), pan: far ? 0.2 : -0.35, verb: far ? 'hall' : 'room', send: 0.3, filters: far ? [['lowpass', 3000]] : [] });
    }
    for (const id of ['S11', 'S12', 'S13']) {
      const lv = id === 'S13' ? db(-48) : db(-42);
      const src = st.ctx.createGain();
      [[50, 1], [100, 0.5], [150, 0.25], [200, 0.1]].forEach(([f, g]) => { const o = st.osc(at(id) - 0.1, E(id) + 0.1, 'sine', f); const gg = st.ctx.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(src); });
      const nz = st.filter(st.noise(at(id) - 0.1, E(id) + 0.1, 'pink'), 'bandpass', 180, 1); nz.connect(src);
      st.route(st.gainEnv(src, bedPts(at(id), E(id), 1)), { gain: lv, pan: 0.4 });
    }
    P('S11', 0.5, 'Letter paper handled', crinkle(0.6, 60), { gain: db(-36), pan: 0, verb: 'room', send: 0.2 });
    P('S12', 0.6, 'Her breath out, slow', breathNoise(1.6, { s: 20 }), { gain: db(-37), verb: 'room', send: 0.2 });
    P('S12', 2.5, 'Shaky breath in (hand to mouth)', breathNoise(1.0, { inhale: true, tremble: 0.5, s: 21 }), { gain: db(-35), verb: 'room', send: 0.2 });
    P('S12', 3.8, 'Held breath released', breathNoise(1.1, { s: 22 }), { gain: db(-39), verb: 'room', send: 0.2 });
    const tr = cue('sfx', 'S13', 1.2, 'Rain begins on the window (noise + droplet ticks), building');
    playBed(st, rainBuf(E('S13') - tr + 0.1, 4.0), tr, E('S13'), { gain: db(-22), verb: 'hall', send: 0.2, pts: [[tr, 1], [E('S13') - 0.04, 1], [E('S13') + 0.04, 0]] });
  }
  // S14-S17: winter
  {
    cue('sfx', 'S14', 0, 'Winter wind (gusting filtered noise), footsteps crunching every 0.55 s, distant dog');
    windBed(st, at('S14'), E('S14'), { level: db(-21), lo: 300, hi: 1100, moan: 0.25, verb: 'outdoor', send: 0.2, s: 1 });
    for (let k = 0; at('S14', 0.3 + k * 0.55) < E('S14') - 0.2; k++) st.play(crunch(k), at('S14', 0.3 + k * 0.55), { gain: db(-26 - k * 0.3), pan: -0.35 + k * 0.05, verb: 'outdoor', send: 0.25 });
    P('S14', 4.3, 'Distant dog, once', dogBark(1), { gain: db(-40), pan: 0.7, filters: [['lowpass', 1800]], verb: 'outdoor', send: 1.0, dry: 0.4 });
    P('S14', 1.5, 'Her breath fogging', breathNoise(1.2, { s: 30 }), { gain: db(-42), pan: -0.2 });
    cue('sfx', 'S15', 0, 'Wind at the window (moaning), pencil scratch on sums, radiator ticks (off)');
    windBed(st, at('S15'), E('S15'), { level: db(-27), lo: 200, hi: 600, moan: 0.6, moanLo: 520, moanHi: 760, pan: 0.4, lp: 2500, s: 2 });
    P('S15', 0.5, 'Pencil scratch (sums)', strokes(4.0, { s: 1 }), { gain: db(-33), pan: -0.1, verb: 'room', send: 0.2 });
    [1.7, 3.9].forEach(o => P('S15', o, 'Radiator tick', modal([[1650, 0.7, 0.08], [3900, 0.4, 0.04]], 0.2), { gain: db(-40), pan: 0.5, verb: 'room', send: 0.3 }));
    cue('sfx', 'S16', 0, 'Wind; muffled murmur behind the hall door');
    windBed(st, at('S16'), E('S16'), { level: db(-23), lo: 300, hi: 1000, moan: 0.2, verb: 'outdoor', send: 0.2, s: 3 });
    [0.3, 0.85, 1.4, 1.95].forEach((o, k) => st.play(crunch(20 + k), at('S16', o), { gain: db(-34), pan: 0.1, verb: 'outdoor', send: 0.3 }));
    P('S16', 3.0, 'Hall door opens (latch + creak)', doorOpen(0.7, 2), { gain: db(-30), pan: 0.1, verb: 'outdoor', send: 0.3 });
    // murmur: babble of many synthetic voices, muffled until the door opens, then spills out
    const tm0 = at('S16'), tm1 = E('S17'), md = tm1 - tm0 + 0.2;
    const L = buf(md), R = buf(md);
    for (let k = 0; k < 14; k++) {
      const male = k % 2 === 0, v = babbleVoice(md, { f0: male ? rr(95, 140) : rr(170, 240), fs: male ? rr(0.95, 1.05) : rr(1.1, 1.2), rate: rr(3.5, 5.5), s: k });
      const p = rr(0.1, 0.9), a = rr(0.35, 1);
      mixInto(L, v, 0, a * (1 - p)); mixInto(R, v, 0, a * p);
    }
    const m = Math.max(peak(L), peak(R)); scale(L, 1 / m); scale(R, 1 / m);
    cue('sfx', 'S16', 3.0, 'Warm crowd murmur spills out (14 babble voices, formant-filtered, no words)');
    const src = st.ctx.createBufferSource(); src.buffer = st.toBuffer([L, R]); src.start(tm0);
    const lp = st.filter(src, 'lowpass', 350, 0.7);
    const td = at('S16', 3.0);
    lp.frequency.setValueAtTime(350, td); lp.frequency.exponentialRampToValueAtTime(3800, td + 0.6);
    const env = st.gainEnv(lp, [[tm0 - 0.04, 0], [tm0 + 0.04, 0.35], [td, 0.35], [td + 0.6, 0.85], [at('S17'), 0.85], [at('S17') + 0.08, 1], [tm1 - 0.04, 1], [tm1 + 0.04, 0]]);
    const mg = st.route(env, { gain: db(-27), verb: 'hall', send: 0.45 });
    cue('sfx', 'S17', 0, 'Murmur, cups clinking, tea urn, one soft laugh (3.6 s)');
    noiseBed(st, at('S17'), E('S17'), { kind: 'white', lp: 9000, hp: 3000, level: db(-50), pan: 0.7 });  // urn hiss
    [0.8, 1.9, 2.6, 4.4, 5.2].forEach((o, k) => st.play(clink(rr(2100, 3200)), at('S17', o), { gain: db(-36 - k % 2 * 3), pan: rr(-0.6, 0.6), verb: 'hall', send: 0.4 }));
    for (let k = 0; k < 6; k++) st.play(clink(rr(3300, 3600)), at('S17', 3.0 + k * 0.13), { gain: db(-44), pan: -0.3, verb: 'hall', send: 0.4 });
    const soft = laugh([0, 0.2, 0.41].map((t, i) => ({ t: 0.03 + t, f0: [265, 250, 238][i], dur: 0.14, amp: [0.8, 1, 0.7][i], h: 0.04, fk: 0.9 })), { breathy: 0.45, s: 3, F: [[800, 120], [1350, 140], [2600, 200], [3600, 280], [4500, 300]] });
    P('S17', 3.6, 'One soft laugh in the crowd', soft, { gain: db(-33), pan: 0.35, verb: 'hall', send: 0.45 });
  }
  // S18: thaw drips, a long exhale
  {
    cue('sfx', 'S18', 0.2, 'Thaw drips outside');
    let o = 0.2; let k = 0; while (at('S18', o) < E('S18') - 0.1) { st.play(drip(), at('S18', o), { gain: db(-37 - (k % 3) * 2), pan: 0.5 + rr(-0.1, 0.1), filters: [['lowpass', 6000]], verb: 'outdoor', send: 0.3 }); o += rr(0.5, 1.3); k++; }
    P('S18', 0.8, 'A long breath out', breathNoise(2.8, { s: 40 }), { gain: db(-31), pan: 0, verb: 'room', send: 0.25 });
  }
  // S19: door creak at 2.5
  P('S19', 2.5, 'Cupboard door creak (stick-slip friction through wood resonances)', doorOpen(1.3, 3), { gain: db(-26), pan: -0.1, verb: 'room', send: 0.35 });
  // S20: paper unfolding, birds
  {
    P('S20', 0.4, 'Case latch', click(2600, 900, 0.03), { gain: db(-36), verb: 'room', send: 0.2 });
    P('S20', 1.5, 'Paper note unfolding (crinkle)', crinkle(0.9, 220), { gain: db(-30), pan: 0, verb: 'room', send: 0.25 });
    [[0.6, 'sparrow', 0.6], [2.8, 'blackbird', 0.5], [4.6, 'sparrow', 0.7]].forEach(([o, k, p], i) => P('S20', o, 'Morning birds outside', birdSong(k, 20 + i), { gain: db(-38), pan: p, filters: [['lowpass', 6000]], verb: 'outdoor', send: 0.3 }));
  }
  // S21: memory. dusk, evening birds, lunch tin, footsteps, door closes
  {
    const mem = { filters: [['highpass', 180], ['lowpass', 3500]], verb: 'memory', send: 0.5 };
    [[0.3, 0.6], [2.9, -0.5]].forEach(([o, p], i) => P('S21', o, 'Evening birds (memory-filtered)', birdSong('evening', 30 + i), { ...mem, gain: db(-42), pan: p }));
    P('S21', 3.6, 'Watch (tiny tick) + lunch tin picked up', tinClank(), { ...mem, gain: db(-35), pan: 0.1 });
    [4.3, 4.85, 5.4].forEach((o, k) => st.play(concreteStep(30 + k), at('S21', o), { ...mem, gain: db(-38 - k * 2), pan: 0.2 + k * 0.1 }));
    P('S21', 6.0, 'A door closes (he leaves for his shift)', doorClose(), { ...mem, gain: db(-28), pan: 0.35 });
  }
  // S22: pages turn every ~1.6 s, pencil, birds
  {
    for (let o = 0.8; at('S22', o) < E('S22') - 0.4; o += 1.6) P('S22', o, 'Page turn', pageTurn(), { gain: db(-31), pan: rr(-0.1, 0.1), verb: 'room', send: 0.25 });
    P('S22', 0.2, 'Pencil drawing', strokes(7.4, { rate: 2.5, s: 2 }), { gain: db(-38), pan: 0.1, verb: 'room', send: 0.2 });
    [[1.3, 'sparrow', 0.6], [3.4, 'blackbird', 0.5], [6.1, 'robin', 0.7]].forEach(([o, k, p], i) => P('S22', o, 'Birds outside', birdSong(k, 40 + i), { gain: db(-40), pan: p, filters: [['lowpass', 6000]], verb: 'outdoor', send: 0.3 }));
  }
  // S23: thread-screw clicks, click at 2.5, cloth on brass
  {
    P('S23', 0.3, 'Eyepiece thread turning (small ticks)', screwTicks(1.9), { gain: db(-32), pan: 0.05, verb: 'room', send: 0.2 });
    P('S23', 2.5, 'New eyepiece clicks home', (() => { const x = click(3800, 1200, 0.04); mixInto(x, modal([[5200, 0.5, 0.05], [2900, 0.4, 0.06]], 0.06), 0, 0.6); return norm(x, 1); })(), { gain: db(-24), verb: 'room', send: 0.25 });
    P('S23', 3.0, 'Cloth polishing brass', rub(1.9, 1), { gain: db(-34), pan: 0.1, verb: 'room', send: 0.2 });
  }
  // S24-S26: night
  {
    for (const id of ['S24', 'S25', 'S26']) {
      windBed(st, at(id), E(id), { level: db(id === 'S25' ? -46 : -40), lo: 150, hi: 400, lp: 1200, s: 10 + parseInt(id.slice(1)) });
      noiseBed(st, at(id), E(id), { kind: 'brown', lp: 120, hp: 25, level: db(id === 'S25' ? -48 : -42) });   // distant town
    }
    cue('sfx', 'S24', 0, 'Night air, distant town, tripod set down, far dog (3.1 s)');
    P('S24', 0.9, 'Tripod legs set down on the step', thump(150, 0.08, 0.9), { gain: db(-34), pan: 0.1, verb: 'night', send: 0.3 });
    P('S24', 1.6, 'Tripod clamp', click(2400, 900, 0.03), { gain: db(-38), pan: 0.1, verb: 'night', send: 0.3 });
    [3.1, 3.45].forEach((o, k) => P('S24', o, 'Far dog', dogBark(5 + k), { gain: db(-45), pan: -0.75, filters: [['lowpass', 1500]], verb: 'night', send: 1.0, dry: 0.3 }));
    P('S26', 1.4, 'Nell: a breath-laugh breaking', breathNoise(0.5, { s: 50 }), { gain: db(-36), pan: -0.15, verb: 'night', send: 0.3 });
    P('S26', 1.75, 'Nell: second breath of the laugh', breathNoise(0.4, { s: 51 }), { gain: db(-38), pan: -0.15, verb: 'night', send: 0.3 });
    const sam = laugh(samLaughBursts(), { inhale: { t: 1.25, dur: 0.38, amp: 0.22 } });
    P('S26', 3.8, "Sam (11) laughs out loud: 5 'ha' bursts, 455 -> 362 Hz, open-vowel formants, inhale", sam, { gain: db(-15), pan: 0.2, verb: 'night', send: 0.3 });
  }
  // S27-S31: opening up
  {
    cue('sfx', 'S27', 0, 'Chalk on the step, birds, door open to the street');
    P('S27', 0.3, 'Chalk scratching', strokes(4.4, { chalk: true, rate: 3, s: 3 }), { gain: db(-32), pan: -0.1, verb: 'outdoor', send: 0.2 });
    P('S27', 2.2, 'Second chalk (Sam)', strokes(2.4, { chalk: true, rate: 4, s: 4 }), { gain: db(-35), pan: 0.3, verb: 'outdoor', send: 0.2 });
    noiseBed(st, at('S27'), E('S27'), { kind: 'pink', lp: 2000, hp: 250, level: db(-46), pan: 0.6 });   // street through the open door
    [[0.5, 'sparrow', 0.6], [2.6, 'blackbird', -0.5], [4.2, 'sparrow', 0.4]].forEach(([o, k, p], i) => P('S27', o, 'Birds', birdSong(k, 60 + i), { gain: db(-38), pan: p, verb: 'outdoor', send: 0.3 }));
    cue('sfx', 'S28', 0, 'Rooftop: a few neighbours murmuring, chalk, swifts');
    {
      const d = shotDur('S28') + 0.2, L2 = buf(d), R2 = buf(d);
      for (let k = 0; k < 4; k++) { const v = babbleVoice(d, { f0: k % 2 ? rr(180, 230) : rr(100, 130), fs: k % 2 ? 1.15 : 1.0, rate: 3.5, s: 50 + k }); const p = rr(0.2, 0.8); mixInto(L2, v, 0, (1 - p) * rr(0.5, 1)); mixInto(R2, v, 0, p * rr(0.5, 1)); }
      const m2 = Math.max(peak(L2), peak(R2)); scale(L2, 1 / m2); scale(R2, 1 / m2);
      playBed(st, [L2, R2], at('S28'), E('S28'), { gain: db(-33), filters: [['lowpass', 3000]], verb: 'outdoor', send: 0.3 });
    }
    P('S28', 2.0, 'Chalk on the small board', strokes(1.6, { chalk: true, rate: 4, s: 5 }), { gain: db(-36), pan: 0.2, verb: 'outdoor', send: 0.2 });
    [[0.9, -0.6], [1.4, -0.2], [3.2, 0.5], [5.0, -0.3], [5.4, 0.1]].forEach(([o, p], i) => P('S28', o, 'Swifts screaming overhead', birdSong('swift', 70 + i), { gain: db(-38), pan: p, verb: 'outdoor', send: 0.3 }));
    cue('sfx', 'S29', 0, 'Street across years: children playing, birds, bicycle bell (4.0 s), radio through a window');
    noiseBed(st, at('S29'), E('S29'), { kind: 'pink', lp: 1800, hp: 200, level: db(-45) });
    [0.4, 1.3, 2.2, 3.1, 5.2, 6.3, 7.4, 8.2].forEach((o, i) => P('S29', o, 'Children playing (distant laughs, squeals)', childBurst(i), { gain: db(-38 - (i % 3) * 2), pan: rr(-0.7, 0.2), filters: [['lowpass', 4500]], verb: 'outdoor', send: 0.6, dry: 0.7 }));
    P('S29', 4.0, 'Bicycle bell', bikeBell(), { gain: db(-30), pan: 0.35, verb: 'outdoor', send: 0.3 });
    {
      const d = shotDur('S29'), v = babbleVoice(d, { f0: 120, rate: 4.5, s: 77 }); filt(v, 'bandpass', 1200, 0.9); for (let i = 0; i < v.length; i++) v[i] = Math.tanh(v[i] * 3);
      playBed(st, v, at('S29'), E('S29'), { gain: db(-44), pan: 0.7, filters: [['highpass', 400], ['lowpass', 3000]], verb: 'outdoor', send: 0.3 });
    }
    [[1.0, 'sparrow', 0.5], [5.8, 'blackbird', -0.4], [7.8, 'robin', 0.6]].forEach(([o, k, p], i) => P('S29', o, 'Birds', birdSong(k, 80 + i), { gain: db(-39), pan: p, verb: 'outdoor', send: 0.3 }));
    [[1.5, 'sparrow', 0.6], [5.5, 'blackbird', 0.5]].forEach(([o, k, p], i) => P('S30', o, 'Birds outside the kitchen', birdSong(k, 90 + i), { gain: db(-42), pan: p, filters: [['lowpass', 5500]], verb: 'outdoor', send: 0.3 }));
    P('S30', 2.8, 'Page turn', pageTurn(), { gain: db(-36), verb: 'room', send: 0.2 });
    cue('sfx', 'S31', 0, 'Hush of a listening room, chalk on the big board, a chair creak (4.2 s)');
    P('S31', 0.5, 'Chalk on the big board', strokes(2.8, { chalk: true, rate: 3, s: 6 }), { gain: db(-32), pan: 0.1, verb: 'hall', send: 0.4 });
    P('S31', 4.2, 'Chair creak', creak(0.45, { r0: 60, r1: 90, s: 7, modes: [[300, 40], [700, 60], [1500, 90]] }), { gain: db(-33), pan: -0.5, verb: 'hall', send: 0.4 });
    [1.2, 3.5, 5.6].forEach((o, k) => P('S31', o, 'Room rustle', breathNoise(0.4, { s: 60 + k }), { gain: db(-47), pan: rr(-0.7, 0.7), filters: [['highpass', 1500]], verb: 'hall', send: 0.5 }));
  }
  // S32-S36: crickets, creak, late rumble
  {
    const t0 = cue('sfx', 'S32', 0, 'Crickets (6 individuals, pulsed 4.2-5 kHz chirps, stereo spread) through S36');
    const t1 = E('S36'), fadeStart = at('S36', 0.5);
    for (let k = 0; k < 6; k++) {
      const x = cricketsBuf(t1 - t0 + 0.1, k);
      const pan = [-0.8, -0.45, -0.1, 0.25, 0.55, 0.85][k], g = db([-38, -42, -45, -40, -44, -47][k]);
      playBed(st, x, t0, t1, { gain: g, pan, verb: 'night', send: 0.3, pts: [[t0 - 0.04, 0], [t0 + 0.04, 1], [fadeStart, 1], [t1 - 0.3, 0]] });
    }
    cue('sfx', 'S36', 0.5, 'Crickets fade out');
    P('S34', 1.0, 'Telescope creaks as the girl swings it', creak(0.7, { r0: 25, r1: 45, wob: 0.5, s: 9, modes: [[420, 50], [980, 70], [2100, 110]] }), { gain: db(-34), pan: 0.3, verb: 'night', send: 0.3 });
    const tr = cue('sfx', 'S34', 2.0, 'Launch rumble arrives late: 20-80 Hz + filtered noise, swells 4 s, fades');
    const dur = 12;
    st.play(rumble(dur), tr, { gain: db(-20), pan: 0, verb: 'night', send: 0.2 });
  }
}
