/**
 * ScopeGenie — Client-side fund intelligence engine.
 *
 * This module powers the chat widget entirely on the client by
 * matching user intent via keyword analysis and then surfacing
 * real fund data from compact-data.json. No API key required.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface CompactFund {
  code: string;
  name: string;
  nav: number;
  sub_category: string;
  category: string;
  cagr_5yr: number;
  cagr_3yr: number;
  cagr_1yr: number;
  volatility: number;
  alpha_5yr: number;
  sharpe_ratio: number;
  score: number;
  score_grade: string;
  benchmark: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Category keyword map ────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Large Cap': ['large cap', 'largecap', 'large-cap', 'bluechip', 'blue chip', 'blue-chip', 'nifty 50', 'nifty50'],
  'Mid Cap': ['mid cap', 'midcap', 'mid-cap'],
  'Small Cap': ['small cap', 'smallcap', 'small-cap'],
  'Flexi Cap': ['flexi cap', 'flexicap', 'flexi-cap', 'flexible', 'multi cap', 'multicap'],
  'ELSS': ['elss', 'tax saving', 'tax-saving', '80c', 'section 80c'],
  'Sectoral': ['sector', 'sectoral', 'thematic', 'pharma', 'it fund', 'banking fund', 'infra', 'infrastructure', 'technology'],
  'Index': ['index fund', 'index', 'passive', 'etf', 'nifty index', 'sensex'],
  'Debt': ['debt', 'bond', 'gilt', 'liquid', 'money market', 'corporate bond', 'fixed income', 'overnight'],
  'Hybrid': ['hybrid', 'balanced', 'aggressive hybrid', 'conservative hybrid', 'dynamic asset', 'equity savings'],
  'Value': ['value', 'contra', 'dividend yield'],
  'Focused': ['focused'],
};

// ─── Intent detection ────────────────────────────────────────────

type Intent =
  | { type: 'greeting' }
  | { type: 'top_funds'; category?: string; count: number }
  | { type: 'fund_lookup'; query: string }
  | { type: 'compare'; names: string[] }
  | { type: 'category_list' }
  | { type: 'methodology' }
  | { type: 'tax' }
  | { type: 'sip' }
  | { type: 'goals' }
  | { type: 'risk'; level: 'low' | 'moderate' | 'high' }
  | { type: 'worst_funds' }
  | { type: 'grade_explain'; grade: string }
  | { type: 'what_is'; term: string }
  | { type: 'help' }
  | { type: 'unknown'; message: string };

function detectIntent(message: string): Intent {
  const msg = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|namaste|yo|sup|good morning|good evening|hola)\b/.test(msg)) {
    return { type: 'greeting' };
  }

  // Help
  if (/^(help|what can you do|commands|menu|capabilities)/.test(msg)) {
    return { type: 'help' };
  }

  // Methodology
  if (/methodolog|how.*scor|how.*grade|how.*rank|scoring.*model|what.*score.*mean/.test(msg)) {
    return { type: 'methodology' };
  }

  // Tax
  if (/tax|ltcg|stcg|capital gain|80c|elss.*tax|taxation/.test(msg)) {
    return { type: 'tax' };
  }

  // SIP
  if (/\bsip\b|systematic investment|monthly invest|sip calculator/.test(msg)) {
    return { type: 'sip' };
  }

  // Goals
  if (/goal|retirement|child|education|house|wedding|emergency|financial plan/.test(msg)) {
    return { type: 'goals' };
  }

  // Grade explanation
  const gradeMatch = msg.match(/what.*grade\s*([sabcd])\b|grade\s*([sabcd])\s*mean|explain.*grade\s*([sabcd])/);
  if (gradeMatch) {
    const grade = (gradeMatch[1] || gradeMatch[2] || gradeMatch[3]).toUpperCase();
    return { type: 'grade_explain', grade };
  }

  // Categories list
  if (/categor|all.*types|types.*fund|list.*categor/.test(msg)) {
    return { type: 'category_list' };
  }

  // Compare
  if (/compare|vs|versus|difference between|which.*better/.test(msg)) {
    return { type: 'compare', names: [] };
  }

  // Risk-based
  if (/low risk|safe|conservative|stable|capital protect/.test(msg)) {
    return { type: 'risk', level: 'low' };
  }
  if (/moderate risk|balanced|medium risk/.test(msg)) {
    return { type: 'risk', level: 'moderate' };
  }
  if (/high risk|aggressive|high return|maximum growth/.test(msg)) {
    return { type: 'risk', level: 'high' };
  }

  // Worst funds
  if (/worst|lowest.*score|bottom|poor.*perform|bad fund|avoid/.test(msg)) {
    return { type: 'worst_funds' };
  }

  // What is (definitions)
  const whatIsMatch = msg.match(/what(?:'s| is| are)\s+(.+?)(?:\?|$)/);
  if (whatIsMatch) {
    const term = whatIsMatch[1].trim();
    if (/sharpe|sortino|alpha|beta|cagr|nav|volatil|drawdown|expense ratio|aum/.test(term)) {
      return { type: 'what_is', term };
    }
  }

  // Top/best funds (optionally with category)
  if (/best|top|recommend|suggest|good fund|pick|highest.*scor/.test(msg)) {
    const countMatch = msg.match(/top\s*(\d+)/);
    const count = countMatch ? Math.min(parseInt(countMatch[1]), 15) : 5;
    // Check for a category
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => msg.includes(kw))) {
        return { type: 'top_funds', category: cat, count };
      }
    }
    return { type: 'top_funds', count };
  }

  // Specific fund lookup (fallback — try to find a fund name match)
  if (msg.length > 5) {
    return { type: 'fund_lookup', query: msg };
  }

  return { type: 'unknown', message: msg };
}

// ─── Helpers ─────────────────────────────────────────────────────

function fmt(n: number | undefined | null, decimals = 1): string {
  if (n == null || isNaN(n)) return 'N/A';
  return n.toFixed(decimals);
}

function fundLink(fund: CompactFund): string {
  return `[${fund.name}](/fund/${fund.code}/)`;
}

function fundCard(fund: CompactFund, rank?: number): string {
  const prefix = rank != null ? `**${rank}.** ` : '';
  return `${prefix}${fundLink(fund)}
   Grade **${fund.score_grade}** · Score **${fund.score}**/100 · 5Y CAGR **${fmt(fund.cagr_5yr)}%** · Volatility **${fmt(fund.volatility)}%** · Sharpe **${fmt(fund.sharpe_ratio, 2)}**`;
}

function matchCategory(fund: CompactFund, category: string): boolean {
  const combined = `${fund.category} ${fund.sub_category}`.toLowerCase();
  const target = category.toLowerCase();
  // Direct match
  if (combined.includes(target)) return true;
  // Keyword-based match
  const keywords = CATEGORY_KEYWORDS[category];
  if (keywords) {
    return keywords.some(kw => combined.includes(kw));
  }
  return false;
}

function fuzzyMatch(fund: CompactFund, query: string): boolean {
  const name = fund.name.toLowerCase();
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  return words.every(w => name.includes(w));
}

// ─── Response generators ─────────────────────────────────────────

function respondGreeting(): string {
  const greetings = [
    "Hey there! 👋 I'm **ScopeGenie**, your FundScope assistant. I can help you find top-rated mutual funds, explain scores & grades, compare funds, and navigate the app. What would you like to explore?",
    "Namaste! 🙏 I'm **ScopeGenie** — I live inside FundScope's data and can surface the best funds for your criteria, explain our scoring methodology, or point you to the right tool. How can I help?",
    "Hello! ✨ I'm **ScopeGenie**, here to make mutual fund analysis effortless. Ask me about top funds, categories, tax rules, SIP planning, or anything else about FundScope!"
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function respondHelp(): string {
  return `Here's what I can help with:

