# STYLE.md — what John's work actually looks like

Phase 0 of `SPACE-BATTLE-PROMPT.md`. Written before any animation code.

Every claim below is a citation into a repo under `johnbr0phy`. Where I could not
find evidence I have left the question open rather than filled it in. Line numbers
are against the repo state on 2026-09-16.

## 0. What I read, and the era split

I cloned and read 26 public repos under `johnbr0phy`. The priority list in the brief
named some repos that do not exist on the account (`tiger-3d`, `illusion` — the
latter exists but is empty, 0 files after clone). `universe-clicker`, `Clawlab`
and `Japanbirds` are empty too. Skipped, per the brief.

The single most important finding is that **the account contains two different
authors**, and only one of them is John.

- **2025 cluster** — `Grassscrolling`, `Drugs`, `insane`, `FPS`, `elon-game`,
  `3D-Optical-Illusion`, `Grok-illusion`, `LifeGrid`, `Tiktok-gen`, `vision-board`,
  `ascii-canvas`. These are one-shot prompt output. `Grassscrolling/Index.html:9`
  is `font-family: Arial, sans-serif`, `:22` is a `#4CAF50` button, and `:6` titles
  the page "Copy HTML Example" — it does not contain any grass.
  `3D-Optical-Illusion/index.html:12` pulls `three@0.128.0` off unpkg and `:21`
  wraps the whole program in `try { // Added try-catch block`.
  There is no taste in these files to copy. **They are not evidence.**

- **2026 cluster** — `orbital-yard`, `mech-yard`, `moonbase`, `yard-walker`,
  `faces`, `thirty-two-k-lattice`, `hedgepig`. Self-contained, obsessively
  commented, built around a stated thesis, with measurement files checked in next
  to the code. **This is the style.** Everything below is drawn from it.

The 2026 cluster also happens to contain a space battle already — `orbital-yard`
ships `armada-war.html`, two fleets of procedurally forged capital ships shooting
at each other. Phase 1 has to answer to that file.

---

## 1. Palette

### 1a. The yard design system — one palette, three repos, byte-identical

`orbital-yard/index.html:12-23`, `mech-yard/index.html:12-23` and
`moonbase/index.html:12-23` all open with the same seven custom properties. Three
separate projects, same block, unchanged:

```css
--ink:#17120E; --ground:#E4DFD5; --panel:#EEEAE2; --rule:#C7BFB2; --dim:#6E665C;
--plate:#0E2E52; --plate-ink:#D9E6F2;
```

and an inverted set for dark mode (`orbital-yard/index.html:17-18`):

```css
--ink:#EDE7DC; --ground:#131110; --panel:#1B1815; --rule:#332E28; --dim:#8B8177;
```

Read that as: **warm near-black ink on warm off-white paper, and one cold navy
plate that the drawing itself lives on.** `--plate` is not an accent for buttons —
`orbital-yard/index.html:2984-2985` writes `PALETTES[S.pal].bg` straight into
`--plate`, so the UI takes its accent *from the drawing's own paper colour*.

The warm/cold split the brief wants from Kevin already exists in John's work, and
it is `--ground` vs `--plate`. I do not need to invent it.

### 1b. The drawing palettes

`orbital-yard/index.html:2791-2796` — the five sheets a drawing can be printed on.
Every one is a two-colour pair, bg and ink. No third colour anywhere:

| id | bg | ink |
|---|---|---|
| `blueprint` | `#0E2E52` | `#D9E6F2` |
| `vermilion` | `#F0450E` | `#150F0B` |
| `bone` | `#E9E2D2` | `#191512` |
| `sulphur` | `#E5C132` | `#161310` |
| `slate` | `#1A1A1C` | `#C6CACE` |

`blueprint` is the default (`S.pal` index 0) and the one every screenshot in the
READMEs uses.

### 1c. The paper, when it is paper

`faces/dude.js:7-9`:

