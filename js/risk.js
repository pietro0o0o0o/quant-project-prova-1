/**
 * risk.js — Risk analysis module
 * Covers: VaR (parametric), CVaR, Sharpe, Sortino, Calmar, return distribution, drawdown chart
 * Depends on: utils.js, Chart.js (global)
 */

import { generateGBMPath, calcDrawdown, normalPdf } from './utils.js';

let distChartInst = null;
let ddChartInst   = null;

/**
 * Run risk analysis and render results into the DOM
 */
export function runRisk() {
  const mu      = +document.getElementById('r-mu').value / 100;
  const sigma   = +document.getElementById('r-sigma').value / 100;
  const port    = +document.getElementById('r-port').value;
  const varDays = +document.getElementById('r-var').value;

  // Daily parameters
  const dailyMu    = mu / 252;
  const dailySigma = sigma / Math.sqrt(252);

  // --- Parametric VaR / CVaR ---
  const var95  = dailyMu * varDays - 1.645 * dailySigma * Math.sqrt(varDays);
  const var99  = dailyMu * varDays - 2.326 * dailySigma * Math.sqrt(varDays);
  const cvar95 = dailyMu * varDays - 2.063 * dailySigma * Math.sqrt(varDays); // E[loss | loss > VaR95]

  // --- Ratio metrics ---
  const sharpe  = (mu - 0.02) / sigma;
  const sortino = mu / (sigma * 0.7);   // downside deviation ≈ 0.7 * sigma (heuristic)
  const calmar  = mu / (sigma * 2.5);   // estimated max drawdown ≈ 2.5 * sigma (heuristic)

  // --- Metrics cards ---
  document.getElementById('risk-metrics').innerHTML = `
    <div class="metric">
      <div class="label">VaR 95% (${varDays}g)</div>
      <div class="value negative">-€${(-var95 * port).toFixed(0)}</div>
      <div class="sub">${(var95 * 100).toFixed(2)}% del portafoglio</div>
    </div>
    <div class="metric">
      <div class="label">VaR 99% (${varDays}g)</div>
      <div class="value negative">-€${(-var99 * port).toFixed(0)}</div>
      <div class="sub">${(var99 * 100).toFixed(2)}%</div>
    </div>
    <div class="metric">
      <div class="label">CVaR 95%</div>
      <div class="value negative">-€${(-cvar95 * port).toFixed(0)}</div>
      <div class="sub">expected shortfall</div>
    </div>
    <div class="metric">
      <div class="label">Sharpe ratio</div>
      <div class="value">${sharpe.toFixed(2)}</div>
    </div>
    <div class="metric">
      <div class="label">Sortino ratio</div>
      <div class="value">${sortino.toFixed(2)}</div>
    </div>
    <div class="metric">
      <div class="label">Calmar ratio</div>
      <div class="value">${calmar.toFixed(2)}</div>
    </div>
  `;

  // --- Return distribution histogram ---
  const bins  = 40;
  const zMin  = -4, zMax = 4;
  const step  = (zMax - zMin) / bins;

  const binLabels = Array.from({ length: bins }, (_, i) => {
    const z = zMin + i * step;
    return (z * dailySigma * 100 + dailyMu * 100).toFixed(2);
  });

  const pdfData = Array.from({ length: bins }, (_, i) => {
    const z = zMin + i * step;
    const x = z * dailySigma + dailyMu;
    return normalPdf(x, dailyMu, dailySigma) * step * 100;
  });

  const barColors = binLabels.map(v => (+v / 100) < var95 ? 'rgba(218,90,48,0.7)' : 'rgba(50,102,173,0.6)');

  if (distChartInst) distChartInst.destroy();
  distChartInst = new Chart(document.getElementById('riskDistChart'), {
    type: 'bar',
    data: {
      labels: binLabels,
      datasets: [{ label: 'Prob. densità', data: pdfData, backgroundColor: barColors, borderWidth: 0 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `Densità: ${ctx.parsed.y.toFixed(3)}` } },
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 6, color: '#888', callback: v => v + '%' },
          grid: { display: false },
        },
        y: {
          ticks: { color: '#888' },
          grid: { color: 'rgba(128,128,128,0.1)' },
          title: { display: true, text: 'Densità', color: '#888', font: { size: 11 } },
        },
      },
    },
  });

  // --- Drawdown chart (simulated path) ---
  const simPrices = generateGBMPath(100, mu, sigma, 500);
  const dd        = calcDrawdown(simPrices).map(v => v * 100); // convert to percentage

  if (ddChartInst) ddChartInst.destroy();
  ddChartInst = new Chart(document.getElementById('riskDdChart'), {
    type: 'line',
    data: {
      labels: Array.from({ length: 500 }, (_, i) => i),
      datasets: [{
        label: 'Drawdown',
        data: dd,
        borderColor: '#E24B4A',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: { target: 'origin', below: 'rgba(218,90,48,0.1)' },
        tension: 0.2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 6, color: '#888' }, grid: { display: false } },
        y: { ticks: { color: '#888', callback: v => v.toFixed(0) + '%' }, grid: { color: 'rgba(128,128,128,0.1)' } },
      },
    },
  });
}
