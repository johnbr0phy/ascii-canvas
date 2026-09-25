// After Work: the score. Every cue is placed as (shot id + offset), computed from SHOTS.
'use strict';

// ---------------------------------------------------------------- the theme
// Arthur's tune. D major, 3/4, q = 72. [beat, midi, beats]
const TUNE = [
  [[0, 62, 1], [1, 69, 1], [2, 71, .5], [2.5, 69, .5]],   // 1  D A B A
  [[0, 66, 3]],                                           // 2  F#
  [[0, 67, 1], [1, 71, 1], [2, 69, .5], [2.5, 67, .5]],   // 3  G B A G
  [[0, 64, 3]],                                           // 4  E
  [[0, 62, 1], [1, 69, 1], [2, 71, .5], [2.5, 69, .5]],   // 5  D A B A
  [[0, 74, 2], [2, 73, 1]],                               // 6  D5 C#5
  [[0, 71, 1], [1, 69, .5], [1.5, 67, .5], [2, 64, 1]],   // 7  B A G E
  [[0, 62, 3]],                                           // 8  D
  [[0, 66, 1], [1, 67, 1], [2, 69, 1]],                   // 9  F# G A
  [[0, 71, 2], [2, 74, 1]],                               // 10 B D5
  [[0, 73, 1], [1, 71, 1], [2, 69, 1]],                   // 11 C# B A
  [[0, 66, 3]],                                           // 12 F#
  [[0, 67, 1], [1, 69, 1], [2, 71, 1]],                   // 13 G A B
  [[0, 69, 1], [1, 66, 1], [2, 62, 1]],                   // 14 A F# D
  [[0, 64, 1], [1, 66, .5], [1.5, 64, .5], [2, 61, 1]],   // 15 E F#E C#
  [[0, 62, 3]],                                           // 16 D
];
const HARM = [
  [[0, 'D']], [[0, 'D'], [2, 'Bm']], [[0, 'G']], [[0, 'A']], [[0, 'D']], [[0, 'Bm'], [2, 'A']], [[0, 'G'], [2, 'A']], [[0, 'D']],
  [[0, 'D']], [[0, 'G']], [[0, 'A']], [[0, 'D'], [2, 'Bm']], [[0, 'G']], [[0, 'D']], [[0, 'A7']], [[0, 'D']],
];
const CH = {
  D: [2, 6, 9], G: [7, 11, 2], A: [9, 1, 4], Bm: [11, 2, 6], A7: [9, 1, 4, 7], Em: [4, 7, 11], C: [0, 4, 7],
  Dm: [2, 5, 9], Dsus2: [2, 9, 4], D5: [2, 9], Asus: [9, 2, 4], Gadd9: [7, 11, 2, 9],
};
const ROOT = { D: 2, G: 7, A: 9, Bm: 11, A7: 9, Em: 4, C: 0, Dm: 2, Dsus2: 2, D5: 2, Asus: 9, Gadd9: 7 };
const pc = m => ((m % 12) + 12) % 12;
function chordNotes(name, lo, hi, max = 4) { const out = []; for (let m = lo; m <= hi && out.length < max; m++) if (CH[name].includes(pc(m))) out.push(m); return out; }
function bassOf(name, lo = 38) { let m = lo; while (pc(m) !== ROOT[name]) m++; return m; }
function tuneNotes(b0, b1, t0, bar, tr = 0) {
  const beat = bar / 3, out = [];
  for (let b = b0; b <= b1; b++) for (const [bt, m, d] of TUNE[b - 1]) out.push({ t: t0 + (b - b0) * bar + bt * beat, midi: m + tr, dur: d * beat, bar: b, beat: bt });
  return out;
}
function harmAt(b, beat) { let c = HARM[b - 1][0][1]; for (const [bt, n] of HARM[b - 1]) if (beat >= bt) c = n; return c; }

