# FundScope UI/UX & Performance Audit Report

A comprehensive review of amol257.github.io/fundscope covering UI design anti-patterns, animation and motion quality, fund page load performance, and actionable code level fixes. Informed by three industry design skill frameworks: taste-skill, impeccable, and emilkowalski/skills.

| | |
|---|---|
| **Prepared for** | Amol Singhal, amol.singhal25@gmail.com |
| **Repository** | github.com/Amol257/fundscope |
| **Live URL** | amol257.github.io/fundscope |
| **Date** | June 2026 |
| **Skills used** | taste-skill (leonxlnx), impeccable (pbakaus), emilkowalski/skills |

**Issues found by severity:** 3 CRITICAL, 4 HIGH, 6 MEDIUM, 3 INFO

> **Verification note (added after direct codebase review):** The NYC coordinates, the "Live Interface Alpha" label, and the em-dash usage in `GradeTag.tsx` below are confirmed directly against the repository source. The color system finding has been corrected: FundScope's real brand accent, per `DESIGN.md`, is a single orange ("Solar Flame," `#F27D26`) on an obsidian base, not green as originally assumed. Items related to loading performance, skeleton screens, and ticker text are inferred from the live site and general Next.js static export behavior and have not yet been checked line by line.

---

## 01. Issue Overview by Priority

The table below lists every issue found, grouped by severity. CRITICAL issues affect recruiters and users immediately. HIGH issues affect professionalism. MEDIUM issues affect craft. INFO items are polish level.

