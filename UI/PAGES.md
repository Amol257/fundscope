# FundScope UI Architecture & Page Directory

This document outlines the purpose, structure, and key features of each page within the FundScope application's UI (`/app` directory). 

The UI is built using Next.js 14+ (App Router), React, Tailwind CSS, and Framer Motion, following a cohesive, premium dark-mode aesthetic with typography heavily utilizing `font-serif italic font-light` for elegant headers and `font-mono` for data elements.

---

## 1. Landing Page (`/`)
**Path:** `app/page.tsx`
- **Purpose:** The entry point of the application. It establishes the brand identity and value proposition.
- **Key Features:**
  - **HeroCanvas:** A custom WebGL fluid noise shader background using `@react-three/fiber` and custom GLSL, producing a slowly mutating, dark, liquid-like texture.
  - **3D Fund Topology Globe (`FundGlobe`):** An interactive 3D globe using `@react-three/drei`. Maps mutual funds as glowing spherically distributed particles. Auto-rotates and allows users to zoom and hover to see custom HTML tooltips.
  - **ScrambleText Reveal:** A hacker-like text decoding effect applied to the main hero title for a high-impact entrance.
  - **GSAP ScrollTrigger (`GsapReveal`):** Wraps all major sections so elements fade and slide up dynamically as the user scrolls.
  - Dynamic **"Real-Time Market Analysis"** card pulling live top 1Y performers from the dataset.
  - A moving **Ticker** strip displaying live or randomized fund data with staggered entrance animations.
  - Clear calls to action navigating to the Explorer, Insights, and Risk Profile sections.

## 2. Dashboard / Market Explorer (`/explorer`)
**Path:** `app/explorer/page.tsx`
- **Purpose:** A high-level market overview. Acts as a macro-dashboard for all mutual funds in the database.
- **Key Features:**
  - Calculates aggregated KPIs: Total tracked funds, average 3Y/5Y CAGRs, and total 'S' grade funds.
  - **KPI Sparklines:** `MetricCard` components enhanced with tiny SVG sparkline trend graphs.
  - Interactive **Recharts** visualizations:
    - Bar chart showing average 5Y returns by broad category.
    - Distribution chart showing the count of funds by score grade (S, A, B, C, D), with tooltips displaying precise percentage distributions.
    - **Category Heatmap:** Enhanced with staggered Framer Motion variants for a sequential cell reveal effect.
  - A grid of the absolute top 6 performing funds with their key metrics.
  - **MomentumFeed:** A scrolling, real-time-like feed of momentum signals and trend alerts.
  - **QuickSipWidget:** A SIP calculator widget that dynamically calculates projected values based on the average 5Y CAGR.

## 3. Fund Screener (`/screener`)
**Path:** `app/screener/page.tsx`
- **Purpose:** A robust data table and filtering engine to find specific mutual funds.
- **Key Features:**
  - Search funds by name.
  - Filter by category, sub-category, and proprietary FundScope Grade.
  - Sortable columns (Score, 1Y CAGR, 3Y CAGR, 5Y CAGR, Volatility).
  - Links directly to individual fund detail pages (`/fund/[id]`).

## 4. Insights & Analytics (`/insights`)
**Path:** `app/insights/page.tsx`
- **Purpose:** Deep-dive statistical analysis and data stories generated from the mutual fund pipeline.
- **Key Features:**
  - **Risk vs. Return Magic Quadrant:** A scatter plot mapping Volatility vs. 5Y Return, visually segmented into quadrants.
  - **Active vs. Index Reality:** A pie chart and data analysis highlighting the outperformance (or underperformance) of active funds versus standard benchmarks.
  - Category breakdown and Alpha generation analysis.

