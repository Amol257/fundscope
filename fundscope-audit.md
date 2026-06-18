# FundScope: Audit Report
**Pages reviewed:** 11 | **Issues found:** 7 | **Features recommended:** 11

---

## Part 1: Fixes

These are structural and UX gaps that make the app feel incomplete in a demo or recruiter walkthrough. They should be addressed before any new features are added.

---

### 1. SIP page has no navbar link

**Type:** Navigation | **Priority:** Critical

`/sip` is a fully built page with two calculators (Wealth Projector and Active Fee Impact), but it does not appear anywhere in the main navbar or the mobile menu. Users can only reach it if they know the URL directly.

**Fix:** Add a "SIP / Plan" or "Calculators" link to the center navbar links. Alternatively, group it under a "Tools" dropdown alongside `/shortlist`.

---

### 2. Shortlist hidden on desktop

**Type:** Navigation | **Priority:** Critical

`/shortlist` appears only in the mobile menu. Desktop users have no way to discover it, which buries one of the most differentiated features in the app (S-Tier and A-Tier fund curation with portfolio simulation).

**Fix:** Add `/shortlist` to the main desktop navbar, either as a standalone link or nested under a dropdown.

---

### 3. About and Risk Profile are unreachable

**Type:** Navigation | **Priority:** High

`/about` has no navbar link at all. `/risk-profile` is only reachable via the "Get Started" magnetic button on the top right, making it invisible to users who are already browsing. As a recruiter or evaluator, finding the About page should require zero effort.

**Fix:** Add `/about` to the footer or a secondary nav. Consider adding `/risk-profile` as a standalone link or exposing it more prominently on the landing page.

---

### 4. Fund Detail page has no action CTAs

**Type:** UX flow | **Priority:** High

`/fund/[id]` presents rich data (Grade, Score, Sharpe, Beta, benchmark comparison) but offers no next step. There is no "Add to Compare" or "Add to Shortlist" button. A user finishes reading and has nowhere useful to go.

**Fix:** Add two action buttons to the fund detail header:
- "Add to Compare" (pushes fund ID into compare state, redirects or opens a compare panel)
- "Add to Shortlist" (persists fund to localStorage shortlist)

---

### 5. Shortlist resets on page refresh

**Type:** State persistence | **Priority:** High

No persistence layer is mentioned in the page architecture. If the Shortlist uses React state only, all saved funds are lost on every refresh. This breaks the core use case of the page.

**Fix:** Persist the shortlist to `localStorage` on every update. On mount, hydrate state from `localStorage`. This requires no backend and takes under 30 minutes to implement.

---

### 6. "Real-Time Market Analysis" label is misleading

**Type:** Data accuracy | **Priority:** Medium

The landing page prominently advertises "Real-Time Market Analysis" but the data comes from a static or periodically-refreshed dataset, not a live feed. This is a credibility issue, especially for fintech or BFSI evaluators.

**Fix (option A):** Relabel it "Latest Market Analysis" or "Daily-Refreshed Data" and add a "Last updated: [date]" timestamp.

**Fix (option B):** Wire up a scheduled data fetch (daily cron via Vercel, GitHub Actions, or a simple API call to AMFI/MFI) so the label is technically accurate.

---

### 7. No way to add funds to Compare from the Screener

**Type:** UX flow | **Priority:** Medium

The Screener table rows link only to `/fund/[id]`. There is no "Add to Compare" row action. Users who find a fund in the Screener must navigate away, go to `/compare`, and re-search for the same fund to add it.