```js
const HOUSE_INK = "#232019";
const PAPER = "#dfdacf";
const PAPER_RGB = [223, 218, 207];
```

and the pen table at `faces/dude.js:32-50`, which is the full warm-mode range —
`fountain #232f4a`, `biro #2b3560`, `biroBlack #25252b`, `fine #141312`,
`sepia #4a3325`, `forest #2c382f`, `soft #2e2c28`. Note what is *not* there: no
saturated colour at all. The warmest thing in the drawing is brown ink.

### 1d. Combat colour, from the file that already did this

`orbital-yard/armada-war.html:3325-3326`, with his own comments:

```js
const BEAMCOL=[[0.52,0.78,0.58],[0.78,0.46,0.42]];  /* everyday fire: muted green, muted red */
const IONCOL=[[0.45,1.0,0.60],[1.0,0.32,0.26]];     /* the ion lance keeps the full voltage */
```

So `#85C794` / `#C7756B` for ordinary fire, `#73FF99` / `#FF5242` reserved for the
one weapon that is allowed to be loud. Saturation is a **rank**, not a decoration.

And `armada-war.html:2603-2608`:

```glsl
/* an explosion is heat, not a team colour: white going to ember, and
   no two the same shape — the lobes come off the flash's own seed */
col=mix(vec3(1.0,0.97,0.88),vec3(1.0,0.45,0.16),clamp(vO*1.4,0.0,1.0));
```

`#FFF7E0` → `#FF7329`. Fire is never red, never the team's colour, and always
ramps white→ember over its own life.

`thirty-two-k-lattice/index.html` agrees from the other direction: the world is
cold blue-grey `vec3(.40,.47,.58)` = `#667894` and the *only* warm thing in it is
the heat ramp to `vec3(1.,.52,.20)` = `#FF8533`, over a `#05070c` void.

### 1e. Palette conclusion for Phase 1

- paper `#E4DFD5`, ink `#17120E`, rule `#C7BFB2`, dim `#6E665C` — warm mode
- plate `#0E2E52`, plate-ink `#D9E6F2` — cold mode
- hero fleet `#85C794`, antagonist `#C7756B`, escalated to `#73FF99` / `#FF5242`
  only for the heaviest shot in the piece
- heat `#FFF7E0` → `#FF7329`, never tinted by side
- `#F0450E` (vermilion) exists as a full-bleed alarm sheet and is the correct
  colour for a single catastrophe frame

Five hues total. That is his whole range.

---

## 2. Motion

### 2a. Twelve frames a second, on purpose

`faces/dude.js:5477-5482` — the longest comment in the file is about frame rate:

```js
// Twelve drawings a second. Not a frame rate chosen to be cheap — a hand
// does not redraw a figure sixty times a second, and at sixty the boil
// turns into a shimmer and the whole thing stops looking drawn. Twelve is
// where it reads as a flipbook, and it is also two frames on ones for every
// frame a screen shows, which is exactly how this has always been done.
const FPS = 12;
```

`faces/scene.js:21` is `const FPS = 12;` again. The rAF loop at `dude.js:5484-5493`
runs at display rate and *quantises* to 12 — `const f = Math.floor(el * FPS); if (f
=== frameNo) return;`. It does not throttle rAF; it throttles the drawing.

### 2b. Boil

`faces/dude.js:119-125`:

```js
// The line itself crawls between frames. Hand-drawn animation boils because
// the second drawing is a second drawing, not the first one moved — and a
// rig that holds perfectly still between poses is the one thing that gives
// away that a computer is doing the inbetweens. This shifts the noise field
// the nib wanders through, so the ink is redrawn rather than replayed, while
// every structural decision about the dude stays exactly where it was.
let BOIL = 0;
```

