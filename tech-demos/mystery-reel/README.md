# Mystery Reel — Why some city grids look like fingerprints

A self-contained canvas film. Open `index.html` in a browser — no build, no
npm, no CDN, no webfonts. Tap the picture or press space to play and pause.

Inspired by Ethan Mollick’s bookmark:
[https://x.com/emollick/status/2100767116819325141](https://x.com/emollick/status/2100767116819325141)
(“pick a mystery that obsesses you, attempt a solve, make a shareable explainer movie”).

## The mystery

**Why do some city grids look like fingerprints from above?**

Not Voynich. Not a subway-map lecture. One visual question: ring-grown towns
(walls, canals, market edges) photograph as whorls; ruler-planned towns do not.

**Best guess** (stated on the end card): rings of walking, water, and walls —
not a plan. Each ridge is a boundary that hardened into a street.

Numbers on the scatter and bar beats are **invented demo values**, stamped
`EXAMPLE DATA` on screen. They stand in for public street-orientation work
(entropy / compass roses), not a real city study.

## How to open locally

Double-click `tech-demos/mystery-reel/index.html`, or serve the folder:

```
# from the repo root
python3 -m http.server 8765
# then open http://127.0.0.1:8765/tech-demos/mystery-reel/
```

1080×1080, phone-first. Optional: `?t=12` holds that second (paused). `?t=12&play=1`
starts from there.

## Form

- One file, Canvas 2D, system mono. Sibling folders in this repo are untouched.
- Dual mode: warm paper / ink vs cold navy plate. Hard cuts, no fades.
- ~64 seconds. Scene list is in the comment block at the top of `index.html`.
- Three live data-viz beats: a path trace, a scatter, paired orientation bars.
- End card: mystery name, one-line guess, `Tech demo · ascii-canvas`.

## Out of scope

No video export, no audio, no Gill Brophy paint pass, no deploy to Pages, no
merge to main. No accounts, no spend, no posting, no personal data.
