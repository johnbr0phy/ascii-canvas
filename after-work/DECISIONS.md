# DECISIONS.md

Assumptions and choices I made while working alone, in roughly the order I made them.

## 0. Tools: what I actually had, and what that changed

- **I took stock first.** This container has no image model, video model, music model or voice model. There are no fal, ElevenLabs or other generation keys in the environment. When I started searching the filesystem for keys, the user stopped me and restated the brief as "whatever tools you have." So I didn't hunt for keys.
- **What I do have:** Node 22, Python 3, headless Chromium (Playwright), and an ffmpeg build I installed from npm (`ffmpeg-static`, with x264 and AAC). There's outbound network for fonts and research, and a web-search subagent.
- **Consequence 1: the "scaffolding" is a rig, not generated footage.** The brief uses video generation as scaffolding for camera moves, plausible motion and spatial layout, and then asks for hand-drawn reconstruction over it. With no video model, I built that scaffolding myself: a light-3D telescope model, a jointed character rig with per-age parameters, perspective-built sets, and a camera per shot. The drawing layer (wobbly ink, cel shading, watercolour, paper, 12 fps holds) sits on top exactly as the brief describes. The upshot is that **the viewer never sees any machine-rendered footage**, because none exists. Every frame is drawn by code I wrote, one line at a time.
- **Consequence 2: consistency comes by construction.** "Generate her ten times and get the same woman ten times" is guaranteed: Nell is one parametric model. Her age is a parameter, and her expression and pose are parameters. The ten-times sheet (`sheets/nell_ten_times.png`) proves it, with only the line boil differing between draws. The work shifted from fighting model drift to making the one model good. That's where I spent the iteration (see LOG.md).
- **Consequence 3: all sound is synthesised in JavaScript.** The score and every effect are built with the Web Audio API in an OfflineAudioContext, from oscillators, noise, filters, Karplus-Strong plucks and convolution. It's timed against the same shot table the renderer uses. No samples, no libraries.
- **Fonts:** open-licensed (OFL) handwriting faces from Google Fonts: Kalam (layoff letter, cards), Reenie Beanie (Dad's pencil note), Caveat and Caveat Brush (title, year marks), Patrick Hand (credits). Each glyph gets its own seeded jitter, so no two letters sit identically.

## 1. Story

- **The telescope's meaning (committed):** Nell's father Arthur sorted mail on nights for thirty-one years. He worked a year of overtime to buy her a second-hand brass telescope and promised to show her Saturn "the first clear night I'm off". It never happened. She grew up to do nearly the same job. The film reveals this across five moments, not up front (see STORY.md).
- **Why that meaning:** it makes the film's central idea personal without anyone saying it. Two generations traded their nights for wages. The third gets the nights back. The promise gets kept thirty years late, and then kept again for her own kid.
- **The kid:** a son, Sam: 9 in 2027, 29 in 2047. **The ending has both** the grown child and a granddaughter (7) at the telescope. Nell watches the launch with her own eyes while the girl has the telescope. Three generations on one step.
- **Ages:** Nell is 49 in 2027 and 69 in 2047. That's "in her forties" at the start and about seventy at the end, which matches the three sheet ages (forties, fifties, seventies).
- **Years on screen:** 2027, 2028, 2029, 2031, 2047. The film is near-future on purpose, so a viewer in 2026 recognises every object on screen.
- **Setting:** an unnamed small English town (terraces, a corner shop, a community hall, a sorting office). "Somewhere ordinary" read to me as Britain: "mum", "neighbours", a hall with a tea urn. Nothing depends on it.
- **The machines:** pale, rounded sorting arms, each with a small amber lamp. No faces, no eyes, no chrome. One pauses to let her pass. They get a match cut against her own hands doing the identical motion, which respects her skill instead of mocking it.
- **How "the world adjusted" is shown:** a noticeboard of neighbours' hand-lettered offers (bike repairs, childminding swaps, lifts to the hospital, learning together on Thursdays). Then a second letter at the same kitchen table, framed identically to the layoff letter, which says a payment goes to every household every month. One line of plain English, no policy, and her shoulders drop. I judged that an audience of mums, nurses and drivers needs one concrete sign of how the family eats, or the hope reads as a sales pitch.
- **The AI:** only ever a small warm light on the kitchen table, like a smooth pebble lamp, and a book whose pages fill with drawings as she learns. It never speaks, never has a face or a screen, and never appears anywhere except where she is learning. It's a teacher, not a replacement.
- **The one line at the end:** "For everyone who ever worked nights." It's a dedication, not a slogan. It speaks to the nurse and the driver directly, and it closes the loop on her father.
- **No dialogue:** the only human sounds are humming (Nell, and her father in the memory), Sam's laugh, and crowd murmur.

## 2. Look

- **House style ("night-shift picture book"):** characters get thick, warm, slightly wobbly ink outlines, flat cel fills, and one hard cel shadow. Backgrounds are unlined watercolour/gouache with pigment pooling at wash edges and granulation. Everything sits on one paper texture. That split, lined cels over painted unlined backgrounds, is the classic hand-drawn TV animation grammar, but the specific shapes and faces are mine.
- **Frame rate:** drawings update 12 times a second (on twos). The ink boils (re-wobbles) once per drawing. Output is 24 fps with each drawing held for two frames.
- **The colour arc** is built as *lights* that every base colour passes through, so one character model sits correctly under sodium, snow-light, gold, sepia or starlight (see `src/palette.js`):
  - 2027 warehouse: sodium orange with tired grey-green
  - The letter: grey-green daylight, desaturated
  - 2028 winter: cold blues, with small warm windows as the only relief
  - 2029 turn: thaw grey into morning gold
  - Memory: sepia, low saturation
  - Saturn night: deep blue
  - 2031 to 2040: morning gold
  - 2047: deep indigo and starlight
- **Camera height as emotion:** knee height and cramped in the warehouse, eye level at the kitchen table, a child's height in the doorway. Then the camera tilts up more and more, and the last shots are almost all sky.
- **Stillness:** most shots are locked off, with one thing moving (the kettle steam, a single twinkling star, the launch line).
- **Nell's identifiers:** a low bun, a side parting on her right, a small mole under her left eye, a rust jumper or cardigan, and a loose strand at the temple. Her grey arrives at the temple first (a streak in her fifties), then all through.
- **The telescope canon:** brass tube with a wide dew shield, two bands, a small finder on top, a wooden tripod with a leather strap wrapped three times round one leg, and a triangular tray. **The dent sits on top of the tube just behind the front band** and notches the silhouette, so it reads even in silhouette. Every appearance comes from one function, so it's on the same side in every shot by construction. The eyepiece is cracked until she fixes it. The dent is never fixed.
