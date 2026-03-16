/**
 * StatsBar — displays metrics for all algorithms after a run.
 * @param {Array} algos  — ALGOS array from algorithms/index.js
 * @returns {{ el: HTMLElement, update: (metricsMap: Object) => void }}
 */
export function createStatsBar(algos) {
  const grid = document.createElement('div');
  grid.className = 'stats-grid';

  // 3 rows × algos.length cols
  const rows = [
    { key: 'mt',       label: 'move time',      fmt: v => v + 'ms' },
    { key: 'subMov',   label: 'sub-movements',  fmt: v => v },
    { key: 'efficiency', label: 'path efficiency', fmt: v => v },
  ];

  // Build cells keyed by algo id + metric key
  const cells = {};
  for (const row of rows) {
    for (const algo of algos) {
      const block = document.createElement('div');
      block.className = 'stat-block';
      const valEl = document.createElement('div');
      valEl.className = 'stat-val';
      valEl.style.color = algo.color;
      valEl.textContent = '—';
      const lblEl = document.createElement('div');
      lblEl.className = 'stat-lbl';
      lblEl.textContent = row.label;
      const algoEl = document.createElement('div');
      algoEl.className = 'stat-algo';
      algoEl.style.color = algo.color;
      algoEl.textContent = algo.name.toLowerCase();
      block.append(valEl, lblEl, algoEl);
      grid.appendChild(block);
      cells[`${algo.id}_${row.key}`] = { el: valEl, fmt: row.fmt };
    }
  }

  function update(metricsMap) {
    for (const [id, metrics] of Object.entries(metricsMap)) {
      for (const row of rows) {
        const cell = cells[`${id}_${row.key}`];
        if (cell && metrics[row.key] !== undefined) {
          cell.el.textContent = cell.fmt(metrics[row.key]);
        }
      }
    }
  }

  return { el: grid, update };
}