// ---------------------------------------------------------------- players
const _pcache = new Map();
function pianoCached(midi, o) { const k = midi + JSON.stringify(o); if (!_pcache.has(k)) _pcache.set(k, piano(midi, o)); return _pcache.get(k); }
function pno(st, t, midi, { vel = 0.5, len = 4, gain = 1, pan = null, verb = 'music', send = 0.28, tag = 'acc', inst = 'piano', human = true, ...rest } = {}) {
  const v = Math.round(clamp(vel * (human ? rr(0.94, 1.06) : 1), 0.05, 1) * 20) / 20;
  const tt = t + (human ? rr(-0.006, 0.008) : 0);
  const g = st.play(pianoCached(midi, { vel: v, len, ...rest }), tt, { gain, pan: pan ?? clamp((midi - 62) / 50, -0.5, 0.5), verb, send });
  logNote(tt, midi, len, inst, tag);
  return g;
}
function plk(st, t, midi, { vel = 0.5, len = 2.5, gain = 1, pan = 0, verb = 'music', send = 0.2, tag = 'acc', inst = 'guitar', body = 'guitar', bright = 0.6, T60 = 3, pickPos = 0.18 } = {}) {
  const x = pluck(midi, { len, vel: 1, body, bright, T60, pickPos, s: Math.floor(rnd() * 5) });
  const g = st.play(x, t + rr(-0.005, 0.006), { gain: gain * vel * rr(0.9, 1.1), pan, verb, send });
  logNote(t, midi, len, inst, tag);
  return g;
}
function bow(st, t, midi, dur, { gain = 1, pan = 0, verb = 'music', send = 0.3, tag = 'acc', inst = 'strings', ...rest } = {}) {
  const g = st.play(bowed(midi, dur, rest), t, { gain, pan, verb, send });
  logNote(t, midi, dur, inst, tag);
  return g;
}
function fadeGain(g, t0, t1, v0 = 1, v1 = 0) { g.gain.setValueAtTime(g.gain.value * v0, t0); g.gain.linearRampToValueAtTime(g.gain.value * v1 + 1e-5, t1); }
function woodTick(accent) { const x = modal([[1250, 1, 0.05], [2710, 0.5, 0.03], [4300, 0.2, 0.02]], 0.12); return norm(x, accent ? 1 : 0.7); }

// waltz left hand for bar b of the tune: bass on 1, soft chord on 2 and 3
function leftHand(st, t0, bar, b, { vel = 0.3, send = 0.3, tag = 'acc', lo = 52, hi = 66, bassLo = 38, gain = 1 } = {}) {
  const beat = bar / 3;
  const c1 = harmAt(b, 0), c2 = harmAt(b, 1), c3 = harmAt(b, 2);
  pno(st, t0, bassOf(c1, bassLo), { vel: vel * 1.1, len: bar * 1.6, send, tag, sustain: 1.2, gain });
  for (const [bt, c] of [[1, c2], [2, c3]]) for (const m of chordNotes(c, lo, hi, 3)) pno(st, t0 + bt * beat + rr(0, 0.02), m, { vel: vel * 0.62, len: beat * 1.6, send, tag, hard: 0.3, gain });
}

