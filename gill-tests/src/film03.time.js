
  /* ===========================================================
     03 — THE KETTLE MAKES ITS OWN WEATHER

     Mode A  warm plaster kitchen, enamel kettle, one flame
     Mode B  the same kitchen under its own weather: graded into
             navy and slate, the cloud low over the bench, raining

     The kettle never moves. It sits at KX,KY in both poles and in
     every close-up, so every snap between the two is a match-cut
     and the only thing that changes is what the room has become.
     =========================================================== */
  var T = {
    hb: [[0, 'A'], [0.36, 'B'], [0.50, 'A'], [0.64, 'B'], [0.78, 'A']],
    macroSpout: 1.20, spoutIris: 1.44, spoutIrisOut: 1.58,
    wide: 1.76, grow: 1.86, traj: 1.96,
    lens: 2.40, burst: 3.14,
    chaos: 3.24, grid: 4.20, brk: 4.72, back: 4.96,
    pour: 5.02, branch: 5.58,
    mc: [[6.30, 'A'], [6.46, 'B'], [6.60, 'A'], [6.72, 'B']],
    macroCup: 6.84, cupRings: 7.06, macroCupA: 7.66,
    strike: 7.98,
    /* [t, mode, z, x, y] */
    strikeCuts: [
      [7.98, 'B', 1.00, 540, 540], [8.14, 'A', 1.00, 540, 540],
      [8.28, 'B', 1.60, 400, 640], [8.42, 'A', 1.60, 400, 640],
      [8.56, 'B', 1.00, 540, 540], [8.70, 'A', 1.55, 862, 830],
      [8.84, 'B', 1.55, 862, 830], [8.98, 'B', 1.42, 470, 230],
      [9.12, 'A', 1.42, 470, 230], [9.26, 'B', 1.00, 540, 540]
    ],
    breathe: 9.42, words: 9.86, mark: 10.80,
    front: 11.28, home: 12.62
  };

  var CAM = [
    { t: 0.00, x: 540, y: 540, z: 1.00 },
    { t: 0.90, x: 524, y: 556, z: 1.045, mode: 'drift' },
    { t: 1.20, x: 540, y: 540, z: 1.00 },
    { t: 1.76, x: 556, y: 522, z: 1.06, mode: 'drift' },
    { t: 2.40, x: 540, y: 540, z: 1.00 },
    { t: 3.14, x: 540, y: 540, z: 1.03, mode: 'drift' },
    { t: 3.24, x: 540, y: 470, z: 1.12 },
    { t: 4.20, x: 540, y: 528, z: 1.05 },
    { t: 4.72, x: 540, y: 528, z: 1.05 },
    { t: 4.96, x: 540, y: 540, z: 1.00 },
    { t: 5.58, x: 430, y: 420, z: 1.15, mode: 'drift' },
    { t: 6.30, x: 540, y: 540, z: 1.00 },
    { t: 6.84, x: 540, y: 540, z: 1.00 },
    { t: 7.66, x: 540, y: 540, z: 1.00 },
    { t: 7.98, x: 540, y: 540, z: 1.00 },
    { t: 9.42, x: 540, y: 540, z: 1.05, mode: 'drift' },
    { t: 11.28, x: 540, y: 540, z: 1.00 },
    { t: 13.00, x: 540, y: 540, z: 1.00, mode: 'drift' }
  ];

  var SPOUT_MOUTH = [KX - 348, KY - 306];

  /* ---------------- the two poles ----------------
     Cloud and steam are live, so they are drawn per frame over the baked
     room and kettle. Everything else is a plate. */
  function drawA(u, o) {
    o = o || {};
    X.drawImage(gRoom.c, 0, 0);
    if (o.cloud) paintCloud(X, 0.12, o.cloud);
    heat(X, KX, BENCH, o.heat == null ? 1 : o.heat, false);
    X.drawImage(kettleRoom.c, 0, 0);
    if (o.belly) belly(X, cloudP, o.belly);
    steam(X, u, o.steam == null ? 1 : o.steam, 0.1);
    if (o.rain) rain(X, u, o.rain);
    tea(X, o.tea || 0);
  }
  function drawB(u, o) {
    o = o || {};
    X.drawImage(gStorm.c, 0, 0);
    if (o.cloud) paintCloud(X, 0.92, o.cloud);
    heat(X, KX, BENCH, o.heat == null ? 1 : o.heat, true);
    X.drawImage(kettleStorm.c, 0, 0);
    if (o.belly) belly(X, cloudP, o.belly);
    steam(X, u, o.steam == null ? 1 : o.steam, 0.8);
    if (o.rain) rain(X, u, o.rain);
    tea(X, o.tea || 0);
  }

  /* the storm pole baked flat once, for the belly reflection to hold */
  (function () {
    var save = X;
    X = cloudP.x;
    X.drawImage(gStorm.c, 0, 0);
    paintCloud(X, 0.92, 1);
    rain(X, 3.3, 1);
    X = save;
  })();

  /* ---------------- SCALE JUMP 1: the spout mouth ----------------
     Painted at the size it is shown. An enamel lip with the chip in it, and
     the whole column of steam leaving through an opening the width of a
     thumb, which is where all the weather in the film comes from. */
  function spoutPlate(storm) {
    var p = plate(W, H), x = p.x, r = rnd(storm ? 2201 : 2202);
    var st = function (a, b, t) { return storm ? mix(a, b, t) : a; };
    ground(x, W, H, {
      base: st(P.plaster, P.storm, 0.86), seed: storm ? 91 : 92,
      tints: storm ? [P.stormDk, '#1d2836', '#39485c', '#0b1118']
        : [P.putty, P.clay, '#d8c9ae', '#a89680', '#c2b49c'],
      mottle: 130, sweeps: 76, scrape: 56, drift: 26,
      dark: storm ? '#03070c' : '#6f6252', light: storm ? '#8fa8bc' : '#fffaf0',
      vignette: storm ? 0.44 : 0.3
    });
    x.save(); x.globalAlpha = storm ? 0.42 : 0.56; x.drawImage(craze.c, 0, 0); x.restore();
    /* the spout, huge, coming in from the bottom right and opening top left */
    var lip = [[262, 232], [408, 150], [560, 190], [640, 300], [960, 700], [1120, 980],
      [860, 1120], [560, 780], [330, 470], [268, 330]];
    var pf = function (k) { curve(k, lip, true); };
    envelope(x, lip, { w: 30, seed: 2301, col: '#0d1518', fillCol: st(P.enamelDk, P.stormDk, 0.55), halo: 3, blur: 60, haloA: 0.5, hox: 16, hoy: 20 });
    impasto(x, pf, {
      base: st(P.enamel, P.stormDk, 0.5),
      cols: [st(P.enamel, P.stormDk, 0.5), st(P.enamelLt, P.stormLt, 0.5), st(P.enamelDk, '#050a10', 0.5),
        st(mix(P.enamel, P.enamelLt, 0.4), P.stormLt, 0.5), st(P.enamelDk, P.stormDk, 0.5)],
      bb: [220, 110, 940, 1030], seed: 2302, n: 66, kw: 66, angle: 0.95,
      spreadA: 1.1, stipple: 700, crease: 130,
      lit: st('#dff4f5', '#a8c4d8', 0.5), shade: st('#08222a', '#02070c', 0.5), drift: 26
    });
    textureThrough(x, craze, pf, 0.4, -320, -180);
    /* enamel chipped off the lip down to black iron, which is what enamel does */
    x.save(); x.beginPath(); pf(x); x.clip();
    for (var c = 0; c < 16; c++) {
      var ca = r() * 1.4 - 0.2;
      var cx0 = lerp(290, 620, r()), cy0 = lerp(170, 330, r());
      var chip = blobPts(cx0, cy0, 12 + r() * 34, 10 + r() * 28, (r() * 1e5) | 0, 9, 0.34);
      wash(x, chip, { col: '#0b1216', seed: (r() * 1e5) | 0, layers: 3, alpha: 0.34, edge: 0, bleed: 4 });
      brush(x, shrinkPts(chip, 1.2), { col: st('#eef6f6', P.stormLt, 0.5), w: 8, alpha: 0.22, bristles: 2, close: true, seed: (r() * 1e5) | 0, dens: 7, dry: 0.4 });
      void ca;
    }
    /* the lit crest running along the top of the tube */
    for (var g = 0; g < 22; g++) {
      var gt = r();
      brush(x, [[lerp(300, 700, gt), lerp(250, 420, gt) - 26 - r() * 30],
        [lerp(300, 700, gt) + 90, lerp(250, 420, gt) + 70]], {
        col: st('#e8fbfb', '#b8d4e4', 0.5), w: 10 + r() * 30, alpha: 0.08 + r() * 0.14,
        bristles: 3, seed: (r() * 1e6) | 0, dens: 6, dry: 0.3, taper: 0.7
      });
    }
    x.restore();
    contour(x, lip, { col: '#0b1216', w: 22, seed: 2303, arc: 0.44, vary: 20 });
    /* the dark of the inside of the tube, where the steam is coming from */
    var bore = [[300, 244], [402, 178], [520, 208], [576, 292], [470, 356], [352, 330]];
    wash(x, bore, { col: '#04080c', seed: 2304, layers: 5, alpha: 0.42, edge: 0, bleed: 8 });
    brush(x, bore, { col: '#0a1418', w: 26, alpha: 0.6, bristles: 4, close: true, seed: 2305, dens: 7, dry: 0.3, arc: 0.6 });
    /* and the steam, at the scale it has when it is a foot from your face */
    for (var s = 0; s < 44; s++) {
      var sy = 250 - r() * 40, sx = 330 + r() * 220;
      var climb = 180 + r() * 620;
      brush(x, [[sx, sy], [sx - 40 + (r() - 0.5) * 160, sy - climb * 0.5], [sx - 120 + (r() - 0.5) * 260, sy - climb]], {
        col: mix(P.steam, '#8d9aa6', storm ? 0.72 : 0.1), w: 70 + r() * 170,
        alpha: 0.035 + r() * 0.075, bristles: 5, seed: (r() * 1e6) | 0,
        dens: 6, taper: 0.8, spread: 1.1, fade: true
      });
    }
    for (var w0 = 0; w0 < 8; w0++) {
      var wr = 40 + r() * 100;
      brush(x, blobPts(300 + (r() - 0.5) * 320, 150 - r() * 130, wr, wr * 0.66, (r() * 1e5) | 0, 11, 0.32), {
        col: mix('#ffffff', '#a4b2be', storm ? 0.7 : 0.1), w: 8 + r() * 10,
        alpha: 0.1 + r() * 0.14, bristles: 1, close: true, seed: (r() * 1e6) | 0, dens: 7, arc: 1.2
      });
    }
    applyGrain(x, grain, storm ? 0.16 : 0.2, W, H);
    return p;
  }
  var spoutA = spoutPlate(false), spoutB = spoutPlate(true);

  /* ---------------- SCALE JUMP 2: the cup ----------------
     Down into the cup, where the forecast is being kept. Rain landing on
     tea, which is the joke made at close range. */
  function cupPlate(storm) {
    var p = plate(W, H), x = p.x, r = rnd(storm ? 2601 : 2602);
    var st = function (a, b, t) { return storm ? mix(a, b, t) : a; };
    ground(x, W, H, {
      base: st(P.plaster, P.storm, 0.86), seed: storm ? 95 : 96,
      tints: storm ? [P.stormDk, '#1d2836', '#39485c', '#0b1118']
        : [P.putty, P.clay, '#d8c9ae', '#a89680'],
      mottle: 120, sweeps: 70, scrape: 50, drift: 24,
      dark: storm ? '#03070c' : '#6f6252', light: storm ? '#8fa8bc' : '#fffaf0', vignette: 0.44
    });
    /* the rim of the cup, cutting across the bottom third of the square */
    var wall = [[-60, 300], [300, 246], [700, 262], [1140, 224], [1140, 1140], [-60, 1140]];
    var wf = function (k) { curve(k, wall, true); };
    impasto(x, wf, {
      base: st('#efe7d8', P.storm, 0.62),
      cols: [st('#efe7d8', P.storm, 0.62), st('#ffffff', P.stormLt, 0.6), st('#c4b9a6', P.stormDk, 0.6), st('#d8ccb8', '#39485c', 0.6)],
      bb: [-80, 200, 1260, 980], seed: 2701, n: 44, kw: 60, angle: 0.1,
      spreadA: 0.9, stipple: 400, crease: 90, lit: '#ffffff', shade: st('#8d7d68', '#05090e', 0.6)
    });
    /* the tea, seen from just above the surface */
    var surf = [[-60, 300], [300, 246], [700, 262], [1140, 224], [1140, 900], [-60, 940]];
    var sf2 = function (k) { curve(k, surf, true); };
    impasto(x, sf2, {
      base: st('#6b3a12', '#241a12', 0.5),
      cols: [st('#6b3a12', '#241a12', 0.5), st('#8a4f18', '#3a2a18', 0.5), st('#4a2408', '#0d0906', 0.5), st('#c98a3a', '#5a4224', 0.5)],
      bb: [-80, 200, 1260, 780], seed: 2702, n: 50, kw: 70, angle: 0.06,
      spreadA: 0.9, stipple: 500, crease: 110,
      lit: st('#f0c07a', '#8a7a5a', 0.5), shade: '#1a0c02'
    });
    textureThrough(x, craze, sf2, 0.3, -180, -420);
    /* rain landing on it: rings, and the shiver between them */
    x.save(); x.beginPath(); sf2(x); x.clip();
    for (var i = 0; i < 26; i++) {
      var px = -40 + r() * 1160, py = 300 + r() * 620, rr = 24 + r() * 130;
      brush(x, blobPts(px, py, rr, rr * 0.26, (r() * 1e5) | 0, 13, 0.2), {
        col: st('#f0d8a8', P.stormLt, 0.5), w: 3 + r() * 6, alpha: 0.1 + r() * 0.2,
        bristles: 1, close: true, seed: (r() * 1e6) | 0, dens: 7, dry: 0.3, arc: 1.3
      });
    }
    for (var b = 0; b < 130; b++) {
      var by = 280 + r() * 660, bx0 = r() * W, bl = 14 + Math.pow(r(), 2) * 300;
      brush(x, [[bx0, by], [bx0 + bl * 0.5, by + (r() - 0.5) * 8], [bx0 + bl, by + (r() - 0.5) * 12]], {
        col: st('#ffe8b8', '#b8ccdc', 0.55), w: 2 + r() * 7, alpha: 0.05 + r() * 0.15,
        bristles: 1, seed: (r() * 1e6) | 0, dens: 6, taper: 0.8, ribbon: true
      });
    }
    x.restore();
    /* the lip of the cup nearest us, catching the light */
    brush(x, wall.slice(0, 4), {
      col: st('#ffffff', P.stormLt, 0.45), w: 22, alpha: 0.28, bristles: 4,
      seed: 2703, dens: 8, dry: 0.34, arc: 0.9
    });
    contour(x, [[-60, 300], [300, 246], [700, 262], [1140, 224]], { col: st('#8d7d68', '#05090e', 0.6), w: 15, seed: 2704, arc: 0.4, vary: 20, close: false });
    if (storm) {
      for (var d = 0; d < 40; d++) {
        var dx0 = r() * W, dy0 = -60 + r() * 400, dL = 60 + r() * 200;
        brush(x, [[dx0, dy0], [dx0 - dL * 0.16, dy0 + dL]], {
          col: mix('#ccd8e0', '#ffffff', r() * 0.6), w: 1.6 + r() * 3,
          alpha: 0.14 + r() * 0.3, bristles: 1, seed: (r() * 1e6) | 0, dens: 5, taper: 0.8, ribbon: true
        });
      }
    }
    applyGrain(x, grain, 0.2, W, H);
    return p;
  }
  var cupB = cupPlate(true), cupA = cupPlate(false);

  /* ---------------- the forecast ----------------
     CHAOS → GRID. When the lens goes off, the cloud comes apart into twelve
     torn slips, and for half a second they line up as a forecast: a week of
     weather issued by a kettle. Then it breaks and rains anyway. */
  var SLIPS = (function () {
    var out = [], r = rnd(2901), i;
    for (i = 0; i < 12; i++) {
      var s = 130, p = plate(s * 2, s * 2), x = p.x;
      var quad = jagPoly([[s - 92 - r() * 20, s - 84 - r() * 22], [s + 90 + r() * 22, s - 92 - r() * 18],
        [s + 84 + r() * 22, s + 88 + r() * 20], [s - 88 - r() * 20, s + 92 + r() * 18]], (r() * 1e5) | 0, 7, 20);
      paperPatch(x, quad, {
        seed: 2950 + i, amp: 5, step: 15, fibre: 34,
        col: jit(mix('#ddd0b6', P.storm, 0.24 + r() * 0.3), r, 14),
        bb: [s - 130, s - 130, 260, 260],
        print: { lh: 15, h: 2.4, col: '#5f6b74', figs: 1 + (r() * 2 | 0) },
        shadowA: 0.22, edgeW: 3.5, edgeCol: mix('#ddd0b6', '#4a4238', 0.5)
      });
      /* a lobe of the weather it is a slip about, and how much of it */
      x.save();
      x.beginPath(); curve(x, quad, true); x.clip();
      var wet = r();
      var lo = blobPts(s + (r() - 0.5) * 40, s - 22 + (r() - 0.5) * 30, 54 + r() * 26, 30 + r() * 20, 2980 + i, 11, 0.3);
      wash(x, lo, { col: mix('#a3a8a6', P.stormDk, 0.3 + wet * 0.6), seed: 2990 + i, layers: 3, alpha: 0.3, edge: 0, bleed: 5 });
      for (var d = 0; d < Math.round(2 + wet * 9); d++) {
        var dx0 = s - 60 + r() * 120, dy0 = s + 10 + r() * 70, dL = 20 + r() * 46;
        brush(x, [[dx0, dy0], [dx0 - dL * 0.2, dy0 + dL]], {
          col: mix('#8d9aa6', '#ffffff', 0.3 + r() * 0.4), w: 3 + r() * 4,
          alpha: 0.3 + r() * 0.35, bristles: 1, seed: (r() * 1e6) | 0, dens: 5, taper: 0.8, ribbon: true
        });
      }
      x.restore();
      out.push({ p: p, c: s, wet: wet });
    }
    return out;
  })();

  /* ---------------- BRANCHING ----------------
     The steam column gives up being one thing on its way up and becomes the
     whole cloud: one mark splitting until it is weather. */
  var TREE = makeBranch({
    x: SPOUT_MOUTH[0], y: SPOUT_MOUTH[1] - 20, ang: -1.28, len: 168,
    depth: 3, seed: 919, spread: 0.72, shrink: 0.7, w: 26, wobble: 0.4, step: 0.3
  });

  function strikeIndex(u) {
    var i = 0;
    for (var k = 0; k < T.strikeCuts.length; k++) if (u >= T.strikeCuts[k][0]) i = k; else break;
    return i;
  }
  /* how full the cup is, and how hard it is raining, at any moment */
  function teaAt(u) {
    if (u < T.pour) return 0;
    if (u < T.front) return ease(clamp01((u - T.pour) / 3.6));
    return ease(clamp01((T.front - T.pour) / 3.6)) * (1 - ease(clamp01((u - T.front) / 1.1)));
  }
  function rainAt(u) {
    if (u < T.burst) return 0;
    if (u < T.pour) return 0.4;
    if (u < T.front) return 1;
    return 1 - ease(clamp01((u - T.front) / 0.9));
  }

  /* ---------------- the thirteen seconds ---------------- */
  function draw(t) {
    var u = ((t % DUR) + DUR) % DUR, bj = boil(u);
    var v = camAt(u, CAM);
    if (u >= T.strike && u < T.breathe) {
      var sc0 = T.strikeCuts[strikeIndex(u)];
      v = { x: sc0[3], y: sc0[4], z: sc0[2] };
    }
    var sh = shake(u,
      u >= T.burst && u < T.chaos ? 8 :
      u >= T.chaos && u < T.grid ? 5 :
      u >= T.strike && u < T.breathe ? 3 : 0);
    X.setTransform(1, 0, 0, 1, 0, 0);
    X.clearRect(0, 0, W, H);
    X.save();
    X.translate((bj ? 0.8 : -0.9) + sh[0], (bj ? -0.8 : 0.8) + sh[1]);
    applyCam(X, v, W, H);

    var tea0 = teaAt(u), rain0 = rainAt(u);

    if (u < T.macroSpout) {
      /* --- breathe, then the heartbeat: four snaps into the kitchen's own
         weather and back, the kettle never moving --- */
      var sf0 = clamp01(u / 0.9) * 0.5;
      if (held(u, T.hb) === 'A') drawA(u, { steam: sf0 });
      else drawB(u, { steam: sf0, cloud: 0 });

    } else if (u < T.wide) {
      /* --- SCALE JUMP 1: the mouth of the spout, where the weather in this
         film is manufactured --- */
      X.drawImage(spoutA.c, 0, 0);
      if (u >= T.spoutIris && u < T.spoutIrisOut) {
        var ir = 190 + 150 * ease((u - T.spoutIris) / 0.12);
        var ip = lensPath(400, 300, ir, 53);
        lensThrough(X, ip, function (c) { c.drawImage(spoutB.c, 0, 0); });
        lensRim(X, ip, { seed: 53, w: 14, bw: 8 });
      }
      /* the pressure it is under, ticked off round the bore */
      crosshair(X, 430, 268, 300, clamp01((u - T.macroSpout - 0.16) / 0.4),
        { col: mix(P.cream, P.amber, 0.4), seed: 531, w: 6, alpha: 0.3 });

    } else if (u < T.lens) {
      /* --- back out, the cloud grows over the bench, and the steam that is
         feeding it gets an arc thrown after it --- */
      var gf = clamp01((u - T.grow) / 0.5);
      drawA(u, { cloud: gf, steam: 0.6 + gf * 0.4 });
      var tf = clamp01((u - T.traj) / 0.3);
      arcThrow(X, SPOUT_MOUTH[0], SPOUT_MOUTH[1], 470, 210, 0.26, tf,
        { col: mix(P.char, P.cream, 0.3), w: 6, alpha: 0.4, seed: 5401, headCol: P.amber });
      arcThrow(X, 700, 230, 862, 700, 0.2, clamp01(tf * 1.5 - 0.45),
        { col: mix(P.char, P.cream, 0.3), w: 5, alpha: 0.34, seed: 5402, headCol: P.enamelLt });

    } else if (u < T.burst) {
      /* --- REVEALING LENS: an iris opened at the mouth of the spout and
         grown until the whole kitchen is inside its own weather --- */
      drawA(u, { cloud: 1, steam: 1 });
      var lp = ease((u - T.lens) / (T.burst - T.lens));
      var cx = lerp(SPOUT_MOUTH[0], 540, lp * 0.9);
      var cy = lerp(SPOUT_MOUTH[1], 520, lp * 0.9);
      var rad = 84 + 700 * lp;
      var lpath = lensPath(cx, cy, rad, 53 + frameOf(u, 6));
      lensThrough(X, lpath, function (c) {
        var save = X; X = c;
        drawB(u, { cloud: 1, steam: 1, rain: clamp01(lp * 1.6 - 0.4) });
        X = save;
      });
      lensRim(X, lpath, { seed: 53, w: 20, bw: 10 });
      ringsOut(X, cx, cy, rad * 0.4, rad * 1.2, 4, clamp01(lp * 2 - 0.5),
        { col: mix(P.cream, P.amber, 0.4), seed: 541, w: 7, alpha: 0.28 });

    } else if (u < T.chaos) {
      /* --- and the lid comes off the whole idea --- */
      var bp = clamp01((u - T.burst) / 0.05);
      drawB(u, { cloud: 1, steam: 1, rain: 0.5 });
      flash(X, mix(P.stormLt, '#ffffff', 0.5), 0.55 * (1 - bp), W, H);

    } else if (u < T.grid) {
      /* --- CHAOS: the cloud comes apart into twelve torn slips of weather,
         loose over the bench, counted as they go past --- */
      drawB(u, { cloud: 0, steam: 0.7, rain: 0.5, tea: tea0 });
      var cf = ease(clamp01((u - T.chaos) / 0.3));
      var scatter = function (uu, aMul) {
        SLIPS.forEach(function (s, i) {
          var c = chaosAt(i, 8150, uu * 2.2, 500, 470, 450);
          X.save();
          X.globalAlpha = aMul;
          X.translate(lerp(470, c[0], cf), lerp(210, c[1], cf));
          X.rotate(c[2] * cf);
          var k = lerp(0.5, 0.7 * c[3] + 0.4, cf);
          X.scale(k, k);
          X.drawImage(s.p.c, -s.c, -s.c);
          X.restore();
        });
        X.globalAlpha = 1;
      };
      scatter(u - 0.11, 0.14); scatter(u - 0.055, 0.28); scatter(u, 1);
      tallyMarks(X, 92, 906, 12, clamp01((u - T.chaos - 0.1) / 0.8),
        { col: mix(P.cream, P.amber, 0.35), seed: 71, w: 8, h: 50, gap: 21, cluster: 132 });

    } else if (u < T.brk) {
      /* --- GRID SNAP: for half a second it is a forecast. A week of weather,
         ruled up by hand and issued by a kettle. --- */
      drawB(u, { cloud: 0, steam: 0.7, rain: 0.4, tea: tea0 });
      var gf2 = clamp01((u - T.grid) / 0.16);
      SLIPS.forEach(function (s, i) {
        var g = gridAt(i, 4, 540, 500, 246, 236, 12);
        X.save();
        X.translate(g[0], g[1]); X.scale(0.86, 0.86);
        X.drawImage(s.p.c, -s.c, -s.c);
        X.restore();
      });
      SLIPS.forEach(function (s, i) {
        var g = gridAt(i, 4, 540, 500, 246, 236, 12);
        crosshair(X, g[0], g[1], 84, clamp01(gf2 * 1.5 - i * 0.04),
          { col: mix(P.cream, P.amber, 0.35), seed: 300 + i * 7, w: 4, alpha: 0.42 });
      });
      var bx0 = 540 - 1.5 * 246 - 92, bx1 = 540 + 1.5 * 246 + 92;
      var by0 = 500 - 236 - 90, by1 = 500 + 236 + 90;
      [[[bx0, by0], [540, by0 - 8], [bx1, by0 + 5]], [[bx1, by0], [bx1 + 7, 500], [bx1 - 4, by1]],
       [[bx1, by1], [540, by1 + 9], [bx0, by1 - 6]], [[bx0, by1], [bx0 - 8, 500], [bx0 + 5, by0]]]
        .forEach(function (side, k) {
          brush(X, partial(side, clamp01(gf2 * 2 - k * 0.22)), {
            col: mix(P.cream, P.amber, 0.35), w: 5, alpha: 0.4, bristles: 1, seed: 380 + k, dens: 6, dry: 0.3
          });
        });
      tallyMarks(X, 92, 906, 12, 1, { col: mix(P.cream, P.amber, 0.35), seed: 71, w: 8, h: 50, gap: 21, cluster: 132 });

    } else if (u < T.back) {
      /* --- and it breaks: the slips go back up into the cloud, overshooting,
         and the forecast is a cloud again --- */
      var fp = (u - T.brk) / (T.back - T.brk);
      drawB(u, { cloud: ease(clamp01(fp * 1.4 - 0.3)), steam: 0.8, rain: 0.5, tea: tea0 });
      SLIPS.forEach(function (s, i) {
        var g = gridAt(i, 4, 540, 500, 246, 236, 12);
        var p = over(clamp01(fp * (0.85 + (i % 3) * 0.1)));
        X.save();
        X.globalAlpha = 1 - clamp01(fp * 1.7 - 0.5);
        X.translate(lerp(g[0], 470, p), lerp(g[1], 210, p));
        X.rotate((1 - p) * 0.4 * (i % 2 ? 1 : -1));
        var k2 = lerp(0.86, 0.2, p);
        X.scale(k2, k2);
        X.drawImage(s.p.c, -s.c, -s.c);
        X.restore();
      });
      X.globalAlpha = 1;

    } else if (u < T.mc[0][0]) {
      /* --- it rains into the cup, and on the way up the steam column stops
         being one thing and becomes the whole sky --- */
      drawB(u, { cloud: 1, steam: 1, rain: rain0, tea: tea0 });
      if (u >= T.branch) {
        drawBranch(X, TREE, clamp01((u - T.branch) / 0.6), {
          cols: [mix(P.steam, P.stormLt, 0.3), P.stormLt, mix(P.stormLt, P.steam, 0.5), mix(P.steam, '#ffffff', 0.4)],
          alpha: 0.4, seed: 55, taper: 0.7, dry: 0.24
        });
      }

    } else if (u < T.macroCup) {
      /* --- match-cut: four snaps on the same raining kettle --- */
      var o0 = { cloud: 1, steam: 1, rain: rain0, tea: tea0, belly: 0.6 };
      if (held(u, T.mc) === 'A') drawA(u, o0); else drawB(u, o0);

    } else if (u < T.macroCupA) {
      /* --- SCALE JUMP 2: into the cup, where the forecast is being kept --- */
      X.drawImage(cupB.c, 0, 0);
      var cf2 = clamp01((u - T.cupRings) / 0.5);
      ringsOut(X, 420, 620, 40, 340, 5, cf2, { col: mix(P.stormLt, '#ffffff', 0.45), seed: 951, w: 7, alpha: 0.36, flat: 0.3 });
      ringsOut(X, 760, 480, 30, 260, 4, clamp01(cf2 * 1.4 - 0.3), { col: mix(P.stormLt, '#ffffff', 0.35), seed: 952, w: 6, alpha: 0.3, flat: 0.3 });
      crosshair(X, 540, 620, 420, clamp01((u - T.cupRings - 0.3) / 0.4), { col: mix(P.cream, P.amber, 0.4), seed: 953, w: 6, alpha: 0.3 });
      tallyMarks(X, 96, 200, 3, clamp01((u - T.cupRings - 0.46) / 0.25), { col: mix(P.cream, P.amber, 0.4), seed: 73, w: 9, h: 54, gap: 22 });

    } else if (u < T.strike) {
      /* --- the same half inch of tea in the warm kitchen: no weather in it,
         which is somehow worse --- */
      X.drawImage(cupA.c, 0, 0);

    } else if (u < T.breathe) {
      /* --- STRIKE: ten cuts in a second and a half, mode, scale and framing
         all changing on the same frame; the kettle never moves --- */
      var i2 = strikeIndex(u);
      var c2 = T.strikeCuts[i2];
      var o2 = { cloud: 1, steam: 1, rain: rain0, tea: tea0, belly: 0.6 };
      if (c2[1] === 'A') drawA(u, o2); else drawB(u, o2);
      if (i2 === 5 || i2 === 8) flash(X, mix(P.stormLt, '#ffffff', 0.5), 0.26, W, H);
      var tf3 = clamp01((u - T.strike) / 0.9);
      tallyMarks(X, 92, 906, 10, tf3, { col: c2[1] === 'A' ? P.char : mix(P.cream, P.amber, 0.35), seed: 71, w: 8, h: 50, gap: 21, cluster: 132 });
      tallyMarks(X, 92 + 2 * 132, 906, 2, clamp01(tf3 * 1.4 - 0.6), { col: P.cad, seed: 74, w: 9, h: 50, gap: 21 });

    } else if (u < T.front) {
      /* --- breathe. The cup is full, the kettle is holding its own weather
         in its belly, and somebody writes the forecast down. --- */
      drawB(u, { cloud: 1, steam: 1, rain: rain0, tea: tea0, belly: 0.85 });
      var wf2 = clamp01((u - T.words) / 0.8);
      if (wf2 > 0) {
        X.save();
        X.beginPath(); X.rect(60, 900, 40 + wf2 * 720, 180); X.clip();
        X.globalAlpha = 0.9;
        X.drawImage(wordsP.c, 0, 0);
        X.restore();
        X.globalAlpha = 1;
      }
      if (u >= T.mark) opusMark(X, 872, 872, 30, mix(P.cream, P.amber, 0.3), 0.45);

    } else if (u < T.home) {
      /* --- the front goes through and the kitchen is only a kitchen again,
         which is where it started, which is the loop --- */
      drawB(u, { cloud: 1 - ease(clamp01((u - T.front) / 1.0)), steam: 1, rain: rain0, tea: tea0, belly: 0.4 });
      var wp = clamp01((u - T.front) / 1.1);
      paintOn(X, warmPlate[bj], frontRev, wp, bellyP, W, H);
      var nw = frontStrokes.length, cur = wp * nw;
      var cols = [P.plaster, P.putty, P.cream, '#d8c9ae', P.clay];
      for (var k3 = Math.max(0, Math.floor(cur) - 2); k3 <= Math.floor(cur) && k3 < nw; k3++) {
        var f3 = clamp01(cur - k3);
        brush(X, partial(frontStrokes[k3].pts, f3), {
          col: cols[k3 % cols.length], w: 136, alpha: 0.84, bristles: 8, thick: 1.15,
          dens: 6, dry: 0.18, vary: 30, raw: true, seed: k3 * 31 + 7, spread: 0.96, taper: 1.3, fade: true
        });
      }
      if (wp >= 1) drawA(u, { steam: 0.5, tea: tea0 });

    } else {
      drawA(u, { steam: 0.5 * clamp01((DUR - u) / 0.36), tea: tea0 });
    }

    X.restore();
    applyGrain(X, grain, 0.4, W, H);
  }

  /* the warm pole flattened at the state the loop returns to, so the front
     can bring the whole kitchen back in one pass */
  var warmPlate = [0, 1].map(function (bj2) {
    var p = plate(W, H), save = X;
    X = p.x;
    drawA(0.04 + bj2 * 0.09, { steam: 0.5, cloud: 0, tea: 0 });
    X = save;
    return p;
  });

  window.draw = draw;
})();
