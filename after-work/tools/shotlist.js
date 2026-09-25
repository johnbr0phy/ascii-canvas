// node tools/shotlist.js > SHOTLIST.md
const { SHOTS, FILM_DUR } = require('../src/shots.js');
const tc = s => { const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + r.toFixed(1).padStart(4, '0'); };
const CH = { open: 'Cold open', work: '2027: the routine / the machines', fear: 'The fear', winter: '2028: winter', turn: '2029: the turn', memory: 'Memory', night: 'Saturn', gold: '2031 to 2040: opening up', end: '2047: the stars' };
let out = `# After Work: shot list\n\nGenerated from \`src/shots.js\`, which is the single source of truth for the renderer, the score and this file. Total running time: **${tc(FILM_DUR)}** (${FILM_DUR.toFixed(1)} s). ${SHOTS.length} shots. Drawings at 12 per second, output at 24 fps.\n\n`;
let ch = '';
for (const s of SHOTS) {
  if (s.ch !== ch) { ch = s.ch; out += `\n## ${CH[ch]}\n\n| # | In | Dur | Shot | Camera | Characters | Beat | Audio |\n|---|---|---|---|---|---|---|---|\n`; }
  out += `| **${s.id}** | ${tc(s.start)} | ${s.dur}s | **${s.name}.** ${s.desc} | ${s.cam} | ${s.chars} | ${s.beat} | ${s.audio} |\n`;
}
console.log(out);
