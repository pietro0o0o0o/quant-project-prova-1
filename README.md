# Quant Dashboard

An interactive quantitative finance dashboard built with vanilla HTML, CSS, and JavaScript (Chart.js).

## Features

- **Monte Carlo Simulation** — Geometric Brownian Motion price path simulation with configurable parameters (drift, volatility, number of paths, horizon). Displays median, 25th/75th percentile bands, VaR, probability of profit, and Sharpe ratio.
- **Backtesting Engine** — Moving Average crossover strategy (fast MA vs slow MA) on synthetically generated price data. Shows equity curve vs Buy & Hold, win rate, alpha, max drawdown, and a trade log.
- **Risk Analysis** — Parametric VaR (95% and 99%), CVaR/Expected Shortfall, return distribution histogram with loss zone highlighted, drawdown chart, Sortino ratio, and Calmar ratio.

## How to Run

No build tools or dependencies required. Just open `index.html` in a browser.

```bash
git clone https://github.com/YOUR_USERNAME/quant-dashboard.git
cd quant-dashboard
open index.html   # macOS
# or: xdg-open index.html  (Linux)
# or: start index.html      (Windows)
```

## Project Structure

```
quant-dashboard/
├── index.html        # Main entry point
├── css/
│   └── style.css     # All styles
├── js/
│   ├── utils.js      # Math helpers (GBM, normal random, MA)
│   ├── montecarlo.js # Monte Carlo simulation module
│   ├── backtest.js   # Backtesting engine module
│   ├── risk.js       # Risk metrics module
│   └── main.js       # Tab routing and slider bindings
└── README.md
```

## Methodology

### Monte Carlo (GBM)
Price paths follow Geometric Brownian Motion:

```
S(t+dt) = S(t) * exp((μ - σ²/2)*dt + σ*√dt*Z)
```

where Z ~ N(0,1), μ is the annual drift, σ is the annual volatility, and dt = 1/252.

### Backtest Strategy
A simple MA crossover:
- **Buy** when fast MA crosses above slow MA (golden cross)
- **Sell** when fast MA crosses below slow MA (death cross)

Performance metrics: total return, Sharpe ratio (annualised), max drawdown, win rate, alpha vs Buy & Hold.

### Risk Metrics
- **VaR (parametric)**: `μ*T - z_α * σ * √T`
- **CVaR / Expected Shortfall**: approximated at 95% confidence
- **Sharpe**: `(μ - rf) / σ`, rf = 2%
- **Sortino**: uses downside deviation estimate
- **Calmar**: return / estimated max drawdown

## Dependencies

- [Chart.js 4.4.1](https://www.chartjs.org/) — loaded via CDN

## License

MIT