📊 **Fund Discovery** — "Show me top 5 large cap funds", "Best ELSS funds", "Top small cap"
🔍 **Fund Lookup** — Ask about any specific fund by name
⚖️ **Compare** — "Compare fund A vs fund B"
📈 **Grades & Scores** — "What does Grade S mean?", "How does scoring work?"
💰 **Tax** — "How is LTCG taxed?", "ELSS tax benefits"
📅 **SIP** — "Tell me about SIP", "SIP calculator"
🎯 **Goals** — "Retirement planning", "Goal-based investing"
🛡️ **Risk** — "Low risk funds", "High growth aggressive funds"
📚 **Concepts** — "What is Sharpe ratio?", "What is CAGR?"

Just type naturally — I understand conversational queries!`;
}

function respondTopFunds(funds: CompactFund[], category?: string, count: number = 5): string {
  let filtered = funds;
  if (category) {
    filtered = funds.filter(f => matchCategory(f, category));
  }

  // Filter out FMPs and closed-ended funds unless specifically asked
  if (!category || !category.toLowerCase().includes('close')) {
    filtered = filtered.filter(f => !f.category.toLowerCase().includes('close'));
  }

  const sorted = [...filtered].sort((a, b) => b.score - a.score).slice(0, count);

  if (sorted.length === 0) {
    return `I couldn't find funds matching "${category || 'your criteria'}" in the current dataset. Try browsing the full [Fund Screener](/screener) for a more granular search.`;
  }

  const header = category
    ? `Here are the **top ${sorted.length} ${category}** funds by FundScope score:`
    : `Here are the **top ${sorted.length} funds** across all categories:`;

  const cards = sorted.map((f, i) => fundCard(f, i + 1)).join('\n\n');

  return `${header}

${cards}

💡 *Scores are based on weighted CAGR, volatility, Sharpe ratio, and consistency. Past performance doesn't guarantee future results.*

Want to compare any of these? Check the [Compare Tool](/compare).`;
}

