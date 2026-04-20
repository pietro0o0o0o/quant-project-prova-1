/**
 * backtest.js — Moving Average crossover backtesting engine
 * Depends on: utils.js, Chart.js (global)
 */

import { generateGBMPath, calcMA, calcDrawdown, maxDrawdown, sharpeRatio } from './utils.js';

let priceChartInst  = null;
let equityChartInst = null;

/**
 * Run the backtest and render results into the DOM
 */
export function runBacktest() {
  const S0    = +document.getElementById('bt-S0').value;
  const fast  = +document.getElementById('bt-fast').value;
  const slow  = +document.getElementById('bt-slow').value;
  const sigma = +document.getElementById('bt-vol').value / 100;
  const days  = +document.getElementById('bt-days').value;
  const mu    = 0.07; // fixed annual drift for synthetic data

  // --- Generate synthetic price data ---
  const prices = generateGBMPath(S0, mu, sigma, days);
  const maFast = calcMA(prices, fast);
  const maSlow = calcMA(prices, slow);

  // --- Strategy execution ---
  let cash = 10_000, shares = 0, inPosition = false;
  let entryPrice = 0, entryDay = 0;
  const equity = [cash];
  const bh     = prices.map(p => (10_000 / S0) * p); // Buy & Hold baseline
  const trades = []; // { day, type: 'BUY'|'SELL', price, pnl }

  for (let i = slow; i < days; i++) {
    const crossUp   = maFast[i] > maSlow[i] && maFast[i - 1] <= maSlow[i - 1];
    const crossDown = maFast[i] < maSlow[i] && maFast[i - 1] >= maSlow[i - 1];

    if (!inPosition && crossUp) {
      shares = cash / prices[i];
      cash = 0;
      inPosition = true;
      entryPrice = prices[i];
      entryDay   = i;
      trades.push({ day: i, type: 'BUY', price: prices[i], pnl: null });
    } else if (inPosition && crossDown) {
      cash = shares * prices[i];
      const pnl = (prices[i] - entryPrice) / entryPrice * 100;
      trades.push({ day: i, type: 'SELL', price: prices[i], pnl });
      shares = 0;
      inPosition = false;
    }

    equity.push(inPosition ? shares * prices[i] : cash);
  }
  if (inPosition) equity.push(shares * prices[days - 1]);

  // --- Performance metrics ---
  const totalReturn = equity[equity.length - 1] / equity[0] - 1;
  const bhReturn    = bh[bh.length - 1] / bh[0] - 1;
  const alpha       = totalReturn - bhReturn;
  const dd          = calcDrawdown(equity);
  const mdd         = maxDrawdown(dd);

  const dailyReturns = equity.slice(1).map((v, i) => v / equity[i] - 1);
  const dailyMean    = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const dailyStd     = Math.sqrt(dailyReturns.reduce((a, b) => a + (b - dailyMean) ** 2, 0) / dailyReturns.length);
  const annualisedSharpe = (dailyMean / dailyStd) * Math.sqrt(252);

  const sellTrades = trades.filter(t => t.type === 'SELL');
  const wins       = sellTrades.filter(t => t.pnl > 0).length;
  const winRate    = sellTrades.length ? wins / sellTrades.length : 0;

  // --- Update metrics cards ---
  document.getElementById('bt-metrics').innerHTML = `
    <div class="metric">
      <div class="label">Rendimento totale</div>
      <div class="value ${totalReturn >= 0 ? 'positive' : 'negative'}">${(totalReturn * 100).toFixed(1)}%</div>
      <div class="sub">vs B&H: ${(bhReturn * 100).toFixed(1)}%</div>
    </div>
    <div class="metric">
      <div class="label">Sharpe ratio</div>
      <div class="value">${annualisedSharpe.toFixed(2)}</div>
      <div class="sub">annualizzato</div>
    </div>
    <div class="metric">
      <div class="label">Max drawdown</div>
      <div class="value negative">${(mdd * 100).toFixed(1)}%</div>
    </div>
    <div class="metric">
      <div class="label">N° trade</div>
      <div class="value">${sellTrades.length}</div>
      <div class="sub">segnali eseguiti</div>
    </div>
    <div class="metric">
      <div class="label">Win rate</div>
      <div class="value ${winRate >= 0.5 ? 'positive' : 'negative'}">${(winRate * 100).toFixed(0)}%</div>
    </div>
    <div class="metric">
      <div class="label">Alpha vs B&H</div>
      <div class="value ${alpha >= 0 ? 'positive' : 'negative'}">${(alpha * 100).toFixed(1)}%</div>
    </div>
  `;

  // --- Price chart with MA lines and trade signals ---
  const labels       = Array.from({ length: days }, (_, i) => i);
  const buySignals   = prices.map((p, i) => trades.find(t => t.day === i && t.type === 'BUY')  ? p : null);
  const sellSignals  = prices.map((p, i) => trades.find(t => t.day === i && t.type === 'SELL') ? p : null);

  if (priceChartInst) priceChartInst.destroy();
  priceChartInst = new Chart(document.getElementById('btPriceChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Prezzo',    data: prices,      borderColor: '#3266ad', borderWidth: 1.5, pointRadius: 0, tension: 0.2, order: 3 },
        { label: 'MA veloce', data: maFast,      borderColor: '#E24B4A', borderWidth: 1,   pointRadius: 0, borderDash: [3, 2], order: 2 },
        { label: 'MA lenta',  data: maSlow,      borderColor: '#1D9E75', borderWidth: 1,   pointRadius: 0, borderDash: [6, 3], order: 1 },
        { label: 'Buy',  data: buySignals,  type: 'scatter', pointStyle: 'triangle', pointRadius: 8, backgroundColor: '#1D9E75', borderColor: '#1D9E75', order: 0 },
        { label: 'Sell', data: sellSignals, type: 'scatter', pointStyle: 'triangle', rotation: 180, pointRadius: 8, backgroundColor: '#E24B4A', borderColor: '#E24B4A', order: 0 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 6, color: '#888' }, grid: { display: false } },
        y: { ticks: { color: '#888', callback: v => '€' + v.toFixed(0) }, grid: { color: 'rgba(128,128,128,0.1)' } },
      },
    },
  });

  // --- Equity curve chart ---
  if (equityChartInst) equityChartInst.destroy();
  equityChartInst = new Chart(document.getElementById('btEquityChart'), {
    type: 'line',
    data: {
      labels: labels.slice(0, equity.length),
      datasets: [
        { label: 'Strategia',  data: equity, borderColor: '#3266ad', borderWidth: 2,   pointRadius: 0, tension: 0.3, fill: { target: 'origin', above: 'rgba(50,102,173,0.06)' } },
        { label: 'Buy & Hold', data: bh,     borderColor: '#888',    borderWidth: 1.5, pointRadius: 0, borderDash: [4, 3] },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 6, color: '#888' }, grid: { display: false } },
        y: { ticks: { color: '#888', callback: v => '€' + v.toFixed(0) }, grid: { color: 'rgba(128,128,128,0.1)' } },
      },
    },
  });

  // --- Trade log table ---
  const lastTrades = sellTrades.slice(-6).reverse();
  document.getElementById('bt-trades').innerHTML = `
    <table class="trade-table">
      <thead>
        <tr>
          <th>Giorno entrata</th><th>Giorno uscita</th><th>Tipo</th>
          <th>Prezzo entrata</th><th>Prezzo uscita</th><th>P&amp;L</th>
        </tr>
      </thead>
      <tbody>
        ${lastTrades.map(t => {
          const buy = trades.find(b => b.type === 'BUY' && b.day < t.day);
          return `<tr>
            <td>${buy ? buy.day : '-'}</td>
            <td>${t.day}</td>
            <td><span class="badge long">LONG</span></td>
            <td>€${buy ? buy.price.toFixed(2) : '-'}</td>
            <td>€${t.price.toFixed(2)}</td>
            <td class="${t.pnl >= 0 ? 'positive' : 'negative'}">${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(1)}%</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}
