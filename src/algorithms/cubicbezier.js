import { randFloat } from '../utils/math.js';

/**
 * CUBIC BÉZIER — smooth geometric curve with randomised control points
 *
 * Two control points are placed perpendicular to the straight line between
 * start and target, creating a natural S-curve or arc. Speed is modelled
 * with a sine-based velocity profile (slow start, fast middle, slow end).
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} speed  1–10 scale; higher = fewer steps
 * @returns {Array<{x:number,y:number,t:number}>}
 */
export function genCubicBezier(x0, y0, x1, y1, speed = 5) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return [{ x: x0, y: y0, t: 0 }, { x: x1, y: y1, t: 50 }];

  // Perpendicular unit vector
  const px = -dy / dist;
  const py =  dx / dist;

  // Control point offsets along the perpendicular (±15%–40% of distance)
  const cp1Fwd = randFloat(0.25, 0.45);     // how far along the line
  const cp2Fwd = randFloat(0.55, 0.75);
  const cp1Perp = randFloat(-0.35, 0.35) * dist;  // perpendicular displacement
  const cp2Perp = randFloat(-0.35, 0.35) * dist;

  const c1x = x0 + dx * cp1Fwd + px * cp1Perp;
  const c1y = y0 + dy * cp1Fwd + py * cp1Perp;
  const c2x = x0 + dx * cp2Fwd + px * cp2Perp;
  const c2y = y0 + dy * cp2Fwd + py * cp2Perp;

  // Number of steps: inversely proportional to speed
  const steps = Math.max(20, Math.round(dist / (speed * 1.5)));

  // Cumulative time using sine-eased velocity (slow-fast-slow profile)
  let cumTime = 0;
  const totalMs = Math.max(300, 900 - speed * 60); // faster at higher speed

  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    // Cubic Bézier formula: B(t) = (1-t)³P0 + 3(1-t)²tC1 + 3(1-t)t²C2 + t³P1
    const u = 1 - t;
    const bx = u * u * u * x0
             + 3 * u * u * t * c1x
             + 3 * u * t * t * c2x
             + t * t * t * x1;
    const by = u * u * u * y0
             + 3 * u * u * t * c1y
             + 3 * u * t * t * c2y
             + t * t * t * y1;

    // Sine velocity easing: fast in middle, slow at edges
    const vNorm = Math.sin(Math.PI * t);  // 0 → 1 → 0
    const dtMs = i === 0 ? 0 : (totalMs / steps) / Math.max(0.15, vNorm);
    cumTime += dtMs;

    pts.push({ x: bx, y: by, t: cumTime });
  }

  return pts;
}

export const meta = {
  id: 'bezier',
  name: 'CubicBézier',
  tag: 'GEOMETRIC',
  tagClass: 'tag-geometric',
  color: 'var(--bezier)',
  desc: 'Traces a cubic Bézier curve between start and target, with two randomly-placed control points that produce smooth arcs or S-curves. Velocity follows a sine profile — slow at start and finish, fast through the middle.',
  creditHtml: 'classic cubic Bézier formulation — no external author',
};