function respondFundLookup(funds: CompactFund[], query: string): string {
  const matches = funds.filter(f => fuzzyMatch(f, query)).slice(0, 5);

  if (matches.length === 0) {
    return `I don't have a fund matching "${query}" loaded right now. Try searching on the [Fund Screener](/screener) for a comprehensive lookup across all 10,000+ funds.`;
  }

  if (matches.length === 1) {
    const f = matches[0];
    return `Here's what I found:

${fundCard(f)}

**Performance Breakdown:**
| Period | CAGR |
|--------|------|
| 1 Year | ${fmt(f.cagr_1yr)}% |
| 3 Year | ${fmt(f.cagr_3yr)}% |
| 5 Year | ${fmt(f.cagr_5yr)}% |

Alpha (5Y): **${fmt(f.alpha_5yr)}%** · NAV: ₹${fmt(f.nav, 2)}

👉 [View full analysis](/fund/${f.code}/) for detailed charts, rolling returns, and benchmark comparison.`;
  }

  const cards = matches.map((f, i) => fundCard(f, i + 1)).join('\n\n');
  return `I found ${matches.length} funds matching your query:

${cards}

Click any fund name to see its full analysis page.`;
}

function respondMethodology(): string {
  return `**FundScope Scoring Model (1-100)**

Each fund gets a composite score built from these weighted factors:

| Factor | Weight | What it measures |
|--------|--------|-----------------|
| 5Y CAGR | 30% | Long-term compounding power |
| 3Y CAGR | 20% | Medium-term momentum |
| 1Y CAGR | 10% | Recent performance |
| Volatility | 15% | Price stability (lower is better) |
| Sharpe Ratio | 15% | Risk-adjusted return efficiency |
| Consistency | 10% | Rolling return reliability |

**Grade Scale:**
- **S** (90-100): Elite — top ~2% of all funds
- **A** (75-89): Excellent — strong across all metrics
- **B** (60-74): Good — solid with minor weaknesses
- **C** (40-59): Average — meets baseline expectations
- **D** (0-39): Below average — underperforming peers

The score is always relative within a fund's own category, so a Grade A debt fund isn't being compared against a Grade A equity fund.

📖 Read the full methodology on the [Benchmarks page](/benchmarks).`;
}