## 5. Fund Detail Page (`/fund/[id]`)
**Path:** `app/fund/[id]/page.tsx` & `FundDetailClient.tsx`
- **Purpose:** Comprehensive analysis of a single mutual fund.
- **Key Features:**
  - Displays the fund's proprietary Grade and Score.
  - **Circular Ring Score:** A large, animated SVG circular progress ring that draws itself over 2 seconds to reveal the fund's algorithmic quality score out of 100.
  - **Animated Radar Chart:** A multidimensional profile mapping using Recharts' `RadarChart`, plotting dimensions like Returns, Volatility, Alpha, Sharpe, and Momentum.
  - **Historical Return Chart:** An `AreaChart` demonstrating the growth of ₹100 over 3 years, featuring a fluid fade-in animation.
  - Risk metrics (Volatility, Sharpe Ratio, Alpha, Beta).
  - Benchmark comparison (Fund return vs Category Benchmark).

## 6. Compare Funds (`/compare`)
**Path:** `app/compare/page.tsx`
- **Purpose:** Side-by-side comparison of multiple mutual funds.
- **Key Features:**
  - Search and select up to 3-4 funds to compare.
  - Standardized metrics (CAGR, Risk, Expense Ratios) displayed in an easily readable matrix.

## 7. Shortlist (`/shortlist`)
**Path:** `app/shortlist/page.tsx`
- **Purpose:** A curated selection of only the highest-graded (Strong Buy / Buy) funds.
- **Key Features:**
  - Pre-filtered view of S-Tier and A-Tier funds.
  - Allows users to simulate a blended portfolio by adding top funds together to see projected returns.

## 8. Wealth Projector & SIP (`/sip`)
**Path:** `app/sip/page.tsx`
- **Purpose:** Financial calculators and simulation tools.
- **Key Features:**
  - **Wealth Projector:** SIP (Systematic Investment Plan) calculator to visualize compounding over time based on monthly contributions and expected returns.
  - **Active Fee Impact:** A tool showing how much wealth is eroded by management fees (Expense Ratios) over 10-30 years compared to zero-fee benchmarks.

## 9. Risk Profile (`/risk-profile`)
**Path:** `app/risk-profile/page.tsx`
- **Purpose:** User onboarding and assessment.
- **Key Features:**
  - Questionnaire to gauge user risk tolerance and investment horizon.
  - Recommends an asset allocation (Equity vs. Debt) and points the user to top funds matching their profile.

## 10. Methodology (`/methodology`)
**Path:** `app/methodology/page.tsx`
- **Purpose:** Transparency regarding the proprietary scoring engine.
- **Key Features:**
  - Explains how the 1-100 score is calculated.
  - Details the weighting of Return (CAGR), Risk (Volatility), Risk-Adjusted metrics (Sharpe/Sortino), and Consistency.

## 11. About (`/about`)
**Path:** `app/about/page.tsx`
- **Purpose:** Background on the project and the creator.
- **Key Features:**
  - Explains the origin of FundScope as a comprehensive portfolio project demonstrating full-stack engineering and data pipeline capabilities.

## 12. Benchmark Comparison (`/benchmarks`)
**Path:** `app/benchmarks/page.tsx`
- **Purpose:** Analyzes the "Active vs Index" debate by comparing active fund returns against passive index funds tracking the same benchmark.
- **Key Features:**
  - Dynamic beat-rate calculation to see if active managers outperform their index over 1Y, 3Y, and 5Y timeframes, surfaced together so users can see whether active management's edge is growing or shrinking across horizons.
  - Interactive table grouping funds by benchmark (e.g., NIFTY 50, NIFTY 500, Sensex) and highlighting the top outliers generating positive Alpha.
  - **Category Beat-Rate Rollup:** A summary block above the main table showing the percentage of funds beating their benchmark, broken down by broad category (Large Cap, Mid Cap, Small Cap, Flexi Cap), since active-vs-passive dynamics differ meaningfully across these segments in the Indian market.
  - **Alpha Distribution Chart:** A bar or scatter visualization of alpha values per benchmark group, reusing the alpha field already computed for the Insights page's Risk vs Return quadrant.
  - **Alpha Leaderboard:** A callout listing the top 5 positive-alpha funds and bottom 5 negative-alpha funds across the dataset.

