import { ALGOS } from './algorithms/index.js';
import { computeMetrics } from './utils/metrics.js';
import { drawGrid, drawTarget, drawCrosshair } from './canvas/draw.js';
import { drawGraphIdle, drawVelocityGraph } from './canvas/graph.js';
import { animatePath, LoopController } from './canvas/animator.js';
import { createAlgoCard } from './ui/AlgoCard.js';
import { createSpeedSlider } from './ui/SpeedSlider.js';
import { createLoopToggle } from './ui/LoopToggle.js';
import { createStatsBar } from './ui/StatsBar.js';

// ─── Color map derived from ALGOS registry ───────────────────
const COLOR_MAP = Object.fromEntries(ALGOS.map(a => [a.id, `var(--${a.id})`]));
// Resolved values for canvas (CSS vars need resolving manually)
const CANVAS_COLORS = {
  linear: '#4ade80',
  wind:   '#fb923c',
  sigma:  '#818cf8',
};

const TARGET_RADIUS = 18;
const CANVAS_H = 220;
const GRAPH_H = 110;

export function mount(root) {
  // ── BUILD DOM ──────────────────────────────────────────────
  root.innerHTML = `
    <div class="mm-wrap">
      <header class="mm-header">
        <div>
          <div class="mm-logo">Mouse<span>Movements</span></div>
          <div class="mm-tagline">Mouse movement algorithm visualizer</div>
        </div>
        <div class="mm-badges">
          <span class="mm-badge">v2.0</span>
          <span class="mm-badge">${ALGOS.length} algorithms</span>
        </div>
      </header>

      <div class="mm-layout">
        <!-- LEFT -->
        <div class="mm-left">
          <div class="mm-panel">
            <div class="mm-panel-head">
              <span class="mm-panel-title">Side-by-side canvas</span>
              <span class="mm-hint-inline">click canvas to place target</span>
            </div>
            <div class="mm-panel-body">
              <div class="mm-canvases" id="canvases-row"></div>
              <div class="mm-graph-wrap">
                <canvas id="c-graph" height="${GRAPH_H}"></canvas>
                <div class="mm-graph-legend" id="graph-legend"></div>
              </div>
              <div id="stats-bar-mount"></div>
            </div>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="mm-right">
          <div class="mm-panel">
            <div class="mm-panel-head"><span class="mm-panel-title">Controls</span></div>
            <div class="mm-panel-body">
              <div id="speed-slider-mount"></div>
              <div id="loop-toggle-mount" style="margin-top:10px"></div>
              <button class="mm-btn-run" id="btn-run">▶  RUN ALL</button>
            </div>
          </div>

          <div class="mm-panel">
            <div class="mm-panel-head"><span class="mm-panel-title">Algorithms</span></div>
            <div class="mm-panel-body">
              <div class="mm-algo-cards" id="algo-cards"></div>
            </div>
          </div>
        </div>
      </div>

      <footer class="mm-footer">
        <span>mousemovement visualizer — educational demo</span>
        <span>windmouse by <a href="https://github.com/BenLand100" target="_blank">BenLand100</a> &amp;
          <a href="https://github.com/arevi" target="_blank">arevi</a> ·
          sigmadrift by <a href="https://github.com/ck0i" target="_blank">ck0i</a>
        </span>
      </footer>
    </div>
  `;

  // ── CANVASES ───────────────────────────────────────────────
  const canvasesRow = root.querySelector('#canvases-row');
  const canvasEls = {};
  const ctxs = {};

  for (const algo of ALGOS) {
    const wrap = document.createElement('div');
    wrap.className = 'mm-canvas-wrap';
    const canvas = document.createElement('canvas');
    canvas.id = `c-${algo.id}`;
    canvas.height = CANVAS_H;
    const lbl = document.createElement('div');
    lbl.className = `mm-canvas-label lbl-${algo.id}`;
    lbl.textContent = algo.name.toUpperCase();
    const status = document.createElement('div');
    status.className = 'mm-canvas-status';
    status.id = `st-${algo.id}`;
    status.textContent = 'ready';
    wrap.append(canvas, lbl, status);
    canvasesRow.appendChild(wrap);
    canvasEls[algo.id] = canvas;
    ctxs[algo.id] = canvas.getContext('2d');
  }

  // Graph canvas
  const graphCanvas = root.querySelector('#c-graph');
  const graphCtx = graphCanvas.getContext('2d');

  // Graph legend
  const legend = root.querySelector('#graph-legend');
  for (const algo of ALGOS) {
    const item = document.createElement('div');
    item.className = 'mm-legend-item';
    item.innerHTML = `<div class="mm-legend-dot" style="background:${CANVAS_COLORS[algo.id]}"></div>${algo.name.toLowerCase()}`;
    legend.appendChild(item);
  }

  // ── UI COMPONENTS ──────────────────────────────────────────
  const { el: speedEl, getValue: getSpeed } = createSpeedSlider(() => {});
  root.querySelector('#speed-slider-mount').appendChild(speedEl);

  const loopCtrl = new LoopController();
  const { el: loopEl } = createLoopToggle((on) => {
    if (on) { loopCtrl.start(runAll); }
    else     { loopCtrl.stop(); }
  });
  root.querySelector('#loop-toggle-mount').appendChild(loopEl);

  const { el: statsEl, update: updateStats } = createStatsBar(ALGOS);
  root.querySelector('#stats-bar-mount').appendChild(statsEl);

  const cardsWrap = root.querySelector('#algo-cards');
  for (const algo of ALGOS) cardsWrap.appendChild(createAlgoCard(algo));

  // ── STATE ─────────────────────────────────────────────────
  let W = 0;
  let target = { x: 0, y: 0 };
  let start  = { x: 0, y: 0 };
  let lastPts = {};

  // ── RESIZE ────────────────────────────────────────────────
  function resize() {
    const w = canvasEls[ALGOS[0].id].parentElement.clientWidth;
    W = w;
    for (const algo of ALGOS) {
      canvasEls[algo.id].width = w;
      canvasEls[algo.id].height = CANVAS_H;
    }
    graphCanvas.width = graphCanvas.parentElement.clientWidth;
    graphCanvas.height = GRAPH_H;

    target = { x: Math.round(W * 0.75), y: Math.round(CANVAS_H * 0.5) };
    start  = { x: Math.round(W * 0.15), y: Math.round(CANVAS_H * 0.5) };
    drawIdle();
  }

  function drawIdle() {
    for (const algo of ALGOS) {
      const ctx = ctxs[algo.id];
      ctx.clearRect(0, 0, W, CANVAS_H);
      drawGrid(ctx, W, CANVAS_H);
      drawTarget(ctx, target.x, target.y, TARGET_RADIUS, CANVAS_COLORS[algo.id]);
      drawCrosshair(ctx, start.x, start.y, CANVAS_COLORS[algo.id]);
    }
    drawGraphIdle(graphCtx, graphCanvas.width, GRAPH_H);
  }

  // ── RUN ALL ───────────────────────────────────────────────
  function runAll() {
    const speed = getSpeed();
    const dist = Math.hypot(target.x - start.x, target.y - start.y);

    // Generate paths
    const ptsMap = {};
    for (const algo of ALGOS) {
      ptsMap[algo.id] = algo.gen(start.x, start.y, target.x, target.y, speed);
    }
    lastPts = ptsMap;

    // Compute + display metrics
    const metricsMap = {};
    for (const algo of ALGOS) {
      metricsMap[algo.id] = computeMetrics(ptsMap[algo.id], dist);
    }
    updateStats(metricsMap);

    // Status labels
    for (const algo of ALGOS) {
      const st = root.querySelector(`#st-${algo.id}`);
      if (st) st.textContent = 'running…';
    }

    // Animate — track when all are done for loop mode
    let doneCount = 0;
    function onAlgoDone() {
      doneCount++;
      if (doneCount === ALGOS.length) {
        drawVelocityGraph(ptsMap, CANVAS_COLORS, graphCtx);

        // Advance start → where the algorithms ended (use sigma as reference)
        const refAlgo = ALGOS[ALGOS.length - 1];
        const refPts = ptsMap[refAlgo.id];
        if (refPts?.length) {
          start = {
            x: Math.round(refPts[refPts.length - 1].x),
            y: Math.round(refPts[refPts.length - 1].y),
          };
        }

        // Pick a fresh random target so the next loop iteration goes somewhere new
        if (loopCtrl.active) {
          target = {
            x: Math.round(W * (0.12 + Math.random() * 0.76)),
            y: Math.round(CANVAS_H * (0.12 + Math.random() * 0.76)),
          };
        }

        loopCtrl.notifyDone();
      }
    }

    for (const algo of ALGOS) {
      animatePath(
        algo.id,
        ptsMap[algo.id],
        CANVAS_COLORS[algo.id],
        ctxs[algo.id],
        target,
        TARGET_RADIUS,
        () => {
          const st = root.querySelector(`#st-${algo.id}`);
          if (st) st.textContent = 'done';
          onAlgoDone();
        },
      );
    }
  }

  // ── CANVAS CLICK — place target ───────────────────────────
  for (const algo of ALGOS) {
    canvasEls[algo.id].addEventListener('click', (e) => {
      const rect = canvasEls[algo.id].getBoundingClientRect();
      const scaleX = canvasEls[algo.id].width / rect.width;
      const scaleY = canvasEls[algo.id].height / rect.height;
      target = {
        x: Math.round((e.clientX - rect.left) * scaleX),
        y: Math.round((e.clientY - rect.top) * scaleY),
      };
      runAll();
    });
  }

  // ── RUN BUTTON ────────────────────────────────────────────
  root.querySelector('#btn-run').addEventListener('click', () => {
    // Randomise target position on manual run for variety
    target = {
      x: Math.round(W * (0.25 + Math.random() * 0.5)),
      y: Math.round(CANVAS_H * (0.2 + Math.random() * 0.6)),
    };
    runAll();
  });

  // ── INIT ─────────────────────────────────────────────────
  window.addEventListener('resize', () => { lastPts = {}; resize(); });
  resize();
}
