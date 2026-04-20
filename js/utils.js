/**
 * utils.js — Math helpers for quantitative finance calculations
 */

/**
 * Box-Muller transform: returns a standard normal random variable Z ~ N(0,1)
 */
export function randn() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Simulate a single price path using Geometric Brownian Motion
 * S(t+dt) = S(t) * exp((mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z)
 *
 * @param {number} S0     - Initial price
 * @param {number} mu     - Annual drift (e.g. 0.08 for 8%)
 * @param {number} sigma  - Annual volatility (e.g. 0.20 for 20%)
 * @param {number} days   - Number of trading days to simulate
 * @returns {number[]}    - Array of prices, length = days
 */
export function generateGBMPath(S0, mu, sigma, days) {
  const dt = 1 / 252;
  const prices = [S0];
  for (let i = 1; i < days; i++) {
    const prev = prices[i - 1];
    prices.push(prev * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * randn()));
  }
  return prices;
}

/**
 * Calculate a Simple Moving Average series
 * Returns null for indices where window is not yet full
 *
 * @param {number[]} prices - Price array
 * @param {number}   window - MA window size in days
 * @returns {(number|null)[]}
 */
export function calcMA(prices, window) {
  return prices.map((_, i) => {
    if (i < window - 1) return null;
    const slice = prices.slice(i - window + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / window;
  });
}

/**
 * Compute drawdown series from an equity/price array
 * Each value is the percentage drawdown from the running peak
 *
 * @param {number[]} series
 * @returns {number[]} drawdowns as fractions (e.g. -0.15 means -15%)
 */
export function calcDrawdown(series) {
  let peak = series[0];
  return series.map(v => {
    peak = Math.max(peak, v);
    return (v - peak) / peak;
  });
}

/**
 * Compute the maximum drawdown from a drawdown series
 * @param {number[]} drawdowns - from calcDrawdown()
 * @returns {number} worst drawdown as a fraction
 */
export function maxDrawdown(drawdowns) {
  return Math.min(...drawdowns);
}

/**
 * Annualised Sharpe ratio
 * @param {number} mu  - Annual return
 * @param {number} sigma - Annual volatility
 * @param {number} rf  - Risk-free rate (default 2%)
 */
export function sharpeRatio(mu, sigma, rf = 0.02) {
  return (mu - rf) / sigma;
}

/**
 * Normal PDF
 */
export function normalPdf(x, mean, std) {
  return Math.exp(-0.5 * ((x - mean) / std) ** 2) / (std * Math.sqrt(2 * Math.PI));
}