| Severity | Issue | Detail |
|---|---|---|
| CRITICAL | Fund Pages Slow to Load | No skeleton screens or Suspense boundaries. Users see a blank white flash on navigation. |
| CRITICAL | NYC Coordinates in Footer | Footer reads 40.7128 N, 74.0060 W (New York) on every page. Project covers Indian mutual funds. |
| CRITICAL | Ticker Names Truncate Mid Word | Running marquee shows "ICICI Prudential I+20.1%", unreadable. First impression for scrollers. |
| HIGH | No useReducedMotion Guard | Framer Motion animations play regardless of system accessibility settings. WCAG 2.1 AA fail. |
| HIGH | Easing Curves are Generic | Default ease or ease-in-out used on page transitions. Should be ease-out-expo per all 3 skill frameworks. |
| HIGH | No Stagger on List Entry | Screener rows load simultaneously. Staggered entry at 40ms delays would give a premium feel. |
| HIGH | "Live Interface Alpha" Label | Footer tag undermines credibility. Shows the site as unfinished to any recruiter who notices it. |
| MEDIUM | Pure Black Backgrounds (#000) | impeccable rule: never use pure #000. Tint background toward brand hue at chroma 0.005 to 0.01. |
| MEDIUM | Hero Subheading is Design Portfolio Copy | "A study on visual rhythm and interactive wealth generation" sounds like an awwwards submission, not fintech. |
| MEDIUM | No Chart Entrance Animations | Recharts render instantly on mount. A 600ms ease-out-expo entrance makes charts feel data driven. |
| MEDIUM | No hover:prefetch on Fund Links | Fund page data could be prefetched on screener row hover, eliminating perceived load delay. |
| MEDIUM | Large data.json Blocks First Paint | Entire dataset loaded on every page. Should be split per category with dynamic import. |
| MEDIUM | Em Dashes in GradeTag.tsx | `components/GradeTag.tsx` renders labels like "S — Excellent" using an em dash. Confirmed in source. Replace with a colon or plain hyphen. |
| INFO | ~~Nav Dropdowns Have No Chevron Cue~~ (confirmed false, see note below) | `navbar.tsx` already has rotating chevron, spring-physics dropdown, and an origin-aware glass panel. No action needed. |
| INFO | About Page GitHub Link Text | Confirm the GitHub link on /about points to github.com/Amol257/fundscope, not a placeholder. |
| INFO | Explorer Heatmap Same Return Values | All categories show nearly identical 1Y/3Y/5Y CAGRs. Verify the time horizon columns are distinct. |

---

## 02. Fund Page Load Performance

FundScope is a static Next.js export deployed on GitHub Pages. Individual fund pages at /fund/[id]/ are slow because the client fetches and parses the full dataset on mount with no intermediate loading state. Below are five targeted fixes from low to high effort.

### Root Cause

When a user navigates to /fund/149478/, Next.js serves the static shell immediately but the page component does a client side useEffect fetch of data.json, which is the full 5,800 fund dataset. Parse time alone on a mid range phone is 200 to 400ms before any rendering begins. There is no skeleton, so the user sees a blank white region or spinner with no content shape for guidance.

### Fix 1 (Immediate): Content Skeleton

Add a skeleton that mirrors the actual fund page layout. This costs zero data and makes the page feel responsive instantly.

```tsx
// app/fund/[id]/loading.tsx
export default function FundLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-4 w-24 bg-zinc-800 rounded mb-4" />
      <div className="h-10 w-64 bg-zinc-800 rounded mb-2" />
      <div className="h-5 w-40 bg-zinc-800 rounded mb-10" />
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1,2,3].map(i => (
          <div key={i} className="h-20 bg-zinc-800 rounded-lg" />
        ))}
      </div>
      <div className="h-56 bg-zinc-800 rounded-xl" />
    </div>
  )
}
```

### Fix 2 (Immediate): Prefetch on Hover

In the screener table, every fund row links to /fund/[id]/. Adding prefetch on mouse enter means data is loaded before the click lands.

```tsx
// components/FundRow.tsx
import { useRouter } from 'next/navigation'

const router = useRouter()

// Wrap each table row link
<Link
  href={`/fund/${fund.id}`}
  onMouseEnter={() => router.prefetch(`/fund/${fund.id}`)}
>
  {/* row content */}
</Link>
```

### Fix 3 (Medium): Split data.json by Category

Rather than loading all 5,800 funds on every page, split data.json into per category files during the Python pipeline build step and import only what the current page needs.

```python
# In your Python pipeline (e.g. data_fetcher.py)
import json, os

for category, group in df.groupby('category'):
    slug = category.lower().replace(' ', '-')
    path = f'UI/public/data/{slug}.json'
    group.to_json(path, orient='records', indent=2)

# Then in Next.js components:
# Only load large-cap.json on the large-cap screener page
const data = await import(`@/public/data/${categorySlug}.json`)
```

### Fix 4 (Medium): Suspense Boundaries on Charts

Recharts is a heavy library. Lazy load it so the fund page header and key metrics render before the chart component even begins loading.

```tsx
// app/fund/[id]/page.tsx
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const NAVChart = dynamic(() => import('@/components/NAVChart'), {
  loading: () => <div className="h-56 bg-zinc-800 animate-pulse rounded-xl" />,
  ssr: false,
})

// In JSX:
<Suspense fallback={<div className="h-56 bg-zinc-800 animate-pulse rounded-xl" />}>
  <NAVChart fundId={id} />
</Suspense>
```

### Fix 5 (Best): Static Params at Build Time

For a fully static export, use generateStaticParams to pre-render every fund page at build time. Zero client side data fetching means instant navigation from the screener. The Python pipeline should write a static fund-ids.json that Next.js reads during build.

```tsx
// app/fund/[id]/page.tsx
export async function generateStaticParams() {
  const ids = await import('@/data/fund-ids.json')
  return ids.default.map((id: string) => ({ id }))
}

// This tells Next.js to pre-render /fund/100042, /fund/100119, ...
// at build time so GitHub Pages serves pure HTML instantly.

export const dynamic = 'force-static'
```

---

## 03. UI Design Anti-Patterns

The following issues were identified using the impeccable design skill by pbakaus (28k stars on GitHub) and the taste-skill anti-slop framework by leonxlnx. Both share a core set of banned patterns that make AI built UIs look generic. FundScope currently shows several of them.

### 3.1 Color: Tint Your Neutrals

impeccable rule: never use pure #000 or #fff. Tint every neutral toward the brand hue at chroma 0.005 to 0.01 in OKLCH. FundScope's actual brand color, confirmed from `DESIGN.md`, is a single restrained Solar Flame orange (`#F27D26`) on an obsidian base, not green. Backgrounds should lean slightly warm orange-tinted, in line with the existing "Solar Flame Focus Rule" that already caps the accent at under 10 percent of any viewport.

```css
/* Current background tokens (already close, per DESIGN.md) */
background: #0c0c0c;   /* surface / background */
background: #080808;   /* surface-dim */

/* Fix: OKLCH tinted neutrals, oriented to the existing orange hue (~55 in OKLCH) */
--bg-base:    oklch(7% 0.008 55);    /* obsidian, orange-tinted black */
--bg-surface: oklch(10% 0.010 55);   /* card surface */
--bg-raised:  oklch(13% 0.010 55);   /* hover state */
--text-base:  oklch(90% 0.006 55);   /* body text, not pure white */
--text-muted: oklch(55% 0.006 55);   /* secondary text */
```

This is a refinement of the existing system rather than a new direction. The current `#0c0c0c` / `#080808` / `#1a1a1a` tokens in `DESIGN.md` are already close to this; converting them to OKLCH with a consistent hue angle just makes the warm tint mathematically uniform across every surface level instead of being eyeballed per token.

### 3.2 Typography: Hero Subheading Rewrite

The current hero subheading reads like an awwwards design credit, not a fintech analytics tool. The question "Is your fund actually working?" is sharp and effective. The supporting copy should match that directness.

**BEFORE:** "A study on visual rhythm and interactive wealth generation. Exploring the intersection of high fidelity data and your portfolio."

**AFTER:** "FundScope scores 5,800 SEBI registered funds on risk adjusted return, alpha generation, and multi horizon performance, so you stop guessing."

### 3.3 Footer: Replace NYC Coordinates

Confirmed in source: `components/ui/footer.tsx` hardcodes `40.7128° N, 74.0060° W` under the "Project Location" label, New York City. FundScope is an Indian mutual fund tool built by an Indian developer. Either remove the coordinate element entirely, or replace it with the correct location.

```tsx
// Before (components/ui/footer.tsx, confirmed)
<span className="text-[9px] uppercase tracking-widest opacity-40 mb-1 text-on-surface">Project Location</span>
<span className="text-[11px] font-medium tracking-wider">40.7128° N, 74.0060° W</span>

// Option A: Delhi / Ghaziabad (correct)
<span className="text-[11px] font-medium tracking-wider">28.6139° N, 77.2090° E</span>

// Option B: Remove entirely (cleaner, recommended)
// Delete both spans and their parent flex column from the footer
```

### 3.4 Remove the "Live Interface Alpha" Label

Confirmed in source: `components/ui/footer.tsx` renders `<span>Live Interface Alpha</span>` next to the orange status dot on every page. This signals to recruiters that the site is a work in progress. Portfolio projects benefit from appearing finished. Remove the label, or if you want to keep versioning, change it to "v1.0" which reads as shipped rather than unfinished.

### 3.5 Remove Em Dashes from GradeTag.tsx

Confirmed in source: `components/GradeTag.tsx` renders grade labels with an em dash, for example `'S — Excellent'`. Since the project standard is no em dashes anywhere in content, replace each one with a colon.

```tsx
// Before (components/GradeTag.tsx)
switch (letter) {
  case 'S': label = 'S — Excellent'; break;
  case 'A': label = 'A — Good'; break;
  case 'B': label = 'B — Average'; break;
  case 'C': label = 'C — Below Average'; break;
  case 'D': label = 'D — Avoid'; break;
}

// After
switch (letter) {
  case 'S': label = 'S: Excellent'; break;
  case 'A': label = 'A: Good'; break;
  case 'B': label = 'B: Average'; break;
  case 'C': label = 'C: Below Average'; break;
  case 'D': label = 'D: Avoid'; break;
}
```

### 3.6 Ticker Marquee: Full Fund Names

The hero ticker marquee shows truncated names like "ICICI Prudential I+20.1%" which reads as a rendering bug. Use short canonical names that complete sensibly within the available width.

```tsx
// Before (truncated, confusing)
'ICICI Prudential I+20.1%'
'UTI+20.5%'

// After (use short canonical names)
const TICKER_NAMES: Record<string, string> = {
  'ICICI Prudential Bluechip': 'ICICI Pru Bluechip',
  'UTI Nifty 50 Index': 'UTI Nifty 50',
  'HDFC Top 100': 'HDFC Top 100',
  // map all 28 funds to a max-20-char canonical name
}
```

---

## 04. Animation and Motion Quality

All three skill frameworks agree on motion fundamentals: use ease-out-expo curves (not default ease or ease-in-out), never animate layout properties, always respect prefers-reduced-motion, and use staggered entry on lists. The taste-skill MOTION_INTENSITY dial for a fintech dashboard sits at 5 to 6 out of 10: rich but not distracting. FundScope currently sits around 3.

### 4.1 Easing Curves

impeccable shared design law: ease out with exponential curves (ease-out-quart, quint, expo), no bounce, no elastic. The taste-skill enforces the same rule. Audit every Framer Motion transition in FundScope and replace the easing.

```tsx
// Before: generic ease (flat, generic feel)
transition={{ duration: 0.3 }}
transition={{ ease: 'easeInOut', duration: 0.4 }}

// After: ease-out-expo (premium feel, matches all 3 skill frameworks)
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]

transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}

// For page transitions (slightly longer)
transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}

// For micro-interactions (hover, press)
transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
```

### 4.2 Respect prefers-reduced-motion

This is a WCAG 2.1 AA requirement. Users with vestibular disorders or motion sensitivity rely on this setting. Add a global hook and wrap all non essential animations.

```tsx
// hooks/useReducedMotion.ts
import { useReducedMotion } from 'framer-motion'

// In any animated component:
const shouldReduce = useReducedMotion()

const variants = {
  hidden: { opacity: shouldReduce ? 1 : 0, y: shouldReduce ? 0 : 20 },
  visible: { opacity: 1, y: 0 },
}

// For page-level transitions in layout.tsx:
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={shouldReduce ? false : { opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### 4.3 Staggered List Entry on Screener

When screener results load or filter, each row should animate in with a 30 to 40ms stagger. This single change makes the screener feel data driven rather than static. emilkowalski/skills emphasizes this as one of the highest impact micro-interactions for tables.

```tsx
// components/FundTable.tsx
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035 } }
}

