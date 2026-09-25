// After Work: stem rendering, loudness (BS.1770), limiter, WAV encoding, transfer to node.
'use strict';
const MIX = { music: db(0), sfx: db(0) };
const TARGET_LUFS = -16, CEIL_DB = -1.2;   // -1.2 dBFS sample ceiling leaves margin under -1 dBFS

function kWeight(x) {
  const y = new Float32Array(x.length);
  const s1 = [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585];
  const s2 = [1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621];
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, z1 = 0, z2 = 0, w1 = 0, w2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const a = s1[0] * xi + s1[1] * x1 + s1[2] * x2 - s1[3] * y1 - s1[4] * y2; x2 = x1; x1 = xi; y2 = y1; y1 = a;
    const b = s2[0] * a + s2[1] * z1 + s2[2] * z2 - s2[3] * w1 - s2[4] * w2; z2 = z1; z1 = a; w2 = w1; w1 = b;
    y[i] = b;
  }
  return y;
}
function lufs(L, R) {
  const kl = kWeight(L), kr = kWeight(R);
  const blk = Math.round(0.4 * SR), hop = Math.round(0.1 * SR), z = [];
  for (let s = 0; s + blk <= kl.length; s += hop) {
    let e = 0; for (let i = s; i < s + blk; i++) e += kl[i] * kl[i] + kr[i] * kr[i];
    z.push(e / blk);
  }
  const ld = e => -0.691 + 10 * Math.log10(e + 1e-20);
  const abs = z.filter(e => ld(e) > -70);
  const m1 = abs.reduce((a, c) => a + c, 0) / abs.length;
  const rel = abs.filter(e => ld(e) > ld(m1) - 10);
  return ld(rel.reduce((a, c) => a + c, 0) / rel.length);
}
// look-ahead brickwall limiter (sliding-min of required gain, box-smoothed, slow release)
function limit(L, R, ceil) {
  const n = L.length, la = Math.round(0.004 * SR), g = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = Math.max(Math.abs(L[i]), Math.abs(R[i])); g[i] = p > ceil ? ceil / p : 1; }
  // sliding min over [i-la, i+la]
  const m = new Float32Array(n), dq = new Int32Array(n + 2 * la + 2); let h = 0, t = 0;
  for (let j = 0; j < n + la; j++) {
    if (j < n) { while (t > h && g[dq[t - 1]] >= g[j]) t--; dq[t++] = j; }
    const i = j - la; if (i < 0) continue;
    while (dq[h] < i - la) h++;
    m[i] = g[dq[h]];
  }
  // box smooth length la
  const out = new Float32Array(n); let acc = 0; const half = la >> 1;
  for (let i = 0; i < n + half; i++) {
    if (i < n) acc += m[i]; if (i - la >= 0) acc -= m[i - la];
    const c = i - half; if (c >= 0 && c < n) out[c] = acc / Math.min(la, i + 1);
  }
  // release smoothing (only slows recovery)
  const rel = 1 - Math.exp(-1 / (0.12 * SR)); let gg = 1, red = 0;
  for (let i = 0; i < n; i++) { gg = Math.min(out[i], gg + (1 - gg) * rel); if (gg < 0.999) red++; L[i] *= gg; R[i] *= gg; }
  return red / SR;
}
function wav16(chs) {
  const n = chs[0].length, nc = chs.length, ab = new ArrayBuffer(44 + n * nc * 2), dv = new DataView(ab);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); dv.setUint32(4, 36 + n * nc * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, nc, true); dv.setUint32(24, SR, true);
  dv.setUint32(28, SR * nc * 2, true); dv.setUint16(32, nc * 2, true); dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, n * nc * 2, true);
  const pcm = new Int16Array(ab, 44); seed(99);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) {
    const d = (rnd() - rnd()) * 0.5 / 32768;   // TPDF dither
    pcm[i * nc + c] = Math.max(-32768, Math.min(32767, Math.round((chs[c][i] + d) * 32767)));
  }
  return new Uint8Array(ab);
}
window.OUT = {};
window.getChunk = (name, i, size) => {
  const u = window.OUT[name].subarray(i * size, (i + 1) * size);
  let s = ''; for (let k = 0; k < u.length; k += 0x8000) s += String.fromCharCode.apply(null, u.subarray(k, k + 0x8000));
  return btoa(s);
};
window.outSize = name => window.OUT[name].length;

async function renderStem(name, build) {
  const t0 = performance.now();
  const st = new Stem(name);
  build(st);
  const b = await st.ctx.startRendering();
  console.log(`stem ${name} rendered in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
  return [b.getChannelData(0).slice(), b.getChannelData(1).slice()];
}

window.renderAll = async function () {
  CUES.length = 0; NOTES.length = 0;
  const music = await renderStem('music', buildMusic);
  const sfx = await renderStem('sfx', buildSfx);
  const n = music[0].length, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = music[0][i] * MIX.music + sfx[0][i] * MIX.sfx; R[i] = music[1][i] * MIX.music + sfx[1][i] * MIX.sfx; }
  const pre = lufs(L, R);
  let gain = db(TARGET_LUFS - pre), limited = 0, post = 0;
  const ceil = db(CEIL_DB);
  let OL, OR;
  for (let it = 0; it < 4; it++) {
    OL = L.map(v => v * gain); OR = R.map(v => v * gain);
    limited = limit(OL, OR, ceil);
    post = lufs(OL, OR);
    if (Math.abs(post - TARGET_LUFS) < 0.1) break;
    gain *= db(TARGET_LUFS - post);
  }
  // final safety: hard ceiling
  for (let i = 0; i < n; i++) { OL[i] = clamp(OL[i], -ceil, ceil); OR[i] = clamp(OR[i], -ceil, ceil); }
  const mg = gain * MIX.music, sg = gain * MIX.sfx;
  const stemOut = (s, g) => s.map(ch => { const o = ch.map(v => v * g); for (let i = 0; i < o.length; i++) o[i] = clamp(o[i], -0.999, 0.999); return o; });
  window.OUT.afterwork = wav16([OL, OR]);
  window.OUT.music = wav16(stemOut(music, mg));
  window.OUT.sfx = wav16(stemOut(sfx, sg));
  return { preLufs: pre, postLufs: post, masterGainDb: 20 * Math.log10(gain), limitedSeconds: limited, samples: n, filmDur: FILM_DUR, cues: CUES, notes: NOTES, meta: window.META || {} };
};

// quick test renders: returns stereo buffer of a test function
window.renderTest = async function (name) {
  const out = await window.TESTS[name]();
  const chs = Array.isArray(out) ? out : [out, out];
  window.OUT['test_' + name] = wav16(chs.map(c => { const m = peak(c) || 1; return c.map(v => v / m * 0.8); }));
  return chs[0].length / SR;
};
