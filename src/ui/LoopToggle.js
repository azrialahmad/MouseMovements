/**
 * LoopToggle — button that toggles auto-loop on/off.
 * @param {Function} onToggle  called with boolean (active state)
 * @returns {{ el: HTMLElement, isActive: () => boolean }}
 */
export function createLoopToggle(onToggle) {
  let active = false;

  const btn = document.createElement('button');
  btn.id = 'btn-loop';
  btn.className = 'btn-loop';
  btn.setAttribute('aria-pressed', 'false');
  btn.textContent = '⟳  AUTO LOOP';

  btn.addEventListener('click', () => {
    active = !active;
    btn.setAttribute('aria-pressed', String(active));
    btn.classList.toggle('active', active);
    onToggle(active);
  });

  return {
    el: btn,
    isActive: () => active,
  };
}