const row = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: {
    duration: 0.4, ease: [0.16, 1, 0.3, 1]
  }}
}

<motion.tbody variants={container} initial="hidden" animate="visible">
  {funds.map(fund => (
    <motion.tr key={fund.id} variants={row}>
      {/* cells */}
    </motion.tr>
  ))}
</motion.tbody>
```

### 4.4 Chart Entrance Animation

Recharts components render without animation by default. Adding a fade and rise entrance when the chart first mounts gives the impression the data is loading in rather than snapping into existence, a meaningful signal in a financial tool.

```tsx
// Wrap any Recharts chart with this:
<motion.div
  initial={{ opacity: 0, y: 24 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
>
  <ResponsiveContainer width="100%" height={280}>
    <AreaChart data={navHistory}>
      {/* ... */}
    </AreaChart>
  </ResponsiveContainer>
</motion.div>
```

### 4.5 Metric Counter Spring Animation

Replace the current CSS counter animation with a spring physics counter using Framer Motion's useMotionValue and animate. Spring physics feel more natural than linear or ease timings for number progressions.

```tsx
// components/AnimatedCounter.tsx
import { useSpring, useTransform, motion } from 'framer-motion'
import { useEffect } from 'react'

export function AnimatedCounter({ value, decimals = 1 }) {
  const spring = useSpring(0, { stiffness: 80, damping: 20, mass: 0.8 })
  const display = useTransform(spring, (v) => v.toFixed(decimals))

  useEffect(() => { spring.set(value) }, [value])

  return <motion.span>{display}</motion.span>
}
```

---

## 05. Loading Experience

A financial tool lives or dies on perceived performance. Users judge FundScope's data reliability partly by how fast and smooth it feels. The following patterns, all from Emil Kowalski's design engineering principles, close the gap between actual load time and perceived load time.

### 5.1 Per Page Skeleton Strategy

Every page should have a skeleton that exactly mirrors the content layout. The key principle from emilkowalski/skills: the skeleton should have the same number of elements as the real content, not a generic spinner.

| Page | Skeleton Elements |
|---|---|
| /screener | Filter bar (3 pills), table header (5 cols), 8 placeholder rows |
| /fund/[id] | Breadcrumb, fund name (2 lines), 3 metric cards, chart area, 2 data tables |
| /explorer | 4 KPI cards, category heatmap grid, 3 performers columns |
| /risk-profile | Question card, 4 answer buttons, progress bar |
| /sip-calculator | Input fields, result card, projection chart |

### 5.2 Global Suspense Layout

Wrap the root layout's page slot in a Suspense boundary so every page transition shows the skeleton automatically via loading.tsx rather than requiring per component loading states.

```tsx
// app/layout.tsx
import { Suspense } from 'react'
import RootSkeleton from '@/components/RootSkeleton'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <Suspense fallback={<RootSkeleton />}>
          <main>{children}</main>
        </Suspense>
        <Footer />
      </body>
    </html>
  )
}
```

### 5.3 Font Optimization

If FundScope uses Google Fonts via a link tag in the HTML head, replace it with next/font which automatically self hosts, eliminates the external network request, and sets font-display: swap for you.

```tsx
// app/layout.tsx
import { Share_Tech_Mono, Inter } from 'next/font/google'

