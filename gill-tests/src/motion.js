/* ===========================================================
   MOTION — the beat sheet layer.

   PAINT decides how a mark sits. This decides when the picture
   is allowed to change, and it is allowed to change hard: shot
   tables with cut times, a camera that jumps rather than glides,
   a lens that opens the cold pole inside the warm one, marks
   that scatter and then snap to a grid, and overlays struck on
   with the same brush as everything else.

   Rule of the file: nothing here fades. Fades are for the two
   scrubs that close a loop. Everything else cuts.
   =========================================================== */

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function ease(p) { p = clamp01(p); return p * p * (3 - 2 * p); }
function easeOut(p) { p = clamp01(p); return 1 - Math.pow(1 - p, 3); }
function easeIn(p) { p = clamp01(p); return p * p * p; }
/* lands past the mark and settles back — a thrown object, not a tween */
function over(p) {
  p = clamp01(p);
  return 1 + Math.pow(p - 1, 3) * (1 + 1.9) + 1.9 * Math.pow(p - 1, 2);
}
function lerp(a, b, p) { return a + (b - a) * p; }
/* two-phase paint boil: the whole square is redrawn on twos */
function boil(t, hz) { return Math.floor(t * (hz || 7.5)) % 2; }
function frameOf(t, hz) { return Math.floor(t * (hz || 12)); }

/* ---- cut tables ----
   keys are [time, value] pairs, ascending. The value in force at u is the
   last one whose time has passed: a hard cut, held until the next. */
function held(u, keys) {
  var v = keys[0][1];
  for (var i = 0; i < keys.length; i++) if (u >= keys[i][0]) v = keys[i][1]; else break;
  return v;
}
/* where we are inside the current held segment, 0..1 */
function heldP(u, keys) {
  var i = 0;
  for (var k = 0; k < keys.length; k++) if (u >= keys[k][0]) i = k; else break;
  var t0 = keys[i][0], t1 = i + 1 < keys.length ? keys[i + 1][0] : t0 + 1;
  return clamp01((u - t0) / Math.max(0.001, t1 - t0));
}
/* alternating 0/1 from t0 at a given cut length: the dual-mode strobe */
function strobe(u, t0, len) { return Math.max(0, Math.floor((u - t0) / len)) % 2; }
/* true for the first `hold` seconds of every `len` window: a punch in */
function punch(u, t0, len, hold) {
  if (u < t0) return false;
  return ((u - t0) % len) < hold;
}

/* ---- camera ----
   A view is {t, x, y, z, r, mode}. mode 'cut' (default) means the camera is
   simply somewhere else on the next frame. 'ease' and 'drift' interpolate
   from the previous key — drift linear, for a slow push on a held shot. */
function camAt(u, keys) {
  var i = 0;
  for (var k = 0; k < keys.length; k++) if (u >= keys[k].t) i = k; else break;
  var a = keys[i], b = keys[i + 1];
  if (!b || (b.mode !== 'ease' && b.mode !== 'drift')) return a;
  var p = clamp01((u - a.t) / Math.max(0.001, b.t - a.t));
  if (b.mode === 'ease') p = ease(p);
  return {
    x: lerp(a.x == null ? 540 : a.x, b.x == null ? 540 : b.x, p),
    y: lerp(a.y == null ? 540 : a.y, b.y == null ? 540 : b.y, p),
    z: lerp(a.z == null ? 1 : a.z, b.z == null ? 1 : b.z, p),
    r: lerp(a.r || 0, b.r || 0, p)
  };
}
function applyCam(X, v, W, H) {
  var x = v.x == null ? W * 0.5 : v.x, y = v.y == null ? H * 0.5 : v.y;
  /* A framed-off camera at zoom 1 walks the plate off its own edge and leaves a
     bare strip of page down one side. Anything not centred gets the zoom it
     needs to stay covered, rotation included. */
  var need = 1 + 2 * Math.max(Math.abs(x - W * 0.5) / W, Math.abs(y - H * 0.5) / H) + (v.r ? Math.abs(v.r) * 1.5 : 0) + 0.006;
  var z = Math.max(v.z == null ? 1 : v.z, need);
  X.translate(W * 0.5, H * 0.5);
  if (v.r) X.rotate(v.r);
  X.scale(z, z);
  X.translate(-x, -y);
}
/* hand-held shudder for the dense passages, deterministic in t */
function shake(u, amp) {
  if (amp <= 0) return [0, 0];
  var f = frameOf(u, 24);
  var a = Math.sin(f * 12.9898) * 43758.5453, b = Math.sin(f * 78.233) * 12345.6789;
  return [(a - Math.floor(a) - 0.5) * 2 * amp, (b - Math.floor(b) - 0.5) * 2 * amp];
}

