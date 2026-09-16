(function () {
  var W = 1080, H = 1080, DUR = 13.5;
  var cv = document.getElementById('c'), X = cv.getContext('2d');

  var P = {
    mist: '#E9E5E2', pale: '#f1fafa', dust: '#ded4d7', stone: '#c9c0b4', slab: '#a8aeb0',
    cream: '#F5F0E6', ink: '#1A1A1A', char: '#2B2B2B', wet: '#7f878a', deepwet: '#4a5559',
    cad: '#E34F0C', verm: '#C8102E', mag: '#D13478', rose: '#c8465a',
    turq: '#00B7EB', cyan: '#47e5df', navy: '#0a3a59', deep: '#002B5B',
    lampPl: '#9fb4cf',
    amber: '#F3B616', gold: '#C9A227', wood: '#8B5A2B', bark: '#5a3a1c'
  };

  var craze = crazePlate(W, H, { seed: 77, facets: 120, lines: 240 });
  var grain = grainPlate(W, H, 12, 20, true);
  var scratchP = plate(W, H);
  var castP = plate(W, H);
  var lensP = plate(W, H);

  /* ---------------- the wet street ---------------- */
  var HOR = 686;
  var PUD = blobPts(548, 930, 386, 112, 91, 17, 0.16);

  function street(night) {
    var p = plate(W, H), x = p.x, r = rnd(night ? 55 : 5);
    /* the air above: misty wall, vertical weather */
    /* A quiet ground still has to be a worked one. Four near-identical pale
       greys gave a blank sheet with a form sitting on top of it; the day set
       now runs from warm putty through to a soured olive and a cold slate, so
       there is somewhere for the eye to go in the empty half of the square. */
    ground(x, W, H, {
      base: night ? '#1d242c' : P.mist, seed: night ? 41 : 9,
      tints: night ? ['#121820', '#28323e', P.deep, '#0a0e14', '#3c4a5c']
        : [P.dust, P.stone, P.pale, '#b8ab94', '#8f9a94', '#c4b8a4', '#6f7670'],
      mottle: 150, sweeps: 90, scrape: 72, drift: 30,
      dark: night ? '#000000' : '#575a52', light: night ? '#6b88a8' : '#ffffff',
      vignette: night ? 0.44 : 0.34, vertical: true
    });
    /* crumpled tissue laid into the wall, as she does */
    x.save();
    x.globalAlpha = night ? 0.4 : 0.55;
    x.drawImage(craze.c, 0, 0);
    x.restore();
    /* One warm source in all that navy. Her habit is a large quiet ground with
       the heat concentrated in one place; without it the night pole is just
       murk. */
    if (night) {
      var lampX = 962, lampY = 138;
      for (var lg = 0; lg < 22; lg++) {
        var lr = 90 + lg * 34, la = 0.05 * (1 - lg / 22);
        x.save();
        x.globalCompositeOperation = 'lighter';
        var lgr = x.createRadialGradient(lampX, lampY, 0, lampX, lampY, lr);
        lgr.addColorStop(0, rgba(lg < 6 ? '#ffd9a0' : '#e8973a', la));
        lgr.addColorStop(1, rgba('#e8973a', 0));
        x.fillStyle = lgr;
        x.fillRect(lampX - lr, lampY - lr, lr * 2, lr * 2);
        x.restore();
      }
      for (var lw = 0; lw < 20; lw++) {
        var lwa = r() * TAU, lwd = 60 + r() * 300;
        brush(x, [[lampX + Math.cos(lwa) * lwd * 0.4, lampY + Math.sin(lwa) * lwd * 0.4],
          [lampX + Math.cos(lwa) * lwd, lampY + Math.sin(lwa) * lwd]], {
          col: jit('#d98a30', r, 30), w: 30 + r() * 80, alpha: 0.03 + r() * 0.05,
          bristles: 4, seed: (r() * 1e6) | 0, dens: 5, dry: 0.3, taper: 0.7, spread: 1.1
        });
      }
    }
    /* Torn paper laid into the wall. In the refs these patches are how the
       ground gets its architecture: quiet rectangles of a slightly other
       colour, edges frayed, never lining up into a grid. */
    for (var pt = 0; pt < 9; pt++) {
      var pw = 120 + r() * 300, ph = 150 + r() * 330;
      var px0 = r() * (W - pw * 0.6) - pw * 0.2, py0 = r() * (HOR - 60) - ph * 0.25;
      var rect = [[px0, py0], [px0 + pw, py0 - 8 + r() * 16],
        [px0 + pw + (r() - 0.5) * 20, py0 + ph], [px0 + (r() - 0.5) * 20, py0 + ph]];
      wash(x, jagPoly(rect, (r() * 1e5) | 0, 5, 26), {
        col: night ? jit(r() < 0.5 ? '#26313e' : '#141b24', r, 16)
          : jit(r() < 0.5 ? '#c9bda8' : '#9ea79f', r, 22),
        seed: (r() * 1e5) | 0, layers: 2, alpha: 0.075, edge: 0, bleed: 7
      });
    }
    /* stains and run-off on the wall above */
    for (var w0 = 0; w0 < 18; w0++) {
      var wx = r() * W, wy = r() * (HOR - 120);
      wash(x, blobPts(wx, wy, 80 + r() * 170, 100 + r() * 200, (r() * 1e5) | 0, 13, 0.22), {
        col: night ? jit('#2a3a4a', r, 20) : jit(r() < 0.5 ? '#b8ab98' : '#aab4b8', r, 26),
        seed: (r() * 1e5) | 0, layers: 3, alpha: 0.05, edge: 0, bleed: 6
      });
    }
    for (var d0 = 0; d0 < 6; d0++) {
      drip(x, 40 + r() * 1000, -40 - r() * 30, 160 + r() * 300, 8 + r() * 9,
        night ? '#3a4e60' : mix(P.stone, '#8a8a80', 0.5), (r() * 1e5) | 0);
    }
    /* the pavement below: colder, laid in horizontal sweeps */
    x.save();
    x.beginPath();
    var seam = [[-20, HOR + 10], [300, HOR - 14], [640, HOR + 8], [1100, HOR - 12], [1100, 1100], [-20, 1100]];
    curve(x, seam, true); x.clip();
    for (var i = 0; i < 46; i++) {
      var sy = HOR - 20 + r() * 420, sx = -120 + r() * 300;
      brush(x, [[sx, sy], [sx + 400 + r() * 500, sy + (r() - 0.5) * 60], [sx + 900 + r() * 340, sy + (r() - 0.5) * 50]], {
        col: night ? jit('#1b2630', r, 22) : jit(mix(P.slab, P.wet, r() * 0.7), r, 26),
        w: 26 + r() * 80, alpha: 0.12 + r() * 0.2, bristles: 5, seed: (r() * 1e6) | 0, dens: 5, dry: 0.28, spread: 1.05
      });
    }
    /* Slab joints, spaced by eye and each one broken somewhere along its run */
    for (var k = 0; k < 6; k++) {
      var jy = HOR + 26 + k * 66 + (r() - 0.5) * 46;
      brush(x, [[-40, jy], [340, jy + (r() - 0.5) * 24], [700, jy + (r() - 0.5) * 28], [1120, jy + (r() - 0.5) * 24]], {
        col: night ? '#0b1016' : mix(P.wet, '#4a4a46', 0.4), w: 5 + r() * 8,
        alpha: 0.14 + r() * 0.14, bristles: 2, seed: (r() * 1e6) | 0, dens: 6, dry: 0.4, arc: 0.9
      });
    }
    for (var m = 0; m < 8; m++) {
      var vx = 40 + m * 142 + (r() - 0.5) * 50;
      brush(x, [[vx, HOR + 30 + r() * 40], [vx + (r() - 0.5) * 40, 1090]], {
        col: night ? '#0b1016' : mix(P.wet, '#4a4a46', 0.35), w: 5 + r() * 7,
        alpha: 0.14 + r() * 0.14, bristles: 2, seed: (r() * 1e6) | 0, dens: 5, dry: 0.45
      });
    }
    x.restore();
    /* The wall meets the pavement in wet haze, so the join is scumbled over
       rather than ruled: a clean horizontal line across the square reads as a
       chart axis. */
    brush(x, seam.slice(0, 4), {
      col: night ? '#39506a' : mix(P.pale, '#ffffff', 0.4), w: 10, alpha: 0.14,
      bristles: 3, seed: 61, dens: 8, dry: 0.5, arc: 1.2
    });
    for (var hz = 0; hz < 26; hz++) {
      var hzx = r() * W, hzy = HOR + (r() - 0.5) * 120;
      brush(x, [[hzx - 120 - r() * 200, hzy + (r() - 0.5) * 30], [hzx, hzy],
        [hzx + 120 + r() * 200, hzy + (r() - 0.5) * 30]], {
        col: night ? jit('#1b2630', r, 24) : jit(mix(P.mist, P.slab, r()), r, 22),
        w: 40 + r() * 90, alpha: 0.06 + r() * 0.09, bristles: 5,
        seed: (r() * 1e6) | 0, dens: 5, dry: 0.3, spread: 1.1
      });
    }
    /* the puddle: darker than the slabs, holding the sky and two colours */
    /* No contour round the water. An outlined puddle is a cut-out lying on the
       pavement; a real one is only a change of tone and a held reflection. */
    wash(x, PUD, { col: night ? '#05101c' : '#3a464a', seed: 21, layers: 5, alpha: 0.26, edge: 0, bleed: 14 });
    x.save(); x.beginPath(); curve(x, PUD, true); x.clip();
    /* Reflections are dragged down as vertical smears, longer and wobblier
       than the thing reflected, which is what makes water read as water. */
    [[300, night ? '#2a1016' : '#8a2a22'], [790, night ? '#0e2a3a' : '#1f6e88'],
     [980, night ? '#2a2410' : '#9a7a10'], [962, night ? '#9a5e14' : '#8a8478']].forEach(function (rf, ri) {
      for (var q = 0; q < 9; q++) {
        var rx0 = rf[0] - 90 + r() * 180;
        brush(x, [[rx0, 846 + r() * 20], [rx0 + (r() - 0.5) * 34, 910 + r() * 30],
          [rx0 + (r() - 0.5) * 52, 986 + r() * 34]], {
          col: jit(rf[1], r, 34), w: 22 + r() * 44, alpha: 0.13 + r() * 0.22,
          bristles: 4, seed: 300 + ri * 19 + q, dens: 5, dry: 0.3, spread: 1.1, taper: 0.4
        });
      }
    });
    /* Wind-shiver on the surface. Long strokes with dry gaps in them broke
       into a dash rhythm and tiled the water like mosaic, so each glint is
       instead its own short unbroken mark and the irregularity is in how long
       they are and where they fall. */
    for (var b = 0; b < 90; b++) {
      var by = 846 + r() * 152, bx0 = 168 + r() * 700;
      var blen = 7 + Math.pow(r(), 2.1) * 210;
      brush(x, [[bx0, by], [bx0 + blen * 0.5, by + (r() - 0.5) * 5], [bx0 + blen, by + (r() - 0.5) * 7]], {
        col: night ? mix(P.lampPl, '#ffffff', 0.35) : mix(P.pale, '#ffffff', 0.6),
        w: 1.6 + r() * 5, alpha: 0.07 + r() * 0.15, bristles: 1,
        seed: (r() * 1e6) | 0, dens: 6, taper: 0.8, ribbon: true
      });
    }
    x.restore();
    /* the far lip only, where the light catches: not a ring */
    brush(x, PUD.slice(0, Math.round(PUD.length * 0.42)), {
      col: night ? '#39506a' : mix(P.pale, P.wet, 0.45), w: 13, alpha: 0.16,
      bristles: 3, seed: 23, dens: 9, dry: 0.6, arc: 1.35
    });
    textureThrough(x, craze, function (c) { c.rect(0, 0, W, H); }, night ? 0.5 : 0.34, -30, -50);
    return p;
  }
  var gStreet = street(false);
  var gNight = street(true);

  /* ---------------- umbrellas ----------------
     A dome is: an apex, a scalloped near rim that bows toward you, and
     ribs that bulge outward so the shoulders are round. Get the ribs
     straight and you have a paper hat. */
  function dome(cx, cy, rx, ry, n, sag, bulge, seed) {
    /* Every rib and scallop is given its own width and droop. Equal panels
       with an identical repeated scallop was the die-cut tell: a real canopy
       is sewn slightly wrong and hangs unevenly. */
    var r = rnd(seed == null ? 31 : seed);
    var A = [cx + (r() - 0.5) * rx * 0.09, cy - ry], rimEnd = [], scal = [], ribs = [], i;
    var span = [], tot = 0;
    for (i = 0; i < n; i++) { var w0 = 0.72 + r() * 0.62; span.push(w0); tot += w0; }
    var acc = 0, ts = [0];
    for (i = 0; i < n; i++) { acc += span[i] / tot; ts.push(acc); }
    for (i = 0; i <= n; i++) {
      var t = ts[i];
      rimEnd.push([cx - rx + 2 * rx * t,
        cy + sag * Math.sin(Math.PI * t) + (r() - 0.5) * sag * 0.3]);
    }
    for (i = 0; i < n; i++) {
      var s = (ts[i] + ts[i + 1]) / 2;
      scal.push([cx - rx + 2 * rx * s + (r() - 0.5) * rx * 0.05,
        cy + sag * Math.sin(Math.PI * s) + sag * (0.34 + r() * 0.42) + 12 + r() * 14]);
    }
    for (i = 0; i <= n; i++) {
      var e = rimEnd[i], t2 = ts[i];
      var dx = e[0] - A[0], dy = e[1] - A[1], L = Math.hypot(dx, dy) || 1;
      var side = t2 < 0.5 ? 1 : -1, amt = bulge * Math.abs(t2 * 2 - 1) * (0.78 + r() * 0.44);
      ribs.push([A, [(A[0] + e[0]) / 2 + (-dy / L) * amt * side, (A[1] + e[1]) / 2 + (dx / L) * amt * side], e]);
    }
    return { A: A, rimEnd: rimEnd, scal: scal, ribs: ribs, n: n, cx: cx, cy: cy, rx: rx, ry: ry };
  }

  function outlineOf(d) {
    var pts = [d.A, d.ribs[0][1]];
    for (var i = 0; i < d.n; i++) { pts.push(d.rimEnd[i]); pts.push(d.scal[i]); }
    pts.push(d.rimEnd[d.n]);
    pts.push(d.ribs[d.n][1]);
    return pts;
  }

  function paintDome(x, d, o) {
    var out = outlineOf(d), i;
    envelope(x, out, { w: 16, seed: o.seed, col: '#141210', fillCol: o.shade, halo: 2, blur: 32, haloA: 0.5, hox: 9, hoy: 13 });
    var bb = [d.cx - d.rx * 1.25, d.A[1] - 30, d.rx * 2.5, d.ry + d.sag * 2 + 240];
    for (i = 0; i < d.n; i++) {
      var pan = [d.A, d.ribs[i][1], d.rimEnd[i], d.scal[i], d.rimEnd[i + 1], d.ribs[i + 1][1]];
      var pf = function (k) { curve(k, pan, true); };
      var mid = (i + 0.5) / d.n;
      var lean = Math.abs(mid - 0.38) * 1.9;
      var base = mix(o.cols[i % o.cols.length], o.shade, 0.04 + lean * 0.3);
      impasto(x, pf, {
        base: base, cols: [base, mix(base, o.lit, 0.3), mix(base, o.shade, 0.35), base,
          mix(base, o.shade, 0.16), mix(base, o.lit, 0.14)],
        bb: bb, seed: o.seed + 10 + i, n: 26, kw: 22,
        angle: Math.atan2(d.scal[i][1] - d.A[1], d.scal[i][0] - d.A[0]),
        spreadA: 0.7, stipple: 70, crease: 30, drift: 20, lit: o.lit, shade: o.shade
      });
      /* The rib is where the fabric is pulled tight, so it darkens along the
         edge of each panel instead of being drawn on as a seam line. A drawn
         line turns the canopy into a pie chart. */
      var deep = mix(o.shade, '#000000', 0.2);
      [d.ribs[i], d.ribs[i + 1]].forEach(function (rb, side2) {
        x.save(); x.beginPath(); pf(x); x.clip();
        brush(x, rb, {
          col: deep, w: 30 + d.rx * 0.07, alpha: 0.2, bristles: 5,
          seed: o.seed + 300 + i * 7 + side2, dens: 8, dry: 0.3, taper: 0.5, spread: 1.1
        });
        x.restore();
      });
      textureThrough(x, craze, pf, 0.42, -180 - i * 90, -110 - i * 50);
    }
    /* the underside, where the rim turns away from you */
    for (i = 0; i < d.n; i++) {
      brush(x, [d.rimEnd[i], [d.scal[i][0], d.scal[i][1] - 14], d.rimEnd[i + 1]], {
        col: mix(o.shade, '#000000', 0.35), w: 15, alpha: 0.28, bristles: 3, seed: o.seed + 70 + i, dens: 7, dry: 0.36
      });
    }
    /* Only the faint lit crest where the fabric rides over the rib. A drawn
       seam, and especially a dashed one, turns the canopy into a diagram. */
    for (i = 1; i < d.n; i++) {
      brush(x, d.ribs[i], {
        col: mix(o.shade, o.lit, 0.42), w: 5, alpha: 0.18, bristles: 2,
        seed: o.seed + 40 + i, dens: 9, dry: 0.5, taper: 0.45, arc: 1.1
      });
    }
    /* Charcoal contour, swelling and dropping out round the shape. Two passes
       offset against each other so it doubles in places, the way a line gets
       gone over. */
    contour(x, out, { col: P.char, w: 19, seed: o.seed + 3, arc: 0.4, vary: 24 });
    /* At night a cold light catches the wet shoulders of the canopy only */
    if (o.night) {
      brush(x, shrinkPts(out.slice(0, Math.round(out.length * 0.55)), 0.97), {
        col: mix(o.lit, '#e8b878', 0.45), w: 9, alpha: 0.15, bristles: 2,
        seed: o.seed + 9, dens: 8, dry: 0.5, arc: 1.5
      });
    }
    /* finial */
    brush(x, [[d.A[0], d.A[1] + 10], [d.A[0] + 3, d.A[1] - 58]], {
      col: P.bark, w: 13, alpha: 0.9, bristles: 3, seed: o.seed + 5, dens: 6, taper: 0.6
    });
    x.beginPath(); x.arc(d.A[0] + 3, d.A[1] - 62, 10, 0, TAU);
    x.fillStyle = P.bark; x.fill();
    return out;
  }

  /* the handle is deliberately a size too thin for the canopy above it */
  function handle(x, cx, top, bottom, o) {
    var bend = o.bend || 4, w = o.w || 17;
    var shaft = [[cx, top], [cx + bend, (top + bottom) / 2], [cx + bend * 0.4, bottom - 132]];
    brush(x, shaft, { col: o.dark || P.bark, w: w + 7, alpha: 0.45, bristles: 2, seed: o.seed + 1, dens: 9, ribbon: true, spread: 0.5 });
    brush(x, shaft, { col: o.col || P.wood, w: w, alpha: 0.95, bristles: 3, seed: o.seed, dens: 9, vary: 14, ribbon: true, spread: 0.46 });
    /* The highlight is one lit edge running the length of the shaft. Arc
       modulation strong enough to drop it out turned it into a row of pale
       ticks, so it only thins here and there. */
    brush(x, movePts(shaft, -w * 0.28, 0), {
      col: mix(o.col || P.wood, '#ffffff', 0.55), w: w * 0.26, alpha: 0.3,
      bristles: 1, seed: o.seed + 2, dens: 9, arc: 0.3, ribbon: true
    });
    brush(x, movePts(shaft, w * 0.34, 0), {
      col: o.dark || P.bark, w: w * 0.3, alpha: 0.4,
      bristles: 1, seed: o.seed + 6, dens: 9, arc: 0.3, ribbon: true
    });
    var crook = [[cx + bend * 0.4, bottom - 132], [cx - 26, bottom - 40], [cx + 46, bottom - 2], [cx + 96, bottom - 62]];
    brush(x, crook, { col: o.dark || P.bark, w: w + 6, alpha: 0.45, bristles: 2, seed: o.seed + 3, dens: 10, ribbon: true, spread: 0.5 });
    brush(x, crook, { col: o.col || P.wood, w: w, alpha: 0.95, bristles: 3, seed: o.seed + 4, dens: 10, vary: 14, ribbon: true, spread: 0.46 });
  }

  var SW = 900, SH = 1240, FX = 450, FY = 1180;

  var SHAPE = {
    red: { cy: FY - 500, rx: 292, ry: 236, n: 7, sag: 62, bulge: 54, hb: 12, hw: 23 },
    blue: { cy: FY - 606, rx: 230, ry: 306, n: 6, sag: 50, bulge: 40, hb: -18, hw: 17 },
    small: { cy: FY - 236, rx: 122, ry: 110, n: 6, sag: 30, bulge: 22, hb: 7, hw: 13 }
  };
  var TONE = {
    /* One temperature with narrow contrast inside it. The old set reached out
       to cadmium orange, and that panel read as a different colour stuck on
       rather than light moving across the same red. */
    red: { cols: [P.verm, '#d8302a', '#bf1f26', '#b8181f', '#e03a2e', '#961218', '#c8242a'], lit: '#ff9a6a', shade: '#420a0e' },
    blue: { cols: [P.turq, '#0a86b8', '#0d6e94', '#0a5a7c', '#12a0cc', '#084a68'], lit: '#b8eef6', shade: '#04202e' },
    small: { cols: [P.amber, '#e8ac10', '#FFD700', '#c98a10', '#f0c020', '#b87c08'], lit: '#fff7c8', shade: '#6b3e04' }
  };

  /* The second mode is this same street after dark -- they have been at it
     that long -- rather than a fabric-collage "data" register. The collage
     version came out as dashed stitching and white die-cut edges, which is
     the slate-diagram failure the brief rules out. Night is reached by
     grading her own hues down into the navy family and letting a cold rim
     light catch the top of each canopy. */
  function nightTone(tone) {
    return {
      cols: tone.cols.map(function (c) { return mix(c, '#0a1a2e', 0.56); }),
      lit: mix(tone.lit, '#7aa8cc', 0.5),
      shade: mix(tone.shade, '#02070f', 0.6)
    };
  }

  function umbrella(kind, night) {
    var p = plate(SW, SH), x = p.x, sh = SHAPE[kind];
    var tone = night ? nightTone(TONE[kind]) : TONE[kind];
    var d = dome(FX, sh.cy, sh.rx, sh.ry, sh.n, sh.sag, sh.bulge,
      kind === 'red' ? 71 : kind === 'blue' ? 72 : 73);
    d.sag = sh.sag;
    paintDome(x, d, { seed: kind === 'red' ? 101 : kind === 'blue' ? 202 : 303, night: night, cols: tone.cols, lit: tone.lit, shade: tone.shade });
    handle(x, FX + 4, sh.cy, FY, {
      seed: 111 + sh.rx, bend: sh.hb, w: sh.hw,
      col: (function (c) { return night ? mix(c, '#0a1a2e', 0.5) : c; })(
        kind === 'blue' ? '#4a3a2a' : kind === 'small' ? '#c98a3a' : P.wood),
      dark: night ? mix(P.bark, '#02070f', 0.5) : P.bark
    });
    return p;
  }

  var UMB = {
    red: umbrella('red', false), blue: umbrella('blue', false), small: umbrella('small', false),
    redN: umbrella('red', true), blueN: umbrella('blue', true), smallN: umbrella('small', true)
  };

  /* the red one goes inside out, which is what it gets for shouting */
  function flipped(night) {
    var p = plate(SW, SH), x = p.x, sh = SHAPE.red;
    var gd = function (c, k) { return night ? mix(c, '#0a1a2e', k == null ? 0.56 : k) : c; };
    var fy = sh.cy - 40;
    var d = dome(FX, sh.cy, sh.rx * 0.92, sh.ry * 0.78, sh.n, sh.sag, sh.bulge, 71);
    var mir = function (q) { return [q[0], 2 * fy - q[1]]; };
    var dm = {
      A: mir(d.A), rimEnd: d.rimEnd.map(mir), scal: d.scal.map(mir), n: d.n,
      ribs: d.ribs.map(function (rb) { return rb.map(mir); }),
      cx: d.cx, cy: fy, rx: d.rx, ry: d.ry, sag: sh.sag
    };
    var out = outlineOf(dm), i;
    envelope(x, out, { w: 16, seed: 401, col: '#141210', fillCol: gd('#4a0c10'), halo: 2, blur: 30, haloA: 0.5, hox: 9, hoy: 13 });
    for (i = 0; i < dm.n; i++) {
      var pan = [dm.A, dm.ribs[i][1], dm.rimEnd[i], dm.scal[i], dm.rimEnd[i + 1], dm.ribs[i + 1][1]];
      var pf = function (k) { curve(k, pan, true); };
      var base = gd(mix('#7a1418', '#320608', ((i % 3) / 3)));
      impasto(x, pf, {
        base: base, cols: [base, mix(base, gd('#e4382b'), 0.3), gd('#2a0604'), mix(base, gd('#961218'), 0.4)],
        bb: [dm.cx - 340, fy - 300, 680, 600], seed: 410 + i, n: 24, kw: 22,
        angle: 1.3, spreadA: 0.8, stipple: 70, crease: 26, lit: gd('#e4382b'), shade: gd('#1e0402')
      });
      textureThrough(x, craze, pf, 0.5, -300 - i * 60, -400);
    }
    /* Ribs now show as the lit crest of the fabric folded back over them.
       Cream lines with dry gaps came out as rows of white dashes, which read
       as stitching on a sticker. */
    for (i = 1; i < dm.n; i++) {
      brush(x, dm.ribs[i], {
        col: gd('#b8443a'), w: 7, alpha: 0.3, bristles: 2, seed: 440 + i,
        dens: 9, dry: 0.3, taper: 0.5, arc: 1.15
      });
      brush(x, movePts(dm.ribs[i], 4, 4), {
        col: gd('#2a0604'), w: 11, alpha: 0.26, bristles: 3, seed: 450 + i,
        dens: 9, dry: 0.25, taper: 0.5, arc: 0.9
      });
    }
    contour(x, out, { col: '#141210', w: 18, seed: 403, arc: 0.45, vary: 16 });
    handle(x, FX + 4, dm.A[1] - 6, FY, {
      seed: 111 + sh.rx, bend: 12, w: 23,
      col: night ? mix(P.wood, '#0a1a2e', 0.5) : P.wood,
      dark: night ? mix(P.bark, '#02070f', 0.5) : P.bark
    });
    return p;
  }
  var FLIP = flipped(false), FLIPN = flipped(true);

  /* ---------------- rain, hand-animated at twelve a second ---------------- */
  /* Rain is mostly weather, not drops. Thick near-white slashes read as
     scratches in the film or shards of plastic, so the bulk of it is a
     translucent directional veil in the greys of the air, and only a few
     thin streaks are allowed to catch the light. */
  function rain(x, u, dens, night, front) {
    var step = Math.floor(u * 12), r = rnd(step * 7919 + (front ? 991 : 13)), i;
    var gust = 0.3 + 0.16 * Math.sin(step * 0.31);
    var veil = night ? '#4a6478' : '#cdd3d2';
    for (i = 0; i < Math.round(dens * 0.42); i++) {
      var vx = -200 + r() * (W + 400), vy = -140 + r() * (H + 280);
      var vL = 260 + r() * 460;
      brush(x, [[vx, vy], [vx - vL * gust * 0.5, vy + vL * 0.5], [vx - vL * gust, vy + vL]], {
        col: jit(veil, r, 16), w: 34 + r() * 86, alpha: 0.018 + r() * 0.034,
        bristles: 5, seed: (r() * 1e6) | 0, dens: 6, taper: 0.8, spread: 1.1, fade: true
      });
    }
    for (i = 0; i < Math.round(dens); i++) {
      var sx = -140 + r() * (W + 280), sy = -80 + r() * (H + 160);
      var L = (front ? 150 : 70) + r() * (front ? 260 : 150);
      brush(x, [[sx, sy], [sx - L * gust, sy + L]], {
        col: night ? mix(P.lampPl, '#ffffff', front ? 0.4 : 0.16) : mix(P.pale, '#ffffff', front ? 0.42 : 0.1),
        w: (front ? 1.6 : 1.1) + r() * (front ? 2.6 : 1.5),
        alpha: front ? 0.1 + r() * 0.2 : 0.05 + r() * 0.1,
        bristles: 1, seed: (r() * 1e6) | 0, dens: 4, taper: 0.75, fade: true
      });
    }
    if (front) return;
    /* rings, struck as broken arcs rather than drawn as ellipses */
    for (var k = 0; k < 4; k++) {
      var px = 200 + r() * 700, py = 866 + r() * 116, rr = 12 + r() * 46;
      brush(x, blobPts(px, py, rr, rr * 0.27, (r() * 1e5) | 0, 11, 0.16), {
        col: night ? P.lampPl : '#ffffff', w: 2 + r() * 2.4, alpha: 0.06 + r() * 0.1,
        bristles: 1, close: true, seed: (r() * 1e6) | 0, dens: 6, dry: 0.4, arc: 1.4
      });
    }
  }

  /* Water thrown off the rim when they collide. Straight near-opaque rays out
     of the collision point read as scratches in the film, so each throw is a
     thrown arc that falls off, thin and half-transparent, with the weight in
     a bead at its head. */
  function flick(x, u) {
    var r = rnd(Math.floor(u * 12) * 31 + 7);
    for (var i = 0; i < 14; i++) {
      var a = -2.2 + r() * 1.9, L = 46 + r() * 110;
      var sx = 470 + r() * 150, sy = 430 + r() * 90;
      var ex = sx + Math.cos(a) * L, ey = sy + Math.sin(a) * L + L * 0.34;
      brush(x, [[sx, sy],
        [sx + Math.cos(a) * L * 0.55, sy + Math.sin(a) * L * 0.55], [ex, ey]], {
        col: mix(P.pale, '#ffffff', 0.4), w: 2.2 + r() * 2.6, alpha: 0.16 + r() * 0.2,
        bristles: 1, seed: (r() * 1e6) | 0, dens: 6, taper: 0.9, fade: true
      });
      x.beginPath();
      x.ellipse(ex, ey, 2.2 + r() * 3, 3 + r() * 4, a, 0, TAU);
      x.fillStyle = rgba(mix(P.pale, '#ffffff', 0.6), 0.3 + r() * 0.26);
      x.fill();
      if (r() < 0.4) {
        var ex = sx + Math.cos(a) * L, ey = sy + Math.sin(a) * L;
        x.beginPath(); x.arc(ex, ey, 3 + r() * 5, 0, TAU);
        x.fillStyle = rgba('#ffffff', 0.5); x.fill();
      }
    }
  }

  var asideP = (function () {
    var p = plate(W, H), x = p.x;
    hand(x, 'you started it', 74, 118, 68, { col: mix(P.char, P.verm, 0.35), seed: 811, w: 0.1, bristles: 3, alpha: 0.86 });
    return p;
  })();

  /* the rain, counted: chaos snapping to order */
  /* Somebody has been keeping score of the argument in chalk on the wall.
     Three and a bit groups scratched into one corner, each mark leaning its
     own way -- twelve even groups ruled across the top of the square read as
     a bar chart, which is the register the brief rules out. */
  var TALLY = (function () {
    var t = [], g, i, r = rnd(1907);
    for (g = 0; g < 4; g++) {
      var bx = 806 + (g % 2) * 104 + (r() - 0.5) * 26;
      var by = 116 + ((g / 2) | 0) * 116 + (r() - 0.5) * 22;
      var upto = g === 3 ? 2 : 4;
      for (i = 0; i < upto; i++) {
        var mx0 = bx + i * (19 + r() * 7);
        t.push([mx0, by + (r() - 0.5) * 10, mx0 - 5 - r() * 9, by + 52 + r() * 18, 0]);
      }
      if (g < 3) t.push([bx - 14, by + 56 + r() * 10, bx + 68 + r() * 12, by - 8 + r() * 10, 1]);
    }
    return t;
  })();

  function tallies(x, p) {
    var n = TALLY.length, upto = p * n;
    for (var i = 0; i < n && i <= upto; i++) {
      var m = TALLY[i], f = clamp01(upto - i);
      brush(x, [[m[0], m[1]], [m[0] + (m[2] - m[0]) * f, m[1] + (m[3] - m[1]) * f]], {
        col: m[4] ? mix(P.amber, P.cream, 0.4) : mix(P.cream, P.lampPl, 0.45),
        w: m[4] ? 7 : 6, alpha: 0.3, bristles: 2, seed: 900 + i, dens: 4, taper: 0.6, fade: true
      });
    }
  }

  /* paint-on order: red first (it is louder), then blue, then the small one */
  var castStrokes = [
    { pts: [[60, 560], [330, 300], [620, 570]], w: 330 },
    { pts: [[70, 660], [330, 520], [630, 680]], w: 280 },
    { pts: [[336, 420], [342, 760], [348, 1030]], w: 130 },
    { pts: [[510, 480], [740, 200], [980, 500]], w: 290 },
    { pts: [[520, 590], [740, 450], [980, 600]], w: 240 },
    { pts: [[744, 300], [748, 700], [752, 1050]], w: 120 },
    { pts: [[856, 780], [960, 690], [1070, 790]], w: 170 },
    { pts: [[962, 730], [964, 900], [966, 1000]], w: 100 }
  ];
  var castRev = new Reveal(W, H, castStrokes);

  /* The rain washes the scene off the square left to right. Full-height
     strokes revealed in order gave a straight vertical edge that sliced the
     umbrellas in half like a blind coming down, so the sweep advances in
     bands of short overlapping runs and its front stays torn. */
  var washStrokes = (function () {
    var s = [], r = rnd(303), bands = 22, per = 4;
    for (var b = 0; b < bands; b++) {
      var bx = -70 + (b / (bands - 1)) * 1220 + (r() - 0.5) * 54;
      var ys = [];
      for (var k = 0; k < per; k++) ys.push(-110 + (k / (per - 1)) * 1300 + (r() - 0.5) * 150);
      for (var k2 = ys.length - 1; k2 > 0; k2--) {
        var sw = (r() * (k2 + 1)) | 0, tmp = ys[k2]; ys[k2] = ys[sw]; ys[sw] = tmp;
      }
      ys.forEach(function (y0) {
        var L = 470 + r() * 330, x0 = bx + (r() - 0.5) * 60;
        s.push({
          pts: [[x0, y0 - L / 2], [x0 + (r() - 0.5) * 70, y0], [x0 + (r() - 0.5) * 90, y0 + L / 2]],
          w: 140 + r() * 80
        });
      });
    }
    return s;
  })();
  var washRev = new Reveal(W, H, washStrokes);