The important half is the second clause: **boil moves the noise seed, not the
geometry.** Structure is stable; only the ink wanders. `dude.js:475-476` is where
it lands — `const amp = (opt.wobble ?? Math.min(2.0, 0.26 + L * 0.011)) * PEN.wobble;`
applied along the path normal, scaled by stroke length.

### 2c. Easing — rest and snap, not ease-in-out

`faces/dude.js:128-144`, three easings, each with a stated physical reason:

```js
// Ease that sits at rest and snaps — a body accelerating out of a pose.
function swing(x) { return Math.sin(x * TAU); }
// A sine that lingers at the extremes. A look, a shrug, a hip parked over
// one foot — none of those pass through the middle at constant speed. They
// get there and stay a beat. p < 1 square-ifies the wave.
function holdSin(t, p = 0.45) { ... Math.pow(Math.abs(s), p); }
```

No cubic-bezier, no library. Sine, and a squared-off sine that holds at the ends.

### 2d. Reveal is a wipe through depth, not a fade

`orbital-yard/index.html:2353-2358`:

```js
/* order no longer decides what is visible — it only decides the order in
   which bodies land during the reveal wipe, back to front */
const shown = Math.max(0, Math.min(items.length, Math.round(items.length*reveal)));
```

Things arrive **back to front, part by part**. Nothing cross-fades in his work; I
found no `globalAlpha` ramp used as a transition anywhere in the 2026 cluster.

### 2e. Combat motion is doctrine, not jitter

`armada-war.html:3992-4012`:

```js
/* a crown fights at her own range. She advances to the reach of her
   lances, wheels her broadside across the mark and walks the line;
   wounded, she opens the distance and lets the screen earn its name;
   and she never lays herself bow-to-bow against the enemy's crown —
   that is a brawl, and a crown does not brawl until the mop-up. */
```

and `armada-war.html:4110-4111`:

```js
/* the charge: white light gathering at the muzzle for two and a
   half seconds — you see the shot coming before it speaks */
```

Two rules fall out. Capital ships **hold range and present a broadside**; they do
not chase. And **the big weapon telegraphs for seconds before it fires** — the
anticipation is the shot. `README.md:90-95` adds "wreckage that carries the dead
ship's momentum and litters the field until the next war": debris inherits
velocity and persists, it does not puff and vanish.

### 2f. Camera

`thirty-two-k-lattice/index.html` — the camera bobs at `1.55 + .038*sin(y)` with a
`-.13*v` crouch under speed and a `-.028*c` roll into turns. Small numbers.
`TELLS.md:1` is a filed bug against the *starting camera position* being on a
symmetry plane, severity 5, fixed by moving the eye 45° off axis. He cares about
camera framing at the level of "is this accidentally symmetric".

---

## 3. Composition

The unit of composition in the 2026 cluster is **a drafting sheet**, not a picture.
`renderSheet()` in `orbital-yard/index.html:2607-2788` lays out the whole thing and
every element of it is a drawing-office convention:

- **Corner ticks, not a border.** `index.html:2641-2644` and `:2783-2786` — four
  L-shaped marks of length `U*0.020` inset `U*0.016`, and nothing joining them.
  `:2622-2623` explains they sit outside the repainted cell so a frame never wipes
  them.
- **Title block bottom-right.** `:2750-2781`. Boxed, ruled, with a vertical divider
  at 72% and a horizontal rule at 70% height. Left of the divider: designation
  (weight 700), class, configuration string. Right: `ORBITAL YARD`, `HULL <seed>`,
  `SHEET 1 OF 1`. Bottom strip: five ruled columns — `LENGTH` `BEAM` `HEIGHT`
  `DRY` `CREW` — each a small tracked caps label over a larger value.
  **`CREW` reads `NIL` when there is no crew**, not `0` and not blank.
- **Scale bar with a human on it.** `:2736-2748`. A `20 M` bar with five ticks,
  alternating tall/short (`i%2 ? U*0.009 : U*0.016`), labelled `0` and `20 M`, and
  beside it a 1.8 m human silhouette drawn as a nine-point polygon with a circle
  head, labelled `1.8 M`. Scale is always given twice: once as a ruler, once as a
  body.
