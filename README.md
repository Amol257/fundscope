# Indian Mutual Fund Performance Analyser

A professional, data-driven mutual fund performance analyser for the Indian market. It fetches real-time NAV data directly from AMFI (via `mfapi.in`), retrieves benchmark index histories from Yahoo Finance, calculates core financial return and risk metrics (CAGR, Volatility, Sharpe, Alpha), builds a normalized composite scoring model, performs statistical validation, and generates detailed visualizations and Excel reports.

## Project Structure

```text
Mutual Fund Project/
│
├── data/
│   ├── raw/
│   │   ├── nav_history.csv         # Raw daily NAV data for all 28 funds
│   │   └── benchmark_history.csv   # Raw historical benchmark price data
│   │
│   └── processed/
│       ├── fund_returns.csv        # Calculated CAGR, Sharpe, Alpha metrics
│       ├── fund_scores.csv         # Normalized scores, grades, and ranks
│       └── fund_scores_final.csv   # Scores appended with 3-year consistency
│
├── src/
│   ├── config.py                   # Setup parameters, category mapping, and tickers
│   ├── data_fetcher.py             # AMFI NAV API and yfinance benchmark fetcher
│   ├── returns_calculator.py       # Math logic for CAGR, Volatility, Sharpe, and Alpha
│   ├── scoring_model.py            # Normalization and composite score calculation
│   ├── statistical_analyser.py     # T-test and monthly-resampled rolling returns
│   ├── sql_analyser.py             # SQLite database population and BI queries
│   ├── chart_generator.py          # Plots dashboard grid (mf_analysis.png)
│   └── excel_generator.py          # Builds styled multi-sheet report (MF_Report.xlsx)
│
├── notebooks/
│   └── analysis.ipynb              # Step-by-step Jupyter Notebook walkthrough
│
├── outputs/
│   ├── mf_analysis.png             # Visual 6-chart dashboard grid
│   ├── MF_Report.xlsx              # 6-sheet formatted Excel report with SIP calculator
│   ├── sql_query_results.txt       # Execution logs for the 6 SQL queries
│   └── investment_shortlist.csv    # Final fund shortlist picks
│
├── main.py                         # End-to-end pipeline execution entrypoint
├── requirements.txt                # External dependencies list
└── README.md                       # Documentation
```

## Installation & Setup

1. **Install Python 3.11+** if not already installed.
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Pipeline

You can run the entire analysis pipeline from data fetching to report generation with a single command:

```bash
python main.py
```

This will run all steps sequentially and produce:
- A SQLite database: `data/mf_analysis.db`
- Formatted SQL query outputs: `outputs/sql_query_results.txt`
- PNG Dashboard: `outputs/mf_analysis.png`
- Styled Excel workbook: `outputs/MF_Report.xlsx`

Alternatively, you can open and run `notebooks/analysis.ipynb` to inspect the results step-by-step with inline plots.

## Handpicked Categories & Tickers

The analyser covers 32 mutual funds across 5 distinct categories, evaluated against corresponding market benchmarks:
- **Large Cap** evaluated against **Nifty 50** (`^NSEI`)
- **Mid Cap** evaluated against **Nifty Midcap 150** (`^NSMIDCP`)
- **Small Cap** evaluated against **Nifty Smallcap 250** (`^CNXSC`)
- **ELSS Tax Saving** evaluated against **Nifty 500** (`^CRSLDX`)
- **Index Funds** evaluated against **Nifty 50** (`^NSEI`)

## Key Metrics Calculated

- **CAGR (Compound Annual Growth Rate)**: Smoothed annual return over 1, 3, and 5 years.
- **Annualized Volatility**: Metric of risk calculated from daily log returns.
- **Sharpe Ratio**: Risk-adjusted efficiency metric assuming a 7.0% risk-free rate of return (India government bond yield).
- **Alpha**: Excess return earned above the benchmark index return over the same period.
- **Consistency Score**: The percentage of all 3-year rolling monthly windows that returned positive gains.
- **Composite Score**: Normalized weighted score:
  - 5-Year CAGR: **30%**
  - 3-Year CAGR: **20%**
  - 1-Year CAGR: **10%**
  - Sharpe Ratio: **25%**
  - 5-Year Alpha: **15%**

## Key Findings

- **Top Performers**: The `quant ELSS Tax Saver Fund` scored highest in its category (98.1), while `HDFC Top 100 Fund` scored a perfect 100.0 relative to its Large Cap peers.
- **Highest Alpha**: The `quant Small Cap Fund` generated the highest excess return, beating its benchmark by an impressive 10.29% over the past 5 years.
- **Category Summary**: Small Cap funds generated the highest average 5-year return (17.58%) but come with significantly higher volatility.
- **Active vs Index**: Active Large Cap Funds outperformed Index Funds slightly on average over the last 5 years (12.72% vs 9.34%), though a T-test reveals this performance difference is not strongly statistically significant (p=0.0588).

## Known Data Issues

- **Kotak Data Gaps**: Several Kotak funds (e.g. Kotak Bluechip, Kotak Emerging Equity) have missing or repeated daily NAV historical data on AMFI, resulting in suspiciously low (< 5%) volatility calculations. The pipeline automatically flags these and skips assigning a Sharpe Ratio.
- **Renamed Funds**: The `SBI Bluechip` fund was renamed to `SBI Large Cap Fund` by the AMC. The scheme code has been updated to `119598` to retrieve the correct recent data.
