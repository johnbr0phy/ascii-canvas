(function () {
  var W = 1080, H = 1080, DUR = 13.0;
  var cv = document.getElementById('c'), X = cv.getContext('2d');

  var P = {
    plaster: '#E2D6C4', putty: '#cdbea6', clay: '#b8a288', shade: '#8d7d68',
    cream: '#F5F0E6', ink: '#1A1A1A', char: '#241a12',
    enamel: '#2F7C89', enamelLt: '#63b3bd', enamelDk: '#123b45',
    cad: '#E34F0C', verm: '#C8102E', amber: '#F3B616', gold: '#C9A227',
    storm: '#2b3644', stormDk: '#101823', stormLt: '#6d8296',
    steam: '#eef2f2', slate: '#5c6a72', tin: '#9aa6a8'
  };

  var craze = crazePlate(W, H, { seed: 61, facets: 130, lines: 260 });
  var grain = grainPlate(W, H, 8, 19, true);
  var bellyP = plate(W, H);
  var cloudP = plate(W, H);

  /* ---------------- the kitchen, as two weathers ---------------- */
  var BENCH = 946;

  function room(storm) {
    var p = plate(W, H), x = p.x, r = rnd(storm ? 71 : 17);
    ground(x, W, H, {
      base: storm ? P.storm : P.plaster, seed: storm ? 73 : 19,
      tints: storm
        ? [P.stormDk, '#1d2836', '#39485c', '#0b1118', '#4a5f70']
        : [P.putty, P.clay, P.plaster, '#d8c9ae', '#a89680', '#c2b49c', '#8f8470'],
      mottle: 150, sweeps: 80, scrape: 70, drift: 28,
      dark: storm ? '#03070c' : '#6f6252', light: storm ? '#8fa8bc' : '#fffaf0',
      vignette: storm ? 0.46 : 0.3
    });
    x.save();
    x.globalAlpha = storm ? 0.42 : 0.6;
    x.drawImage(craze.c, 0, 0);
    x.restore();
    /* Forecast slips torn into the wall. This is where the gag lives without
       becoming a chart: printed figures on paper she has torn and stuck down,
       not arrows drawn over an empty slate. */
    for (var s = 0; s < 5; s++) {
      var pw = 130 + r() * 230, ph = 90 + r() * 190;
      var px0 = r() * (W - pw * 0.7) - pw * 0.15, py0 = 330 + r() * 250;
      x.save();
      /* Half-buried. At full strength these came forward as bright lined
         notes pinned to the wall; in the refs the newsprint is nearly
         painted out and you only catch it. */
      x.globalAlpha = 0.34 + r() * 0.2;
      paperPatch(x, [[px0, py0], [px0 + pw, py0 - 10 + r() * 20],
        [px0 + pw + (r() - 0.5) * 22, py0 + ph], [px0 + (r() - 0.5) * 22, py0 + ph]], {
        seed: (r() * 1e5) | 0, amp: 5, step: 17, fibre: 26,
        col: storm ? mix('#c4b9a4', P.stormDk, 0.66) : jit('#ddd0b6', r, 16),
        bb: [px0 - 30, py0 - 30, pw + 60, ph + 60],
        print: { lh: 16, h: 2.6, col: storm ? '#63727e' : '#7d7160', figs: 1 + (r() * 3 | 0) },
        shadowA: storm ? 0.2 : 0.12, edgeW: 3.5,
        edgeCol: storm ? '#0a1016' : mix('#ddd0b6', '#6b6055', 0.5)
      });
      x.restore();
      /* scrubbed back into the wall so it is not sitting on top of it */
      for (var sk = 0; sk < 5; sk++) {
        var kx0 = px0 - 30 + r() * (pw + 60), ky0 = py0 - 20 + r() * (ph + 40);
        brush(x, [[kx0, ky0], [kx0 + 70 + r() * 190, ky0 + (r() - 0.5) * 50]], {
          col: storm ? jit('#222e3c', r, 20) : jit(mix(P.putty, P.clay, r()), r, 24),
          w: 40 + r() * 90, alpha: 0.1 + r() * 0.16, bristles: 4,
          seed: (r() * 1e6) | 0, dens: 5, taper: 0.85, spread: 0.6, thick: 2.6
        });
      }
    }
    /* Run-off and old splashes on the tiles, so the wall has a history */
    for (var w0 = 0; w0 < 16; w0++) {
      var wx = r() * W, wy = r() * (BENCH - 120);
      wash(x, blobPts(wx, wy, 70 + r() * 160, 90 + r() * 180, (r() * 1e5) | 0, 13, 0.2), {
        col: storm ? jit('#1b2632', r, 20) : jit(r() < 0.5 ? '#c4b296' : '#ab9c8c', r, 24),
        seed: (r() * 1e5) | 0, layers: 3, alpha: 0.055, edge: 0, bleed: 6
      });
    }
    /* the bench: a heavier band of the same family, laid in flat sweeps */
    x.save();
    x.beginPath();
    var lip = [[-30, BENCH + 6], [280, BENCH - 12], [660, BENCH + 8], [1110, BENCH - 10],
      [1110, 1110], [-30, 1110]];
    curve(x, lip, true); x.clip();
    for (var i = 0; i < 34; i++) {
      var by = BENCH - 24 + r() * 190, bx = -140 + r() * 300;
      brush(x, [[bx, by], [bx + 420 + r() * 480, by + (r() - 0.5) * 40],
        [bx + 920 + r() * 300, by + (r() - 0.5) * 34]], {
        col: storm ? jit('#151e28', r, 20) : jit(mix(P.clay, P.shade, r() * 0.8), r, 26),
        w: 30 + r() * 80, alpha: 0.14 + r() * 0.2, bristles: 4,
        seed: (r() * 1e6) | 0, dens: 5, spread: 0.6, thick: 2.6, taper: 0.9
      });
    }
    x.restore();
    /* The bench meets the wall in scumble, not a ruled line */
    for (var hz = 0; hz < 24; hz++) {
      var hx0 = r() * W, hy0 = BENCH - 30 + (r() - 0.5) * 54;
      brush(x, [[hx0, hy0], [hx0 + 120 + r() * 320, hy0 + (r() - 0.5) * 26]], {
        col: storm ? jit('#3c4c5e', r, 22) : jit(mix(P.putty, '#ffffff', 0.4), r, 22),
        w: 16 + r() * 46, alpha: 0.05 + r() * 0.09, bristles: 4,
        seed: (r() * 1e6) | 0, dens: 5, taper: 0.8, spread: 0.6, thick: 2.6
      });
    }
    applyGrain(x, grain, storm ? 0.16 : 0.2, W, H);
    return p;
  }

  /* ---------------- the heat ----------------
     Her habit is a large quiet ground with the warmth put in one place. On the
     dog it is a scumbled orange halo pushed into the wall behind the head; the
     flame gets the same treatment, bloomed into the ground rather than drawn
     as a ring of tongues. */
  function heat(x, cx, cy, f, big) {
    if (f <= 0) return;
    var r = rnd(3301);
    /* The halo in the refs is scumbled into the wall around and behind the
       form, so the warmth belongs to the ground. Kept low and wide at the
       foot it was only a smear of highlighter on the bench. */
    for (var g = 0; g < 46; g++) {
      var ga = r() * TAU;
      var gd = (50 + Math.pow(r(), 0.8) * (big ? 310 : 250)) * (0.55 + 0.45 * f);
      var gx = cx + Math.cos(ga) * gd * 0.92;
      var gy = cy - 210 + Math.sin(ga) * gd * 0.82;
      var rad = 70 + r() * (big ? 180 : 140);
      x.save();
      x.globalCompositeOperation = 'lighter';
      var gr = x.createRadialGradient(gx, gy, 0, gx, gy, rad);
      gr.addColorStop(0, rgba(r() < 0.34 ? P.amber : P.cad, (0.045 + r() * 0.1) * f));
      gr.addColorStop(1, rgba(P.cad, 0));
      x.fillStyle = gr;
      x.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
      x.restore();
    }
    /* and dragged about with a dry brush, the way she works it in */
    for (var w0 = 0; w0 < 26; w0++) {
      var wa = r() * TAU, wd = 120 + r() * 220;
      var wx = cx + Math.cos(wa) * wd, wy = cy - 220 + Math.sin(wa) * wd * 0.8;
      brush(x, [[wx, wy], [wx + (r() - 0.5) * 220, wy + (r() - 0.5) * 170]], {
        col: jit(r() < 0.5 ? P.cad : P.amber, r, 30), w: 44 + r() * 110,
        alpha: (0.025 + r() * 0.055) * f, bristles: 4, seed: 3350 + w0,
        dens: 5, taper: 0.85, spread: 0.6, thick: 2.6
      });
    }
    /* what it does to the bench directly under the body */
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (var b = 0; b < 10; b++) {
      var bx = cx + (r() - 0.5) * 300, by = cy + 18 + (r() - 0.5) * 46;
      var brad = 60 + r() * 110;
      var bg = x.createRadialGradient(bx, by, 0, bx, by, brad);
      bg.addColorStop(0, rgba(P.amber, (0.08 + r() * 0.14) * f));
      bg.addColorStop(1, rgba(P.cad, 0));
      x.fillStyle = bg;
      x.fillRect(bx - brad, by - brad, brad * 2, brad * 2);
    }
    x.restore();
    /* the gas itself: short blue-hearted licks, uneven, some missing */
    var n = 13;
    for (var i = 0; i < n; i++) {
      var la = -Math.PI / 2 + (i / n - 0.5) * 2.5;
      if (r() < 0.18) continue;
      var L = (26 + r() * 46) * f;
      var bx = cx + Math.cos(la) * 128, by = cy + Math.sin(la) * 34;
      var lick = [[bx, by], [bx + (r() - 0.5) * 14, by - L * 0.6], [bx + (r() - 0.5) * 22, by - L]];
      brush(x, lick, {
        col: mix(P.cad, P.amber, r()), w: 13 + r() * 12, alpha: 0.34 + r() * 0.3,
        bristles: 3, seed: 3400 + i, dens: 6, taper: 0.5, spread: 0.6,
        thick: 2.2, fade: true
      });
      brush(x, lick, {
        col: '#3b7fd8', w: 5 + r() * 5, alpha: 0.2 + r() * 0.2,
        bristles: 1, seed: 3440 + i, dens: 6, taper: 0.6, ribbon: true
      });
    }
  }

  /* ---------------- the kettle ---------------- */
  var KX = 404, KY = 690;
  /* Wider at the foot than the shoulder, and not quite upright: an enamel
     kettle that has been knocked about. The wonk is deliberate. */
  var BODY = [[KX - 176, KY + 228], [KX - 196, KY + 60], [KX - 168, KY - 96],
    [KX - 96, KY - 156], [KX + 86, KY - 162], [KX + 164, KY - 88],
    [KX + 192, KY + 66], [KX + 178, KY + 232], [KX + 40, KY + 254]];
  var LID = [[KX - 104, KY - 150], [KX - 78, KY - 206], [KX + 6, KY - 224],
    [KX + 86, KY - 204], [KX + 108, KY - 148]];
  /* The spout is a shape with a taper in it, not a stroke. Drawn as a ribbon
     of even weight with a chevron on the end it came out as a black hook
     stuck to the side of the kettle. */
  var SPOUT = [[KX - 150, KY - 96], [KX - 252, KY - 150], [KX - 330, KY - 232],
    [KX - 374, KY - 300], [KX - 320, KY - 314], [KX - 298, KY - 262],
    [KX - 236, KY - 184], [KX - 146, KY - 10]];
  var SPOUT_MID = [[KX - 150, KY - 54], [KX - 246, KY - 168], [KX - 340, KY - 288]];
  var HANDLE = [[KX - 132, KY - 172], [KX - 106, KY - 288], [KX + 10, KY - 326],
    [KX + 126, KY - 288], [KX + 150, KY - 170]];
  var CUP = [[796, 806], [790, 906], [816, 938], [906, 940], [934, 906],
    [928, 804], [862, 792]];

  function paintKettle(x, storm) {
    var st = function (a, b, t) { return storm ? mix(a, b, t) : a; };

    /* Spout and handle go down first so the body is laid over their joins and
       there is no seam to explain. */
    var sf = function (k) { curve(k, SPOUT, true); };
    envelope(x, SPOUT, {
      w: 13, seed: 509, col: '#0d1518', fillCol: st(P.enamelDk, P.stormDk, 0.5),
      halo: 1, blur: 22, haloA: 0.46, hox: 7, hoy: 10
    });
    impasto(x, sf, {
      base: st(P.enamel, P.stormDk, 0.44),
      cols: [st(P.enamel, P.stormDk, 0.44), st(P.enamelLt, P.stormLt, 0.5), st('#12414c', '#071620', 0.5)],
      bb: [KX - 400, KY - 340, 280, 360], seed: 510, n: 18, kw: 19,
      angle: -0.85, spreadA: 0.9, stipple: 60, crease: 16,
      lit: st('#b8e2e6', '#9ab4c4', 0.5), shade: st('#06222a', '#03080e', 0.5)
    });
    brush(x, SPOUT_MID, {
      col: st(P.enamelLt, P.stormLt, 0.5), w: 11, alpha: 0.34, bristles: 1,
      seed: 512, dens: 9, arc: 0.35, ribbon: true
    });
    contour(x, SPOUT, { col: '#0d1518', w: 14, seed: 511, arc: 0.44, vary: 18 });
    /* the dark of the bore, so the lip is a hole and not a point */
    wash(x, [[KX - 372, KY - 298], [KX - 324, KY - 310], [KX - 304, KY - 272], [KX - 350, KY - 262]], {
      col: '#040d12', seed: 513, layers: 3, alpha: 0.34, edge: 0
    });

    /* handle: bakelite, the one warm note on the object itself */
    brush(x, HANDLE, {
      col: '#1b0d06', w: 40, alpha: 0.9, bristles: 2, seed: 520, dens: 11,
      ribbon: true, spread: 0.5
    });
    brush(x, HANDLE, {
      col: st('#5a2d16', '#22150c', 0.5), w: 29, alpha: 0.97, bristles: 3,
      seed: 521, dens: 11, vary: 22, ribbon: true, spread: 0.46
    });
    brush(x, movePts(HANDLE, 0, -8), {
      col: st('#a8683a', '#5c4530', 0.5), w: 8, alpha: 0.4, bristles: 1,
      seed: 522, dens: 11, arc: 0.35, ribbon: true
    });

    contact(x, KX + 16, KY + 254, 206, 42, storm ? '#04090f' : '#4a3a28', 5001);
    var pf = function (k) { curve(k, BODY, true); };
    envelope(x, BODY, {
      w: 20, seed: 501, col: '#0d1518', fillCol: st(P.enamelDk, P.stormDk, 0.5),
      halo: 2, blur: 38, haloA: 0.5, hox: 10, hoy: 16
    });
    impasto(x, pf, {
      base: st(P.enamel, P.stormDk, 0.44),
      cols: [st(P.enamel, P.stormDk, 0.44), st(P.enamelLt, P.stormLt, 0.5),
        st(P.enamelDk, '#06121a', 0.5), st('#4a97a2', '#2c4e5e', 0.5)],
      bb: [KX - 230, KY - 220, 460, 510], seed: 502, n: 46, kw: 26, len: 0.42,
      angle: -1.42, spreadA: 1.5, stipple: 180, crease: 44, drift: 30,
      lit: st('#b8e2e6', '#9ab4c4', 0.5), shade: st('#06222a', '#03080e', 0.5)
    });
    /* a few strokes taken round the barrel, so the form turns */
    x.save(); x.beginPath(); pf(x); x.clip();
    var rb = rnd(505);
    for (var w1 = 0; w1 < 14; w1++) {
      var wy1 = KY - 170 + rb() * 420;
      brush(x, [[KX - 210, wy1 + (rb() - 0.5) * 30], [KX - 40, wy1 - 16 - rb() * 20],
        [KX + 200, wy1 + (rb() - 0.5) * 26]], {
        col: rb() < 0.45 ? st('#b8e2e6', '#9ab4c4', 0.5) : st('#0c3038', '#04101a', 0.5),
        w: 14 + rb() * 44, alpha: 0.05 + rb() * 0.1, bristles: 4,
        seed: 560 + w1, dens: 6, taper: 0.85, spread: 0.6, thick: 2.6
      });
    }
    x.restore();
    textureThrough(x, craze, pf, 0.62, -160, -260);
    /* Chipped enamel down to the black tin beneath, because everything of
       hers has been used. */
    var r = rnd(506);
    /* A few chips, small, and mostly near the foot where it gets knocked.
       Sixteen of them ringed in pale enamel read as spots on a cow. */
    x.save(); x.beginPath(); pf(x); x.clip();
    for (var c = 0; c < 9; c++) {
      var ca = r() * TAU, cd = 96 + r() * 96;
      var chy = KY + 90 + Math.sin(ca) * cd * 1.15;
      var ch = blobPts(KX + Math.cos(ca) * cd, chy,
        3.5 + r() * 8, 3 + r() * 7, (r() * 1e5) | 0, 8, 0.34);
      wash(x, ch, { col: '#0a1418', seed: (r() * 1e5) | 0, layers: 2, alpha: 0.22, edge: 0 });
      brush(x, shrinkPts(ch, 1.4).slice(0, 5), {
        col: st('#cfe8ea', '#7f96a6', 0.5), w: 2.4, alpha: 0.26, bristles: 1,
        seed: (r() * 1e5) | 0, dens: 6, arc: 0.6, ribbon: true
      });
    }
    x.restore();
    contour(x, BODY, { col: '#0d1518', w: 21, seed: 503, arc: 0.4, vary: 20 });

    /* lid and knob */
    var lf = function (k) { curve(k, LID, true); };
    envelope(x, LID, { w: 13, seed: 530, col: '#0d1518', fillCol: st(P.enamelDk, P.stormDk, 0.5), halo: 1, blur: 20, haloA: 0.45 });
    impasto(x, lf, {
      base: st(P.enamel, P.stormDk, 0.44),
      cols: [st(P.enamel, P.stormDk, 0.44), st(P.enamelLt, P.stormLt, 0.5), st('#1a4c58', '#0a1a26', 0.5)],
      bb: [KX - 130, KY - 240, 260, 110], seed: 531, n: 14, kw: 24,
      angle: 0.1, spreadA: 0.9, stipple: 60, crease: 14,
      lit: st('#c2e8ec', '#9ab4c4', 0.5), shade: st('#06222a', '#03080e', 0.5)
    });
    contour(x, LID, { col: '#0d1518', w: 13, seed: 532, arc: 0.4, goes: 2 });
    brush(x, [[KX + 4, KY - 222], [KX + 6, KY - 254]], {
      col: '#1b0d06', w: 19, alpha: 0.92, bristles: 2, seed: 533, dens: 6, ribbon: true
    });
    x.beginPath(); x.ellipse(KX + 6, KY - 262, 24, 17, 0.1, 0, TAU);
    x.fillStyle = rgba('#1b0d06', 0.95); x.fill();
    x.beginPath(); x.ellipse(KX - 2, KY - 268, 8, 5, 0.1, 0, TAU);
    x.fillStyle = rgba(st('#a8683a', '#5c4530', 0.5), 0.5); x.fill();
  }

  /* Both objects need to be standing on something. Without a pool of shade
     where they meet the bench they hover, which is the sticker complaint in
     another form. */
  function contact(x, cx, cy, rx, ry, col, seed) {
    var r = rnd(seed);
    for (var i = 0; i < 7; i++) {
      wash(x, blobPts(cx + (r() - 0.5) * 20, cy + i * 3, rx * (1 - i * 0.09),
        ry * (1 - i * 0.07), seed + i, 13, 0.2), {
        col: col, seed: seed + i * 3, layers: 2, alpha: 0.07, edge: 0
      });
    }
    for (var k = 0; k < 10; k++) {
      var kx0 = cx - rx + r() * rx * 2;
      brush(x, [[kx0, cy - 6 + r() * 16], [kx0 + 40 + r() * 130, cy - 4 + r() * 18]], {
        col: col, w: 12 + r() * 34, alpha: 0.06 + r() * 0.11, bristles: 4,
        seed: seed + 40 + k, dens: 5, taper: 0.85, spread: 0.6, thick: 2.6
      });
    }
  }

  function paintCup(x, storm) {
    var st = function (a, b, t) { return storm ? mix(a, b, t) : a; };
    contact(x, 866, 942, 84, 20, storm ? '#04090f' : '#4a3a28', 6001);
    var pf = function (k) { curve(k, CUP, true); };
    envelope(x, CUP, {
      w: 12, seed: 601, col: '#1a1208', fillCol: st('#8d7a5c', P.stormDk, 0.5),
      halo: 2, blur: 22, haloA: 0.46, hox: 7, hoy: 11
    });
    impasto(x, pf, {
      base: st(P.cream, P.stormLt, 0.42),
      cols: [st(P.cream, P.stormLt, 0.42), st('#e2d8c0', '#7f95a6', 0.45), st('#bfae90', '#4a5d6c', 0.5)],
      bb: [766, 770, 200, 200], seed: 602, n: 16, kw: 22,
      angle: -1.4, spreadA: 0.9, stipple: 80, crease: 18,
      lit: st('#fffaf0', '#c4d4dc', 0.5), shade: st('#8a7a5c', '#1a2832', 0.5)
    });
    textureThrough(x, craze, pf, 0.5, -700, -640);
    /* One band of colour round the rim. Everything of hers has a bit of
       decoration on it that does not quite line up. */
    brush(x, [[794, 828], [862, 818], [932, 826]], {
      col: st(P.cad, '#7a3a20', 0.5), w: 11, alpha: 0.7, bristles: 2,
      seed: 603, dens: 8, arc: 0.4, ribbon: true
    });
    contour(x, CUP, { col: '#1a1208', w: 13, seed: 604, arc: 0.44, vary: 16 });
    /* handle, on the far side, slightly too small */
    var hl = [[930, 842], [972, 846], [976, 890], [936, 896]];
    brush(x, hl, { col: '#1a1208', w: 17, alpha: 0.88, bristles: 2, seed: 605, dens: 9, ribbon: true });
    brush(x, hl, { col: st(P.cream, P.stormLt, 0.42), w: 9, alpha: 0.9, bristles: 2, seed: 606, dens: 9, ribbon: true });
  }

  /* ---------------- the cloud ----------------
     Built as mass, lit on the shoulder and heavy underneath, so it reads as
     weather rather than a cartoon bubble. Never outlined: an outlined cloud
     is a speech balloon. */
  var CLOUD = (function () {
    var lobes = [], r = rnd(701);
    var spine = [[186, 236], [300, 176], [434, 146], [566, 162], [688, 206], [780, 268]];
    for (var i = 0; i < spine.length; i++) {
      for (var k = 0; k < 3; k++) {
        lobes.push({
          x: spine[i][0] + (r() - 0.5) * 120, y: spine[i][1] + (r() - 0.5) * 96 + k * 22,
          rx: 84 + r() * 96, ry: 54 + r() * 62, s: r()
        });
      }
    }
    return lobes;
  })();

  function paintCloud(x, dark, f) {
    if (f <= 0) return;
    var r = rnd(711);
    var base = mix('#d4d8d6', '#2a2f36', dark);
    var lit = mix('#fdfdfb', '#7d8a96', dark);
    var low = mix('#a3a8a6', '#0d1218', dark);
    /* Painted as one mass, not lobe by lobe. Giving each lobe its own impasto
       pass scattered short dark marks all over the top of the square, which
       read as debris blown about rather than a body of cloud. So: the lobes
       only establish the silhouette, and the knife work runs across the whole
       of it in one direction, with the weight below and the light above. */
    var grown = [];
    CLOUD.forEach(function (lo, i) {
      var g = clamp01(f * CLOUD.length * 0.62 - i * 0.34);
      if (g > 0) grown.push({ lo: lo, g: g });
    });
    if (!grown.length) return;
    /* The silhouette is torn, not scalloped. Stacked clean ellipses gave a
       thought balloon, which is the one shape a cloud must not be. */
    var silo = function (k) {
      grown.forEach(function (e, i) {
        var lp = blobPts(e.lo.x, e.lo.y, e.lo.rx * e.g, e.lo.ry * e.g, 721 + i, 13, 0.3);
        k.moveTo(lp[0][0], lp[0][1]);
        curve(k, jagPoly(lp, 760 + i, 9, 26), true);
      });
    };
    grown.forEach(function (e, i) {
      wash(x, jagPoly(blobPts(e.lo.x, e.lo.y, e.lo.rx * e.g, e.lo.ry * e.g, 721 + i, 13, 0.3),
        760 + i, 9, 26), {
        col: mix(base, low, e.lo.s * 0.55), seed: 730 + i, layers: 3,
        alpha: 0.17 + 0.09 * e.lo.s, edge: 0, bleed: 4
      });
    });
    var bb = [110, 60, 760, 330];
    x.save();
    x.beginPath(); silo(x); x.clip();
    /* An opaque core. Left translucent all the way through, the torn-paper
       newsprint on the wall behind printed straight through the cloud and
       tiled it with little grey blocks. */
    x.globalAlpha = 0.66 * Math.min(1, f * 1.4);
    x.fillStyle = mix(base, lit, 0.28);
    x.fillRect(0, 0, W, H);
    x.globalAlpha = 1;
    /* the roll of it: broad slow strokes lying along the cloud, lightening
       upward, so the mass turns over */
    for (var s = 0; s < 54; s++) {
      var sy = bb[1] + r() * bb[3];
      var up = 1 - (sy - bb[1]) / bb[3];
      var sx = bb[0] - 120 + r() * (bb[2] + 180);
      var L = 130 + r() * 330;
      /* No dry gaps on the wide passes. At this width the gaps land at a
         similar size all over and tile the cloud into grey brickwork. */
      brush(x, [[sx, sy], [sx + L * 0.5, sy + (r() - 0.5) * 34], [sx + L, sy + (r() - 0.5) * 44]], {
        col: jit(mix(low, lit, Math.pow(up, 0.8) * (0.35 + r() * 0.65)), r, 14),
        w: 40 + r() * 90, alpha: 0.08 + r() * 0.13, bristles: 4,
        seed: 740 + s, dens: 5, taper: 0.85, spread: 0.6, thick: 2.6
      });
    }
    /* curdling at the top where it is piling up */
    for (var c = 0; c < 26; c++) {
      var cx0 = bb[0] + r() * bb[2], cy0 = bb[1] + r() * bb[3] * 0.45;
      var cr = 26 + r() * 62;
      wash(x, blobPts(cx0, cy0, cr, cr * (0.5 + r() * 0.5), (r() * 1e5) | 0, 9, 0.3), {
        col: r() < 0.62 ? lit : mix(base, lit, 0.5), seed: (r() * 1e5) | 0,
        layers: 2, alpha: 0.075, edge: 0
      });
    }
    /* and the flat wet underside it will rain out of */
    for (var w0 = 0; w0 < 20; w0++) {
      var wx = bb[0] - 60 + r() * (bb[2] + 120);
      var wy = bb[1] + bb[3] * (0.66 + r() * 0.38);
      brush(x, [[wx, wy], [wx + 120 + r() * 240, wy + (r() - 0.5) * 30]], {
        col: mix(low, '#05090e', 0.3 + r() * 0.4), w: 46 + r() * 92,
        alpha: 0.07 + r() * 0.12, bristles: 4, seed: 790 + w0, dens: 5,
        taper: 0.85, spread: 0.6, thick: 2.6
      });
    }
    textureThrough(x, craze, function (k) { k.rect(0, 0, W, H); }, 0.3, -200, -140);
    x.restore();
    /* the lit shoulder, laid over the silhouette edge so the top catches */
    for (var t = 0; t < 18; t++) {
      var tx = 190 + r() * 580;
      brush(x, [[tx, 128 + r() * 58], [tx + 80 + r() * 160, 120 + r() * 62]], {
        col: mix('#ffffff', '#93a4b4', dark), w: 24 + r() * 52,
        alpha: (0.05 + r() * 0.09) * f, bristles: 4, seed: 780 + t, dens: 5,
        taper: 0.85, spread: 0.6, thick: 2.6
      });
    }
  }

  /* ---------------- steam: the column that feeds it ---------------- */
  function steam(x, u, f, dark) {
    if (f <= 0) return;
    var step = Math.floor(u * 12), r = rnd(step * 6151 + 29);
    var sx0 = KX - 340, sy0 = KY - 330;
    for (var i = 0; i < 16; i++) {
      var sway = Math.sin(step * 0.31 + i) * 34;
      var climb = 90 + r() * 320;
      var pts = [[sx0 + (r() - 0.5) * 30, sy0 - r() * 20],
        [sx0 + sway * 0.5 + (r() - 0.5) * 44, sy0 - climb * 0.45],
        [sx0 + sway + (r() - 0.5) * 70, sy0 - climb]];
      brush(x, pts, {
        col: mix(P.steam, '#8d9aa6', dark), w: 30 + r() * 62,
        alpha: (0.04 + r() * 0.08) * f, bristles: 4, seed: (r() * 1e6) | 0,
        dens: 6, taper: 0.8, spread: 0.6, thick: 2.6, fade: true
      });
    }
    /* a few whole curls, so the column has drawing in it as well as haze */
    for (var c = 0; c < 4; c++) {
      var cy0 = sy0 - 40 - r() * 260, cr = 18 + r() * 40;
      brush(x, blobPts(sx0 + (r() - 0.5) * 150, cy0, cr, cr * 0.7, (r() * 1e5) | 0, 9, 0.3), {
        col: mix('#ffffff', '#a4b2be', dark), w: 4 + r() * 5,
        alpha: (0.08 + r() * 0.12) * f, bristles: 1, close: true,
        seed: (r() * 1e6) | 0, dens: 7, arc: 1.2
      });
    }
  }

  /* ---------------- rain out of the cloud into the cup ---------------- */
  function rain(x, u, f) {
    if (f <= 0) return;
    var step = Math.floor(u * 12), r = rnd(step * 4409 + 71);
    /* Rain falls; it does not radiate. Long strokes converging on the cup
       turned the square into a ray diagram, and at full length and near-white
       they were scratches in the film. Each drop is now a short fast dash,
       leaning the same way as its neighbours, mostly barely there. */
    var lean = 0.1 + 0.05 * Math.sin(step * 0.27);
    var n = Math.round(230 * f);
    for (var i = 0; i < n; i++) {
      var x0 = 40 + r() * 1000, y0 = 250 + r() * 700;
      var L = 26 + Math.pow(r(), 1.7) * 150;
      brush(x, [[x0, y0], [x0 - L * lean * 0.5, y0 + L * 0.5], [x0 - L * lean, y0 + L]], {
        col: mix('#b4c2cc', '#ffffff', r() * 0.45), w: 1 + r() * 2.2,
        alpha: (0.05 + Math.pow(r(), 1.8) * 0.3) * f, bristles: 1,
        seed: (r() * 1e6) | 0, dens: 5, taper: 0.85, ribbon: true
      });
    }
    /* Over the cup it comes down harder, which is the whole joke: the weather
       has an opinion about where the tea goes. */
    for (var j = 0; j < Math.round(46 * f); j++) {
      var jx = 862 + (r() - 0.5) * 150, jy = 330 + r() * 470;
      var jL = 40 + r() * 130;
      brush(x, [[jx, jy], [jx - jL * lean, jy + jL]], {
        col: mix('#ccd8e0', '#ffffff', r() * 0.6), w: 1.3 + r() * 2.4,
        alpha: (0.14 + r() * 0.3) * f, bristles: 1,
        seed: (r() * 1e6) | 0, dens: 5, taper: 0.8, ribbon: true
      });
    }
    /* veils behind it, so the air is wet and not just striped */
    for (var v = 0; v < 18; v++) {
      var vx = 120 + r() * 800, vy = 260 + r() * 300;
      brush(x, [[vx, vy], [vx + 60, vy + 240], [vx + 130, vy + 480]], {
        col: '#9fadb8', w: 50 + r() * 120, alpha: (0.014 + r() * 0.03) * f,
        bristles: 4, seed: (r() * 1e6) | 0, dens: 6, taper: 0.85, spread: 0.6,
        thick: 2.6, fade: true
      });
    }
    /* splash in the cup, and a couple that miss */
    for (var s = 0; s < 7; s++) {
      var px = 806 + r() * 120, py = 812 + r() * 16;
      brush(x, [[px, py], [px + (r() - 0.5) * 40, py - 20 - r() * 34]], {
        col: '#f0f6f8', w: 2 + r() * 3.4, alpha: (0.2 + r() * 0.3) * f,
        bristles: 1, seed: (r() * 1e6) | 0, dens: 5, taper: 0.6, ribbon: true
      });
    }
    spatter(x, 862, 818, 74, 14, '#e8f0f4', step * 13 + 3, 2.4);
  }

  /* how full the cup is: the payoff */
  function tea(x, f) {
    if (f <= 0) return;
    var top = 830 - f * 26;
    var surf = [[798 + (1 - f) * 14, top], [862, top - 5], [930 - (1 - f) * 14, top + 3]];
    x.save();
    x.beginPath(); curve(x, CUP, true); x.clip();
    wash(x, [[790, top], [934, top - 6], [934, 944], [790, 944]], {
      col: '#6b3a12', seed: 901, layers: 4, alpha: 0.22, edge: 0
    });
    var r = rnd(902);
    for (var i = 0; i < 16; i++) {
      var iy = top + 6 + r() * (944 - top);
      brush(x, [[794, iy], [862 + (r() - 0.5) * 40, iy + (r() - 0.5) * 8], [932, iy + (r() - 0.5) * 9]], {
        col: jit(r() < 0.5 ? '#8a4f18' : '#4a2408', r, 26), w: 6 + r() * 16,
        alpha: 0.1 + r() * 0.2, bristles: 3, seed: 910 + i, dens: 5, dry: 0.3
      });
    }
    x.restore();
    brush(x, surf, {
      col: '#c98a3a', w: 7, alpha: 0.5 * f, bristles: 2, seed: 903,
      dens: 8, arc: 0.5, ribbon: true
    });
  }

  /* ---------------- plates, baked once ---------------- */
  var gRoom = room(false), gStorm = room(true);

  var kettleRoom = plate(W, H), kettleStorm = plate(W, H);
  paintKettle(kettleRoom.x, false); paintCup(kettleRoom.x, false);
  paintKettle(kettleStorm.x, true); paintCup(kettleStorm.x, true);

  /* Stroke order for painting the kettle on: the way you would actually
     build it — body, then the spout out of it, then the handle over, then
     the lid down, then the cup last because it is only waiting. */
  var kettleRev = new Reveal(W, H, (function () {
    var s = [], r = rnd(1201);
    var bandY = [KY + 250, KY + 170, KY + 90, KY + 10, KY - 70, KY - 140];
    bandY.forEach(function (y, i) {
      var half = 176 + (i < 2 ? 14 : -i * 8);
      s.push({
        pts: [[KX - half - 20, y + (r() - 0.5) * 18], [KX, y - 12 + (r() - 0.5) * 20],
          [KX + half + 24, y + (r() - 0.5) * 18]],
        w: 132
      });
    });
    s.push({ pts: SPOUT_MID, w: 132 });
    s.push({ pts: HANDLE, w: 96 });
    s.push({ pts: [[KX - 120, KY - 190], [KX + 10, KY - 240], [KX + 120, KY - 186]], w: 118 });
    s.push({ pts: [[KX - 20, KY - 250], [KX + 20, KY - 280]], w: 74 });
    return s;
  })());

  var cupRev = new Reveal(W, H, [
    { pts: [[788, 820], [862, 800], [938, 818]], w: 96 },
    { pts: [[790, 880], [862, 866], [936, 878]], w: 96 },
    { pts: [[800, 934], [862, 948], [928, 932]], w: 84 },
    { pts: [[928, 840], [980, 866], [934, 898]], w: 58 }
  ]);

  /* The front coming through. Same lesson as the other two films: an advancing
     straight edge reads as a sheet of plastic sliding over the picture, so the
     sweep goes on in bands of short overlapping scrubs and its face stays
     torn. */
  var frontStrokes = (function () {
    var s = [], r = rnd(1301), bands = 24, per = 7;
    for (var b = 0; b < bands; b++) {
      var base = -240 + (b / (bands - 1)) * 1620;
      var offs = [];
      for (var k = 0; k < per; k++) offs.push(-780 + (k / (per - 1)) * 1560 + (r() - 0.5) * 160);
      for (var k2 = offs.length - 1; k2 > 0; k2--) {
        var sw = (r() * (k2 + 1)) | 0, tmp = offs[k2]; offs[k2] = offs[sw]; offs[sw] = tmp;
      }
      offs.forEach(function (off) {
        var c = base + (r() - 0.5) * 72;
        var cx = c + off * 0.2, cy = off;
        var ang = 0.34 + (r() - 0.5) * 0.5;
        var L = 430 + r() * 330;
        s.push({
          pts: [[cx - Math.cos(ang) * L / 2, cy - Math.sin(ang) * L / 2],
            [cx + (r() - 0.5) * 40, cy + (r() - 0.5) * 40],
            [cx + Math.cos(ang) * L / 2, cy + Math.sin(ang) * L / 2]],
          w: 150 + r() * 90
        });
      });
    }
    return s;
  })();
  var frontRev = new Reveal(W, H, frontStrokes);

  var backStrokes = (function () {
    var s2 = [], r = rnd(1601), bands = 24, per = 7;
    for (var b = 0; b < bands; b++) {
      var base = 1640 - (b / (bands - 1)) * 1720;
      var ys = [];
      for (var k = 0; k < per; k++) ys.push(-120 + (k / (per - 1)) * 1320 + (r() - 0.5) * 170);
      for (var k2 = ys.length - 1; k2 > 0; k2--) {
        var sw = (r() * (k2 + 1)) | 0, tmp = ys[k2]; ys[k2] = ys[sw]; ys[sw] = tmp;
      }
      ys.forEach(function (y0) {
        var x0 = base + (r() - 0.5) * 80;
        var ang = Math.PI / 2 + (r() - 0.5) * 0.55;
        var L = 440 + r() * 340;
        s2.push({
          pts: [[x0 - Math.cos(ang) * L / 2, y0 - Math.sin(ang) * L / 2],
            [x0 + (r() - 0.5) * 50, y0 + (r() - 0.5) * 40],
            [x0 + Math.cos(ang) * L / 2, y0 + Math.sin(ang) * L / 2]],
          w: 155 + r() * 95
        });
      });
    }
    return s2;
  })();
  var backRev = new Reveal(W, H, backStrokes);

  /* the belly holds the other weather, blurred in as reflection not decal */
  var BELLY = blobPts(KX - 18, KY + 46, 128, 150, 1401, 15, 0.1);

  function belly(x, src, f) {
    if (f <= 0) return;
    var b = bellyP.x;
    b.clearRect(0, 0, W, H);
    /* feathered mask: nested shrinks accumulating alpha, so the edge of the
       reflection dissolves instead of being die-cut */
    for (var i = 0; i < 9; i++) {
      b.save();
      b.beginPath(); curve(b, shrinkPts(BELLY, 1 - i * 0.055), true); b.clip();
      b.globalAlpha = 0.13;
      b.drawImage(src.c, 0, 0);
      b.restore();
    }
    /* Laid in as light on curved tin, not as a picture pasted into a window.
       Drawn straight over at strength it bleached a hole through the middle
       of the kettle and the form went with it. */
    x.save();
    x.globalCompositeOperation = 'soft-light';
    x.globalAlpha = f * 0.85;
    x.drawImage(bellyP.c, 0, 0);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = f * 0.2;
    x.drawImage(bellyP.c, 0, 0);
    x.restore();
    /* the curve of the tin bending the light across it */
    var r = rnd(1411);
    for (var k = 0; k < 9; k++) {
      var ky = KY - 80 + k * 30;
      brush(x, [[KX - 130, ky + (r() - 0.5) * 16], [KX - 20, ky - 10], [KX + 110, ky + (r() - 0.5) * 14]], {
        col: k < 3 ? '#cfe8ea' : '#0a1e26', w: 10 + r() * 22,
        alpha: (0.05 + r() * 0.08) * f, bristles: 3, seed: 1420 + k,
        dens: 6, dry: 0.3, taper: 0.8
      });
    }
  }

  /* ---------------- words ---------------- */
  var wordsP = plate(W, H);
  (function () {
    var x = wordsP.x;
    /* Both lines sat too low: at this size the descenders of the second one
       fell off the bottom of the square and it read as half a word. */
    hand(x, 'showers later,', 92, 952, 47, {
      col: mix(P.cream, P.amber, 0.34), seed: 1501, w: 0.09, bristles: 2, alpha: 0.9
    });
    hand(x, 'mainly in the cup', 142, 1010, 47, {
      col: mix(P.cream, P.amber, 0.34), seed: 1502, w: 0.09, bristles: 2, alpha: 0.9
    });
  })();
