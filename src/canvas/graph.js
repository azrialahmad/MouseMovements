// ─── Velocity graph ───────────────────────────────────────────

/**
 * Draw placeholder text when no data is available.
 */
export function drawGraphIdle(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.font = '11px Space Grotesk, monospace';
  ctx.fillText('velocity profile — run to populate', 12, h / 2 + 4);
}

/**
 * Draw velocity curves for all algorithms.
 * @param {Object} allPts  e.g. { linear: [...], wind: [...], sigma: [...] }
 * @param {Object} colorMap  e.g. { linear: '#4ade80', ... }
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawVelocityGraph(allPts, colorMap, ctx) {
  const canvas = ctx.canvas;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  function getSpeeds(pts) {
    const out = [];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
      const dt = pts[i].t - pts[i - 1].t;
      if (dt > 0) out.push({ t: pts[i].t, v: Math.hypot(dx, dy) / dt });
    }
    return out;
  }

  const entries = Object.entries(allPts)
    .filter(([, pts]) => pts && pts.length > 1)
    .map(([id, pts]) => ({ id, pts, color: colorMap[id] }));

  if (!entries.length) { drawGraphIdle(ctx, w, h); return; }

  let maxT = 1, maxV = 0.001;
  const speedSets = entries.map(({ pts }) => {
    const s = getSpeeds(pts);
    s.forEach(p => { if (p.t > maxT) maxT = p.t; if (p.v > maxV) maxV = p.v; });
    return s;
  });

  // grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const y = h - (h * i / 4);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  const pad = 8;
  entries.forEach(({ color }, idx) => {
    const speeds = speedSets[idx];
    if (speeds.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(speeds[0].t / maxT * w, h - pad - (speeds[0].v / maxV) * (h - pad * 2));
    for (let i = 1; i < speeds.length; i++) {
      const px = speeds[i].t / maxT * w;
      const py = h - pad - (speeds[i].v / maxV) * (h - pad * 2);
      ctx.lineTo(px, Math.max(pad, Math.min(h - pad, py)));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
}
