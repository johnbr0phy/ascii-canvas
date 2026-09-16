# ADVERSARIAL.md — motion v3

John's verdict on the previous remakes: the paint craft had come up, the
*animation* had not. Stills looked painted; the loop felt like a slideshow.
This pass was scored on motion first and paint second, and where the two
competed, motion won.

Written honestly, including what is still weak.

---

## What failed on **motion** in v2, and what was done about it

**1. Nothing had a cut time.** v2 was built out of eased phases: a form drifted
in, held, drifted out. Any two adjacent frames looked almost identical, so the
loop had no pulse — the definition of the painted-slideshow failure.

*Fixed:* every film is now built from a shot table (`T`) of explicit cut times,
and `motion.js` has a hard rule that **nothing in it fades**. `held(u, keys)`
returns the value in force and holds it until the next key. Fades survive only
in the two closing scrubs, where a rag actually is being dragged over a surface.

**2. The two poles were a colour grade, not two shots.** v2 crossfaded between a
warm and a cool version of the same picture. That is a filter, not a heartbeat.

*Fixed:* each film opens on a four-snap heartbeat inside the first second
(01 @0.45, 02 @0.40, 03 @0.36) with the subject at identical coordinates in both
poles, so the toggle reads as two shots of the same thing rather than one shot
changing temperature. In 01 the words sit at `LX` in both; in 02 the two feet
`RB`/`BB` are constants for the whole film; in 03 the kettle never leaves
`KX, KY`, including inside every close-up.

**3. There was no lens.** v2 had a soft vignette that brightened. The Fable
device is a *hole in one pole with the other pole inside it*, and it has to move.

*Fixed:* three different lenses, one per film, so they do not read as the same
trick three times — a pendulum hung from above the top edge on a drawn string
(01), a hole dragged across the square at head height (02), and an iris opened
at the mouth of the spout and grown until it swallows the frame (03). Each is
sooted on the inside and beaded in gold on the outside; each has a two-frame
**iris flash** earlier in the film so the device is planted before it is used.

**4. The close-ups were zooms.** v2 scaled the wide-shot sprites up. A zoom has
*less* surface than the shot it came from, which is exactly the tell that it is
not a close-up.

*Fixed:* every macro plate is painted natively at the size it is shown, with
knife count, stipple density and craze scale raised to match the area — the
close-up has more surface than the wide shot, not less. The word in 01 is
lettered at 176px with the paper fibre at its own scale; the biscuit is a fresh
388px form with crumb, docker holes that have a wall and a floor, and a bite
whose shade follows the bitten silhouette; 02 repaints both canopies at ~2.6×
so only one shoulder of each is in frame; 03 paints the spout mouth as a
chipped enamel tube with the bore dark behind it.

**5. Chaos read as an arrangement.** In v2 the scattered forms were placed, not
travelling. A still of a fast-moving form with hard edges looks posed.

*Fixed:* the chaos passes render **two earlier exposures** at 0.14 and 0.28
alpha behind the live one, so a form crossing the square smears. Add
`shake()` on the camera at amplitude 5–9 for the dense passages.

**6. There was no strike.** v2's densest second had maybe two events in it.

*Fixed:* each film now has 8–10 cuts inside about 1.3 seconds, and framing is
part of the cut: `T.strikeCuts` carries `[t, mode, z, x, y]`, so mode, scale and
position all change on the same frame. Eight cuts that share one framing read as
one shot flickering; eight cuts that reframe read as eight shots.

**7. Overlays were drawn but had nothing to say.** Fixed by making each overlay a
count or a measurement of the actual subject: seven groceries counted in tallies,
the *angle of each umbrella's lean* ticked off at its own foot, the pressure
round the bore of the spout, and one film's tally going from 6 to 7 in vermilion
because the seventh item was crossed off.

---

## What failed on **paint** during this pass, and what was done about it

- **Two-point strokes vanished.** `partial()` on a short overlay returns two
  points; with `raw: true` the taper is a sine wave that evaluates to zero at
  both ends, so tally marks and crosshairs drew nothing. Dropped `raw` from
  those calls so the brush resamples and the taper has somewhere to live.
- **Black bands at the frame edge.** An off-centre camera at zoom 1 walks the
  plate off its own edge. `applyCam` now derives the minimum zoom needed to keep
  the plate covering the frame, rotation included, and takes the max of that and
  the requested zoom.
- **The bite looked like a handle.** The bite contour was drawn all the way
  round, so the part outside the biscuit read as a loop stuck on the side. Now
  clipped to the body.
- **A grey crescent hanging in the bite.** The envelope halo was laid down before
  the bite was cut, so lifting the paint left the halo behind it. The shade now
  goes under the *bitten silhouette* — the body is painted into its own plate,
  the bite is cut, and the shadow is cast off the resulting alpha.
- **Meteors came out as hollow tubes.** Two thin ribbons plus a pale core is a
  wireframe, not a brushload. Widened, stacked the bristles tight (`spread: 0.2`)
  and put the light *inside* the mark.
- **The macro biscuit was grey.** Rebased off oatmeal onto a warmer gold family
  and thinned the contour from 30px to 17px, which had been reading as a rubber
  tyre round the edge.
- **The small umbrella appeared twice** during the closing beat of 02 — once at
  its original foot and once where it had moved to. Suppressed at the original.

---

## Adversarial questions, answered honestly

**Would Kevin's timing feel sharper than a painted slideshow?**
Yes for 01 and 03. 02 is close but its 3.30–3.68 contact passage is the best
1.3 seconds in the set — six mode snaps, water off the rim, shudder at 9, and
the gag landing on the last of them.

**Is there a real lens / match-cut / scale jump, or just colour changes?**
Real, and three different lenses so the device does not wear out. Match-cuts are
anchored on coordinates that are literally constants in the source, not on
eyeballed positions. Two scale jumps per film, both painted rather than zoomed.

**Does Mode B still feel like her hand, not a UI chart?**
Mostly. It is a worked dark in all three — ember sweeps and charcoal scrape in
01, navy graded down from her own hues with one warm lamp in 02, slate with the
flame still burning in 03 — and the overlays are struck with the same brush as
everything else, wonky and never ruled. The grid snaps are the closest any of
them comes to a chart, which is the point: they last half a second and then
break.

---

## Still weak

- **The chaos → grid → break arc is the same shape in all three films** (12 or 7
  items, 4-wide, hand-drawn box, crosshairs, tally). It is the most literal
  reading of the brief and the least invented thing in the set. A second pass
  should differentiate the three: one should snap to a grid that is *wrong*, or
  snap and then refuse to break.
- **Film 03's spout** is a small nub in the wide shot, so the macro on its mouth
  arrives without the wide shot having pointed at it. The arc thrown at 1.96
  papers over this rather than fixing it.
- **Frame time is ~15.5ms/frame in software-rendered headless Chrome** for 01,
  which is the heaviest of the three. Fine on a GPU, but there is no headroom for
  another live layer.
- **The closing scrubs are the one place a fade survives.** Defensible — a rag
  really is being dragged over a surface — but each film ends on its softest
  1.2 seconds, which is the opposite of how each of them starts.
- **Films 02 and 03 were shipped on a smoke test**, not the full contact-sheet
  review 01 got. Their beats are verified to render; their frames have not been
  argued with one at a time.
