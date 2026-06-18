# FundScope — Indian Mutual Fund Performance Analyser

[![Live UI](https://img.shields.io/badge/Live_UI-FundScope-00FF41?style=for-the-badge&logo=vercel&logoColor=black&labelColor=0D1117)](https://amol257.github.io)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white&labelColor=0D1117)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white&labelColor=0D1117)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-c8ff00?style=for-the-badge&labelColor=0D1117)](LICENSE)

A full-stack, data-driven mutual fund analytics engine for the Indian market. FundScope fetches real-time NAV data directly from AMFI, retrieves benchmark index histories from Yahoo Finance, calculates core financial metrics, builds a normalised composite scoring model, runs statistical validation, and renders the results in a Next.js 15 dashboard.

---

## What It Does

Most fund comparison tools show raw returns. FundScope builds a **composite score** that weights risk-adjusted performance, alpha generation, and multi-horizon returns into a single comparable number — the way a quant analyst would.

```
Composite Score = (5Y CAGR × 30%) + (3Y CAGR × 20%) + (1Y CAGR × 10%)
               + (Sharpe Ratio × 25%) + (5Y Alpha × 15%)
```

All metrics are MinMax-normalised within their peer category before scoring, so a Large Cap fund's score is only compared against other Large Cap funds.

---

## Key Metrics Calculated

| Metric | Description |
|---|---|
| **CAGR** | Compound Annual Growth Rate over 1, 3, and 5 years |
| **Annualised Volatility** | Calculated from daily log returns |
| **Sharpe Ratio** | Risk-adjusted efficiency (7.0% risk-free rate — India 10Y bond yield) |
| **Alpha** | Excess return above the category benchmark over the same period |
| **Consistency Score** | % of rolling 3-year monthly windows that returned positive gains |
| **Composite Score** | Normalised weighted score (0–100) |

---

## Coverage

28 mutual funds across 5 categories, each benchmarked against its corresponding index:

| Category | Benchmark | Ticker |
|---|---|---|
| Large Cap | Nifty 50 | `^NSEI` |
| Mid Cap | Nifty Midcap 150 | `^NSMIDCP` |
| Small Cap | Nifty Smallcap 250 | `^CNXSC` |
| ELSS Tax Saving | Nifty 500 | `^CRSLDX` |
| Index Funds | Nifty 50 | `^NSEI` |

---

## Key Findings

- **HDFC Top 100** scored a perfect **100.0** among Large Cap peers
- **quant ELSS Tax Saver** scored **98.1** — highest in the ELSS category
- **quant Small Cap** generated the highest alpha: **+10.29%** above its benchmark over 5 years
- Small Cap funds averaged the highest 5-year return (**17.58%**) with significantly higher volatility
- Active Large Cap funds marginally outperformed Index funds (12.72% vs 9.34% CAGR) but a T-test shows the gap is not statistically significant (p = 0.0588)

---

## Project Structure

```
fundscope/
│
├── src/
│   ├── config.py                  # Fund universe, category mapping, benchmark tickers
│   ├── data_fetcher.py            # AMFI NAV API + yfinance benchmark fetcher
│   ├── returns_calculator.py      # CAGR, Volatility, Sharpe, Alpha
│   ├── scoring_model.py           # MinMax normalisation + composite score
│   ├── statistical_analyser.py    # T-test, rolling return windows
│   ├── sql_analyser.py            # SQLite population + 6 BI queries
│   ├── chart_generator.py         # 6-chart PNG dashboard grid
│   └── excel_generator.py         # 6-sheet formatted Excel report + SIP calculator
│
├── UI/                            # Next.js 15 frontend (TypeScript + Recharts)
│   ├── app/
│   │   ├── page.tsx               # Main dashboard
│   │   ├── /methodology           # How the scoring model works
│   │   ├── /shortlist             # Curated investment shortlist
│   │   ├── /insights              # Key findings and comparisons
│   │   ├── /quadrant              # Risk-return quadrant chart
│   │   ├── /screener              # Filter funds by metric thresholds
│   │   ├── /active-vs-index       # Active fund vs index fund analysis
│   │   └── /about                 # Project and methodology overview
│   ├── components/
│   └── data/
│       ├── fund_scores_final.csv  # Final composite scores
│       ├── fund_returns.csv       # CAGR, Sharpe, Alpha per fund
│       ├── investment_shortlist.csv
│       └── data.json
│
├── notebooks/
│   └── analysis.ipynb             # Step-by-step Jupyter walkthrough
│
├── outputs/
│   ├── mf_analysis.png            # 6-chart visual dashboard (PNG)
│   ├── MF_Report.xlsx             # 6-sheet styled Excel report
│   ├── sql_query_results.txt      # BI query execution logs
│   └── investment_shortlist.csv   # Final shortlist picks
│
├── main.py                        # End-to-end pipeline entrypoint
├── requirements.txt
└── README.md
```

---

## Installation

### Python Backend

**Requirements:** Python 3.11+

```bash
git clone https://github.com/Amol257/fundscope.git
cd fundscope
pip install -r requirements.txt
```

**Run the full pipeline:**

```bash
python main.py
```

This produces:
- `data/mf_analysis.db` — SQLite database with all fund and benchmark data
- `outputs/mf_analysis.png` — 6-chart PNG dashboard
- `outputs/MF_Report.xlsx` — Styled 6-sheet Excel report with SIP calculator
- `outputs/sql_query_results.txt` — Results of all 6 BI queries
- `outputs/investment_shortlist.csv` — Handpicked fund recommendations

### Next.js UI

```bash
cd UI
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Notebook Walkthrough

To explore results step-by-step with inline plots:

```bash
cd notebooks
jupyter notebook analysis.ipynb
```

---

## Tech Stack

**Backend (Python)**
```
pandas · numpy · yfinance · requests
scipy · sqlite3 · matplotlib · openpyxl
```

**Frontend (Next.js UI)**
```
Next.js 15 · TypeScript · Tailwind CSS
Recharts · Framer Motion
```

---

## Known Data Issues

**Kotak NAV Gaps** — Several Kotak funds (Kotak Bluechip, Kotak Emerging Equity) have missing or repeated daily NAV data on AMFI, resulting in suspiciously low volatility readings (<5%). The pipeline auto-flags these and skips Sharpe Ratio assignment for affected funds.

**SBI Bluechip Rename** — Renamed to *SBI Large Cap Fund* by the AMC. Scheme code updated to `119598` to pull correct recent data.

---

## Roadmap

- [ ] Maximum Drawdown and Calmar Ratio
- [ ] Sortino Ratio
- [ ] Upside / Downside Capture Ratios
- [ ] XIRR Simulation (lump sum vs SIP)
- [ ] Rolling Return Percentile bands
- [ ] FastAPI backend to serve live data to the UI

---

## About

Built by **Amol Singhal** — Data Analyst, B.Tech CSE (Data Science), ABESIT Ghaziabad (2022–2026).

Targeting fintech, BFSI, AMC, and risk analytics roles at firms including ZS Associates, EXL, Fractal, and TransFi.

| Channel | Link |
|---|---|
| Portfolio | [amol257.github.io](https://amol257.github.io) |
| LinkedIn | [linkedin.com/in/amol-singhal257](https://www.linkedin.com/in/amol-singhal257/) |
| Email | amol.singhal25@gmail.com |
| GitHub | [github.com/Amol257](https://github.com/Amol257/) |

---

## License

MIT — free to use, reference, or fork. Attribution appreciated.
