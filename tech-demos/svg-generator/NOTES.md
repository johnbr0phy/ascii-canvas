# Interactive SVG generator

A self-contained infinite tessellation. Open `index.html` in a browser — no
build, no npm, no libraries. Seals are SVG paths computed from a seed. The
rest of the tiles are ordinary page chrome (buttons, sliders, dropdowns,
toggles, tabs, and so on) packed edge-to-edge.

Inspired by live SVG toys in the spirit of [Threeaio’s generator](https://x.com/Threeaio/status/2094290133231063479).

## How to regenerate

1. Open `tech-demos/svg-generator/index.html` (double-click, or any static server).
2. The first viewport is already full. The world seed is the eight hex digits
   at the bottom right.
3. Same seed → same tessellation. Reload `index.html?s=<eight hex digits>` to
   rebuild that field. Each cell is `hash(world, column, row)`, so scrolling
   back to a cell redraws the same widget or seal.
4. Scroll up or down for more tiles. Rows are created as you approach the
   edge; there is no last page.

## What Space does

**Space** mints a new 32-bit world seed and rebuilds every visible tile from
that seed. Scroll position is kept, so the same grid cells get new contents.

Space is ignored while a field, dropdown, or button has focus, so typing a
space in a search box does not remint the world.

Widgets work: sliders slide, dropdowns open, toggles flip, tabs switch,
steppers count. Seal tiles still spin.

## Out of scope

No accounts, no spend, no posting, no Three.js, no image assets, no webfonts
used as art. Other folders in this repo are untouched.
