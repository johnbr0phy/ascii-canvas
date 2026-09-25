#!/usr/bin/env python3
"""Verify the After Work soundtrack: python3 audio/verify.py
Checks duration/format, per-shot levels, clipping/true peak, loudness, beep timing (S04/S10),
that the full tune occurs exactly once, and melody onsets against the bar grid."""
import json, os, re, subprocess, sys
import numpy as np, scipy.io.wavfile as wf, scipy.signal as sg

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FFMPEG = '/tmp/claude-0/tools/node_modules/ffmpeg-static/ffmpeg'

def load(name):
    sr, x = wf.read(os.path.join(HERE, name))
    return sr, x, x.astype(np.float64) / 32768.0

def shots():
    out = subprocess.run(['node', '-e', "const {SHOTS,FILM_DUR}=require('./src/shots.js');console.log(JSON.stringify({SHOTS,FILM_DUR}))"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return json.loads(out)

def lufs(x, sr):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621]
    k = sg.lfilter(b2, a2, sg.lfilter(b1, a1, x, axis=0), axis=0)
    blk, hop = int(0.4 * sr), int(0.1 * sr)
    p = np.array([np.sum(np.mean(k[s:s + blk] ** 2, axis=0)) for s in range(0, len(k) - blk, hop)])
    ld = -0.691 + 10 * np.log10(p + 1e-20)
    g = p[ld > -70]; rel = -0.691 + 10 * np.log10(g.mean()) - 10
    return -0.691 + 10 * np.log10(p[(ld > -70) & (ld > rel)].mean())

def db(v): return 20 * np.log10(v + 1e-12)

def main():
    S = shots(); SH = S['SHOTS']; FILM = S['FILM_DUR']
    by = {s['id']: s for s in SH}
    cues = json.load(open(os.path.join(HERE, 'cues.json')))
    ok = True
    sr, raw, mix = load('afterwork.wav'); _, _, mus = load('music.wav'); _, _, sfx = load('sfx.wav')
    print(f"format: {sr} Hz, {mix.shape[1]} ch, {raw.dtype}, {len(mix)} samples = {len(mix)/sr:.4f} s (FILM_DUR {FILM})")
    if sr != 48000 or mix.shape[1] != 2 or raw.dtype != np.int16 or len(mix) != round(FILM * sr): ok = False; print('  FAIL format/duration')
    # loudness + peaks
    L = lufs(mix, sr)
    up = sg.resample_poly(mix, 4, 1, axis=0)
    sp, tp = np.abs(mix).max(), np.abs(up).max()
    clip = int(np.sum(np.abs(raw) >= 32767))
    print(f"integrated loudness {L:.2f} LUFS; sample peak {db(sp):.2f} dBFS; true peak (4x) {db(tp):.2f} dBTP; clipped samples {clip}")
    if abs(L + 16) > 0.5 or db(sp) > -1.0 or clip: ok = False; print('  FAIL loudness/peak')
    try:
        r = subprocess.run([FFMPEG, '-hide_banner', '-nostats', '-i', os.path.join(HERE, 'afterwork.wav'), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
        m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr); t = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r.stderr)
        print(f"ffmpeg ebur128: I = {m[-1] if m else '?'} LUFS, true peak = {t[-1] if t else '?'} dBFS")
    except Exception as e: print('ffmpeg check skipped', e)
    # per-shot table
    print("\nshot  start   dur   mix RMS  mix pk  music RMS  sfx RMS  lim dB  min 50ms-RMS")
    summ = mus + sfx
    for s in SH:
        a, b = int(s['start'] * sr), int(s['end'] * sr)
        seg = mix[a:b]; r = db(np.sqrt(np.mean(seg ** 2)))
        red = db(np.sqrt(np.mean(summ[a:b] ** 2))) - r
        w = int(0.05 * sr); mins = min(db(np.sqrt(np.mean(seg[i:i + w] ** 2))) for i in range(0, len(seg) - w, w))
        print(f"{s['id']}  {s['start']:6.1f} {s['dur']:5.1f}  {r:7.1f}  {db(np.abs(seg).max()):6.1f}  {db(np.sqrt(np.mean(mus[a:b]**2))):9.1f}  {db(np.sqrt(np.mean(sfx[a:b]**2))):7.1f}  {red:6.2f}  {mins:8.1f}")
    w = int(0.05 * sr); frames = [db(np.sqrt(np.mean(mix[i:i + w] ** 2))) for i in range(0, len(mix) - w, w)]
    silent = [i * 0.05 for i, v in enumerate(frames) if v < -90]
    print(f"\n50 ms frames below -90 dBFS (digital silence): {len(silent)} {('at ' + ', '.join(f'{t:.2f}' for t in silent[:8])) if silent else ''}")
    # beeps: sfx stem, 2.8 kHz band
    print("\nscanner beeps (2.8 kHz band, sfx stem):")
    bb, ab = sg.butter(4, [2700, 2900], 'bandpass', fs=sr)
    mono = sfx.mean(1)
    for sid, exp in [('S04', [1.0, 2.6, 4.2]), ('S10', [0.6 + 0.8 * k for k in range(6) if 0.6 + 0.8 * k < by['S10']['dur'] - 0.1])]:
        a, b = int(by[sid]['start'] * sr), int(by[sid]['end'] * sr)
        env = np.abs(sg.hilbert(sg.filtfilt(bb, ab, mono[a:b])))
        env = sg.filtfilt(*sg.butter(2, 200, fs=sr), env)
        thr = env.max() * 0.4
        on = np.where((env[1:] >= thr) & (env[:-1] < thr))[0] / sr
        on = [o for i, o in enumerate(on) if i == 0 or o - on[i - 1] > 0.2]
        err = [min(abs(o - e) for o in on) for e in exp] if on else [9]
        good = len(on) == len(exp) and max(err) < 0.02
        ok &= good
        print(f"  {sid}: expected {[round(e, 2) for e in exp]}  found {[round(o, 3) for o in on]}  max err {max(err)*1000:.1f} ms  {'OK' if good else 'FAIL'}")
    # full tune occurs once: symbolic (note log) + acoustic (chroma template match)
    tune = [62,69,71,69,66,67,71,69,67,64,62,69,71,69,74,73,71,69,67,64,62,66,67,69,71,74,73,71,69,66,67,69,71,69,66,62,64,66,64,61,62]
    mel = sorted([n for n in cues['notes'] if n['tag'].startswith('melody')], key=lambda n: n['t'])
    pcs = [n['midi'] % 12 for n in mel]; tp_ = [m % 12 for m in tune]
    hits = [i for i in range(len(pcs) - len(tp_) + 1) if pcs[i:i + len(tp_)] == tp_]
    phraseA = [i for i in range(len(pcs) - 16) if pcs[i:i + 17] == tp_[:17]]
    print(f"\nfull tune (41-note sequence) in melody log: {len(hits)} occurrence(s) at {[round(mel[i]['t'], 2) for i in hits]}; complete phrase A: {len(phraseA)} at {[round(mel[i]['t'],2) for i in phraseA]}")
    ok &= len(hits) == 1
    ft = cues['meta']['fullTune']
    # acoustic check: chroma of music stem vs template of the full tune rendered as a chroma sequence
    hop = 0.05; n = int(0.2 * sr)
    f, t, Z = sg.stft(mus.mean(1), sr, nperseg=8192, noverlap=8192 - int(hop * sr))
    P = np.abs(Z) ** 2; band = (f > 200) & (f < 1200)
    midi = 69 + 12 * np.log2(f[band] / 440); C = np.zeros((12, P.shape[1]))
    for k, m in enumerate(midi): C[int(round(m)) % 12] += P[band][k]
    C /= C.sum(0, keepdims=True) + 1e-12
    def template(bar):
        beat = bar / 3; seq = []
        tt = 0
        for b, row in enumerate([[(0,62,1),(1,69,1),(2,71,.5),(2.5,69,.5)],[(0,66,3)],[(0,67,1),(1,71,1),(2,69,.5),(2.5,67,.5)],[(0,64,3)],[(0,62,1),(1,69,1),(2,71,.5),(2.5,69,.5)],[(0,74,2),(2,73,1)],[(0,71,1),(1,69,.5),(1.5,67,.5),(2,64,1)],[(0,62,3)],[(0,66,1),(1,67,1),(2,69,1)],[(0,71,2),(2,74,1)],[(0,73,1),(1,71,1),(2,69,1)],[(0,66,3)],[(0,67,1),(1,69,1),(2,71,1)],[(0,69,1),(1,66,1),(2,62,1)],[(0,64,1),(1,66,.5),(1.5,64,.5),(2,61,1)],[(0,62,3)]]):
            for bt, m, d in row: seq.append((b * bar + bt * beat, m % 12, d * beat))
        L_ = int(16 * bar / hop); T = np.zeros((12, L_))
        for s0, p, d in seq: T[p, int(s0 / hop):int((s0 + d) / hop)] = 1
        return T
    best = []
    for bpm in [68, 70, 72, 74, 76, 78, 80]:
        T = template(180 / bpm); Lt = T.shape[1]; Tn = (T - T.mean()) / T.std()
        sc = np.full(C.shape[1], -1.0)
        for s0 in range(0, C.shape[1] - Lt, 2):
            W = C[:, s0:s0 + Lt]; Wn = (W - W.mean()) / (W.std() + 1e-9); sc[s0] = (Wn * Tn).mean()
        best.append((bpm, sc))
    comb = np.max([b[1] for b in best], axis=0)
    pk, _ = sg.find_peaks(comb, height=0.25, distance=int(10 / hop))
    print("acoustic chroma match of the whole 16-bar tune (music stem), correlation peaks > 0.25:")
    for p in pk: print(f"   t = {t[p]:7.2f} s  r = {comb[p]:.3f}")
    top = sorted(comb[pk], reverse=True)
    print(f"   best match at {t[np.argmax(comb)]:.2f} s (r={comb.max():.3f}); runner-up r={top[1] if len(top)>1 else 0:.3f}")
    # melody onsets vs grid in the finale (piano melody from bar 3)
    exp = [n['t'] for n in mel if n['tag'] == 'melody:full' and n['t'] >= ft['start'] + 2 * ft['bar'] - 0.05]
    a = int((ft['start'] + 2 * ft['bar'] - 0.3) * sr); b = int((ft['finalNote'] + 0.5) * sr)
    x = mus[a:b].mean(1)
    f2, t2, Z2 = sg.stft(x, sr, nperseg=2048, noverlap=2048 - 240)
    M = np.log1p(1000 * np.abs(Z2[(f2 > 250) & (f2 < 2000)]))
    flux = np.maximum(0, np.diff(M, axis=1)).sum(0); flux = (flux - np.median(flux)) / (flux.std() + 1e-9)
    pk2, _ = sg.find_peaks(flux, height=1.0, distance=int(0.12 * sr / 240))
    det = t2[1:][pk2] + a / sr
    errs = [min(abs(d - e) for d in det) for e in exp]
    grid = [ft['start'] + k * ft['bar'] / 6 for k in range(96)]
    offgrid = [min(abs(e - g) for g in grid) for e in exp]
    print(f"\nfinale: full tune bar 1 at {ft['start']:.3f} s ({ft['bpm']:.2f} bpm, bar {ft['bar']:.3f} s); final D (bar 16) at {ft['finalNote']:.3f} s = {ft['finalShot']} +{ft['finalOffset']:.2f} s")
    print(f"finale onset check: {len(exp)} expected melody notes (bars 3-16); detected onset within 40 ms for {sum(e < 0.04 for e in errs)}/{len(exp)} (median err {np.median(errs)*1000:.1f} ms); max deviation of scheduled notes from the 8th-note grid {max(offgrid)*1000:.1f} ms")
    print("\nbar grid, full tune (bar: time, shot):")
    for k in range(16):
        tb = ft['start'] + k * ft['bar']; sh = next(s for s in SH if s['start'] <= tb < s['end'])
        print(f"   bar {k+1:2d}: {tb:7.2f} s  {sh['id']} +{tb - sh['start']:.2f}")
    print('\nRESULT:', 'ALL CHECKS PASSED' if ok else 'SOME CHECKS FAILED')

main()
