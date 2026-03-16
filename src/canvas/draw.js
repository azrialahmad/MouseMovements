// ─── Canvas drawing primitives ───────────────────────────────

/**
 * Draw a faint dot-grid background.
 */
export function drawGrid(ctx, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

/**
 * Draw a circular target at (x, y).
 */
export function drawTarget(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Draw a crosshair cursor at (x, y).
 */
export function drawCrosshair(ctx, x, y, color) {
  const s = 8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Draw the movement trail up to `progress` (0–1).
 */
export function drawTrail(ctx, pts, color, progress) {
  if (pts.length < 2) return;
  const n = Math.max(2, Math.round(pts.length * progress));
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  ctx.stroke();

  ctx.globalAlpha = 0.25;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }
  ctx.globalAlpha = 1;
}
