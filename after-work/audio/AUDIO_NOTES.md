# After Work: audio notes

Everything is synthesised in JavaScript inside headless Chromium, using the Web Audio API
(`OfflineAudioContext`, biquads, convolvers, oscillators) plus custom DSP written into AudioBuffers.
There are no samples and no generation APIs.

## Files

| File | What it is |
|---|---|
| `tools/render_audio.js` | Node/Playwright driver. `node tools/render_audio.js` renders everything; `--test laugh,hum,...` renders single instruments |
| `audio/render.html` | Page that loads `../src/shots.js` and the scripts below |
| `audio/engine.js` | DSP primitives (biquads, Klatt resonators, noise, procedural reverb IRs), the `Stem` wrapper around one OfflineAudioContext, and the instruments |
| `audio/score.js` | The theme (`TUNE`, `HARM`) and every music cue |
| `audio/sfx.js` | Sound-design generators and every SFX cue |
| `audio/master.js` | Stem rendering, BS.1770 loudness, look-ahead limiter, 16-bit WAV (TPDF dither), transfer to Node |
| `audio/tests.js` | Instrument tests for `--test` |
| `audio/verify.py` | Analysis: format/length, per-shot table, peaks, beep timing, tune-once, onset grid |
| `audio/afterwork.wav` | The mix: 48 kHz, stereo, 16-bit, exactly FILM_DUR (232.000 s), -16.0 LUFS integrated, -1.2 dBFS peak (-1.17 dBTP) |
| `audio/music.wav`, `audio/sfx.wav` | Stems, with the same master gain applied (not limited, so music + sfx is slightly hotter than the mix where the limiter acted) |
| `audio/cues.json` | Every cue and every note, with shot, offset and absolute time, written by each render |

Re-render: `node tools/render_audio.js` takes about 2 minutes. Check: `python3 audio/verify.py`.

## Timing rule

Every cue is `at(shotId, offsetSeconds)` (`engine.js`), resolved from `SHOTS` when the page runs. No absolute
times appear anywhere. Retiming is handled as follows:
- Beds follow shot boundaries, with 80 ms crossfades.
- The S22-S23 ostinato fits 5 bars between S22 +0.4 s and the eyepiece click at S23 +2.5 s.
- The S27-S31 section fits 15 bars between S27 +0.2 s and S31 +6.0 s, clamped to 2.2-2.6 s per bar.
- The finale fits 15 bars from S32 +0.3 s to a target of S36 +1.0 s, clamped to 68-74 bpm.
- If a retime pushes the final D out of S36, the render prints a warning (`META.fullTune.warning`).

A dry run with random ±25% retimes built every cue without errors.

## The theme and where it appears

D major, 3/4, quarter = 72 (74 in the finale). Harmony: I, IV, V, vi, as briefed.

