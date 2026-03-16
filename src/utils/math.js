// ─── Math helpers ────────────────────────────────────────────
export function randFloat(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

export function randNormal(mean = 0, std = 1) {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function randGamma(shape, scale) {
  // Marsaglia & Tsang method
  if (shape < 1) return randGamma(1 + shape, scale) * Math.pow(Math.random(), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x, v;
    do { x = randNormal(0, 1); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v * scale;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale;
  }
}

export function normalCDF(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return 0.5 * (1 + (x >= 0 ? erf : -erf));
}

export function lognormalCDF(t, t0, mu, sigma) {
  if (t <= t0) return 0;
  return normalCDF((Math.log(t - t0) - mu) / sigma);
}

export function lognormalPDF(t, t0, mu, sigma) {
  if (t <= t0) return 0;
  const dt = t - t0;
  const z = (Math.log(dt) - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI) * dt);
}