// ================================================================= BUILD
function buildMusic(st) {
  seed(20270);
  window.META = window.META || {};
  st.addVerb('music', { dur: 3.2, pre: 0.02, lpA: 7000, lpB: 1800, early: [[0.013, 0.5], [0.021, 0.4], [0.034, 0.3], [0.047, 0.2]], s: 11 });
  st.addVerb('warehouse', { dur: 3.8, pre: 0.035, lpA: 6000, lpB: 1200, early: [[0.03, 0.6], [0.055, 0.5], [0.08, 0.4], [0.11, 0.3]], s: 12 });
  st.addVerb('room', { dur: 0.55, pre: 0.004, lpA: 8000, lpB: 3000, early: [[0.004, 0.6], [0.007, 0.5], [0.011, 0.4]], s: 13 });
  st.addVerb('night', { dur: 2.4, pre: 0.03, lpA: 5000, lpB: 1500, density: 0.3, early: [[0.04, 0.3], [0.09, 0.2]], s: 14 });
  st.addVerb('memory', { dur: 2.6, pre: 0.02, lpA: 3500, lpB: 1200, s: 15 });
  const B72 = 2.5, beat72 = B72 / 3;

  // ---- S01: four notes, detuned intimate piano + music-box tine, unresolved, long decay
  {
    const t0 = cue('music', 'S01', 1.5, 'Motif D4 A4 B4 A4, detuned plucked piano / music box, unresolved');
    [[0, 62, 1], [1, 69, 1], [2, 71, .5], [2.5, 69, .5]].forEach(([b, m], i) =>
      pno(st, t0 + b * beat72, m, { vel: [0.44, 0.38, 0.34, 0.36][i], len: i === 3 ? 10 : 7, detune: [-6, 7, -4, 8][i], spread: 3.5, box: 0.4, sustain: 1.9, send: 0.4, gain: db(-7), tag: 'melody:S01', inst: 'box-piano', human: false, pan: 0.05 }));
    cue('music', 'S02', 0, 'Last note (A4) rings out under the title');
  }

  // ---- S06: Nell hums the four notes, barely, under the warehouse hum
  {
    const t0 = cue('music', 'S06', 1.0, 'Nell hums D4 A4 B4 A4 (glottal pulse + nasal formants), barely audible');
    const b = 0.92, ns = [{ t: 0, midi: 62, dur: 0.8 }, { t: b, midi: 69, dur: 0.8 }, { t: 2 * b, midi: 71, dur: 0.4 }, { t: 2.5 * b, midi: 69, dur: 1.5, vel: 0.8 }];
    const x = hum(ns.map(n => ({ ...n, t: n.t + 0.15 })), { gender: 'f', breathy: 0.35, s: 1 });
    st.play(x, t0 - 0.15, { gain: db(-35), pan: 0.05, verb: 'warehouse', send: 0.35 });
    ns.forEach(n => logNote(t0 + n.t, n.midi, n.dur, 'hum-nell', 'melody:S06'));
  }

  // ---- S13: rain starts -> one low cello note (D2), bowed, very soft; bleeds into S14 as the winter drone
  {
    const t = cue('music', 'S13', 1.6, 'One low cello D2, bowed, very soft (rain has started)');
    bow(st, t, 38, at('S14', 1.5) - t, { vel: 0.5, att: 2.2, rel: 2.5, cello: true, vib: 0.0025, bright: 0.25, gain: db(-25), send: 0.25, inst: 'cello' });
  }

  // ---- S14-S15: the motif in D minor, low piano, slow and sparse; cold open-fifth strings
  {
    const t0 = cue('music', 'S14', 1.4, 'Motif in D minor, low piano: D3 A3 Bb3 A3 F3');
    const b = 1.1;
    [[0, 50, 0.34], [1, 57, 0.3], [2, 58, 0.28], [2.5, 57, 0.26], [3, 53, 0.32]].forEach(([bt, m, v], i) =>
      pno(st, t0 + bt * b, m, { vel: v, len: i === 4 ? 6 : 4, hard: 0.15, sustain: 1.4, send: 0.35, gain: db(-6), tag: 'melody:S14', inst: 'piano-low' }));
    const tp = cue('music', 'S14', 0.5, 'Cold open fifth D2/A2 strings, sul tasto');
    for (const m of [38, 45, 57]) bow(st, tp, m, at('S16', 3.0) - tp, { vel: 0.5, att: 2.5, rel: 1.8, players: 3, bright: 0.12, vib: 0.002, gain: db(m === 57 ? -33 : -28), send: 0.35, pan: m === 45 ? 0.25 : -0.2 });
    const t1 = cue('music', 'S15', 0.8, 'Minor motif continues: G3 Bb3 A3 G3 E3');
    [[0, 55, 0.3], [1, 58, 0.28], [2, 57, 0.26], [2.5, 55, 0.24], [3, 52, 0.3]].forEach(([bt, m, v], i) =>
      pno(st, t1 + bt * b, m, { vel: v, len: i === 4 ? 6 : 4, hard: 0.15, sustain: 1.4, send: 0.35, gain: db(-6), tag: 'melody:S15', inst: 'piano-low' }));
  }
  // ---- S16-S17: warms slightly: open Dsus2 pad (no third yet) as the door opens, fading through S17
  {
    const t = cue('music', 'S16', 3.1, 'Warmer open pad D3 A3 E4 (sus2, no third) as the hall door opens');
    for (const m of [50, 57, 64]) bow(st, t, m, at('S17', 3.0) - t, { vel: 0.5, att: 2.0, rel: 2.5, players: 3, bright: 0.35, vib: 0.004, gain: db(-27), send: 0.4, pan: rr(-0.3, 0.3) });
    const t2 = cue('music', 'S17', 1.2, 'Soft piano D4 + A4 (open), under the murmur');
    pno(st, t2, 62, { vel: 0.22, len: 5, send: 0.45, gain: db(-3) }); pno(st, t2 + 0.9, 69, { vel: 0.2, len: 5, send: 0.45, gain: db(-3) });
  }

  // ---- S18: the first warm major chord since the title, on the exhale
  {
    const t = cue('music', 'S18', 1.3, 'First warm major chord: D major (strings pad + rolled piano) on the exhale');
    const d = at('S18', shotDur('S18') - 0.9) - t;
    [[50, -34], [54, -36], [57, -36], [62, -39]].forEach(([m, g]) => bow(st, t, m, d, { vel: 0.5, att: 1.1, rel: 1.4, players: 3, bright: 0.4, vib: 0.004, gain: db(g), send: 0.4, pan: rr(-0.3, 0.3) }));
    [38, 45, 54, 62].forEach((m, i) => pno(st, t + i * 0.07, m, { vel: 0.15, len: 5, send: 0.35, sustain: 1.2, gain: db(-8) }));
  }

  // ---- S19: door creak, then the four notes again, and this time the fifth (F#4, bar 2 downbeat)
  {
    const t0 = cue('music', 'S19', 3.1, 'Motif again (box piano) and the fifth note F#4 arrives on bar 2 downbeat');
    [[0, 62, 1], [1, 69, 1], [2, 71, .5], [2.5, 69, .5], [3, 66, 3]].forEach(([b, m], i) =>
      pno(st, t0 + b * beat72, m, { vel: [0.42, 0.37, 0.33, 0.35, 0.45][i], len: i === 4 ? 9 : 6, detune: [-5, 6, -3, 7, 2][i], spread: 3, box: 0.35, sustain: 1.9, send: 0.4, gain: db(-6), tag: 'melody:S19', inst: 'box-piano', human: false, pan: 0.05 }));
    pno(st, t0 + 3 * beat72 + 0.02, 50, { vel: 0.22, len: 8, send: 0.4, sustain: 1.5, gain: db(-6) });
  }
  // ---- S20: a held soft note/pad (continues the F#)
  {
    const t = cue('music', 'S20', 0.1, 'Held soft pad A3 D4 F#4');
    const d = shotDur('S20') - 1.0;
    [[57, -30], [62, -29], [66, -28]].forEach(([m, g]) => bow(st, t, m, d, { vel: 0.5, att: 1.6, rel: 1.0, players: 2, bright: 0.3, vib: 0.003, gain: db(g), send: 0.4, pan: rr(-0.2, 0.2) }));
  }

  // ---- S21: the memory: her father hums bars 1-2, low, wobbly, warm; (door closes at the end: sfx)
  {
    const t0 = cue('music', 'S21', 0.6, 'Father hums bars 1-2 an octave down (male hum, wobbly, memory-filtered)');
    const b = 60 / 66;
    const ns = [[0, 50, 0.85], [1, 57, 0.85], [2, 59, 0.42], [2.5, 57, 0.42], [3, 54, 2.5]].map(([bt, m, d]) => ({ t: bt * b + 0.15, midi: m, dur: d * b / 0.909 * 0.9 }));
    ns[4].dur = 2.4;
    const x = hum(ns, { gender: 'm', wobble: 14, vib: 0.007, vibRate: 4.6, breathy: 0.3, s: 2 });
    filt(x, 'highpass', 160, 0.7); filt(x, 'lowpass', 2800, 0.7);
    // tape-ish wow on the memory
    st.play(x, t0 - 0.15, { gain: db(-25), pan: -0.1, verb: 'memory', send: 0.5 });
    ns.forEach(n => logNote(t0 - 0.15 + n.t, n.midi, n.dur, 'hum-arthur', 'melody:S21'));
  }

  // ---- S22-S23: learning: plucked curious ostinato, variations on bars 1-4; bar 6 lands on the S23 click
  {
    const t0 = cue('music', 'S22', 0.4, 'Plucked ostinato (KS guitar) + harp melody: variations on bars 1-4');
    const t6 = at('S23', 2.5), bar = (t6 - t0) / 5, beat = bar / 3, e = beat / 2;
    window.META.ostinato = { start: t0, bar, bpm: 180 / bar };
    const chords = ['D', 'D', 'G', 'A', 'Bm', 'D'];
    const mel = [
      [[0, 74, 1], [1, 81, 1], [2, 83, .5], [2.5, 81, .5]],
      [[0, 78, 1], [1, 76, .5], [1.5, 78, .5], [2, 81, 1]],
      [[0, 79, 1], [1, 83, 1], [2, 81, .5], [2.5, 79, .5]],
      [[0, 76, 1.5], [2, 73, .5], [2.5, 74, .5]],
      [[0, 71, 1], [1, 74, 1], [2, 73, 1]],
      [[0, 74, 3]],
    ];
    chords.forEach((c, k) => {
      const tb = t0 + k * bar;
      if (k < 5) {
        const tones = chordNotes(c, 57, 76, 3), bass = bassOf(c, 45);
        const pat = [bass, tones[0], tones[1], tones[2], tones[1], tones[0]];
        pat.forEach((m, i) => plk(st, tb + i * e, m, { vel: i === 0 ? 0.55 : 0.36, len: 1.6, pan: -0.25, send: 0.18, T60: 2.2, bright: 0.55, gain: db(-12) }));
      } else {
        [50, 57, 62, 66, 69].forEach((m, i) => plk(st, tb + i * 0.035, m, { vel: 0.45, len: 3.5, pan: -0.2, send: 0.25, T60: 3.5, gain: db(-13) }));
      }
      mel[k].forEach(([bt, m, d]) => plk(st, tb + bt * beat, m, { vel: 0.6, len: 2.5, pan: 0.2, send: 0.3, body: 'harp', T60: 2.8, bright: 0.7, pickPos: 0.3, gain: db(-12), tag: 'melody:S22', inst: 'harp' }));
    });
  }
  // ---- S24: sparse, expectant: a high string harmonic, almost nothing
  {
    const t = cue('music', 'S24', 0.8, 'Almost nothing: high string A5/E6 harmonic, expectant');
    const d = at('S24', shotDur('S24') - 0.4) - t;
    [[81, -36], [88, -41]].forEach(([m, g]) => bow(st, t, m, d, { vel: 0.5, att: 2.0, rel: 1.0, players: 2, bright: 0.2, vib: 0.002, gain: db(g), send: 0.5, verb: 'night', noise: 0.01 }));
  }

  // ---- S25-S26: Saturn. Near-silence, then the first phrase on soft piano; resolves to D in S26
  {
    const t0 = cue('music', 'S25', 1.6, 'Piano: phrase bars 1-4, tender');
    const bar = B72;
    tuneNotes(1, 4, t0, bar).forEach(n => pno(st, n.t, n.midi, { vel: n.beat === 0 ? 0.42 : 0.36, len: Math.max(2.5, n.dur + 2), send: 0.3, tag: 'melody:S25', gain: db(-4) }));
    for (let b = 1; b <= 4; b++) leftHand(st, t0 + (b - 1) * bar, bar, b, { vel: 0.26, send: 0.3, gain: db(-3) });
    const tr = t0 + 4 * bar;
    cue('music', 'S26', tr - at('S26'), 'Phrase resolves to D (piano D major + strings), just before the laugh');
    window.META.saturnResolve = tr;
    pno(st, tr, 62, { vel: 0.32, len: 6, send: 0.35, tag: 'melody:S26', sustain: 1.3, gain: db(-3) });
    [38, 45, 50, 54, 57].forEach((m, i) => pno(st, tr - 0.1 + i * 0.045, m, { vel: 0.16, len: 6, send: 0.35, sustain: 1.3, gain: db(-3) }));
    const d = at('S26', shotDur('S26') - 0.5) - tr;
    [[50, -33], [54, -34], [57, -34], [66, -38]].forEach(([m, g]) => bow(st, tr, m, d, { vel: 0.5, att: 1.2, rel: 1.2, players: 3, bright: 0.4, vib: 0.004, gain: db(g), send: 0.45, verb: 'music', pan: rr(-0.3, 0.3) }));
  }

  // ---- S27-S31: opening up. Brighter, fuller: plucks + piano with a light pulse; phrase-B fragments only
  {
    const t0 = cue('music', 'S27', 0.2, 'Opening up: KS guitar ostinato + piano, phrase-B fragments (never the whole tune)');
    const nb = 15, bar = clamp((at('S31', 6.0) - t0) / nb, 2.2, 2.6), beat = bar / 3, e = beat / 2;
    window.META.gold = { start: t0, bar, bpm: 180 / bar, end: t0 + nb * bar };
    const plan = [
      // chord, melody [[beat, midi, beats]], layer flags
      ['D', null], ['G', null],
      ['D', TUNE[8]], ['G', TUNE[9]], ['A', TUNE[10]], ['D', TUNE[11]],                           // bars 9-12
      ['G', TUNE[8].map(([b, m, d]) => [b, m + 5, d])], ['C', TUNE[9].map(([b, m, d]) => [b, m + 5, d])], // 9-10 in G
      ['D', TUNE[10].map(([b, m, d]) => [b, m + 5, d])], ['G', TUNE[11].map(([b, m, d]) => [b, m + 5, d])], // 11-12 in G
      ['G', TUNE[12]], ['D', TUNE[13]],                                                           // 13-14 back in D
      ['Asus', [[0, 64, 3]]],
      ['Gadd9', null], ['Asus', null],
    ];
    plan.forEach(([c, mel], k) => {
      const tb = t0 + k * bar;
      const hush = k >= 13, inG = k >= 6 && k <= 9;
      if (!hush) {
        const tones = chordNotes(c, 57, 76, 3), bass = bassOf(c, 43);
        const pat = [bass + 12, tones[0], tones[1], tones[2], tones[1], tones[0]];
        pat.forEach((m, i) => plk(st, tb + i * e, m, { vel: i === 0 ? 0.5 : 0.32, len: 1.5, pan: -0.3, send: 0.15, T60: 2.0, bright: 0.65, gain: db(k < 2 ? -11.5 : -12.5) }));
        if (k >= 2 && k <= 11) plk(st, tb, bassOf(c, 36), { vel: 0.6, len: 1.8, pan: 0.05, body: 'pizz', T60: 1.2, bright: 0.3, gain: db(-10.5), inst: 'pizz' });
        if (inG) chordNotes(c, 74, 90, 4).forEach((m, i) => plk(st, tb + beat + i * e * 0.5, m, { vel: 0.3, len: 2, pan: 0.35, body: 'harp', bright: 0.8, T60: 2.5, gain: db(-16.5), inst: 'harp' }));
        if (k >= 5 && k <= 11) chordNotes(c, 55, 71, 3).forEach(m => bow(st, tb, m, bar * 0.98, { vel: 0.5, att: 0.6, rel: 0.6, players: 2, bright: 0.45, gain: db(-31), send: 0.3, pan: rr(-0.4, 0.4) }));
      } else {
        chordNotes(c, 50, 69, 4).forEach((m, i) => pno(st, tb + i * 0.06, m, { vel: 0.24, len: bar * 1.8, send: 0.35, gain: db(-4.5) }));
        pno(st, tb, bassOf(c, 38), { vel: 0.22, len: bar * 1.8, send: 0.35, gain: db(-4.5) });
      }
      if (mel) mel.forEach(([bt, m, d]) => pno(st, tb + bt * beat, m, { vel: 0.42, len: Math.max(2, d * beat + 1.5), send: 0.25, tag: 'melody:gold', gain: db(-4.5), hard: 0.6 }));
    });
    // S30: gentle clock-like pulse on every beat through the kitchen montage
    const tc0 = cue('music', 'S30', 0, 'Clock-like pulse (woodblock tick) on the beat');
    const tc1 = at('S30', shotDur('S30'));
    const first = Math.ceil((tc0 - t0) / beat - 1e-6);
    for (let i = first; t0 + i * beat < tc1 - 0.1; i++) st.play(woodTick(i % 3 === 0), t0 + i * beat, { gain: db(i % 3 === 0 ? -24 : -28), pan: 0.3, verb: 'room', send: 0.3 });
  }

  // ---- S32-S36: THE FULL TUNE (A + B), once. Nell hums bars 1-2 over piano; piano takes the melody at bar 3;
  // strings join for phrase B; final D lands in S36. Tempo fitted to the shot table within 68-74 bpm.
  {
    const t1 = at('S32', 0.3);
    const target = at('S36', 1.0);
    const bar = clamp((target - t1) / 15, 180 / 74, 180 / 68);
    const beat = bar / 3;
    const finalT = t1 + 15 * bar;
    window.META.fullTune = { start: t1, bar, bpm: 180 / bar, finalNote: finalT, finalShot: shotAt(finalT).id, finalOffset: finalT - shotAt(finalT).start };
    if (shotAt(finalT).id !== 'S36') { window.META.fullTune.warning = `final D lands in ${shotAt(finalT).id}, not S36: S32-S36 are too short/long for 68-74 bpm`; console.warn(window.META.fullTune.warning); }
    cue('music', 'S32', 0.3, `FULL TUNE bar 1 (Nell hums bars 1-2, piano accompaniment), ${(180 / bar).toFixed(1)} bpm`);
    const bt = b => t1 + (b - 1) * bar;
    // Nell (69) hums bars 1-2
    const hn = tuneNotes(1, 2, 0.15, bar);
    hn[hn.length - 1].dur = bar * 0.95;
    const hx = hum(hn, { gender: 'f', breathy: 0.42, vib: 0.009, vibRate: 4.6, wobble: 5, s: 3 });
    st.play(hx, t1 - 0.15, { gain: db(-21), pan: -0.15, verb: 'night', send: 0.3 });
    hn.forEach(n => logNote(t1 - 0.15 + n.t, n.midi, n.dur, 'hum-nell-old', 'melody:full'));
    // piano melody from bar 3
    const mel = tuneNotes(3, 16, bt(3), bar);
    const dyn = b => b < 9 ? 0.42 : b <= 12 ? 0.42 + (b - 8) * 0.025 : b <= 14 ? 0.5 : b === 15 ? 0.44 : 0.34;
    mel.forEach(n => {
      const last = n.bar === 16;
      const g = pno(st, n.t, n.midi, { vel: dyn(n.bar) * (n.beat === 0 ? 1.05 : 0.95), len: last ? 9 : Math.max(2.5, n.dur + 2), send: 0.3, tag: 'melody:full', sustain: last ? 1.4 : 1, gain: db(-5) });
      if (last) fadeGain(g, at('S37', 0.2), at('S37', 1.6));
    });
    cue('music', 'S32', bt(3) - at('S32'), 'Piano takes the melody (bar 3)');
    // piano left hand, all 16 bars (bar 16: rolled final chord)
    for (let b = 1; b <= 15; b++) leftHand(st, bt(b), bar, b, { vel: b < 3 ? 0.22 : b < 9 ? 0.27 : b < 15 ? 0.3 : 0.24, send: 0.32, gain: db(-4) });
    [38, 45, 50, 54, 57].forEach((m, i) => { const g = pno(st, finalT - 0.12 + i * 0.05, m, { vel: 0.18, len: 9, send: 0.4, sustain: 1.4, gain: db(-5) }); fadeGain(g, at('S37', 0.2), at('S37', 1.6)); });
    // soft pad under the hum (bars 1-2)
    [50, 57].forEach(m => bow(st, bt(1), m, 2 * bar, { vel: 0.5, att: 2.0, rel: 1.5, players: 3, bright: 0.25, gain: db(-31), send: 0.4, pan: rr(-0.3, 0.3) }));
    // strings join for phrase B (bars 9-16), gentle swell and ease
    const t9 = cue('music', 'S34', bt(9) - at('S34'), 'Strings join for phrase B (bar 9)');
    const sg = b => b <= 13 ? -37 + (b - 9) * 1.5 : b === 14 ? -31.5 : b === 15 ? -35 : -37;
    for (let b = 9; b <= 16; b++) {
      for (const [bb, c] of HARM[b - 1]) {
        const ts = bt(b) + bb * beat, next = HARM[b - 1].find(([x]) => x > bb);
        const len = b === 16 ? bar * 1.2 : ((next ? next[0] : 3) - bb) * beat + 0.12;
        chordNotes(c, 54, 71, 3).forEach(m => bow(st, ts, m, len, { vel: 0.5, att: b === 9 && bb === 0 ? 1.6 : 0.35, rel: b === 16 ? 3.0 : 0.5, players: 3, bright: 0.42, vib: 0.005, gain: db(sg(b)), send: 0.4, pan: rr(-0.45, 0.45) }));
        bow(st, ts, bassOf(c, 38), len, { vel: 0.5, att: b === 9 && bb === 0 ? 1.4 : 0.3, rel: b === 16 ? 3.2 : 0.5, cello: true, bright: 0.3, vib: 0.004, gain: db(sg(b) + 1), send: 0.35, pan: -0.1, inst: 'cello' });
      }
    }
    // high violins breathe in on bars 13-14 (the gentle peak), a sustained third above
    [[13, 74, 1], [14, 74, 0.5], [14.5, 78, 0.5]].forEach(([b, m, bars]) => { const tb = bt(Math.floor(b)) + (b % 1) * 3 * beat; bow(st, tb, m, bars * bar, { vel: 0.5, att: 0.8, rel: 1.0, players: 3, bright: 0.45, vib: 0.006, gain: db(-33), send: 0.45, pan: 0.3 }); });
    cue('music', shotAt(finalT).id, finalT - shotAt(finalT).start, 'FULL TUNE final D (bar 16) lands and decays');
  }

  // ---- S37: credits: first phrase, whistled, fading out
  {
    const t0 = cue('music', 'S37', 0.35, 'Whistled first phrase (bars 1-4), sine + breath noise with vibrato');
    const b = 60 / 80;
    const ns = [[0, 74, 0.9], [1, 81, 0.9], [2, 83, 0.45], [2.5, 81, 0.45], [3, 78, 2.3], [5.5, 79, 0.9], [6.5, 83, 0.9], [7.5, 81, 0.45], [8, 79, 0.45], [8.5, 76, 1.6]]
      .map(([bt, m, d]) => ({ t: bt * b + 0.1, midi: m, dur: d * b / 0.75 * 0.75 }));
    ns[9].dur = Math.max(0.5, at('S37', shotDur('S37')) - (t0 + ns[9].t) - 0.05);
    const x = whistle(ns, { breath: 0.12 });
    const g = st.play(x, t0 - 0.1, { gain: db(-21), pan: 0.1, verb: 'music', send: 0.35 });
    fadeGain(g, t0 - 0.1 + ns[9].t + 0.15, at('S37', shotDur('S37') - 0.05));
    ns.forEach(n => logNote(t0 - 0.1 + n.t, n.midi, n.dur, 'whistle', 'melody:S37'));
  }
}