| Where | What | Theme material |
|---|---|---|
| S01 +1.5 | Detuned intimate piano plus a music-box tine an octave up, long decay into S02 | D A B A (unresolved) |
| S06 +1.0 | Nell hums, 15 dB under the (muffled, low-heavy) warehouse bed broadband; about 8 dB above it in her own 250-600 Hz band, so it is faint but present | D4 A4 B4 A4 |
| S13 +1.6 | Low cello D2, bowed, soft, bleeding into S14 as a drone | - |
| S14 +1.4, S15 +0.8 | Low dark piano in D minor over a cold open fifth (D2/A2/A3) | D A Bb A F / G Bb A G E |
| S16 +3.1, S17 +1.2 | Warmer Dsus2 pad (no third yet), and a soft open D/A on piano | - |
| S18 +1.3 | First major chord since the title: D major pad and a rolled piano chord, on the exhale | - |
| S19 +3.1 | The motif again, and the fifth note: F#4 on the downbeat of bar 2 (S19 +5.6), held into S20 | bars 1 to 2 downbeat |
| S20 +0.1 | Held pad A3 D4 F#4 | - |
| S21 +0.6 | Arthur hums bars 1-2 an octave down (male hum, ±14 cent wobble, memory-filtered) | bars 1-2 |
| S22 +0.4 to S23 +2.5 | Karplus-Strong guitar ostinato with a harp melody, varying bars 1-4 at about 89 bpm. Bar 6 (D) lands on the eyepiece click | bars 1-4 variations |
| S24 +0.8 | High string harmonic A5/E6, almost nothing | - |
| S25 +1.6 | Soft piano, bars 1-4, most tender | bars 1-4 |
| S26 +3.6 (147.6 s) | The phrase resolves to D: piano and a soft string chord, 0.2 s before Sam's laugh | cadence to D |
| S27 +0.2 to S31 | Plucked ostinato, pizz bass, piano fragments, strings; lifts to G major and back; S30 has a clock-like woodblock pulse; S31 thins to hushed chords | bars 9-12, 9-12 in G, 13-14 (never 15-16) |
| S32 +0.3 (185.80 s) | FULL TUNE, bar 1. Nell (69) hums bars 1-2 over a soft piano waltz; the piano takes the melody at bar 3 (S32 +5.16) | bars 1-16, once |
| S34 +5.76 (bar 9) | Strings and cello join for phrase B, swell gently to bars 13-14, then ease | |
| S36 +3.29 (222.29 s) | Final D (bar 16) lands and decays; it fades out by S37 +1.6 | |
| S37 +0.35 | Whistle: bars 1-4 at 80 bpm (bar 2 shortened), sine plus tracked breath noise plus vibrato; the E fades with the film | bars 1-4 |

The full-tune bar grid is printed by `verify.py`. Bars 1-3 fall in S32, 4-6 in S33, 7-9 in S34, 10-14 in S35, and 15-16 in S36.

## Synthesis techniques

- **Piano:** additive synthesis. Up to 40 inharmonic partials (stiff-string B coefficient), with 1-3 detuned strings per partial so it beats. Decay is two-stage (prompt plus aftersound), and higher partials decay faster. Spectral tilt depends on velocity, there's a hammer-position comb and a noise thump. `box` adds bell partials (1, 2.76, 5.4) an octave up for the music-box colour. `detune` and `spread` give the intimate, out-of-tune S01/S19 instrument.
- **Plucked strings:** Karplus-Strong. The noise excitation is low-passed and put through a pick-position comb. The loop filter is a two-point average, with a Thiran-style allpass for fine tuning and a T60-derived loop gain. There are biquad body resonances for guitar, harp and pizz.
- **Bowed strings, cello and pads:** polyBLEP sawtooth sections of 1-3 detuned players. Each player has delayed vibrato, pitch drift, bow-pressure jitter and bow noise, then body EQ and a low-pass.
- **Voices** (`voice()`): a Rosenberg glottal pulse (flow derivative) with jitter and shimmer, flow-modulated aspiration noise, and a spectral-tilt pole, through a Klatt cascade of formant resonators.
  - **Hum:** nasal murmur formants (about 290/1250/2500 Hz), an antiresonance at 950 Hz and a 2.4 kHz low-pass. Onsets are breathy and vibrato is delayed. Level is compensated per note (the nasal formant otherwise favours D4).
  - **Sam's laugh (S26 +3.8):** five "ha" bursts at 0.205-0.245 s spacing, slowing slightly. f0 falls across the bursts, 455 → 440 → 418 → 392 → 362 Hz, and each burst rises then falls. There's an aspirated /h/ onset of 40-60 ms, then an open vowel (F1 950, F2 1550, F3 2850 Hz, plus a boost at F2/F3), with slight vowel drift per burst and an unvoiced inhale at the end. Tested: measured f0 per burst 444/419/399/376/357 Hz; the inhale is unvoiced; the strongest harmonics sit at F1, with F2 about -11 dB.
  - **Crowd murmur (S16-S17, S28):** 14 (or 4) babble voices. Each has random syllables at 3.5-5.5 Hz with vowel formant targets, phrase declination, fricative bursts and pauses. The result reads as speech, with no words. In S16 it's muffled (350 Hz low-pass) until the door opens at +3.0, then it opens to 3.8 kHz and swells.
  - Distant children's laughs and squeals, the soft adult laugh in S17, and the dog barks use the same engine.
