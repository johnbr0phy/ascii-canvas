# LOG.md: what worked, what didn't

This is a working log of the build and of the verification loops. After every batch I rendered stills, put them on contact sheets (`tools/contact.py`, `tools/review.py`), looked at them, and fixed what was wrong.

## Tooling
- **Worked:** a drawing is a pure function of time. `renderAt(t)` means any frame can be re-rendered alone (`node tools/snap.js S26@3.7`). Four headless Chromium pages render the whole film in about 100 s, at about 40 ms per drawing.
- **Worked:** one shot table (`src/shots.js`) drives the renderer, the score and SHOTLIST.md. Retiming a shot retimes the music.
- **Didn't:** the Playwright-bundled ffmpeg has no x264 or AAC. I switched to `ffmpeg-static` from npm.

## Characters
- **v1 heads were too small** (7 heads tall). They read as paper dolls, so I went to about 6 heads. Picture-book proportions want a bigger head.
- **v1 profile jaw was enormous** and the three-quarter nose read as a slash across the cheek. I rebuilt both from a per-view feature table.
- **Mirrored eyes bug:** every eye was drawn with its outer corner at +x, so the near eye in three-quarter view (and the left eye in front view) had its outer corner pointing at the nose. Older Nell's crow's feet then crossed her nose like hatching. Fixed with a per-eye mirror flag.
- **Cel shadow scaled with head size.** At close-up it became a brown "beard" crescent. Capped it.
- **The close-up bust had doubled shoulder width.** Scaled to about 2.3 head-widths.
- **Close-up hands v1** were five separate capsules and read like cartoon "stop" hands. v2 is one scalloped silhouette with finger creases and nails. It reads as a hand at every size.
- **Back view never drew the head** (an early return). The audience in the hall showed faceless fronts. Added real back-of-head hair shapes for everyone.
- **Posing blind fails.** "Head in hand" put her forearm across her face. The fix was staging she could actually do: both hands round a mug, and a table layer between her body and her forearms (`layer: 'body' | 'arms'`).
- **Eye-to-eyepiece alignment:** I stopped guessing. A dry-run renders the figure off-screen, reads back the head position, and then places the telescope so its eyepiece sits exactly at her eye (`telescopeEyeAt`). Sam's eye is aligned the same way, in x and y (he's on tiptoe).

## Sets and light
- **Warehouse v1 camera was below the belt.** The conveyor became a black overhang hiding Nell. Raised the camera to a cramped chest height.
- **Warehouse v1 wasn't orange enough.** It was grey-green dominant. Added sodium floor pools and a warmer haze.
- **Frost as radial glows read as four lamps.** Toned it down to a faint corner bloom.
- **Night scenes looked flat.** Added a global rim light to the cel renderer (a shape minus itself shifted away from the light). The profile in S34 now glows at the edge.
- **Pull-back v1:** the final space layer used connecting threads between the drifting lights. It looked like a network diagram, which is exactly the tech imagery the film avoids. Removed the threads. The lights are now loose, warm, drifting points, and a few far stars warm up as if someone arrived.
- **Hidden cache dependencies:** three shots reused backgrounds that were only painted when an earlier shot had already run. That's fine in a sequential render, but it's broken in isolation. Each is now a self-contained function.

## Text
- `letter()` overwrote `globalAlpha` instead of multiplying it, so the credits never faded out. Fixed.
- The father's note ran off the frame edge at full unfold. Moved.

## Consistency checks
- **The telescope's dent:** there is one model with the dent at u = 0.60 on the upper-left of the tube, so it's on the same side in every shot by construction. The turnaround sheet (`sheets/telescope_turnaround.png`) and the callout sheet show it.
- **Nell's face:** one model, with age as a parameter. `sheets/nell_ten_times.png` shows ten separate drawings of the same woman. `sheets/nell_aging.png` shows 2027 to 2047 in four-year steps.

## Sound
- **Retime for the tune.** The first audio render put the tune's final D 3.3 s into the dedication shot, at the tempo ceiling. I lengthened S33 and S35 by 2.5 s in total. The tempo solver now lands the D at S36 +1.0 s.
- **Checks by analysis (not listening):**
  - duration exact
  - -16 LUFS, no clipping
  - scanner beeps within 1 ms of the picture's scan moments in S04 and S10
  - the full tune occurs once, confirmed by pitch-pattern correlation
  - finale melody onsets within 40 ms of the bar grid
  - Sam's laugh as five falling-pitch bursts
