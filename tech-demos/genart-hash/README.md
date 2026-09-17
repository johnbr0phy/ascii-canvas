# Sounding Plate

A single-page generative sketch. Open `index.html` in a browser — no build, no
npm, no CDN. Each plate is a hydrographic survey ledger: isolines, stations,
buoys, and a title block. The grammar is hand-drawn technical / blueprint.
The subject is original (not a copy of Camille Roux’s *Impossible Machine*).

Craft rules come from [camilleroux/genart-skill](https://github.com/camilleroux/genart-skill):
hash → seed → PRNG, named streams, traits decided before any pixels, drawing in
a 0..1 space so 400px and 2000px are the same composition.

## How the hash works

The piece reads a 32-byte hex hash (`0x` plus 64 hex digits). You can paste
that into the **Hash** field, or put it in the URL:

```
index.html?hash=0x7e4b2a91c0d83f15b6a904e27c1d58af33e0b7c94a12d6e80f5c3b1a7982e460
```

Shorter hex is padded. Any other text is mixed into a 32-byte digest, so a
word still gives a stable plate. Same hash, same machine, same browser → the
same plate, including a second press of **Redraw**.

All variation comes from a seeded `sfc32` generator. The renderer throws if
`Math.random()` or `crypto.getRandomValues()` runs during a draw. **New hash**
and **Reshuffle sheet** are the only places that mint fresh entropy, and they
do it *before* the renderer starts.

## Traits

Traits are a pure function of the hash. They are named first, then drawn.
Weights are the intended rarity over a large edition:

| Trait | Values (weight) |
| --- | --- |
| Palette | Cyanotype 34, Vellum 28, Chartroom 18, Night Watch 14, Oxide 6 |
| Density | Sparse 28, Charted 48, Crowded 24 |
| Structure | Open Reach 32, Channel 30, Basin 28, Archipelago 10 |
| Annotation | Quiet 30, Noted 50, Ledgered 20 |
| North | True 55, Magnetic 35, Drifted 10 |
| Hatch | None 22, Shoal 48, Contour Fill 30 |

A given hash always reports the same row. The contact sheet (default 9 seeds,
derived from the current hash) is how you see the edition, not one lucky
render. Tap a tile to load that seed.

## Export

**Export PNG** re-renders the current hash at 2048×2048 and downloads it. It
does not upscale the preview. Composition is resolution-independent: stroke
weights, type, and hatch gaps are fractions of the short side.

## Checks

```
node tech-demos/genart-hash/check.mjs
```

That proves feature stability and that the sketch source does not call
`Math.random`. Same-machine pixel identity is what **Redraw** is for.

## Out of scope

No accounts, no spend, no posting, no personal data. Sibling folders in this
repo are untouched.
