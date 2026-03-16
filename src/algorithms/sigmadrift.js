import { randFloat, randNormal, randGamma, lognormalCDF, lognormalPDF } from '../utils/math.js';

/**
 * SIGMADRIFT — biomechanical model
 * Algorithm & research by ck0i — https://zenodo.org/records/18872499
 * C++ source ported to JS for this visualizer.
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} speed  1–10 scale; scales fitts_b timing (faster speed = shorter MT)
 * @returns {Array<{x:number,y:number,t:number}>}
 */
export function genSigmaDrift(x0, y0, x1, y1, speed = 5) {
  // Speed 1 = slow (fitts_b×2.0), speed 10 = fast (fitts_b×0.6)
  const speedFactor = 2.0 - (speed - 1) / 9 * 1.4;

  const c = {
    fitts_a: 50, fitts_b: 150 * speedFactor, target_width: 20,
    undershoot_min: 0.92, undershoot_max: 0.97,
    peak_time_ratio: 0.35, primary_sigma_min: 0.18, primary_sigma_max: 0.28,
    overshoot_prob: 0.15, overshoot_min: 1.02, overshoot_max: 1.08,
    correction_sigma_min: 0.12, correction_sigma_max: 0.20,
    second_correction_prob: 0.25, curvature_scale: 0.025,
    ou_theta: 3.5, ou_sigma: 1.2,
    tremor_freq_min: 8, tremor_freq_max: 12,
    tremor_amp_min: 0.15, tremor_amp_max: 0.55,
    sdn_k: 0.04, sample_dt_mean: 7.8, gamma_shape: 3.5,
  };

  const dx = x1 - x0, dy = y1 - y0;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return [{ x: x0, y: y0, t: 0 }, { x: x1, y: y1, t: 50 }];

  const direction = Math.atan2(dy, dx);
  const tx = dx / distance, ty = dy / distance;
  const nx = -ty, ny = tx;

  const id = Math.log2(distance / c.target_width + 1);
  let mt = (c.fitts_a + c.fitts_b * id) * Math.exp(randNormal(0, 0.08));
  mt = Math.max(mt, 80);

  const overshoot = Math.random() < c.overshoot_prob;
  const reach = overshoot
    ? randFloat(c.overshoot_min, c.overshoot_max)
    : randFloat(c.undershoot_min, c.undershoot_max);

  const primaryD = distance * reach;
  const primarySigma = randFloat(c.primary_sigma_min, c.primary_sigma_max);
  const peakT = mt * randFloat(c.peak_time_ratio - 0.03, c.peak_time_ratio + 0.03);
  const primaryMu = Math.log(peakT) + primarySigma * primarySigma;

  const corrections = [];
  const remaining = distance - primaryD;
  if (Math.abs(remaining) > 0.5) {
    const dir = remaining > 0 ? 1 : -1;
    const cD = Math.abs(remaining) * randFloat(0.88, 1.02);
    const cS = randFloat(c.correction_sigma_min, c.correction_sigma_max);
    const cPeak = mt * randFloat(0.12, 0.18);
    const cT0 = mt * randFloat(0.55, 0.68);
    corrections.push({ D: cD, t0: cT0, mu: Math.log(cPeak) + cS * cS, sigma: cS, dirX: tx * dir, dirY: ty * dir });

    const left = remaining - cD * dir;
    if (Math.abs(left) > 0.3 && Math.random() < c.second_correction_prob) {
      const d2 = left > 0 ? 1 : -1;
      const cD2 = Math.abs(left) * randFloat(0.85, 1.05);
      const cS2 = randFloat(0.10, 0.16);
      const cP2 = mt * randFloat(0.08, 0.12);
      corrections.push({ D: cD2, t0: mt * randFloat(0.78, 0.88), mu: Math.log(cP2) + cS2 * cS2, sigma: cS2, dirX: tx * d2, dirY: ty * d2 });
    }
  }

  const sa = Math.abs(Math.sin(direction)), ca = Math.abs(Math.cos(direction));
  const dirFactor = 0.5 + 0.8 * sa - 0.15 * ca;
  const curvAmp = distance * c.curvature_scale * dirFactor * randNormal(0, 1);

  function curvatureProfile(s) {
    if (s <= 0 || s >= 1) return 0;
    const v = s * s * (1 - s) * (1 - s) * (1 - s);
    const norm = 0.4 * 0.4 * 0.6 * 0.6 * 0.6;
    return v / norm;
  }

  const tremorFreq = randFloat(c.tremor_freq_min, c.tremor_freq_max);
  const tremorAmp = randFloat(c.tremor_amp_min, c.tremor_amp_max);
  const tphX = randFloat(0, 2 * Math.PI), tphY = randFloat(0, 2 * Math.PI);
  let ouX = 0, ouY = 0;

  const totalT = mt * 1.15;
  const gScale = c.sample_dt_mean / c.gamma_shape;
  const times = [0];
  for (let t = 0; t < totalT;) {
    const dt = Math.min(Math.max(randGamma(c.gamma_shape, gScale), 2), 25);
    t += dt;
    if (t <= totalT + 15) times.push(t);
  }

  const pts = [];
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const dtMs = i > 0 ? (t - times[i - 1]) : c.sample_dt_mean;
    const dtS = dtMs / 1000;

    const s = lognormalCDF(t, 0, primaryMu, primarySigma);
    let bx = x0 + tx * primaryD * s;
    let by = y0 + ty * primaryD * s;

    bx += nx * curvAmp * curvatureProfile(s);
    by += ny * curvAmp * curvatureProfile(s);

    for (const cor of corrections) {
      const cs = lognormalCDF(t, cor.t0, cor.mu, cor.sigma);
      bx += cor.dirX * cor.D * cs;
      by += cor.dirY * cor.D * cs;
    }

    const speed2 = primaryD * lognormalPDF(t, 0, primaryMu, primarySigma)
      + corrections.reduce((acc, co) => acc + co.D * lognormalPDF(t, co.t0, co.mu, co.sigma), 0);

    ouX += -c.ou_theta * ouX * dtS + c.ou_sigma * Math.sqrt(dtS) * randNormal(0, 1);
    ouY += -c.ou_theta * ouY * dtS + c.ou_sigma * Math.sqrt(dtS) * randNormal(0, 1);

    const tS = t / 1000;
    const tremMod = 1 / (1 + speed2 * 0.3);
    const trX = tremorAmp * tremMod * Math.sin(2 * Math.PI * tremorFreq * tS + tphX);
    const trY = tremorAmp * tremMod * Math.sin(2 * Math.PI * tremorFreq * tS + tphY);

    const sdnX = c.sdn_k * speed2 * randNormal(0, 1);
    const sdnY = c.sdn_k * speed2 * randNormal(0, 1);

    pts.push({ x: bx + ouX + trX + sdnX, y: by + ouY + trY + sdnY, t });
  }
  return pts;
}

export const meta = {
  id: 'sigma',
  name: 'SigmaDrift',
  tag: 'BIOMECHANICAL',
  tagClass: 'tag-bio',
  color: 'var(--sigma)',
  desc: "A biomechanically-grounded model built on Plamondon's Kinematic Theory and six interacting motor control components: sigma-lognormal velocity primitives, Fitts' Law timing, Ornstein-Uhlenbeck drift, signal-dependent noise, physiological tremor, and gamma-distributed sampling intervals.",
  creditHtml: 'algorithm & research by <a href="https://github.com/ck0i" target="_blank">ck0i</a> · paper: <a href="https://zenodo.org/records/18872499" target="_blank">zenodo.org/records/18872499</a> · C++ source ported to JS for this visualizer',
};
