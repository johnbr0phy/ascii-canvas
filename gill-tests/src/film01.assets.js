(function () {
  var W = 1080, H = 1080, DUR = 14.0;
  var cv = document.getElementById('c'), X = cv.getContext('2d');

  var P = {
    cream: '#F5F0E6', paper: '#f8f1e0', mist: '#E9E5E2', dust: '#ded4d7',
    oat: '#efe6d6', stone: '#c9c0b4', ink: '#1A1A1A', char: '#2B2B2B', pencil: '#3a352e',
    cad: '#E34F0C', verm: '#C8102E', mag: '#D13478',
    gold: '#C9A227', goldLt: '#F7E7A8', goldDk: '#6b4a12', amber: '#F3B616',
    scorch: '#161110', soot: '#0c0908', ember: '#3a2016',
    moss: '#556B2F', navy: '#0a3a59', milk: '#e8eef0', tan: '#DAA520', crust: '#8B5A2B'
  };

  var ITEMS = [
    { w: 'milk', ly: 300, sx: 128, sy: 430, s: 0.95, z: 3, kind: 'bottle' },
    { w: 'eggs', ly: 400, sx: 360, sy: 122, s: 0.70, z: 1, kind: 'eggs' },
    { w: 'tomatoes', ly: 500, sx: 720, sy: 196, s: 1.22, z: 2, kind: 'tomato' },
    { w: 'bread', ly: 600, sx: 930, sy: 496, s: 0.86, z: 1, kind: 'loaf' },
    { w: 'tea', ly: 700, sx: 452, sy: 446, s: 0.78, z: 2, kind: 'packet' },
    { w: 'lemons', ly: 800, sx: 262, sy: 762, s: 0.70, z: 2, kind: 'lemons' },
    { w: 'biscuits', ly: 900, sx: 740, sy: 758, s: 1.14, z: 4, kind: 'biscuit' }
  ];
  /* star marks sit in the gaps the objects leave, so the eye joins them up
     without a line telling it to */
  var STARS = [
    [232, 176, 30], [548, 300, 20], [880, 250, 26], [104, 620, 23],
    [596, 604, 34], [946, 726, 25], [430, 916, 28], [742, 430, 17],
    [300, 540, 15], [680, 920, 19], [60, 330, 16], [860, 590, 14]
  ];

  /* Four strokes off one centre, each a separate flick of the loaded brush:
     unequal arms, none quite crossing the middle. */
  function star(x, cx, cy, rad, seed, alpha) {
    var r = rnd(seed);
    for (var k = 0; k < 4; k++) {
      var a = k * Math.PI / 4 + (r() - 0.5) * 0.4;
      var l0 = rad * (0.5 + r() * 0.7), l1 = rad * (0.5 + r() * 0.7);
      var gap = rad * 0.1 * r();
      brush(x, [
        [cx - Math.cos(a) * l0, cy - Math.sin(a) * l0],
        [cx - Math.cos(a) * gap, cy - Math.sin(a) * gap]
      ], {
        col: k % 2 ? P.goldLt : P.gold, w: 2.2 + r() * 2.6, alpha: alpha * (0.4 + r() * 0.45),
        bristles: 1, taper: 0.5, seed: (r() * 1e6) | 0, dens: 4
      });
      brush(x, [
        [cx + Math.cos(a) * gap, cy + Math.sin(a) * gap],
        [cx + Math.cos(a) * l1, cy + Math.sin(a) * l1]
      ], {
        col: k % 2 ? P.gold : P.amber, w: 2.2 + r() * 2.6, alpha: alpha * (0.4 + r() * 0.45),
        bristles: 1, taper: 0.5, seed: (r() * 1e6) | 0, dens: 4
      });
    }
    x.beginPath(); x.arc(cx, cy, rad * 0.1 + 1.2, 0, TAU);
    x.fillStyle = rgba(P.goldLt, alpha * 0.5); x.fill();
  }
  var LX = 250, LSZ = 60, SPS = 620, SPC = 310;

  /* ---------------- shared texture ---------------- */
  var craze = crazePlate(W, H, { seed: 404, facets: 170, lines: 260 });
  var grain = grainPlate(W, H, 91, 20, true);
  var scratchP = plate(W, H);

  /* the grey-cream canvas: worked, re-used, the ghost of an older chart in it */
  var gCanvas = (function () {
    var p = plate(W, H);
    ground(p.x, W, H, {
      base: P.mist, seed: 12, tints: [P.dust, P.oat, P.stone, '#cdc2ae', '#b0a493', '#d9cfc0'],
      mottle: 150, sweeps: 78, scrape: 66, drift: 32, dark: '#544b40', light: '#fffdf6', vignette: 0.34
    });
    /* Broad knife scrapes so the quiet ground still has worked mass in it: a
       ground this large reads as blank paper without them. */
    var rk = rnd(1212);
    for (var sk = 0; sk < 34; sk++) {
      var ky = rk() * H, kx = -120 + rk() * 300, klen = 420 + rk() * 900;
      var kd = (rk() - 0.5) * 0.9;
      brush(p.x, [[kx, ky], [kx + klen * 0.5, ky + kd * 180 + (rk() - 0.5) * 90],
        [kx + klen, ky + kd * 360 + (rk() - 0.5) * 120]], {
        col: rk() < 0.5 ? jit('#a4977f', rk, 26) : jit('#efe7d8', rk, 18),
        w: 46 + rk() * 130, alpha: 0.05 + rk() * 0.08, bristles: 6,
        seed: (rk() * 1e6) | 0, dens: 5, dry: 0.3, spread: 1.05
      });
    }
    var rg = rnd(515);
    [[210, 260, '#b8a88c'], [820, 420, '#c9b8a0'], [480, 880, '#a8907a'], [900, 960, '#d8c0a8']].forEach(function (st) {
      /* Old stains in the cloth. No edge stroke: a contour round a stain turns
         it into a soap bubble floating on the canvas. */
      wash(p.x, blobPts(st[0], st[1], 120 + rg() * 150, 100 + rg() * 130, (rg() * 1e5) | 0, 13, 0.2),
        { col: st[2], seed: (rg() * 1e5) | 0, layers: 3, alpha: 0.055, edge: 0, bleed: 7 });
    });
    ITEMS.forEach(function (it, i) {
      brush(p.x, blobPts(it.sx, it.sy, 96, 82, 700 + i, 11, 0.16), {
        col: mix(P.mist, '#8a8070', 0.45), w: 10, alpha: 0.05, bristles: 3, close: true,
        seed: 300 + i, dens: 6, dry: 0.45, arc: 1.3
      });
    });
    textureThrough(p.x, craze, function (c) { c.rect(0, 0, W, H); }, 0.34, -40, -30);
    return p;
  })();

  /* scorched kitchen dark, lit from inside like an icon */
  var gSlate = (function () {
    var p = plate(W, H), x = p.x;
    ground(x, W, H, {
      base: P.scorch, seed: 88, tints: [P.soot, P.ember, '#241713', '#070505'],
      mottle: 84, sweeps: 40, scrape: 26, drift: 14, dark: '#000000', light: '#8a5a32', vignette: 0.5
    });
    var g = x.createRadialGradient(560, 380, 40, 560, 380, 620);
    g.addColorStop(0, rgba('#6b3a1a', 0.3));
    g.addColorStop(0.5, rgba('#3a2016', 0.16));
    g.addColorStop(1, rgba('#3a2016', 0));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    /* worked dark, not void black: broad ember sweeps and charcoal scrape */
    var r2 = rnd(717);
    for (var s2 = 0; s2 < 46; s2++) {
      var sy2 = r2() * H, sx2 = -100 + r2() * 300, len2 = 300 + r2() * 900, dg = (r2() - 0.5) * 1.5;
      brush(x, [[sx2, sy2], [sx2 + len2 * 0.5, sy2 + dg * 200 + (r2() - 0.5) * 120], [sx2 + len2, sy2 + dg * 420 + (r2() - 0.5) * 160]], {
        col: r2() < 0.55 ? jit('#5a2f16', r2, 30) : jit('#0a0706', r2, 14),
        w: 40 + r2() * 110, alpha: 0.05 + r2() * 0.07, bristles: 5, seed: (r2() * 1e6) | 0, dens: 5, dry: 0.34, spread: 1.05
      });
    }
    /* the dark is painted AROUND each object, so nothing sits on top of it */
    var r3 = rnd(313);
    ITEMS.forEach(function (it, ii) {
      var rad = 150 * (it.s || 1) + 40;
      for (var k = 0; k < 16; k++) {
        var a0 = r3() * TAU, sp = 0.8 + r3() * 1.6;
        var ring = [];
        for (var q = 0; q <= 5; q++) {
          var aa = a0 + sp * q / 5, rr = rad * (1.05 + r3() * 0.55);
          ring.push([it.sx + Math.cos(aa) * rr, it.sy + Math.sin(aa) * rr * 0.95]);
        }
        brush(x, ring, {
          col: r3() < 0.45 ? jit('#7a4020', r3, 34) : jit('#0a0706', r3, 12),
          w: 44 + r3() * 90, alpha: 0.06 + r3() * 0.12, bristles: 5,
          seed: (r3() * 1e6) | 0, dens: 5, dry: 0.3, spread: 1.05
        });
      }
    });
    textureThrough(x, craze, function (c) { c.rect(0, 0, W, H); }, 0.62, 0, 0);
    var r = rnd(5);
    for (var i = 0; i < 70; i++) {
      var x0 = r() * W, y0 = r() * H, a = r() * TAU, L = 20 + r() * 90;
      brush(x, [[x0, y0], [x0 + Math.cos(a) * L, y0 + Math.sin(a) * L]], {
        col: r() < 0.3 ? P.gold : mix(P.ember, P.gold, 0.35), w: 2 + r() * 5,
        alpha: 0.05 + r() * 0.1, bristles: 2, seed: (r() * 1e6) | 0, dens: 4, dry: 0.5
      });
    }
    spatter(x, W * 0.5, H * 0.5, W * 0.72, 240, P.goldDk, 17, 2.2);
    return p;
  })();

  /* ---------------- the list ---------------- */
  var SCRAPQ = [[122, -44], [902, -76], [958, 1128], [92, 1156]];
  var SCRAP = jagPoly(SCRAPQ, 61, 7, 11);

  var scrapBody = (function () {
    var p = plate(W, H), x = p.x;
    x.save();
    x.shadowColor = rgba('#2a231c', 0.5); x.shadowBlur = 34; x.shadowOffsetX = 14; x.shadowOffsetY = 18;
    x.beginPath(); curve(x, SCRAP, true); x.fillStyle = rgba('#8a7a66', 0.9); x.fill();
    x.restore();
    paperPatch(x, SCRAPQ, {
      seed: 61, amp: 9, step: 14, col: P.paper, fibre: 120, bb: [60, -100, 940, 1300],
      shadow: '#4a3c2e', shadowA: 0.0, edgeCol: '#bba98c', edgeW: 5
    });
    x.save();
    x.beginPath(); curve(x, SCRAP, true); x.clip();
    x.fillStyle = rgba(P.paper, 0.6); x.fillRect(60, -100, 940, 1300);
    var r = rnd(23);
    for (var i = 0; i < 38; i++) {
      var sx = 120 + r() * 820, sy = -40 + r() * 1160;
      brush(x, [[sx, sy], [sx + (r() - 0.5) * 320, sy + (r() - 0.5) * 130]], {
        col: r() < 0.5 ? '#ffffff' : mix(P.paper, '#b09c78', 0.5), w: 22 + r() * 64,
        alpha: 0.07 + r() * 0.11, bristles: 4, seed: (r() * 1e6) | 0, dens: 4, dry: 0.3
      });
    }
    /* folded into quarters and carried in a coat pocket */
    [[[382, -60], [372, 400], [388, 760], [378, 1160]], [[688, -60], [702, 420], [686, 800], [698, 1160]],
     [[60, 524], [400, 512], [740, 534], [1000, 518]]].forEach(function (cr, ci) {
      brush(x, cr, { col: '#8a8074', w: 20, alpha: 0.13, bristles: 4, seed: 611 + ci, dens: 7, dry: 0.35 });
      brush(x, movePts(cr, -5, -6), { col: '#ffffff', w: 13, alpha: 0.3, bristles: 3, seed: 621 + ci, dens: 7, dry: 0.3 });
    });
    /* the mug stood here a while */
    var ring = blobPts(718, 792, 158, 128, 9, 15, 0.06);
    wash(x, ring, { col: '#8B5A2B', seed: 31, layers: 2, alpha: 0.05, edge: 16 });
    brush(x, ring, { col: '#8a5a2a', w: 14, alpha: 0.13, bristles: 4, close: true, seed: 44, dens: 7, dry: 0.45 });
    brush(x, shrinkPts(ring, 0.93), { col: '#8B5A2B', w: 7, alpha: 0.1, bristles: 2, close: true, seed: 45, dens: 7, dry: 0.5 });
    /* she had been painting before she wrote this */
    var th = blobPts(872, 208, 50, 66, 12, 9, 0.24);
    wash(x, th, { col: P.cad, seed: 51, layers: 3, alpha: 0.17, edge: 8, bleed: 6 });
    textureThrough(x, craze, function (c) { curve(c, SCRAP, true); }, 0.55, -60, -80);
    x.restore();
    return p;
  })();

  function inkLayer(seed) {
    var p = plate(W, H), x = p.x;
    hand(x, 'Saturday', LX - 10, 150, 82, { col: P.verm, seed: seed + 1, w: 0.075, bristles: 3, alpha: 0.82, dry: 0.16 });
    brush(x, [[LX - 12, 248], [LX + 190, 240], [LX + 352, 248]], {
      col: P.verm, w: 6, alpha: 0.5, bristles: 2, seed: seed + 2, dens: 7, dry: 0.3, taper: 0.5
    });
    ITEMS.forEach(function (it, i) {
      hand(x, it.w, LX, it.ly, LSZ, {
        col: i === 4 ? mix(P.ink, P.navy, 0.4) : P.pencil,
        seed: seed + 10 + i * 7, w: 0.105, bristles: 3, alpha: 0.92, dry: 0.1
      });
    });
    [0, 2].forEach(function (i, k) {
      var y = ITEMS[i].ly + 34;
      brush(x, [[LX - 82, y - 6], [LX - 60, y + 22], [LX - 22, y - 44]], {
        col: P.cad, w: 9, alpha: 0.85, bristles: 2, seed: seed + 60 + k, dens: 7, taper: 0.4, fade: true
      });
    });
    var by = ITEMS[6].ly + 36, bw = textWidth('biscuits', LSZ);
    brush(x, [[LX - 16, by + 8], [LX + bw * 0.5, by - 10], [LX + bw + 14, by + 4]], {
      col: P.verm, w: 10, alpha: 0.82, bristles: 2, seed: seed + 70, dens: 7, taper: 0.45, fade: true
    });
    /* a star doodled in the margin, before she knew why */
    var star = [];
    for (var s = 0; s < 10; s++) {
      var a = s / 10 * TAU - 1.2, rr = s % 2 ? 15 : 38;
      star.push([828 + Math.cos(a) * rr, 986 + Math.sin(a) * rr]);
    }
    brush(x, star, { col: P.pencil, w: 5, alpha: 0.5, bristles: 2, close: true, seed: seed + 80, dens: 5, dry: 0.2 });
    return p;
  }
  var scrapInk = [inkLayer(100), inkLayer(240)];

  /* the same handwriting, relit in gold on the dark */
  var slateWords = (function () {
    var p = plate(W, H), x = p.x;
    hand(x, 'Saturday', LX - 8, 152, 82, { col: P.goldDk, seed: 301, w: 0.1, bristles: 3, alpha: 0.85 });
    hand(x, 'Saturday', LX - 10, 149, 82, { col: P.gold, seed: 302, w: 0.07, bristles: 2, alpha: 0.9 });
    ITEMS.forEach(function (it, i) {
      hand(x, it.w, LX + 2, it.ly + 3, LSZ, { col: P.goldDk, seed: 310 + i, w: 0.11, bristles: 3, alpha: 0.8 });
      hand(x, it.w, LX, it.ly, LSZ, { col: P.gold, seed: 320 + i, w: 0.085, bristles: 2, alpha: 0.95 });
      hand(x, it.w, LX - 2, it.ly - 2, LSZ, { col: P.goldLt, seed: 330 + i, w: 0.04, bristles: 1, alpha: 0.5, dry: 0.4 });
    });
    return p;
  })();

  /* ---------------- the groceries, painted at monument scale ---------------- */
  function bottle(x, c, m, sd) {
    var pts = [[c - 104, m + 196], [c - 110, m + 10], [c - 54, m - 52], [c - 46, m - 172],
      [c + 46, m - 174], [c + 54, m - 50], [c + 110, m + 14], [c + 104, m + 198], [c, m + 218]];
    var pf = function (k) { curve(k, pts, true); };
    envelope(x, pts, { w: 16, seed: sd, col: '#2a1408', fillCol: '#7f8e93', halo: 2, blur: 30, haloA: 0.5, hox: 7, hoy: 10 });
    impasto(x, pf, {
      base: P.milk, cols: [P.milk, '#cfdadd', P.cream, '#aebfc4'], bb: [c - 140, m - 210, 280, 460],
      seed: sd + 1, n: 20, kw: 40, angle: -1.45, spreadA: 0.3, stipple: 120, lit: '#ffffff', shade: '#6c7c80'
    });
    textureThrough(x, craze, pf, 0.5, -300 - sd % 200, -200);
    /* Charcoal contour. A pale lead-line round every object gave each of them
       a bright die-cut border, which is the sticker tell; the gold relief is
       kept back for the tomato alone, the way she concentrates it. */
    contour(x, pts, { col: '#241205', w: 15, seed: sd + 9, arc: 0.4, vary: 18 });
    brush(x, [[c - 62, m - 20], [c - 72, m + 170]], { col: '#ffffff', w: 20, alpha: 0.3, bristles: 3, seed: sd + 3, dens: 6, dry: 0.3 });
    brush(x, [[c + 66, m + 10], [c + 72, m + 160]], { col: '#7f9095', w: 16, alpha: 0.22, bristles: 3, seed: sd + 4, dens: 6, dry: 0.35 });
    var cap = [[c - 50, m - 174], [c + 50, m - 178], [c + 46, m - 226], [c - 46, m - 222]];
    envelope(x, cap, { w: 10, seed: sd + 5, halo: 1, blur: 16, col: '#2a1408', fillCol: '#6b1410', haloA: 0.5 });
    impasto(x, function (k) { curve(k, cap, true); }, {
      base: P.verm, cols: [P.verm, P.cad, '#8a1410'], bb: [c - 70, m - 240, 140, 90],
      seed: sd + 6, n: 8, kw: 22, stipple: 30, lit: '#ff9a6a', shade: '#4a0c08'
    });
    contour(x, cap, { col: '#2e0d08', w: 9, seed: sd + 7, arc: 0.35, goes: 2 });
  }

  function eggsFn(x, c, m, sd) {
    [[c + 70, m + 62, 78, 110, 0.4], [c - 52, m - 14, 84, 118, -0.22]].forEach(function (e, i) {
      var pts = rotPts(blobPts(e[0], e[1], e[2], e[3], sd + i * 3, 13, 0.045), e[0], e[1], e[4]);
      var pf = function (k) { curve(k, pts, true); };
      envelope(x, pts, { w: 14, seed: sd + i, halo: 2, blur: 26, col: '#2a1408', fillCol: '#9a7a4a', haloA: 0.5, hox: 6, hoy: 9 });
      impasto(x, pf, {
        base: '#e0c69a', cols: ['#e0c69a', '#cba873', '#f0dcb8', '#b8905c'], bb: [e[0] - 130, e[1] - 150, 260, 300],
        seed: sd + 20 + i, n: 18, kw: 34, angle: -0.9, stipple: 90, lit: '#fff2d8', shade: '#6b4a24'
      });
      textureThrough(x, craze, pf, 0.45, -120 * i - 200, -420);
      spatter(x, e[0], e[1], e[2] * 0.85, 54, '#5a3a18', sd + 40 + i, 2.8);
      contour(x, pts, { col: '#2a1608', w: 13, seed: sd + 60 + i, arc: 0.42, vary: 16 });
    });
  }

  function tomato(x, c, m, sd) {
    var pts = blobPts(c, m + 24, 136, 122, sd, 14, 0.06);
    var pf = function (k) { curve(k, pts, true); };
    envelope(x, pts, { w: 18, seed: sd, halo: 2, blur: 32, col: '#2a1408', fillCol: '#7a1c10', haloA: 0.5, hox: 7, hoy: 10 });
    impasto(x, pf, {
      base: P.verm, cols: [P.verm, P.cad, '#e4382b', '#ff7a34'], bb: [c - 160, m - 120, 320, 290],
      seed: sd + 1, n: 24, kw: 44, angle: 0.4, stipple: 110, lit: '#ffb07a', shade: '#5a0f0c'
    });
    textureThrough(x, craze, pf, 0.7, -420, -140);
    bead(x, pts, { w: 11, seed: sd + 2, close: true, dry: 0.2 });
    for (var i = 0; i < 5; i++) {
      var a = i / 5 * TAU - 1.1;
      brush(x, [[c, m - 86], [c + Math.cos(a) * 46, m - 86 + Math.sin(a) * 40], [c + Math.cos(a) * 72, m - 84 + Math.sin(a) * 62]], {
        col: i % 2 ? P.moss : mix(P.moss, P.ink, 0.4), w: 17, alpha: 0.88, bristles: 3, seed: sd + 10 + i, dens: 6, taper: 0.5, fade: true
      });
    }
    brush(x, [[c, m - 92], [c + 6, m - 134]], { col: mix(P.moss, P.ink, 0.5), w: 15, alpha: 0.9, bristles: 3, seed: sd + 30, dens: 5, taper: 0.5 });
  }

  function loaf(x, c, m, sd) {
    var pts = [[c - 168, m + 122], [c - 160, m + 6], [c - 96, m - 82], [c + 4, m - 106],
      [c + 104, m - 78], [c + 162, m + 8], [c + 168, m + 126], [c, m + 148]];
    var pf = function (k) { curve(k, pts, true); };
    envelope(x, pts, { w: 17, seed: sd, halo: 2, blur: 30, col: '#2a1408', fillCol: '#5a3512', haloA: 0.5, hox: 7, hoy: 10 });
    impasto(x, pf, {
      base: P.crust, cols: [P.crust, '#6b3f18', '#a86a28', '#c9862a'], bb: [c - 200, m - 140, 400, 320],
      seed: sd + 1, n: 26, kw: 46, angle: -0.35, stipple: 150, lit: '#e6b25a', shade: '#2e1805'
    });
    textureThrough(x, craze, pf, 0.66, -180, -620);
    contour(x, pts, { col: '#2a1606', w: 14, seed: sd + 3, arc: 0.44, vary: 20 });
    for (var i = 0; i < 3; i++) {
      var y = m - 30 + i * 42;
      scratch(x, [[c - 6 + i * 10, y + 22], [c + 62, y - 12], [c + 134 - i * 8, y + 16]], {
        col: '#f6d79a', dark: '#3a2008', w: 9, seed: sd + 40 + i, alpha: 0.5
      });
    }
    /* the cut end, crumb showing — otherwise it is just a brown mound */
    var face = [[c - 152, m + 110], [c - 158, m + 6], [c - 106, m - 72], [c - 42, m - 92],
      [c - 24, m + 4], [c - 32, m + 122]];
    var ff = function (k) { curve(k, face, true); };
    impasto(x, ff, {
      base: '#e8cf9e', cols: ['#e8cf9e', '#d8ba78', '#f4e6c2'], bb: [c - 180, m - 110, 180, 260],
      seed: sd + 60, n: 10, kw: 44, angle: -1.3, stipple: 140, lit: '#fffaf0', shade: '#a8853c'
    });
    textureThrough(x, craze, ff, 0.5, -320, -120);
    var r2 = rnd(sd + 61);
    for (var h = 0; h < 30; h++) {
      var hxx = c - 148 + r2() * 118, hyy = m - 74 + r2() * 190;
      x.beginPath(); x.arc(hxx, hyy, 3 + r2() * 7, 0, TAU);
      x.fillStyle = rgba('#b8944c', 0.2 + r2() * 0.22); x.fill();
    }
    brush(x, face, { col: mix(P.crust, '#e0a64e', 0.4), w: 12, alpha: 0.6, bristles: 3, close: true, seed: sd + 62, dens: 8, dry: 0.3, vary: 16 });
  }

  /* a paper packet of tea: shop packaging, hand-lettered, one corner gone soft */
  function packet(x, c, m, sd) {
    var pts = jagPoly([[c - 96, m - 128], [c + 92, m - 140], [c + 108, m + 132], [c - 86, m + 146]], sd, 5, 15);
    var pf = function (k) { curve(k, pts, true); };
    envelope(x, pts, { w: 13, seed: sd, halo: 2, blur: 26, col: '#2a1408', fillCol: '#6b2e14', haloA: 0.5, hox: 6, hoy: 9 });
    impasto(x, pf, {
      base: '#a8502a', cols: ['#a8502a', '#8a3c1c', '#c96a32', '#7a2e14'], bb: [c - 140, m - 180, 280, 360],
      seed: sd + 1, n: 18, kw: 44, angle: -1.42, spreadA: 0.28, stipple: 90, lit: '#e08a4a', shade: '#4a1608'
    });
    textureThrough(x, craze, pf, 0.6, -700, -300);
    /* the folded-over top */
    var top = [[c - 96, m - 128], [c + 92, m - 140], [c + 88, m - 66], [c - 92, m - 54]];
    x.save(); x.beginPath(); curve(x, top, true); x.clip();
    x.fillStyle = rgba('#5e2410', 0.45); x.fillRect(c - 140, m - 180, 280, 160);
    brush(x, [[c - 92, m - 60], [c, m - 70], [c + 90, m - 62]], { col: '#e08a4a', w: 9, alpha: 0.4, bristles: 2, seed: sd + 5, dens: 7, dry: 0.3 });
    x.restore();
    brush(x, [[c - 92, m - 56], [c - 4, m - 66], [c + 88, m - 58]], { col: '#f0c090', w: 8, alpha: 0.45, bristles: 2, seed: sd + 6, dens: 7, dry: 0.36 });
    /* cream label, written on by hand */
    var lab = [[c - 62, m - 24], [c + 64, m - 34], [c + 70, m + 62], [c - 58, m + 70]];
    paperPatch(x, lab, {
      seed: sd + 20, col: P.cream, amp: 4, step: 12, fibre: 22, bb: [c - 90, m - 60, 190, 170],
      shadow: '#3a1a0c', shadowA: 0.3, edgeCol: '#c9b28c'
    });
    hand(x, 'tea', c - 42, m - 16, 62, { col: P.ink, seed: sd + 30, w: 0.11, bristles: 3, alpha: 0.88 });
    brush(x, [[c - 44, m + 52], [c + 20, m + 46], [c + 52, m + 52]], { col: P.verm, w: 5, alpha: 0.6, bristles: 2, seed: sd + 31, dens: 7, taper: 0.5 });
    contour(x, pts, { col: '#2a1004', w: 12, seed: sd + 2, arc: 0.44, vary: 16 });
  }

  function lemons(x, c, m, sd) {
    [[c + 74, m + 74, 132, 62, 0.62], [c - 58, m - 18, 146, 68, -0.22]].forEach(function (e, i) {
      var pts = rotPts([[e[0] - e[2], e[1]], [e[0] - e[2] * 0.5, e[1] - e[3]], [e[0] + e[2] * 0.5, e[1] - e[3]],
        [e[0] + e[2], e[1]], [e[0] + e[2] * 0.5, e[1] + e[3]], [e[0] - e[2] * 0.5, e[1] + e[3]]], e[0], e[1], e[4]);
      var pf = function (k) { curve(k, pts, true); };
      envelope(x, pts, { w: 14, seed: sd + i, halo: 2, blur: 26, col: '#2a1408', fillCol: '#8a5a06', haloA: 0.5, hox: 6, hoy: 9 });
      impasto(x, pf, {
        base: P.amber, cols: [P.amber, '#FFD700', '#dc9a10', '#fff2a8', '#e8a908'], bb: [e[0] - 160, e[1] - 120, 320, 240],
        seed: sd + 10 + i, n: 30, kw: 26, angle: e[4], spreadA: 1.25, stipple: 150, crease: 34,
        lit: '#fff7c8', shade: '#7a4a04', drift: 26
      });
      textureThrough(x, craze, pf, 0.6, -520, -700 - i * 60);
      contour(x, pts, { col: '#2e1a04', w: 12, seed: sd + 30 + i, arc: 0.48, vary: 18 });
      [1, -1].forEach(function (sgn, k) {
        var tip = rotPts([[e[0] + sgn * e[2] * 0.92, e[1] + 2], [e[0] + sgn * e[2] * 1.18, e[1] - 6 * sgn]], e[0], e[1], e[4]);
        brush(x, tip, { col: mix(P.amber, P.crust, 0.5), w: 15, alpha: 0.72, bristles: 2, seed: sd + 50 + i * 3 + k, dens: 5, taper: 0.5 });
      });
      spatter(x, e[0], e[1], e[2] * 0.7, 70, '#8a5a06', sd + 80 + i, 1.8);
    });
  }

  function biscuit(x, c, m, sd) {
    var pts = blobPts(c, m + 18, 142, 136, sd, 16, 0.04);
    var pf = function (k) { curve(k, pts, true); };
    envelope(x, pts, { w: 18, seed: sd, halo: 2, blur: 34, col: '#2a1408', fillCol: '#9a7838', haloA: 0.5, hox: 8, hoy: 11 });
    impasto(x, pf, {
      base: '#e6cf9a', cols: ['#e6cf9a', '#d8bb7a', '#c9a55a', '#f2e2b8', '#be9448'], bb: [c - 170, m - 140, 340, 320],
      seed: sd + 1, n: 30, kw: 30, angle: 0.9, spreadA: 1.4, stipple: 190, crease: 40,
      lit: '#fff6dc', shade: '#6b4a1c'
    });
    textureThrough(x, craze, pf, 0.7, -260, -300);
    contour(x, pts, { col: '#2a1c08', w: 13, seed: sd + 2, arc: 0.5, vary: 18 });
    /* Docker holes poked by hand, so they wander off the ring and vary: the
       even polar grid this replaced was the clearest sticker tell on the
       whole shelf. */
    var r = rnd(sd + 5);
    for (var i = 0; i < 13; i++) {
      var a = r() * TAU, d = 22 + r() * 82;
      var hxx = c + Math.cos(a) * d, hyy = m + 18 + Math.sin(a) * d * 0.94;
      var hrr = 5.5 + r() * 5;
      x.beginPath();
      x.ellipse(hxx, hyy, hrr * (0.8 + r() * 0.5), hrr * (0.8 + r() * 0.5), r() * TAU, 0, TAU);
      x.fillStyle = rgba('#4a2e08', 0.42 + r() * 0.24); x.fill();
      x.beginPath(); x.arc(hxx - hrr * 0.3, hyy - hrr * 0.34, hrr * 0.5, 0, TAU);
      x.fillStyle = rgba('#fff0c0', 0.2 + r() * 0.2); x.fill();
    }
    /* a bite out of it, because obviously */
    var bite = blobPts(c - 118, m - 82, 56, 50, sd + 7, 9, 0.2);
    x.save(); x.globalCompositeOperation = 'destination-out';
    x.beginPath(); curve(x, bite, true); x.fill();
    x.restore();
    /* the bite line only exists where there is biscuit for it to be bitten
       out of; drawn all the way round it reads as a handle stuck on the side */
    x.save();
    x.beginPath(); curve(x, pts, true); x.clip();
    brush(x, bite, { col: P.ink, w: 12, alpha: 0.55, bristles: 3, close: true, seed: sd + 8, dens: 7, dry: 0.35 });
    x.restore();
  }

  var PAINTERS = { bottle: bottle, eggs: eggsFn, tomato: tomato, loaf: loaf, packet: packet, lemons: lemons, biscuit: biscuit };
  var SPR = ITEMS.map(function (it, i) {
    var p = plate(SPS, SPS);
    PAINTERS[it.kind](p.x, SPC, SPC, 900 + i * 37);
    return p;
  });

  /* drips into the quiet corner, and the aside */
  var extrasP = (function () {
    var p = plate(W, H), x = p.x, r = rnd(66);
    [[688, 900, 12], [296, 872, 10]].forEach(function (d, i) {
      drip(x, d[0] + (r() - 0.5) * 40, d[1], 80 + r() * 90, d[2], P.gold, 700 + i);
    });
    hand(x, 'crossed off, and the', 62, 902, 44, { col: mix(P.cream, P.gold, 0.3), seed: 811, w: 0.08, bristles: 2, alpha: 0.78 });
    hand(x, 'brightest thing in it', 92, 962, 44, { col: mix(P.cream, P.gold, 0.3), seed: 812, w: 0.08, bristles: 2, alpha: 0.78 });
    return p;
  })();

  /* paint-on order: the paper is laid in bands, then written on */
  var paperStrokes = (function () {
    var s = [], i;
    for (i = 0; i < 10; i++) {
      var y = -80 + i * 134;
      s.push({ pts: [[40, y + 40], [400, y - 20], [760, y + 50], [1040, y - 10]], w: 250 });
    }
    s.push({ pts: [[560, 700], [718, 656], [880, 792], [718, 930], [560, 800]], w: 270, close: true });
    s.push({ pts: [[806, 152], [896, 192], [872, 276]], w: 180 });
    return s;
  })();
  var paperRev = new Reveal(W, H, paperStrokes);

  var inkStrokes = (function () {
    var s = [];
    s.push({ pts: [[LX - 24, 196], [LX + 200, 182], [LX + 400, 198]], w: 170 });
    ITEMS.forEach(function (it) {
      s.push({ pts: [[LX - 96, it.ly + 34], [LX + 160, it.ly + 20], [LX + textWidth(it.w, LSZ) + 44, it.ly + 36]], w: 128 });
    });
    s.push({ pts: [[780, 952], [852, 990], [816, 1046]], w: 150 });
    return s;
  })();
  var inkRev = new Reveal(W, H, inkStrokes);

  /* scrubbing cream back over the dark: diagonal, alternating direction,
     the way you actually scrub a surface down */
  var wipeStrokes = (function () {
    /* Short overlapping passes rather than one long swipe per step. Full-width
       strokes revealed in order gave a perfectly straight diagonal edge -- a
       sheet of plastic sliding across -- because a 1600px stroke cannot wobble
       at a scale the eye reads. These advance in bands along the diagonal
       while scattering sideways, so the front stays broken and blotchy the way
       a rag works a surface back. */
    var s = [], r = rnd(451), bands = 24, per = 8;
    for (var b = 0; b < bands; b++) {
      var base = -320 + (b / (bands - 1)) * 1740;
      var offs = [];
      for (var k = 0; k < per; k++) offs.push(-820 + (k / (per - 1)) * 1640 + (r() - 0.5) * 150);
      for (var k2 = offs.length - 1; k2 > 0; k2--) {
        var sw = (r() * (k2 + 1)) | 0, tmp = offs[k2]; offs[k2] = offs[sw]; offs[sw] = tmp;
      }
      offs.forEach(function (off) {
        var c = base + (r() - 0.5) * 70;
        var cx = c + off, cy = c - off;
        var ang = -Math.PI / 4 + (r() - 0.5) * 0.5;
        var L = 440 + r() * 340, d = r() < 0.5 ? 1 : -1;
        var p0 = [cx - Math.cos(ang) * L / 2 * d, cy - Math.sin(ang) * L / 2 * d];
        var p1 = [cx + Math.cos(ang) * L / 2 * d, cy + Math.sin(ang) * L / 2 * d];
        var mid = [(p0[0] + p1[0]) / 2 + (r() - 0.5) * 90, (p0[1] + p1[1]) / 2 + (r() - 0.5) * 90];
        s.push({ pts: [p0, mid, p1], w: 150 + r() * 90 });
      });
    }
    return s;
  })();
  var wipeRev = new Reveal(W, H, wipeStrokes);
