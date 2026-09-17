/* Sounding Plate — hash-seeded hydrographic ledger.
   Craft rules stolen from Camille Roux's genart skill (determinism,
   named streams, features-before-render, normalised space). Subject
   is original: a survey plate, not an Impossible Machine. */
(function (root) {
  "use strict";

  var DEFAULT_HASH =
    "0x7e4b2a91c0d83f15b6a904e27c1d58af33e0b7c94a12d6e80f5c3b1a7982e460";

  var PALETTES = [
    ["Cyanotype", 34],
    ["Vellum", 28],
    ["Chartroom", 18],
    ["Night Watch", 14],
    ["Oxide", 6],
  ];

  var DENSITIES = [
    ["Sparse", 28],
    ["Charted", 48],
    ["Crowded", 24],
  ];

  var STRUCTURES = [
    ["Open Reach", 32],
    ["Channel", 30],
    ["Basin", 28],
    ["Archipelago", 10],
  ];

  var ANNOTATIONS = [
    ["Quiet", 30],
    ["Noted", 50],
    ["Ledgered", 20],
  ];

  var NORTHS = [
    ["True", 55],
    ["Magnetic", 35],
    ["Drifted", 10],
  ];

  var HATCHES = [
    ["None", 22],
    ["Shoal", 48],
    ["Contour Fill", 30],
  ];

  var INKS = {
    Cyanotype: { paper: "#1b3d6e", ink: "#d7e6f4", accent: "#f3efe0", mute: "#7aa0c8" },
    Vellum: { paper: "#e7dcc3", ink: "#2a2418", accent: "#8a3a28", mute: "#6a5c48" },
    Chartroom: { paper: "#c8d5c6", ink: "#1b2a36", accent: "#c45c3c", mute: "#4a6670" },
    "Night Watch": { paper: "#0e1210", ink: "#c6e0c2", accent: "#e0c56e", mute: "#4a5c4a" },
    Oxide: { paper: "#c9a07a", ink: "#3a1c12", accent: "#6b1d12", mute: "#7a5340" },
  };

  /* --- hash / PRNG (integer-only; fold all 32 bytes) --- */

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function digestText(str) {
    var s = String(str);
    var acc = [0x811c9dc5, 0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344, 0xa4093822, 0x299f31d0, 0x082efa98];
    var i, j;
    for (i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      j = i & 7;
      acc[j] = (Math.imul(acc[j] ^ c, 0x9e3779b1) + i) >>> 0;
      acc[(j + 3) & 7] ^= Math.imul(c + 1, 0x85ebca6b);
    }
    acc[0] ^= s.length >>> 0;
    var hex = "";
    for (i = 0; i < 8; i++) hex += ("00000000" + (acc[i] >>> 0).toString(16)).slice(-8);
    return hex;
  }

  function normalizeHash(input) {
    var raw = String(input == null ? "" : input).trim();
    if (!raw) return DEFAULT_HASH;
    var hex = raw.replace(/^0x/i, "");
    if (/^[0-9a-fA-F]+$/.test(hex) && hex.length >= 8) {
      hex = (hex.toLowerCase() + "0000000000000000000000000000000000000000000000000000000000000000").slice(0, 64);
      return "0x" + hex;
    }
    return "0x" + digestText(raw);
  }

  function seedFromHash(hash) {
    var hex = normalizeHash(hash).replace(/^0x/i, "").padStart(64, "0").slice(-64);
    var s = new Uint32Array(4);
    for (var i = 0; i < 8; i++) {
      var w = parseInt(hex.slice(i * 8, i * 8 + 8), 16) >>> 0;
      s[i % 4] = (Math.imul(s[i % 4] ^ w, 0x9e3779b1) + i) >>> 0;
    }
    if (!(s[0] | s[1] | s[2] | s[3])) s[3] = 1;
    return s;
  }

  function sfc32(state) {
    var a = state[0] | 0;
    var b = state[1] | 0;
    var c = state[2] | 0;
    var d = state[3] | 0;
    return function () {
      var t = (((a + b) | 0) + d) | 0;
      d = (d + 1) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }

  function stream(hash, label) {
    var s = seedFromHash(hash);
    var k = fnv1a(label);
    var mixed = [0, 1, 2, 3].map(function (i) {
      return (s[i] ^ Math.imul(k + i, 0x9e3779b1)) >>> 0;
    });
    if (!(mixed[0] | mixed[1] | mixed[2] | mixed[3])) mixed[3] = 1;
    var r = sfc32(mixed);
    for (var i = 0; i < 12; i++) r();
    return r;
  }

  function int(r, a, b) {
    return a + Math.floor(r() * (b - a + 1));
  }

  function chance(r, p) {
    return r() < p;
  }

  function weighted(r, entries) {
    var total = 0;
    var i;
    for (i = 0; i < entries.length; i++) total += entries[i][1];
    var x = r() * total;
    for (i = 0; i < entries.length; i++) {
      x -= entries[i][1];
      if (x < 0) return entries[i][0];
    }
    return entries[entries.length - 1][0];
  }

  /* --- features: pure function of the hash, before any draw --- */

  function features(hash) {
    return withSeededOnly(function () {
      var r = stream(hash, "features");
      return {
        Palette: weighted(r, PALETTES),
        Density: weighted(r, DENSITIES),
        Structure: weighted(r, STRUCTURES),
        Annotation: weighted(r, ANNOTATIONS),
        North: weighted(r, NORTHS),
        Hatch: weighted(r, HATCHES),
      };
    });
  }

  function sheetHashes(hash, n) {
    var r = stream(hash, "contact-sheet");
    var out = [];
    var count = Math.max(1, Math.min(24, n | 0));
    for (var i = 0; i < count; i++) {
      var hex = "";
      for (var w = 0; w < 8; w++) {
        hex += ("00000000" + Math.floor(r() * 4294967296).toString(16)).slice(-8);
      }
      out.push("0x" + hex);
    }
    return out;
  }

  /* --- fail closed --- */

  function withSeededOnly(fn) {
    var origRandom = Math.random;
    var cryptoObj = typeof crypto !== "undefined" ? crypto : null;
    var origCRV = cryptoObj && cryptoObj.getRandomValues ? cryptoObj.getRandomValues.bind(cryptoObj) : null;
    Math.random = function forbiddenRandom() {
      throw new Error("SOUNDING PLATE: Math.random is forbidden. Use the seeded PRNG.");
    };
    if (cryptoObj) {
      cryptoObj.getRandomValues = function forbiddenCRV() {
        throw new Error("SOUNDING PLATE: unseeded crypto.getRandomValues is forbidden.");
      };
    }
    try {
      return fn();
    } finally {
      Math.random = origRandom;
      if (cryptoObj && origCRV) cryptoObj.getRandomValues = origCRV;
    }
  }

  /* --- tiny stroke font (layout never uses measureText) --- */

  var GLYPH = {
    "0": [[[0.15, 0.08], [0.85, 0.08], [0.85, 0.92], [0.15, 0.92], [0.15, 0.08]]],
    "1": [[[0.35, 0.2], [0.55, 0.08], [0.55, 0.92]], [[0.28, 0.92], [0.78, 0.92]]],
    "2": [[[0.15, 0.22], [0.2, 0.08], [0.8, 0.08], [0.85, 0.22], [0.85, 0.38], [0.15, 0.92], [0.88, 0.92]]],
    "3": [[[0.18, 0.1], [0.82, 0.1], [0.5, 0.48], [0.82, 0.55], [0.82, 0.82], [0.18, 0.9]]],
    "4": [[[0.72, 0.92], [0.72, 0.08], [0.18, 0.62], [0.88, 0.62]]],
    "5": [[[0.82, 0.08], [0.2, 0.08], [0.18, 0.42], [0.75, 0.42], [0.85, 0.55], [0.8, 0.88], [0.2, 0.92]]],
    "6": [[[0.78, 0.1], [0.28, 0.1], [0.18, 0.5], [0.18, 0.88], [0.78, 0.9], [0.85, 0.62], [0.22, 0.55]]],
    "7": [[[0.15, 0.1], [0.85, 0.1], [0.38, 0.92]]],
    "8": [[[0.5, 0.48], [0.18, 0.38], [0.22, 0.1], [0.78, 0.1], [0.82, 0.38], [0.5, 0.48], [0.18, 0.6], [0.2, 0.9], [0.8, 0.9], [0.82, 0.6], [0.5, 0.48]]],
    "9": [[[0.22, 0.9], [0.75, 0.88], [0.82, 0.5], [0.78, 0.1], [0.22, 0.12], [0.18, 0.4], [0.78, 0.48]]],
    A: [[[0.1, 0.92], [0.5, 0.08], [0.9, 0.92]], [[0.28, 0.62], [0.72, 0.62]]],
    B: [[[0.18, 0.08], [0.18, 0.92]], [[0.18, 0.08], [0.7, 0.08], [0.82, 0.22], [0.7, 0.44], [0.18, 0.44]], [[0.18, 0.44], [0.74, 0.48], [0.84, 0.7], [0.72, 0.92], [0.18, 0.92]]],
    C: [[[0.82, 0.2], [0.7, 0.08], [0.28, 0.08], [0.15, 0.28], [0.15, 0.72], [0.28, 0.92], [0.7, 0.92], [0.82, 0.8]]],
    D: [[[0.18, 0.08], [0.18, 0.92], [0.62, 0.92], [0.85, 0.7], [0.85, 0.3], [0.62, 0.08], [0.18, 0.08]]],
    E: [[[0.22, 0.08], [0.22, 0.92]], [[0.22, 0.08], [0.8, 0.08]], [[0.22, 0.5], [0.66, 0.5]], [[0.22, 0.92], [0.8, 0.92]]],
    F: [[[0.22, 0.92], [0.22, 0.08], [0.8, 0.08]], [[0.22, 0.5], [0.64, 0.5]]],
    G: [[[0.82, 0.22], [0.68, 0.08], [0.28, 0.08], [0.15, 0.3], [0.15, 0.72], [0.3, 0.92], [0.72, 0.92], [0.85, 0.72], [0.85, 0.52], [0.52, 0.52]]],
    H: [[[0.18, 0.08], [0.18, 0.92]], [[0.82, 0.08], [0.82, 0.92]], [[0.18, 0.5], [0.82, 0.5]]],
    I: [[[0.28, 0.08], [0.72, 0.08]], [[0.5, 0.08], [0.5, 0.92]], [[0.28, 0.92], [0.72, 0.92]]],
    J: [[[0.22, 0.08], [0.8, 0.08]], [[0.68, 0.08], [0.68, 0.72], [0.52, 0.92], [0.22, 0.82]]],
    K: [[[0.2, 0.08], [0.2, 0.92]], [[0.82, 0.08], [0.2, 0.52], [0.84, 0.92]]],
    L: [[[0.22, 0.08], [0.22, 0.92], [0.82, 0.92]]],
    M: [[[0.12, 0.92], [0.12, 0.08], [0.5, 0.52], [0.88, 0.08], [0.88, 0.92]]],
    N: [[[0.18, 0.92], [0.18, 0.08], [0.82, 0.92], [0.82, 0.08]]],
    O: [[[0.28, 0.08], [0.72, 0.08], [0.88, 0.28], [0.88, 0.72], [0.72, 0.92], [0.28, 0.92], [0.12, 0.72], [0.12, 0.28], [0.28, 0.08]]],
    P: [[[0.2, 0.92], [0.2, 0.08], [0.72, 0.08], [0.84, 0.24], [0.72, 0.48], [0.2, 0.48]]],
    Q: [[[0.28, 0.08], [0.72, 0.08], [0.88, 0.28], [0.88, 0.68], [0.62, 0.92], [0.28, 0.92], [0.12, 0.72], [0.12, 0.28], [0.28, 0.08]], [[0.55, 0.62], [0.86, 0.94]]],
    R: [[[0.2, 0.92], [0.2, 0.08], [0.7, 0.08], [0.82, 0.24], [0.7, 0.48], [0.2, 0.48]], [[0.48, 0.48], [0.84, 0.92]]],
    S: [[[0.8, 0.18], [0.62, 0.08], [0.28, 0.08], [0.16, 0.24], [0.28, 0.4], [0.72, 0.55], [0.84, 0.72], [0.7, 0.92], [0.28, 0.92], [0.16, 0.8]]],
    T: [[[0.12, 0.08], [0.88, 0.08]], [[0.5, 0.08], [0.5, 0.92]]],
    U: [[[0.18, 0.08], [0.18, 0.72], [0.32, 0.92], [0.68, 0.92], [0.82, 0.72], [0.82, 0.08]]],
    V: [[[0.12, 0.08], [0.5, 0.92], [0.88, 0.08]]],
    W: [[[0.08, 0.08], [0.28, 0.92], [0.5, 0.4], [0.72, 0.92], [0.92, 0.08]]],
    X: [[[0.15, 0.08], [0.85, 0.92]], [[0.85, 0.08], [0.15, 0.92]]],
    Y: [[[0.15, 0.08], [0.5, 0.48], [0.85, 0.08]], [[0.5, 0.48], [0.5, 0.92]]],
    Z: [[[0.15, 0.08], [0.85, 0.08], [0.15, 0.92], [0.85, 0.92]]],
    " ": [],
    ".": [[[0.42, 0.84], [0.58, 0.84], [0.58, 0.92], [0.42, 0.92], [0.42, 0.84]]],
    "-": [[[0.18, 0.5], [0.82, 0.5]]],
    "/": [[[0.78, 0.08], [0.22, 0.92]]],
    "#": [[[0.28, 0.12], [0.28, 0.88]], [[0.72, 0.12], [0.72, 0.88]], [[0.12, 0.35], [0.88, 0.35]], [[0.12, 0.65], [0.88, 0.65]]],
    ":": [[[0.42, 0.28], [0.58, 0.28], [0.58, 0.4], [0.42, 0.4], [0.42, 0.28]], [[0.42, 0.68], [0.58, 0.68], [0.58, 0.8], [0.42, 0.8], [0.42, 0.68]]],
    "'": [[[0.48, 0.08], [0.42, 0.28]]],
    "+": [[[0.2, 0.5], [0.8, 0.5]], [[0.5, 0.2], [0.5, 0.8]]],
    "°": [[[0.35, 0.08], [0.62, 0.08], [0.62, 0.28], [0.35, 0.28], [0.35, 0.08]]],
  };

  /* --- draw helpers in 0..1 space --- */

  function setStroke(ctx, color, width, alpha) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
  }

  function setFill(ctx, color, alpha) {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
  }

  function wobblePts(pts, rnd, amp) {
    var out = [];
    var n = pts.length;
    for (var i = 0; i < n; i++) {
      var p = pts[i];
      var q = pts[(i + 1) % n];
      var dx = q[0] - p[0];
      var dy = q[1] - p[1];
      var len = Math.hypot(dx, dy) || 1;
      var o = (rnd() - 0.5) * 2 * amp;
      out.push([p[0] + (-dy / len) * o, p[1] + (dx / len) * o]);
    }
    return out;
  }

  function strokePts(ctx, pts, closed) {
    if (!pts.length) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
    ctx.stroke();
  }

  function fillPts(ctx, pts) {
    if (pts.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  function line(ctx, x0, y0, x1, y1) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  function circle(ctx, x, y, rad, fill) {
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    if (fill) ctx.fill();
    else ctx.stroke();
  }

  function drawGlyph(ctx, ch, x, y, h) {
    var g = GLYPH[ch];
    if (!g) g = GLYPH["#"];
    var w = h * 0.62;
    for (var i = 0; i < g.length; i++) {
      var poly = g[i];
      ctx.beginPath();
      for (var j = 0; j < poly.length; j++) {
        var px = x + poly[j][0] * w;
        var py = y + poly[j][1] * h;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    return w;
  }

  function drawText(ctx, str, x, y, h, tracking) {
    var t = tracking == null ? h * 0.14 : tracking;
    var cursor = x;
    var s = String(str).toUpperCase();
    for (var i = 0; i < s.length; i++) {
      cursor += drawGlyph(ctx, s[i], cursor, y, h) + t;
    }
    return cursor - x;
  }

  function textWidth(str, h, tracking) {
    var t = tracking == null ? h * 0.14 : tracking;
    var s = String(str).toUpperCase();
    var w = 0;
    for (var i = 0; i < s.length; i++) w += h * 0.62 + t;
    return w - t;
  }

  /* --- field + contours --- */

  function makeNoise(r, n) {
    var g = [];
    var i;
    for (i = 0; i < n * n; i++) g.push(r());
    return function (x, y) {
      var fx = ((x % 1) + 1) % 1 * (n - 1);
      var fy = ((y % 1) + 1) % 1 * (n - 1);
      var x0 = Math.floor(fx);
      var y0 = Math.floor(fy);
      var tx = fx - x0;
      var ty = fy - y0;
      var x1 = Math.min(n - 1, x0 + 1);
      var y1 = Math.min(n - 1, y0 + 1);
      var v00 = g[y0 * n + x0];
      var v10 = g[y0 * n + x1];
      var v01 = g[y1 * n + x0];
      var v11 = g[y1 * n + x1];
      var sx = tx * tx * (3 - 2 * tx);
      var sy = ty * ty * (3 - 2 * ty);
      return v00 * (1 - sx) * (1 - sy) + v10 * sx * (1 - sy) + v01 * (1 - sx) * sy + v11 * sx * sy;
    };
  }

  function makeField(r, structure) {
    var blobs = [];
    var i, n;
    var noise = makeNoise(r, 12);
    var phase = r() * Math.PI * 2;
    var cx = 0.5 + (r() - 0.5) * 0.12;
    var cy = 0.46 + (r() - 0.5) * 0.1;
    if (structure === "Basin") {
      blobs.push({ x: cx, y: cy, rx: 0.3, ry: 0.26, amp: 0.85 });
    } else if (structure === "Channel") {
      blobs.push({ x: 0.22 + (r() - 0.5) * 0.04, y: 0.48, rx: 0.14, ry: 0.42, amp: 0.7 });
      blobs.push({ x: 0.78 + (r() - 0.5) * 0.04, y: 0.5, rx: 0.14, ry: 0.42, amp: 0.7 });
    } else if (structure === "Archipelago") {
      n = 7 + int(r, 0, 4);
      for (i = 0; i < n; i++) {
        blobs.push({
          x: 0.18 + r() * 0.64,
          y: 0.16 + r() * 0.58,
          rx: 0.04 + r() * 0.05,
          ry: 0.035 + r() * 0.05,
          amp: 0.55 + r() * 0.55,
        });
      }
    } else {
      n = 3 + int(r, 0, 2);
      for (i = 0; i < n; i++) {
        blobs.push({
          x: 0.16 + ((i * 0.31 + r() * 0.12) % 0.68),
          y: 0.18 + r() * 0.52,
          rx: 0.07 + r() * 0.07,
          ry: 0.06 + r() * 0.06,
          amp: 0.45 + r() * 0.4,
        });
      }
    }
    return { blobs: blobs, noise: noise, phase: phase, cx: cx, cy: cy, kind: structure, freq: 2.2 + r() * 1.4 };
  }

  function heightAt(x, y, field) {
    var n1 = field.noise(x * field.freq, y * field.freq);
    var n2 = field.noise(x * field.freq * 2.1 + 3.1, y * field.freq * 2.1 + 1.7);
    var n = n1 * 0.7 + n2 * 0.3;
    var h = 0;
    var i, b, dx, dy;
    if (field.kind === "Channel") {
      var mid = 0.5 + 0.1 * Math.sin(y * 6.4 + field.phase);
      var d = Math.abs(x - mid);
      h = d * 4.4 - 0.12 + n * 0.28;
      for (i = 0; i < field.blobs.length; i++) {
        b = field.blobs[i];
        dx = (x - b.x) / b.rx;
        dy = (y - b.y) / b.ry;
        h += b.amp * Math.exp(-(dx * dx + dy * dy)) * 0.22;
      }
      return h;
    }
    if (field.kind === "Basin") {
      h = 1.05 - Math.hypot((x - field.cx) / 0.4, (y - field.cy) / 0.34);
      return h + (n - 0.5) * 0.42;
    }
    for (i = 0; i < field.blobs.length; i++) {
      b = field.blobs[i];
      dx = (x - b.x) / b.rx;
      dy = (y - b.y) / b.ry;
      h += b.amp * Math.exp(-(dx * dx + dy * dy));
    }
    if (field.kind === "Open Reach") h += (1 - y) * 0.18 + (n - 0.5) * 0.55;
    else h += (n - 0.45) * 0.4;
    return h;
  }

  function lerpPt(ax, ay, ah, bx, by, bh, level) {
    var t = (level - ah) / ((bh - ah) || 1e-9);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return [ax + (bx - ax) * t, ay + (by - ay) * t];
  }

  function marchingSegs(level, x0, y0, x1, y1, cols, rows, field) {
    var segs = [];
    var dx = (x1 - x0) / cols;
    var dy = (y1 - y0) / rows;
    var i, j;
    var grid = [];
    for (j = 0; j <= rows; j++) {
      grid[j] = [];
      for (i = 0; i <= cols; i++) grid[j][i] = heightAt(x0 + i * dx, y0 + j * dy, field);
    }
    for (j = 0; j < rows; j++) {
      for (i = 0; i < cols; i++) {
        var ha = grid[j][i];
        var hb = grid[j][i + 1];
        var hc = grid[j + 1][i + 1];
        var hd = grid[j + 1][i];
        var ax = x0 + i * dx;
        var ay = y0 + j * dy;
        var idx = (ha > level ? 1 : 0) | (hb > level ? 2 : 0) | (hc > level ? 4 : 0) | (hd > level ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        var e = [];
        if ((idx & 1) !== (idx & 2) >> 1) e.push(lerpPt(ax, ay, ha, ax + dx, ay, hb, level));
        if (((idx & 2) >> 1) !== ((idx & 4) >> 2)) e.push(lerpPt(ax + dx, ay, hb, ax + dx, ay + dy, hc, level));
        if (((idx & 4) >> 2) !== ((idx & 8) >> 3)) e.push(lerpPt(ax + dx, ay + dy, hc, ax, ay + dy, hd, level));
        if (((idx & 8) >> 3) !== (idx & 1)) e.push(lerpPt(ax, ay + dy, hd, ax, ay, ha, level));
        if (e.length >= 2) segs.push([e[0], e[1]]);
        if (e.length === 4) segs.push([e[2], e[3]]);
      }
    }
    return segs;
  }

  function hatchBox(ctx, x0, y0, x1, y1, gap, angle, clipFn) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var cx = (x0 + x1) * 0.5;
    var cy = (y0 + y1) * 0.5;
    var span = Math.hypot(x1 - x0, y1 - y0);
    var n = Math.ceil(span / gap);
    var i, t, px, py, qx, qy;
    for (i = -n; i <= n; i++) {
      t = i * gap;
      px = cx + -s * t - c * span;
      py = cy + c * t - s * span;
      qx = cx + -s * t + c * span;
      qy = cy + c * t + s * span;
      var samples = 28;
      var drawing = false;
      ctx.beginPath();
      for (var k = 0; k <= samples; k++) {
        var u = k / samples;
        var x = px + (qx - px) * u;
        var y = py + (qy - py) * u;
        var ok = x >= x0 && x <= x1 && y >= y0 && y <= y1 && (!clipFn || clipFn(x, y));
        if (ok) {
          if (!drawing) {
            ctx.moveTo(x, y);
            drawing = true;
          } else ctx.lineTo(x, y);
        } else {
          drawing = false;
        }
      }
      ctx.stroke();
    }
  }

  function buoyGlyph(ctx, x, y, kind, ink, accent) {
    if (kind === 0) {
      setFill(ctx, accent, 0.9);
      ctx.beginPath();
      ctx.moveTo(x, y - 0.018);
      ctx.lineTo(x + 0.012, y + 0.01);
      ctx.lineTo(x - 0.012, y + 0.01);
      ctx.closePath();
      ctx.fill();
      setStroke(ctx, ink, 0.0022, 1);
      ctx.stroke();
    } else if (kind === 1) {
      setStroke(ctx, ink, 0.0026, 1);
      line(ctx, x, y + 0.016, x, y - 0.02);
      setFill(ctx, accent, 1);
      circle(ctx, x, y - 0.02, 0.006, true);
      setStroke(ctx, ink, 0.0018, 1);
      circle(ctx, x, y - 0.02, 0.006, false);
    } else {
      setStroke(ctx, ink, 0.0024, 1);
      ctx.beginPath();
      ctx.moveTo(x - 0.01, y + 0.012);
      ctx.lineTo(x - 0.01, y - 0.004);
      ctx.lineTo(x + 0.01, y - 0.014);
      ctx.lineTo(x + 0.01, y + 0.012);
      ctx.closePath();
      ctx.stroke();
      setFill(ctx, accent, 0.55);
      ctx.fill();
    }
  }

  function coil(ctx, x, y, rnd, ink) {
    setStroke(ctx, ink, 0.0018, 0.85);
    ctx.beginPath();
    var turns = 2.4 + rnd() * 1.2;
    var steps = 40;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var a = t * turns * Math.PI * 2;
      var rad = 0.004 + t * 0.014;
      var px = x + Math.cos(a) * rad;
      var py = y + Math.sin(a) * rad * 0.72;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function northArrow(ctx, x, y, rot, ink, accent, label) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    setStroke(ctx, ink, 0.0024, 1);
    line(ctx, 0, 0.034, 0, -0.042);
    setFill(ctx, accent, 1);
    ctx.beginPath();
    ctx.moveTo(0, -0.05);
    ctx.lineTo(0.012, -0.02);
    ctx.lineTo(-0.012, -0.02);
    ctx.closePath();
    ctx.fill();
    setStroke(ctx, ink, 0.0018, 1);
    ctx.stroke();
    setStroke(ctx, ink, 0.002, 1);
    drawText(ctx, label, -0.008, -0.068, 0.016, 0.002);
    ctx.restore();
  }

  function scaleBar(ctx, x, y, ink) {
    setStroke(ctx, ink, 0.0022, 1);
    line(ctx, x, y, x + 0.18, y);
    var i;
    for (i = 0; i <= 4; i++) {
      var px = x + i * 0.045;
      line(ctx, px, y - 0.006, px, y + 0.006);
    }
    setFill(ctx, ink, 1);
    ctx.beginPath();
    ctx.rect(x, y - 0.004, 0.045, 0.008);
    ctx.rect(x + 0.09, y - 0.004, 0.045, 0.008);
    ctx.fill();
    setStroke(ctx, ink, 0.0018, 1);
    drawText(ctx, "0", x - 0.004, y + 0.01, 0.012, 0.0015);
    drawText(ctx, "4 CABLE", x + 0.11, y + 0.01, 0.012, 0.0015);
  }

  function drawPlate(ctx, hash, feat, w, h) {
    var ink = INKS[feat.Palette];
    var layout = stream(hash, "layout");
    var wobble = stream(hash, "wobble");
    var marks = stream(hash, "marks");
    var notes = stream(hash, "notes");

    ctx.save();
    ctx.fillStyle = ink.paper;
    ctx.fillRect(0, 0, w, h);

    var S = Math.min(w, h);
    ctx.translate((w - S) * 0.5, (h - S) * 0.5);
    ctx.scale(S, S);

    var i, j, x, y;

    setFill(ctx, ink.mute, 0.22);
    var grain = feat.Density === "Crowded" ? 900 : feat.Density === "Charted" ? 640 : 420;
    for (i = 0; i < grain; i++) {
      x = 0.03 + layout() * 0.94;
      y = 0.03 + layout() * 0.94;
      ctx.beginPath();
      ctx.arc(x, y, 0.0011 + layout() * 0.0014, 0, Math.PI * 2);
      ctx.fill();
    }

    setStroke(ctx, ink.ink, 0.006, 1);
    strokePts(ctx, wobblePts([[0.035, 0.035], [0.965, 0.035], [0.965, 0.965], [0.035, 0.965]], wobble, 0.002), true);
    setStroke(ctx, ink.ink, 0.0022, 1);
    strokePts(ctx, wobblePts([[0.055, 0.055], [0.945, 0.055], [0.945, 0.945], [0.055, 0.945]], wobble, 0.0015), true);
    setStroke(ctx, ink.mute, 0.0014, 0.8);
    strokePts(ctx, [[0.08, 0.08], [0.92, 0.08], [0.92, 0.835], [0.08, 0.835]], true);

    for (i = 0; i < 4; i++) {
      var cx = i === 0 || i === 3 ? 0.035 : 0.965;
      var cy = i < 2 ? 0.035 : 0.965;
      setStroke(ctx, ink.ink, 0.002, 1);
      line(ctx, cx - 0.012, cy, cx + 0.012, cy);
      line(ctx, cx, cy - 0.012, cx, cy + 0.012);
      circle(ctx, cx, cy, 0.004, false);
    }

    setStroke(ctx, ink.mute, 0.0011, 0.55);
    ctx.setLineDash([0.006, 0.008]);
    for (i = 1; i < 6; i++) {
      var gx = 0.08 + (0.84 * i) / 6;
      line(ctx, gx, 0.08, gx, 0.835);
      var gy = 0.08 + (0.755 * i) / 5;
      line(ctx, 0.08, gy, 0.92, gy);
    }
    ctx.setLineDash([]);

    setStroke(ctx, ink.ink, 0.0016, 0.85);
    for (i = 0; i <= 12; i++) {
      x = 0.08 + (0.84 * i) / 12;
      line(ctx, x, 0.08, x, 0.068);
      line(ctx, x, 0.835, x, 0.847);
    }
    for (i = 0; i <= 10; i++) {
      y = 0.08 + (0.755 * i) / 10;
      line(ctx, 0.08, y, 0.068, y);
      line(ctx, 0.92, y, 0.932, y);
    }

    var field = makeField(layout, feat.Structure);
    var levels =
      feat.Density === "Crowded"
        ? [0.72, 0.52, 0.36, 0.22]
        : feat.Density === "Charted"
          ? [0.64, 0.42, 0.26]
          : [0.58, 0.32];

    if (feat.Hatch !== "None") {
      var hatchLevel = feat.Hatch === "Shoal" ? levels[0] : levels[Math.min(1, levels.length - 1)];
      setStroke(ctx, ink.mute, 0.0012, 0.62);
      hatchBox(ctx, 0.085, 0.085, 0.915, 0.83, feat.Hatch === "Contour Fill" ? 0.008 : 0.013, 0.52 + marks() * 0.25, function (px, py) {
        return heightAt(px, py, field) > hatchLevel;
      });
      if (feat.Hatch === "Contour Fill") {
        setStroke(ctx, ink.mute, 0.0009, 0.35);
        hatchBox(ctx, 0.085, 0.085, 0.915, 0.83, 0.012, 0.52 + marks() * 0.25 + 1.2, function (px, py) {
          return heightAt(px, py, field) > hatchLevel;
        });
      }
    }

    for (j = 0; j < levels.length; j++) {
      var segs = marchingSegs(levels[j], 0.085, 0.085, 0.915, 0.83, 26, 22, field);
      setStroke(ctx, j === 0 ? ink.accent : ink.ink, j === 0 ? 0.0034 : 0.002, j === 0 ? 0.95 : 0.78);
      if (j === levels.length - 1) ctx.setLineDash([0.007, 0.006]);
      for (i = 0; i < segs.length; i++) {
        var a = segs[i][0];
        var b = segs[i][1];
        var ox = (wobble() - 0.5) * 0.004;
        var oy = (wobble() - 0.5) * 0.004;
        line(ctx, a[0] + ox, a[1] + oy, b[0] - ox, b[1] - oy);
      }
      ctx.setLineDash([]);
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0.08, 0.08, 0.84, 0.755);
    ctx.clip();
    setStroke(ctx, ink.accent, 0.0018, 0.55);
    ctx.setLineDash([0.018, 0.01]);
    var fx0 = 0.12 + layout() * 0.1;
    var fy0 = 0.72 - layout() * 0.1;
    var fx1 = 0.78 + layout() * 0.08;
    var fy1 = 0.18 + layout() * 0.14;
    var fxc = 0.4 + (layout() - 0.5) * 0.2;
    var fyc = 0.42 + (layout() - 0.5) * 0.16;
    ctx.beginPath();
    ctx.moveTo(fx0, fy0);
    ctx.quadraticCurveTo(fxc, fyc, fx1, fy1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    var stationN = feat.Density === "Crowded" ? 22 : feat.Density === "Charted" ? 14 : 8;
    var stations = [];
    var guard = 0;
    while (stations.length < stationN && guard < 400) {
      guard++;
      x = 0.12 + layout() * 0.76;
      y = 0.12 + layout() * 0.66;
      var hv = heightAt(x, y, field);
      if (hv < 0.12 || hv > 1.15) continue;
      var ok = true;
      for (i = 0; i < stations.length; i++) {
        if (Math.hypot(stations[i].x - x, stations[i].y - y) < 0.055) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      stations.push({
        x: x,
        y: y,
        d: (4 + marks() * 28).toFixed(1),
        id: "ST-" + ("0" + (stations.length + 1)).slice(-2),
      });
    }

    if (stations.length > 1) {
      setStroke(ctx, ink.mute, 0.0016, 0.7);
      ctx.setLineDash([0.01, 0.007]);
      ctx.beginPath();
      ctx.moveTo(stations[0].x, stations[0].y);
      for (i = 1; i < Math.min(stations.length, feat.Structure === "Channel" ? stations.length : 8); i++) {
        ctx.lineTo(stations[i].x, stations[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (i = 0; i < stations.length; i++) {
      var st = stations[i];
      setStroke(ctx, ink.ink, 0.002, 1);
      ctx.beginPath();
      ctx.moveTo(st.x, st.y - 0.009);
      ctx.lineTo(st.x + 0.008, st.y + 0.007);
      ctx.lineTo(st.x - 0.008, st.y + 0.007);
      ctx.closePath();
      ctx.stroke();
      setStroke(ctx, ink.ink, 0.0016, 0.9);
      drawText(ctx, st.d, st.x + 0.008, st.y - 0.014, 0.013, 0.0016);
    }

    var buoyN = feat.Density === "Sparse" ? 2 : feat.Density === "Charted" ? 4 : 6;
    for (i = 0; i < buoyN && i < stations.length; i++) {
      var bix = int(marks, 0, stations.length - 1);
      buoyGlyph(ctx, stations[bix].x + 0.02, stations[bix].y - 0.02, int(marks, 0, 2), ink.ink, ink.accent);
    }

    var coilN = feat.Density === "Crowded" ? 5 : 3;
    for (i = 0; i < coilN && i < stations.length; i++) {
      if (chance(marks, 0.7)) coil(ctx, stations[i].x - 0.02, stations[i].y + 0.02, marks, ink.mute);
    }

    var noteN = feat.Annotation === "Quiet" ? 2 : feat.Annotation === "Noted" ? 4 : 7;
    var usedNotes = [];
    for (i = 0; i < stations.length && usedNotes.length < noteN; i++) {
      var ns = stations[i];
      var tx = ns.x + (notes() > 0.5 ? 0.08 : -0.14);
      var ty = ns.y + (notes() > 0.5 ? -0.06 : 0.05);
      tx = Math.max(0.1, Math.min(0.78, tx));
      ty = Math.max(0.1, Math.min(0.76, ty));
      var clash = false;
      for (j = 0; j < usedNotes.length; j++) {
        if (Math.hypot(usedNotes[j][0] - tx, usedNotes[j][1] - ty) < 0.07) clash = true;
      }
      if (clash) continue;
      usedNotes.push([tx, ty]);
      setStroke(ctx, ink.accent, 0.0014, 0.85);
      line(ctx, ns.x, ns.y, tx, ty + 0.012);
      setStroke(ctx, ink.ink, 0.0015, 1);
      var label = ns.id + " / " + ns.d;
      var tw = textWidth(label, 0.012, 0.0015);
      setStroke(ctx, ink.mute, 0.0012, 0.7);
      ctx.strokeRect(tx - 0.004, ty - 0.002, tw + 0.01, 0.02);
      setStroke(ctx, ink.ink, 0.0015, 1);
      drawText(ctx, label, tx, ty, 0.012, 0.0015);
    }

    if (feat.Annotation === "Ledgered") {
      setStroke(ctx, ink.ink, 0.0016, 0.85);
      drawText(ctx, "LEADLINE COIL  /  REDUCE TO MHW", 0.1, 0.79, 0.011, 0.0014);
    }

    var nrot = 0;
    if (feat.North === "Magnetic") nrot = (8 + layout() * 6) * (Math.PI / 180) * (layout() > 0.5 ? 1 : -1);
    if (feat.North === "Drifted") nrot = (16 + layout() * 20) * (Math.PI / 180) * (layout() > 0.5 ? 1 : -1);
    var nl = feat.North === "True" ? "N" : feat.North === "Magnetic" ? "MN" : "DN";
    northArrow(ctx, 0.84, 0.16, nrot, ink.ink, ink.accent, nl);
    scaleBar(ctx, 0.12, 0.8, ink.ink);

    setStroke(ctx, ink.ink, 0.0016, 0.7);
    ctx.beginPath();
    ctx.moveTo(0.08, 0.72);
    var profW = 0.84;
    for (i = 0; i <= 48; i++) {
      var u = i / 48;
      var px = 0.08 + u * profW;
      var depth = heightAt(px, 0.45, field);
      var py = 0.825 - Math.min(0.09, depth * 0.07);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    setStroke(ctx, ink.mute, 0.0012, 0.55);
    line(ctx, 0.08, 0.825, 0.92, 0.825);
    drawText(ctx, "PROFILE E-W", 0.36, 0.81, 0.009, 0.0012);

    setFill(ctx, ink.paper, 0.94);
    ctx.fillRect(0.1, 0.1, 0.2, 0.078);
    setStroke(ctx, ink.ink, 0.0018, 1);
    ctx.strokeRect(0.1, 0.1, 0.2, 0.078);
    setStroke(ctx, ink.ink, 0.0015, 1);
    drawText(ctx, "LEGEND", 0.11, 0.108, 0.01, 0.0013);
    setStroke(ctx, ink.ink, 0.0018, 1);
    ctx.beginPath();
    ctx.moveTo(0.118, 0.132);
    ctx.lineTo(0.13, 0.144);
    ctx.lineTo(0.106, 0.144);
    ctx.closePath();
    ctx.stroke();
    drawText(ctx, "STATION", 0.138, 0.128, 0.009, 0.0012);
    buoyGlyph(ctx, 0.122, 0.16, 1, ink.ink, ink.accent);
    setStroke(ctx, ink.ink, 0.0015, 1);
    drawText(ctx, "BUOY", 0.138, 0.152, 0.009, 0.0012);

    setFill(ctx, ink.paper, 0.94);
    ctx.fillRect(0.58, 0.86, 0.35, 0.085);
    setStroke(ctx, ink.ink, 0.0022, 1);
    ctx.strokeRect(0.58, 0.86, 0.35, 0.085);
    setStroke(ctx, ink.ink, 0.0024, 1);
    drawText(ctx, "SOUNDING PLATE", 0.592, 0.868, 0.015, 0.0016);
    setStroke(ctx, ink.mute, 0.0016, 1);
    drawText(ctx, feat.Structure.toUpperCase(), 0.592, 0.89, 0.011, 0.0014);
    var slug = normalizeHash(hash).slice(2, 10);
    drawText(ctx, "HASH " + slug, 0.592, 0.908, 0.01, 0.0012);
    drawText(ctx, feat.Palette.toUpperCase(), 0.592, 0.924, 0.01, 0.0012);

    setStroke(ctx, ink.ink, 0.0018, 0.8);
    drawText(ctx, "PLATE", 0.08, 0.86, 0.012, 0.0015);
    var plateNo = "PL-" + ("00" + (100 + Math.floor(stream(hash, "plate-no")() * 800))).slice(-3);
    setStroke(ctx, ink.accent, 0.0022, 1);
    drawText(ctx, plateNo, 0.08, 0.88, 0.024, 0.002);
    setStroke(ctx, ink.mute, 0.0015, 1);
    drawText(ctx, feat.Density.toUpperCase() + "  " + feat.Hatch.toUpperCase(), 0.08, 0.922, 0.01, 0.0013);

    ctx.restore();
  }

  function render(canvas, hash, pixelSize) {
    var feat = features(hash);
    return withSeededOnly(function () {
      var size = pixelSize || Math.min(canvas.width, canvas.height) || 800;
      canvas.width = size;
      canvas.height = size;
      var ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      drawPlate(ctx, normalizeHash(hash), feat, size, size);
      return feat;
    });
  }

  var api = {
    DEFAULT_HASH: DEFAULT_HASH,
    PALETTES: PALETTES,
    DENSITIES: DENSITIES,
    STRUCTURES: STRUCTURES,
    ANNOTATIONS: ANNOTATIONS,
    NORTHS: NORTHS,
    HATCHES: HATCHES,
    normalizeHash: normalizeHash,
    features: features,
    sheetHashes: sheetHashes,
    render: render,
    stream: stream,
    digestText: digestText,
  };

  root.Genart = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