## 13. Goal Planner (`/goals`)
**Path:** `app/goals/page.tsx`
- **Purpose:** A reverse SIP calculator that works backward from a target corpus to find the required monthly investment.
- **Key Features:**
  - Adjust target wealth, time horizon, and risk profile (Conservative, Moderate, Aggressive).
  - Visual trajectory chart mapping estimated wealth vs total invested.
  - Curated list of recommended funds that match the user's selected risk profile.

## 14. Tax Corner (`/tax`)
**Path:** `app/tax/page.tsx`
- **Purpose:** Tools for estimating post-tax returns and exploring tax-saving mutual funds.
- **Key Features:**
  - **ELSS (80C Savings):** Highlights top-rated Equity Linked Savings Schemes ranked by 3Y/5Y CAGR and expense ratio (1Y CAGR is suppressed or de-emphasized here since ELSS carries a mandatory 3-year lock-in, making 1Y figures not meaningfully actionable). Calculates potential tax savings under Section 80C, old regime only, up to ₹46,800 at the top slab (30% plus 4% cess on the ₹1.5L deduction limit). New tax regime does not permit the 80C deduction, so the calculator should clarify this and route new-regime users to a tax-efficiency comparison instead.
  - **LTCG / STCG Calculator:** Computes estimated tax due and post-tax CAGR based on fund category and holding period, applying current FY 2025-26 rules: equity-oriented funds (≥65% equity) at 20% STCG (under 12 months) or 12.5% LTCG above the ₹1.25L annual exemption (12+ months); debt funds purchased on or after April 1, 2023 taxed at the investor's income slab rate regardless of holding period (holding period is not a variable for these funds and should be reflected as such in the UI); debt funds purchased before April 1, 2023 retain access to 12.5% LTCG (without indexation) past 24 months.
  - **Post-Tax CAGR Comparison Table:** Ranks the top 10-15 funds by pre-tax vs post-tax CAGR side by side, applying the above tax logic, so users can see how the after-tax picture changes the ranking versus headline returns.
  - **Tax Regime Toggle:** Old regime vs new regime switch on the 80C calculator, since 80C deductions only apply under the old regime.
  - **Tax Efficiency Ranking:** A simple derived comparison of equity funds held over 1 year against debt funds held over 3 years, surfacing which category currently offers the better after-tax yield, computed entirely from existing CAGR and category fields.

---

### Navigation Structure
The UI routes are accessible via the main `Navbar` (`components/ui/navbar.tsx`), which includes:
- **Left:** Logo (Links to `/`)
- **Center Links:** Dashboard (`/explorer`), Screener (`/screener`), SIP (`/sip`), Goals (`/goals`), Tax (`/tax`), Benchmarks (`/benchmarks`), Compare (`/compare`), Insights (`/insights`), Shortlist (`/shortlist`)
- **Right:** Search Icon (`/screener`), Get Started Magnetic Button (`/risk-profile`)
- **Mobile Menu:** Identical to Center Links, plus the Get Started action surfaced as a menu item rather than a button.

---

### Data Architecture Note
To maintain optimal client-side performance and avoid shipping a massive 32MB payload, the UI relies on a split-data approach:
- **`lib/compact-data.json`**: A lightweight (~2.3MB) version stripped of historical NAV arrays. Imported directly by overview pages (`/explorer`, `/screener`, `/benchmarks`, `/insights`, `/shortlist`, `/tax`, `/goals`, `/sip`, `/risk-profile`) to ensure instant load times and snappy navigation. All additions to `/tax` and `/benchmarks` are derived entirely from fields already present in this compact dataset.
- **`lib/data.json`**: The full 32MB database including daily `nav_history`. Only loaded when absolutely necessary on the server-side for the Fund Detail page (`/fund/[id]`), or locally for the Compare page (`/compare`), which require the dense data arrays to render aligned historical return charts.
