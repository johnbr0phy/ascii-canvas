
  /* ===========================================================
     02 — TWO UMBRELLAS, HAVING WORDS

     Mode A  wet daylight: putty air, two hot canopies too close
     Mode B  the same street after dark — they have been at it that
             long — graded down into navy with one lamp

     The two bases never move. Everything that happens happens as a
     change of lean about those two points, so every mode snap, every
     cut and every scale jump is a match-cut on the same pair.
     =========================================================== */
  var T = {
    hb: [[0, 'A'], [0.40, 'B'], [0.54, 'A'], [0.68, 'B'], [0.82, 'A']],
    lean: 1.00,
    macroRim: 1.42, rimIris: 1.66, rimIrisOut: 1.80,
    wide: 1.98, traj: 2.06,
    lens: 2.50, burst: 3.26,
    clash: 3.30, flip: 3.46,
    chaos: 3.68, grid: 4.68, brk: 5.18, back: 5.42,
    branch: 5.86,
    mc: [[6.58, 'A'], [6.74, 'B'], [6.88, 'A'], [7.00, 'B']],
    macroPud: 7.10, pudRings: 7.34, macroPudA: 7.88,
    strike: 8.16,
    /* [t, mode, z, x, y] — framing is part of the cut, not a separate move */
    strikeCuts: [
      [8.16, 'B', 1.00, 540, 540], [8.32, 'A', 1.00, 540, 540],
      [8.46, 'B', 1.55, 380, 340], [8.60, 'A', 1.55, 380, 340],
      [8.74, 'B', 1.00, 540, 540], [8.88, 'A', 1.62, 760, 300],
      [9.02, 'B', 1.62, 760, 300], [9.16, 'B', 1.30, 560, 890],
      [9.30, 'A', 1.30, 560, 890], [9.44, 'B', 1.00, 540, 540]
    ],
    breathe: 9.62, aside: 10.02, mark: 10.94,
    wash: 11.42, home: 12.86
  };

  var CAM = [
    { t: 0.00, x: 540, y: 540, z: 1.00 },
    { t: 0.90, x: 528, y: 524, z: 1.04, mode: 'drift' },
    { t: 1.42, x: 540, y: 540, z: 1.00 },
    { t: 1.98, x: 556, y: 560, z: 1.06, mode: 'drift' },
    { t: 2.50, x: 540, y: 540, z: 1.00 },
    { t: 3.26, x: 540, y: 540, z: 1.03, mode: 'drift' },
    { t: 3.30, x: 540, y: 470, z: 1.14 },
    { t: 3.68, x: 540, y: 524, z: 1.06 },
    { t: 4.68, x: 540, y: 528, z: 1.05 },
    { t: 5.18, x: 540, y: 528, z: 1.05 },
    { t: 5.42, x: 540, y: 540, z: 1.00 },
    { t: 5.86, x: 560, y: 700, z: 1.16, mode: 'drift' },
    { t: 6.58, x: 540, y: 540, z: 1.00 },
    { t: 7.10, x: 540, y: 540, z: 1.00 },
    { t: 7.88, x: 540, y: 540, z: 1.00 },
    { t: 8.16, x: 540, y: 540, z: 1.00 },
    { t: 9.62, x: 540, y: 540, z: 1.05, mode: 'drift' },
    { t: 11.42, x: 540, y: 540, z: 1.00 },
    { t: 13.50, x: 540, y: 540, z: 1.00, mode: 'drift' }
  ];

  /* ---------------- who stands where ----------------
     Three feet on the pavement. They are the anchors of every match-cut
     in the film, so they are constants and nothing is allowed to move
     them: only the angle above them changes. */
  var RB = [332, 1034], BB = [750, 1046], SB = [968, 1004];

  /* the lean of each one, in radians about its own foot. The small one's
     sway is keyed to the loop length so the seam has nothing to catch on. */
  function openR(u) { return 0.020 + Math.sin(u * 2.1) * 0.014; }
  function openB(u) { return -0.024 + Math.sin(u * 1.6 + 1) * 0.012; }
  function leans(u) {
    var rr, bb, ss = Math.sin(u * TAU * 2 / DUR) * 0.018;
    if (u < T.lean) {
      /* breathing: barely a rock, both of them still being polite */
      rr = openR(u); bb = openB(u);
    } else if (u < T.clash) {
      /* three shoves in, each one further than the last */
      var p = clamp01((u - T.lean) / (T.clash - T.lean));
      var push = ease(p) * 0.11 + Math.abs(Math.sin(p * Math.PI * 3.1)) * 0.035;
      rr = 0.020 + push; bb = -0.024 - push * 0.92;
    } else if (u < T.chaos) {
      /* contact, then the red one is knocked off its own argument */
      var q = ease(clamp01((u - T.clash) / 0.3));
      rr = lerp(0.165, -0.115, q); bb = lerp(-0.155, -0.058, q);
    } else if (u < T.back) {
      rr = -0.115; bb = -0.058;
    } else if (u < T.wash) {
      /* the aftermath: the red one stays leaning away, the blue one has
         nothing more to say and stands up straight, which is worse */
      var w = ease(clamp01((u - T.back) / 0.8));
      rr = lerp(-0.115, -0.086, w); bb = lerp(-0.058, -0.004, w);
    } else {
      /* the rain takes it all off and puts them back where they began, which
         is the only way a loop of this can be honest */
      var z = ease(clamp01((u - T.wash) / (DUR - T.wash)));
      rr = lerp(-0.086, openR(0), z); bb = lerp(-0.004, openB(0), z);
    }
    return [rr, bb, ss];
  }
  var HOME = [openR(0), openB(0), 0];

  function umb(p, base, ang, sc, a) {
    X.save();
    X.globalAlpha = a == null ? 1 : a;
    X.translate(base[0], base[1]);
    X.rotate(ang);
    if (sc && sc !== 1) X.scale(sc, sc);
    X.drawImage(p.c, -FX, -FY);
    X.restore();
    X.globalAlpha = 1;
  }

  /* the three of them, in whichever light, in whatever state */
  function cast(u, night, o) {
    o = o || {};
    var L = o.leans || leans(u);
    var redP = o.flip ? (night ? FLIPN : FLIP) : (night ? UMB.redN : UMB.red);
    umb(night ? UMB.smallN : UMB.small, SB, L[2], 1, o.aSmall == null ? 1 : o.aSmall);
    umb(night ? UMB.blueN : UMB.blue, BB, L[1], 1, o.aBlue == null ? 1 : o.aBlue);
    umb(redP, RB, L[0], 1, o.aRed == null ? 1 : o.aRed);
  }

  function drawA(u, o) {
    X.drawImage(gStreet.c, 0, 0);
    rain(X, u, 62, false, false);
    cast(u, false, o);
    rain(X, u, 30, false, true);
  }
  function drawB(u, o) {
    X.drawImage(gNight.c, 0, 0);
    rain(X, u, 62, true, false);
    cast(u, true, o);
    rain(X, u, 30, true, true);
  }

  /* ---------------- SCALE JUMP 1: the two rims and the gap ----------------
     Painted at the size it is shown. Two canopies enlarged until only one
     shoulder of each is in the square and all that is left between them is
     a hand's width of falling rain. */
  function rimPlate(night) {
    var p = plate(W, H), x = p.x;
    x.drawImage((night ? gNight : gStreet).c, 0, 0);
    /* the air between them, before the two masses go over it */
    rain(x, night ? 0.4 : 0.1, 44, night, false);
    var A = dome(-150, 760, 772, 610, 7, 152, 140, 71);
    A.sag = 152;
    var B = dome(1372, 690, 706, 650, 6, 142, 122, 72);
    B.sag = 142;
    var tr = night ? nightTone(TONE.red) : TONE.red;
    var tb = night ? nightTone(TONE.blue) : TONE.blue;
    paintDome(x, A, { seed: 1101, night: night, cols: tr.cols, lit: tr.lit, shade: tr.shade });
    paintDome(x, B, { seed: 1202, night: night, cols: tb.cols, lit: tb.lit, shade: tb.shade });
    /* rain caught in the slot between them, brighter because it is the only
       thing back there with any light on it */
    x.save();
    x.beginPath(); x.moveTo(556, -40); x.lineTo(716, -40); x.lineTo(760, 1120); x.lineTo(500, 1120); x.closePath();
    x.clip();
    rain(x, night ? 0.6 : 0.25, 90, night, true);
    x.restore();
    /* water gathering along the near rim of each and letting go */
    var r = rnd(night ? 660 : 661);
    [A, B].forEach(function (d, di) {
      d.scal.forEach(function (s, k) {
        if (s[0] < -60 || s[0] > 1140) return;
        drip(x, s[0] + (r() - 0.5) * 20, s[1] - 6, 60 + r() * 130, 7 + r() * 7,
          night ? '#7aa8cc' : mix(P.pale, '#ffffff', 0.5), 900 + di * 31 + k);
      });
    });
    textureThrough(x, craze, function (c) { c.rect(0, 0, W, H); }, night ? 0.4 : 0.3, -220, -160);
    return p;
  }
  var rimA = rimPlate(false), rimB = rimPlate(true);

  /* ---------------- SCALE JUMP 2: the puddle, close ----------------
     The argument has got into the water and is carrying on down there,
     which is the gag: two colours refusing to mix in half an inch of rain. */
  function pudPlate(night) {
    var p = plate(W, H), x = p.x, r = rnd(night ? 1441 : 1442);
    ground(x, W, H, {
      base: night ? '#071018' : '#33403f', seed: night ? 51 : 52,
      tints: night ? ['#040a12', '#0d1c2a', '#123044', '#020509']
        : ['#26312f', '#425250', '#5c6a66', '#1b2422'],
      mottle: 120, sweeps: 70, scrape: 40, drift: 26,
      dark: '#000000', light: night ? '#5a86a8' : '#b8c4c0', vignette: 0.5
    });
    /* two colours let into the water and dragged, meeting in the middle
       without either giving way */
    [[P.verm, -1, 1], [P.turq, 1, -1]].forEach(function (side, si) {
      var col = night ? mix(side[0], '#0a1a2e', 0.4) : side[0];
      for (var i = 0; i < 26; i++) {
        var cx0 = 540 + side[1] * (60 + r() * 470);
        var y0 = 60 + r() * 960;
        brush(x, [[cx0 + side[1] * 90, y0], [cx0, y0 + 40 + r() * 60], [cx0 - side[1] * (40 + r() * 130), y0 + 120 + r() * 160]], {
          col: jit(col, r, 44), w: 40 + r() * 130, alpha: 0.1 + r() * 0.24,
          bristles: 5, seed: (r() * 1e6) | 0, dens: 5, dry: 0.24, spread: 1.1, taper: 0.5
        });
      }
      void si;
    });
    /* the seam where they meet: not mixed, just pushing at each other */
    for (var s = 0; s < 16; s++) {
      var sy = -60 + r() * 1200;
      brush(x, [[520 + (r() - 0.5) * 90, sy], [560 + (r() - 0.5) * 110, sy + 130], [530 + (r() - 0.5) * 90, sy + 280]], {
        col: night ? '#2a1a34' : '#4a2a44', w: 26 + r() * 60, alpha: 0.1 + r() * 0.14,
        bristles: 4, seed: (r() * 1e6) | 0, dens: 5, dry: 0.3, spread: 1.1
      });
    }
    /* surface: wind, and the shiver of something landing */
    for (var b = 0; b < 150; b++) {
      var by = r() * H, bx0 = r() * W, bl = 10 + Math.pow(r(), 2) * 340;
      brush(x, [[bx0, by], [bx0 + bl * 0.5, by + (r() - 0.5) * 8], [bx0 + bl, by + (r() - 0.5) * 12]], {
        col: night ? mix(P.lampPl, '#ffffff', 0.4) : mix(P.pale, '#ffffff', 0.55),
        w: 2 + r() * 8, alpha: 0.06 + r() * 0.18, bristles: 1,
        seed: (r() * 1e6) | 0, dens: 6, taper: 0.8, ribbon: true
      });
    }
    textureThrough(x, craze, function (c) { c.rect(0, 0, W, H); }, night ? 0.44 : 0.32, -120, -300);
    return p;
  }
  var pudB = pudPlate(true), pudA = pudPlate(false);

  /* ---------------- the swatches ----------------
     CHAOS → GRID. When they finally collide the canopies come apart into
     torn panels of fabric, and for half a second those panels line up as a
     colour chart: the whole row, ruled up and counted, the way you would
     file a disagreement if a disagreement could be filed. */
  var SHARDS = (function () {
    var out = [], r = rnd(2323), i;
    var sets = [
      { t: TONE.red, n: 5 }, { t: TONE.blue, n: 5 }, { t: TONE.small, n: 2 }
    ];
    var k = 0;
    sets.forEach(function (set) {
      for (i = 0; i < set.n; i++) {
        var s = 150, p = plate(s * 2, s * 2), x = p.x;
        var quad = jagPoly([[s - 96 - r() * 30, s - 104 - r() * 26], [s + 92 + r() * 34, s - 96 - r() * 30],
          [s + 84 + r() * 30, s + 104 + r() * 24], [s - 100 - r() * 26, s + 92 + r() * 30]], (r() * 1e5) | 0, 7, 22);
        var base = set.t.cols[i % set.t.cols.length];
        var pf = function (c) { curve(c, quad, true); };
        envelope(x, quad, { w: 12, seed: 2400 + k, col: '#141210', fillCol: set.t.shade, halo: 2, blur: 22, haloA: 0.45, hox: 6, hoy: 9 });
        impasto(x, pf, {
          base: base, cols: [base, mix(base, set.t.lit, 0.3), mix(base, set.t.shade, 0.35), mix(base, set.t.lit, 0.12)],
          bb: [s - 150, s - 150, 300, 300], seed: 2500 + k, n: 20, kw: 26,
          angle: r() * TAU, spreadA: 0.8, stipple: 70, crease: 26, lit: set.t.lit, shade: set.t.shade
        });
        textureThrough(x, craze, pf, 0.44, -200 - k * 70, -140 - k * 40);
        contour(x, quad, { col: P.char, w: 13, seed: 2600 + k, arc: 0.42, vary: 20 });
        out.push({ p: p, c: s, night: null, tone: set.t });
        k++;
      }
    });
    /* the night set: the same torn panels under the lamp */
    out.forEach(function (sh) {
      var s = sh.c, p = plate(s * 2, s * 2);
      p.x.save();
      p.x.filter = 'none';
      p.x.drawImage(sh.p.c, 0, 0);
      /* graded down by laying the navy over it and letting one cold edge
         catch, rather than repainting: it has to be the same torn panel */
      p.x.globalCompositeOperation = 'source-atop';
      p.x.fillStyle = rgba('#0a1a2e', 0.56);
      p.x.fillRect(0, 0, s * 2, s * 2);
      p.x.restore();
      sh.n = p;
    });
    return out;
  })();

  /* ---------------- BRANCHING ----------------
     The water coming off the low corner of the flipped red canopy gives up
     being one run and becomes a family of them down the pavement into the
     puddle. */
  var TREE = makeBranch({
    x: 258, y: 620, ang: 1.32, len: 190, depth: 3, seed: 818,
    spread: 0.62, shrink: 0.68, w: 17, wobble: 0.38, step: 0.3
  });

  /* the arcs that measure the argument: how far each one is leaning, thrown
     from apex to apex and back, in the biro of someone marking homework */
  function apexOf(base, ang, sh) {
    var up = FY - (sh.cy - sh.ry);
    return [base[0] + Math.sin(ang) * up, base[1] - Math.cos(ang) * up];
  }

  function strikeIndex(u) {
    var i = 0;
    for (var k = 0; k < T.strikeCuts.length; k++) if (u >= T.strikeCuts[k][0]) i = k; else break;
    return i;
  }

  /* ---------------- the thirteen and a half seconds ---------------- */
  function draw(t) {
    var u = ((t % DUR) + DUR) % DUR, bj = boil(u);
    var v = camAt(u, CAM);
    if (u >= T.strike && u < T.breathe) {
      var sc0 = T.strikeCuts[strikeIndex(u)];
      v = { x: sc0[3], y: sc0[4], z: sc0[2] };
    }
    var sh = shake(u,
      u >= T.clash && u < T.chaos ? 9 :
      u >= T.chaos && u < T.grid ? 5 :
      u >= T.strike && u < T.breathe ? 3 : 0);
    X.setTransform(1, 0, 0, 1, 0, 0);
    X.clearRect(0, 0, W, H);
    X.save();
    X.translate((bj ? 0.9 : -0.8) + sh[0], (bj ? -0.7 : 1.0) + sh[1]);
    applyCam(X, v, W, H);

    if (u < T.macroRim) {
      /* --- breathe, then the heartbeat: four snaps between the wet
         afternoon and the same street at night, nobody moving --- */
      if (held(u, T.hb) === 'A') drawA(u); else drawB(u);

    } else if (u < T.wide) {
      /* --- SCALE JUMP 1: two rims and the gap between them --- */
      X.drawImage(rimA.c, 0, 0);
      rain(X, u, 26, false, true);
      if (u >= T.rimIris && u < T.rimIrisOut) {
        /* night blinks through the slot for two frames */
        var ir = 190 + 130 * ease((u - T.rimIris) / 0.12);
        var ip = lensPath(636, 520, ir, 47);
        lensThrough(X, ip, function (c) { c.drawImage(rimB.c, 0, 0); });
        lensRim(X, ip, { seed: 47, w: 14, bw: 8 });
      }

    } else if (u < T.lens) {
      /* --- back out wide, and somebody measures the lean --- */
      drawA(u);
      var L0 = leans(u);
      var ra = apexOf(RB, L0[0], SHAPE.red), ba = apexOf(BB, L0[1], SHAPE.blue);
      var tf = clamp01((u - T.traj) / 0.26);
      arcThrow(X, ra[0], ra[1], ba[0], ba[1], -0.3, tf, { col: P.char, w: 6, alpha: 0.4, seed: 4401, headCol: P.verm });
      arcThrow(X, ba[0], ba[1], ra[0], ra[1], -0.3, clamp01(tf * 1.5 - 0.4), { col: P.char, w: 6, alpha: 0.4, seed: 4402, headCol: P.turq });
      /* and the angle of each lean, ticked off at the foot */
      [[RB, L0[0], P.verm], [BB, L0[1], P.turq]].forEach(function (a, i) {
        var af = clamp01(tf * 1.6 - 0.5 - i * 0.12);
        if (af <= 0) return;
        var pts = [], n = 9;
        for (var q = 0; q <= n; q++) {
          var an = lerp(0, a[1], q / n);
          pts.push([a[0][0] + Math.sin(an) * 300, a[0][1] - Math.cos(an) * 300]);
        }
        brush(X, partial(pts, af), { col: a[2], w: 5, alpha: 0.45, bristles: 1, seed: 4410 + i, dens: 6, taper: 0.6, dry: 0.2 });
        brush(X, partial([[a[0][0], a[0][1]], [a[0][0], a[0][1] - 330]], af), {
          col: P.char, w: 3, alpha: 0.28, bristles: 1, seed: 4420 + i, dens: 6, dry: 0.45
        });
      });

    } else if (u < T.burst) {
      /* --- REVEALING LENS: a hole in the afternoon, dragged across the
         square at head height, with the night in it --- */
      drawA(u);
      var lp = (u - T.lens) / (T.burst - T.lens);
      var cx = lerp(148, 934, ease(lp)), cy = 452 + Math.sin(lp * Math.PI) * 78;
      var rad = 130 + 152 * ease(clamp01(lp * 1.5));
      var lpath = lensPath(cx, cy, rad, 47 + frameOf(u, 6));
      lensThrough(X, lpath, function (c) {
        c.drawImage(gNight.c, 0, 0);
        rain(c, u, 62, true, false);
        var save = X; X = c;
        cast(u, true, {});
        X = save;
        rain(c, u, 30, true, true);
      });
      lensRim(X, lpath, { seed: 47, w: 18, bw: 9 });
      /* the lamp only exists in the night pole, so inside the lens it is
         the one warm thing and it moves with the hole */
      crosshair(X, cx, cy, rad * 1.24, clamp01(lp * 3 - 0.4), { col: mix(P.amber, P.cream, 0.3), seed: 471, w: 5, alpha: 0.3 });

    } else if (u < T.clash) {
      /* --- the lens goes off and the frame goes with it --- */
      var bp = clamp01((u - T.burst) / 0.04);
      drawB(u);
      flash(X, mix(P.amber, '#ffffff', 0.4), 0.5 * (1 - bp), W, H);

    } else if (u < T.chaos) {
      /* --- CONTACT. Two frames of white water and the red one is inside
         out, which is what it gets for shouting. --- */
      var fl = u >= T.flip;
      if (held(u, [[T.clash, 'A'], [T.clash + 0.07, 'B'], [T.clash + 0.14, 'A'],
        [T.flip, 'A'], [T.flip + 0.08, 'B'], [T.flip + 0.15, 'A']]) === 'A') drawA(u, { flip: fl });
      else drawB(u, { flip: fl });
      flick(X, u);
      if (u < T.clash + 0.06) flash(X, '#ffffff', 0.42, W, H);
      if (u >= T.flip && u < T.flip + 0.05) flash(X, P.verm, 0.3, W, H);
      /* the shove, marked where it landed */
      var kf = clamp01((u - T.clash) / 0.3);
      ringsOut(X, 578, 372, 60, 300, 5, kf, { col: mix(P.cream, P.verm, 0.3), seed: 913, w: 7, alpha: 0.4, flat: 0.9 });

    } else if (u < T.grid) {
      /* --- CHAOS: twelve torn panels loose in the rain, counted as they
         go past --- */
      drawB(u, { aRed: 0, aBlue: 0, aSmall: 0.25, flip: true });
      var cf = ease(clamp01((u - T.chaos) / 0.3));
      var scatter = function (uu, aMul) {
        SHARDS.forEach(function (s, i) {
          var c = chaosAt(i, 7150, uu * 2.3, 540, 520, 460);
          X.save();
          X.globalAlpha = aMul;
          X.translate(lerp(578, c[0], cf), lerp(372, c[1], cf));
          X.rotate(c[2] * cf);
          var k = lerp(0.4, 0.62 * c[3] + 0.4, cf);
          X.scale(k, k);
          X.drawImage(s.n.c, -s.c, -s.c);
          X.restore();
        });
        X.globalAlpha = 1;
      };
      /* two earlier exposures behind the live one: a panel travelling this
         fast should smear, and without the smear it is an arrangement */
      scatter(u - 0.11, 0.14); scatter(u - 0.055, 0.28); scatter(u, 1);
      rain(X, u, 40, true, true);
      tallyMarks(X, 92, 962, 12, clamp01((u - T.chaos - 0.1) / 0.8),
        { col: mix(P.cream, P.lampPl, 0.4), seed: 71, w: 8, h: 50, gap: 21, cluster: 132 });

    } else if (u < T.brk) {
      /* --- GRID SNAP: for half a second the argument is a colour chart,
         ruled up by hand and counted --- */
      drawB(u, { aRed: 0, aBlue: 0, aSmall: 0.25, flip: true });
      var gf = clamp01((u - T.grid) / 0.16);
      SHARDS.forEach(function (s, i) {
        var g = gridAt(i, 4, 540, 528, 244, 232, 12);
        X.save();
        X.translate(g[0], g[1]); X.scale(0.74, 0.74);
        X.drawImage(s.n.c, -s.c, -s.c);
        X.restore();
      });
      SHARDS.forEach(function (s, i) {
        var g = gridAt(i, 4, 540, 528, 244, 232, 12);
        crosshair(X, g[0], g[1], 82, clamp01(gf * 1.5 - i * 0.04),
          { col: mix(P.cream, P.lampPl, 0.35), seed: 300 + i * 7, w: 4, alpha: 0.42 });
      });
      var bx0 = 540 - 1.5 * 244 - 92, bx1 = 540 + 1.5 * 244 + 92;
      var by0 = 528 - 232 - 88, by1 = 528 + 232 + 88;
      [[[bx0, by0], [540, by0 - 8], [bx1, by0 + 5]], [[bx1, by0], [bx1 + 7, 528], [bx1 - 4, by1]],
       [[bx1, by1], [540, by1 + 9], [bx0, by1 - 6]], [[bx0, by1], [bx0 - 8, 528], [bx0 + 5, by0]]]
        .forEach(function (side, k) {
          brush(X, partial(side, clamp01(gf * 2 - k * 0.22)), {
            col: mix(P.cream, P.lampPl, 0.4), w: 5, alpha: 0.4, bristles: 1, seed: 380 + k, dens: 6, dry: 0.3
          });
        });
      tallyMarks(X, 92, 962, 12, 1, { col: mix(P.cream, P.lampPl, 0.4), seed: 71, w: 8, h: 50, gap: 21, cluster: 132 });

    } else if (u < T.back) {
      /* --- and it breaks: the panels are thrown back where they came
         from, overshooting --- */
      var fp = (u - T.brk) / (T.back - T.brk);
      drawB(u, { aRed: 0, aBlue: 0, aSmall: 0.25, flip: true });
      SHARDS.forEach(function (s, i) {
        var g = gridAt(i, 4, 540, 528, 244, 232, 12);
        var p = over(clamp01(fp * (0.85 + (i % 3) * 0.1)));
        X.save();
        X.globalAlpha = 1 - clamp01(fp * 1.6 - 0.5);
        X.translate(lerp(g[0], 578, p), lerp(g[1], 372, p));
        X.rotate((1 - p) * 0.4 * (i % 2 ? 1 : -1));
        var k2 = lerp(0.74, 0.2, p);
        X.scale(k2, k2);
        X.drawImage(s.n.c, -s.c, -s.c);
        X.restore();
      });
      X.globalAlpha = 1;

    } else if (u < T.mc[0][0]) {
      /* --- the aftermath, in the dark: red inside out and leaning away,
         blue standing up straight, which is worse. The run-off from the
         broken corner branches down the pavement. --- */
      drawB(u, { flip: true });
      if (u >= T.branch) {
        drawBranch(X, TREE, clamp01((u - T.branch) / 0.55), {
          cols: [mix(P.lampPl, '#ffffff', 0.4), P.lampPl, mix(P.lampPl, P.turq, 0.4), mix(P.lampPl, '#5a7690', 0.5)],
          alpha: 0.5, seed: 55, taper: 0.65, dry: 0.2
        });
      }

    } else if (u < T.macroPud) {
      /* --- match-cut: four snaps on the aftermath, nothing moving --- */
      if (held(u, T.mc) === 'A') drawA(u, { flip: true }); else drawB(u, { flip: true });

    } else if (u < T.macroPudA) {
      /* --- SCALE JUMP 2: down into the puddle, where it is still going on.
         Two colours in half an inch of rain, refusing to mix. --- */
      X.drawImage(pudB.c, 0, 0);
      var pf2 = clamp01((u - T.pudRings) / 0.5);
      ringsOut(X, 400, 660, 40, 330, 5, pf2, { col: mix(P.lampPl, '#ffffff', 0.4), seed: 951, w: 6, alpha: 0.34, flat: 0.98 });
      ringsOut(X, 720, 340, 30, 260, 4, clamp01(pf2 * 1.4 - 0.3), { col: mix(P.lampPl, '#ffffff', 0.3), seed: 952, w: 5, alpha: 0.3, flat: 0.98 });
      crosshair(X, 540, 540, 420, clamp01((u - T.pudRings - 0.34) / 0.4), { col: mix(P.cream, P.lampPl, 0.3), seed: 953, w: 6, alpha: 0.32 });
      tallyMarks(X, 96, 972, 2, clamp01((u - T.pudRings - 0.5) / 0.25), { col: mix(P.cream, P.amber, 0.3), seed: 73, w: 9, h: 56, gap: 22 });

    } else if (u < T.strike) {
      /* --- the same half inch of water in the afternoon --- */
      X.drawImage(pudA.c, 0, 0);
      rain(X, u, 30, false, true);

    } else if (u < T.breathe) {
      /* --- STRIKE: ten cuts in a second and a half. Mode, scale and
         framing all change on the same frame; the two feet never move. --- */
      var i2 = strikeIndex(u);
      var c2 = T.strikeCuts[i2];
      if (c2[1] === 'A') drawA(u, { flip: true }); else drawB(u, { flip: true });
      if (i2 === 5 || i2 === 8) flash(X, mix(P.amber, '#ffffff', 0.5), 0.24, W, H);
      var tf3 = clamp01((u - T.strike) / 0.9);
      tallyMarks(X, 92, 962, 11, tf3, { col: c2[1] === 'A' ? P.char : mix(P.cream, P.lampPl, 0.4), seed: 71, w: 8, h: 50, gap: 21, cluster: 132 });
      tallyMarks(X, 92 + 2 * 132, 962, 1, clamp01(tf3 * 1.4 - 0.6), { col: P.verm, seed: 74, w: 9, h: 50, gap: 21 });

    } else if (u < T.wash) {
      /* --- breathe. The small amber one, which has said nothing all
         film, has come and stood between them. --- */
      drawB(u, { flip: true, aSmall: 0 });
      var sf = ease(clamp01((u - T.breathe) / 1.1));
      umb(UMB.smallN, [lerp(SB[0], 556, sf), lerp(SB[1], 1010, sf)], lerp(0, -0.03, sf), lerp(1, 1.1, sf));
      var af2 = clamp01((u - T.aside) / 0.7);
      if (af2 > 0) {
        X.save();
        X.beginPath(); X.rect(40, 20, 40 + af2 * 620, 190); X.clip();
        X.globalAlpha = 0.82;
        X.drawImage(asideP.c, 0, 0);
        X.restore();
        X.globalAlpha = 1;
      }
      if (u >= T.mark) opusMark(X, 872, 1036, 30, mix(P.cream, P.lampPl, 0.3), 0.45);

    } else if (u < T.home) {
      /* --- the rain washes the afternoon back across the square --- */
      drawB(u, { flip: true, aSmall: 0 });
      umb(UMB.smallN, [556, 1010], -0.03, 1.1);
      var wp = clamp01((u - T.wash) / 1.15);
      paintOn(X, dayPlate[bj], washRev, wp, scratchP, W, H);
      var nw = washStrokes.length, cur = wp * nw;
      for (var k3 = Math.max(0, Math.floor(cur) - 2); k3 <= Math.floor(cur) && k3 < nw; k3++) {
        var f3 = clamp01(cur - k3);
        brush(X, partial(washStrokes[k3].pts, f3), {
          col: [P.pale, P.mist, P.slab, '#dfe6e4', P.stone][k3 % 5], w: 132, alpha: 0.8, bristles: 8,
          thick: 1.15, dens: 6, dry: 0.18, vary: 30, raw: true, seed: k3 * 31 + 7, spread: 0.96, taper: 1.3, fade: true
        });
      }
      if (wp >= 1) drawA(u);

    } else {
      drawA(u);
    }

    X.restore();
    applyGrain(X, grain, 0.4, W, H);
  }

  /* the whole warm pole flattened, so the closing wash can bring the street,
     the rain and the three of them back in one pass */
  var dayPlate = [0, 1].map(function (bj2) {
    var p = plate(W, H), save = X;
    X = p.x;
    X.drawImage(gStreet.c, 0, 0);
    rain(X, 0.04 + bj2 * 0.09, 62, false, false);
    cast(0, false, { leans: HOME });
    rain(X, 0.04 + bj2 * 0.09, 30, false, true);
    X = save;
    return p;
  });

  window.draw = draw;
})();
