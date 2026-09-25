// Instrument tests: node tools/render_audio.js --test laugh,hum,...
'use strict';
window.TESTS = {
  laugh: () => laugh(samLaughBursts(), { inhale: { t: 1.25, dur: 0.38, amp: 0.22 } }),
  hum: () => hum([{ t: 0.2, midi: 62, dur: 0.8 }, { t: 1.05, midi: 69, dur: 0.8 }, { t: 1.9, midi: 71, dur: 0.4 }, { t: 2.3, midi: 69, dur: 1.2 }]),
  humM: () => hum([{ t: 0.2, midi: 50, dur: 0.8 }, { t: 1.05, midi: 57, dur: 0.8 }, { t: 1.9, midi: 59, dur: 0.4 }, { t: 2.3, midi: 57, dur: 0.4 }, { t: 2.75, midi: 54, dur: 2 }], { gender: 'm', wobble: 12 }),
  piano: () => { const o = [buf(6), buf(6)]; [62, 69, 71, 69].forEach((m, k) => { const [l, r] = piano(m, { vel: 0.5, len: 5, box: 0.3, spread: 3 }); mixInto(o[0], l, Math.round(k * 0.83 * SR)); mixInto(o[1], r, Math.round(k * 0.83 * SR)); }); return o; },
  pluck: () => { const o = buf(4); [62, 66, 69, 74, 78, 81].forEach((m, k) => mixInto(o, pluck(m, { len: 2.5 }), Math.round(k * 0.3 * SR))); return o; },
  whistle: () => whistle([{ t: 0.1, midi: 74, dur: 0.7 }, { t: 0.87, midi: 81, dur: 0.7 }, { t: 1.64, midi: 83, dur: 0.35 }, { t: 2.02, midi: 81, dur: 0.35 }, { t: 2.4, midi: 78, dur: 1.5 }]),
  cello: () => bowed(38, 4, { vel: 0.5, att: 1.2, cello: true }),
  babble: () => { const o = buf(6); for (let k = 0; k < 8; k++) mixInto(o, babbleVoice(6, { f0: rr(100, 220), fs: rr(0.95, 1.2), s: k }), 0, rr(0.4, 1)); return o; },
  birds: () => { const o = buf(8); ['blackbird', 'sparrow', 'robin', 'swift', 'evening'].forEach((k, i) => mixInto(o, birdSong(k, i), Math.round(i * 1.5 * SR))); return o; },
};
