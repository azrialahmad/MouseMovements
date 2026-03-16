import { drawGrid, drawTarget, drawCrosshair, drawTrail } from './draw.js';

// ─── rAF Animator ────────────────────────────────────────────

const handles = {}; // key → rAF id

/**
 * Animate a single path on `ctx`.
 * @param {string} key
 * @param {Array} pts
 * @param {string} color
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x, y }} target   current target position
 * @param {number} targetRadius
 * @param {Function} [onDone]
 */
export function animatePath(key, pts, color, ctx, target, targetRadius, onDone) {
  if (handles[key]) cancelAnimationFrame(handles[key]);

  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const totalTime = pts[pts.length - 1].t - pts[0].t;
  const startReal = performance.now();

  function frame(now) {
    const elapsed = now - startReal;
    const progress = Math.min(elapsed / totalTime, 1);

    ctx.clearRect(0, 0, W, H);
    drawGrid(ctx, W, H);
    drawTrail(ctx, pts, color, progress);
    drawTarget(ctx, target.x, target.y, targetRadius, color);
    const i = Math.max(0, Math.round(progress * (pts.length - 1)));
    drawCrosshair(ctx, pts[i].x, pts[i].y, color);

    if (progress < 1) {
      handles[key] = requestAnimationFrame(frame);
    } else {
      drawCrosshair(ctx, pts[pts.length - 1].x, pts[pts.length - 1].y, color);
      if (onDone) onDone();
    }
  }

  handles[key] = requestAnimationFrame(frame);
}

/**
 * Cancel any running animation for `key`.
 */
export function cancelAnim(key) {
  if (handles[key]) { cancelAnimationFrame(handles[key]); delete handles[key]; }
}

// ─── Loop Controller ─────────────────────────────────────────

/**
 * Manages the optional auto-loop mode.
 * Call `start(runFn)` to begin looping; `stop()` to end.
 * `runFn` is called immediately and should call `notifyDone()` when all
 * animations finish so the controller can schedule the next cycle.
 */
export class LoopController {
  constructor() {
    this._active = false;
    this._timer = null;
    this._runFn = null;
  }

  get active() { return this._active; }

  start(runFn) {
    this._active = true;
    this._runFn = runFn;
    this._schedule();
  }

  stop() {
    this._active = false;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  }

  /** Call this after all animations in a cycle have completed. */
  notifyDone() {
    if (!this._active) return;
    // Short pause between loop iterations so it doesn't feel frantic
    this._timer = setTimeout(() => {
      if (this._active) this._runFn();
    }, 600);
  }

  _schedule() {
    if (this._active && this._runFn) this._runFn();
  }
}
