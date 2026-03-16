// ─── Metrics ─────────────────────────────────────────────────
/**
 * @param {Array<{x:number,y:number,t:number}>} pts
 * @param {number} straightDist
 */
export function computeMetrics(pts, straightDist) {
  if (pts.length < 2) return { mt: 0, pathLen: 0, efficiency: 1, peakSpeed: 0, subMov: 1 };

  const mt = pts[pts.length - 1].t - pts[0].t;
  let pathLen = 0, maxSpeed = 0;
  const speeds = [0];

  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const dt = pts[i].t - pts[i - 1].t;
    const seg = Math.hypot(dx, dy);
    pathLen += seg;
    const spd = dt > 0 ? seg / dt : 0;
    speeds.push(spd);
    if (spd > maxSpeed) maxSpeed = spd;
  }

  const efficiency = pathLen > 0 ? Math.min(1, straightDist / pathLen) : 1;
  const threshold = maxSpeed * 0.15;
  let peaks = 0;
  for (let i = 2; i < speeds.length - 1; i++) {
    if (speeds[i] > threshold && speeds[i] > speeds[i - 1] && speeds[i] > speeds[i + 1]) peaks++;
  }

  return {
    mt: Math.round(mt),
    pathLen,
    efficiency: +efficiency.toFixed(3),
    peakSpeed: maxSpeed,
    subMov: Math.max(peaks, 1),
  };
}