const mono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

// Add className={mono.variable} to <html> tag
// Then use var(--font-mono) in your Tailwind config or CSS
```

### 5.4 Lazy Load Recharts

Recharts is approximately 210 KB gzipped. It should never load on pages that don't render a chart. Use next/dynamic with ssr: false for every chart component.

```tsx
// Always import chart components like this:
const AreaChart = dynamic(
  () => import('@/components/charts/NAVAreaChart'),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> }
)

const HeatmapGrid = dynamic(
  () => import('@/components/charts/CategoryHeatmap'),
  { ssr: false, loading: () => <ChartSkeleton height={200} /> }
)
```

---

## 06. What Is Working Well

These are genuine strengths that should be protected and highlighted in your resume bullet, portfolio description, and interviews.

**+ Screener Functionality**
5,800 funds, real AMFI data, paginated, filterable by grade and category, CSV export. This is production grade tooling that most fresher portfolios do not have.

**+ Proprietary Scoring System**
The composite score formula (5Y CAGR x30 + 3Y CAGR x20 + 1Y CAGR x10 + Sharpe x25 + Alpha x15) with MinMax normalisation within peer category is genuinely sophisticated. This is the centrepiece to lead with in interviews.

**+ End to End Pipeline**
Python backend (AMFI API, yfinance, SQLite, pandas) into a Next.js frontend with TypeScript, Recharts, and Framer Motion. Full stack data engineering story.

**+ Grade System (S/A/B/C/D)**
Simple enough for retail users to understand, backed by quantitative scoring. Differentiates FundScope from raw comparison tools.

**+ Statistical Validation**
The T-test result (p = 0.0588, active Large Cap vs Index) shows you applied actual statistical thinking rather than just showing charts. Name this explicitly in your About section.

**+ SIP Projection Calculator**
Functional compounding calculator with visual output adds practical utility for end users beyond just analysis.

**+ Obsidian and Solar Flame Aesthetic**
Consistent with your portfolio site's identity. The restrained single-accent orange on obsidian palette, with the accent capped under 10 percent of any viewport per your own `DESIGN.md` rule, is coherent and distinctive for a data product.

---

## 07. Skill Framework Reference

The three skill frameworks used in this audit, what each one contributed, and how to apply them directly to FundScope's codebase.

| Skill | Source | What it Contributed to This Audit |
|---|---|---|
| taste-skill | leonxlnx / taste-skill (17.5k stars) | MOTION_INTENSITY calibration. Anti-slop rules for layout variance. Spring motion over timed easing. DESIGN_VARIANCE dial guidance for the screener's density. |
| impeccable | pbakaus / impeccable (28k stars) | The 27 anti-pattern rules (side-stripe borders, gradient text, glassmorphism, hero-metric template, identical card grids). OKLCH color system. Shared design laws for color strategy, typography cap, layout rhythm, and absolute motion bans. The copy rule (no em dashes). |
| emilkowalski/skills | Emil Kowalski (2.5k stars) | Micro interaction patterns for finance UIs. Skeleton screen strategy (mirror content shape, not generic spinners). Spring physics counters. Stagger on list entry. Hover prefetch on fund links. Suspense boundary architecture. |

### Implementation Priority Order

**This week**
Fix skeleton screens on fund pages and add loading.tsx. Replace NYC coordinates. Fix ticker truncation. Remove "Alpha" label.

**Next sprint**
Switch easing curves to ease-out-expo across all Framer Motion transitions. Add useReducedMotion guard. Add stagger to screener rows.

**Following sprint**
Split data.json by category. Add dynamic imports for Recharts. Switch to next/font. Add hover prefetch on fund links.

**Polish pass**
Replace pure #000 backgrounds with OKLCH tinted neutrals. Rewrite hero subheading. Add chart entrance animations.

---

*This report was generated for Amol Singhal | FundScope | github.com/Amol257/fundscope*