- **Centre lines are ISO chain lines.** `:2715` — `cdash=[U*0.016, U*0.007,
  U*0.004, U*0.007]`, long-short-long, drawn at `lw*0.6` through every elevation.
- **View labels are caps with tracking, under a rule.** `:2716-2718` draws a rule
  the full width of the cell and puts the label *below* it: `PROFILE — STARBOARD
  ELEVATION`, `PLAN`, `BOW ELEVATION`, `PICTORIAL` (`:2729-2730`). Tracked
  `U*0.003`, weight 600, size `U*0.018`.
- **Square-ish is the honest case.** `:2610` — `const portrait = W < H*1.02;` and
  the portrait branch gives the pictorial the top of the sheet and stacks the three
  elevations under it. A 1080×1080 canvas takes the portrait branch.
- **Solo mode throws the sheet away.** `:2620-2645` — when one view matters, the
  layout collapses to that view plus the four corner marks. No block, no scale bar.

Shading is **vector hatching, not fill**: `:2234-2241`, "the hatch is cut in each
surface's own parameter space… density is an ordered dither over the hatch index",
sized so the darkest pass lands near a 3.6 px pitch (`:2254-2255`).

Texture, in warm mode, is **paper**: `faces/dude.js:937-982` builds it in four
passes — 16 soft blooms at 0.6–1% alpha, 1500 quadratic fibre strokes, 4200 sub-pixel
tooth rects, 40 flecks of pulp — under a comment that says why
(`:944-946`): "Cartridge paper is not a flat tone… A flat field with speckle on it
is the easiest thing in the whole drawing to spot as printed."

---

## 4. Code smell

**One file, no build, no dependencies.** Stated verbatim in three READMEs:
`orbital-yard/README.md:4`, `mech-yard/README.md:4`, `moonbase/README.md:4` —
"One self-contained HTML file, no build step, no dependencies." `orbital-yard`'s
"Running locally" section (`README.md:34`) is two sentences: "Open `index.html`.
That is the whole thing."

**Canvas 2D behind a draw target.** `orbital-yard/index.html:1930-1964` defines two
targets with the same four methods — `path(pts, stroke, w, dash)`, `poly`, `rect`,
`text` — one writing to `ctx`, one emitting `<polyline>`. All drawing code takes a
`t` and never touches `ctx`. That is why "the PNG and SVG exports are the same
drawing" (`orbital-yard/README.md:21`).

**On Three.js:** the brief asks whether the audit justifies it. It does not.
Three appears in `orbital-yard/armada-three-engine.js` and the `-tribute` files,
and in the 2025 junk (`3D-Optical-Illusion`). But the flagship drawings —
`orbital-yard/index.html`, `mech-yard/index.html`, `moonbase/index.html`, `faces` —
are raw Canvas 2D with hand-written projection and hidden-line removal, and
`thirty-two-k-lattice` is raw WebGL2 with hand-written GLSL and no library at all.
**Default holds: Canvas 2D, vanilla, one file.**

**Comment voice.** Prose, full sentences, lower-case after the opener, em dashes,
and almost always answering *why* — usually by naming the bug that forced the
change. `mech-yard/index.html:1710` opens "A leg used to be a string of truncated
cones with a ball at each kink…". `orbital-yard/index.html:948` is "the hull
lengthens rather than letting a section shrink below its minimum".
`:2626-2629` explains a scale choice by describing the failure it avoids: "a scale
that tracked the current yaw would make the ship breathe in and out". There is not
one comment in the 2026 cluster that restates what the next line does.

