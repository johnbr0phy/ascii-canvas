/* ===========================================================
   PAINT — a small acrylic/mixed-media engine for canvas 2d.
   Every mark is built from bristles with pressure, dry gaps and
   colour drift. Surfaces are baked once into plates; animation
   is transform, reveal and two-plate boil, the way hand-painted
   animation actually moves.
   =========================================================== */
var TAU = Math.PI * 2;

function rnd(seed) {
  var s = (Math.imul(seed | 0, 2654435761) ^ 0x9e3779b9) >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    var t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- colour ---- */
function hx(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function cl(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
function toHex(a) {
  return '#' + a.map(function (v) { return ('0' + Math.round(cl(v)).toString(16)).slice(-2); }).join('');
}
function mix(a, b, t) {
  var A = hx(a), B = hx(b);
  return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
function rgba(h, a) { var c = hx(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
function jit(h, r, amt) {
  var c = hx(h), d = (r() - 0.5) * 2 * amt;
  return toHex([c[0] + d, c[1] + d * (0.55 + r() * 0.6), c[2] + d * (0.3 + r() * 0.7)]);
}

/* ---- plates ---- */
function plate(w, h) {
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c: c, x: c.getContext('2d'), w: w, h: h };
}

/* ---- geometry ---- */
function crSample(p, n, close) {
  var N = p.length, out = [];
  if (N < 2) return p.slice();
  if (N === 2) {
    for (var k = 0; k <= n; k++) {
      var t = k / n;
      out.push([p[0][0] + (p[1][0] - p[0][0]) * t, p[0][1] + (p[1][1] - p[0][1]) * t]);
    }
    return out;
  }
  var get = function (i) {
    return close ? p[((i % N) + N) % N] : p[i < 0 ? 0 : i > N - 1 ? N - 1 : i];
  };
  var last = close ? N : N - 1;
  for (var i = 0; i < last; i++) {
    var p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (var j = 0; j < n; j++) {
      var u = j / n, u2 = u * u, u3 = u2 * u;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)
      ]);
    }
  }
  if (!close) out.push(p[N - 1]);
  return out;
}

function curve(x, p, close) {
  if (p.length < 2) return;
  var sm = crSample(p, 10, close);
  x.moveTo(sm[0][0], sm[0][1]);
  for (var i = 1; i < sm.length; i++) x.lineTo(sm[i][0], sm[i][1]);
  if (close) x.closePath();
}

function blobPts(cx, cy, rx, ry, seed, lumps, amp) {
  var r = rnd(seed), n = lumps || 13, a = amp == null ? 0.13 : amp, pts = [];
  for (var i = 0; i < n; i++) {
    var th = i / n * TAU, k = 1 + (r() - 0.5) * 2 * a;
    pts.push([cx + Math.cos(th) * rx * k, cy + Math.sin(th) * ry * k]);
  }
  return pts;
}

function shrinkPts(pts, k) {
  var cx = 0, cy = 0;
  pts.forEach(function (p) { cx += p[0]; cy += p[1]; });
  cx /= pts.length; cy /= pts.length;
  return pts.map(function (p) { return [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]; });
}

function movePts(pts, dx, dy) {
  return pts.map(function (p) { return [p[0] + dx, p[1] + dy]; });
}

function rotPts(pts, cx, cy, a) {
  var c = Math.cos(a), s = Math.sin(a);
  return pts.map(function (p) {
    var dx = p[0] - cx, dy = p[1] - cy;
    return [cx + dx * c - dy * s, cy + dx * s + dy * c];
  });
}

/* A torn edge, not a pinking-shear edge. Sampling at a fixed step with a
   uniform random offset makes an even sawtooth, which is the giveaway that a
   shape was generated rather than torn. Here the step length wanders and the
   offset carries a slow drift with the odd deep nick, the way paper fibre
   gives way unevenly. */
function jagPoly(pts, seed, amp, step) {
  var r = rnd(seed), out = [], drift = 0;
  var base = step || 22;
  for (var i = 0; i < pts.length; i++) {
    var a = pts[i], b = pts[(i + 1) % pts.length];
    var L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!L) continue;
    var nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    var d = 0;
    while (d < L) {
      drift = drift * 0.62 + (r() - 0.5) * amp * 1.1;
      var nick = r() < 0.09 ? (r() - 0.5) * amp * 3.2 : 0;
      var o = drift + nick + (r() - 0.5) * amp * 0.5;
      var t = d / L;
      out.push([a[0] + (b[0] - a[0]) * t + nx * o, a[1] + (b[1] - a[1]) * t + ny * o]);
      d += base * (0.35 + r() * 1.5);
    }
  }
  return out;
}

function partial(pts, f) {
  if (f >= 1) return pts;
  var sm = crSample(pts, 8, false);
  var n = Math.max(2, Math.round(sm.length * Math.max(0.02, f)));
  return sm.slice(0, n);
}

/* ---- the brush ----
   pressure + bristle spread + dry-brush gaps + colour drift. */
function brush(x, pts, o) {
  o = o || {};
  var r = rnd(o.seed == null ? 11 : o.seed);
  var sm = o.raw ? pts : crSample(pts, o.dens || 8, !!o.close);
  if (sm.length < 2) return;
  var nb = o.bristles == null ? 4 : o.bristles;
  var W = o.w == null ? 10 : o.w;
  var A = o.alpha == null ? 0.9 : o.alpha;
  var col = o.col || '#1A1A1A';
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (var b = 0; b < nb; b++) {
    var off = nb === 1 ? (r() - 0.5) * W * 0.12 : (b / (nb - 1) - 0.5) * W * (o.spread == null ? 0.92 : o.spread);
    var ph = r() * TAU, ph2 = r() * TAU;
    /* arc modulation: a closed outline of even weight all the way round is the
       sticker die-cut tell. Real drawn contours swell where the hand pressed
       and vanish where it lifted, so weight rides a slow wave along the path
       and drops out entirely in the troughs. */
    var arcPh = r() * TAU, arcPh2 = r() * TAU, arcF = 1.3 + r() * 1.7;
    var bw = (W / Math.max(1, nb)) * (o.thick == null ? 1.5 : o.thick) * (0.72 + r() * 0.56);
    var bcol = o.vary ? jit(col, r, o.vary) : col;
    /* dry-brush skips are run-lengths in real distance, not a per-sample coin
       flip: a coin flip at the sampling step turns every stroke into a regular
       dash pattern, which reads as digital hatching rather than a loaded
       bristle losing contact with the tooth of the canvas. */
    var dry = o.dry || 0;
    var runLeft = dry ? (6 + r() * 26) / Math.max(0.2, dry) : Infinity;
    var inGap = false;
    var prev = null, skip = false, run = 0, band = [], bands = [];
    for (var i = 0; i < sm.length; i++) {
      if (i) run += Math.hypot(sm[i][0] - sm[i - 1][0], sm[i][1] - sm[i - 1][1]);
      var p = sm[i];
      var q = sm[Math.min(sm.length - 1, i + 1)], pp = sm[Math.max(0, i - 1)];
      var nx = -(q[1] - pp[1]), ny = q[0] - pp[0];
      var L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      /* Wobble and pressure ride travelled distance, not sample index. Keyed
         to the index they beat at a period set by the sampling density, so a
         long stroke came out banded into even segments like a bamboo cane. */
      var wig = Math.sin(run * 0.024 + ph) * W * 0.05 + Math.sin(run * 0.0065 + ph2) * W * 0.1;
      var xx = p[0] + nx * (off + wig), yy = p[1] + ny * (off + wig);
      var u = i / (sm.length - 1);
      var press = 1;
      if (o.taper) press = Math.pow(Math.sin(Math.PI * u), o.taper === true ? 0.42 : o.taper);
      press *= 0.68 + 0.22 * Math.sin(run * 0.031 + ph) + 0.24 * r();
      if (o.arc) {
        var av = 0.62 * Math.sin(u * TAU * arcF + arcPh) + 0.38 * Math.sin(u * TAU * arcF * 2.3 + arcPh2);
        press *= Math.max(0, 0.55 + (o.arc === true ? 0.85 : o.arc) * av);
      }
      if (dry && prev) {
        runLeft -= Math.hypot(xx - prev[0], yy - prev[1]);
        if (runLeft <= 0) {
          inGap = !inGap;
          runLeft = inGap ? (2 + r() * 9) * dry * 2.4 : (6 + r() * 26) / Math.max(0.2, dry);
        }
        skip = inGap;
      }
      /* Ribbon mode collects the bristle into one filled band and lays it
         down once. Stroking every segment separately at part alpha stacks
         the overlaps and scallops the round caps, so a solid form like a
         cane came out as a chain of translucent beads. Scumble and wash
         still want the stacking, so they keep the segment-by-segment path. */
      if (o.ribbon) {
        if (skip || press <= 0.06) { if (band.length > 1) bands.push(band); band = []; }
        else band.push([xx, yy, Math.max(0.5, bw * press) / 2]);
      } else if (prev && !skip && press > 0.06) {
        x.beginPath();
        x.moveTo(prev[0], prev[1]); x.lineTo(xx, yy);
        x.strokeStyle = bcol;
        x.globalAlpha = o.solid ? A : A * (0.6 + 0.4 * r()) * (o.fade ? Math.max(0.12, press) : 1);
        x.lineWidth = Math.max(0.5, bw * press);
        x.stroke();
      }
      prev = [xx, yy];
    }
    if (o.ribbon) {
      if (band.length > 1) bands.push(band);
      x.globalAlpha = A;
      x.fillStyle = bcol;
      for (var bi = 0; bi < bands.length; bi++) ribbon(x, bands[bi]);
    }
  }
  x.globalAlpha = 1;
}

/* fill a band of [x, y, halfWidth] as one closed shape */
function ribbon(x, band) {
  var n = band.length, left = [], right = [], i, a, b, nx, ny, L;
  for (i = 0; i < n; i++) {
    a = band[Math.max(0, i - 1)]; b = band[Math.min(n - 1, i + 1)];
    nx = -(b[1] - a[1]); ny = b[0] - a[0];
    L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    left.push([band[i][0] + nx * band[i][2], band[i][1] + ny * band[i][2]]);
    right.push([band[i][0] - nx * band[i][2], band[i][1] - ny * band[i][2]]);
  }
  x.beginPath();
  x.moveTo(left[0][0], left[0][1]);
  for (i = 1; i < n; i++) x.lineTo(left[i][0], left[i][1]);
  for (i = n - 1; i >= 0; i--) x.lineTo(right[i][0], right[i][1]);
  x.closePath();
  x.fill();
}

/* ---- grain: canvas tooth, composited with overlay ---- */
function grainPlate(W, H, seed, amt, weave) {
  var p = plate(W, H), im = p.x.createImageData(W, H), d = im.data, r = rnd(seed);
  for (var y = 0; y < H; y++) {
    var wy = weave ? Math.sin(y * 1.93) : 0;
    for (var x = 0; x < W; x++) {
      var i = (y * W + x) * 4;
      var v = (r() - 0.5) * 2;
      if (weave) v += 0.42 * (Math.sin(x * 1.71) + wy);
      var g = 128 + v * amt;
      d[i] = d[i + 1] = d[i + 2] = g < 0 ? 0 : g > 255 ? 255 : g;
      d[i + 3] = 255;
    }
  }
  p.x.putImageData(im, 0, 0);
  return p;
}

function applyGrain(x, g, a, W, H) {
  x.save();
  x.globalCompositeOperation = 'overlay';
  x.globalAlpha = a;
  x.drawImage(g.c, 0, 0, W, H);
  x.restore();
}

/* ---- crumpled tissue / crackle, as a reusable transparent plate ---- */
function crazePlate(W, H, o) {
  o = o || {};
  var p = plate(W, H), x = p.x, r = rnd(o.seed || 3);
  var facets = o.facets == null ? 130 : o.facets;
  for (var i = 0; i < facets; i++) {
    var cx = r() * W, cy = r() * H, n = 4 + (r() * 3 | 0), rad = 9 + r() * 34, pts = [];
    for (var k = 0; k < n; k++) {
      var a = k / n * TAU;
      pts.push([cx + Math.cos(a) * rad * (0.45 + r() * 0.9), cy + Math.sin(a) * rad * (0.45 + r() * 0.9)]);
    }
    x.beginPath(); curve(x, pts, true);
    x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.028)' : 'rgba(0,0,0,0.05)';
    x.fill();
  }
  var lines = o.lines == null ? 300 : o.lines;
  for (var j = 0; j < lines; j++) {
    var px = r() * W, py = r() * H, ang = r() * TAU, ps = [[px, py]];
    var segs = 3 + (r() * 7 | 0);
    for (var s = 0; s < segs; s++) {
      ang += (r() - 0.5) * 1.15;
      var Ln = 12 + r() * 48;
      px += Math.cos(ang) * Ln; py += Math.sin(ang) * Ln;
      ps.push([px, py]);
    }
    var sd = (r() * 1e6) | 0;
    brush(x, ps.map(function (q) { return [q[0] - 1.5, q[1] - 1.6]; }),
      { col: '#ffffff', w: 1.5, alpha: 0.13, bristles: 1, seed: sd + 1, dens: 4, dry: 0.3 });
    brush(x, ps, { col: '#000000', w: 1.7, alpha: 0.14 + r() * 0.1, bristles: 1, seed: sd, dens: 4, dry: 0.16 });
  }
  return p;
}

