# Adversarial review — what v1 got wrong and what this pass changed

John's verdict on v1 was "sticker-pack hexes on diagram doodles. Not her hand."
That is an accurate diagnosis and it names two separate failures, so it is worth
keeping them apart.

**Sticker-pack** is a rendering failure. Flat fills, uniform outlines, no
surface. Every form looks like it was die-cut and laid on the background rather
than painted into it.

**Diagram doodle** is a composition failure. Leader lines, evenly-spaced rays,
tally bars, arrows, labelled callouts. The image explains itself instead of
being looked at.

Both had to be attacked separately, and the second one keeps coming back,
because the temptation with a "dual-mode" structure is to make the second mode a
chart.

## What was rebuilt

Everything. v1 had no paint machinery, so the three films now sit on a shared
engine (inlined into each page, since each film has to be one file):

- **Bristle brush** — pressure, bristle spread, colour drift per bristle,
  run-length dry-brush, and arc modulation so a contour swells where the hand
  pressed and drops out where it lifted.
- **Ribbon fill** for solid forms (see below).
- **Impasto** — knife strokes with a shaded and a lit side, stipple, and a
  crumpled-tissue crease pass.
- **Charcoal contour** — soot bleed, one continuous weight-varied core, and two
  or three short overdrawn passages.
- **Crumpled-tissue craze plate**, **torn paper collage** with buried newsprint,
  **worked grounds**, drips, spatter, sgraffito.
- **Stroke-font handwriting** — a real single-stroke alphabet with wobble and
  pressure, not stick zigzags standing in for writing.
- **Reveal** — paints a form on in stroke order behind a brushed mask, so things
  arrive as marks rather than fading up.

## The specific tells, and the fixes

### Outlines read as stitching round a patch
The worst single tell. A contour drawn with four spread bristles and dry gaps
gives each bristle its own gap phase, so the outline lands as four parallel
dashed tracks — literally stitching round a sticker. Replaced with a dedicated
contour: a wide faint bleed either side, one continuous core whose weight rides
a slow wave, then short passages gone back over. This is the change that did the
most work in all three films.

### Solid forms came out as chains of translucent beads
The brush stroked every segment separately at partial alpha with round caps, so
overlaps stacked and the caps scalloped the edge. An umbrella cane looked like a
caterpillar. Added a ribbon mode that collects a bristle into one filled band of
varying width and lays it down once. Scumble and wash still want the stacking,
so they kept the old path.

### Long strokes were banded into even segments
Pressure wobble was keyed to sample index, so its period was set by the sampling
density. On a long stroke that reads as bamboo. Now keyed to travelled distance.

### Wide soft passes tiled into rows of lozenges
Six bristles at wide spread, each tapered at both ends, become six separate
lozenges per stroke — and ninety of them tile a whole ground into what looks
like machine hatching. Worse, it prints through anything translucent laid on
top: the cloud in film 03 was covered in little grey blocks that had nothing to
do with the cloud. Fixed by widening each bristle so they merge into one mass.

### Dry-brush gaps were a dash pattern
`dry` was a per-sample coin flip, which at a fixed sampling step is a regular
dash. The bottle in film 01 had a barcode down it. Reworked as run-lengths in
real distance.

### Pale lead-line round every object
Every form in film 01 had a bright cream outline. Uniform treatment applied to
everything is the sticker-pack look even when each piece is well painted. Now
they get charcoal contours and the gold relief is held back for the tomato
alone, which is how she concentrates it.

### Radiating rays, leader lines, tally bars
- Film 01's constellation was drawn with gold lines joining item to item. That is
  a wiring diagram. Replaced with struck star marks and spatter in the ground
  between the objects: the constellation is made by the arrangement.
- The heat round the biscuit was sixteen evenly-spaced rays — clip-art sunburst.
  Replaced with scumble bloomed into the ground behind the form, as in the dog
  reference.
- Film 02's rain count was a row of tally bars reading as a bar chart. Now a
  small irregular hand-struck cluster in a corner.
- Film 03's rain converged on the cup, which turned the square into a ray
  diagram. Rain now falls; only the column over the cup falls harder.

### The "denim / slate" second pole was the diagram the brief forbade
Film 02's second mode was denim panels with dashed stitching and stark white
outlines. Cut entirely. The second pole is now the same street at night —
the same objects repainted under a sodium lamp, wet reflections, one warm
source in the navy. Same idea, still paint. Film 03 does the same thing with a
weather front coming through the kitchen rather than a forecast chart.

### Transitions looked like a sheet of plastic sliding over the picture
A paint-on wipe revealed in stroke order has a straight advancing edge, which
sliced the umbrellas in half like a blind coming down. All three transitions now
advance in bands of short overlapping scrub passes, strokes ordered so the front
never gaps but stays torn.

### Things floated
Forms with no contact shadow hover, which is the sticker complaint in another
form. Added pools of shade and ripples where objects meet ground.

### Assorted
Rain as opaque white slashes (film scratches) → thin grey-blue veils with a few
lit streaks. Puddle rings as perfect ellipses → broken arcs. Puddle surface as
evenly-stacked lines (mosaic tiling) → individual short glints. Collision spray
as straight rays → thrown arcs with a bead at the head. Umbrella canopies as
flat blobs with ruled rib seams → impasto panels with ribs implied by shadow
wedges. Hard ruled horizon → scumbled haze. Reflections as hard-clipped decals
→ feathered accumulation, and on the kettle, laid in with soft-light so it reads
as light on curved tin instead of bleaching a hole through the form.

## Still soft — honest list

**Film 03 is the least finished.** It was built last and got roughly a quarter
of the review passes the other two did. Specifically:

- The spout still reads a little like a fin rather than a spout. The silhouette
  is right in outline but the interior modelling does not turn the cone.
- The kettle body's knife work is too uniformly vertical. It has mass but not
  much variety in how the light crosses it.
- The cloud silhouette is better than the thought-balloon it started as, but the
  lobes are still legibly lobes in places.
- Its rain still reads as somewhat mechanical — the individual marks are
  randomly placed but they are all the same kind of mark.

Two defects found in film 03 on video review and since fixed: the second line of
the title fell off the bottom edge of the square, and the loop hard-cut back to
an empty bench because every element held to the last frame and then vanished.
The weather now clears the way it arrived, by scrubbing the bare kitchen back
over the top, so the last frame is the first frame (seam measured at max 16 /
mean 0.001 per channel).

**Across all three:**

- The dual-mode crossing is the weakest beat everywhere. It is honest paint on
  both sides now, but the crossing itself is a device and it shows.
- Grounds are worked but still quieter than the references. Hers carry more
  tonal range and more collage than these do.
- The awkwardness is deliberate but it is engineered awkwardness. It comes out
  of seeded randomness, which is not the same thing as a decision made badly on
  purpose, and in places you can feel the difference.
- Playback has a bake cost on first frame (roughly 150–350ms) before it settles.
  Steady-state is fine; the first frame after load may hitch once.

**What I would do next**, in order: rebuild the film 03 spout and body modelling
properly; give all three grounds another two registers of tone and more torn
paper; then look hard at whether the second pole earns itself in each film or
whether one of them would be better as a single sustained image.