- **Whistle:** a sine with scoops, vibrato and a faint 2nd harmonic, plus noise through a resonator that tracks the pitch (breath), plus broadband air.
- **SFX:**
  - **Modal:** clunk, clinks, bell, brass click, radiator, clock ticks, tin, cage rattle.
  - **Friction:** creaks and chair scrape use stick-slip pulse trains with a wobbling rate, driving wood resonators.
  - **Granular:** snow crunch, paper crinkle, rain droplets, screw ticks.
  - **Filtered noise:** slides, page turns, pencil and chalk strokes, hisses, breath, wind, rain, air and room tone.
  - **Other sources:** kettle (boil noise plus a rising tone and pitch-tracked noise whistle, with the switch click); pneumatic hiss and servo whir (swept sawtooth); crickets (pulsed 4.2-5 kHz chirps, six individuals panned across the field); launch rumble (double-low-passed brown noise, 31 and 47 Hz sines, and low pink noise); birds (FM chirps: blackbird, sparrow, robin, evening song, swifts).
- **Beds:** the warehouse hum is oscillators at 60-360 Hz, brown-noise rumble, air, a beating 100 Hz sawtooth buzz and a looped roller rattle. Per-shot automation handles the pre-lap, the S04 close-up, S05 muffled with -300 cents, S06, and the cut at S07 +2.3. The S09/S10 version is thinner.
- **Space:** procedural impulse responses (decaying noise with a time-varying low-pass, early reflections, energy-normalised):
  - warehouse 3.8 s
  - community hall 1.4 s
  - room 0.5 s
  - outdoor 1.1 s (sparse)
  - night 2.4 s (sparse)
  - memory 2.6 s (dark)
  - music hall 3.2 s
- **Master:** BS.1770 K-weighted gated loudness to -16 LUFS, then a 4 ms look-ahead limiter (sliding-min gain, box-smoothed, 120 ms release) at a -1.2 dBFS ceiling, with TPDF dither.

## Verification (last render)

- Format: 48000 Hz, 2 ch, int16, 11,136,000 samples = 232.000 s.
- Loudness and peaks: -16.02 LUFS (ffmpeg ebur128 agrees: -16.0), sample peak -1.20 dBFS, true peak -1.17 dBTP. Nothing clipped.
- The limiter acts lightly (at most about 0.9 dB) on piano and laugh peaks in S25/S26 and the finale.
- There is no digital silence anywhere: the quietest 50 ms frame is about -69 dBFS (S01 room tone).
- Beeps:
  - S04: 1.001, 2.601, 4.201 s.
  - S10: 0.601 + 0.8k s.
  - Both within 1 ms.
- Full tune, symbolic check: the whole 41-note sequence and complete phrase A each occur once in the melody log, at 185.80 s.
- Full tune, acoustic check: chroma template match of the whole 16-bar tune on the music stem gives r = 0.60 at 185.8 s. The runner-up is r = 0.30 (the S25 phrase).
- Finale onsets: all 36 piano-melody onsets (bars 3-16) were detected within 40 ms (median 7 ms). Scheduled notes deviate at most 8 ms from the 8th-note grid (humanisation).
- Level arc (shot LUFS, from `verify.py`):
  - warehouse about -18 to -20
  - kitchen and fear -24 to -32
  - winter about -19 to -23
  - S24 -33 (near silence)
  - Saturn -14
  - gold -16 to -19
  - finale -12 to -13.6
  - credits -18

## Cue sheet (generated from audio/cues.json; absolute times for the current shot table)

