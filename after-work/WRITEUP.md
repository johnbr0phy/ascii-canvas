# After Work: a short film, and how it was made

**Running time:** 3:54. No dialogue. Hand-drawn 2D, 12 drawings a second.
**Files:** `out/after_work_1080p.mp4` (1920×1080, 24 fps, AAC stereo) and `out/after_work_square_1080.mp4` (1080×1080 crop for X).

## What I made

A woman who sorts parcels on nights loses her job to machines. She gets through a hard winter with her neighbours. Then, with time on her hands for the first time in her adult life, she opens the hall cupboard and takes out the broken brass telescope her father bought her. She learns enough optics to fix it. She sees Saturn, and shows it to her son. Twenty years later she sits on the same back step while her son and granddaughter use the telescope. A launch climbs the horizon, and she watches it with her own eyes.

The telescope carries the film's real argument, and it does so without anyone saying it. Her father sorted mail on nights for thirty-one years. He worked a year of overtime to buy the telescope and promised to show her Saturn "the first clear night I'm off." His nights off never lined up with clear skies. She grew up and did almost exactly his job. The film reveals this slowly: first the object in the dark, then four notes she hums at work without knowing why, then the note in the case, then the memory of him checking his watch and leaving with his lunch tin. By the time she looks through the eyepiece, the audience knows it's his promise she's keeping, thirty years late. Then she keeps it again, for her own kid.

What she was afraid of losing was a paycheck. What she got back was the nights.

## Who it's for

It's for people who hear "AI is coming for your job" and feel their stomach drop. The rules I held to:
- No robots with faces, no glowing brains, no screens, no code, no gleaming cities.
- The machines are pale, rounded and polite. One pauses to let her pass. The film shows them doing her exact motion, in a match cut, which honours how good she was at it.
- The fear gets real time: a letter, her face, her son watching from the doorway, and no music.
- The winter is hard. The film shows how the world adjusted in terms a mum would recognise: a noticeboard of neighbours helping each other, then a second letter at the same table saying a payment goes to every household, every month. It gives one concrete line of how the family eats, and no policy lecture.
- The AI appears only as a small warm light on the kitchen table and a book whose pages fill with drawings while she learns. It never speaks and never has a face. It's a teacher, not a replacement.
- The town changes believably: gardens in the road, the shuttered shop reopened as a repair workshop, benches, bunting, a night school in the church hall. Same houses, more life.
- The last line is a dedication, not a slogan: *For everyone who ever worked nights.*

## Where the ideas came from

The thematic backbone is partly drawn from things **Elon Musk** has said publicly about curiosity as the purpose worth organising a life, or a civilisation, around. He has described his outlook as "a religion of curiosity" (Jordan Peterson interview, 2024). He has also said, as reported by Fortune, that "my religion, for the lack of a better word, is one of curiosity," in the sense of expanding "the scope and scale of consciousness." Other sources:
- The teenage conclusion he describes in Ashlee Vance's biography: we should "increase the scope and scale of human consciousness in order to better understand what questions to ask."
- xAI's stated aim to "understand the true nature of the universe."
- His line about extending "the light of consciousness to the stars."
- His remarks at the 2023 Sunak conversation and at VivaTech 2024 that work may become optional, something done for satisfaction rather than necessity.

I checked these against published sources (listed with links in `RESEARCH.md`, with notes on which are verbatim and which are reported). The research was done from search results, so each quote should be checked against its primary source before anyone quotes it. He isn't in the film, he isn't depicted, nobody quotes him, and no quote is invented. The ideas are carried only by images:
- one star through a grimy skylight
- a book that fills with questions ("where is it?", "how big does it look through a 60mm?")
- "bring a question" chalked on the board in the hall
- Saturn, small and trembling and real
- a thin line climbing into the dark
- warm points of light drifting gently outward from the planet, with a few far stars warming as if someone had arrived

The second idea, that we've mistaken trading time for money for purpose, is the brief's own. The film tries to honour it without calling work a prison: Nell is good at her job, and the film respects that.

