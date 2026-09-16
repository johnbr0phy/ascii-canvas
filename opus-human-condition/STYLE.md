# STYLE.md — the painting language of Gill Brophy

Written before any film code, as Phase 0 requires. This is a style guide derived from Gill's
work only. Nothing here comes from John's yard/orbital repos.

## Evidence base

Two sources, both checked directly:

1. **The ten attached reference stills.** All ten were matched to their entries in the live
   gallery so they could be cited by title. Identifications:

   | ref file | work | collection |
   |---|---|---|
   | `01-crowd.jpg` | *A Small Crowd Had Gathered (Detail)* | People & Characters |
   | `02-bruvers.jpg` | *Me & My Bruvers* | People & Characters |
   | `03-talking-heads.jpg` | *Talking Heads — Talking to Myself* | People & Characters |
   | `04-in-the-pink.jpg` | *Flora — In the Pink* | Flowers & Gardens |
   | `05-transparencies.jpg` | *Flora — Transparencies* | Tulips & Buds |
   | `06-flowers.jpg` | untitled drooping-tulip work (`works.json` "Artwork 15") | Tulips & Buds |
   | `07-fields.jpg` | untitled woodland (`works.json` "Artwork 03") | Fields & Woodlands |
   | `08-mirror.jpg` | *Mirror, Mirror* | Colour, Line & Shape |
   | `09-moonset.jpg` | *Moonset* | Sea & Shore |
   | `10-animals.jpg` | untitled shaggy dog, "Biscuit? Did I hear Biscuit?" ("Artwork 01") | Animals & Birds |

2. **`works.json` from `johnbr0phy/gill-brophy-website`** — 105 published works. Collection
   counts, which turn out to be the clearest statement of what she actually paints:

   | works | collection |
   |---|---|
   | 28 | Flowers & Gardens |
   | 15 | Animals & Birds |
   | 15 | Tulips & Buds |
   | 14 | Pots, Bottles & Still Life |
   | 11 | Colour, Line & Shape |
   | 8 | Fields & Woodlands |
   | 6 | People & Characters |
   | 4 | Sea & Shore |
   | 4 | Inspired by Elda |

Every hex below was **sampled from the actual painting files** (7-cluster k-means over each
work, plus a most-saturated-pixel read for accents), not eyeballed. The percentage after each
colour is the share of that canvas the cluster occupies — it tells us not just which colours
are hers but *how much room she gives them*.

---

## 1. Palette

Twelve working colours. Warm ground, warm accents, cool relief — in that order of area.

| # | hex | name | cited from | share |
|---|---|---|---|---|
| 1 | `#F9EFD4` | cream ground | *Talking Heads — Talking to Myself* | 28% of canvas |
| 2 | `#E2D8DB` | warm grey ground | *Flora — In the Pink* | 28% |
| 3 | `#F4BB8E` | peach body / flesh | *A Small Crowd Had Gathered* | 28% |
| 4 | `#EF4404` | vermilion | *A Small Crowd Had Gathered* (ground) | 17% |
| 5 | `#E45728` | orange tulip | *Flora — The Orange Tulips* | 29% |
| 6 | `#F4B819` | gold | *Fields of Gold* | 10% |
| 7 | `#DFA3B9` | petal pink | *Flora — In the Pink* | 13% |
| 8 | `#C8688E` | magenta heart | *Flora — In the Pink* (petal centres) | 8% |
| 9 | `#11AFCB` | turquoise | *Flora — The Ribbon* (ground) | 20% |
| 10 | `#4B96BA` | denim blue | *Me & My Bruvers* (swim shorts) | 12% |
| 11 | `#0A517C` | night blue | *Moonset* (sky) | 30% |
| 12 | `#38633D` | leaf green | *Contemplation* | 17% |

Plus **two structural darks**, which behave as line and shadow rather than as colour:

- `#1D1818` ink — the grid and contour black in *Talking Heads* (15%) and *Flora —
  Transparencies* (`#2F2C2C`, 14%).