| Shot | Offset (s) | Abs (s) | Stem | What |
|---|---|---|---|---|
| S01 | +0.00 | 0.00 | sfx | Room tone on every shot (pink noise, per-location filtering), 80 ms crossfades |
| S01 | +0.00 | 0.00 | sfx | Distant clock in another room (muffled ticks) |
| S01 | +1.50 | 1.50 | music | Motif D4 A4 B4 A4, detuned plucked piano / music box, unresolved |
| S02 | +0.00 | 6.00 | music | Last note (A4) rings out under the title |
| S02 | +3.50 | 9.50 | sfx | Conveyor hum pre-laps under the last second of the title |
| S03 | +0.70 | 11.20 | sfx | Distant scanner beeps, cage rattle (3.2 s), clatter (5.2 s), cardboard slides |
| S04 | +1.00 | 18.00 | sfx | Scan beep 1 (2.8 kHz) |
| S04 | +2.60 | 19.60 | sfx | Scan beep 2 (2.8 kHz) |
| S04 | +4.20 | 21.20 | sfx | Scan beep 3 (2.8 kHz) |
| S05 | +0.00 | 22.00 | sfx | Hum muffled and pitched down (inside her head) |
| S05 | +1.20 | 23.20 | sfx | Her slow tired breath (exhale) |
| S06 | +1.00 | 28.00 | music | Nell hums D4 A4 B4 A4 (glottal pulse + nasal formants), barely audible |
| S07 | +1.15 | 33.15 | sfx | Time card slides in |
| S07 | +1.60 | 33.60 | sfx | Time card CLUNK (thump + stamp click + metal) |
| S07 | +2.20 | 34.20 | sfx | Door (push bar) opening |
| S07 | +2.30 | 34.30 | sfx | Warehouse hum cut as the door opens |
| S07 | +2.30 | 34.30 | sfx | Outdoor dawn air + early birds |
| S08 | +0.00 | 36.00 | sfx | Kettle boiling, whistle rising to 3.0 s then clicks off |
| S08 | +1.10 | 37.10 | sfx | Blackbird outside the window |
| S08 | +3.00 | 39.00 | sfx | Kettle switch click |
| S08 | +3.10 | 39.10 | sfx | Chair scrape |
| S08 | +3.80 | 39.80 | sfx | Coat rustle as she sits |
| S08 | +4.70 | 40.70 | sfx | A tired sigh |
| S09 | +0.00 | 42.50 | sfx | Warehouse hum returns thinner (new machines) |
| S09 | +0.40 | 42.90 | sfx | Pneumatic hisses + servo whirs in a gentle rhythm, clean high beeps, footsteps |
| S10 | +0.60 | 49.60 | sfx | Gripper scan beep 1 |
| S10 | +1.40 | 50.40 | sfx | Gripper scan beep 2 |
| S10 | +2.20 | 51.20 | sfx | Gripper scan beep 3 |
| S10 | +2.30 | 51.30 | sfx | Her glove enters, hesitates (rustle) |
| S10 | +3.00 | 52.00 | sfx | Gripper scan beep 4 |
| S10 | +3.50 | 52.50 | sfx | Glove withdraws (rustle) |
| S10 | +3.80 | 52.80 | sfx | Gripper scan beep 5 |
| S10 | +4.60 | 53.60 | sfx | Gripper scan beep 6 |
| S11 | +0.35 | 54.35 | sfx | Kitchen clock tick 1 Hz (S11-S13), fridge hum |
| S11 | +0.50 | 54.50 | sfx | Letter paper handled |
| S12 | +0.60 | 60.10 | sfx | Her breath out, slow |
| S12 | +2.50 | 62.00 | sfx | Shaky breath in (hand to mouth) |
| S12 | +3.80 | 63.30 | sfx | Held breath released |
| S13 | +1.20 | 65.70 | sfx | Rain begins on the window (noise + droplet ticks), building |
| S13 | +1.60 | 66.10 | music | One low cello D2, bowed, very soft (rain has started) |
| S14 | +0.00 | 70.50 | sfx | Winter wind (gusting filtered noise), footsteps crunching every 0.55 s, distant dog |
| S14 | +0.50 | 71.00 | music | Cold open fifth D2/A2 strings, sul tasto |
| S14 | +1.40 | 71.90 | music | Motif in D minor, low piano: D3 A3 Bb3 A3 F3 |
| S14 | +1.50 | 72.00 | sfx | Her breath fogging |
| S14 | +4.30 | 74.80 | sfx | Distant dog, once |
| S15 | +0.00 | 77.50 | sfx | Wind at the window (moaning), pencil scratch on sums, radiator ticks (off) |
| S15 | +0.50 | 78.00 | sfx | Pencil scratch (sums) |
| S15 | +0.80 | 78.30 | music | Minor motif continues: G3 Bb3 A3 G3 E3 |
| S15 | +1.70 | 79.20 | sfx | Radiator tick |
| S16 | +0.00 | 82.50 | sfx | Wind; muffled murmur behind the hall door |
| S16 | +3.00 | 85.50 | sfx | Hall door opens (latch + creak) |
| S16 | +3.00 | 85.50 | sfx | Warm crowd murmur spills out (14 babble voices, formant-filtered, no words) |
| S16 | +3.10 | 85.60 | music | Warmer open pad D3 A3 E4 (sus2, no third) as the hall door opens |
| S17 | +0.00 | 88.00 | sfx | Murmur, cups clinking, tea urn, one soft laugh (3.6 s) |
| S17 | +1.20 | 89.20 | music | Soft piano D4 + A4 (open), under the murmur |
| S17 | +3.60 | 91.60 | sfx | One soft laugh in the crowd |
| S18 | +0.20 | 94.20 | sfx | Thaw drips outside |
| S18 | +0.80 | 94.80 | sfx | A long breath out |
| S18 | +1.30 | 95.30 | music | First warm major chord: D major (strings pad + rolled piano) on the exhale |
| S19 | +2.50 | 102.00 | sfx | Cupboard door creak (stick-slip friction through wood resonances) |
| S19 | +3.10 | 102.60 | music | Motif again (box piano) and the fifth note F#4 arrives on bar 2 downbeat |
| S20 | +0.10 | 105.60 | music | Held soft pad A3 D4 F#4 |
| S20 | +0.40 | 105.90 | sfx | Case latch |
| S20 | +0.60 | 106.10 | sfx | Morning birds outside |
| S20 | +1.50 | 107.00 | sfx | Paper note unfolding (crinkle) |
| S21 | +0.30 | 111.80 | sfx | Evening birds (memory-filtered) |
| S21 | +0.60 | 112.10 | music | Father hums bars 1-2 an octave down (male hum, wobbly, memory-filtered) |
| S21 | +3.60 | 115.10 | sfx | Watch (tiny tick) + lunch tin picked up |
| S21 | +6.00 | 117.50 | sfx | A door closes (he leaves for his shift) |
| S22 | +0.20 | 118.20 | sfx | Pencil drawing |
| S22 | +0.40 | 118.40 | music | Plucked ostinato (KS guitar) + harp melody: variations on bars 1-4 |
| S22 | +0.80 | 118.80 | sfx | Page turn |
| S22 | +1.30 | 119.30 | sfx | Birds outside |
| S23 | +0.30 | 126.30 | sfx | Eyepiece thread turning (small ticks) |
| S23 | +2.50 | 128.50 | sfx | New eyepiece clicks home |
| S23 | +3.00 | 129.00 | sfx | Cloth polishing brass |
| S24 | +0.00 | 131.00 | sfx | Night air, distant town, tripod set down, far dog (3.1 s) |
| S24 | +0.80 | 131.80 | music | Almost nothing: high string A5/E6 harmonic, expectant |
| S24 | +0.90 | 131.90 | sfx | Tripod legs set down on the step |
| S24 | +1.60 | 132.60 | sfx | Tripod clamp |
| S24 | +3.10 | 134.10 | sfx | Far dog |
| S25 | +1.60 | 137.60 | music | Piano: phrase bars 1-4, tender |
| S26 | +1.40 | 145.40 | sfx | Nell: a breath-laugh breaking |
| S26 | +1.75 | 145.75 | sfx | Nell: second breath of the laugh |
| S26 | +3.60 | 147.60 | music | Phrase resolves to D (piano D major + strings), just before the laugh |
| S26 | +3.80 | 147.80 | sfx | Sam (11) laughs out loud: 5 'ha' bursts, 455 -> 362 Hz, open-vowel formants, inhale |
| S27 | +0.00 | 150.50 | sfx | Chalk on the step, birds, door open to the street |
| S27 | +0.20 | 150.70 | music | Opening up: KS guitar ostinato + piano, phrase-B fragments (never the whole tune) |
| S27 | +0.30 | 150.80 | sfx | Chalk scratching |
| S27 | +0.50 | 151.00 | sfx | Birds |
| S27 | +2.20 | 152.70 | sfx | Second chalk (Sam) |
| S28 | +0.00 | 155.50 | sfx | Rooftop: a few neighbours murmuring, chalk, swifts |
| S28 | +0.90 | 156.40 | sfx | Swifts screaming overhead |
| S28 | +2.00 | 157.50 | sfx | Chalk on the small board |
| S29 | +0.00 | 162.00 | sfx | Street across years: children playing, birds, bicycle bell (4.0 s), radio through a window |
| S29 | +0.40 | 162.40 | sfx | Children playing (distant laughs, squeals) |
| S29 | +1.00 | 163.00 | sfx | Birds |
| S29 | +4.00 | 166.00 | sfx | Bicycle bell |
| S30 | +0.00 | 171.00 | music | Clock-like pulse (woodblock tick) on the beat |
| S30 | +1.50 | 172.50 | sfx | Birds outside the kitchen |
| S30 | +2.80 | 173.80 | sfx | Page turn |
| S31 | +0.00 | 179.00 | sfx | Hush of a listening room, chalk on the big board, a chair creak (4.2 s) |
| S31 | +0.50 | 179.50 | sfx | Chalk on the big board |
| S31 | +1.20 | 180.20 | sfx | Room rustle |
| S31 | +4.20 | 183.20 | sfx | Chair creak |
| S32 | +0.00 | 185.50 | sfx | Crickets (6 individuals, pulsed 4.2-5 kHz chirps, stereo spread) through S36 |
| S32 | +0.30 | 185.80 | music | FULL TUNE bar 1 (Nell hums bars 1-2, piano accompaniment), 74.0 bpm |
| S32 | +5.17 | 190.66 | music | Piano takes the melody (bar 3) |
| S34 | +1.00 | 200.50 | sfx | Telescope creaks as the girl swings it |
| S34 | +2.00 | 201.50 | sfx | Launch rumble arrives late: 20-80 Hz + filtered noise, swells 4 s, fades |
| S34 | +5.76 | 205.26 | music | Strings join for phrase B (bar 9) |
| S36 | +0.50 | 219.50 | sfx | Crickets fade out |
| S36 | +3.29 | 222.29 | music | FULL TUNE final D (bar 16) lands and decays |
| S37 | +0.35 | 224.35 | music | Whistled first phrase (bars 1-4), sine + breath noise with vibrato |
## Known weaknesses

