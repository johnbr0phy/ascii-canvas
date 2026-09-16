# NOTES.md — *A life in colour*

60.000 s, 1080×1080, seamless. Open `index.html`. It starts itself; there is no chrome, no
play button, no controls. `draw(t)` is on `window`, `t` in seconds from the start, so any
moment can be pulled up directly from the console — `draw(35.4)` gets you the open flower.

The style guide is `STYLE.md` and was written first. Everything below is the film.

---

## The spine, by beat

Ten scenes. **In/out** are seconds. **Wipe** is when the next scene's ground starts being
brushed over this one — the overlap is 1.10 s every time, so a scene's last clear moment is
its wipe time, and that is the frame to judge it on.

| # | scene | in | out | wipe starts | last mark down | what happens |
|---|---|---|---|---|---|---|
| 1 | alone / first mark | 0.00 | 6.00 | 4.90 | 5.75 | Bare cream ground. One vermilion stroke at 1.00, laid slowly. A head on it at 2.55, contours at 3.30, the shadow it stands in at 4.00 — one small figure, alone, left of centre. At 4.55, far off to the right and very faint, somebody else exists. |
| 2 | crowd / belonging | 6.00 | 12.50 | 11.40 | 5.70 | Vermilion ground. Thirty-five slab figures in three ranks — back rank first, then forward — shoulder to shoulder, adults and half-height children, cut off at both edges. Nobody is alone and nobody has a face yet. |
| 3 | family / kin | 12.50 | 19.00 | 17.90 | 5.65 | Dark streaked ground. A row of rounded legs first, then flat blocked torsos, then three faces — dot eyes, line mouth, blushed cheek. This is the *Bruvers* beat. |
| 4 | love / looking | 19.00 | 25.00 | 23.90 | 5.25 | The black grid goes up, a dark disc sits in it, an ochre panel beside it. A head behind bars, looking. The coldest scene on purpose — it is the one about being looked at. |
| 5 | making / vessels | 25.00 | 31.00 | 29.90 | 5.60 | Five vessels, each a different tone, overlapping. At 28.30 the charcoal is re-stated over the whole group so every contour reads through every body. Then a tulip is put in one, and a red fruit. Making, and then using what you made. |
| 6 | growth / garden | 31.00 | 37.50 | 36.40 | 5.50 | Turquoise with newsprint blocks under it. Six stems climb out of the bottom edge and open in turn. The big five-petal flower opens petal by petal from 33.15. The blue ribbon curls underneath everything. |
| 7 | weather / field & shore | 37.50 | 44.00 | 42.90 | 6.45 | Gold sky, gold field, small dark trees on the hill line. A path opens at our feet. One figure walks it from 39.40 to 43.95 — the only thing in the film that travels — while rain combs in off the right and stops short of him. |
| 8 | companions | 44.00 | 49.50 | 48.40 | 5.00 | The shaggy dog, cropped by the frame, warm rim behind, blue-grey only where the head turns from the light. Willum the cat asleep bottom-left. Daisies going in one at a time beside him. |
| 9 | age / evening light | 49.50 | 56.00 | 54.90 | 5.50 | Night blue over a dark horizon. The hot disc, small, low. The town builds up in pale blocks with lit windows, then the drips run down it. The quietest palette and the most paint. |
| 10 | return | 56.00 | 60.00 | 58.90 | 2.00 | The opening ground again, with every colour of the film ghosted into the cloth. The first vermilion mark once more — older paint now, speckled and scratched through. The figure from scene 1, and beside them the one who stood far off. Then the ground brushes back over and it starts again. |

Scene 7 is the one exception to "last mark before the wipe": the walking figure is still
moving as the field is painted over. That is deliberate — he walks out of the picture.

## The loop

It is a true loop, not a fade to the start. Verified in the browser, not by eye:

- `draw(59.9999)` and `draw(0)` are the **same pixels** — mean difference 0, max 0.
- `draw(t)` equals `draw(t + 60)` everywhere tested, exactly.
- `draw(t)` twice gives identical pixels: every mark's randomness comes from its own seeded
  generator, so there is no frame-to-frame boil.

It reads as one life restarting rather than a hard cut because scene 10 *is* scene 1's ground.
The return is painted on the cream the film opened on, so when the wipe takes it away there is
nothing to cut to — the canvas is simply bare again, and the first mark is made again.

## Method notes, for critique

**Every frame is drawn in JavaScript.** No images, no video, no `drawImage` of anything but
the film's own buffers, no Three.js, no build step, no webfonts, no network. One file.

**A scene is a list of timed marks**, `{at, grow, seed, f}`. A mark paints itself from `k=0`
to `k=1` over `grow` seconds and then it is *baked* into the scene's buffer and never touched
again — paint that has dried. Only what is still wet gets redrawn. That is also why the film
is cheap: most frames are one copy of the dried paint plus one or two marks in progress.

**Transitions are paint-over, never crossfade.** The incoming ground arrives in 22 tapered
brush bands with ragged bristled edges, clipped band by band. She paints over; she does not
dissolve. There is no alpha crossfade anywhere in the film.

**Texture is painted, not filtered.** `bristle()` lays a stroke as a solid core plus
separate bristle hairs with their own width, tone and jitter; grounds are 84–118 crossing
strokes plus patches plus 1300–2600 speckles; edges are either a loaded ink contour of
varying width or a soft charcoal bloom, never both on one form. Nothing is laid over the top
of the frame as a global effect.

**The mark.** `opus 5` is bottom-right, lowercase, pencil-grey, at 20% alpha, drawn as brush
strokes from hand-built letter paths rather than typeset — it has no font dependency and it
sits in the ground the way she pencils "Walkies, anyone?" into a dog. It appears at 57.00 and
goes under with everything else at 58.90.

## Performance, measured

Measured in headless Chrome on a **software rasteriser**, which is the worst case — no GPU at
all. Real hardware will be well clear of this.

- Median frame interval on the film's own `requestAnimationFrame` loop: **33 ms**. It was
  67 ms before the frame work went in.
- Per-frame drawing cost, paced at 60 fps with rasterisation forced: median **4.7 ms**, 87%
  of frames under 16.7 ms.
- The long frames that remain are not attributable to any particular mark — a nearly empty
  scene-1 frame can cost as much as the busiest one, which points at the software
  rasteriser's own texture handling rather than the film.
- No page errors across the full loop.

## Known softnesses, worth a look

- **Scene 3, around 14.5 s.** The heads go on as dark hair masses a beat before the faces
  land, so there is a moment where three dark blobs sit on the row. It resolves by 16.0 but
  it is the least attractive half-second in the film.
- **Scene 4** is abstract where the brief says *love / looking*. It is the *Talking Heads —
  Talking to Myself* language rather than the *Bruvers* language, on the grounds that the
  faces beat had already been spent on scene 3. If it reads as cold rather than as looking,
  that is the beat to re-cut.
- **The charcoal bloom on the big flower** (scene 6) is patchier than *In the Pink* because
  the petals are now separate marks and each one's bloom gets partly covered by the next
  petal. Closer to the reference in how it separates overlapping petals, weaker in how it
  holds the flower as a whole.
- **Scene 6's ribbon** is thinner than *The Ribbon* wants. It curls correctly but it has less
  body than a collaged strip of blue would have.
- **The vessels** (scene 5) are more straight-sided than *Transparencies*. The profiles carry
  shoulders and a pinched neck on the big vase, but they are still closer to trapezoid than
  to her curves.
