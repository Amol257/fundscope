# FundScope UI — Additions & Expansion Roadmap

> A complete specification for every new page, component, section, and metric visualisation  
> that can be built on top of the existing Next.js UI using data already present in the project.

**Current Stack:** Next.js 15 · Recharts · Framer Motion · Tailwind CSS · Lucide Icons  
**Data available:** 28 funds · 5 categories · 13+ metrics per fund · 10 years of daily NAV · benchmark history · SQL outputs · shortlist CSV

---

## Table of Contents

1. [Priority Fix — Wire the Hero to Real Data](#0-priority-fix--wire-the-hero-to-real-data)
2. [New Pages](#new-pages)
   - [/methodology](#1-methodology)
   - [/shortlist](#2-shortlist)
   - [/insights](#3-insights)
   - [/quadrant](#4-quadrant--risk-return-scatter)
   - [/risk-profile](#5-risk-profile-quiz)
   - [/active-vs-index](#6-active-vs-index)
   - [/about](#7-about--project-story)
   - [/screener](#8-screener--advanced-fund-screener)
3. [Enhancements to Existing Pages](#enhancements-to-existing-pages)
   - [Explorer (/explorer)](#explorer-explorer)
   - [Fund Detail (/fund/[id])](#fund-detail-fundid)
   - [Compare (/compare)](#compare-compare)
   - [SIP Calculator (/sip)](#sip-calculator-sip)
4. [New Shared Components](#new-shared-components)
5. [New Metrics That Can Be Derived](#new-metrics-that-can-be-derived-from-existing-data)
6. [Data-to-Page Mapping](#data-to-page-mapping)
7. [Implementation Order](#implementation-order)

---

## 0. Priority Fix — Wire the Hero to Real Data

**File:** `app/page.tsx`  
**Problem:** The hero fund card shows hardcoded values ("Alpha Growth Fund", 18.4%, score 82). The project has real data — the hero should reflect the actual #1 fund.

**Fix:** Import `fundData` from `@/lib/data.json`, sort `fundData.funds` by `score` descending, pick `funds[0]`, and render its `name`, `cagr_5yr`, `score`, and `score_grade` fields.

```tsx
// app/page.tsx — top of component
const topFund = useMemo(() =>
  [...(fundData.funds || [])].sort((a, b) => b.score - a.score)[0],
[]);
```

This makes one tiny change but immediately makes the entire project feel truthful and production-grade. The stat callout "23% beat Nifty 50" can also become real: count funds with `alpha_5yr > 0` and divide by total.

---

## New Pages

---

### 1. `/methodology`

**What it is:** A static, long-form explainer of exactly how the composite score is computed — the analytical core of the project made visible.

**Why it matters for recruiters:** AMC and fintech interviewers want to see that you understand *why* the model works, not just that you built it. This page is your proof.

**Sections:**

#### 1.1 Data Pipeline Overview
A horizontal flow diagram (SVG or Recharts TreeMap-style) showing:
```
AMFI API → Raw NAV CSV → Returns Calculator → Scoring Model → SQLite → JSON → UI
```
Each node is a clickable card that expands to describe what that step does (e.g., "Returns Calculator: computes 1Y, 3Y, 5Y CAGR using compound growth formula").

#### 1.2 Metrics Explained
Six cards, one per metric, each with:
- Metric name and icon
- Plain-English definition
- The actual formula used (rendered in a styled `<code>` block)
- Why it matters (1–2 sentences)
- Real example using HDFC Top 100 Fund data

| Metric | Formula | Weight in Score |
|---|---|---|
| 5-Year CAGR | `(NAV_end / NAV_start)^(1/5) - 1` | 30% |
| 3-Year CAGR | `(NAV_end / NAV_start)^(1/3) - 1` | 20% |
| 1-Year CAGR | `NAV_end / NAV_start - 1` | 10% |
| Sharpe Ratio | `(R_fund - 7.0%) / σ_annual` | 25% |
| 5-Year Alpha | `CAGR_fund - CAGR_benchmark` | 15% |
| Consistency | `% of 3Y rolling windows with positive return` | Display only |

#### 1.3 Composite Score Formula
A visual equation block:
```
Score = (norm_CAGR5 × 0.30) + (norm_CAGR3 × 0.20) + (norm_CAGR1 × 0.10)
      + (norm_Sharpe × 0.25) + (norm_Alpha5 × 0.15)
      × 100
```
With a note: "Each metric is MinMax-normalized *within its category*, so Large Cap funds compete only against other Large Cap funds."

#### 1.4 Score → Grade Mapping
A visual gradient bar from 0 to 100 with grade buckets:

| Score | Grade | Meaning |
|---|---|---|
| 85–100 | S — Excellent | Top performer, strong buy |
| 70–84 | A — Good | Outperformer, consider buying |
| 55–69 | B — Average | Meets benchmark, hold |
| 40–54 | C — Below Average | Underperformer, review |
| 0–39 | D — Avoid | Consistent laggard |

#### 1.5 Benchmark Allocation
A table showing each category → its benchmark → the benchmark ticker:

| Category | Benchmark | Ticker |
|---|---|---|
| Large Cap | Nifty 50 | ^NSEI |
| Mid Cap | Nifty Midcap 150 | ^NSMIDCP |
| Small Cap | Nifty Smallcap 250 | ^CNXSC |
| ELSS | Nifty 500 | ^CRSLDX |
| Index | Nifty 50 | ^NSEI |

#### 1.6 Limitations & Assumptions
Honest caveats shown in a styled warning card:
- Risk-free rate fixed at 7.0% (Indian 10Y govt bond)
- Scoring is relative within category, not absolute
- Funds with < 3 years of history are excluded
- Survivorship bias: only currently active funds analysed

**Component:** `app/methodology/page.tsx` (static, no client-side data needed)

---

### 2. `/shortlist`

**What it is:** The final output of the analysis pipeline — a ranked investment recommendation list from `investment_shortlist.csv` — presented as a beautiful, filterable data table.

**Why it matters:** This closes the data-to-product loop. The project produced a real output file; showing it in the UI proves the analysis pipeline is end-to-end.

**Data source:** `fundData.funds` filtered where `recommendation` is `"Strong Buy"` or `"Buy"` (these fields come from the shortlist CSV and should be added to `data.json` during the export step).

**Sections:**

#### 2.1 Header
- Title: "Investment Shortlist"
- Subtitle: "Funds that cleared all quality thresholds: Grade A or above, positive 5Y alpha, >90% consistency"
- Count badge: e.g., "7 funds selected from 28 analysed"

#### 2.2 Shortlist Table
Columns:
| Fund Name | Category | Score | Grade | 5Y CAGR | Alpha | Consistency | Recommendation | Action |
|---|---|---|---|---|---|---|---|---|

Rows sorted by Score descending. Grade shown as a coloured badge (gold for S, green for A). Action column has a "View Fund →" link to `/fund/[id]`.

The `What_To_Do` column from the CSV (e.g., "Consider for 40-50% of your equity allocation") appears as a tooltip on hover over an `<Info>` icon.

#### 2.3 Portfolio Builder Panel (sidebar or bottom)
A lightweight interactive panel: User clicks "Add to Portfolio" on any fund row. The panel accumulates selected funds and shows suggested allocation percentages (e.g., split 40%/30%/30% across selected funds). Not saved anywhere — purely client-side state. Shows:
- Combined expected return (weighted average of 5Y CAGRs)
- Diversification score (penalises picking all from the same category)

**Component:** `app/shortlist/page.tsx` (client component, uses `useState` for selections)

---

### 3. `/insights`

**What it is:** A market-level analytical dashboard drawn entirely from aggregate statistics across all 28 funds. This is the closest the project gets to a Bloomberg-style analytics view.

**Why it matters:** Proves you can think at the *market level*, not just the fund level — essential for AMC/wealth management roles.

**Sections:**

#### 3.1 Market Pulse (stat cards row)
Six headline numbers derived from the dataset:

| Stat | Value | How to compute |
|---|---|---|
| Total Funds Analysed | 28 | `funds.length` |
| Funds Beating Benchmark (5Y) | 22 | `funds.filter(f => f.alpha_5yr > 0).length` |
| Best 5Y Return | 20.73% | `max(funds, 'cagr_5yr')` — Nippon India Growth Mid Cap |
| Highest Sharpe | 1.065 | `max(funds, 'sharpe_ratio')` — SBI Small Cap |
| Avg Alpha across all funds | ~2.8% | mean of `alpha_5yr` |
| Funds with S Grade | 6 | count where `score_grade === 'S - Excellent'` |

#### 3.2 Category Summary Table
Pulled directly from SQL Query 3 output (already computed, hardcode or re-derive from data.json):

| Category | Funds | Avg 5Y Return | Avg Sharpe | Avg Alpha | Beat Benchmark |
|---|---|---|---|---|---|
| Small Cap | 5 | 16.89% | 0.891 | 6.12% | 5/5 |
| ELSS | 5 | 13.21% | 0.573 | 2.44% | 4/5 |
| Mid Cap | 6 | 11.59% | 0.464 | −0.75% | 4/6 |
| Large Cap | 7 | 10.87% | −0.282 | 2.51% | 4/7 |
| Index | 5 | 9.33% | 0.348 | 0.97% | 5/5 |

Show as a styled table with conditional colour on the "Avg Alpha" column (green if positive, red if negative).

#### 3.3 Score Distribution Histogram
X-axis: Score ranges (0–20, 20–40, 40–55, 55–70, 70–85, 85–100)  
Y-axis: Fund count  
Built with Recharts `<BarChart>`. Each bar coloured by grade (D = red, C = purple, B = blue, A = green, S = gold).

Derive buckets from `fundData.funds`:
```js
const bins = [0, 20, 40, 55, 70, 85, 100];
```

#### 3.4 Alpha Leaders
A horizontal bar chart (Recharts `<BarChart layout="vertical">`) of the top 10 funds sorted by `alpha_5yr` descending. Bars coloured teal for positive, red for negative. Each bar labelled with fund name (truncated) and alpha value.

**Data source:** SQL Query 2 results — all 22 funds with positive alpha.

#### 3.5 Consistency vs Score Scatter
X-axis: `consistency_3yr` (0–100%)  
Y-axis: `score` (0–100)  
Each dot is a fund, coloured by category, sized uniformly.  
Built with Recharts `<ScatterChart>`.

Shows the strong positive correlation between consistency and score — a key insight from the analysis.

#### 3.6 "SQL Under the Hood" Collapsible Section
An expandable accordion showing the actual SQL queries used (from `sql_query_results.txt`), with syntax highlighting. This is a recruiter-facing feature — it shows you know SQL and used it in the project. Each query shows the formatted output table beneath it.

**Component:** `app/insights/page.tsx` (client component for chart interactivity)

---

### 4. `/quadrant` — Risk-Return Scatter

**What it is:** A dedicated page for the Risk-Return Quadrant analysis from SQL Query 6 — the single most visually striking insight in the dataset.

**Why it matters:** The quadrant chart immediately communicates the project's core finding: most funds that beat their benchmark do so *without* taking extra risk. This is a non-obvious result that demonstrates real analytical depth.

**The Four Quadrants:**
```
High Return │  Aggressive          │  ★ Star
(>12% CAGR) │  High Return         │  High Return
            │  High Risk           │  Low Risk
            ├──────────────────────┼───────────────
Low Return  │  ✗ Avoid             │  Defensive
(<12% CAGR) │  Low Return          │  Low Return
            │  High Risk           │  Low Risk
            │                      │
            └──────────────────────┴───────────────
            High Risk (≥20% vol)     Low Risk (<20% vol)
```

**Sections:**

#### 4.1 The Chart
Recharts `<ScatterChart>`:
- X-axis: `volatility` (annualised, %)
- Y-axis: `cagr_5yr` (%)
- Reference lines: X = 20 (risk threshold), Y = 12 (return threshold)
- Each scatter dot: coloured by quadrant category, sized by `score`
- Tooltip shows: fund name, category, CAGR, volatility, quadrant label

#### 4.2 Quadrant Breakdown Cards
Four stat cards (one per quadrant) showing:
- Quadrant label and icon
- Fund count in that quadrant
- Fund names as small pills
- Recommended action

| Quadrant | Count | Action |
|---|---|---|
| Star: High Return Low Risk | 16 | Strong Consider |
| Aggressive: High Return High Risk | 0 | Proceed with caution |
| Defensive: Low Return Low Risk | 12 | Only for capital preservation |
| Avoid: Low Return High Risk | 0 | Do not invest |

#### 4.3 Key Insight Callout
A large text callout: "**16 of 28 funds** fall in the Star quadrant — high return without high risk. The Indian equity market rewarded disciplined stock-picking over the last decade."

**Component:** `app/quadrant/page.tsx`

---

### 5. `/risk-profile` — Risk Profile Quiz

**What it is:** A short 4-question quiz that helps the user identify their risk tolerance, then recommends the most suitable fund category from the analysed dataset.

**Why it matters:** Transforms the project from a data tool into a *user product*. Demonstrates product thinking alongside data engineering.

**Questions (4):**
1. "What is your investment horizon?" → < 3 years / 3–7 years / 7+ years
2. "How would you react to a 20% portfolio drop?" → Sell immediately / Hold / Buy more
3. "What is your primary goal?" → Capital preservation / Steady growth / Maximum growth
4. "Are you in a tax-saving scheme?" → Yes (ELSS suits me) / No

**Logic (client-side, deterministic):**
```
horizon = short  → Defensive (Large Cap / Index)
horizon = long + high risk tolerance → Aggressive (Small Cap / Mid Cap)
tax saving = yes → ELSS first
```

After quiz: Show a "Your Risk Profile" result card with:
- Profile label (Conservative / Moderate / Aggressive / Tax-Saver)
- Recommended category
- Top 2 funds from that category (from shortlist data)
- Link to `/explorer` filtered to that category

**Component:** `app/risk-profile/page.tsx` (client component, `useState` for quiz state machine)

---

### 6. `/active-vs-index`

**What it is:** A dedicated deep-dive comparison of active fund performance vs Nifty 50 Index funds — the most debated question in Indian investing.

**Why it matters:** SQL Query 5 already computed this. Surfacing it as a standalone page demonstrates your awareness of a real financial debate and your ability to produce data-backed answers.

**The Finding from the Data:**
- Active Large Cap funds averaged 10.87% (5Y CAGR) vs Index funds at 9.33%
- But active funds showed negative average Sharpe (−0.282) vs Index funds (0.348)
- Conclusion: Active funds returned more, but with worse risk-adjusted efficiency

**Sections:**

#### 6.1 The Central Question
Hero text: "Do active fund managers actually earn their fees?" with a live answer derived from data.

#### 6.2 Head-to-Head Table
| Metric | Active Large Cap | Index Funds |
|---|---|---|
| Avg 5Y CAGR | 10.87% | 9.33% |
| Avg Sharpe Ratio | −0.282 | 0.348 |
| Funds analysed | 7 | 5 |
| % beating benchmark | 57% | 100% |

Winner column (green checkmark) for each metric.

#### 6.3 NAV Growth Overlay Chart
A single Recharts `<AreaChart>` showing:
- The average normalised NAV growth of all Large Cap active funds (combined average)
- The average normalised NAV growth of all Index funds
- The Nifty 50 benchmark itself

This is the most visually compelling chart in the project.

#### 6.4 The Expense Ratio Angle (Educational)
A short educational callout: "Index funds charge ~0.1–0.2% expense ratio. Active large cap funds charge ~1.0–1.5%. Over 20 years, on ₹10L investment, that difference compounds to ₹8–12L in fees." (Link to the SIP fee calculator for interactive exploration.)

#### 6.5 The Verdict
A styled conclusion card: "For Large Cap exposure, the data suggests index funds offer better risk-adjusted returns after fees. However, active Mid Cap and Small Cap funds show stronger alpha generation where manager skill matters more."

**Component:** `app/active-vs-index/page.tsx`

---

### 7. `/about` — Project Story

**What it is:** A recruiter-facing page that tells the full story of how the project was built — the problem, approach, tech stack, and key findings.

**Why it matters:** Portfolio projects need narrative context. A hiring manager at an AMC or fintech firm should be able to read this page and understand your analytical process in 3 minutes.

**Sections:**

#### 7.1 The Problem Statement
"Most mutual fund comparison tools are either too complex (Bloomberg Terminal) or too shallow (fund house websites). I wanted to build something that applies rigorous quantitative analysis to Indian funds and presents results in a way that any investor can understand."

#### 7.2 Data Pipeline Flow
A visual diagram of the pipeline (reusable component from `/methodology`):
```
AMFI API (mfapi.in)     →   Raw NAV data (28 funds, 10Y daily)
yfinance Benchmarks     →   Benchmark price history
Returns Calculator      →   CAGR 1Y/3Y/5Y, Sharpe, Alpha, Volatility
Scoring Model           →   MinMax normalization, composite score
SQL Analyser            →   6 analytical queries on SQLite DB
Web Exporter            →   data.json for the Next.js frontend
```

#### 7.3 Tech Stack Grid
Two columns — Backend and Frontend:

**Backend (Python):** pandas, sklearn, yfinance, mfapi, sqlite3, openpyxl  
**Frontend (Next.js):** React 19, Next.js 15, Recharts, Framer Motion, Tailwind CSS 4, Lucide Icons

#### 7.4 Key Findings
Five data-backed findings, each as a stat card:
1. Only 22 of 28 funds (79%) generated positive alpha over 5 years
2. Small Cap category had the highest avg alpha (6.12%) but also highest volatility
3. 16 of 28 funds fell in the "Star" quadrant (high return, low risk)
4. Consistency score >95% was a reliable predictor of high composite score
5. No fund achieved both Alpha > 2% AND Sharpe > 1 simultaneously — showing the return-risk trade-off

#### 7.5 Contact
Name, email (`amol.singhal25@gmail.com`), GitHub link, LinkedIn link.

**Component:** `app/about/page.tsx` (static)

---

### 8. `/screener` — Advanced Fund Screener

**What it is:** A multi-filter, multi-sort power tool for investors who want to slice the 28-fund dataset by specific metric thresholds.

**Why it matters:** The `/explorer` page filters by category and grade. The screener goes deeper — minimum Sharpe, minimum alpha, maximum volatility — mimicking professional screener tools used at AMCs.

**Filter Controls:**

| Filter | Control Type | Default |
|---|---|---|
| Category | Multi-select pills | All |
| Min 5Y CAGR | Range slider (0–25%) | 0% |
| Min Sharpe Ratio | Range slider (0–2.0) | 0 |
| Min Alpha (5Y) | Range slider (−5 to +15%) | 0 |
| Max Volatility | Range slider (0–25%) | 25% |
| Min Consistency | Range slider (0–100%) | 0% |
| Min Score | Range slider (0–100) | 0 |
| Grade | Checkbox: S, A, B, C, D | All |

**Result Display:** Same card layout as `/explorer` but adds a "Matches your criteria" count badge. When no funds match, show a friendly empty state with suggested relaxed criteria.

**Sort Options:** Score (default), CAGR 5Y, Sharpe, Alpha, Volatility (asc/desc).

**Export Row:** "X funds match. Download as CSV" — triggers a client-side CSV generation using the filtered results. This is a strong demo feature.

**Component:** `app/screener/page.tsx` (client component)

---

## Enhancements to Existing Pages

---

### Explorer (`/explorer`)

#### Add: Category Leaderboard Strip
Above the fund cards grid, add a horizontal strip of 5 cards — one per category — each showing:
- Category name
- #1 fund in that category
- That fund's score and 5Y CAGR
- Link to the fund detail page

Derive from: `fundData.funds` grouped by category, take `rank_in_category === 1`.

#### Add: Sort Dropdown
Next to the existing filter pills, add a `<select>` for sort order:
- Score (High → Low) — default
- 5Y CAGR (High → Low)
- Sharpe Ratio (High → Low)
- Alpha (High → Low)
- Volatility (Low → High)

#### Add: Active State on Filter Pills
The current pills apply opacity changes but no persistent active style. Add `bg-primary text-on-primary` when selected.

#### Fix: Navbar Active State
The navbar shows all links at `opacity-40`. On the explorer page, the "Dashboard" link should show `opacity-100`. Use Next.js `usePathname()` hook.

---

### Fund Detail (`/fund/[id]`)

#### Add: Rolling Returns Chart (tabbed)
Below the existing NAV chart, add a second chart section with tabs: **1Y Rolling** / **3Y Rolling**.

A rolling return chart shows, for each date, the annualised return of the preceding N years ending at that date. This reveals whether the fund's performance is consistent over time or if a single great year inflates the long-term number.

**Implementation:**
```ts
// Compute 3Y rolling returns from nav_history
const rollingData = navHistory.map((pt, i) => {
  const threeYearsAgo = new Date(pt.date);
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const startPt = navHistory.find(p => new Date(p.date) >= threeYearsAgo);
  if (!startPt) return null;
  const rolling = ((pt.nav / startPt.nav) ** (1/3) - 1) * 100;
  return { date: pt.date, rolling: +rolling.toFixed(2) };
}).filter(Boolean);
```

#### Add: Score Breakdown Card
Below the DNA radar chart, add a card titled "Score Breakdown" that shows how this fund's composite score was assembled:

Five horizontal progress bars, one per metric, with the metric's actual value and its normalised contribution:

```
5Y CAGR    ████████████░░░░   18.34%   (+5.49 pts)
Sharpe     ██████████████░░   0.838    (+4.61 pts)
Alpha 5Y   █████████░░░░░░░   9.98%    (+3.75 pts)
3Y CAGR    ████████████████   21.02%   (+5.80 pts)
1Y CAGR    ████████░░░░░░░░   6.74%    (+0.35 pts)
```

This makes the scoring model tangible and reviewable.

#### Add: Benchmark Comparison Table
A clean two-column table beneath the NAV chart:

| Metric | This Fund | Benchmark | Difference |
|---|---|---|---|
| 1Y Return | 6.74% | −5.08% | **+11.82%** ↑ |
| 3Y Return | 21.02% | 8.29% | **+12.73%** ↑ |
| 5Y Return | 18.34% | 8.36% | **+9.98%** ↑ |

The "Difference" column coloured green/red based on sign.

#### Add: Data Quality Badge
A small `<span>` showing the data date range: "Data: Jan 2013 – Jun 2026 (10.4 years)". Builds trust in the analysis.

#### Add: Sharpe Context Tooltip
The Sharpe Ratio card currently just shows the number. Add an `<Info>` icon with a tooltip: "Sharpe Ratio = (Fund Return − 7.0% risk-free rate) / Volatility. Above 0.5 is considered good for Indian equity funds."

---

### Compare (`/compare`)

#### Add: Dual Radar Chart
The compare page currently only shows a NAV growth chart. Add a side-by-side or overlay radar chart comparing the two funds' DNA (same 5-axis radar as on the fund detail page):
- Returns
- Consistency
- Sharpe
- Alpha
- Defensiveness

Two coloured overlays (e.g., primary orange and info blue) on the same `<RadarChart>`.

#### Add: Metric Comparison Table
A table with rows for each metric and two data columns (one per fund), with a winner indicator:

| Metric | Fund A | Fund B | Winner |
|---|---|---|---|
| 5Y CAGR | 18.34% | 20.73% | Fund B ✓ |
| Sharpe | 0.838 | 0.684 | Fund A ✓ |
| Alpha 5Y | 9.98% | 8.39% | Fund A ✓ |
| Score | 100.0 | 96.2 | Fund A ✓ |
| Consistency | 97.6% | 96.8% | Fund A ✓ |

#### Add: Summary Verdict
A `<motion.div>` at the bottom: "Based on composite score and risk-adjusted returns, **[Fund A Name]** is the stronger pick across 3 of 5 metrics." Computed dynamically from the comparison data.

---

### SIP Calculator (`/sip`)

#### Add: Real Fund Rate Picker
The current "selectedFundRate" state exists but the dropdown only shows "custom". Populate it with actual `cagr_5yr` values from the top 5 funds in `data.json`:

```
Use historical rate from:
○ Custom
○ HDFC Top 100 (18.34%)
○ Nippon India Mid Cap (20.73%)
○ Nippon India Small Cap (20.53%)
○ SBI ELSS Tax Saver (16.81%)
○ Nifty 50 Index Avg (9.33%)
```

Selecting a fund fills the `expectedReturn` slider with that fund's actual 5Y CAGR. This directly ties the calculator to real analysis output.

#### Add: SIP Start Year Timeline
Below the SIP chart, show a horizontal timeline from today backward, marked at key SIP milestones: "Your first lakh invested," "Corpus doubles," "Corpus = 10X invested." Makes the chart emotionally resonant.

---

## New Shared Components

---

### `<GradeTag grade="S" />`
A reusable coloured badge component. Input: grade letter. Output: styled pill.
```
S → gold background, "S — Excellent"
A → emerald background, "A — Good"
B → blue background, "B — Average"
C → purple background, "C — Below Average"
D → red background, "D — Avoid"
```
Currently this logic is duplicated inline in at least three places.

### `<MetricCard label="Sharpe Ratio" value={0.838} tooltip="..." />`
A standardised card for displaying a single metric with label, value, optional delta, and an info tooltip. Used on fund detail, compare, and shortlist pages.

### `<FundMiniCard fund={fund} />`
A compact horizontal fund card (name + score + grade badge + 5Y CAGR). Used in the category leaderboard strip and the shortlist portfolio builder.

### `<PipelineDiagram />`
An SVG flow diagram of the data pipeline. Used on both `/methodology` and `/about`. Built as an SVG component so it can be animated with Framer Motion's `pathLength` animation on scroll.

### `<CategoryDonut data={categoryBreakdown} />`
A Recharts `<PieChart>` showing the distribution of funds across categories (5 Large Cap, 6 Mid Cap, etc.). Used on `/insights` and `/about`.

---

## New Metrics That Can Be Derived from Existing Data

The following metrics are not in the current `data.json` but can be computed on the client from `nav_history` arrays that are already present.

---

### Maximum Drawdown (MDD)
The largest peak-to-trough decline in the fund's NAV history.

```ts
function maxDrawdown(navHistory: {nav: number}[]): number {
  let peak = -Infinity;
  let maxDD = 0;
  for (const pt of navHistory) {
    if (pt.nav > peak) peak = pt.nav;
    const dd = (peak - pt.nav) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD * 100; // as percentage
}
```

**Where to show it:** Fund detail page (as a metric card), screener (as a filter), quadrant page.

**Insight:** A fund with 20% CAGR but 45% MDD is a very different investment than one with 18% CAGR and 22% MDD.

---

### Calmar Ratio
Return per unit of maximum drawdown: `CAGR_5yr / MDD`. Higher = better risk-adjusted return.

```ts
const calmar = fund.cagr_5yr / maxDrawdown(fund.nav_history);
```

**Where to show it:** Fund detail page alongside Sharpe Ratio as a complementary risk measure.

---

### Recovery Time
After the maximum drawdown: how many months did it take the fund to recover to its previous peak?

```ts
function recoveryDays(navHistory: {date: string, nav: number}[]): number | null {
  // Find the date of peak, then trough, then first date NAV exceeds peak again
}
```

**Where to show it:** Fund detail page as a risk section item. Very useful for investor psychology.

---

### Return-to-Risk Ratio (Coefficient of Variation)
`CAGR_5yr / Volatility` — simpler and more intuitive than Sharpe for many readers.

**Where to show it:** Quadrant page as an alternative axis, screener as an advanced filter.

---

### 1-Year Rolling Return Percentile
For each month in the last 3 years, the fund's 1Y return expressed as a percentile within its category. A fund that consistently ranks in the top 25th percentile is more reliable than one that oscillates between top and bottom.

```ts
// For each fund, for each date, what % of same-category funds had lower returns?
```

**Where to show it:** Fund detail page as a "Consistency Percentile Chart" — a line chart over time showing the fund's relative rank among peers.

---

### Upside/Downside Capture Ratio
- **Upside Capture:** % of benchmark's positive months that the fund captured
- **Downside Capture:** % of benchmark's negative months that the fund participated in

A good active manager should have Upside Capture > 100% and Downside Capture < 100%.

```ts
function captureRatios(navHistory, benchHistory) {
  // Match monthly returns, split into up/down months, compute ratios
}
```

**Where to show it:** Fund detail page (two stat cards: "Upside Capture" and "Downside Capture"), Active vs Index comparison page.

---

### XIRR Simulation
Given a hypothetical monthly SIP of ₹10,000 starting on the fund's first data date, compute the actual XIRR (extended IRR) of those cash flows against the current NAV.

This is the most investor-relevant metric — it answers "what return would a real SIP investor have actually gotten?"

```ts
// Use Newton-Raphson or bisection method on the NPV equation
// Cash flows: -10000 each month from Data_From to today, +final_corpus at end
```

**Where to show it:** Fund detail page as "SIP XIRR" alongside the point-to-point CAGR. Also on the SIP calculator page.

---

### Sortino Ratio
Like Sharpe but only penalises *downside* volatility (negative returns). Formula:

```
Sortino = (R_fund - 7.0%) / σ_downside
where σ_downside = std dev of only negative daily returns × √252
```

Better for funds with high upside volatility but low downside risk.

**Where to show it:** Fund detail page as a third risk metric card alongside Sharpe and Calmar.

---

## Data-to-Page Mapping

| Data Source | Pages That Use It |
|---|---|
| `fundData.funds[].score` | Explorer, Shortlist, Screener, Insights, Hero |
| `fundData.funds[].nav_history` | Fund Detail, Compare, Quadrant, new metric derivations |
| `fundData.funds[].cagr_5yr / 3yr / 1yr` | All pages |
| `fundData.funds[].sharpe_ratio` | Fund Detail, Screener, Active vs Index, Insights |
| `fundData.funds[].alpha_5yr` | Fund Detail, Shortlist, Screener, Insights, Active vs Index |
| `fundData.funds[].consistency_3yr` | Fund Detail, Shortlist, Screener, Insights scatter |
| `fundData.funds[].volatility` | Quadrant, Fund Detail, Screener, new metrics |
| `fundData.benchmarks[benchmark][].price` | Fund Detail, Compare, Active vs Index |
| `investment_shortlist.csv` fields | Shortlist, Risk Profile results |
| SQL Query outputs (hardcoded) | Insights, Active vs Index |

---

## Implementation Order

Ordered by impact-to-effort ratio (highest first):

| # | Item | Type | Effort | Impact |
|---|---|---|---|---|
| 1 | Wire hero to real data | Fix | 30 min | High |
| 2 | Fix navbar active state | Fix | 15 min | Medium |
| 3 | Score Breakdown card on fund detail | Component | 2h | High |
| 4 | Benchmark comparison table on fund detail | Component | 1.5h | High |
| 5 | `/shortlist` page | New page | 3h | High |
| 6 | `/methodology` page | New page | 4h | High |
| 7 | Real fund rate picker in SIP | Enhancement | 45 min | Medium |
| 8 | Sort dropdown on explorer | Enhancement | 45 min | Medium |
| 9 | Category leaderboard strip on explorer | Component | 2h | Medium |
| 10 | `/insights` page | New page | 5h | High |
| 11 | `/quadrant` page | New page | 3h | High |
| 12 | Dual radar + metric table on compare | Enhancement | 2.5h | Medium |
| 13 | Rolling returns chart on fund detail | Enhancement | 3h | Medium |
| 14 | `/active-vs-index` page | New page | 4h | High |
| 15 | Maximum Drawdown metric | New metric | 2h | High |
| 16 | `/risk-profile` quiz | New page | 3h | Medium |
| 17 | Calmar + Sortino ratios | New metrics | 2h | Medium |
| 18 | Upside/Downside capture ratios | New metric | 3h | Medium |
| 19 | XIRR simulation | New metric | 4h | High |
| 20 | `/screener` with CSV export | New page | 5h | Medium |
| 21 | `/about` page | New page | 2h | Medium |
| 22 | `<GradeTag>` / `<MetricCard>` components | Refactor | 1h | Low |
| 23 | Mobile hamburger menu | Fix | 1h | Low |

**Total estimated effort for all items: ~55–60 hours**  
**Recommended sprint for demo/portfolio readiness (items 1–10): ~20 hours**

---

*Last updated: June 2026 — based on FundScope codebase analysis (28 funds, Next.js 15, Recharts, AMFI data)*