- `#6D4513` burnt ochre — the collaged panel and lower block in *Talking Heads* (16%); the
  same register as the `#876A25` in the untitled woodland and `#8E654A` in the drooping tulips.

Secondary accents that show up when a work needs a jolt, all sampled: `#F1895C` (the *Moonset*
sun disc, only 2% of that canvas — she uses her hottest colour in her smallest quantity),
`#17826B` and `#08BECD` teal (*Jacob's Pots*), `#ED0B04` hard red (*Family Tree* ground),
`#F2B50A` with `#4DE7E0` (*Low Tide*), `#6F967F` / `#307375` (*Path to the River*).

**What the numbers say, and it matters:** her grounds are enormous and warm-neutral, her
saturated colour arrives in 8–20% patches, and the single hottest note on any canvas is
usually the smallest shape on it. Colour reads loud in her work because it is *surrounded*,
not because there is a lot of it.

## 2. Surface — how the paint actually sits

- **Impasto built from separate, directional strokes.** *I will always love you* and the
  "Biscuit?" dog are made of discrete combed ridges of loaded white/cream — you can count the
  strokes, and each one carries the form's direction. Fur, not texture.
- **Dragged knife-work where under-colour shows through.** The untitled woodland
  (`07-fields.jpg`) is near-vertical scraped strokes; gold `#CA9123` is pulled over dark
  `#2C2D32` so both survive in the same stroke. Never a clean blend.
- **Thin scumbled wash for grounds.** *Flora — In the Pink* is a grey wash rubbed back to
  cloud, and the drooping-tulip work carries a white lace-like stipple dragged over peach.
  Grounds are *mixed and uneven*, never flat fill.
- **Two different edge treatments, used deliberately.** Either a continuous loaded **ink
  contour** of visibly varying width (*Ten Red Buds*, *Loop the Loop*, the tulips in
  `06-flowers.jpg`) — or a **soft smudged charcoal halo** with no line at all (*Flora — In the
  Pink*, where the petals are held by a dark bloom pushed outward). She rarely mixes both on
  one form.
- **Scratching back / sgraffito.** The dark circle in *Talking Heads* is raked with fine light
  scratches; *Mirror, Mirror* has scraped curves and dark flecks through the orange.
- **Collage-like layers with print showing through.** *Talking Heads* has a panel with
  printed lettering ("…M / …NG") surviving under paint; *Flora — The Ribbon* has newsprint
  blocks under the turquoise.
- **Drips.** *Moonset* runs vertical streaks down the town blocks — gravity left in.
- **Flat blocked pattern next to all that texture.** *Me & My Bruvers* bodies are flat
  rectangles of blue cut by one hard dark band, and the legs are repeated rounded columns.
  The flatness is what makes the textured passages read.
- **Speckle.** Dark flecks scattered over pale bodies in *A Small Crowd*, over the orange in
  *Mirror, Mirror*, green dots in *Growth*.
- **Handwriting in pencil, into the paint.** "Biscuit? Did I hear Biscuit?", "Walkies,
  anyone?", "'Bath'? Did I hear 'bath'?" — small, unglamorous, part of the surface. The
  signature is the same: little, low corner, in the paint (*Moonset*, *Talking Heads*).

## 3. Subjects & symbols — what recurs

- **People as slabs.** Figures are tapered vertical columns with a round head set on top,
  no feet, no hands to speak of. *A Small Crowd Had Gathered*, *Family Tree*, *Majesty*.
  They stand **shoulder to shoulder, touching**. Crowds are about contact, not anonymity.
- **Faces reduced to almost nothing.** Dot eyes, one line for the mouth, a blushed cheek.
  *Me & My Bruvers* gets three whole people out of that alone. No modelling, no likeness.
- **Kin, stated by scale.** Adults tall, children half-height, packed into the same frame —
  that is how *A Small Crowd* tells you it's families and not a queue.
- **Tulips above all.** 15 works. Two states she keeps returning to: the **upright bud**
  (*Ten Red Buds*, *The Bud*) and the **drooping open head** (`06-flowers.jpg`, *Flora — The
  Ribbon*). Also broad five-petal frangipani-type flowers with a white star centre and
  magenta radiating out (*Flora — In the Pink*).
- **Vessels.** 14 works. Bottles and pots, often as **overlapping transparent contours**
  where you see through one vessel into the next (*Flora — Transparencies*, *Bottles*,
  *Jacob's Pots*).
- **Animals, face-on and cropped close.** Cats and shaggy dogs, filling the frame, frequently
  captioned in pencil. Worth knowing: ***Willum* is a cat**, asleep in a hollow ringed with
  daisies and blue spires — not a dog.
- **Fields and woodland.** Forests as fields of vertical strokes; a gold horizon with small
  round trees on a hill (*Fields of Gold*); a path with one tiny walking figure in a huge
  meadow (*Path to the River*).
- **Sea and shore.** A big disc low over a dark horizon (*Moonset*), tidal flats (*Low Tide*,
  *High Tide*).
- **Abstract line and shape.** A black rectilinear grid with a circle sitting in it
  (*Talking Heads*, *Views Through I–III*, *The Net*) — window bars, and a head behind them.

## 4. Composition

- **Square is the default.** 77 of 105 works are exactly 1:1. Another 14 are near-square.
  This is not a crop preference, it is how she composes.
- **The subject fills the frame and gets cut by the edge.** Crowd figures run off left and
  right, the dog's head bleeds off the bottom, the *Mirror, Mirror* curves exit all four
  sides. Very little breathing room, almost never a vignette.
- **Horizon high or low, not centre.** *Moonset* sits the horizon about a third down with the
  disc above it; *Fields of Gold* puts it a quarter down and gives three-quarters to ground.
- **Repeated units with irregular spacing.** Rows of tulips, rows of legs, rows of figures.
  The rhythm is hand-spaced — near-regular, never gridded.
- **Centred single subject when it's a portrait** (dog, cat, single flower head); **offset
  and overlapping** when it's a group or a still life.
- **Signature small, lower corner, inside the paint.**

## 5. Hard rules for Phase 1

1. **Square 1080, and the ground is laid first — always.** A scumbled, uneven cream
   (`#F9EFD4`) or warm grey (`#E2D8DB`), mixed from many strokes. Never a flat fill, never a
   navy plate, never pure black or pure white.
2. **Colour only from the twelve, plus the two darks.** No cyan/magenta neon pairing, no
   glowing-blue-on-black. Saturated colour gets 8–20% of the frame and the hottest note gets
   the smallest shape, per the sampled shares above.
3. **Edges are loaded ink contours of varying width, or soft charcoal haloes — one or the
   other per form.** No uniform 1px vector strokes anywhere.
4. **All texture is painted, every frame: short directional strokes, speckle, scratch-back,
   drips.** No global filters, no alpha-noise rectangle laid over the top, no photographic
   grain.
5. **Subjects come only from her vocabulary:** slab figures with round heads, dot-and-line
   faces, upright buds and drooping tulip heads, five-petal flowers, overlapping vessel
   contours, face-on cats and dogs, vertical tree strokes, gold horizons, the disc, the black
   grid with a circle in it.
6. **Motion runs at paint speed.** Marks get laid down and they stay. Nothing spins, orbits,
   or ticks. Explicitly killed: navy plate, ISO title blocks, chain centre lines, 12fps
   drafting boil. That was the last film; this one is hers.
7. **Faces never get more than dot eyes, a line mouth, and a blushed cheek.** No rendering,
   no likeness, no expression beyond those three marks.
8. **The only lettering is `opus 5`** — lowercase, pencil-grey, small, bottom-right, rubbed
   into the ground the way she pencils "Walkies, anyone?" into a dog. Not a HUD, no chrome, no
   titles, no play button.
