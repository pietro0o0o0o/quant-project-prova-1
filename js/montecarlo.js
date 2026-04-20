/**
 * montecarlo.js — Monte Carlo simulation module
 * Depends on: utils.js, Chart.js (global)
 */

import { randn, generateGBMPath, sharpeRatio } from './utils.js';

let chartInstance = null;

/**
 * Run a Monte Carlo simulation and render results into the DOM
 */
export function runMonteCarlo() {
  const S0    = +document.getElementById('mc-S0').value;
  const mu    = +document.getElementById('mc-mu').value / 100;
  const sigma = +document.getElementById('mc-sigma').value / 100;
  const N     = +document.getElementById('mc-N').value;
  const T     = +document.getElementById('mc-T').value;

  // --- Simulate all paths ---
  const paths = Array.from({ length: N }, () => generateGBMPath(S0, mu, sigma, T + 1));

  // --- Summary statistics on final prices ---
  const finals = paths.map(p => p[T]).sort((a, b) => a - b);
  const get = pct => finals[Math.floor(N * pct)];
  const mean = finals.reduce((a, b) => a + b, 0) / N;

  const med  = get(0.5);
  const p25  = get(0.25);
  const p75  = get(0.75);
  const p5   = get(0.05);
  const p95  = get(0.95);
  const prob = finals.filter(v => v > S0).length / N;
  const sr   = sharpeRatio(mu, sigma);

  // --- Update metrics cards ---
  const sign = v => v >= S0 ? 'positive' : 'negative';
  document.getElementById('mc-metrics').innerHTML = `
    <div class="metric">
      <div class="label">Prezzo mediano</div>
      <div class="value">€${med.toFixed(1)}</div>
      <div class="sub">dopo ${T} giorni</div>
    </div>
    <div class="metric">
      <div class="label">Rendimento atteso</div>
      <div class="value ${sign(mean)}">${((mean / S0 - 1) * 100).toFixed(1)}%</div>
      <div class="sub">media simulazioni</div>
    </div>
    <div class="metric">
      <div class="label">VaR 95%</div>
      <div class="value negative">-€${(S0 - p5).toFixed(1)}</div>
      <div class="sub">perdita max 95% conf.</div>
    </div>
    <div class="metric">
      <div class="label">P(profitto)</div>
      <div class="value ${prob >= 0.5 ? 'positive' : 'negative'}">${(prob * 100).toFixed(1)}%</div>
      <div class="sub">prob. sopra entry</div>
    </div>
    <div class="metric">
      <div class="label">Sharpe ratio</div>
      <div class="value">${sr.toFixed(2)}</div>
      <div class="sub">rf = 2%</div>
    </div>
    <div class="metric">
      <div class="label">Range 5°–95°</div>
      <div class="value">€${p5.toFixed(0)}–${p95.toFixed(0)}</div>
      <div class="sub">intervallo di confidenza</div>
    </div>
  `;

  // --- Build chart datasets ---
  const labels = Array.from({ length: T + 1 }, (_, i) => i);

  // Percentile path helper
  const pctPath = pct => labels.map(t => {
    const vals = paths.map(p => p[t]).sort((a, b) => a - b);
    return vals[Math.floor(N * pct)];
  });

  const datasets = [];

  // Individual paths (capped at 80 for performance)
  paths.slice(0, Math.min(80, N)).forEach(p => {
    datasets.push({
      data: p,
      borderColor: 'rgba(50,102,173,0.12)',
      borderWidth: 1,
      pointRadius: 0,
      tension: 0.3,
    });
  });

  datasets.push({ data: pctPath(0.5),  borderColor: '#E24B4A', borderWidth: 2.5, pointRadius: 0, label: 'Mediana', tension: 0.3 });
  datasets.push({ data: pctPath(0.75), borderColor: '#1D9E75', borderWidth: 2,   pointRadius: 0, label: '75°', tension: 0.3, borderDash: [4, 3] });
  datasets.push({ data: pctPath(0.25), borderColor: '#BA7517', borderWidth: 2,   pointRadius: 0, label: '25°', tension: 0.3, borderDash: [4, 3] });

  // --- Render chart ---
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(document.getElementById('mcChart'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          filter: item => item.datasetIndex >= Math.min(80, N),
          callbacks: { label: ctx => `${ctx.dataset.label}: €${ctx.parsed.y.toFixed(2)}` },
        },
      },
      scales: {
        x: { ticks: { maxTicksLimit: 8, color: '#888' }, grid: { display: false } },
        y: { ticks: { color: '#888', callback: v => '€' + v.toFixed(0) }, grid: { color: 'rgba(128,128,128,0.1)' } },
      },
    },
  });
}
