# MOTION.md — beat sheets, motion v3

Kevin/Fable grammar as the structure; Gill's colour, texture and humour as the
paint language only. All three films: 1080×1080, `draw(t)`, `requestAnimationFrame`,
auto-start, one self-contained file, no assets. Append `?t=SEC` to any film to
render a single frame and hold it.

Shared layer lives in `src/`:

- `src/paint.js` — brush, impasto, wash, contour, envelope, ground, craze, handwriting
- `src/motion.js` — cut tables (`held`), camera (`camAt`/`applyCam`), `lensPath`/`lensThrough`/`lensRim`,
  `tallyMarks`, `crosshair`, `arcThrow`, `ringsOut`, `makeBranch`/`drawBranch`,
  `chaosAt`/`gridAt`, `flash`, `shake`, `paintOn`, `opusMark`
- `src/build.js` — inlines paint + motion + one film's assets and timeline into each HTML
- `src/shots.sh`, `src/perf.js` — still frames and frame-time/loop-seam measurement

Rule of `motion.js`: **nothing fades.** Fades are reserved for the two closing
scrubs. Everything else cuts.

---

## 01 — A Shopping List, Mostly Kept · 14.0s

Mode A: worked grey-cream canvas, torn list, pencil and biro.
Mode B: scorched kitchen dark, the same handwriting relit in gold, the seven
things up as objects.

The list sits at `LX` and each object sits at its own sky coordinate **in both
poles**, so every snap between them is a match-cut. Nothing is repositioned to
make a cut work.

| t | beat |
|---|---|
| 0.00 | breathe — the list on the cream, camera drifting 1.00 → 1.045 |
| 0.45 / 0.60 / 0.72 / 0.88 | **dual-mode heartbeat** — B / A / B / A. Four snaps, words never moving |
| 1.10 | she goes over the crossing-out again, live, harder |
| 1.35 | **SCALE JUMP 1** — "tomatoes" at 176px, painted at that size, not zoomed. Paper fibre and craze at their own scale so the close-up has *more* surface than the wide |
| 1.62 | **organic branching** — the biro underline stops being a line and becomes a family of paths |
| 2.20–2.31 | **iris flash** — the cold pole blinks through the paper for two frames |
| 2.35 | back out wide; **seven thrown arcs** off the ends of the seven words, aimed at where each thing is about to be |
| 2.70–3.75 | **REVEALING LENS** — hung from above the top edge on a drawn string and swung once across the square. Mode B and everything already up in it |
| 3.15–3.55 | **flash montage inside the lens** — each object for ~1.5 frames at a size the wide shot never gives it |
| 3.75 | lens goes off like a flashbulb; full-frame `lighter` flash |
| 3.80 | **CHAOS** — seven things loose in the dark. Two earlier exposures at 0.13 / 0.26 alpha behind the live one, so a form travelling that fast smears. Tally marks count them |
| 4.90 | **GRID SNAP** — 4-wide inventory, hand-drawn box, crosshair on each, count held at 7 |
| 5.45 | breaks — thrown back out to the sky positions, overshooting (`over()`) |
| 5.67 | the constellation: struck star marks in the gaps the objects leave; three arcs draw on, hold, retract |
| 6.95 / 7.10 | **match-cut** — same seven, same places, on the cream, then straight back to the dark |
| 7.25 | **SCALE JUMP 2** — the biscuit at monument size, painted natively (crumb, docker holes with a wall and a floor, the bite). Mode B relights it by dragging gold along the top of the crumb, not by recolouring it |
| 7.42 | the crossing-out returns as **two meteors**, gone in a third of a second, leaving a scorch. The joke: being crossed off is what set it alight |
| 8.25 | the same close-up on paper — pencil, biro, no fire |
| 8.40–9.48 | **STRIKE** — 8 cuts in 1.08s. Mode, scale *and* framing change on the same frame (`T.strikeCuts` carries `[t, mode, z, x, y]`). Hand-held shudder at amplitude 3 |
| 9.75 | breathe — the dark, held |
| 10.05 | the aside written in behind a moving clip: "crossed off, and the brightest thing in it" |
| 10.90 | quiet lowercase `opus 5` on a Mode B frame |
| 11.60 | the cream is scrubbed back over the dark with a rag, in bands, front staying torn |
| 12.90 → 14.00 | home; loop seam measured at 0 |