/* draw a texture plate through a shape */
function textureThrough(x, tex, pathFn, a, dx, dy) {
  x.save();
  x.beginPath(); pathFn(x); x.clip();
  x.globalAlpha = a == null ? 0.85 : a;
  x.drawImage(tex.c, dx || 0, dy || 0);
  x.restore();
  x.globalAlpha = 1;
}

/* ---- scrubbed, trowelled ground ---- */
function ground(x, W, H, o) {
  var r = rnd(o.seed || 1);
  x.fillStyle = o.base; x.fillRect(0, 0, W, H);
  var tints = o.tints || [o.base];
  var i, g, cx, cy, rad;
  for (i = 0; i < (o.mottle == null ? 110 : o.mottle); i++) {
    cx = r() * W; cy = r() * H; rad = 50 + r() * 230;
    g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    var col = tints[(r() * tints.length) | 0];
    g.addColorStop(0, rgba(col, 0.08 + r() * 0.13));
    g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g;
    x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
  var vert = !!o.vertical;
  for (i = 0; i < (o.sweeps == null ? 90 : o.sweeps); i++) {
    var len = (vert ? H : W) * (0.3 + r() * 0.8);
    var sx = r() * W * 1.1 - W * 0.05, sy = r() * H * 1.1 - H * 0.05;
    var drift = (r() - 0.5) * 180;
    var pts = vert
      ? [[sx, sy], [sx + drift * 0.3, sy + len * 0.4], [sx + drift, sy + len]]
      : [[sx, sy], [sx + len * 0.4, sy + drift * 0.3], [sx + len, sy + drift]];
    /* No dry gaps on a sweep this wide. The ink runs come out a similar
       length across every bristle, so ninety of them tile the whole ground
       into rows of little lozenges — the pattern reads as machine hatching
       and it prints straight through anything translucent laid over it. */
    brush(x, pts, {
      col: jit(tints[(r() * tints.length) | 0], r, o.drift == null ? 26 : o.drift),
      w: 18 + r() * 64, alpha: 0.04 + r() * 0.1, bristles: 4,
      seed: (r() * 1e6) | 0, dens: 6, spread: 0.6, thick: 2.6, taper: 0.85
    });
  }
  /* Broken touches instead, each its own short mark, so the break is in where
     they fall rather than in a rhythm along a stroke. */
  for (i = 0; i < (o.mottle == null ? 60 : o.mottle); i++) {
    var tx = r() * W, ty = r() * H, ta = r() * TAU;
    var tL = 10 + Math.pow(r(), 2) * 150;
    brush(x, [[tx, ty], [tx + Math.cos(ta) * tL, ty + Math.sin(ta) * tL]], {
      col: jit(tints[(r() * tints.length) | 0], r, o.drift == null ? 26 : o.drift),
      w: 6 + r() * 42, alpha: 0.035 + r() * 0.1, bristles: 4,
      seed: (r() * 1e6) | 0, dens: 5, taper: 0.9, spread: 0.6, thick: 2.6
    });
  }
  for (i = 0; i < (o.scrape == null ? 40 : o.scrape); i++) {
    var ax = r() * W, ay = r() * H, aa = (vert ? Math.PI / 2 : 0) + (r() - 0.5) * 0.7, aL = 60 + r() * 260;
    brush(x, [[ax, ay], [ax + Math.cos(aa) * aL, ay + Math.sin(aa) * aL]], {
      col: r() < 0.5 ? o.light || '#ffffff' : o.dark || '#4a4038',
      w: 5 + r() * 16, alpha: 0.05 + r() * 0.1, bristles: 3,
      seed: (r() * 1e6) | 0, dens: 5, taper: 0.9, arc: 0.7
    });
  }
  if (o.vignette !== false) {
    g = x.createRadialGradient(W * 0.5, H * 0.48, W * 0.22, W * 0.5, H * 0.5, W * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, rgba(o.dark || '#2B2B2B', o.vignette || 0.2));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
}

/* ---- edges: fuzzy charcoal envelope + drawn outline ---- */
function envelope(x, pts, o) {
  o = o || {};
  var col = o.col || '#1A1A1A', close = o.close !== false;
  var w = o.w == null ? 12 : o.w;
  /* the halo is a blurred fill, not a stroke: a form sinking into the ground
     rather than a ring drawn around a sticker. Body paint covers it after. */
  var halos = o.halo == null ? 2 : o.halo;
  for (var i = 0; i < halos; i++) {
    x.save();
    x.shadowColor = rgba(o.haloCol || col, (o.haloA == null ? 0.4 : o.haloA) / (1 + i));
    x.shadowBlur = (o.blur == null ? 26 : o.blur) * (1 + i * 1.6);
    x.shadowOffsetX = (o.hox || 0) * (1 + i);
    x.shadowOffsetY = (o.hoy || 0) * (1 + i);
    x.beginPath(); curve(x, pts, true);
    x.fillStyle = rgba(o.fillCol || col, 0.9);
    x.fill();
    x.restore();
  }
  for (var k = 0; k < (o.passes || 3); k++) {
    brush(x, k ? movePts(pts, (k % 2 ? 1.6 : -1.4), (k % 2 ? -1.2 : 1.8)) : pts, {
      col: k === 2 ? mix(col, '#ffffff', 0.18) : col,
      w: w * (k === 0 ? 1 : k === 1 ? 0.7 : 0.4),
      alpha: k === 0 ? 0.88 : 0.5, bristles: k === 0 ? 4 : 2,
      close: close, seed: (o.seed || 5) + k * 7 + 1, dens: 9, dry: k ? 0.25 : 0.06, vary: 14,
      arc: o.arc == null ? 0.7 : o.arc
    });
  }
}

/* ---- charcoal contour ----
   The contour is one dark line, not a bundle. Running brush() with four
   spread bristles and dry gaps gives each bristle its own phase, so the
   outline comes out as four parallel dashed tracks: stitching round a patch,
   which is the die-cut tell. So: a soft dark bleed either side, then a single
   continuous core whose weight rides the arc wave, then a short overdrawn
   passage or two where the hand went back over the line. */
function contour(x, pts, o) {
  o = o || {};
  var col = o.col || '#141210', W = o.w == null ? 17 : o.w;
  var close = o.close !== false, seed = o.seed == null ? 5 : o.seed;
  var r = rnd(seed + 991);
  var sm = crSample(pts, 7, close);
  /* the bleed: wide, faint, no gaps, so the line has soot around it */
  for (var b = 0; b < 2; b++) {
    brush(x, movePts(sm, (r() - 0.5) * 3, (r() - 0.5) * 3), {
      col: col, w: W * (2.1 + b * 1.5), alpha: 0.1 - b * 0.035, bristles: 2,
      close: close, seed: seed + 40 + b, raw: true, spread: 1.2, thick: 1.1
    });
  }
  /* the core: continuous, weight-varied, drawn once */
  brush(x, sm, {
    col: col, w: W, alpha: o.alpha == null ? 0.93 : o.alpha, bristles: 2,
    close: close, seed: seed + 1, raw: true, vary: o.vary == null ? 16 : o.vary,
    spread: 0.3, thick: 1.3, arc: o.arc == null ? 0.42 : o.arc, ribbon: true
  });
  /* going back over it: a couple of short passages, heavier, slightly off */
  var goes = o.goes == null ? 3 : o.goes;
  for (var g = 0; g < goes; g++) {
    var i0 = (r() * sm.length) | 0;
    var len = Math.max(6, (sm.length * (0.09 + r() * 0.17)) | 0);
    var seg = [];
    for (var k = 0; k < len; k++) seg.push(sm[(i0 + k) % sm.length]);
    if (!close && i0 + len > sm.length) continue;
    brush(x, movePts(seg, (r() - 0.5) * 5, (r() - 0.5) * 5), {
      col: r() < 0.3 ? mix(col, '#ffffff', 0.2) : col,
      w: W * (0.62 + r() * 0.6), alpha: 0.5 + r() * 0.3, bristles: 1,
      close: false, seed: (r() * 1e6) | 0, raw: true, taper: 0.7, thick: 1.2
    });
  }
}

/* pale second rim so a form lifts off the ground */
function rim(x, pts, o) {
  o = o || {};
  brush(x, shrinkPts(pts, o.k == null ? 1.075 : o.k), {
    col: o.col || '#F5F0E6', w: o.w || 16, alpha: o.alpha == null ? 0.3 : o.alpha,
    bristles: 4, close: true, seed: o.seed || 77, dens: 8, dry: 0.3,
    arc: o.arc == null ? 1.1 : o.arc, vary: 12
  });
}

/* ---- impasto body: knife strokes with ridge light ---- */
function impasto(x, pathFn, o) {
  var r = rnd(o.seed || 9);
  x.save();
  x.beginPath(); pathFn(x); x.clip();
  var bb = o.bb;
  x.fillStyle = o.base; x.fillRect(bb[0], bb[1], bb[2], bb[3]);
  if (o.grad) {
    var g = x.createLinearGradient(o.grad[0], o.grad[1], o.grad[2], o.grad[3]);
    g.addColorStop(0, rgba(o.grad[4], o.grad[6] == null ? 0.95 : o.grad[6]));
    g.addColorStop(1, rgba(o.grad[5], 0));
    x.fillStyle = g; x.fillRect(bb[0], bb[1], bb[2], bb[3]);
  }
  var n = o.n == null ? 26 : o.n;
  var ang = o.angle == null ? -0.5 : o.angle;
  var diag = Math.hypot(bb[2], bb[3]);
  for (var i = 0; i < n; i++) {
    var cx = bb[0] + r() * bb[2], cy = bb[1] + r() * bb[3];
    var a = ang + (r() - 0.5) * (o.spreadA == null ? 0.6 : o.spreadA);
    var L = diag * (0.25 + r() * 0.55) * (o.len == null ? 1 : o.len);
    var p0 = [cx - Math.cos(a) * L / 2, cy - Math.sin(a) * L / 2];
    var p1 = [cx + Math.cos(a) * L / 2 + (r() - 0.5) * 40, cy + Math.sin(a) * L / 2 + (r() - 0.5) * 40];
    var mid = [(p0[0] + p1[0]) / 2 + (r() - 0.5) * 50, (p0[1] + p1[1]) / 2 + (r() - 0.5) * 50];
    var pth = [p0, mid, p1];
    var w = (o.kw == null ? 34 : o.kw) * (0.5 + r());
    var body = jit(r() < 0.5 ? o.base : (o.cols || [o.base])[(r() * (o.cols || [o.base]).length) | 0], r, o.drift == null ? 22 : o.drift);
    var nx = -Math.sin(a), ny = Math.cos(a);
    brush(x, movePts(pth, nx * w * 0.42, ny * w * 0.42), {
      col: o.shade || mix(o.base, '#1A1A1A', 0.42), w: w * 0.34, alpha: 0.2 + r() * 0.2,
      bristles: 2, seed: (r() * 1e6) | 0, dens: 6, dry: 0.3
    });
    brush(x, pth, { col: body, w: w, alpha: 0.45 + r() * 0.45, bristles: 4 + (r() * 3 | 0), seed: (r() * 1e6) | 0, dens: 6, dry: 0.16, spread: 1 });
    brush(x, movePts(pth, -nx * w * 0.36, -ny * w * 0.36), {
      col: o.lit || mix(o.base, '#ffffff', 0.45), w: w * 0.24, alpha: 0.18 + r() * 0.26,
      bristles: 2, seed: (r() * 1e6) | 0, dens: 6, dry: 0.42
    });
  }
  /* Crumpled-tissue creases: the surface signature of the collaged refs. Each
     crease is a valley line with a lit ridge riding one side, so the mass
     reads as skinned in something folded rather than tinted flat. */
  if (o.crease) {
    for (var c = 0; c < o.crease; c++) {
      var ax = bb[0] + r() * bb[2], ay = bb[1] + r() * bb[3];
      var ca = r() * TAU, cl = 12 + r() * Math.min(64, diag * 0.2);
      var seg = 1 + (r() * 2 | 0), cp = [[ax, ay]];
      for (var q2 = 0; q2 < seg; q2++) {
        ca += (r() - 0.5) * 0.7;
        var last = cp[cp.length - 1];
        cp.push([last[0] + Math.cos(ca) * cl / seg, last[1] + Math.sin(ca) * cl / seg]);
      }
      var cn = rnd((r() * 1e6) | 0);
      brush(x, cp, {
        col: o.shade || mix(o.base, '#1A1A1A', 0.42), w: 1.1 + r() * 1.7,
        alpha: 0.05 + r() * 0.1, bristles: 1, taper: 0.8, raw: true,
        seed: (cn() * 1e6) | 0, dens: 4
      });
      brush(x, movePts(cp, 1 + r() * 1.5, -0.9 - r() * 1.5), {
        col: o.lit || mix(o.base, '#ffffff', 0.5), w: 1 + r() * 1.5,
        alpha: 0.05 + r() * 0.1, bristles: 1, taper: 0.8, raw: true,
        seed: (cn() * 1e6) | 0, dens: 4
      });
    }
  }
  if (o.stipple) {
    for (var s = 0; s < o.stipple; s++) {
      var sx2 = bb[0] + r() * bb[2], sy2 = bb[1] + r() * bb[3], rr = 1 + r() * 3.4;
      x.beginPath(); x.arc(sx2, sy2, rr, 0, TAU);
      x.fillStyle = rgba(r() < 0.5 ? (o.lit || '#ffffff') : (o.shade || '#1A1A1A'), 0.1 + r() * 0.3);
      x.fill();
    }
  }
  x.restore();
}

/* ---- watercolour body with a wet edge ---- */
function wash(x, pts, o) {
  o = o || {};
  var col = o.col || '#D13478', r = rnd(o.seed || 21);
  for (var i = 0; i < (o.layers || 5); i++) {
    var k = 1 - i * 0.07;
    x.save();
    x.beginPath(); curve(x, shrinkPts(movePts(pts, (r() - 0.5) * 9, (r() - 0.5) * 9), k), true);
    x.fillStyle = rgba(i === 0 ? mix(col, '#ffffff', 0.35) : col, o.alpha == null ? 0.12 : o.alpha);
    x.fill();
    x.restore();
  }
  if (o.edge !== 0) {
    brush(x, pts, { col: mix(col, '#1A1A1A', 0.25), w: o.edge || 9, alpha: 0.28, bristles: 3, close: true, seed: (o.seed || 21) + 4, dens: 9, dry: 0.35 });
  }
  if (o.bleed) {
    for (var b = 0; b < o.bleed; b++) {
      var p = pts[(r() * pts.length) | 0];
      var a = r() * TAU, L = 12 + r() * 46;
      brush(x, [[p[0], p[1]], [p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L]], {
        col: col, w: 4 + r() * 12, alpha: 0.1 + r() * 0.16, bristles: 2, taper: 0.6, seed: (r() * 1e6) | 0, dens: 5
      });
    }
  }
}

/* ---- drips kept on purpose ---- */
function drip(x, x0, y0, len, w, col, seed) {
  var r = rnd(seed), pts = [[x0, y0]], cx = x0;
  for (var i = 1; i <= 6; i++) {
    cx += (r() - 0.5) * w * 0.5;
    pts.push([cx, y0 + len * i / 6]);
  }
  brush(x, pts, { col: col, w: w, alpha: 0.6, bristles: 2, taper: 0.55, seed: seed, dens: 6, dry: 0.12 });
  var end = pts[6];
  x.beginPath(); x.arc(end[0], end[1], w * 0.6, 0, TAU);
  x.fillStyle = rgba(col, 0.78); x.fill();
  x.beginPath(); x.arc(end[0] - w * 0.18, end[1] - w * 0.2, w * 0.2, 0, TAU);
  x.fillStyle = rgba('#ffffff', 0.22); x.fill();
}

function spatter(x, cx, cy, rad, count, col, seed, size) {
  var r = rnd(seed);
  for (var i = 0; i < count; i++) {
    var a = r() * TAU, d = Math.pow(r(), 0.6) * rad;
    var s = (size || 3) * (0.3 + r() * 1.4);
    x.beginPath();
    x.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, s * (0.6 + r() * 0.8), a, 0, TAU);
    x.fillStyle = rgba(col, 0.2 + r() * 0.6);
    x.fill();
  }
}

/* ---- sgraffito: scratched back into wet paint ---- */
function scratch(x, pts, o) {
  o = o || {};
  brush(x, pts, { col: o.col || '#F5F0E6', w: o.w || 3, alpha: o.alpha == null ? 0.38 : o.alpha, bristles: 1, close: o.close, seed: o.seed || 33, dens: 8, dry: 0.3 });
  brush(x, movePts(pts, 2.2, 2.4), { col: o.dark || '#000000', w: (o.w || 3) * 0.8, alpha: 0.22, bristles: 1, close: o.close, seed: (o.seed || 33) + 1, dens: 8, dry: 0.4 });
}

/* ---- collage: torn paper, optionally printed ---- */
function paperPatch(x, poly, o) {
  o = o || {};
  var seed = o.seed || 17, r = rnd(seed);
  var jag = jagPoly(poly, seed, o.amp == null ? 6 : o.amp, o.step || 20);
  var path = function (c) { curve(c, jag, true); };
  x.save();
  x.beginPath(); curve(x, movePts(jag, 5, 7), true);
  x.fillStyle = rgba(o.shadow || '#1A1A1A', o.shadowA == null ? 0.22 : o.shadowA);
  x.fill();
  x.restore();
  x.save();
  x.beginPath(); path(x); x.clip();
  var bb = o.bb;
  x.fillStyle = o.col || '#f8f1e0';
  x.fillRect(bb[0], bb[1], bb[2], bb[3]);
  for (var i = 0; i < (o.fibre == null ? 60 : o.fibre); i++) {
    var fx = bb[0] + r() * bb[2], fy = bb[1] + r() * bb[3], fa = r() * TAU, fl = 10 + r() * 70;
    brush(x, [[fx, fy], [fx + Math.cos(fa) * fl, fy + Math.sin(fa) * fl]], {
      col: r() < 0.5 ? mix(o.col || '#f8f1e0', '#ffffff', 0.5) : mix(o.col || '#f8f1e0', '#8a7f6f', 0.35),
      w: 2 + r() * 7, alpha: 0.1 + r() * 0.18, bristles: 2, seed: (r() * 1e6) | 0, dens: 4, dry: 0.4
    });
  }
  if (o.print) {
    var lh = o.print.lh || 13;
    for (var y = bb[1] + 6; y < bb[1] + bb[3]; y += lh) {
      if (r() < 0.12) continue;
      var cx = bb[0] + 4 + r() * 12;
      var right = bb[0] + bb[2] - (4 + r() * 40);
      while (cx < right) {
        var wl = 8 + r() * 34;
        x.fillStyle = rgba(o.print.col || '#2B2B2B', 0.16 + r() * 0.2);
        x.fillRect(cx, y, Math.min(wl, right - cx), o.print.h || 3.2);
        cx += wl + 4 + r() * 7;
      }
    }
    if (o.print.figs) {
      for (var f = 0; f < o.print.figs; f++) {
        var gx = bb[0] + r() * bb[2], gy = bb[1] + r() * bb[3];
        x.fillStyle = rgba(o.print.col || '#2B2B2B', 0.1 + r() * 0.12);
        x.fillRect(gx, gy, 30 + r() * 60, 18 + r() * 40);
      }
    }
  }
  if (o.tex) x.drawImage(o.tex.c, o.texDx || 0, o.texDy || 0);
  x.restore();
  if (o.edge !== false) {
    brush(x, jag, {
      col: o.edgeCol || mix(o.col || '#f8f1e0', '#6b6055', 0.5), w: o.edgeW || 4.5,
      alpha: 0.4, bristles: 2, close: true, seed: seed + 3, dens: 8, dry: 0.3
    });
  }
  return jag;
}

/* ---- gold / bronze relief bead: jewellery for ordinary objects ---- */
function bead(x, pts, o) {
  o = o || {};
  var w = o.w || 10, close = !!o.close, sd = o.seed || 41;
  var dry = o.dry == null ? 0.08 : o.dry, a = o.alpha == null ? 1 : o.alpha;
  brush(x, movePts(pts, w * 0.3, w * 0.36), { col: o.dark || '#6b4a12', w: w * 1.05, alpha: 0.75 * a, bristles: 3, close: close, seed: sd + 1, dens: 10, dry: dry });
  brush(x, pts, { col: o.col || '#C9A227', w: w, alpha: 0.95 * a, bristles: 3, close: close, seed: sd, dens: 10, vary: 34, dry: dry + 0.06 });
  brush(x, movePts(pts, -w * 0.22, -w * 0.28), { col: o.light || '#F7E7A8', w: w * 0.36, alpha: 0.65 * a, bristles: 1, close: close, seed: sd + 2, dens: 10, dry: 0.35 + dry });
}

/* ---- reveal: paint the thing on, in stroke order, brushy edge.
   Finished strokes are kept in a mask plate so a frame only ever
   draws the stroke currently under the brush. Deterministic: asking
   for an earlier progress rebuilds from nothing. ---- */
function Reveal(W, H, strokes) {
  this.m = plate(W, H);
  this.k = 0;
  this.strokes = strokes;
}
Reveal.prototype.mask = function (p) {
  var n = this.strokes.length, upto = p * n, done = Math.floor(upto);
  if (done < this.k) { this.m.x.clearRect(0, 0, this.m.w, this.m.h); this.k = 0; }
  while (this.k < done) {
    var s = this.strokes[this.k];
    brush(this.m.x, s.pts, { col: '#ffffff', w: s.w, alpha: 1, solid: true, bristles: 6, thick: 2.5, seed: this.k * 17 + 3, dens: 6, spread: 0.94, close: s.close });
    this.k++;
  }
  return {
    plate: this.m,
    cur: done < n ? this.strokes[done] : null,
    f: upto - done,
    i: done
  };
};

/* ===========================================================
   HAND — a single-stroke alphabet, drawn with the same brush.
   Boxes are 0..1 tall: cap top 0, x-height 0.36, baseline 0.86,
   descender 1.08. Widths in units of size.
   =========================================================== */
var GLY = {
  ' ': { w: 0.34, s: [] },
  a: { w: 0.58, s: [[[.46,.46],[.34,.37],[.14,.44],[.09,.64],[.2,.83],[.38,.8],[.47,.66]], [[.47,.4],[.48,.82]]] },
  b: { w: 0.56, s: [[[.1,.02],[.11,.83]], [[.11,.52],[.26,.39],[.44,.5],[.45,.68],[.3,.84],[.12,.76]]] },
  c: { w: 0.54, s: [[[.47,.45],[.32,.36],[.13,.45],[.1,.65],[.22,.83],[.45,.78]]] },
  d: { w: 0.57, s: [[[.47,.02],[.48,.83]], [[.47,.47],[.32,.36],[.12,.47],[.1,.67],[.24,.84],[.46,.75]]] },
  e: { w: 0.55, s: [[[.1,.62],[.46,.57],[.41,.42],[.24,.36],[.1,.5],[.11,.7],[.27,.84],[.46,.77]]] },
  f: { w: 0.44, s: [[[.44,.07],[.29,.03],[.21,.2],[.22,.86]], [[.06,.4],[.44,.36]]] },
  g: { w: 0.57, s: [[[.46,.46],[.34,.37],[.14,.44],[.09,.64],[.2,.83],[.38,.8],[.47,.66]], [[.47,.4],[.47,.93],[.36,1.07],[.16,1.02]]] },
  h: { w: 0.57, s: [[[.1,.02],[.11,.84]], [[.11,.53],[.27,.38],[.45,.5],[.46,.84]]] },
  i: { w: 0.3, s: [[[.15,.38],[.16,.84]], [[.15,.17],[.16,.21]]] },
  j: { w: 0.36, s: [[[.22,.38],[.23,.93],[.14,1.06],[.03,1.0]], [[.22,.17],[.23,.21]]] },
  k: { w: 0.55, s: [[[.1,.02],[.11,.84]], [[.46,.39],[.12,.65]], [[.22,.57],[.47,.84]]] },
  l: { w: 0.32, s: [[[.14,.02],[.17,.73],[.3,.84]]] },
  m: { w: 0.82, s: [[[.08,.39],[.09,.84]], [[.09,.51],[.22,.38],[.34,.51],[.35,.84]], [[.35,.51],[.49,.38],[.63,.51],[.64,.84]]] },
  n: { w: 0.57, s: [[[.1,.39],[.11,.84]], [[.11,.51],[.26,.37],[.44,.49],[.45,.84]]] },
  o: { w: 0.58, s: [[[.28,.36],[.11,.49],[.1,.7],[.28,.84],[.46,.71],[.46,.49],[.28,.36]]] },
  p: { w: 0.57, s: [[[.1,.38],[.08,1.07]], [[.09,.52],[.25,.37],[.45,.49],[.44,.71],[.26,.83],[.1,.75]]] },
  q: { w: 0.57, s: [[[.45,.46],[.32,.37],[.13,.45],[.1,.65],[.22,.83],[.4,.79]], [[.46,.4],[.46,1.06],[.57,1.1]]] },
  r: { w: 0.46, s: [[[.12,.39],[.13,.84]], [[.13,.55],[.26,.39],[.44,.37]]] },
  s: { w: 0.5, s: [[[.43,.41],[.25,.34],[.13,.43],[.21,.57],[.39,.63],[.43,.75],[.29,.84],[.11,.79]]] },
  t: { w: 0.45, s: [[[.22,.11],[.23,.71],[.32,.83],[.44,.79]], [[.07,.38],[.42,.36]]] },
  u: { w: 0.57, s: [[[.1,.37],[.11,.71],[.24,.84],[.42,.73],[.44,.37]], [[.44,.62],[.45,.84]]] },
  v: { w: 0.54, s: [[[.08,.37],[.26,.84],[.46,.37]]] },
  w: { w: 0.78, s: [[[.06,.37],[.19,.84],[.32,.47],[.44,.84],[.58,.37]]] },
  x: { w: 0.54, s: [[[.08,.37],[.46,.84]], [[.46,.37],[.08,.84]]] },
  y: { w: 0.55, s: [[[.08,.37],[.27,.81]], [[.48,.37],[.32,.87],[.2,1.07],[.06,1.03]]] },
  z: { w: 0.52, s: [[[.08,.39],[.45,.37],[.1,.83],[.47,.81]]] },
  A: { w: 0.62, s: [[[.03,.85],[.27,.03],[.52,.85]], [[.13,.59],[.42,.57]]] },
  B: { w: 0.58, s: [[[.1,.03],[.11,.85]], [[.11,.04],[.35,.09],[.37,.36],[.12,.44]], [[.12,.44],[.42,.52],[.44,.78],[.11,.85]]] },
  C: { w: 0.6, s: [[[.5,.13],[.3,.03],[.11,.21],[.1,.66],[.28,.85],[.52,.78]]] },
  D: { w: 0.62, s: [[[.1,.03],[.11,.85]], [[.11,.04],[.4,.14],[.44,.6],[.32,.84],[.11,.85]]] },
  E: { w: 0.56, s: [[[.46,.05],[.1,.04],[.11,.85],[.48,.83]], [[.11,.44],[.38,.42]]] },
  F: { w: 0.52, s: [[[.1,.85],[.09,.04],[.46,.06]], [[.1,.44],[.36,.42]]] },
  G: { w: 0.64, s: [[[.5,.13],[.3,.03],[.11,.21],[.1,.66],[.3,.85],[.5,.74],[.48,.5],[.32,.5]]] },
  H: { w: 0.6, s: [[[.08,.03],[.09,.85]], [[.46,.03],[.47,.85]], [[.09,.44],[.46,.42]]] },
  I: { w: 0.3, s: [[[.15,.03],[.16,.85]]] },
  J: { w: 0.5, s: [[[.42,.03],[.43,.68],[.3,.85],[.12,.77]]] },
  K: { w: 0.58, s: [[[.1,.03],[.11,.85]], [[.46,.04],[.12,.5]], [[.2,.41],[.5,.85]]] },
  L: { w: 0.52, s: [[[.1,.03],[.11,.84],[.48,.81]]] },
  M: { w: 0.72, s: [[[.06,.85],[.08,.03],[.3,.61],[.52,.03],[.54,.85]]] },
  N: { w: 0.62, s: [[[.08,.85],[.09,.03],[.46,.83],[.47,.04]]] },
  O: { w: 0.64, s: [[[.31,.03],[.11,.25],[.1,.64],[.31,.85],[.51,.64],[.51,.25],[.31,.03]]] },
  P: { w: 0.56, s: [[[.1,.85],[.09,.04],[.38,.11],[.4,.39],[.1,.47]]] },
  Q: { w: 0.66, s: [[[.31,.03],[.11,.25],[.1,.64],[.31,.85],[.51,.64],[.51,.25],[.31,.03]], [[.38,.62],[.56,.92]]] },
  R: { w: 0.58, s: [[[.1,.85],[.09,.04],[.38,.11],[.4,.39],[.1,.47]], [[.16,.47],[.48,.85]]] },
  S: { w: 0.56, s: [[[.48,.13],[.28,.03],[.11,.17],[.19,.41],[.42,.51],[.48,.69],[.3,.85],[.09,.79]]] },
  T: { w: 0.56, s: [[[.03,.05],[.52,.03]], [[.27,.04],[.28,.85]]] },
  U: { w: 0.62, s: [[[.08,.03],[.09,.65],[.28,.85],[.48,.65],[.48,.03]]] },
  V: { w: 0.6, s: [[[.05,.03],[.28,.85],[.52,.03]]] },
  W: { w: 0.82, s: [[[.03,.03],[.17,.85],[.31,.31],[.44,.85],[.6,.03]]] },
  X: { w: 0.58, s: [[[.08,.03],[.48,.85]], [[.48,.03],[.08,.85]]] },
  Y: { w: 0.58, s: [[[.06,.03],[.28,.45],[.5,.03]], [[.28,.45],[.29,.85]]] },
  Z: { w: 0.56, s: [[[.08,.05],[.48,.03],[.1,.83],[.5,.81]]] },
  '0': { w: 0.56, s: [[[.28,.03],[.1,.25],[.1,.64],[.28,.85],[.46,.64],[.46,.25],[.28,.03]]] },
  '1': { w: 0.36, s: [[[.08,.2],[.22,.04],[.23,.85]]] },
  '2': { w: 0.52, s: [[[.09,.18],[.26,.03],[.44,.16],[.36,.42],[.1,.84],[.46,.82]]] },
  '3': { w: 0.52, s: [[[.1,.09],[.3,.03],[.44,.18],[.28,.42],[.46,.58],[.42,.8],[.14,.84]]] },
  '4': { w: 0.54, s: [[[.36,.03],[.07,.6],[.48,.58]], [[.34,.36],[.35,.85]]] },
  '5': { w: 0.52, s: [[[.46,.05],[.13,.04],[.11,.4],[.32,.38],[.46,.56],[.38,.8],[.11,.81]]] },
  '6': { w: 0.54, s: [[[.44,.06],[.2,.16],[.11,.5],[.12,.74],[.32,.85],[.46,.7],[.38,.5],[.14,.52]]] },
  '7': { w: 0.5, s: [[[.06,.05],[.46,.03],[.2,.85]]] },
  '8': { w: 0.54, s: [[[.28,.42],[.12,.3],[.16,.1],[.38,.08],[.42,.3],[.28,.42],[.14,.58],[.16,.79],[.38,.83],[.46,.62],[.28,.42]]] },
  '9': { w: 0.54, s: [[[.44,.44],[.24,.5],[.12,.32],[.2,.1],[.42,.08],[.46,.4],[.36,.85]]] },
  '.': { w: 0.26, s: [[[.1,.82],[.13,.85]]] },
  ',': { w: 0.26, s: [[[.13,.8],[.08,.98]]] },
  '!': { w: 0.26, s: [[[.14,.04],[.12,.62]], [[.11,.8],[.13,.84]]] },
  '?': { w: 0.5, s: [[[.08,.16],[.26,.03],[.42,.16],[.3,.38],[.24,.6]], [[.22,.8],[.24,.84]]] },
  "'": { w: 0.22, s: [[[.12,.04],[.1,.24]]] },
  '-': { w: 0.44, s: [[[.06,.56],[.36,.54]]] },
  ':': { w: 0.24, s: [[[.11,.44],[.13,.47]], [[.11,.76],[.13,.79]]] },
  ';': { w: 0.26, s: [[[.12,.44],[.14,.47]], [[.13,.76],[.08,.94]]] },
  '&': { w: 0.62, s: [[[.48,.85],[.14,.28],[.2,.07],[.38,.1],[.34,.32],[.1,.58],[.14,.8],[.36,.84],[.5,.66]]] },
  '/': { w: 0.44, s: [[[.34,.02],[.06,.86]]] },
  '(': { w: 0.3, s: [[[.24,.02],[.1,.44],[.24,.88]]] },
  ')': { w: 0.3, s: [[[.08,.02],[.22,.44],[.08,.88]]] },
  '"': { w: 0.34, s: [[[.1,.04],[.08,.24]], [[.24,.04],[.22,.24]]] }
};

function textWidth(str, size, tr) {
  var w = 0;
  for (var i = 0; i < str.length; i++) {
    var g = GLY[str[i]] || GLY[' '];
    w += (g.w + (tr == null ? 0.06 : tr)) * size;
  }
  return w;
}

/* handwriting: every stroke gets bristles, wobble and a baseline drift */
function hand(x, str, X, Y, size, o) {
  o = o || {};
  var r = rnd(o.seed == null ? 5 : o.seed);
  var tr = o.track == null ? 0.06 : o.track;
  var cx = X, drift = 0;
  for (var i = 0; i < str.length; i++) {
    var ch = str[i], g = GLY[ch] || GLY[' '];
    drift += (r() - 0.5) * size * 0.035;
    var lean = (o.lean == null ? 0.06 : o.lean) + (r() - 0.5) * 0.05;
    var sc = size * (0.94 + r() * 0.12);
    for (var s = 0; s < g.s.length; s++) {
      var pts = g.s[s].map(function (p) {
        var yy = p[1] * sc;
        return [cx + p[0] * sc + (0.86 - p[1]) * lean * sc + (r() - 0.5) * size * 0.022,
                Y + yy + drift + (r() - 0.5) * size * 0.022];
      });
      brush(x, pts, {
        col: o.col || '#1A1A1A',
        w: (o.w == null ? 0.1 : o.w) * size * (0.8 + r() * 0.5),
        alpha: o.alpha == null ? 0.88 : o.alpha,
        bristles: o.bristles == null ? 2 : o.bristles,
        seed: (r() * 1e6) | 0, dens: 7, dry: o.dry == null ? 0.1 : o.dry,
        taper: o.taper == null ? 0.35 : o.taper, fade: !o.ribbon, vary: 16,
        /* at close-up sizes a lettering stroke has to be one loaded mark; the
           stacked-bristle version reads as hatching once it is 18px wide */
        ribbon: o.ribbon, spread: o.spread
      });
    }
    cx += (g.w + tr) * sc;
  }
  return cx - X;
}
