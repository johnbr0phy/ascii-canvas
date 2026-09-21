# Shorebreak

A phone-first shorebreak you can watch and nudge. A wave arcs, pitches over, crashes, and washes up the sand. Open `index.html` — no build, no npm, no network, no accounts.

Inspired by [@cryptomanavan](https://x.com/cryptomanavan/status/2101368830341587061) (“REAL WAVES”: arc, then crash, then swash). This page is an original kinematic breaker, not a port of that engine.

## WebGPU and fallback

The picture is the same wave state either way.

- **WebGPU** when `navigator.gpu` can create an adapter, a device, and a canvas context. Shaders are inline. Foam is drawn as soft sprites; the face gets a moving shimmer; sand gets a grain.
- **WebGL** if WebGPU is missing or fails. That is the path on iPhone Safari without WebGPU.
- **Canvas 2D** if WebGL is missing too.

The label at the right of the buttons shows which one is running. The first frame is drawn immediately, so there is no loading screen. Nothing is fetched.

## How to open locally

Double-click `tech-demos/shorebreak/index.html`, or from the repo root:

```
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/tech-demos/shorebreak/`.

Drag the picture to move the camera. **Timing** scrubs the break. **Calm — storm** roughens the set. **New set** reshuffles height, peel direction, and palette. Arrows move the camera. Space plays and pauses.

The loop is already in the first frame: a pitching face, whitewater, and foam on the sand. It keeps running. The same picture comes back every cycle (about nine seconds).

Optional query string:

- `?set=4` reopens that set. The default set is `4` (Dawn glass).
- `?storm=80` starts rougher.
- `?t=1.2` seeks that many seconds into the cycle.
- `?pause=1` starts paused.

If the browser asks for less motion, the page starts paused on the curling frame. Press **Play** or move **Timing**.

## Checks

```
node tech-demos/shorebreak/check.mjs
```

That checks the hero frame (a lip with hang, swash on the sand), a crash inside the first few seconds, and that a sweep of the cycle stays finite.

## Out of scope

No GitHub Pages, no live URL, no merge, no accounts, no spend. The page stays in the repo until someone opens the file.
