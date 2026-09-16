# NOTES.md — scene list, so you can critique by scene

30.000 s. 12 drawn frames a second, 360 frames, seamless. 1080 × 1080.
`index.html` opens and runs; there is nothing else to install.

`draw(t)` is on `window`, `t` in seconds from start. It is a pure function of
`t` — no state carries between frames, every beam, flash, wreck and fighter is
a record with a spawn time and an analytic path. So you can scrub it:

```js
draw(17.2)          // the frame at 17.2 s, exactly, from a cold page
draw(17.2 + 30)     // the same drawing
```

Timings below are the hard cut **into** the scene. Every transition is a hard
cut; nothing in this piece cross-fades.

| # | in | out | mode | sheet | what happens |
|---|---|---|---|---|---|
| 1 | 0.00 | 3.40 | cold | 1 | **ENGAGEMENT PLOT.** Two fleets closing on a polar plot. Range 78 → 16 km. |
| 2 | 3.40 | 6.60 | warm | 2 | **PROFILE — STARBOARD ELEVATION.** BATELEUR as a general arrangement. Her screen launches at 5.4. |
| 3 | 6.60 | 9.20 | cold | 3 | **CONTACT.** The Shoal arrives. Tally runs 0 → 31. |
| 4 | 9.20 | 13.20 | warm | — | **THE BROADSIDE.** Both capitals, solo sheet, cold geometry laid over hot ink. |
| 5 | 13.20 | 16.20 | cold | 4 | **SCREEN ENGAGED.** Fighters, trajectory arcs, gun camera, kill marks. |
| 6 | 16.20 | 19.60 | warm | — | **HULL BREACH.** The shot lands at 17.00. Vermilion alarm 18.35 → 18.85. |
| 7 | 19.60 | 23.40 | cold | 5 | **LANCE — CHARGING.** X-ray. The charge runs 20.40 → 22.90. |
| 8 | 23.40 | 26.40 | warm | — | **THE LANCE.** Fires at 23.55. She parts at 23.90. |
| 9 | 26.40 | 29.00 | cold | 9 | **WRECK FIELD.** Three masses adrift. `opus 5` from 27.00. |
| 10 | 29.00 | 30.00 | cold | 1 | **The plot comes back up.** Wipes clean by 29.85 → frame 0. |

## Beat by beat

**1 · 0.00 — ENGAGEMENT PLOT** *(blueprint)*
Nothing moves for the first 0.15 s. Then the two tracks walk in down their
entry bearings — 205 for the Yard Fleet, 025 for the Shoal — and the callouts
and the closure dimension draw themselves on from 0.30. Range reads 78 km
down to 16 km. Chevron for a built ship, lozenge for a grown one; they keep
those marks for the whole piece.

**2 · 3.40 — PROFILE, STARBOARD ELEVATION** *(paper)*
BATELEUR, 380.0 m, HARRIER-class crown. She lands back-to-front over the
first 1.15 s — the reveal is a wipe through depth, not a fade, so the far
pods arrive before the near ones. Chain centre line, 380.0 M dimension,
title block with her real metrics, and a scale bar with a 1.8 m figure
standing next to it that comes out four pixels tall, which is the point of
drawing it. At 5.4 her screen leaves the ventral hangar.
*This is the only shot in the piece that is completely still.*

**3 · 6.60 — CONTACT** *(blueprint)*
The bearing needle sweeps and leaves contacts behind it, one every 0.068 s,
to 31. The tally builds in the top-left corner. Bottom-right: an inset
running a slow wireframe turn of the thing that has arrived — the Shoal is
grown rather than built and the inset is there to say so before the prose in
the title block does.

**4 · 9.20 — THE BROADSIDE** *(paper, solo sheet)*
Both capitals, three-quarter, hero low left and the Shoal high right. She has
advanced to the reach of her lances, wheeled her broadside across the mark
and is walking the line — four barbettes firing in rotation, fall of shot
walking aft along the Shoal's flank. Return fire is muted red, and every
explosion is white going to ember whoever it belongs to. Slow 5.5% dolly in.

**The tactical overlay is on top of the hand-drawn frame, not instead of it.**
Perfect circles, a bearing protractor, a reticle and two callouts sit over
boiled ink and hatching. That juxtaposition is the whole method; if this shot
does not read, nothing else in the piece will.

**5 · 13.20 — SCREEN ENGAGED** *(blueprint)*
Twenty-two fighters crossing, each dragging nine samples of its own past as a
dashed trajectory arc. Gatling tracer is walked onto a led mark. Kills leave a
crossed circle on the plot and the circle stays. Gun camera inset top-right.

**6 · 16.20 — HULL BREACH** *(paper → vermilion → paper)*
The incoming is visible from 16.45, half a second before it arrives. It lands
at 17.00 amidships. The plating goes, the breach is hatched hard, and 46
pieces of wreckage leave carrying the momentum the hull had. From 17.15 the
breach is measured while it is still burning — a range ring and a 104 M
dimension straight over the fire.

