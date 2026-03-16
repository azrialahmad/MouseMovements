import { randFloat } from '../utils/math.js';

/**
 * WINDMOUSE — wind + gravity heuristic
 * Original algorithm by BenLand100 (Java). JS port by arevi.
 * Reimplemented inline for browser compatibility.
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} speed  1–10 scale; mapped to maxStep
 * @returns {Array<{x:number,y:number,t:number}>}
 */
export function genWindMouse(x0, y0, x1, y1, speed = 5) {
  const gravity = 9;
  const wind = 3;
  const maxStep = 8 + speed;
  const targetArea = 8;

  const pts = [{ x: x0, y: y0, t: 0 }];
  let xs = x0, ys = y0;
  let vx = 0, vy = 0, wx = 0, wy = 0;
  let t = 0, step = maxStep;

  for (let iter = 0; iter < 5000; iter++) {
    const dist = Math.hypot(x1 - xs, y1 - ys);
    if (dist < 1) break;
    const w = Math.min(wind, dist);
    if (dist >= targetArea) {
      wx = wx / Math.sqrt(3) + randFloat(-w, w) / Math.sqrt(5);
      wy = wy / Math.sqrt(3) + randFloat(-w, w) / Math.sqrt(5);
    } else {
      wx /= Math.sqrt(3); wy /= Math.sqrt(3);
      if (step < 3) step = randFloat(3, 6);
      else step /= Math.sqrt(5);
    }
    vx += wx + gravity * (x1 - xs) / dist;
    vy += wy + gravity * (y1 - ys) / dist;
    const vmag = Math.hypot(vx, vy);
    if (vmag > step) {
      const r = step / 2 + randFloat(0, step / 2);
      vx = vx / vmag * r; vy = vy / vmag * r;
    }
    xs += vx; ys += vy;
    t += randFloat(5, 15);
    pts.push({ x: xs, y: ys, t });
  }
  pts.push({ x: x1, y: y1, t: t + 8 });
  return pts;
}

export const meta = {
  id: 'wind',
  name: 'WindMouse',
  tag: 'HEURISTIC',
  tagClass: 'tag-heuristic',
  color: 'var(--wind)',
  desc: 'Simulates "wind" and "gravity" forces that push the cursor toward the target while adding natural-looking wobble. The dominant aim-assist algorithm for over a decade — visually convincing, but statistically detectable.',
  creditHtml: 'original algorithm by <a href="https://github.com/BenLand100" target="_blank">BenLand100</a> (Java) · JS port by <a href="https://github.com/arevi/wind-mouse" target="_blank">arevi</a> · reimplemented inline for browser compatibility',
};
