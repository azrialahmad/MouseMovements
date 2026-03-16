/**
 * LINEAR — straight-line constant-speed baseline
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} speed  1–10 scale; higher = fewer steps (faster)
 * @returns {Array<{x:number,y:number,t:number}>}
 */
export function genLinear(x0, y0, x1, y1, speed = 5) {
  const pts = [];
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(10, Math.round(dist / (speed * 2)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({ x: x0 + dx * t, y: y0 + dy * t, t: i * (1000 / 60) });
  }
  return pts;
}

export const meta = {
  id: 'linear',
  name: 'Linear',
  tag: 'BASIC',
  tagClass: 'tag-basic',
  color: 'var(--linear)',
  desc: 'Moves directly toward the target at a constant speed. No curve, no noise, no human quality. The baseline every other algorithm is compared against.',
  credit: 'baseline — no external author',
  creditHtml: 'baseline — no external author',
};