**Fix:** Add a compact "Compare" icon button or checkbox to each Screener row. On click, push the fund to a global compare state and show a floating compare bar at the bottom (similar to Zerodha's basket UI).

---

## Part 2: Feature Additions

Grouped by impact. The first three have the highest signal value for BFSI and fintech hiring managers because they demonstrate product thinking around real user outcomes, not just data display.

---

### High Impact

#### 1. Goal-Based Investing page (`/goals`)

A reverse SIP calculator: the user inputs a target corpus (e.g., "I want ₹50L in 10 years"), a preferred return rate, and the tool calculates the monthly SIP required. Then it recommends the top-matching FundScope funds to achieve that goal.

**Why it matters:** This is the clearest demonstration of product thinking. It moves the app from "here is data" to "here is what to do with the data." Every financial app hiring manager asks candidates how they would make data actionable. This page is the answer.

**Key components:**
- Target amount, time horizon, and risk tolerance as inputs
- Monthly SIP amount output with compounding breakdown chart
- Fund recommendations filtered by Grade (S and A tier) and aligned risk level
- Link to `/sip` for deeper simulation

---

#### 2. Tax Corner (`/tax`)

Two tools in one page:

**ELSS Filter:** Pre-filtered Screener view showing only ELSS funds eligible for Section 80C deduction, with the maximum deductible amount (₹1.5L) pre-filled as context.

**LTCG / STCG Calculator:** User inputs investment amount, buy date, sell date, and fund type (equity/debt). Tool outputs the applicable tax slab, taxable gain, and after-tax return. Compares it to the pre-tax return shown in FundScope's score.

**Why it matters:** After-tax returns are the real returns. No basic mutual fund analyser includes this. It is a concrete pitch to any interviewer: "I built a tool that shows users what they actually take home."

---

#### 3. Benchmark Comparison page (`/benchmarks`)

A dedicated page comparing major index benchmarks (Nifty 50, Sensex, Nifty Next 50, Nifty Midcap 150, Nifty Small Cap 250) against the average 1Y, 3Y, and 5Y CAGR of each FundScope fund category.

**Why it matters:** The Insights page (`/insights`) already has an "Active vs Index Reality" section, but it is a static pie chart. This page turns that insight into a live, interactive drilldown with sortable comparisons and a clear narrative: "X% of large-cap funds failed to beat the Nifty 50 over 5 years."

**Key components:**
- Benchmark vs category average CAGR table (sortable by time period)
- Beat rate: what percentage of funds in each category outperformed the benchmark
- Highlight outliers: funds that consistently beat their benchmark (links to `/fund/[id]`)

---

#### 4. Inflation-Adjusted Returns toggle (on `/sip`)

Add a toggle to the existing Wealth Projector calculator that switches the output between nominal and real (inflation-adjusted) wealth.

**Example:** ₹5,000/month at 12% for 20 years = ₹49.9L nominal. At 7% assumed inflation, the real value is approximately ₹12.8L in today's purchasing power. That delta is a powerful financial literacy moment and a differentiating feature.

**Implementation:** One additional input (assumed inflation rate, defaulting to 6%), one extra line on the output chart, minimal code change.

---

#### 5. Export to PDF and CSV

**CSV export:** From the Screener and Shortlist pages, allow users to download the current filtered/sorted view as a `.csv` file. This alone turns FundScope from a viewer into a tool used for actual research.

**PDF export:** From the Fund Detail page and the Comparison page, generate a clean single-page PDF summary. Use `jsPDF` or a server-side route with `puppeteer`. The output should look like a one-pager you could attach to an email.

---

#### 6. AMC / Fund House page (`/amc`)

Group all tracked funds by their Asset Management Company (HDFC Mutual Fund, Mirae Asset, SBI MF, Axis MF, etc.) and display:
- Average FundScope score across all their funds
- Number of S-Tier and A-Tier funds
- Top-performing fund from each AMC
- Consistency score (how many of their funds beat category average)

**Why it matters:** This is an angle no basic fund screener includes. It tells a different story: which AMC consistently delivers quality across their entire fund lineup, not just one star fund.

---

### Nice to Have

#### 7. AI chat assistant

Embed an Anthropic API-powered chat widget (Claude in the artifact) that accepts natural language queries against the fund dataset.

**Example queries:**
- "Show me debt funds with 3Y CAGR above 7% and volatility below 3"
- "Which mid-cap funds have an S grade and expense ratio under 0.5%?"
- "Compare HDFC Mid-Cap Opportunities vs Mirae Asset Midcap"

This is achievable using the structured dataset already powering the Screener as the context source.

---

#### 8. Fund Manager analytics section

Track fund managers across the dataset and surface:
- Which manager runs the most S-Tier funds
- Average score of all funds under a given manager
- Whether a manager's funds consistently outperform their category benchmark

A lightweight addition that adds a human layer to quantitative scoring.

---

#### 9. Watchlist and grade alerts

Let users save funds to a watchlist (separate from the curated Shortlist) and get notified when a fund's FundScope grade changes. Requires a backend or a polling mechanism on the client side.

This is a "phase 2" feature that needs infrastructure but significantly increases repeat visit rate.

---

#### 10. Real NAV history chart with date range controls

The Fund Detail page mentions "Historical return visualization" but likely shows period-return bars (1Y, 3Y, 5Y) rather than a true NAV line chart. A proper line chart with date range controls (1M, 3M, 6M, 1Y, 3Y, Max) is the standard that users expect.

Data source: AMFI publishes daily NAV for all funds as a public text file. A scheduled fetch into a simple database (or even a flat JSON) enables this.

---

#### 11. Light mode toggle

FundScope currently uses a premium dark-mode-only aesthetic. A system-preference-aware toggle (respecting `prefers-color-scheme`) would significantly widen the accessible audience and remove the friction for users on high-brightness screens.

**Implementation:** CSS custom property swaps on `:root`. Framer Motion handles the transition. State persisted to `localStorage`.

---

## Summary Table

| Item | Type | Priority |
|---|---|---|
| SIP page missing from navbar | Fix | Critical |
| Shortlist hidden on desktop | Fix | Critical |
| About and Risk Profile unreachable | Fix | High |
| Fund Detail has no action CTAs | Fix | High |
| Shortlist resets on refresh | Fix | High |
| "Real-Time" label is misleading | Fix | Medium |
| No add-to-compare from Screener | Fix | Medium |
| Goal-Based Investing page | Addition | High |
| Tax Corner (ELSS + LTCG) | Addition | High |
| Benchmark Comparison page | Addition | High |
| Inflation-adjusted SIP toggle | Addition | High |
| Export to PDF and CSV | Addition | High |
| AMC / Fund House page | Addition | Medium |
| AI chat assistant | Addition | Medium |
| Fund Manager analytics | Addition | Low |
| Watchlist and grade alerts | Addition | Low |
| Real NAV history chart | Addition | Low |
| Light mode toggle | Addition | Low |

---

*Audit based on PAGES.md architecture document. June 2026.*
