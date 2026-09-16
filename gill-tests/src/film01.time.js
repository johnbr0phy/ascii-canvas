
  /* ===========================================================
     01 — A SHOPPING LIST, MOSTLY KEPT
     Beat sheet, not a slideshow. Cut times are in T and nothing
     between them drifts for longer than a breath.

     Mode A  worked grey-cream canvas, torn list, pencil and biro
     Mode B  scorched kitchen dark, the same words relit in gold,
             the same seven things up as objects

     Positions never move across a mode cut: the list sits at LX
     and the objects sit at their sky coordinates in both poles,
     so every snap is a match-cut.
     =========================================================== */
  var T = {
    open: 0.00,
    hb: [[0.45, 'B'], [0.60, 'A'], [0.72, 'B'], [0.88, 'A']],
    cross: 1.10,
    macroWord: 1.35, branch: 1.62, irisFlash: 2.20, irisOut: 2.31,
    wide: 2.35, traj: 2.35,
    lens: 2.70, montage: 3.15, montageEnd: 3.55, burst: 3.75,
    chaos: 3.80, grid: 4.90, brk: 5.45, cons: 5.67,
    mcA: 6.95, mcB: 7.10,
    macroB: 7.25, meteor: 7.42, macroA: 8.25,
    strike: 8.40,
    strikeCuts: [
      [8.40, 'B', 1.00, 540, 540], [8.58, 'A', 1.00, 540, 540],
      [8.74, 'B', 1.50, 688, 372], [8.88, 'A', 1.50, 688, 372],
      [9.02, 'B', 1.00, 540, 540], [9.18, 'A', 1.45, 700, 700],
      [9.34, 'B', 1.45, 700, 700], [9.48, 'B', 1.00, 540, 540]
    ],
    breathe: 9.75, aside: 10.05, mark: 10.90,
    scrub: 11.60, home: 12.90
  };

  var CAM = [
    { t: 0.00, x: 540, y: 540, z: 1.00 },
    { t: 1.00, x: 528, y: 512, z: 1.045, mode: 'drift' },
    { t: 1.35, x: 540, y: 540, z: 1.00 },
    { t: 2.35, x: 556, y: 566, z: 1.075, mode: 'drift' },
    { t: 2.70, x: 540, y: 540, z: 1.00 },
    { t: 3.75, x: 540, y: 540, z: 1.02, mode: 'drift' },
    { t: 3.80, x: 540, y: 528, z: 1.06 },
    { t: 4.90, x: 540, y: 520, z: 1.07 },
    { t: 5.45, x: 540, y: 520, z: 1.07 },
    { t: 5.67, x: 540, y: 540, z: 1.00 },
    { t: 6.95, x: 540, y: 540, z: 1.00 },
    { t: 7.25, x: 540, y: 540, z: 1.00 },
    { t: 8.25, x: 552, y: 566, z: 1.08, mode: 'drift' },
    { t: 8.40, x: 540, y: 540, z: 1.00 },
    { t: 9.75, x: 540, y: 540, z: 1.05 },
    { t: 11.60, x: 540, y: 540, z: 1.00, mode: 'drift' },
    { t: 12.90, x: 540, y: 540, z: 1.00 },
    { t: 14.00, x: 540, y: 540, z: 1.00, mode: 'drift' }
  ];

  /* ---------------- plates the beats need ---------------- */

  /* the whole warm pole flattened, so the closing scrub can bring the
     ground, the paper and the writing back in one pass of the rag */
  var plateA = [0, 1].map(function (bj) {
    var p = plate(W, H);
    p.x.drawImage(gCanvas.c, 0, 0);
    p.x.drawImage(scrapBody.c, 0, 0);
    p.x.drawImage(scrapInk[bj].c, 0, 0);
    return p;
  });

  /* heat bloomed into the ground behind a form: scumble, not a sunburst */
  function heatBloom(x, cx, cy, f, s) {
    if (f <= 0) return;
    var hr = rnd(901), g = x.createRadialGradient(cx, cy, 30, cx, cy, 400 * f * s);
    g.addColorStop(0, rgba(P.goldLt, 0.4 * f));
    g.addColorStop(0.4, rgba(P.amber, 0.2 * f));
    g.addColorStop(1, rgba(P.cad, 0));
    x.fillStyle = g;
    x.fillRect(cx - 440 * s, cy - 440 * s, 880 * s, 880 * s);
    for (var q = 0; q < 26; q++) {
      var qa = hr() * TAU, r0 = (150 + hr() * 130) * s;
      var hx2 = cx + Math.cos(qa) * r0, hy2 = cy + Math.sin(qa) * r0 * 0.9;
      var hrad = (34 + hr() * 78) * s;
      x.save();
      x.globalAlpha = (0.05 + hr() * 0.13) * f;
      x.globalCompositeOperation = 'lighter';
      var hg = x.createRadialGradient(hx2, hy2, 0, hx2, hy2, hrad);
      hg.addColorStop(0, rgba(hr() < 0.45 ? P.amber : P.cad, 0.8));
      hg.addColorStop(1, rgba(P.cad, 0));
      x.fillStyle = hg;
      x.fillRect(hx2 - hrad, hy2 - hrad, hrad * 2, hrad * 2);
      x.restore();
    }
    for (var q2 = 0; q2 < 9; q2++) {
      var sa = hr() * TAU, sr = (165 + hr() * 60) * s;
      spatter(x, cx + Math.cos(sa) * sr, cy + Math.sin(sa) * sr,
        (22 + hr() * 30) * s, 5, hr() < 0.5 ? P.goldLt : P.amber, (hr() * 1e6) | 0, 2.2 * s);
    }
  }

  /* --- the macro pair: one word, painted at the size it would be if she had
     given a whole square to it. Painted, not zoomed: the letters are drawn at
     190 and the paper fibre at its own scale, so the close-up has more surface
     than the wide shot rather than less. --- */
  function macroPaper(x) {
    x.fillStyle = P.paper; x.fillRect(0, 0, W, H);
    var r = rnd(313);
    for (var i = 0; i < 90; i++) {
      var fx = r() * W, fy = r() * H, fa = r() * TAU, fl = 40 + r() * 260;
      brush(x, [[fx, fy], [fx + Math.cos(fa) * fl, fy + Math.sin(fa) * fl]], {
        col: r() < 0.5 ? '#fffaf0' : mix(P.paper, '#9a8c72', 0.4),
        w: 10 + r() * 46, alpha: 0.05 + r() * 0.1, bristles: 3, seed: (r() * 1e6) | 0, dens: 5, dry: 0.3
      });
    }
    [[[-40, 300], [420, 264], [760, 322], [1120, 288]], [[642, -40], [668, 420], [640, 800], [664, 1120]]]
      .forEach(function (cr, ci) {
        brush(x, cr, { col: '#8a8074', w: 34, alpha: 0.14, bristles: 4, seed: 771 + ci, dens: 7, dry: 0.32 });
        brush(x, movePts(cr, -9, -10), { col: '#ffffff', w: 22, alpha: 0.3, bristles: 3, seed: 781 + ci, dens: 7, dry: 0.3 });
      });
    wash(x, blobPts(940, 940, 240, 210, 44, 13, 0.2), { col: '#8B5A2B', seed: 31, layers: 3, alpha: 0.05, edge: 0, bleed: 8 });
    /* the craze blown up with the shot: at native scale the creases read as
       hair on a close-up, which is the tell that a wide shot has been zoomed */
    x.save();
    x.globalAlpha = 0.34;
    x.drawImage(craze.c, -260, -180, W * 2.4, H * 2.4);
    x.restore();
  }
  var MW = 'tomatoes', MWSZ = 176, MWX = 96, MWY = 470;
  var macroWordA = (function () {
    var p = plate(W, H), x = p.x;
    macroPaper(x);
    /* the words either side, cropped hard by the frame: what tells you this is
       a close-up of the same list and not a second, tidier list */
    hand(x, 'eggs', MWX + 40, 96, MWSZ, { col: P.pencil, seed: 611, w: 0.1, bristles: 2, alpha: 0.5, dry: 0.05, ribbon: true });
    hand(x, 'bread', MWX + 10, 1006, MWSZ, { col: P.pencil, seed: 612, w: 0.1, bristles: 2, alpha: 0.62, dry: 0.05, ribbon: true });
    hand(x, MW, MWX, MWY, MWSZ, { col: P.pencil, seed: 613, w: 0.1, bristles: 2, alpha: 0.95, dry: 0.04, ribbon: true, spread: 0.4 });
    /* graphite has a lit side where the lead skidded; without it a stroke this
       wide is a flat bar */
    hand(x, MW, MWX - 3, MWY - 4, MWSZ, { col: mix(P.pencil, '#ffffff', 0.35), seed: 613, w: 0.03, bristles: 1, alpha: 0.4, dry: 0.4 });
    brush(x, [[MWX - 30, MWY + 208], [MWX + 420, MWY + 176], [MWX + 812, MWY + 214]], {
      col: P.cad, w: 24, alpha: 0.9, bristles: 2, seed: 614, dens: 8, taper: 0.5, ribbon: true, vary: 20, spread: 0.3
    });
    return p;
  })();
  var macroWordB = (function () {
    var p = plate(W, H), x = p.x;
    ground(x, W, H, {
      base: P.scorch, seed: 188, tints: [P.soot, P.ember, '#241713', '#070505'],
      mottle: 70, sweeps: 34, scrape: 22, drift: 14, dark: '#000000', light: '#8a5a32', vignette: 0.46
    });
    textureThrough(x, craze, function (c) { c.rect(0, 0, W, H); }, 0.6, -20, -40);
    hand(x, 'eggs', MWX + 44, 99, MWSZ, { col: P.goldDk, seed: 621, w: 0.1, bristles: 2, alpha: 0.55, dry: 0.05, ribbon: true });
    hand(x, 'bread', MWX + 14, 1009, MWSZ, { col: P.goldDk, seed: 622, w: 0.1, bristles: 2, alpha: 0.65, dry: 0.05, ribbon: true });
    hand(x, MW, MWX + 5, MWY + 5, MWSZ, { col: P.goldDk, seed: 623, w: 0.105, bristles: 2, alpha: 0.9, dry: 0.04, ribbon: true });
    hand(x, MW, MWX, MWY, MWSZ, { col: P.gold, seed: 624, w: 0.075, bristles: 2, alpha: 0.95, dry: 0.04, ribbon: true, spread: 0.3 });
    hand(x, MW, MWX - 5, MWY - 6, MWSZ, { col: P.goldLt, seed: 625, w: 0.028, bristles: 1, alpha: 0.55, dry: 0.35 });
    brush(x, [[MWX - 30, MWY + 208], [MWX + 420, MWY + 176], [MWX + 812, MWY + 214]], {
      col: P.amber, w: 22, alpha: 0.85, bristles: 2, seed: 626, dens: 8, taper: 0.5, ribbon: true, vary: 24, spread: 0.3
    });
    return p;
  })();

  /* --- and the macro pair for the thing she crossed off. The bite is taken out
     with destination-out, so the form has to be painted in its own transparent
     plate first or the bite goes straight through the ground behind it. --- */
  var BC = [528, 556, 388, 366];
  var biscBig = (function () {
    var body = plate(W, H), x = body.x, cx = BC[0], cy = BC[1], RX = BC[2], RY = BC[3];
    var pts = blobPts(cx, cy, RX, RY, 4141, 20, 0.045);
    var pf = function (k) { curve(k, pts, true); };
    /* Painted at the size it is shown, not the sprite scaled up. The knife
       count and stipple ride the area, so a close-up has more surface than the
       wide shot: blown up, the sprite had less, which is the zoom tell. */
    impasto(x, pf, {
      base: '#dfae55', cols: ['#dfae55', '#c98f31', '#e8c574', '#b3762a', '#f2d68e', '#a96a22'],
      bb: [cx - RX - 30, cy - RY - 30, RX * 2 + 60, RY * 2 + 60],
      seed: 4142, n: 74, kw: 74, angle: 0.9, spreadA: 1.4, stipple: 900, crease: 150,
      lit: '#fff0bc', shade: '#5e3a0c', drift: 30
    });
    textureThrough(x, craze, pf, 0.34, -140, -220);
    /* crumb: the whole point of a close-up of a biscuit */
    var r = rnd(4143);
    x.save(); pf(x); x.beginPath(); pf(x); x.clip();
    for (var g = 0; g < 620; g++) {
      var ga = r() * TAU, gd = Math.sqrt(r()) * RX * 0.99;
      var gx = cx + Math.cos(ga) * gd, gy = cy + Math.sin(ga) * gd * (RY / RX);
      var gr = 2 + r() * 11;
      x.beginPath(); x.arc(gx, gy, gr, 0, TAU);
      x.fillStyle = rgba(r() < 0.5 ? '#8f5c14' : '#ffe9a8', 0.1 + r() * 0.3); x.fill();
    }
    for (var s2 = 0; s2 < 40; s2++) {
      var sa = r() * TAU, sd2 = Math.sqrt(r()) * RX * 0.9;
      var sx2 = cx + Math.cos(sa) * sd2, sy2 = cy + Math.sin(sa) * sd2 * 0.94, sl = 30 + r() * 130, sang = 0.9 + (r() - 0.5) * 1.4;
      brush(x, [[sx2, sy2], [sx2 + Math.cos(sang) * sl, sy2 + Math.sin(sang) * sl]], {
        col: r() < 0.5 ? '#7a4a0c' : '#ffeeb4', w: 8 + r() * 22, alpha: 0.1 + r() * 0.16,
        bristles: 3, seed: (r() * 1e6) | 0, dens: 6, dry: 0.34, taper: 0.6
      });
    }
    x.restore();
    contour(x, pts, { col: '#33230b', w: 17, seed: 4144, arc: 0.5, vary: 18 });
    /* docker holes, deep enough at this size to have a wall and a floor */
    for (var i = 0; i < 15; i++) {
      var a = r() * TAU, d = 60 + r() * 224;
      var hx = cx + Math.cos(a) * d, hy = cy + Math.sin(a) * d * 0.94, hr = 15 + r() * 15;
      x.save();
      x.beginPath(); x.ellipse(hx, hy, hr * (0.85 + r() * 0.4), hr * (0.8 + r() * 0.4), r() * TAU, 0, TAU);
      x.fillStyle = rgba('#4a2e08', 0.5 + r() * 0.24); x.fill();
      x.beginPath(); x.arc(hx - hr * 0.34, hy - hr * 0.38, hr * 0.52, 0, TAU);
      x.fillStyle = rgba('#fff0c0', 0.22 + r() * 0.2); x.fill();
      x.restore();
    }
    /* the bite, taken out of the top-left, its wall lit from inside the crumb */
    var bite = blobPts(cx - 322, cy - 224, 154, 138, 4148, 11, 0.22);
    x.save(); x.globalCompositeOperation = 'destination-out';
    x.beginPath(); curve(x, bite, true); x.fill();
    x.restore();
    x.save();
    x.beginPath(); pf(x); x.clip();
    contour(x, bite, { col: '#33230b', w: 16, seed: 4149, arc: 0.5, vary: 18, goes: 2 });
    brush(x, shrinkPts(bite, 1.13), { col: '#ffe9a8', w: 26, alpha: 0.24, bristles: 4, close: true, seed: 4150, dens: 7, dry: 0.4 });
    x.restore();
    /* The shade goes under the bitten silhouette, not under the path it was cut
       from: an envelope halo drawn first left a grey crescent hanging in the
       bite where the paint had been lifted away from over it. */
    var p = plate(W, H);
    p.x.save();
    p.x.shadowColor = rgba('#6b5326', 0.42); p.x.shadowBlur = 48;
    p.x.shadowOffsetX = 16; p.x.shadowOffsetY = 24;
    p.x.drawImage(body.c, 0, 0);
    p.x.restore();
    p.x.drawImage(body.c, 0, 0);
    return p;
  })();
  var macroBiscB = (function () {
    var p = plate(W, H), x = p.x;
    ground(x, W, H, {
      base: P.scorch, seed: 288, tints: [P.soot, P.ember, '#2a1a12', '#070505'],
      mottle: 76, sweeps: 36, scrape: 24, drift: 14, dark: '#000000', light: '#8a5a32', vignette: 0.44
    });
    x.save(); x.globalAlpha = 0.5; x.drawImage(craze.c, -180, -120, W * 2.2, H * 2.2); x.restore();
    heatBloom(x, 528, 556, 1, 2.2);
    x.drawImage(biscBig.c, 0, 0);
    /* relit, not recoloured: gold dragged along the top of the crumb only, so
       the dark pole is the same biscuit under a different light */
    var rl = rnd(4321);
    x.save();
    x.beginPath(); curve(x, blobPts(528, 556, 388, 366, 4141, 20, 0.045), true); x.clip();
    x.globalCompositeOperation = 'overlay';
    for (var g2 = 0; g2 < 34; g2++) {
      var ga2 = rl() * TAU, gd2 = Math.sqrt(rl()) * 380;
      var gx2 = 528 + Math.cos(ga2) * gd2, gy2 = 556 + Math.sin(ga2) * gd2 * 0.94;
      brush(x, [[gx2, gy2], [gx2 + 60 + rl() * 150, gy2 + (rl() - 0.5) * 80]], {
        col: rl() < 0.5 ? P.gold : P.amber, w: 16 + rl() * 40, alpha: 0.12 + rl() * 0.2,
        bristles: 4, seed: (rl() * 1e6) | 0, dens: 6, dry: 0.36, taper: 0.7
      });
    }
    x.restore();
    spatter(x, 528, 556, 520, 200, P.goldDk, 771, 2.6);
    return p;
  })();
  var macroBiscA = (function () {
    var p = plate(W, H), x = p.x;
    macroPaper(x);
    x.drawImage(biscBig.c, 0, 0);
    /* still crossed off, in the same biro, at the same angle as on the list */
    brush(x, [[110, 700], [520, 520], [960, 636]], {
      col: P.verm, w: 26, alpha: 0.85, bristles: 2, seed: 881, dens: 8, taper: 0.5, ribbon: true, vary: 20, spread: 0.3
    });
    brush(x, [[150, 480], [560, 660], [940, 470]], {
      col: P.verm, w: 20, alpha: 0.7, bristles: 2, seed: 882, dens: 8, taper: 0.5, ribbon: true, vary: 20, spread: 0.3
    });
    return p;
  })();

  /* --- the branch: the biro underline gives up being a line and becomes a
     family of paths, which is how the list stops being an errand --- */
  var TREE = makeBranch({
    x: MWX + 800, y: MWY + 212, ang: -2.0, len: 300, depth: 3, seed: 515,
    spread: 0.78, shrink: 0.62, w: 22, wobble: 0.42, step: 0.3
  });

  /* --- trajectories: seven arcs off the ends of the seven words, thrown at
     where each thing is about to be. Drawn in biro, gone in a second. --- */
  var TRAJ = ITEMS.map(function (it, i) {
    return {
      ax: LX + textWidth(it.w, LSZ) + 26, ay: it.ly + 18,
      bx: it.sx, by: it.sy, bend: (i % 2 ? 0.2 : -0.22) * (0.7 + (i % 3) * 0.3), seed: 4400 + i * 31
    };
  });

  /* ---------------- the two poles ---------------- */
  function drawA(u, o) {
    o = o || {};
    X.drawImage(gCanvas.c, 0, 0);
    X.drawImage(scrapBody.c, 0, 0);
    X.drawImage(scrapInk[boil(u)].c, 0, 0);
    if (o.objects) objects(u, o.objects, true);
  }

  function drawB(u, o) {
    o = o || {};
    X.drawImage(gSlate.c, 0, 0);
    if (o.words !== false) X.drawImage(slateWords.c, 0, 0);
    if (o.stars) stars(u, o.stars);
    if (o.heat) heatBloom(X, ITEMS[6].sx, ITEMS[6].sy, o.heat * (0.9 + 0.1 * Math.sin(u * 4.2)), 1);
    if (o.objects) objects(u, o.objects, false);
  }

  function stars(u, f) {
    STARS.forEach(function (s, i) {
      var a = clamp01(f * STARS.length * 0.8 - i * 0.6);
      if (a <= 0) return;
      var tw = Math.sin(u * 1.7 + i * 2.3) * 0.5 + 0.5;
      star(X, s[0], s[1], s[2] * a * (0.86 + 0.14 * tw), 600 + i, a * (0.5 + 0.5 * tw));
    });
  }

  /* one placement function for every phase, so a form never jumps between
     two different drawing routines — only its coordinates change */
  function objects(u, place, warm, aMul) {
    var order = ITEMS.map(function (it, i) { return i; })
      .sort(function (a, b) { return ITEMS[a].z - ITEMS[b].z; });
    order.forEach(function (i) {
      var pos = place(i, ITEMS[i], u);
      if (!pos || pos[4] <= 0) return;
      if (aMul != null) pos = [pos[0], pos[1], pos[2], pos[3], pos[4] * aMul];
      var bj = boil(u + i * 0.13);
      X.save();
      X.translate(pos[0] + (bj ? 1.3 : -1.2), pos[1] + (bj ? -1.5 : 1.1));
      X.rotate(pos[2] + (bj ? 0.004 : -0.004));
      X.scale(pos[3], pos[3]);
      X.globalAlpha = pos[4];
      if (warm) {
        /* on the cream the same sprite needs shade under it or it floats, which
           is the sticker complaint in another form */
        X.save();
        X.shadowColor = rgba('#6b5f52', pos[4] * 0.3);
        X.shadowBlur = 36; X.shadowOffsetX = 9; X.shadowOffsetY = 15;
        X.drawImage(SPR[i].c, -SPC, -SPC);
        X.restore();
      }
      X.drawImage(SPR[i].c, -SPC, -SPC);
      X.restore();
    });
    X.globalAlpha = 1;
  }

  function skyPlace(i, it) { return [it.sx, it.sy, 0, it.s, 1]; }

  function strikeIndex(u) {
    var i = 0;
    for (var k = 0; k < T.strikeCuts.length; k++) if (u >= T.strikeCuts[k][0]) i = k; else break;
    return i;
  }

  /* ---------------- the fourteen seconds ---------------- */
  function draw(t) {
    var u = ((t % DUR) + DUR) % DUR, bj = boil(u);
    var v = camAt(u, CAM);
    /* in the strike the camera is part of the cut: mode and framing change on
       the same frame, which is what stops eight cuts reading as one shot */
    if (u >= T.strike && u < T.breathe) {
      var sc = T.strikeCuts[strikeIndex(u)];
      v = { x: sc[3], y: sc[4], z: sc[2] };
    }
    var sh = shake(u, u >= T.chaos && u < T.grid ? 5 : (u >= T.strike && u < T.breathe ? 3 : 0));
    X.setTransform(1, 0, 0, 1, 0, 0);
    X.clearRect(0, 0, W, H);
    X.save();
    X.translate((bj ? 0.8 : -0.7) + sh[0], (bj ? -0.6 : 0.9) + sh[1]);
    applyCam(X, v, W, H);

    if (u < T.macroWord) {
      /* --- breathe, then the heartbeat: three snaps to the dark pole and back,
         the words never moving --- */
      var m = held(u, [[0, 'A']].concat(T.hb));
      if (m === 'A') {
        drawA(u);
        if (u >= T.cross) {
          /* she goes over the crossing-out again, live, harder */
          var cp = clamp01((u - T.cross) / 0.14);
          var by = ITEMS[6].ly + 30, bw = textWidth('biscuits', LSZ);
          brush(X, partial([[LX - 26, by + 16], [LX + bw * 0.5, by - 16], [LX + bw + 22, by + 8]], cp), {
            col: P.verm, w: 15, alpha: 0.9, bristles: 3, seed: 9001, dens: 7, taper: 0.45, fade: true
          });
        }
      } else {
        drawB(u, {});
      }

    } else if (u < T.wide) {
      /* --- SCALE JUMP 1: one word, monumental. The underline branches. --- */
      X.drawImage(macroWordA.c, 0, 0);
      if (u >= T.branch) {
        drawBranch(X, TREE, clamp01((u - T.branch) / 0.52), {
          cols: [P.cad, P.verm, P.mag, mix(P.pencil, P.cad, 0.55)], alpha: 0.72, seed: 55, taper: 0.6
        });
      }
      if (u >= T.irisFlash && u < T.irisOut) {
        /* the cold pole blinks through the paper for two frames */
        var ir = 150 + 90 * ease((u - T.irisFlash) / 0.11);
        var ip = lensPath(MWX + 430, MWY + 60, ir, 41);
        lensThrough(X, ip, function (c) { c.drawImage(macroWordB.c, 0, 0); });
        lensRim(X, ip, { seed: 42, w: 14, bw: 8 });
      }

    } else if (u < T.lens) {
      /* --- back out, and the branch is now seven thrown arcs across the whole
         square, each aimed at where a thing is going to be --- */
      drawA(u);
      var tf = clamp01((u - T.traj) / 0.3);
      TRAJ.forEach(function (a, i) {
        arcThrow(X, a.ax, a.ay, a.bx, a.by, a.bend, clamp01(tf * 1.6 - i * 0.07), {
          col: i === 6 ? P.verm : P.pencil, w: 5, alpha: 0.5, seed: a.seed, headCol: P.cad
        });
      });

    } else if (u < T.burst) {
      /* --- REVEALING LENS: hung from the top of the square and swung across
         it, the dark pole and everything already up in it --- */
      drawA(u);
      var lp = (u - T.lens) / (T.burst - T.lens);
      /* hung from above the top edge and swung once across the square: the
         low point of the swing crosses the middle of the list */
      var ang = lerp(-0.62, 0.62, ease(lp));
      var pivx = 540, pivy = 96, L = 424;
      var cx = pivx + Math.sin(ang) * L, cy = pivy + Math.cos(ang) * L;
      var rad = 132 + 158 * ease(lp * 1.4);
      var lpath = lensPath(cx, cy, rad, 41 + frameOf(u, 6));
      lensThrough(X, lpath, function (c) {
        c.drawImage(gSlate.c, 0, 0);
        c.drawImage(slateWords.c, 0, 0);
        if (u >= T.montage && u < T.montageEnd) {
          /* flash montage inside the lens: each thing for a frame and a half,
             at a size the wide shot never gives it */
          var k = Math.floor((u - T.montage) / 0.068) % ITEMS.length;
          var it = ITEMS[k];
          c.save();
          c.translate(cx, cy); c.scale(1.45 * it.s, 1.45 * it.s);
          c.translate(-SPC, -SPC);
          c.drawImage(SPR[k].c, 0, 0);
          c.restore();
        } else {
          objects(u, function (i, it) {
            var f = clamp01((u - T.lens - 0.1 - i * 0.06) / 0.2);
            return f <= 0 ? null : [it.sx, it.sy, 0, it.s * (0.5 + 0.5 * f), 1];
          }, false);
        }
      });
      lensRim(X, lpath, { seed: 42, w: 18, bw: 9 });
      /* the string it hangs on, drawn as a mark */
      brush(X, [[pivx, pivy + 120], [(pivx + cx) / 2, (pivy + cy) / 2], [cx - Math.sin(ang) * rad, cy - Math.cos(ang) * rad]], {
        col: P.pencil, w: 4, alpha: 0.3, bristles: 1, seed: 44, dens: 6, dry: 0.3
      });

    } else if (u < T.chaos) {
      /* --- the lens goes off like a flashbulb and takes the frame with it --- */
      var bp = clamp01((u - T.burst) / 0.05);
      drawB(u, { objects: skyPlace });
      flash(X, P.goldLt, 0.5 * (1 - bp), W, H);

    } else if (u < T.grid) {
      /* --- CHAOS: seven things loose in the dark, counted as they go past --- */
      drawB(u, { words: false });
      var cf = clamp01((u - T.chaos) / 0.3);
      var scatter = function (i, it, uu) {
        var c = chaosAt(i, 5150, uu * 2.1, 540, 520, 470);
        var p = ease(cf);
        return [lerp(it.sx, c[0], p), lerp(it.sy, c[1], p), c[2] * p,
          it.s * lerp(1, 0.5 * c[3] + 0.34, p), 1];
      };
      /* two earlier exposures behind the live one. A form travelling this fast
         should smear; without the smear the frame reads as an arrangement. */
      objects(u - 0.12, scatter, false, 0.13);
      objects(u - 0.06, scatter, false, 0.26);
      objects(u, scatter, false);
      tallyMarks(X, 92, 946, 7, clamp01((u - T.chaos - 0.1) / 0.8), { col: P.gold, seed: 71, w: 8, h: 52, gap: 21 });

    } else if (u < T.brk) {
      /* --- GRID SNAP: for half a second it is an inventory, ruled up by hand,
         everything level and counted --- */
      drawB(u, { words: false });
      objects(u, function (i, it) {
        var g = gridAt(i, 4, 540, 520, 238, 254, 7);
        return [g[0], g[1], 0, it.s * 0.5, 1];
      }, false);
      var gf = clamp01((u - T.grid) / 0.16);
      ITEMS.forEach(function (it, i) {
        var g = gridAt(i, 4, 540, 520, 238, 254, 7);
        crosshair(X, g[0], g[1], 86, clamp01(gf * 1.4 - i * 0.06), { col: P.gold, seed: 300 + i * 7, w: 4, alpha: 0.5 });
      });
      /* the box round it drawn with a hand, not a ruler */
      var bx0 = 540 - 2 * 238 + 60, bx1 = 540 + 2 * 238 - 60, by0 = 520 - 254 * 0.5 - 130, by1 = 520 + 254 * 0.5 + 130;
      [[[bx0, by0], [540, by0 - 7], [bx1, by0 + 4]], [[bx1, by0], [bx1 + 6, 520], [bx1 - 3, by1]],
       [[bx1, by1], [540, by1 + 8], [bx0, by1 - 5]], [[bx0, by1], [bx0 - 7, 520], [bx0 + 4, by0]]]
        .forEach(function (side, k) {
          brush(X, partial(side, clamp01(gf * 2 - k * 0.22)), {
            col: P.gold, w: 5, alpha: 0.42, bristles: 1, seed: 380 + k, dens: 6, dry: 0.3
          });
        });
      tallyMarks(X, 92, 946, 7, 1, { col: P.gold, seed: 71, w: 8, h: 52, gap: 21 });

    } else if (u < T.cons) {
      /* --- and it breaks: thrown out to the sky positions, overshooting --- */
      var fp = (u - T.brk) / (T.cons - T.brk);
      drawB(u, { words: false });
      objects(u, function (i, it) {
        var g = gridAt(i, 4, 540, 520, 238, 254, 7);
        var p = over(clamp01(fp * (0.85 + (i % 3) * 0.1)));
        return [lerp(g[0], it.sx, p), lerp(g[1], it.sy, p), (1 - p) * 0.3 * (i % 2 ? 1 : -1), it.s * lerp(0.5, 1, p), 1];
      }, false);

    } else if (u < T.mcA) {
      /* --- the constellation: struck marks in the gaps the objects leave --- */
      var sf = clamp01((u - T.cons) / 0.9);
      drawB(u, { words: false, stars: sf, heat: clamp01((u - T.cons - 0.45) / 0.5), objects: skyPlace });
      /* three arcs joining what the eye is joining anyway. They draw on, hold
         for a beat and retract: a note in the margin, not a wiring diagram. */
      var af = clamp01((u - T.cons - 0.7) / 0.3) * clamp01((T.mcA - 0.1 - u) / 0.22);
      [[0, 4], [4, 2], [2, 6]].forEach(function (pr, k) {
        var a = ITEMS[pr[0]], b = ITEMS[pr[1]];
        arcThrow(X, a.sx, a.sy, b.sx, b.sy, k % 2 ? 0.16 : -0.14, af, {
          col: P.gold, w: 4, alpha: 0.34 * af, seed: 4500 + k * 13, head: false, dry: 0.3
        });
      });

    } else if (u < T.macroB) {
      /* --- match-cut on the constellation: the same seven, same places, on the
         cream, then straight back to the dark --- */
      if (held(u, [[T.mcA, 'A'], [T.mcB, 'B']]) === 'A') drawA(u, { objects: skyPlace });
      else drawB(u, { words: false, stars: 1, heat: 1, objects: skyPlace });

    } else if (u < T.macroA) {
      /* --- SCALE JUMP 2: the thing she crossed off, at monument size, with the
         crossing-out coming back as two meteors --- */
      X.drawImage(macroBiscB.c, 0, 0);
      /* the crossing-out arrives as two meteors and is gone in a third of a
         second — the joke is that being crossed off is what set it alight */
      var mf = clamp01((u - T.meteor) / 0.3);
      var mfade = 1 - clamp01((u - T.meteor - 0.34) / 0.3);
      [[[-160, 780], [520, 452], [1240, 604], 9101], [[100, 300], [600, 712], [1220, 418], 9102]]
        .forEach(function (m, k) {
          var p = clamp01(mf * 1.3 - k * 0.2);
          if (p <= 0 || mfade <= 0) return;
          var sm = crSample([m[0], m[1], m[2]], 16, false);
          var n = Math.max(2, Math.round(sm.length * p));
          var tail = sm.slice(Math.max(0, n - 22), n);
          /* One loaded mark with body, not an outline: two thin ribbons plus a
             pale core came out a hollow tube, which is a wireframe not a
             brushload. Bristles are stacked wide and the light sits inside it. */
          brush(X, tail, {
            col: k ? P.amber : P.verm, w: 60, alpha: 0.9 * mfade, bristles: 4, seed: m[3],
            raw: true, taper: 1.2, thick: 2.1, vary: 26, spread: 0.2, solid: true
          });
          brush(X, tail, {
            col: P.goldLt, w: 22, alpha: 0.6 * mfade, bristles: 2, seed: m[3] + 1,
            raw: true, taper: 1.6, thick: 1.7, spread: 0.14, solid: true
          });
          var hd = sm[n - 1];
          X.beginPath(); X.arc(hd[0], hd[1], 15, 0, TAU);
          X.fillStyle = rgba(P.goldLt, 0.85 * mfade); X.fill();
          spatter(X, hd[0], hd[1], 46, 22, P.amber, m[3] + 2, 3);
          /* and it leaves a scorch where it went over the biscuit */
          if (p >= 1) {
            brush(X, sm.filter(function (q, qi) { return qi % 3 === 0; }), {
              col: '#5a2f16', w: 16, alpha: 0.18 * (1 - mfade), bristles: 2, seed: m[3] + 5,
              dens: 5, dry: 0.4, taper: 0.9
            });
          }
        });
      crosshair(X, 528, 556, 430, clamp01((u - T.meteor - 0.5) / 0.4), { col: P.gold, seed: 907, w: 6, alpha: 0.4 });
      tallyMarks(X, 96, 962, 1, clamp01((u - T.meteor - 0.62) / 0.25), { col: P.goldLt, seed: 73, w: 9, h: 58, gap: 22 });

    } else if (u < T.strike) {
      /* --- and the same close-up on paper: pencil, biro, no fire --- */
      X.drawImage(macroBiscA.c, 0, 0);

    } else if (u < T.breathe) {
      /* --- STRIKE: eight cuts in a second and a third, mode and scale jumping
         together, the positions never moving --- */
      var i = 0;
      for (var k = 0; k < T.strikeCuts.length; k++) if (u >= T.strikeCuts[k][0]) i = k; else break;
      var c = T.strikeCuts[i];
      if (c[1] === 'A') drawA(u, { objects: skyPlace });
      else drawB(u, { words: false, stars: 1, heat: 1, objects: skyPlace });
      if (i === 6) flash(X, P.gold, 0.28, W, H);
      var tf2 = clamp01((u - T.strike) / 0.9);
      tallyMarks(X, 92, 946, 6, tf2, { col: c[1] === 'A' ? P.pencil : P.gold, seed: 71, w: 8, h: 52, gap: 21 });
      tallyMarks(X, 92 + 148, 946, 1, clamp01(tf2 * 1.4 - 0.5), { col: P.verm, seed: 74, w: 9, h: 52, gap: 21 });

    } else if (u < T.scrub) {
      /* --- breathe: the dark, held, and the aside written in --- */
      drawB(u, { words: false, stars: 1, heat: 1, objects: skyPlace });
      var af2 = clamp01((u - T.aside) / 0.7);
      if (af2 > 0) {
        X.save();
        X.beginPath(); X.rect(0, 860, 60 + af2 * 700, 220); X.clip();
        X.globalAlpha = 0.9;
        X.drawImage(extrasP.c, 0, 0);
        X.restore();
        X.globalAlpha = 1;
      }
      if (u >= T.mark) opusMark(X, 878, 1032, 30, P.gold, 0.45);

    } else if (u < T.home) {
      /* --- the cream is scrubbed back over the dark, and the list with it --- */
      drawB(u, { words: false, stars: 1, heat: 1, objects: skyPlace });
      var wp = clamp01((u - T.scrub) / 1.15);
      paintOn(X, plateA[bj], wipeRev, wp, scratchP, W, H);
      var nw = wipeStrokes.length, cur = wp * nw;
      var scrubCols = [P.mist, P.dust, P.stone, P.oat, '#cfc6b6'];
      for (var k2 = Math.max(0, Math.floor(cur) - 2); k2 <= Math.floor(cur) && k2 < nw; k2++) {
        var f2 = clamp01(cur - k2);
        brush(X, partial(wipeStrokes[k2].pts, f2), {
          col: scrubCols[k2 % scrubCols.length], w: 138, alpha: 0.88, bristles: 8, thick: 1.15,
          dens: 6, dry: 0.16, vary: 34, raw: true, seed: k2 * 31 + 7, spread: 0.96, taper: 1.3, fade: true
        });
      }
      if (wp >= 1) drawA(u);

    } else {
      drawA(u);
    }

    X.restore();
    applyGrain(X, grain, 0.4, W, H);
  }

  window.draw = draw;
})();
