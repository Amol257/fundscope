# FundScope: Dashboard Upgrades and 3D Animation Guide

A complete reference for expanding the `/explorer` dashboard with new KPI components and applying an awwwards-level 3D and animation system across the full app.

---

## Table of Contents

1. [Dashboard: Current State](#1-dashboard-current-state)
2. [Dashboard: New KPI Cards](#2-dashboard-new-kpi-cards)
3. [Dashboard: New Visual Components](#3-dashboard-new-visual-components)
4. [Dashboard: Enhancements to Existing Components](#4-dashboard-enhancements-to-existing-components)
5. [3D and Animation: Library Stack](#5-3d-and-animation-library-stack)
6. [3D and Animation: Page-by-Page Plan](#6-3d-and-animation-page-by-page-plan)
7. [3D and Animation: Implementation Details](#7-3d-and-animation-implementation-details)
8. [3D and Animation: Techniques Reference](#8-3d-and-animation-techniques-reference)
9. [What to Avoid](#9-what-to-avoid)
10. [Priority Build Order](#10-priority-build-order)

---

## 1. Dashboard: Current State

The `/explorer` page currently renders:

| Component | Description |
|---|---|
| KPI cards (x4) | Total funds tracked, avg 3Y CAGR, avg 5Y CAGR, total S-grade funds |
| Bar chart | Average 5Y returns by broad category |
| Distribution chart | Count of funds by score grade (S, A, B, C, D) |
| Top 6 funds grid | Absolute top performers with key metrics |

This is a solid foundation. The issues are that every component is a static snapshot with no time dimension, no interactivity between components, and no density of signal relative to the screen space available.

---

## 2. Dashboard: New KPI Cards

Each card below is a self-contained addition to the existing KPI row. They can be dropped in as a second row or integrated into the existing four.

---

### 2.1 Market Health Score

**What it shows:** A single composite score from 0 to 100 representing the overall quality of the fund universe at the current data refresh. Calculated as a weighted average of three sub-signals.

**Formula:**
```
Market Health Score =
  (Avg Sharpe Ratio across all funds, normalised 0-100) × 0.40
  + (% of funds graded S or A) × 0.35
  + (Avg 3Y CAGR across all funds, normalised to category) × 0.25
```

**Render:** A circular arc gauge, like a speedometer. Score zones: 0-40 red (Stressed), 41-65 amber (Neutral), 66-100 green (Strong). The needle animates from 0 to the final value on mount using Framer Motion.

**Why it matters:** First-time visitors need a one-glance orientation before they dig into charts. This replaces a wall of numbers with a single judgment call that is still quantitatively grounded.

---

### 2.2 Universe Beat Rate

**What it shows:** The percentage of tracked funds that outperformed their category benchmark over 3 years.

**Example display:**
```
Universe Beat Rate
62 of 240 funds beat their benchmark (3Y)
26%
```

**Render:** A horizontal progress bar beneath the number. Color shifts from red below 33% to amber at 33-50% to green above 50%.

**Why it matters:** This is the core active vs index question. Having it as a KPI card means the Insights page answer is visible before the user even navigates there. It creates a pull toward deeper content.

---

### 2.3 Top Category This Period

**What it shows:** The single best-performing fund category for the most recent 1Y period, with its average return.

**Example display:**
```
Top Category (1Y)
Small Cap
Avg 1Y CAGR: 38.4%
```

**Render:** A simple card with the category name large, return below, and a small upward spark icon. Changes dynamically on the 1Y / 3Y / 5Y toggle (see section 4.2).

---

### 2.4 Riskiest Category

**What it shows:** The category with the highest average volatility, alongside its Sharpe Ratio. Gives users an immediate risk anchor.

**Example display:**
```
Highest Volatility
Small Cap
Avg Volatility: 21.3% | Sharpe: 0.74
```

**Render:** Same card structure as above but with an amber or red accent. Pairs intentionally with the Top Category card so users see that the best-performing category is often also the riskiest.

---

### 2.5 New S-Grade Funds (This Refresh)

**What it shows:** How many funds were newly promoted to S-grade since the last data refresh. Also shows how many were demoted from S.

**Example display:**
```
Grade Changes
+3 upgraded to S
-1 downgraded from S
```

**Render:** Two lines in green and red, with delta arrows. Requires storing the previous refresh's grade data for comparison.

---

### 2.6 AUM-Weighted Average Return

**What it shows:** The 3Y CAGR weighted by each fund's AUM, not a simple average. This reflects where investor money actually is versus where the best performance is.

**Example display:**
```
AUM-Weighted 3Y CAGR
11.2%
vs Equal-Weight: 13.8%
```

**Render:** The primary number large, the comparison line below in secondary text. A delta indicator shows whether the market is overweighting or underweighting top performers.

---

## 3. Dashboard: New Visual Components

These are new chart or display blocks to be added below or alongside the existing bar and distribution charts.

---

### 3.1 Category Heatmap

**What it is:** A grid where rows are fund categories and columns are time periods (1Y, 3Y, 5Y). Each cell shows the average CAGR for that category and period, color-coded from deep red (poor) through amber (neutral) to deep green (strong).

**Layout:**
```
                1Y CAGR    3Y CAGR    5Y CAGR
Large Cap        14.2%      12.8%      13.1%
Mid Cap          28.4%      18.3%      17.6%
Small Cap        38.1%      21.4%      16.9%
Flexi Cap        19.3%      14.7%      13.9%
Hybrid           11.8%       9.4%      10.2%
Debt              7.2%       6.8%       6.5%
ELSS             22.6%      16.1%      15.4%
```

**Interaction:** Hovering a cell shows the top fund in that category for that time period. Clicking a cell navigates to the Screener pre-filtered to that category.

**Why it matters:** The existing bar chart shows one time period. This component shows 21 data points in the same footprint, which is a significant density improvement. It also makes patterns visible instantly: small cap dominates 1Y but regresses on longer horizons.

**Implementation:** Recharts does not have a native heatmap. Use a CSS grid with computed background colors (interpolating between red, amber, and green based on value) or bring in `recharts` `Cell` components inside a custom chart.

---

### 3.2 Fund Momentum Feed

**What it is:** A vertically scrolling feed of recent grade changes, styled like a trading terminal activity log.

**Example entries:**
```
▲ Mirae Asset Mid Cap Fund          A → S    3h ago
▼ Axis Small Cap Fund               S → A    1d ago
▲ HDFC Flexi Cap Fund               B → A    2d ago
▲ Nippon India Small Cap            A → S    3d ago
▼ UTI Nifty 50 Index Fund           A → B    5d ago
```

**Render:** Each row has a green or red arrow icon, fund name, grade change as a badge transition (old grade with strikethrough or muted, new grade bolded), and a relative timestamp. The feed auto-scrolls slowly in a loop when there are 10 or more entries (CSS animation, pauseable on hover).

**Why it matters:** This adds a time dimension to what is currently a static snapshot. The dashboard stops being a photo and starts being a live feed.

**Implementation:** Requires storing at least two snapshots of grade data per fund. On each data refresh, diff the previous and current grades, persist the changes to the database or a JSON file with a timestamp.

---

### 3.3 Market Health Gauge (Full Component)

Expanded version of KPI card 2.1. A large semi-circular arc gauge that takes up roughly one-third of the dashboard width.

**Sub-indicators below the arc:**
- Avg Sharpe Ratio: X.XX
- Beat Rate: XX%
- Avg 3Y CAGR: XX.X%

Each sub-indicator has its own mini bar showing its contribution to the composite score.

**Implementation:** SVG arc drawn with a `stroke-dasharray` trick. Animate the `stroke-dashoffset` from the full arc length down to the computed value on mount. No library needed.

```js
// SVG arc animation pattern
const circumference = 2 * Math.PI * radius * 0.5  // half circle
const offset = circumference - (score / 100) * circumference
// Animate stroke-dashoffset from circumference to offset
```

---

### 3.4 Sector Allocation Donut with Drill-Down Filter

**What it is:** A donut chart showing the breakdown of the full fund universe by category. Each slice is sized by fund count.

**Interaction flow:**
1. User sees the donut with all slices rendered
2. Clicking a slice filters the Top 6 funds grid below to only show funds from that category
3. A breadcrumb chip appears above the Top 6 grid: "Showing: Small Cap (42 funds)"
4. Clicking the chip or another slice resets the filter

**Why it matters:** This creates the first direct interaction between two existing components on the dashboard. The user can go from "how is the universe distributed" to "who are the top performers in this segment" in one click.

**Implementation:** Recharts `PieChart` with `activeIndex` state. On slice click, update a `selectedCategory` state that also filters the Top 6 funds data.

---

### 3.5 Volatility Bubble Map (Mini)

**What it is:** A compact scatter plot where each bubble is a fund category. X-axis is average volatility, Y-axis is average 5Y CAGR, bubble size is the number of funds.

**Quadrant labels:**
- Top-left: Best Risk-Adjusted (high return, low vol)
- Top-right: High Octane (high return, high vol)
- Bottom-left: Wealth Preservers (low return, low vol)
- Bottom-right: Worst (low return, high vol)

**Interaction:** Hovering a bubble shows the top fund name and grade from that category. Clicking navigates to the Screener filtered to that category.

**Why it matters:** This is a preview of the Magic Quadrant that lives on the Insights page. It creates a pull: the user sees the chart, gets curious about where specific funds sit, and clicks through to Insights.

**Implementation:** Recharts `ScatterChart`. The chart already exists in Insights, so this is a cut-down version with fewer labels and a smaller footprint.

---

### 3.6 Quick SIP Widget

**What it is:** A minimal inline calculator placed near the bottom of the dashboard.

**Inputs:**
- Monthly SIP amount (slider: ₹1,000 to ₹50,000, step ₹500)
- Time horizon (slider: 1 to 30 years)
- Fund selection: "Best S-Grade" (default) or manual fund search

**Outputs:**
- Projected corpus at average S-grade return
- Total amount invested vs corpus gain split
- A micro bar chart showing compounding curve

**CTA below:** "Run a full simulation" which links to `/sip`.

**Why it matters:** This converts a passive dashboard viewer into an active participant without requiring a page change. The number personalizes the experience immediately.

---

## 4. Dashboard: Enhancements to Existing Components

---

### 4.1 KPI Cards: Add Sparklines

Each of the four existing KPI cards gets a tiny 8-point sparkline in the bottom portion of the card. The sparkline shows the trend of that metric across the last 8 data refreshes.

**Example:** "Avg 3Y CAGR: 14.2%" now has a small line trending upward over the past 8 weeks, making it clear whether the metric is improving or declining.

**Implementation:** Recharts `LineChart` with `width={80}` and `height={32}`, no axes, no tooltip, just the line. Or use a hand-drawn SVG polyline computed from the historical values array.

---

### 4.2 Bar Chart: Multi-Period Toggle

Add a 1Y / 3Y / 5Y button group above the existing "Average 5Y Returns by Category" bar chart. The chart currently only shows 5Y returns.

**Behavior:** Clicking 1Y or 3Y re-renders the chart with that period's data. Use Framer Motion's `AnimatePresence` with a `mode="wait"` to crossfade between datasets so the transition does not feel like a hard reload.

**Why it matters:** This triples the chart's data without adding any visual complexity. It also exposes a genuinely interesting insight: category rankings can flip significantly between 1Y and 5Y horizons.

---

### 4.3 Grade Distribution Chart: Add Percentage Labels and Trend

The existing distribution chart (count of funds by grade) should show:
1. Percentage of total next to each bar (e.g., "S: 18 funds (7.5%)")
2. A small delta indicator showing whether each grade bucket grew or shrank vs the last refresh (e.g., "S ▲2, A ▼1")

This makes the chart actionable rather than purely descriptive.

---

### 4.4 Top 6 Funds Grid: Category Filter Tabs

Add a row of pill filter tabs above the Top 6 grid: All, Large Cap, Mid Cap, Small Cap, Hybrid, Debt.

**Behavior:** Clicking a pill filters the grid in place using Framer Motion's `layout` prop on each card. Cards that no longer match the filter animate out; new cards animate in. The grid does not navigate to a new page.

**Why it matters:** This turns a static list into a browsable component and reduces the need to visit the Screener for simple category-level exploration.

---

## 5. 3D and Animation: Library Stack

The following libraries cover the full awwwards-level animation system. They are ordered by impact per installation cost.

---

### 5.1 Lenis (Install first)

**Package:** `lenis`

**What it does:** Replaces the native browser scroll with smooth inertia-based scrolling. Every awwwards Site of the Day uses it.

**Installation:**
```bash
npm install lenis
```

**Setup in Next.js App Router (`app/layout.tsx`):**
```tsx
'use client'
import Lenis from 'lenis'
import { useEffect } from 'react'

export default function RootLayout({ children }) {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])
  return <html><body>{children}</body></html>
}
```

**Impact:** The entire site feels like a premium product after this single change. It costs 10 minutes and ~4KB.

---

### 5.2 GSAP + ScrollTrigger

**Package:** `gsap` (ScrollTrigger is included)

**What it does:** The industry standard for scroll-scrubbed animations. Powers text reveals, pin sections, parallax layers, and timeline-based entrance animations. The core tool in every awwwards winner.

**Installation:**
```bash
npm install gsap
```

**Basic ScrollTrigger setup:**
```tsx
'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

export default function AnimatedSection() {
  const ref = useRef(null)
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
        }
      }
    )
  }, [])
  return <section ref={ref}>...</section>
}
```

**GSAP + Lenis integration:**
```tsx
// Connect Lenis tick to GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

---

### 5.3 Three.js + React Three Fiber

**Packages:** `three`, `@react-three/fiber`, `@react-three/drei`

**What it does:** Three.js is the WebGL renderer. React Three Fiber (R3F) is a React wrapper that makes Three.js declarative. `@react-three/drei` is a helper library with pre-built components (orbit controls, environment maps, shaders, etc.).

**Installation:**
```bash
npm install three @react-three/fiber @react-three/drei
npm install --save-dev @types/three
```

**Use only on the landing page hero and the Explorer globe.** Do not import Three.js into pages that need to be fast and data-dense.

**Next.js dynamic import (prevents SSR crash):**
```tsx
import dynamic from 'next/dynamic'

const HeroCanvas = dynamic(() => import('@/components/HeroCanvas'), {
  ssr: false,
  loading: () => <div className="hero-placeholder" />,
})
```

---

### 5.4 Framer Motion (Already in stack)

Extend the existing Framer Motion setup with these patterns that are not yet listed in the PAGES.md.

**AnimatePresence for page transitions:**
```tsx
// app/layout.tsx
import { AnimatePresence, motion } from 'framer-motion'

export default function Layout({ children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

**Layout animations for filtered card grids:**
```tsx
<motion.div layout layoutId={fund.id} key={fund.id}>
  <FundCard fund={fund} />
</motion.div>
```

---

## 6. 3D and Animation: Page-by-Page Plan

---

### 6.1 Landing Page (`/`)

This is where the full awwwards treatment belongs. The dark background and brand identity make it the natural home for WebGL.

**Hero section: WebGL noise shader background**

A `<Canvas>` fills the entire hero behind the text. A GLSL simplex noise shader produces a slowly shifting dark surface that responds to mouse position. The noise displacement is subtle: 5-10% movement, not a screensaver.

```glsl
// Fragment shader (simplified)
uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;

float noise(vec2 p) { ... } // simplex noise function

void main() {
  vec2 displaced = vUv + uMouse * 0.05;
  float n = noise(displaced * 3.0 + uTime * 0.3);
  vec3 color = mix(vec3(0.04, 0.04, 0.06), vec3(0.08, 0.10, 0.14), n);
  gl_FragColor = vec4(color, 1.0);
}
```

**Hero text: character scramble reveal**

On page load, the headline characters cycle through random glyphs before settling on the final text. Total duration: 800ms. Libraries: none needed, implement in vanilla JS with `requestAnimationFrame`.

```tsx
const scramble = (el: HTMLElement, finalText: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%'
  let frame = 0
  const totalFrames = 24
  const interval = setInterval(() => {
    el.textContent = finalText
      .split('')
      .map((char, i) => {
        if (frame / totalFrames > i / finalText.length) return char
        return chars[Math.floor(Math.random() * chars.length)]
      })
      .join('')
    if (++frame > totalFrames) clearInterval(interval)
  }, 35)
}
```

**Ticker strip: entrance animation**

The existing ticker strip at the top slides in from `y: -40` to `y: 0` over 600ms on page load, delayed 300ms after the hero text begins its reveal.

**Floating data cards: magnetic + parallax**

The "Real-Time Market Analysis" card on the hero uses a magnetic hover effect: mouse proximity pulls the card slightly toward the cursor. On scroll, it moves at 60% of scroll speed, creating a parallax layer.

```tsx
const handleMouseMove = (e: MouseEvent) => {
  const { left, top, width, height } = card.getBoundingClientRect()
  const x = (e.clientX - left - width / 2) * 0.15
  const y = (e.clientY - top - height / 2) * 0.15
  card.style.transform = `translate(${x}px, ${y}px)`
}
```

**Scroll-triggered section reveals**

Each landing page section (Features, How It Works, Top Funds) reveals with a staggered GSAP animation: headline first, subheadline 80ms later, body content 160ms later.

```tsx
gsap.from(sectionElements, {
  y: 50,
  opacity: 0,
  duration: 0.8,
  stagger: 0.08,
  ease: 'power3.out',
  scrollTrigger: { trigger: section, start: 'top 75%' },
})
```

---

### 6.2 Explorer / Dashboard (`/explorer`)

The dashboard must stay readable and fast. Animations here are entrance-only and subtle.

**KPI card count-up animation**

When the dashboard mounts, each KPI number counts up from 0 to its final value over 1.2 seconds using an easing function. This is a standard pattern but it consistently draws user attention to the numbers before they read the charts.

```tsx
import { useMotionValue, useTransform, animate } from 'framer-motion'

function AnimatedKPI({ value }: { value: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString('en-IN'))
  useEffect(() => {
    animate(count, value, { duration: 1.2, ease: 'easeOut' })
  }, [value])
  return <motion.span>{rounded}</motion.span>
}
```

**Market Health Gauge: animated arc**

The SVG gauge arc animates from 0 to the score value over 1.4 seconds on mount. The needle eases with a slight overshoot (spring easing) to give it mechanical weight.

**Momentum feed: staggered entrance**

The fund momentum feed rows enter with a staggered slide-in from the right, 40ms between each row. After mount, new rows slide in from the top when data refreshes.

**Top 6 grid: layout animation on filter**

When the user clicks a category pill to filter the Top 6 grid, cards that leave animate out with `opacity: 0, scale: 0.95`. Cards that enter animate in from `opacity: 0, y: 20`. Use Framer Motion's `layout` prop for smooth reflow. Duration: 250ms.

**Heatmap: cell-by-cell reveal**

The category heatmap cells reveal row by row on mount: first row fades in at 0ms, second at 60ms, third at 120ms, and so on. Background colors also transition from gray to their computed color over 400ms.

---

### 6.3 Explorer Globe (optional, high impact)

**What it is:** A Three.js sphere in the header area of the Explorer page. Each fund is a dot on the globe, colored by grade (S = gold, A = bright green, B = teal, C = amber, D = red), and sized by score. The globe rotates at 0.002 radians per frame. Clicking a dot navigates to `/fund/[id]`.

**Position:** Dots are placed using spherical coordinates derived from fund category and sub-category as latitude/longitude proxies (this is abstract positioning, not real geography).

**Implementation outline:**
```tsx
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function FundGlobe({ funds }) {
  const ref = useRef()
  useFrame(() => { ref.current.rotation.y += 0.002 })

  const positions = useMemo(() => {
    const pos = new Float32Array(funds.length * 3)
    funds.forEach((fund, i) => {
      const phi = Math.acos(-1 + (2 * i) / funds.length)
      const theta = Math.sqrt(funds.length * Math.PI) * phi
      pos[i * 3]     = Math.cos(theta) * Math.sin(phi) * 2
      pos[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * 2
      pos[i * 3 + 2] = Math.cos(phi) * 2
    })
    return pos
  }, [funds])

  return (
    <group ref={ref}>
      <Points positions={positions}>
        <PointMaterial size={0.05} vertexColors />
      </Points>
    </group>
  )
}
```

**Performance note:** With 400-500 funds, this renders as a `BufferGeometry` with 500 points. At 60fps, it costs under 1ms per frame. It is not a performance risk.

---

### 6.4 Fund Detail Page (`/fund/[id]`)

**Animated radar chart**

The radar/spider chart on the fund detail page reveals on mount: polygon vertices animate from the center outward, each axis growing independently over 800ms with a 60ms stagger between axes. Implementation: animate the radius multiplier from 0 to 1 per axis using `useSpring` from Framer Motion.

**Score reveal: count-up + ring fill**

The proprietary score number counts up from 0 to the final value. Simultaneously, a circular ring border around the score fills clockwise using a `stroke-dashoffset` animation. Total duration: 1.5 seconds.

**Historical return chart: line draw animation**

The historical return line draws from left to right on mount. In Recharts, this is one line of configuration:

```tsx
<Line
  type="monotone"
  dataKey="return"
  isAnimationActive={true}
  animationDuration={1200}
  animationEasing="ease-out"
/>
```

**Grade badge: entrance flip**

The Grade badge (S / A / B etc.) on the fund header enters with a `rotateY` flip from `90deg` to `0deg` over 400ms, giving it the feeling of a physical card flipping to reveal the grade.

---

### 6.5 Screener (`/screener`)

**Filter change animation**

When a user changes the category or grade filter, the table rows do not hard-cut. The departing rows animate out with `opacity: 0, y: -8` over 150ms. The incoming rows animate in with `opacity: 0, y: 8` to `opacity: 1, y: 0` over 200ms, staggered 20ms per row.

**Row hover: reveal action buttons**

On hover, each row slides in a set of action buttons from the right ("View", "Compare", "Shortlist") using a `translateX` reveal. The row background transitions to a subtle highlight.

**Search input: character entrance**

As the user types in the search box, matching fund rows highlight with a brief pulse animation (a quick background flash from accent-color back to transparent). This gives feedback that the filter is responding.

---

### 6.6 Compare Page (`/compare`)

**Fund card entrance: staggered drop**

When the user adds a fund to the comparison, the new fund card drops in from `y: -30, opacity: 0` to `y: 0, opacity: 1` over 300ms.

**Metric bar comparisons: animated fills**

Each metric in the comparison matrix is displayed as a horizontal bar showing relative performance. On mount, bars fill from 0% to their computed width over 800ms with a 50ms stagger per row. This makes it immediately clear which fund wins on each metric before the user reads the numbers.

---

## 7. 3D and Animation: Implementation Details

---

### 7.1 Page Transition System

A full-page transition sweeps on every route change. This is the single element most associated with premium awwwards sites.

**Pattern: overlay wipe**

A fixed `<div>` covers the screen with a dark background on navigate-start, then uncovers on the new page load. The wipe is a `scaleX` transform from `1` to `0` on a `transform-origin: right` element.

**Implementation in Next.js App Router:**

```tsx
// components/PageTransition.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function PageTransition({ children }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

---

### 7.2 Text Reveal System

A reusable component that splits any string into words and reveals each word as a separate `motion.span` with a vertical slide-in.

```tsx
// components/RevealText.tsx
'use client'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const word = {
  hidden: { y: '100%', opacity: 0 },
  show: { y: '0%', opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export function RevealText({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25em', overflow: 'hidden' }}
    >
      {text.split(' ').map((w, i) => (
        <span key={i} style={{ overflow: 'hidden', display: 'inline-block' }}>
          <motion.span variants={word} style={{ display: 'inline-block' }}>{w}</motion.span>
        </span>
      ))}
    </motion.span>
  )
}
```

Usage:
```tsx
<RevealText text="Real-Time Mutual Fund Intelligence" className="text-5xl font-serif italic" />
```

---

### 7.3 Magnetic Button System

Buttons that subtly follow the cursor on hover. Already mentioned in the landing page PAGES.md as "magnetic buttons," here is the complete implementation.

```tsx
// components/MagneticButton.tsx
'use client'
import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export function MagneticButton({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 30 })
  const springY = useSpring(y, { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * strength)
    y.set((e.clientY - cy) * strength)
  }

  const handleMouseLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.div ref={ref} style={{ x: springX, y: springY, display: 'inline-block' }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {children}
    </motion.div>
  )
}
```

---

### 7.4 Noise Shader (Landing Page Hero)

```glsl
// shaders/noise.vert
varying vec2 vUv;
uniform float uTime;
uniform float uAmplitude;

float noise(vec3 p) {
  // Classic Perlin noise implementation (use a GLSL noise library or inline)
  return fract(sin(dot(p, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
}

void main() {
  vUv = uv;
  vec3 pos = position;
  float n = noise(vec3(pos.x * 2.0, pos.y * 2.0, uTime * 0.3));
  pos.z += n * uAmplitude;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

```tsx
// components/HeroCanvas.tsx (dynamically imported, no SSR)
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

function NoisePlane() {
  const mesh = useRef<THREE.Mesh>(null)
  const material = useRef<THREE.ShaderMaterial>(null)

  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10, 64, 64]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertShader}
        fragmentShader={fragShader}
        uniforms={{ uTime: { value: 0 }, uAmplitude: { value: 0.15 } }}
      />
    </mesh>
  )
}

export default function HeroCanvas() {
  return (
    <Canvas camera={{ position: [0, 3, 5], fov: 50 }} style={{ position: 'absolute', inset: 0 }}>
      <NoisePlane />
    </Canvas>
  )
}
```

---

## 8. 3D and Animation: Techniques Reference

A quick reference of every awwwards-level technique and where it applies in FundScope.

| Technique | Library | Where to use | Difficulty |
|---|---|---|---|
| Smooth inertia scroll | Lenis | Entire site | Easy |
| Page route transitions | Framer Motion | App Router layout | Easy |
| Text scramble reveal | Vanilla JS | Landing hero headline | Easy |
| Word-by-word reveal | Framer Motion | Landing page sections | Easy |
| Staggered list entrance | Framer Motion | Dashboard KPIs, feeds | Easy |
| KPI count-up animation | Framer Motion | Dashboard KPIs | Easy |
| SVG arc / gauge animation | SVG + CSS | Market Health gauge | Medium |
| Magnetic hover buttons | Framer Motion | Landing page CTAs | Medium |
| Scroll-scrubbed reveals | GSAP ScrollTrigger | Landing page sections | Medium |
| CSS 3D card flip | CSS perspective | Fund cards hover | Medium |
| Layout animation on filter | Framer Motion | Screener, Top 6 grid | Medium |
| Line draw animation | Recharts native | Fund detail return chart | Easy |
| Radar chart animate-in | SVG + Framer | Fund detail radar | Medium |
| WebGL noise shader | Three.js GLSL | Landing page hero | Hard |
| 3D rotating fund globe | R3F + Three.js | Explorer page header | Hard |
| Particle system | Three.js Points | Landing page hero alt | Hard |
| Post-processing bloom | @react-three/postprocessing | Globe glow effect | Hard |

---

## 9. What to Avoid

These patterns appear on awwwards sites but would actively harm FundScope's usability as a data product.

**3D on data-dense tables:** The Screener table needs to be fast to scan. Do not add depth, rotation, or WebGL to the table rows. Entrance animations on the rows are fine; persistent 3D transforms are not.

**Animation on every interaction:** Reserve animation for page load (entrance), route change (transition), and filter change (layout). If every button click triggers a motion, the UI feels slow and cluttered.

**WebGL on the Screener and Insights charts:** The Recharts visualizations are already correct for their purpose. Replacing them with Three.js equivalents adds maintenance cost and reduces accessibility with no real gain. Animate their entrance instead.

**Animations without `prefers-reduced-motion` support:** Wrap all non-essential animations in a media query check. Users who have set this OS preference must never see motion they did not ask for.

```tsx
// Hook for respecting reduced motion preference
import { useReducedMotion } from 'framer-motion'

function AnimatedCard({ children }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  )
}
```

**Page transitions longer than 400ms:** Anything above 400ms feels like lag. Keep route transitions at 250-350ms.

---

## 10. Priority Build Order

Build in this order to maximize visible progress per sprint.

| Sprint | Items | Estimated time |
|---|---|---|
| 1 | Install Lenis, wire to GSAP ticker | 30 min |
| 1 | KPI count-up animations | 1 hr |
| 1 | Page route transitions (AnimatePresence) | 1 hr |
| 2 | Staggered dashboard entrance animations | 2 hr |
| 2 | Top 6 grid layout animation on filter | 2 hr |
| 2 | Bar chart multi-period toggle | 2 hr |
| 3 | Category heatmap component | 4 hr |
| 3 | Sector allocation donut with drill-down | 3 hr |
| 3 | Market Health gauge (SVG arc) | 3 hr |
| 4 | Landing hero text scramble reveal | 2 hr |
| 4 | GSAP ScrollTrigger section reveals | 3 hr |
| 4 | Magnetic button system | 2 hr |
| 5 | Fund detail: score ring + radar animate-in | 4 hr |
| 5 | Momentum feed component | 4 hr |
| 6 | WebGL noise shader hero background | 6 hr |
| 7 | 3D rotating fund globe on Explorer | 8 hr |

Total estimated time: approximately 48-50 hours across 7 sprints.

---

*Document covers `/explorer` dashboard expansion and full-site 3D and animation system. Based on FundScope PAGES.md architecture review. June 2026.*