---

## 02 — Two Umbrellas, Having Words · 13.5s

Mode A: wet daylight, putty air, two hot canopies too close together.
Mode B: the same street after dark — they have been at it that long — graded
down into navy with one lamp.

Two feet on the pavement (`RB`, `BB`) are constants for the whole film. Every
mode snap, every cut and every scale jump is a match-cut on the same pair; the
only thing that changes is the angle above each foot.

| t | beat |
|---|---|
| 0.00 | breathe — barely a rock, both of them still being polite |
| 0.40 / 0.54 / 0.68 / 0.82 | **dual-mode heartbeat** — B / A / B / A, nobody moving |
| 1.00 | **three shoves in**, each further than the last (`leans()`) |
| 1.42 | **SCALE JUMP 1** — two rims and the gap. Both canopies re-painted at ~2.6× the wide-shot radius so only one shoulder of each is in frame, and all that is left between them is a hand's width of falling rain, clipped brighter |
| 1.66–1.80 | **iris flash** — night blinks through the slot between them |
| 1.98 | back out wide |
| 2.06 | **data overlays** — apex-to-apex arcs both ways, and the angle of each lean ticked off at the foot in its own colour |
| 2.50–3.26 | **REVEALING LENS** — a hole in the afternoon dragged across the square at head height, arcing, growing 130 → 282px, with the night street and the same three umbrellas live inside it |
| 3.26 | lens goes off; amber flash |
| 3.30 | **CONTACT** — six mode snaps in 0.16s, white water thrown off the rim, shudder at amplitude 9, broken rings out of the point of impact |
| 3.46 | **the red one is inside out**, which is what it gets for shouting. Visual gag in-image |
| 3.68 | **CHAOS** — the canopies come apart into 12 torn panels. Two smear exposures behind the live one. Tally marks count to 12 |
| 4.68 | **GRID SNAP** — the argument as a hand-ruled colour chart, crosshair on each swatch |
| 5.18 | breaks — panels thrown back, overshooting, fading out |
| 5.42 | aftermath: red leaning away, blue standing up straight, which is worse |
| 5.86 | **organic branching** — run-off from the broken corner becomes a family of rivulets down the pavement into the puddle |
| 6.58 / 6.74 / 6.88 / 7.00 | **match-cut** — four snaps on the aftermath |
| 7.10 | **SCALE JUMP 2** — into the puddle. Two colours in half an inch of rain, refusing to mix, with the seam where they push at each other. Rings out, crosshair, count of 2 |
| 7.88 | the same half inch of water in the afternoon |
| 8.16–9.44 | **STRIKE** — 10 cuts in 1.28s across three framings (1.00 / 1.55 on the red / 1.62 on the blue / 1.30 on the puddle) |
| 9.62 | breathe — the small amber one, which has said nothing all film, comes and stands between them |
| 10.02 | "you started it" written in |
| 10.94 | `opus 5` on a Mode B frame |
| 11.42 | the rain washes the afternoon back across the square, and `leans()` eases both of them home so the seam has nothing to catch on |
| 12.86 → 13.50 | home |

---

## 03 — The Kettle Makes Its Own Weather · 13.0s

Mode A: warm plaster kitchen, enamel kettle, one flame.
Mode B: the same kitchen under its own weather — graded into navy and slate,
the cloud low over the bench, raining.

The kettle sits at `KX, KY` in both poles **and in every close-up**.

