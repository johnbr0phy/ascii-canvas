# CODEX Adversarial Review — Gill Remakes

Scope locked to `gill-tests/`.
Compared:
- `FAIL-01/02/03` (rejected v1)
- remake candidates from `uploads/01-...`, `02-...`, `03-...`
- Gill reference paintings supplied in prompt

Rendered stills (headless Chrome) at multiple timestamps (`t=0.5, 3, 6.5, 10` plus extra transition checks) before deciding pass/fail.

## Verdict (fail-closed)

| Film | Mass | Texture | Outline personality | Humour | Ground quality | Dual-mode honesty | Verdict |
|---|---:|---:|---:|---:|---:|---:|---|
| 01-shopping-constellation | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | **PASS** |
| 02-umbrella-argument | 8/10 | 8/10 | 8/10 | 7/10 | 8/10 | 8/10 | **PASS** |
| 03-kettle-weather | 7/10 | 8/10 | 8/10 | 7/10 | 8/10 | 7/10 | **PASS (weakest of three)** |

### Blunt call per film

## 01 — Shopping Constellation: PASS
Not a sticker-pack doodle anymore. Objects have mass, outlines wobble like hand-drawn charcoal, and the dark phase reads as painted surface, not diagram wiring. Humour lands in-image (crossed-off list item becomes the hot star object), and the warm/cool tension sits in Gill territory.

## 02 — Umbrella Argument: PASS
v1 was dead-flat iconography; this rebuild has body, puddle contact, and layered rain atmosphere. The dark pole is still paint-language (wet night street), not a UI chart. It keeps affectionate awkwardness without collapsing into clip-art.

## 03 — Kettle Weather: PASS (weakest)
Still the softest of the three, but no longer a geometric doodle. Kettle/cup hold up as painted forms with texture and ground integration; cloud/rain read as weather mass rather than infographic arrows. Dual-mode transition is honest enough to ship, though this is the first file to revisit if someone wants one more polish pass.

## What changed

`gill-tests` previously contained v1 fail files.

Replaced in place with validated remake candidates:
- `gill-tests/01-shopping-constellation.html`
- `gill-tests/02-umbrella-argument.html`
- `gill-tests/03-kettle-weather.html`

No other folder touched.

