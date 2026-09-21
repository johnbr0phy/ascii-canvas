/* Shorebreak scene model.
   Original kinematic breaker: swell, pitching arc, crash, swash.
   A frame is a pure function of (set, time, storm) so the scrubber can seek.
   Coordinates are 0..1, y grows downward. */
(function (root) {
  "use strict";

  var HORIZON = 0.40;
  var SHORE = 0.735;

  var PALETTES = [
    {
      name: "Dawn glass",
      skyTop: [16, 36, 74],
      skyHorizon: [255, 178, 132],
      seaFar: [78, 112, 132],
      seaDeep: [7, 48, 62],
      seaShallow: [28, 132, 136],
      seaGlass: [178, 232, 222],
      tube: [3, 20, 28],
      lip: [255, 252, 247],
      foam: [255, 246, 236],
      sand: [228, 190, 142],
      sandWet: [118, 82, 58],
      sun: [255, 210, 154]
    },
    {
      name: "Noon",
      skyTop: [64, 138, 208],
      skyHorizon: [186, 220, 236],
      seaFar: [36, 104, 168],
      seaDeep: [8, 54, 104],
      seaShallow: [36, 156, 168],
      seaGlass: [168, 228, 220],
      tube: [4, 28, 46],
      lip: [255, 255, 255],
      foam: [242, 250, 255],
      sand: [228, 210, 170],
      sandWet: [146, 120, 82],
      sun: [255, 242, 206]
    },
    {
      name: "Copper dusk",
      skyTop: [26, 16, 46],
      skyHorizon: [214, 92, 58],
      seaFar: [78, 38, 58],
      seaDeep: [14, 16, 44],
      seaShallow: [32, 68, 90],
      seaGlass: [116, 168, 166],
      tube: [8, 6, 16],
      lip: [255, 228, 208],
      foam: [255, 216, 196],
      sand: [188, 114, 80],
      sandWet: [86, 44, 42],
      sun: [255, 136, 74]
    },
    {
      name: "Grey sea",
      skyTop: [46, 54, 62],
      skyHorizon: [164, 172, 178],
      seaFar: [86, 100, 108],
      seaDeep: [20, 38, 46],
      seaShallow: [42, 86, 92],
      seaGlass: [146, 176, 172],
      tube: [10, 18, 22],
      lip: [238, 242, 244],
      foam: [226, 232, 234],
      sand: [164, 152, 136],
      sandWet: [86, 82, 74],
      sun: [196, 202, 206]
    }
  ];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpCol(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }

  function smoothstep(e0, e1, x) {
    var t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function fract(v) {
    return v - Math.floor(v);
  }

  function hash(a, b) {
    var x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createSet(seed) {
    var s = seed >>> 0;
    var rnd = mulberry32(s || 1);
    var specks = [];
    var i;
    for (i = 0; i < 48; i++) {
      specks.push({
        x: rnd(),
        y: rnd(),
        rad: 0.0016 + rnd() * 0.0035,
        a: 0.15 + rnd() * 0.35
      });
    }
    return {
      seed: s,
      amp: 0.30 + rnd() * 0.07,
      reach: 0.50 + rnd() * 0.22,
      flip: rnd() > 0.48,
      sunX: 0.12 + rnd() * 0.28,
      cycle: 9,
      /* Staggered so t = 0 already shows arc + swash + a distant swell. */
      offsets: [0.40, 0.73, 0.08],
      palette: PALETTES[s % PALETTES.length],
      specks: specks
    };
  }

  function phaseOf(set, time, index) {
    return fract(time / set.cycle + set.offsets[index]);
  }

  function ampEnv(phase) {
    if (phase < 0.20) return 0.35 + (phase / 0.20) * 0.30;
    if (phase < 0.50) return 0.65 + ((phase - 0.20) / 0.30) * 0.45;
    if (phase < 0.62) return 1.10 - ((phase - 0.50) / 0.12) * 0.75;
    return 0.22;
  }

  function pitchAmount(phase) {
    if (phase < 0.22) return 0.05;
    if (phase < 0.48) {
      var t = (phase - 0.22) / 0.26;
      var s = t * t * (3 - 2 * t);
      return 0.05 + s * 1.32;
    }
    if (phase < 0.60) {
      var u = (phase - 0.48) / 0.12;
      return (0.05 + 1.32) * (1 - u);
    }
    return 0;
  }

  function approachZ(phase) {
    if (phase < 0.62) return 0.10 + 0.78 * Math.pow(phase / 0.62, 1.02);
    return 0.90;
  }

  function yOnWater(z) {
    return HORIZON + (SHORE - HORIZON) * Math.pow(clamp(z, 0, 1), 0.88);
  }

  function peelAt(s, phase, storm) {
    if (phase < 0.30) return 0;
    if (phase > 0.60) return 1;
    var front = (phase - 0.30) / 0.28;
    var peeler = smoothstep(front - 0.14, front + 0.06, s);
    var closeout = smoothstep(0.36, 0.50, phase);
    return lerp(peeler, closeout, clamp(storm, 0, 1) * 0.85);
  }

  function swashAmount(phase) {
    if (phase < 0.48) return 0;
    if (phase < 0.68) return Math.sin(((phase - 0.48) / 0.20) * Math.PI * 0.5);
    if (phase < 0.90) return Math.cos(((phase - 0.68) / 0.22) * Math.PI * 0.5);
    return Math.max(0, 0.12 * (1 - (phase - 0.90) / 0.10));
  }

  function chop(x, time, storm, salt) {
    var a = 0.0035 + storm * 0.011;
    return (
      a * Math.sin(x * 26 + time * 2.1 + salt) +
      a * 0.55 * Math.sin(x * 51 - time * 1.5 + salt * 2)
    );
  }

  function colorsFor(set, storm) {
    var p = set.palette;
    var k = clamp(storm, 0, 1);
    function sky(col, target, mix) {
      return lerpCol(col, target, k * mix);
    }
    return {
      skyTop: sky(p.skyTop, [28, 34, 42], 0.88),
      skyHorizon: sky(p.skyHorizon, [118, 126, 134], 0.78),
      seaFar: sky(p.seaFar, [70, 80, 88], 0.55),
      seaDeep: sky(p.seaDeep, [16, 28, 34], 0.45),
      seaShallow: sky(p.seaShallow, [36, 64, 70], 0.40),
      seaGlass: sky(p.seaGlass, [150, 168, 166], 0.35),
      tube: p.tube,
      lip: p.lip,
      foam: p.foam,
      sand: sky(p.sand, [120, 112, 100], 0.28),
      sandWet: sky(p.sandWet, [62, 58, 54], 0.25),
      sun: p.sun
    };
  }

  function V(x, y, col, a) {
    return { x: x, y: y, r: col[0], g: col[1], b: col[2], a: a };
  }

  function pushStrip(ops, a, b, shade) {
    if (!a || !b || a.length < 2 || a.length !== b.length) return;
    ops.push({ k: "strip", a: a, b: b, shade: shade });
  }

  function gradientRows(ops, x0, x1, y0, y1, c0, c1, rows, shade) {
    var prev = null;
    var i;
    for (i = 0; i <= rows; i++) {
      var t = i / rows;
      var y = y0 + (y1 - y0) * t;
      var c = lerpCol(c0, c1, t);
      var row = [V(x0, y, c, 1), V(x1, y, c, 1)];
      if (prev) pushStrip(ops, prev, row, shade);
      prev = row;
    }
  }

  function labelFor(phases) {
    var i;
    var curling = false;
    var swash = false;
    var swell = false;
    for (i = 0; i < phases.length; i++) {
      var p = phases[i];
      if (p >= 0.46 && p < 0.58) return "Crashing";
      if (p >= 0.30 && p < 0.48) curling = true;
      else if (p >= 0.58 && p < 0.90) swash = true;
      else swell = true;
    }
    if (curling) return "Curling";
    if (swash) return "Swash";
    if (swell) return "Swell";
    return "Set";
  }

  function addSea(ops, colors, time, storm, seed) {
    var bands = [
      { z0: 0, z1: 0.34, c0: colors.seaFar, c1: colors.seaDeep },
      { z0: 0.34, z1: 0.68, c0: colors.seaDeep, c1: colors.seaDeep },
      { z0: 0.68, z1: 1, c0: colors.seaDeep, c1: colors.seaShallow }
    ];
    var b, i, n, top, bot, z, y, s, cTop, cBot;
    n = 22;
    for (b = 0; b < bands.length; b++) {
      top = [];
      bot = [];
      for (i = 0; i < n; i++) {
        s = i / (n - 1);
        var x = -0.35 + s * 1.70;
        y = yOnWater(bands[b].z0) + chop(s, time, storm, seed + b) * (b === 0 ? 0.35 : 1);
        top.push(V(x, y, bands[b].c0, 1));
        y = yOnWater(bands[b].z1) + chop(s, time, storm, seed + 5 + b) * 0.45;
        bot.push(V(x, y, bands[b].c1, 1));
      }
      pushStrip(ops, top, bot, "water");
    }
  }

  function addRipples(ops, time, storm, seed, colors) {
    var r, i, s, x, y, a, rowA, rowB, col, amp;
    for (r = 0; r < 3; r++) {
      amp = 0.004 + storm * 0.006;
      y = HORIZON + 0.045 + r * 0.055;
      a = (0.22 - r * 0.05) * (1 - storm * 0.25);
      col = lerpCol(colors.seaFar, colors.lip, 0.35);
      rowA = [];
      rowB = [];
      for (i = 0; i < 18; i++) {
        s = i / 17;
        x = -0.2 + s * 1.4;
        var yy = y + Math.sin(s * 10 + time * 1.4 + r) * amp;
        rowA.push(V(x, yy, col, a));
        rowB.push(V(x, yy + 0.0045, col, 0));
      }
      pushStrip(ops, rowA, rowB, "flat");
    }
  }

  function addLightPath(ops, set, colors, storm) {
    var i, s, x, y, w, a, rowA, rowB, col;
    if (storm > 0.72) return;
    col = colors.sun;
    for (i = 0; i < 8; i++) {
      s = i / 7;
      y = HORIZON + 0.02 + s * (SHORE - HORIZON - 0.04);
      w = 0.012 + s * 0.04;
      x = set.sunX + 0.04;
      a = (1 - storm) * (0.16 * (1 - s));
      rowA = [V(x - w, y, col, a), V(x + w, y, col, a)];
      var y2 = y + 0.03;
      rowB = [V(x - w * 0.7, y2, col, a * 0.2), V(x + w * 0.7, y2, col, a * 0.2)];
      pushStrip(ops, rowA, rowB, "flat");
    }
  }

  function sampleFace(set, phase, time, storm) {
    var n = 52;
    var amp = set.amp * (0.85 + storm * 0.42);
    var env = ampEnv(phase);
    var pitch = pitchAmount(phase);
    var z = approachZ(phase);
    var yb0 = yOnWater(z);
    var pts = [];
    var i, s, sf, peel, edge, h, yb, crest, hang;
    for (i = 0; i < n; i++) {
      s = i / (n - 1);
      sf = set.flip ? 1 - s : s;
      peel = peelAt(sf, phase, storm);
      edge = 0.22 + 0.78 * Math.sin(s * Math.PI);
      h = amp * env * edge * (1 - 0.70 * peel);
      yb = yb0 + chop(s, time, storm, set.seed) * 0.55;
      crest = yb - h;
      hang = pitch * h * 0.52 * (0.30 + 0.70 * Math.sin(s * Math.PI)) * (1 - peel);
      hang = Math.min(hang, h * 0.84);
      pts.push({
        x: -0.04 + s * 1.08,
        yb: yb,
        crest: crest,
        hang: hang,
        peel: peel,
        h: h,
        s: s
      });
    }
    return pts;
  }

  function faceColor(colors, peel, v, light) {
    var glass = lerpCol(colors.seaGlass, colors.seaShallow, clamp(v, 0, 1));
    var body = lerpCol(glass, colors.seaDeep, clamp(v, 0, 1) * 0.75);
    var c = lerpCol(body, colors.foam, clamp(peel, 0, 1));
    return lerpCol(c, colors.sun, light * (1 - peel) * 0.22);
  }

  function addFace(ops, pts, colors) {
    var a = [];
    var b = [];
    var i, p, light, top, bot;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      light = Math.exp(-Math.pow((p.s - 0.34) / 0.2, 2));
      top = faceColor(colors, p.peel * 0.35, 0.05, light);
      bot = faceColor(colors, p.peel * 0.15, 0.95, light * 0.3);
      a.push(V(p.x, p.crest, top, 1));
      b.push(V(p.x, p.yb, bot, 1));
    }
    pushStrip(ops, a, b, "water");
  }

  function addShoulder(ops, pts, colors, time) {
    var a = [];
    var b = [];
    var i, p, lump, topY, col, alpha;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (p.peel < 0.08) {
        a.push(V(p.x, p.yb, colors.foam, 0));
        b.push(V(p.x, p.yb, colors.foam, 0));
        continue;
      }
      lump = Math.sin(p.s * 34 + time * 5) * 0.012 * p.peel;
      topY = lerp(p.crest, p.yb, 0.18 + p.peel * 0.42) + lump;
      col = lerpCol(colors.seaGlass, colors.foam, 0.55 + p.peel * 0.45);
      alpha = clamp((p.peel - 0.08) / 0.4, 0, 1) * 0.92;
      a.push(V(p.x, topY, col, alpha));
      b.push(V(p.x, p.yb + 0.01, colors.foam, alpha * 0.95));
    }
    pushStrip(ops, a, b, "flat");
  }

  function chainStrip(pts, yOf, colOf, alphaOf) {
    var a = [];
    var b = [];
    var i, p, ya, yb;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      ya = yOf(p, 0);
      yb = yOf(p, 1);
      if (p.hang < 0.012) {
        a.push(V(p.x, p.crest, colOf(p), 0));
        b.push(V(p.x, p.crest, colOf(p), 0));
      } else {
        a.push(V(p.x, ya, colOf(p), alphaOf(p, 0)));
        b.push(V(p.x, yb, colOf(p), alphaOf(p, 1)));
      }
    }
    return { a: a, b: b };
  }

  function addTube(ops, pts, colors) {
    var pocket = chainStrip(
      pts,
      function (p, side) {
        return p.crest + p.hang * (side === 0 ? 0.08 : 0.58);
      },
      function () {
        return colors.tube;
      },
      function (p, side) {
        return side === 0 ? 0.55 : 0.94;
      }
    );
    var lip = chainStrip(
      pts,
      function (p, side) {
        return p.crest + p.hang * (side === 0 ? 0.50 : 1);
      },
      function () {
        return colors.lip;
      },
      function (p, side) {
        var m = clamp(p.hang / 0.08, 0, 1);
        return (side === 0 ? 0.25 : 0.96) * m;
      }
    );
    pushStrip(ops, pocket.a, pocket.b, "flat");
    pushStrip(ops, lip.a, lip.b, "flat");
  }

  function addCarpet(ops, pts, phase, colors) {
    if (phase < 0.44 || phase > 0.66) return;
    var reach = clamp((phase - 0.44) / 0.16, 0, 1);
    var a = [];
    var b = [];
    var i, p, front, alpha;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      front = lerp(p.yb, SHORE + 0.01, reach * (0.35 + 0.65 * p.peel));
      alpha = 0.35 + 0.6 * Math.max(p.peel, reach * 0.5);
      a.push(V(p.x, p.yb - 0.005, colors.foam, alpha));
      b.push(V(p.x, front, colors.foam, alpha * 0.85));
    }
    pushStrip(ops, a, b, "flat");
  }

  function pushDot(ops, x, y, rad, col, a) {
    if (a <= 0.02 || rad <= 0) return;
    ops.push({ k: "dot", x: x, y: y, rad: rad, r: col[0], g: col[1], b: col[2], a: a });
  }

  function addCrestFoam(ops, pts, time, seed) {
    var i, p, n, j, jn, t;
    for (i = 0; i < pts.length; i += 2) {
      p = pts[i];
      n = p.peel > 0.4 ? 2 : 1;
      for (j = 0; j < n; j++) {
        jn = i * 3 + j;
        t = hash(jn, seed);
        pushDot(
          ops,
          p.x + (t - 0.5) * 0.02,
          p.crest - t * 0.012 + Math.sin(time * 6 + i) * 0.004,
          0.007 + p.peel * 0.012 + t * 0.006,
          [255, 250, 244],
          0.45 + p.peel * 0.5
        );
      }
    }
  }

  function addSpray(ops, pts, phase, time, seed, storm) {
    var count = Math.floor(18 + storm * 28);
    var i, t, s, idx, p, burst, a;
    if (phase < 0.34 || phase > 0.64) return;
    burst = phase > 0.46 && phase < 0.60;
    for (i = 0; i < count; i++) {
      t = hash(i + 4, seed + 9);
      s = burst ? 0.35 + hash(i, seed) * 0.5 : t;
      idx = clamp(Math.floor(s * (pts.length - 1)), 0, pts.length - 1);
      p = pts[idx];
      if (p.hang < 0.02 && !burst) continue;
      a = (burst ? 0.55 : 0.35) * (1 - Math.abs(phase - 0.5) * 1.2);
      pushDot(
        ops,
        p.x + (hash(i, 2) - 0.5) * (burst ? 0.08 : 0.03),
        p.crest + p.hang * (0.4 + t * 0.6) - ((burst ? 0.04 : 0.02) + t * 0.05 * (1 + storm)) * (0.4 + hash(i, 3)) + Math.sin(time * 8 + i) * 0.006,
        (burst ? 0.012 : 0.006) + hash(i, 6) * 0.012,
        [255, 252, 248],
        a
      );
    }
  }

  function addSwash(ops, set, phase, time, storm, colors) {
    var amount = swashAmount(phase) * (0.78 + storm * 0.28);
    if (amount < 0.03) return null;
    var reach = amount * set.reach;
    var frontY = SHORE + reach * (0.985 - SHORE);
    var n = 30;
    var back = [];
    var front = [];
    var i, s, sf, side, lace, yF, x, foamA;
    for (i = 0; i < n; i++) {
      s = i / (n - 1);
      sf = set.flip ? 1 - s : s;
      side = 0.28 + 0.72 * smoothstep(0.12, 0.78, sf);
      lace =
        Math.sin(s * 20 + time * 3.2 + set.seed) * 0.014 * reach +
        Math.sin(s * 43 - time * 2.4 + phase * 6) * 0.007;
      yF = SHORE + (frontY - SHORE) * side + lace;
      if (yF < SHORE + 0.012) yF = SHORE + 0.012;
      x = -0.08 + s * 1.16;
      foamA = 0.55 + 0.4 * amount;
      back.push(V(x, SHORE + chop(s, time, storm, 3) * 0.25, colors.foam, foamA * 0.45));
      front.push(V(x, yF, colors.foam, foamA));
    }
    pushStrip(ops, back, front, "flat");

    /* Backwash streaks while the sheet is on the sand. */
    if (phase > 0.66 && phase < 0.92) {
      var r, riverA, riverB, rs, ry, rx;
      for (r = 0; r < 4; r++) {
        riverA = [];
        riverB = [];
        rs = 0.18 + r * 0.2;
        if (set.flip) rs = 1 - rs;
        for (i = 0; i < 8; i++) {
          var t = i / 7;
          rx = -0.08 + rs * 1.16 + Math.sin(t * 6 + r) * 0.015;
          ry = SHORE + t * (frontY - SHORE) * (0.55 + 0.1 * r);
          riverA.push(V(rx, ry, colors.sandWet, 0.28));
          riverB.push(V(rx + 0.012, ry + 0.004, colors.sandWet, 0.05));
        }
        pushStrip(ops, riverA, riverB, "flat");
      }
    }

    var count = 16 + Math.floor(amount * 18);
    for (i = 0; i < count; i++) {
      s = hash(i, set.seed + 12);
      sf = set.flip ? 1 - s : s;
      side = 0.28 + 0.72 * smoothstep(0.12, 0.78, sf);
      yF = SHORE + (frontY - SHORE) * side * (0.2 + 0.8 * hash(i, 8));
      pushDot(ops, -0.05 + s * 1.1, yF, 0.008 + hash(i, 11) * 0.016 * amount, colors.foam, 0.28 + amount * 0.45);
    }
    return { amount: amount, frontY: frontY };
  }

  function addDistant(ops, set, phase, time, storm, colors) {
    var z = 0.06 + phase * 0.7;
    var yb = yOnWater(z);
    var amp = set.amp * 0.22 * (0.4 + phase * 2);
    var a = [];
    var b = [];
    var i, s, edge, h, col;
    for (i = 0; i < 28; i++) {
      s = i / 27;
      edge = Math.sin(s * Math.PI);
      h = amp * (0.3 + 0.7 * edge);
      col = lerpCol(colors.seaFar, colors.seaGlass, 0.4);
      a.push(V(-0.1 + s * 1.2, yb - h + chop(s, time, storm, 4) * 0.2, col, 0.9));
      b.push(V(-0.1 + s * 1.2, yb + 0.01, colors.seaDeep, 0.9));
    }
    pushStrip(ops, a, b, "water");
  }

  function frame(set, time, storm) {
    var k = clamp(storm, 0, 1);
    var colors = colorsFor(set, k);
    var ops = [];
    var phases = [];
    var maxHang = 0;
    var swashSeen = 0;
    var foamOps = [];
    var i;

    gradientRows(ops, -0.6, 1.6, -0.45, HORIZON + 0.03, colors.skyTop, colors.skyHorizon, 14, "sky");

    var sunA = (1 - k) * 0.95;
    if (sunA > 0.05) {
      pushDot(ops, set.sunX, HORIZON - 0.075, 0.055, colors.sun, sunA);
    }

    if (k > 0.12) {
      for (i = 0; i < 5; i++) {
        var wy = 0.06 + i * 0.055;
        var wx = fract(hash(i, set.seed) + time * (0.03 + k * 0.05));
        var rowA = [];
        var rowB = [];
        var seg;
        for (seg = 0; seg < 2; seg++) {
          var xx = -0.2 + wx * 1.2 + seg * (0.08 + k * 0.1);
          rowA.push(V(xx, wy, colors.skyHorizon, 0.18 * k));
          rowB.push(V(xx, wy + 0.004, colors.skyHorizon, 0));
        }
        pushStrip(ops, rowA, rowB, "flat");
      }
    }

    addSea(ops, colors, time, k, set.seed);
    addRipples(ops, time, k, set.seed, colors);
    addLightPath(ops, set, colors, k);

    for (i = 0; i < 3; i++) phases.push(phaseOf(set, time, i));

    /* Far swells first, then the pitching faces. */
    var order = [0, 1, 2];
    order.sort(function (a, b) {
      return approachZ(phases[a]) - approachZ(phases[b]);
    });

    for (i = 0; i < order.length; i++) {
      var idx = order[i];
      var phase = phases[idx];
      if (phase < 0.18) addDistant(ops, set, phase, time, k, colors);
    }

    for (i = 0; i < order.length; i++) {
      idx = order[i];
      phase = phases[idx];
      if (phase < 0.20 || phase >= 0.60) continue;
      var pts = sampleFace(set, phase, time, k);
      var pi;
      for (pi = 0; pi < pts.length; pi++) {
        if (pts[pi].hang > maxHang) maxHang = pts[pi].hang;
      }
      addFace(ops, pts, colors);
      addShoulder(ops, pts, colors, time);
      addCarpet(ops, pts, phase, colors);
      addTube(ops, pts, colors);
      var foamMark = ops.length;
      addCrestFoam(ops, pts, time, set.seed + idx * 17);
      addSpray(ops, pts, phase, time, set.seed + idx * 17, k);
      foamOps.push.apply(foamOps, ops.splice(foamMark));
    }

    /* Sand, wet band, then the sheet of foam that runs up the beach. */
    gradientRows(ops, -0.4, 1.4, SHORE - 0.01, 1.18, colors.sand, lerpCol(colors.sand, [255, 236, 210], 0.18), 6, "sand");

    var wet = 0.1;
    for (i = 0; i < phases.length; i++) {
      var amount = swashAmount(phases[i]) * (0.78 + k * 0.28);
      if (amount > 0.03) {
        swashSeen = Math.max(swashSeen, amount);
        wet = Math.max(wet, amount * set.reach);
      }
    }
    var wetY = SHORE + Math.max(0.07, wet * 0.92) * (1 - SHORE);
    gradientRows(ops, -0.4, 1.4, SHORE - 0.005, wetY, colors.sandWet, lerpCol(colors.sandWet, colors.sand, 0.65), 3, "sand");

    pushStrip(
      ops,
      [V(-0.3, wetY - 0.004, colors.lip, 0.22), V(1.3, wetY - 0.004, colors.lip, 0.22)],
      [V(-0.3, wetY + 0.008, colors.lip, 0), V(1.3, wetY + 0.008, colors.lip, 0)],
      "flat"
    );

    var specks = set.specks;
    for (i = 0; i < specks.length; i++) {
      var sp = specks[i];
      pushDot(
        ops,
        -0.05 + sp.x * 1.1,
        SHORE + 0.02 + sp.y * (0.98 - SHORE),
        sp.rad,
        lerpCol(colors.sand, [90, 60, 40], 0.55),
        sp.a
      );
    }

    for (i = 0; i < phases.length; i++) addSwash(ops, set, phases[i], time, k, colors);
    ops.push.apply(ops, foamOps);

    return {
      ops: ops,
      label: labelFor(phases),
      paletteName: set.palette.name,
      colors: colors,
      horizon: HORIZON,
      shore: SHORE,
      debug: {
        maxHang: maxHang,
        swash: swashSeen,
        phases: phases,
        wetY: wetY
      }
    };
  }

  root.Shore = {
    createSet: createSet,
    frame: frame,
    PALETTES: PALETTES,
    HORIZON: HORIZON,
    SHORE: SHORE
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
