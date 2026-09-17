# Interactive SVG generator

A self-contained generative emblem. Open `index.html` in a browser — no build,
no npm, no libraries. Every mark is an SVG path or shape computed in this file.

Inspired by live SVG toys in the spirit of [Threeaio’s generator](https://x.com/Threeaio/status/2094290133231063479).

## How to regenerate

1. Open `tech-demos/svg-generator/index.html` (double-click, or any static server).
2. A composition starts on its own. The seed is the quiet label at the bottom right.
3. Same seed → same piece. Reload `index.html?s=<eight hex digits>` to redraw
   that composition. The query is updated as you generate; the back button steps
   through seeds you have already minted.
4. Rotation is live and is **not** part of the seed. Two visits with the same
   `?s=` match mark-for-mark; they may sit at a different angle.

## What Space does

**Space** (and a tap / short click) mints a new 32-bit seed, rebuilds every SVG
node from that seed, and leaves the current spin alone so the new piece inherits
the motion.

A drag is not Space: dragging the piece, or the faint slider on the right,
sets rotation. A flick leaves it spinning. `prefers-reduced-motion` kills the
idle spin; drag still works.

## Out of scope

No accounts, no spend, no posting, no Three.js, no image assets, no webfonts
used as art. Other folders in this repo are untouched.