function respondTax(): string {
  return `**Mutual Fund Taxation (FY 2025-26)**

### Equity Funds (≥65% equity allocation)
| Holding Period | Tax Type | Rate |
|---------------|----------|------|
| < 12 months | STCG | **20%** flat |
| ≥ 12 months | LTCG | **12.5%** (above ₹1.25L exemption) |

### Debt Funds (bought on/after April 2023)
| Holding Period | Tax Type | Rate |
|---------------|----------|------|
| Any duration | Income Tax | **At your slab rate** |

⚠️ *The old indexation benefit for debt funds was removed in April 2023. Debt fund gains are now simply added to your taxable income regardless of how long you held.*

### ELSS (Tax Saving)
- Investment up to ₹1.5L/year qualifies for **Section 80C** deduction
- **3-year lock-in** (shortest among 80C instruments)
- LTCG on redemption taxed at 12.5% above ₹1.25L

🔢 Use the [Tax Calculator](/tax) for exact estimates on your portfolio.`;
}

function respondSIP(): string {
  return `**Systematic Investment Plan (SIP)**

SIP is the simplest way to invest in mutual funds — you invest a fixed amount at regular intervals (usually monthly) regardless of market conditions.

**Key Benefits:**
- **Rupee Cost Averaging** — You buy more units when prices are low and fewer when prices are high, averaging out your cost
- **Compounding** — Even small monthly amounts compound dramatically over decades
- **Discipline** — Automates the "invest regularly" habit

**Quick Example:**
₹10,000/month SIP for 20 years at 12% CAGR → approximately **₹1 Crore** from just ₹24L invested.

💡 **Pro tip:** Step-up your SIP by 10% annually and that same ₹1 Crore becomes ₹1.8 Crore.

📊 Model your exact scenario with the [SIP & Wealth Projector](/sip) — it uses real fund return data, not assumptions.`;
}

function respondGoals(): string {
  return `**Goal-Based Planning**

The best mutual fund for you depends entirely on *when* you need the money:

| Time Horizon | Risk Level | Suggested Category |
|-------------|------------|--------------------|
| < 1 year | Very Low | Liquid / Overnight |
| 1-3 years | Low | Short Duration Debt / Corporate Bond |
| 3-5 years | Moderate | Hybrid / Balanced Advantage |
| 5-10 years | Moderate-High | Flexi Cap / Large Cap |
| 10+ years | High | Mid Cap / Small Cap / ELSS |

**Common Goals:**
🏠 **House Down Payment** (3-5 yrs) → Hybrid or Conservative Equity
🎓 **Child's Education** (10+ yrs) → Flexi Cap + Mid Cap combo
🏖️ **Retirement** (15-30 yrs) → Small Cap + Mid Cap (max compounding)
🚨 **Emergency Fund** (instant access) → Liquid Fund only

🎯 Use the [Goal Planner](/goals) to set a target amount and timeline — it'll recommend exact SIP amounts and fund categories.`;
}

function respondRisk(funds: CompactFund[], level: 'low' | 'moderate' | 'high'): string {
  let filtered = funds.filter(f => !f.category.toLowerCase().includes('close'));

  if (level === 'low') {
    filtered = filtered
      .filter(f => f.volatility < 12 && f.score >= 50)
      .sort((a, b) => a.volatility - b.volatility)
      .slice(0, 5);
    const cards = filtered.map((f, i) => fundCard(f, i + 1)).join('\n\n');
    return `**Low-Risk Funds** (lowest volatility, score ≥ 50):

${cards || 'No funds match this strict filter. Try the [Screener](/screener) with custom volatility thresholds.'}

These tend to be debt, liquid, or conservative hybrid funds. Lower volatility means steadier ride, but typically lower long-term returns.`;
  }

  if (level === 'moderate') {
    filtered = filtered
      .filter(f => f.volatility >= 10 && f.volatility <= 20 && f.score >= 60)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const cards = filtered.map((f, i) => fundCard(f, i + 1)).join('\n\n');
    return `**Moderate-Risk Funds** (balanced volatility 10-20%, score ≥ 60):

${cards || 'No funds match this filter. Adjust criteria on the [Screener](/screener).'}

These offer a balance of growth and stability — great for 5-10 year horizons.`;
  }

  // High risk / aggressive
  filtered = filtered
    .filter(f => f.cagr_5yr > 15 && f.score >= 65)
    .sort((a, b) => b.cagr_5yr - a.cagr_5yr)
    .slice(0, 5);
  const cards = filtered.map((f, i) => fundCard(f, i + 1)).join('\n\n');
  return `**High-Growth Aggressive Funds** (5Y CAGR > 15%, score ≥ 65):

${cards || 'No funds match this filter currently. Try the [Screener](/screener).'}

⚠️ *Higher historical returns come with higher volatility. These are suitable for 10+ year investment horizons where you can ride out drawdowns.*`;
}