/* ---- the revealing lens ----
   A wonky circle, sooted on the inside edge and beaded in gold on the
   outside, with the other pole of the picture inside it. */
function lensPath(cx, cy, r, seed) {
  return blobPts(cx, cy, r, r * (0.96 + (seed % 7) * 0.008), seed, 24, 0.022);
}
function lensThrough(X, pts, inner) {
  X.save();
  X.beginPath(); curve(X, pts, true);
  X.clip();
  inner(X);
  X.restore();
}
function lensRim(X, pts, o) {
  o = o || {};
  X.save();
  X.shadowColor = rgba(o.soot || '#1A1A1A', 0.55);
  X.shadowBlur = o.blur == null ? 30 : o.blur;
  X.beginPath(); curve(X, pts, true);
  X.lineWidth = o.w == null ? 18 : o.w;
  X.strokeStyle = rgba(o.soot || '#1A1A1A', 0.5);
  X.stroke();
  X.restore();
  bead(X, pts, { w: o.bw == null ? 9 : o.bw, seed: o.seed || 12, close: true, dry: 0.22, alpha: o.alpha == null ? 1 : o.alpha });
}

/* ---- data overlays ----
   Tally marks, crosshairs, thrown arcs. Struck with the brush, wonky,
   never ruled: a count kept in the margin of a shopping list, not a HUD. */

/* n marks in fives, the fifth thrown across the other four */
function tallyMarks(X, x0, y0, n, f, o) {
  o = o || {};
  var r = rnd(o.seed || 71), col = o.col || '#1A1A1A';
  var h = o.h == null ? 44 : o.h, gap = o.gap == null ? 17 : o.gap, cl = o.cluster == null ? 128 : o.cluster;
  var shown = f * n;
  for (var i = 0; i < n; i++) {
    var app = clamp01((shown - i) * 3.2);
    var grp = (i / 5) | 0, k = i % 5;
    var bx = x0 + grp * cl + k * gap + (r() - 0.5) * 6;
    var by = y0 + (r() - 0.5) * 9 + grp * (r() - 0.5) * 12;
    var lean = (r() - 0.5) * 0.3;
    var pts = k === 4
      ? [[bx - gap * 4.4, by + h * 0.82], [bx + gap * 0.5, by - h * 0.1]]
      : [[bx + lean * h, by], [bx, by + h * (0.9 + r() * 0.2)]];
    if (app <= 0) { r(); continue; }
    brush(X, partial(pts, app), {
      col: col, w: o.w || 7, alpha: (o.alpha == null ? 0.85 : o.alpha) * Math.min(1, app * 2),
      bristles: 2, seed: (r() * 1e6) | 0, dens: 5, taper: 0.5, fade: true
    });
  }
}

/* two ticks that stop short of the middle, and a ring drawn in two goes */
function crosshair(X, cx, cy, rad, f, o) {
  o = o || {};
  var r = rnd(o.seed || 33), col = o.col || '#C9A227';
  var g = rad * 0.28;
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d, i) {
    var app = clamp01(f * 2.4 - i * 0.1);
    if (app <= 0) { r(); r(); return; }
    var L = rad * (0.72 + r() * 0.4);
    brush(X, partial([[cx + d[0] * g, cy + d[1] * g], [cx + d[0] * L, cy + d[1] * L]], app), {
      col: col, w: o.w || 5, alpha: (o.alpha == null ? 0.8 : o.alpha), bristles: 1,
      seed: (r() * 1e6) | 0, dens: 4, taper: 0.55
    });
  });
  var ap = clamp01(f * 1.6 - 0.35);
  if (ap > 0) {
    for (var s = 0; s < 2; s++) {
      var a0 = s * Math.PI + 0.4 + (r() - 0.5) * 0.5, sp = (1.9 + r() * 0.7) * ap, pts = [];
      for (var q = 0; q <= 7; q++) {
        var a = a0 + sp * q / 7, rr = rad * (0.86 + (r() - 0.5) * 0.1);
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.97]);
      }
      brush(X, pts, {
        col: col, w: (o.w || 5) * 0.8, alpha: (o.alpha == null ? 0.7 : o.alpha * 0.8),
        bristles: 1, seed: (r() * 1e6) | 0, dens: 6, taper: 0.6, dry: 0.2
      });
    }
  }
}

