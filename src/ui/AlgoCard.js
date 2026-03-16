/**
 * AlgoCard — info + credit card for one algorithm.
 * @param {Object} meta  — from algorithms/index.js
 * @returns {HTMLElement}
 */
export function createAlgoCard(meta) {
  const card = document.createElement('div');
  card.className = 'algo-card';
  card.id = `card-${meta.id}`;
  card.innerHTML = `
    <div class="card-top">
      <div class="card-name" style="color:${meta.color}">${meta.name}</div>
      <div class="card-tag ${meta.tagClass}">${meta.tag}</div>
    </div>
    <div class="card-desc">${meta.desc}</div>
    <div class="card-credit">${meta.creditHtml}</div>
  `;
  return card;
}
