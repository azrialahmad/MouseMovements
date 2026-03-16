/**
 * SpeedSlider — the one shared control.
 * @param {Function} onChange  called with new numeric value on input
 * @returns {{ el: HTMLElement, getValue: () => number }}
 */
export function createSpeedSlider(onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'control-row';
  wrap.innerHTML = `
    <span class="control-label">speed</span>
    <input type="range" id="sl-speed" min="1" max="10" step="1" value="5" />
    <span class="control-value" id="vl-speed">5</span>
  `;

  const input = wrap.querySelector('#sl-speed');
  const display = wrap.querySelector('#vl-speed');

  input.addEventListener('input', () => {
    display.textContent = input.value;
    onChange(parseInt(input.value));
  });

  return {
    el: wrap,
    getValue: () => parseInt(input.value),
  };
}