/* a thrown arc from a to b, drawn as far as f, with a bead at the head */
function arcThrow(X, ax, ay, bx, by, bend, f, o) {
  o = o || {};
  if (f <= 0) return;
  var mx = (ax + bx) / 2, my = (ay + by) / 2;
  var dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
  var pts = [[ax, ay], [mx - dy / L * L * bend, my + dx / L * L * bend], [bx, by]];
  var sm = crSample(pts, 14, false);
  var n = Math.max(2, Math.round(sm.length * clamp01(f)));
  var seg = sm.slice(0, n);
  brush(X, seg, {
    col: o.col || '#C9A227', w: o.w || 5, alpha: o.alpha == null ? 0.75 : o.alpha,
    bristles: o.bristles == null ? 2 : o.bristles, seed: o.seed || 5, raw: true,
    dens: 6, taper: 0.6, dry: o.dry == null ? 0.18 : o.dry, vary: 18
  });
  var hd = seg[seg.length - 1];
  if (o.head !== false) {
    X.beginPath(); X.arc(hd[0], hd[1], (o.w || 5) * 0.9, 0, TAU);
    X.fillStyle = rgba(o.headCol || o.col || '#F7E7A8', (o.alpha == null ? 0.8 : o.alpha));
    X.fill();
  }
  return hd;
}

/* broken concentric arcs going out: a whistle, a ring on water, a pressure low */
function ringsOut(X, cx, cy, r0, r1, n, f, o) {
  o = o || {};
  var r = rnd(o.seed || 91);
  for (var i = 0; i < n; i++) {
    var ph = clamp01(f * 1.5 - i * 0.18);
    if (ph <= 0) { r(); r(); continue; }
    var rad = lerp(r0, r1, i / Math.max(1, n - 1)) * (0.9 + ph * 0.25);
    var a0 = r() * TAU, sp = 1.5 + r() * 3.1, pts = [];
    for (var q = 0; q <= 9; q++) {
      var a = a0 + sp * q / 9;
      pts.push([cx + Math.cos(a) * rad * (0.94 + (r() - 0.5) * 0.12),
                cy + Math.sin(a) * rad * (o.flat == null ? 0.96 : o.flat) * (0.94 + (r() - 0.5) * 0.12)]);
    }
    brush(X, pts, {
      col: o.col || '#C9A227', w: (o.w || 6) * (1 - i / (n + 2)), alpha: (o.alpha == null ? 0.55 : o.alpha) * (1 - i / (n + 1.2)) * ph,
      bristles: 1, seed: (r() * 1e6) | 0, dens: 7, taper: 0.6, dry: 0.25
    });
  }
}

/* ---- organic branching ----
   One mark splits, and its children split. Built once as a list of segments
   with their own in-times so the growth is deterministic and cheap. */
function makeBranch(o) {
  var r = rnd(o.seed || 7), segs = [], leaves = [];
  function grow(x, y, ang, len, depth, t0) {
    var n = 3 + (r() * 2 | 0), pts = [[x, y]], cx = x, cy = y, ca = ang;
    for (var i = 0; i < n; i++) {
      ca += (r() - 0.5) * (o.wobble == null ? 0.5 : o.wobble);
      cx += Math.cos(ca) * len / n; cy += Math.sin(ca) * len / n;
      pts.push([cx, cy]);
    }
    var t1 = t0 + (o.step == null ? 0.26 : o.step);
    segs.push({ pts: pts, t0: t0, t1: t1, d: depth, w: (o.w || 10) * Math.pow(0.68, depth) });
    if (depth >= (o.depth == null ? 3 : o.depth)) { leaves.push([cx, cy]); return; }
    var kids = 2 + (r() < (o.trip == null ? 0.3 : o.trip) ? 1 : 0);
    for (var k = 0; k < kids; k++) {
      var spread = (o.spread == null ? 0.7 : o.spread);
      grow(cx, cy, ca + (k - (kids - 1) / 2) * spread + (r() - 0.5) * 0.3,
        len * (o.shrink == null ? 0.66 : o.shrink) * (0.8 + r() * 0.4), depth + 1, t1 - 0.05);
    }
  }
  grow(o.x, o.y, o.ang == null ? -Math.PI / 2 : o.ang, o.len == null ? 250 : o.len, 0, 0);
  var span = 0;
  segs.forEach(function (s) { span = Math.max(span, s.t1); });
  segs.forEach(function (s) { s.t0 /= span; s.t1 /= span; });
  return { segs: segs, leaves: leaves };
}
function drawBranch(X, tree, f, o) {
  o = o || {};
  tree.segs.forEach(function (s, i) {
    var p = clamp01((f - s.t0) / Math.max(0.001, s.t1 - s.t0));
    if (p <= 0) return;
    brush(X, partial(s.pts, p), {
      col: o.cols ? o.cols[s.d % o.cols.length] : (o.col || '#1A1A1A'),
      w: s.w, alpha: o.alpha == null ? 0.85 : o.alpha, bristles: o.bristles == null ? 2 : o.bristles,
      seed: (o.seed || 3) + i * 13, dens: 6, taper: o.taper == null ? 0.5 : o.taper,
      dry: o.dry == null ? 0.14 : o.dry, vary: 16, fade: true
    });
  });
}