| t | beat |
|---|---|
| 0.00 | breathe — the kitchen, first steam |
| 0.36 / 0.50 / 0.64 / 0.78 | **dual-mode heartbeat** — B / A / B / A |
| 1.20 | **SCALE JUMP 1** — the mouth of the spout, painted at the size it is shown: an enamel lip with the chip in it down to black iron, the dark of the bore, and the whole column of steam leaving through an opening the width of a thumb |
| 1.44–1.58 | **iris flash** — the storm through the spout mouth |
| 1.76 | back out wide |
| 1.86 | the cloud grows over the bench, lobe by lobe |
| 1.96 | **data overlays** — an arc thrown from the spout to the cloud, and a second from the cloud to the cup |
| 2.40–3.14 | **REVEALING LENS** — an iris opened at the mouth of the spout (84px) and grown to 784px until the whole kitchen is inside its own weather, with rings going out ahead of it |
| 3.14 | it goes off; cold flash, shudder at amplitude 8 |
| 3.24 | **CHAOS** — the cloud comes apart into 12 torn newsprint slips. Two smear exposures. Tally marks count to 12 |
| 4.20 | **GRID SNAP** — a forecast. A week of weather, hand-ruled and issued by a kettle. Each slip carries its own wetness |
| 4.72 | breaks — the slips go back up into the cloud, overshooting, and the forecast is a cloud again |
| 5.02 | it rains into the cup; the tea rises over the next 3.6s |
| 5.58 | **organic branching** — the steam column stops being one thing on its way up and becomes the whole sky |
| 6.30 / 6.46 / 6.60 / 6.72 | **match-cut** — four snaps on the same raining kettle, its belly holding the other weather |
| 6.84 | **SCALE JUMP 2** — down into the cup, where the forecast is being kept. Rain landing on tea, rings, crosshair, count of 3 |
| 7.66 | the same half inch of tea in the warm kitchen: no weather in it, which is somehow worse |
| 7.98–9.26 | **STRIKE** — 10 cuts in 1.28s across four framings (1.00 / 1.60 on the kettle / 1.55 on the cup / 1.42 on the cloud) |
| 9.42 | breathe — cup full, kettle holding its own weather in its belly |
| 9.86 | "showers later, mainly in the cup" written in |
| 10.80 | `opus 5` on a Mode B frame |
| 11.28 | the front goes through: the warm kitchen scrubbed back in bands, cloud and rain and tea all going with it |
| 12.62 → 13.00 | home |

---

## Grammar coverage

| | 01 | 02 | 03 |
|---|---|---|---|
| dual-mode heartbeat | 4 snaps @0.45 | 4 snaps @0.40 | 4 snaps @0.36 |
| match-cuts | @6.95, and every cut in the strike | @6.58×4, contact ×6, strike ×10 | @6.30×4, strike ×10 |
| revealing lens | pendulum on a string, 2.70–3.75 | dragged across, 2.50–3.26 | iris grown from the spout, 2.40–3.14 |
| iris flash inside the other pole | @2.20 | @1.66 | @1.44 |
| scale jumps | word @1.35, biscuit @7.25 | rims @1.42, puddle @7.10 | spout @1.20, cup @6.84 |
| chaos → grid → break | 3.80 / 4.90 / 5.45 | 3.68 / 4.68 / 5.18 | 3.24 / 4.20 / 4.72 |
| organic branching | @1.62 | @5.86 | @5.58 |
| breathe / strike | 8 cuts @8.40 | 10 cuts @8.16 | 10 cuts @7.98 |
| data overlays | arcs, tallies, crosshairs, meteors | angle arcs, tallies, crosshairs, rings | arcs, tallies, crosshairs, rings |
| in-image gag | crossed off = the brightest thing in it | the loud one goes inside out; the argument filed as a colour chart | a kettle issuing a week's forecast |
| loop | 14.0s, seam 0.0000 | 13.5s | 13.0s |