- **The finale timing is a constraint conflict.** S32 to S36 is 38.5 s, and 16 bars at 74 bpm take 38.9 s. So even at the fastest allowed tempo, with Nell's hum treated as bars 1-2 of the tune rather than a separate intro, the final D lands at S36 +3.29 s. That leaves 1.7 s of S36 before the credits, and the D decays under the start of S37: it fades by S37 +1.6 while the whistle enters at S37 +0.35 on the same pitch class. Landing it early in S36 would need S32-S35 to be about 2-3 s longer, or the tune to start before S32.
- **The credits whistle is compressed.** Bars 1-4 at 80 bpm, with bar 2 shortened, fit S37's 8 s. The final E only sounds for about 1 s as it fades.
- **The voices are formant synthesis, not recordings.**
  - The hums and laugh are the most "synthetic" elements. The laugh has realistic timing, pitch fall, aspiration and inhale, but a buzz-like glottal source.
  - The babble reads as crowd murmur at low level and in reverb, but soloed it sounds like vowel-babble.
- **The piano is additive, without sympathetic resonance or a soundboard model.** It's warm but slightly dark and "clean". The Karplus-Strong plucks are bright on attack.
- **Stems are not limited,** so `music.wav + sfx.wav` is up to about 0.9 dB hotter than `afterwork.wav` where the limiter acted.
- **The S34 rumble is mostly below 80 Hz.** It will be nearly inaudible on laptop speakers.
- **Nobody has listened to this.** Checks were by analysis only (levels, pitch tracks, onsets, spectra). A listening pass is recommended, especially for the laugh (S26 +3.8), the hum levels (S06 should be barely there), and the S14-S15 minor piano versus the wind.