/* ---- chaos and the grid it snaps to ---- */
function chaosAt(i, seed, u, cx, cy, spread) {
  var r = rnd(seed + i * 977);
  var a = r() * TAU, d = (0.35 + r() * 0.65) * spread;
  var sp1 = 1.1 + r() * 2.6, sp2 = 0.7 + r() * 1.9;
  return [
    cx + Math.cos(a) * d + Math.sin(u * sp1 + i) * 26,
    cy + Math.sin(a) * d * 0.92 + Math.cos(u * sp2 + i * 1.7) * 22,
    (r() - 0.5) * 1.5 + Math.sin(u * sp2 + i) * 0.14,
    0.62 + r() * 0.5
  ];
}
function gridAt(i, cols, cx, cy, dx, dy, n) {
  var rows = Math.ceil(n / cols);
  var col = i % cols, row = (i / cols) | 0;
  var last = n - (rows - 1) * cols;
  var wide = row === rows - 1 && last < cols ? (cols - last) * dx * 0.5 : 0;
  return [
    cx + (col - (cols - 1) / 2) * dx + wide,
    cy + (row - (rows - 1) / 2) * dy,
    0, 1
  ];
}

/* ---- full-frame beats ---- */
function flash(X, col, a, W, H) {
  X.save();
  X.globalCompositeOperation = 'lighter';
  X.globalAlpha = a;
  X.fillStyle = col;
  X.fillRect(0, 0, W, H);
  X.restore();
}
function slam(X, col, a, W, H) {
  X.save(); X.globalAlpha = a; X.fillStyle = col; X.fillRect(0, 0, W, H); X.restore();
}

/* ---- paint a form on behind a brushed mask (used for the closing scrubs) ---- */
function paintOn(dst, sprite, rev, p, tmp, W, H) {
  if (p <= 0) return;
  if (p >= 1) { dst.drawImage(sprite.c, 0, 0); return; }
  var m = rev.mask(p), sx = tmp.x;
  sx.clearRect(0, 0, W, H);
  sx.drawImage(m.plate.c, 0, 0);
  if (m.cur) {
    brush(sx, partial(m.cur.pts, m.f), { col: '#ffffff', w: m.cur.w, alpha: 1, solid: true, bristles: 6, thick: 2.5, seed: m.i * 17 + 3, dens: 6, raw: true, spread: 0.94 });
  }
  sx.globalCompositeOperation = 'source-in';
  sx.drawImage(sprite.c, 0, 0);
  sx.globalCompositeOperation = 'source-over';
  dst.drawImage(tmp.c, 0, 0);
  return m;
}

/* ---- macro plates ----
   A close-up is painted, not zoomed: the same painter run at scale into its
   own plate, so the bristles and the tooth are the size they would be if she
   had worked that detail at full size. */
function macroPlate(W, H, o, fn) {
  var p = plate(W, H);
  p.x.save();
  p.x.translate(o.tx == null ? W * 0.5 : o.tx, o.ty == null ? H * 0.5 : o.ty);
  p.x.scale(o.s, o.s);
  if (o.r) p.x.rotate(o.r);
  p.x.translate(-(o.cx == null ? W * 0.5 : o.cx), -(o.cy == null ? H * 0.5 : o.cy));
  fn(p.x);
  p.x.restore();
  return p;
}

/* ---- the mark, lowercase, tucked in ---- */
function opusMark(X, x, y, size, col, a) {
  hand(X, 'opus 5', x, y, size || 26, {
    col: col || '#C9A227', seed: 9091, w: 0.085, bristles: 1,
    alpha: a == null ? 0.5 : a, dry: 0.2, taper: 0.4
  });
}