function respondWorstFunds(funds: CompactFund[]): string {
  const filtered = funds
    .filter(f => !f.category.toLowerCase().includes('close'))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
  const cards = filtered.map((f, i) => fundCard(f, i + 1)).join('\n\n');
  return `**Lowest-Scoring Funds** in the dataset:

${cards}

⚠️ A low score doesn't necessarily mean "bad" — it means the fund underperforms its category peers on our weighted model. Some may be niche or recently launched. Always check the [full fund page](/explorer) before making decisions.`;
}

function respondGradeExplain(grade: string): string {
  const grades: Record<string, string> = {
    S: '**Grade S (90-100):** Elite tier — the top ~2% of funds. These have exceptional long-term CAGR, low relative volatility, strong Sharpe ratios, and consistent rolling returns. They are the best performers in their category across all measured dimensions.',
    A: '**Grade A (75-89):** Excellent — strong performers with solid returns and good risk management. These funds consistently beat their category average and show reliability across 1Y, 3Y, and 5Y periods.',
    B: '**Grade B (60-74):** Good — above-average funds with minor weaknesses. They perform well overall but may lag on one metric (e.g., slightly higher volatility or lower consistency).',
    C: '**Grade C (40-59):** Average — these meet baseline expectations but don\'t stand out. Typical of index-tracking or recently restructured funds.',
    D: '**Grade D (0-39):** Below average — underperforming their category peers. This could be due to high expense ratios, poor stock selection, or adverse market conditions for the fund\'s strategy.',
  };
  return grades[grade] || `Grade "${grade}" isn't a recognized FundScope grade. We use S, A, B, C, and D.`;
}

function respondWhatIs(term: string): string {
  const t = term.toLowerCase();
  if (/sharpe/.test(t)) return '**Sharpe Ratio** measures risk-adjusted return: *(Fund Return − Risk-Free Rate) ÷ Standard Deviation*. A higher Sharpe means more return per unit of risk. Above 1.0 is good; above 2.0 is excellent. FundScope uses this as 15% of the composite score.';
  if (/sortino/.test(t)) return '**Sortino Ratio** is like Sharpe but only penalises *downside* volatility (losses), not upside. It\'s a fairer measure for funds that have high positive variance. A Sortino above 1.5 is generally strong.';
  if (/alpha/.test(t)) return '**Alpha (5Y)** measures how much a fund outperformed (or underperformed) its benchmark index over 5 years. Positive alpha = the fund manager added value beyond what the market gave. Negative alpha = the benchmark would have been a better choice.';
  if (/beta/.test(t)) return '**Beta** measures a fund\'s sensitivity to market movements. Beta = 1.0 means the fund moves in lockstep with its benchmark. Beta > 1.0 means amplified moves (more volatile); Beta < 1.0 means dampened moves (more stable).';
  if (/cagr/.test(t)) return '**CAGR (Compound Annual Growth Rate)** is the annualised return assuming profits are reinvested. If a fund has a 5Y CAGR of 15%, it means ₹1L invested 5 years ago grew to ~₹2.01L today. FundScope weights 5Y CAGR at 30%, 3Y at 20%, and 1Y at 10%.';
  if (/nav/.test(t)) return '**NAV (Net Asset Value)** is the per-unit price of a mutual fund, calculated daily as: *(Total Assets − Liabilities) ÷ Number of Units*. A higher NAV doesn\'t mean a fund is "expensive" — it just reflects accumulated growth since inception.';
  if (/volatil/.test(t)) return '**Volatility** (annualised standard deviation) measures how wildly a fund\'s returns fluctuate. Lower volatility = smoother ride. FundScope penalises high volatility (15% weight in scoring) because consistency matters for real-world investors.';
  if (/drawdown/.test(t)) return '**Maximum Drawdown (MDD)** is the largest peak-to-trough decline in NAV. If a fund went from ₹100 to ₹60 during a crash, that\'s a 40% MDD. It tells you the worst-case loss you would have experienced.';
  if (/expense/.test(t)) return '**Expense Ratio** is the annual fee a fund charges (deducted from NAV daily). Direct plans have lower expense ratios than regular plans. A 1% difference in expense ratio compounds to a massive gap over 20+ years.';
  if (/aum/.test(t)) return '**AUM (Assets Under Management)** is the total money a fund manages. Larger AUM provides liquidity but can make it harder for the fund to generate alpha (especially in small-cap). Very small AUM (< ₹100 Cr) can be a risk flag.';
  return `I'm not sure about "${term}". Try asking about Sharpe ratio, CAGR, NAV, alpha, beta, volatility, drawdown, expense ratio, or AUM.`;
}

