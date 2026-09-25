// ---------------------------------------------------------------------------
// The telescope. One model, projected in light 3D, drawn in the house style.
// Canon (see DECISIONS.md):
//   - brass tube, wide dew shield at the front, two bands, small finder on top
//   - THE DENT: top of the tube, just behind the front band (u = 0.60), always
//     on the upper-left of the tube as seen from the eyepiece. It notches the
//     top silhouette, so it reads even in silhouette.
//   - cracked eyepiece until S23, then a new one; the dent is never fixed
//   - wooden tripod, three legs, leather strap on the front-left leg,
//     triangular accessory tray
// ---------------------------------------------------------------------------
const DENT_U = 0.60;

function telescope(ctx, o) {
  const s = o.s || 1, L = 560;
  const alt = o.alt !== undefined ? o.alt : 0.35, az = o.az || 0;
  const pitch = o.pitch !== undefined ? o.pitch : 0.14, cp = Math.cos(pitch), sp = Math.sin(pitch);
  const X = o.x, Y = o.y;
  const seed = o.seed || 40;
  const lw = Math.max(1.3, (o.lw || 3.2) * Math.sqrt(s));
  const polish = o.polish !== undefined ? o.polish : 0.3;
  const brass = mix(COL.brassOld, COL.brass, polish), brassHi = COL.brassHi;
  const proj = p => [X + p[0] * s, Y + (-p[1] * cp + p[2] * sp) * s];
  const depth = p => p[2] * cp + p[1] * sp;
  const ld = o.lightDir || [-0.55, -0.83];
  const v = [0, sp, cp]; // toward camera
  const d = [Math.cos(alt) * Math.cos(az), Math.sin(alt), Math.cos(alt) * Math.sin(az)];
  // "up" for the tube: perpendicular to d in its vertical plane
  let up = [-Math.sin(alt) * Math.cos(az), Math.cos(alt), -Math.sin(alt) * Math.sin(az)];
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const axle = [0, 0, 0];
  const at = u => add(axle, d, (u - 0.42) * L);       // point on the tube axis
  const ratio = Math.abs(dot(d, v));
  const frontFaces = dot(d, v) > 0;

  // screen-space cylinder outline between axis params u0..u1 with radius r (world px)
  function cyl(u0, u1, r, opt = {}) {
    const A = proj(opt.A || at(u0)), B = proj(opt.B || at(u1));
    let ux = B[0] - A[0], uy = B[1] - A[1]; const len = Math.hypot(ux, uy) || 1e-6; ux /= len; uy /= len;
    let nx = -uy, ny = ux; if (ny > 0) { nx = -nx; ny = -ny; } // n points "up" on screen
    const R = r * s, rr = Math.max(0.12, ratio) * R;
    const E = (c, th) => [c[0] + nx * R * Math.cos(th) + ux * rr * Math.sin(th), c[1] + ny * R * Math.cos(th) + uy * rr * Math.sin(th)];
    const pts = [];
    const dent = opt.dent && o.dent !== false;
    // top edge A -> B (optionally notched)
    const N = 18;
    for (let i = 0; i <= N; i++) {
      const t = i / N; let px = A[0] + (B[0] - A[0]) * t + nx * R, py = A[1] + (B[1] - A[1]) * t + ny * R;
      if (dent) { const uu = u0 + (u1 - u0) * t; const k = Math.exp(-Math.pow((uu - DENT_U) / 0.028, 2)); px -= nx * R * 0.32 * k; py -= ny * R * 0.32 * k; }
      pts.push([px, py]);
    }
    for (let i = 1; i < 12; i++) pts.push(E(B, i / 12 * Math.PI));
    pts.push([B[0] - nx * R, B[1] - ny * R]); pts.push([A[0] - nx * R, A[1] - ny * R]);
    for (let i = 1; i < 12; i++) pts.push(E(A, Math.PI + i / 12 * Math.PI));
    return { pts, A, B, nx, ny, ux, uy, R, rr, E };
  }
  function drawCyl(c, fill, opt = {}) {
    const p = path().poly(c.pts);
    const sh = [(-ld[0]) * -c.R * 0.55, (-ld[1]) * -c.R * 0.55];
    cel(ctx, p, { fill, shade: [ld[0] * -c.R * 0.5 * -1, ld[1] * -c.R * 0.5 * -1], lw: opt.lw || lw, seed: opt.seed || seed, amp: 0.7 * Math.sqrt(s), shadeCol: opt.shadeCol });
    if (opt.hi !== false) {
      // specular streak along the lit side
      const off = 0.5 * c.R;
      const hx = c.nx * off, hy = c.ny * off;
      const q = path().m(c.A[0] + hx + c.ux * c.R * 0.3, c.A[1] + hy + c.uy * c.R * 0.3).l(c.B[0] + hx - c.ux * c.R * 0.3, c.B[1] + hy - c.uy * c.R * 0.3);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      line(ctx, q, { color: lit(opt.hiCol || brassHi), lw: Math.max(1, c.R * 0.16), alpha: (opt.hiA || 0.55) * (0.5 + polish * 0.8), seed: seed + 9, amp: 0.4 });
      ctx.restore();
    }
  }
  function cap(c, atB, fill, inner) {
    const cc = atB ? c.B : c.A;
    const pts = []; for (let i = 0; i < 28; i++) pts.push(c.E(cc, i / 28 * TAU));
    cel(ctx, path().poly(pts), { fill, lw: lw * 0.8, seed: seed + 5, amp: 0.5 });
    if (inner) inner(cc, c);
  }

  // ---------------- tripod ----------------
  const legs = [];
  if (!o.noTripod) {
    const yaw = o.yaw !== undefined ? o.yaw : 0.5;
    const legLen = 540, spread = o.folded ? 0.1 : 0.42;
    const head = [0, -46, 0];
    for (let i = 0; i < 3; i++) {
      const a = yaw + i * TAU / 3;
      const foot = [Math.cos(a) * legLen * spread, -46 - legLen * 0.93, Math.sin(a) * legLen * spread];
      const top = [Math.cos(a) * 16, -52, Math.sin(a) * 16];
      legs.push({ i, top, foot, z: depth(add(top, foot, 1)) });
    }
    legs.sort((a, b) => a.z - b.z);
    const drawLeg = (lg) => {
      const T0 = proj(lg.top), F = proj(lg.foot);
      let ux = F[0] - T0[0], uy = F[1] - T0[1]; const len = Math.hypot(ux, uy); ux /= len; uy /= len;
      const nx = -uy, ny = ux, w0 = 13 * s, w1 = 8 * s;
      const pts = [[T0[0] + nx * w0, T0[1] + ny * w0], [F[0] + nx * w1, F[1] + ny * w1], [F[0] - nx * w1, F[1] - ny * w1], [T0[0] - nx * w0, T0[1] - ny * w0]];
      cel(ctx, path().poly(pts), { fill: COL.wood, shade: [nx * -4 * s, ny * -4 * s], lw, seed: seed + 20 + lg.i, amp: 0.8 });
      // grain
      line(ctx, path().m(T0[0] + nx * w0 * 0.2, T0[1] + ny * w0 * 0.2 + 20 * s).l(F[0] + nx * w1 * 0.3 - ux * 60 * s, F[1] + ny * w1 * 0.3 - uy * 60 * s), { color: lit(COL.woodDk), lw: lw * 0.4, alpha: 0.55, seed: seed + 30 + lg.i });
      // brass foot ferrule
      const fp = [[F[0] + nx * w1 * 1.1 - ux * 26 * s, F[1] + ny * w1 * 1.1 - uy * 26 * s], [F[0] + nx * w1 * 0.8, F[1] + ny * w1 * 0.8], [F[0] + ux * 8 * s, F[1] + uy * 8 * s], [F[0] - nx * w1 * 0.8, F[1] - ny * w1 * 0.8], [F[0] - nx * w1 * 1.1 - ux * 26 * s, F[1] - ny * w1 * 1.1 - uy * 26 * s]];
      cel(ctx, path().poly(fp), { fill: brass, lw: lw * 0.8, seed: seed + 40 + lg.i });
      if (lg.i === 0) { // the leather strap, wrapped three times
        for (let k = 0; k < 3; k++) {
          const t = 0.42 + k * 0.035, cx = T0[0] + ux * len * t, cy = T0[1] + uy * len * t;
          const sp2 = [[cx + nx * w0 * 1.15, cy + ny * w0 * 1.15], [cx + nx * w0 * 1.15 + ux * 10 * s, cy + ny * w0 * 1.15 + uy * 10 * s], [cx - nx * w0 * 1.15 + ux * 16 * s, cy - ny * w0 * 1.15 + uy * 16 * s], [cx - nx * w0 * 1.15 + ux * 6 * s, cy - ny * w0 * 1.15 + uy * 6 * s]];
          cel(ctx, path().poly(sp2), { fill: COL.leather, lw: lw * 0.7, seed: seed + 50 + k });
        }
        // the loose tail of the strap
        const t = 0.49, cx = T0[0] + ux * len * t - nx * w0, cy = T0[1] + uy * len * t - ny * w0;
        line(ctx, path().m(cx, cy).q(cx - nx * 14 * s + ux * 20 * s, cy - ny * 14 * s + uy * 20 * s, cx - nx * 8 * s + ux * 46 * s, cy - ny * 8 * s + uy * 46 * s), { color: lit(COL.leather), lw: 6 * s, seed: seed + 57, amp: 0.4 });
      }
      lg.T0 = T0; lg.F = F; lg.len = len; lg.u = [ux, uy];
    };
    // back legs, tray, front legs
    drawLeg(legs[0]);
    if (!o.folded) {
      const tp = legs.map(lg => { const t = 0.42; return proj(add(lg.top, add(lg.foot, lg.top, -1), t)); });
      const cx = (tp[0][0] + tp[1][0] + tp[2][0]) / 3, cy = (tp[0][1] + tp[1][1] + tp[2][1]) / 3;
      const tri = tp.map(p => [cx + (p[0] - cx) * 1.05, cy + (p[1] - cy) * 1.05]);
      cel(ctx, path().poly(tri), { fill: COL.wood, shade: [0, -3 * s], lw: lw * 0.9, seed: seed + 60 });
      [[0.45, 0.2], [0.35, 0.45], [0.55, 0.5]].forEach(([a, b], k) => {
        const hx = tri[0][0] * (1 - a - b) + tri[1][0] * a + tri[2][0] * b, hy = tri[0][1] * (1 - a - b) + tri[1][1] * a + tri[2][1] * b;
        cel(ctx, path().ellipse(hx, hy, 6 * s, 3 * s), { fill: COL.woodDk, lw: lw * 0.5, seed: seed + 61 + k, noLine: s < 0.5 });
      });
    }
    drawLeg(legs[1]); drawLeg(legs[2]);
    // head: a turned wooden disc with a brass plate
    const hc = proj(head);
    cel(ctx, path().ellipse(hc[0], hc[1], 30 * s, (30 * sp + 6) * s), { fill: COL.woodDk, lw, seed: seed + 70 });
    cel(ctx, path().ellipse(hc[0], hc[1] - 6 * s, 24 * s, (24 * sp + 4) * s), { fill: brass, lw: lw * 0.8, seed: seed + 71 });
  }

  // ---------------- mount (fork) ----------------
  if (!o.noTripod || o.fork) {
    const b0 = proj([0, -40, 0]), a0 = proj([0, 0, 0]);
    const fpts = [[b0[0] - 16 * s, b0[1]], [a0[0] - 10 * s, a0[1] + 6 * s], [a0[0] + 10 * s, a0[1] + 6 * s], [b0[0] + 16 * s, b0[1]]];
    cel(ctx, path().poly(fpts), { fill: brass, shade: [-3 * s, -3 * s], lw, seed: seed + 75 });
  }

  // ---------------- tube parts, ordered back-to-front ----------------
  const parts = [];
  const tube = cyl(0, 1, 28, { dent: true });
  const shield = cyl(0.83, 1.02, 38);
  const band1 = cyl(0.17, 0.21, 29), band2 = cyl(0.64, 0.68, 29);
  const focA = at(0), focB = add(at(0), d, -58);
  const focus = cyl(0, 0, 14, { A: focB, B: focA });
  const epA = add(focB, d, -44);
  const eyep = cyl(0, 0, 11, { A: epA, B: focB });
  const fin0 = add(at(0.12), up, 44), fin1 = add(at(0.40), up, 44);
  const finder = cyl(0, 0, 8, { A: fin0, B: fin1 });

  const drawBack = () => {
    drawCyl(eyep, brass, { seed: seed + 80 });
    if (!frontFaces) cap(eyep, false, '#1a1a22', (c, cy) => {
      // the eye lens
      const g = []; for (let i = 0; i < 24; i++) g.push(cy.E(c, i / 24 * TAU).map((v2, j) => c[j] + (v2 - c[j]) * 0.7));
      cel(ctx, path().poly(g), { fill: COL.glass, lw: lw * 0.5, seed: seed + 83, raw: false });
      if (o.cracked !== false) {
        const R = cy.R * 0.7;
        const cr = path().m(c[0] - R * 0.8, c[1] - R * 0.3 * cy.rr / cy.R).l(c[0] - R * 0.2, c[1] + R * 0.05).l(c[0] + R * 0.1, c[1] - R * 0.2).l(c[0] + R * 0.75, c[1] + R * 0.35);
        line(ctx, cr, { color: '#fff8e0', lw: Math.max(1, 1.6 * s), alpha: 0.9, seed: seed + 84, amp: 0.2 });
        const cr2 = path().m(c[0] + R * 0.1, c[1] - R * 0.2).l(c[0] + R * 0.2, c[1] - R * 0.7);
        line(ctx, cr2, { color: '#fff8e0', lw: Math.max(0.8, 1.1 * s), alpha: 0.8, seed: seed + 85, amp: 0.2 });
      }
    });
    drawCyl(focus, brass, { seed: seed + 86 });
    // focus knob (knurled)
    const kp = proj(add(add(at(0), d, -24), up, -18));
    cel(ctx, path().ellipse(kp[0], kp[1], 9 * s, 9 * s), { fill: brass, lw: lw * 0.8, seed: seed + 87, shade: [-2 * s, -2 * s] });
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; line(ctx, path().m(kp[0] + Math.cos(a) * 5 * s, kp[1] + Math.sin(a) * 5 * s).l(kp[0] + Math.cos(a) * 9 * s, kp[1] + Math.sin(a) * 9 * s), { lw: lw * 0.35, seed: seed + 88 + k }); }
  };
  const drawFront = () => {
    drawCyl(shield, brass, { seed: seed + 90 });
    if (frontFaces) cap(shield, true, '#15151c', (c, cy) => {
      const g = []; for (let i = 0; i < 28; i++) g.push(cy.E(c, i / 28 * TAU).map((v2, j) => c[j] + (v2 - c[j]) * 0.78));
      cel(ctx, path().poly(g), { fill: '#223040', lw: lw * 0.5, seed: seed + 91 });
      glow(ctx, c[0] - cy.R * 0.25, c[1] - cy.rr * 0.25, cy.R * 0.35, '#bcd6e8', 0.35);
    });
  };
  const drawMain = () => {
    drawCyl(tube, brass, { seed: seed + 100 });
    drawCyl(band1, mix(brass, COL.brassDk, 0.25), { seed: seed + 101, hiA: 0.7 });
    drawCyl(band2, mix(brass, COL.brassDk, 0.25), { seed: seed + 102, hiA: 0.7 });
    // the dent: a dark pinch with a bright lip, on the upper-left of the tube
    if (o.dent !== false && Math.cos(az) > -0.35) {
      const c0 = at(DENT_U);
      const dc = proj(add(c0, up, 26 * 0.72));
      const R = 26 * s;
      ctx.save();
      const ang = Math.atan2(tube.uy, tube.ux);
      const dp = path().ellipse(dc[0], dc[1], R * 0.42, R * 0.2, ang);
      cel(ctx, dp, { fill: mix(brass, COL.brassDk, 0.7), noLine: true, seed: seed + 103 });
      line(ctx, path().m(dc[0] - Math.cos(ang) * R * 0.34, dc[1] - Math.sin(ang) * R * 0.34).q(dc[0] - Math.sin(ang) * R * 0.2, dc[1] + Math.cos(ang) * R * 0.2, dc[0] + Math.cos(ang) * R * 0.34, dc[1] + Math.sin(ang) * R * 0.34), { lw: lw * 0.55, seed: seed + 104, amp: 0.3 });
      ctx.globalCompositeOperation = 'lighter';
      line(ctx, path().m(dc[0] - Math.cos(ang) * R * 0.25 + Math.sin(ang) * R * 0.12, dc[1] - Math.sin(ang) * R * 0.25 - Math.cos(ang) * R * 0.12).l(dc[0] + Math.cos(ang) * R * 0.22 + Math.sin(ang) * R * 0.14, dc[1] + Math.sin(ang) * R * 0.22 - Math.cos(ang) * R * 0.14), { color: lit(brassHi), lw: Math.max(1, lw * 0.5), alpha: 0.7, seed: seed + 105, amp: 0.2 });
      ctx.restore();
    }
    // finder with two brackets
    [0.16, 0.36].forEach((u, k) => {
      const a = proj(add(at(u), up, 24)), b = proj(add(at(u), up, 38));
      const w2 = 4 * s;
      cel(ctx, path().poly([[a[0] - w2, a[1]], [b[0] - w2, b[1]], [b[0] + w2, b[1]], [a[0] + w2, a[1]]]), { fill: brass, lw: lw * 0.6, seed: seed + 110 + k });
    });
    drawCyl(finder, brass, { seed: seed + 112, lw: lw * 0.8 });
  };
  if (frontFaces) { drawBack(); drawMain(); drawFront(); }
  else { drawFront(); drawMain(); drawBack(); }

  // a travelling glint (0..1 along the tube)
  if (o.glint !== undefined && o.glint !== null) {
    const g = proj(add(at(o.glint), up, 26 * 0.5));
    glow(ctx, g[0], g[1], 60 * s, '#fff4d0', 0.55 * (o.glintA || 1));
    glow(ctx, g[0], g[1], 14 * s, '#ffffff', 0.9 * (o.glintA || 1));
  }
  // expose some anchor points for scenes
  return {
    eyepiece: proj(epA), objective: proj(at(1.02)), axle: proj(axle), dent: proj(add(at(DENT_U), up, 26 * 0.72)),
    at: u => proj(at(u)), foot: legs.map(l => l.F),
  };
}