The visual lineage is gentle hand-drawn TV animation and children's picture books: lined cel characters over unlined watercolour backgrounds, and held shots where one thing moves (the kettle steam, one star). I didn't imitate any particular studio or character. The style sheet in `sheets/style_sheet.png` sets out the house rules, including a "do not" row.

## How it was made (honestly)

The brief assumed image and video generation models. There weren't any in this environment: no image model, no video model, no music or voice model. So I did the whole thing the way the brief's final stage asked for anyway: by drawing.

- **The scaffolding is a rig, not generated footage.** A light-3D telescope model, a jointed character rig with age as a parameter, perspective-built sets and a camera per shot. That gives the physically plausible motion and consistent layouts the brief wanted from video.
- **The drawing layer is the film.** Every line is a tapered ribbon of ink displaced by noise that re-seeds once per drawing, so the line boils like a hand-drawn cel. Characters get flat fills with one hard cel shadow and a rim light at night. Backgrounds are painted in layered watercolour glazes, with pigment pooling at the edges and granulation. Everything sits on one paper texture. Drawings update 12 times a second and are held on twos at 24 fps. Dust, snow drawn as individual strokes, breath fog, steam, the travelling glint on the brass, stars twinkling one at a time, chalk and the launch trail are all drawn, not simulated.
- **Consistency by construction.** Nell is one model. Her age, expression and pose are parameters, so she is the same woman at 49 and 69 (`sheets/nell_aging.png`) and the same woman ten times over (`sheets/nell_ten_times.png`). The telescope is one function, so the dent is on the same side, just behind the front band, in every shot.
- **Sound.** The score and all sound design are synthesised in JavaScript with the Web Audio API. There are no samples and no libraries. The melody is her father's tune: a small lullaby waltz in D that could be whistled. It appears only in fragments: four unresolved notes in the cupboard, her hum under the conveyor, her father's hum in the memory, the first phrase when Saturn comes into focus. It plays in full only at the end. Every cue is keyed to the same shot table the renderer uses, so picture and sound can't drift apart. See `audio/AUDIO_NOTES.md`.
- **Verification.** After every batch I rendered stills, laid them out on contact sheets, looked at them, and fixed what was wrong: mirrored eyes, a jaw that was too big, hands that read as mittens, a telescope that wasn't at anyone's eye, a space shot that looked like a network diagram. `LOG.md` lists what worked and what didn't.

## What I'd do with more (or different) tools

The characters are simpler than a human animator's would be. They're picture-book figures with limited acting, and some poses are stiff. With an image model I'd have used it for background paintings and for key poses to trace over, and kept the drawing layer exactly as it is. The synthesised laugh and hums are the hardest sounds to fake without samples. They're kept short and quiet on purpose.

## The question at the end

Would a sixty-year-old who has never used AI finish this feeling hopeful rather than sold to? I tried to earn a yes by keeping the machine out of the hero's role. Nell is the one who fixes the telescope, teaches the street and keeps the promise. The only thing that changed is that she finally had the nights.

## Files

| Path | What |
|---|---|
| `out/after_work_1080p.mp4` | The film, 1920×1080, 24 fps, with audio |
| `out/after_work_square_1080.mp4` | Square crop for X (per-shot pan-and-scan) |
| `STORY.md` | Story, beat by beat, and what the telescope means |
| `SHOTLIST.md` | Every shot: number, timecode, duration, description, camera, characters, beat, audio |
| `DECISIONS.md` | Assumptions made while working alone |
| `LOG.md` | Verification log: what worked, what didn't |
| `RESEARCH.md` | Sources, including the curiosity quotes with links |
| `review/*.png` | Contact sheets from the verification passes (start, middle and end of every shot) |
| `sheets/*.png` | Style sheet, character sheets, telescope turnaround, ten-times sheet, aging sheet |
| `film.html` | The film itself, live in a browser (`?t=SECONDS` to hold a frame) |
| `src/`, `audio/`, `tools/` | Everything that draws, sounds and renders it |

Made by Claude (Anthropic), for John Brophy.