function respondCategoryList(funds: CompactFund[]): string {
  const categories = new Map<string, number>();
  for (const f of funds) {
    const cat = f.category;
    categories.set(cat, (categories.get(cat) || 0) + 1);
  }
  const sorted = [...categories.entries()].sort((a, b) => b[1] - a[1]);
  const rows = sorted.map(([cat, count]) => `| ${cat} | ${count} |`).join('\n');
  return `**Fund Categories in FundScope:**

| Category | Funds |
|----------|-------|
${rows}

Ask me about any category — e.g., "Top 5 large cap funds" or "Best ELSS funds".
Browse all funds in the [Explorer](/explorer).`;
}

function respondUnknown(message: string): string {
  const fallbacks = [
    `I'm specifically designed to help with mutual fund analysis on FundScope. I didn't quite catch the investing angle in your question. Try asking about:\n- "Top 5 mid cap funds"\n- "What is Sharpe ratio?"\n- "How does scoring work?"\n- "Tax on equity funds"\n\nOr type **help** to see everything I can do!`,
    `Hmm, I'm not sure how to help with that — I'm laser-focused on mutual funds and FundScope navigation. Here are some things I'm great at:\n- Fund recommendations by category\n- Score & grade explanations\n- Tax rules and SIP planning\n\nWhat would you like to explore?`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ─── Main engine ─────────────────────────────────────────────────

export function generateResponse(message: string, funds: CompactFund[]): string {
  const intent = detectIntent(message);

  switch (intent.type) {
    case 'greeting':
      return respondGreeting();
    case 'help':
      return respondHelp();
    case 'top_funds':
      return respondTopFunds(funds, intent.category, intent.count);
    case 'fund_lookup':
      return respondFundLookup(funds, intent.query);
    case 'compare':
      return `For comparing funds side by side, head to the [Compare Tool](/compare) — it lets you visualise up to 4 funds with detailed metrics, charts, and benchmark overlays.\n\nOr tell me two fund names and I'll pull their scores for a quick snapshot!`;
    case 'category_list':
      return respondCategoryList(funds);
    case 'methodology':
      return respondMethodology();
    case 'tax':
      return respondTax();
    case 'sip':
      return respondSIP();
    case 'goals':
      return respondGoals();
    case 'risk':
      return respondRisk(funds, intent.level);
    case 'worst_funds':
      return respondWorstFunds(funds);
    case 'grade_explain':
      return respondGradeExplain(intent.grade);
    case 'what_is':
      return respondWhatIs(intent.term);
    case 'unknown':
      return respondUnknown(intent.message);
    default:
      return respondUnknown(message);
  }
}