**Naming.** Terse and domain-loaded. `pal`, `ink`, `lw`, `dw`, `hw`, `bb`, `desig`,
`klass`, `topo`, `berth`, `yoke`, `girdle`, `crown`, `brSgn`, `mopup`. Ships are
`she`. Fleets have names in tracked caps — `SIDE_NAME=["THE YARD FLEET","THE
SHOAL"]` (`armada-war.html:3324`).

**Type.** `IBM Plex Mono` / `IBM Plex Sans` / `Saira Condensed`, loaded identically
at line 9 of all three yard repos. Labels are uppercase with positive tracking and
`font-variant-numeric: tabular-nums` (`orbital-yard/index.html:121`). Phase 1 loads
no webfonts, so: `ui-monospace, "IBM Plex Mono", monospace`, uppercase, tracked.

**Measurement is checked in.** `thirty-two-k-lattice` ships `RECEIPTS.md` (a table
of gz bytes / p99 / TTFP per round, on a named rig), `TELLS.md` (falsifiable "this
gives it away" bugs with severity and repro), `CRITIQUE.md`, `VERDICTS.md`. The
work is expected to be argued with. `NOTES.md` for this piece is written in that
spirit.

---

## 5. Hard rules for Phase 1

1. **Two colourways and nothing between them.** Warm = `#E4DFD5` paper, `#17120E`
   ink. Cold = `#0E2E52` plate, `#D9E6F2` ink. Hard cut between them on a scene
   boundary — no cross-fade, no dissolve, no third transitional palette. Total
   hue budget for the piece: paper, plate, `#85C794`, `#C7756B`, `#FF7329`, plus
   `#F0450E` for exactly one frame-range.

2. **Twelve drawings a second.** rAF runs at display rate; the drawing quantises to
   12 fps (`faces/dude.js:5482`). This is the single loudest tell in his work and
   the cheapest to get wrong.

3. **Boil the ink, not the ship.** Every stroke wanders along its normal by a
   per-frame noise seed; no ship's actual position, scale or geometry is ever
   perturbed to fake life (`faces/dude.js:119-125`).

4. **Chrome is a drafting sheet, never a UI.** Corner L-ticks. Title block bottom
   right with a real metric strip. A `20 M` scale bar with a `1.8 M` human beside
   it. ISO chain centre lines. Caps labels under a rule. Zero rounded rectangles,
   zero buttons, zero glass, zero glow-on-panel.

5. **Fire is heat, not team colour.** Every explosion ramps `#FFF7E0` → `#FF7329`
   regardless of who died (`armada-war.html:2603-2606`). Team colour lives in beams
   and hull tags only, and full-saturation `#73FF99` / `#FF5242` is spent once, on
   the heaviest shot in the piece.

6. **Capital ships hold range and present a broadside; they do not chase.** The
   heavy weapon charges visibly for ~2.5 s before it speaks. Wreckage keeps the
   dead ship's momentum and stays on the field
   (`armada-war.html:3992-4012`, `:4110-4111`, `orbital-yard/README.md:94`).

7. **Shade by hatching, texture by paper.** Warm scenes get the four-pass cartridge
   ground (`faces/dude.js:937-982`); solids get line hatching cut in the form's own
   direction, never a gradient fill. No `createRadialGradient` bloom as a
   substitute for drawing.

8. **One file, no build, no assets, no webfonts, no library.** Open it, it runs.
   Every mark on the sheet is a path this file computed.

### Where this conflicts with Kevin, and how it resolves

Kevin's dual mode is warm-painterly vs cold-vector. John's is `--ground` vs
`--plate`. They are the same axis, so the mode switch survives intact and only the
hex values change. Kevin's hard cuts survive — John doesn't cross-fade either.
Kevin's steppy 12–15 fps survives; John names 12 explicitly, so it is 12.
The one place Kevin loses: **his cold mode is high-key cyan/magenta/lime on black.**
John has no magenta and no lime anywhere in 26 repos. Cold mode is navy plate with
pale blue ink, and the accents are the muted green/red of `BEAMCOL`.