**18.35 → 18.85 is the vermilion sheet.** Half a second, ink on `#F0450E`, the
one time this drawing raises its voice. It is the only frame range in the
piece that is not paper or plate.

**7 · 19.60 — LANCE, CHARGING** *(blueprint)*
The hull drops to a ghost and you read her structure straight through it. The
lance runs the length of her — it is modelled inside the hull, which is why
the x-ray beat exists at all. The charge starts at 20.40 and takes 2.50 s:
rings contracting onto the muzzle, whitening, a count ticked off along the
bottom margin. Firing solution arcs out to the mark with range ticks every
5 km. **You see the shot coming before it speaks.**

**8 · 23.40 — THE LANCE** *(paper)*
Fires at 23.55. `#73FF99` at full saturation, spent once and not used again.
She parts at 23.90 at stations 4 and 8 — three masses, each carrying the
momentum she had and the spin the shot gave her. 300 px ember bloom, five
secondary magazines cooking off at 24.20 and after. The lance axis carries on
past her, dashed, because the geometry does not care that the picture got
interesting.

**9 · 26.40 — WRECK FIELD** *(blueprint)*
Three derelicts drifting apart on the same analytic tracks scene 8 handed
over, so the cut does not move them. Each called out at its own centre of
figure with tonnage and drift rate. Final tally: 31.

**`opus 5` comes up at 27.00, bottom right, above the title block, lowercase,
thin, tracked, on a leader with a node — the same leader every other label on
this sheet gets.**

**10 · 29.00 — the plot comes back up** *(blueprint)*
The wreck field wipes off, back to front, and is gone by 29.85. Underneath it
is the engagement plot on the bearings the two fleets came in on, annotations
at zero — which is frame 0. The last 0.15 s of the loop is the same drawing
as the first 0.15 s, on the same sheet, so the seam is not a seam. Wreckage
litters the field until the next war; the loop is the next war.

## Measured

Headless Chrome 141, 1080 × 1080, software raster, no GPU. `draw()` called
360 times in sequence, timings are wall clock inside the call.

| | ms |
|---|---|
| p50 | 2.5 |
| p95 | 58.6 |
| max | 99.5 |

The budget is 83 ms a frame. p95 sits inside it; the max sits outside it on
the two heaviest warm frames under software raster, and does not on a GPU.
The clock quantises to 12 fps rather than throttling rAF, so a long frame
costs a duplicate, never a skipped beat.

**Loop seam.** A loop is seamless when the step across the seam is the same
size as the step anywhere else, not when it is zero — the ink boils on every
frame by design, so zero would be wrong.

| pair | pixels changed |
|---|---|
| frame 357 → 358 | 2.44% |
| frame 358 → 359 | 1.04% |
| **frame 359 → 0** | **1.09%** |
| frame 0 → 1 | 1.05% |

## Where it obeys STYLE.md, and where it argues

Held: 12 fps; boil in the ink and never in the geometry; hard cuts only;
`#E4DFD5`/`#17120E` against `#0E2E52`/`#D9E6F2`; heat always white → ember;
`#73FF99` spent exactly once; corner ticks, title block, chain centre lines,
a scale bar with a body next to it; hatching cut in each surface's own
parameter space; one file, no build, no assets, no webfont, no library.

Argued, on purpose:

- **Hidden-line removal is faked.** `orbital-yard` tessellates into a depth
  buffer and clips every line against it. This lays the silhouette down as
  one filled path and then draws only the half of each frame and stringer
  that faces the camera. The result is the same at this size and it runs in
  a twelfth of a second.
- **The hull carries a 5.5% wash** rather than being bare paper inside its
  outline. Without it a hull reads as a hole cut in the sheet instead of a
  mass sitting on it.
- **The ground does not boil.** `faces` makes a fresh sheet per drawing; here
  a new sheet is a new *shot*, not a new frame. Paper that rearranged its own
  fibres twelve times a second under a still drawing strobes, and the boil is
  supposed to be in the ink.
- **The scale bar reads in kilometres on the plots**, with the 1.8 m figure
  kept only for the elevation where it means something.

## Known, unfixed

- Hatch tone is taken from the first ring's normals and applied down the whole
  stringer. On the Shoal, whose spine arcs, the terminator is a little ahead
  of where a real one would sit. Nobody will see it; it is still wrong.
- The warm hull fill knocks back the starfield behind it at 0.90 alpha rather
  than occluding it outright, so a bright star can faintly print through a
  hull. Left in — it reads as a drawing rather than a render.
- Scene 8's three masses separate mostly by rotation in the first second and
  only then by drift. A real break would throw them apart faster than it spun
  them.
