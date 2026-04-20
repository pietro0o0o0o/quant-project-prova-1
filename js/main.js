/**
 * main.js — Entry point: tab routing, slider bindings, initial render
 */

import { runMonteCarlo } from './montecarlo.js';
import { runBacktest }   from './backtest.js';
import { runRisk }       from './risk.js';

// Track which panels have been initialised
const initialised = { mc: false, bt: false, risk: false };

// --- Tab switching ---
window.switchTab = function (id) {
  document.querySelectorAll('.tab').forEach((el, i) => {
    el.classList.toggle('active', ['mc', 'bt', 'risk'][i] === id);
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');

  if (id === 'mc'   && !initialised.mc)   { runMonteCarlo(); initialised.mc   = true; }
  if (id === 'bt'   && !initialised.bt)   { runBacktest();   initialised.bt   = true; }
  if (id === 'risk' && !initialised.risk) { runRisk();       initialised.risk = true; }
};

// --- Expose run functions to HTML buttons ---
window.runMC = function () { runMonteCarlo(); initialised.mc = true; };
window.runBT = function () { runBacktest();   initialised.bt = true; };

// --- Slider utility ---
function bindSlider(id, fmt) {
  const el  = document.getElementById(id);
  const out = document.getElementById(id + '-v');
  const update = () => { out.textContent = fmt ? fmt(+el.value) : el.value; };
  el.addEventListener('input', update);
  update();
}

// Monte Carlo sliders
bindSlider('mc-S0');
bindSlider('mc-mu',    v => v + '%');
bindSlider('mc-sigma', v => v + '%');
bindSlider('mc-N');
bindSlider('mc-T');

// Backtest sliders
bindSlider('bt-S0');
bindSlider('bt-fast');
bindSlider('bt-slow');
bindSlider('bt-vol',  v => v + '%');
bindSlider('bt-days');

// Risk sliders
bindSlider('r-mu',    v => v + '%');
bindSlider('r-sigma', v => v + '%');
bindSlider('r-port',  v => (+v / 1000).toFixed(0) + 'k');
bindSlider('r-var');

// Auto-rerun risk panel on slider change (instant feedback)
['r-mu', 'r-sigma', 'r-port', 'r-var'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    if (initialised.risk) runRisk();
  });
});

// --- Initial render (Monte Carlo tab is default) ---
runMonteCarlo();
initialised.mc = true;
