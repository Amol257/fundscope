# FundScope — Visual Effects, Parallax & 3D Animation Guide

> A complete implementation reference for upgrading every page of the UI with  
> parallax scrolling, 3D transforms, scroll-triggered animations, and immersive  
> visual effects — all using the existing **Framer Motion** (`motion`) and  
> **Tailwind CSS** already in the stack. No new libraries required except where noted.

**Existing stack:** Next.js 15 · Framer Motion (`motion` package) · Tailwind CSS 4 · Recharts · Lucide  
**Design language:** Dark (#0c0c0c background), primary orange (#F27D26), serif + mono typography  
**Aesthetic target:** Bloomberg Terminal meets Apple WWDC keynote — data-forward, cinematic, zero decoration for decoration's sake

---

## Table of Contents

1. [Core Motion Primitives to Add](#1-core-motion-primitives-to-add)
2. [globals.css — Animation Foundation](#2-globalscss--animation-foundation)
3. [Parallax System](#3-parallax-system)
4. [Hero Page (`/`) — Full Cinematic Overhaul](#4-hero-page----full-cinematic-overhaul)
5. [Navbar — Scroll-Reactive Glass Effect](#5-navbar--scroll-reactive-glass-effect)
6. [Explorer Page — Stagger Reveal Grid](#6-explorer-page--stagger-reveal-grid)
7. [Fund Detail Page — Immersive Data Theatre](#7-fund-detail-page--immersive-data-theatre)
8. [Compare Page — Cinematic Split Entry](#8-compare-page--cinematic-split-entry)
9. [SIP Calculator — Number Morphing & Gauge](#9-sip-calculator--number-morphing--gauge)
10. [Shared Components — Micro-interactions](#10-shared-components--micro-interactions)
11. [3D Card Tilt Effect](#11-3d-card-tilt-effect)
12. [WebGL Background (Optional Upgrade)](#12-webgl-background-optional-upgrade)
13. [Performance & Accessibility Checklist](#13-performance--accessibility-checklist)
14. [Complete File Diff Summary](#14-complete-file-diff-summary)

---

## 1. Core Motion Primitives to Add

These four reusable components go in `components/ui/motion/` and are used everywhere. Build these first — all other effects depend on them.

### `components/ui/motion/FadeUp.tsx`
The workhorse reveal animation. Every section, every card, every stat uses this.

```tsx
'use client';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;       // stagger delay in seconds
  duration?: number;    // default 0.7
  distance?: number;    // px to travel up, default 32
  className?: string;
  once?: boolean;       // animate only first time in view, default true
}

export function FadeUp({
  children, delay = 0, duration = 0.7, distance = 32, className, once = true
}: FadeUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-80px 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: distance }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
```

### `components/ui/motion/ParallaxLayer.tsx`
Converts any element into a parallax layer. Speed 0.1 = subtle, 0.5 = dramatic.

```tsx
'use client';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;     // 0.1 (subtle) to 0.8 (dramatic)
  className?: string;
}

export function ParallaxLayer({ children, speed = 0.3, className }: ParallaxLayerProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
```

### `components/ui/motion/CountUp.tsx`
Animates any number from 0 to its final value when scrolled into view.

```tsx
'use client';
import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react';
import { useRef, useEffect } from 'react';

interface CountUpProps {
  to: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function CountUp({ to, decimals = 0, suffix = '', prefix = '', duration = 1.8, className }: CountUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px 0px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, to, { duration, ease: 'easeOut' });
      return controls.stop;
    }
  }, [isInView, to, duration, count]);

  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
}
```

### `components/ui/motion/StaggerChildren.tsx`
Wraps a list and staggers each child's entrance.

```tsx
'use client';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] } },
};

export function StaggerChildren({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}

export { itemVariants };
```

---

## 2. `globals.css` — Animation Foundation

Add these to the existing `globals.css` under `@layer utilities` and the existing `@keyframes` block.

```css
/* --- SCROLL BEHAVIOUR --- */
html {
  scroll-behavior: smooth;
}

/* --- GRAIN TEXTURE OVERLAY --- */
@layer utilities {
  .grain-overlay::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.025;
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: overlay;
  }

  /* 3D perspective container */
  .perspective-1000 { perspective: 1000px; }
  .perspective-1500 { perspective: 1500px; }
  .transform-style-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }

  /* Shimmer effect for loading states */
  .shimmer {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.04) 50%,
      rgba(255,255,255,0) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }

  /* Text gradient — for key callout numbers */
  .text-gradient-primary {
    background: linear-gradient(135deg, #F27D26 0%, #f2a672 60%, #F27D26 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Reveal clip — text sweeps in from left */
  .clip-reveal {
    clip-path: inset(0 100% 0 0);
  }
  .clip-reveal-active {
    clip-path: inset(0 0% 0 0);
    transition: clip-path 0.8s cubic-bezier(0.76, 0, 0.24, 1);
  }

  /* Glow pulse for KPI cards */
  .glow-primary {
    box-shadow: 0 0 0 0 rgba(242, 125, 38, 0.4);
    animation: glow-pulse 3s ease-out infinite;
  }
}

/* --- NEW KEYFRAMES --- */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(242, 125, 38, 0.0); }
  50% { box-shadow: 0 0 30px 8px rgba(242, 125, 38, 0.15); }
}

@keyframes orbit {
  from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
}

@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

@keyframes data-stream {
  0% { opacity: 0; transform: translateY(-20px); }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translateY(20px); }
}

@keyframes border-rotate {
  from { --angle: 0deg; }
  to   { --angle: 360deg; }
}
```

Also add the grain overlay to `layout.tsx`:
```tsx
// body className — add 'grain-overlay' to existing classes
<body className="grain-overlay antialiased min-h-screen flex flex-col relative overflow-x-hidden ...">
```

---

## 3. Parallax System

### How it works with Framer Motion

The `useScroll` + `useTransform` hooks from `motion/react` are all you need. No extra library.

```tsx
// Standard pattern — used in hero, section backgrounds, cards
const { scrollY } = useScroll();
const y = useTransform(scrollY, [0, 500], [0, -150]); // moves up 150px over 500px scroll
const opacity = useTransform(scrollY, [0, 300], [1, 0]); // fades out
const scale = useTransform(scrollY, [0, 400], [1, 1.15]); // subtle zoom
```

### Three-layer parallax depth system

Use these three speeds consistently across the whole site for visual coherence:

| Layer | Speed | What goes here |
|---|---|---|
| Background (deepest) | `speed = 0.5` | Ambient glow blobs, grid patterns |
| Mid-ground | `speed = 0.25` | Floating stat cards, decorative elements |
| Foreground (shallowest) | `speed = 0.08` | Main content — barely moves |

---

## 4. Hero Page (`/`) — Full Cinematic Overhaul

This is the most important page. The goal: feel like the first 5 seconds of a Bloomberg/Robinhood TV ad.

### 4.1 Page-load sequence (orchestrated, 0–2.5s)

Replace the simple `initial/animate` on the existing `motion.div` elements with a coordinated timeline:

```tsx
// app/page.tsx — add at top of component
const [phase, setPhase] = useState<'loading' | 'reveal' | 'settle'>('loading');

useEffect(() => {
  const t1 = setTimeout(() => setPhase('reveal'), 200);
  const t2 = setTimeout(() => setPhase('settle'), 1200);
  return () => { clearTimeout(t1); clearTimeout(t2); };
}, []);
```

**Sequence breakdown:**
- 0ms: Page background is #0c0c0c, everything invisible
- 200ms: Grid background fades in from opacity 0 → 0.1
- 400ms: Eyebrow label slides in from Y+20 + fade
- 600ms: H1 first line slides in (italic serif)
- 800ms: H1 second line ("actually working?") slides in + orange glow flares
- 1000ms: Paragraph text fades in
- 1100ms: CTA buttons slide up
- 1200ms: Fund card scales in from 0.9 → 1.0 + slight Y drop
- 1400ms: Floating stat callout cards animate in from their sides
- 1600ms–∞: Float animation takes over on stat cards

### 4.2 Parallax Background Layers

Replace the static background divs with parallax-enabled layers:

```tsx
// Background grid — moves slowest (deepest)
const { scrollY } = useScroll();
const bgY = useTransform(scrollY, [0, 800], [0, -80]);
const bgOpacity = useTransform(scrollY, [0, 600], [0.1, 0]);

<motion.div
  className="absolute inset-0 z-0"
  style={{
    y: bgY,
    opacity: bgOpacity,
    backgroundImage: `
      radial-gradient(circle at center, black, transparent 80%),
      linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)
    `,
    backgroundSize: `100% 100%, 40px 40px, 40px 40px`,
  }}
/>

// Ambient glow blob — moves at mid speed
const glowY = useTransform(scrollY, [0, 800], [0, -200]);
const glowScale = useTransform(scrollY, [0, 800], [1, 1.4]);

<motion.div
  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0"
  style={{ y: glowY, scale: glowScale }}
/>
```

### 4.3 Orbiting Data Points (new decorative element)

Small orbital particles that rotate around the fund card. These replace the static floating cards with something more dynamic:

```tsx
// Three orbital data points
const orbitals = [
  { angle: 0,   delay: 0,    label: 'Sharpe 0.84', color: 'text-primary', duration: 8 },
  { angle: 120, delay: 2.5,  label: 'Alpha +9.9%', color: 'text-success-teal', duration: 12 },
  { angle: 240, delay: 5,    label: 'Score 100', color: 'text-info-blue', duration: 10 },
];

{orbitals.map((o, i) => (
  <motion.div
    key={i}
    className="absolute top-1/2 left-1/2 pointer-events-none"
    style={{ transformOrigin: '0 0' }}
    animate={{ rotate: 360 }}
    transition={{ duration: o.duration, repeat: Infinity, ease: 'linear', delay: o.delay }}
  >
    <div
      className="absolute flex items-center gap-1.5 bg-surface-container-high border border-white/10 px-3 py-1.5 rounded-full shadow-lg"
      style={{ transform: `translateX(${i % 2 === 0 ? 180 : -220}px) translateY(-10px)` }}
    >
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${o.color}`}></span>
      <span className={`text-[9px] font-mono tracking-widest uppercase ${o.color}`}>{o.label}</span>
    </div>
  </motion.div>
))}
```

### 4.4 Scroll-Down Indicator

Add at bottom of hero, fades out as user scrolls:

```tsx
const arrowOpacity = useTransform(scrollY, [0, 200], [1, 0]);

<motion.div
  className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
  style={{ opacity: arrowOpacity }}
>
  <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-white/30">Scroll</span>
  <motion.div
    className="w-px h-16 bg-gradient-to-b from-white/30 to-transparent origin-top"
    animate={{ scaleY: [0, 1, 0] }}
    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
  />
</motion.div>
```

### 4.5 The H1 Text Split Animation

Split "Is your fund" and "actually working?" into individual words and animate each word:

```tsx
'use client';
import { motion } from 'motion/react';

const words1 = ['Is', 'your', 'fund'];
const words2 = ['actually', 'working?'];

const wordVariant = {
  hidden: { opacity: 0, y: 40, rotateX: -15 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { delay: 0.4 + i * 0.1, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }
  }),
};

// In JSX:
<h1 className="text-6xl lg:text-[100px] leading-[0.85] font-light tracking-tighter italic font-serif mb-8 text-on-surface perspective-1000">
  <span className="block">
    {words1.map((w, i) => (
      <motion.span key={w} className="inline-block mr-[0.2em]" custom={i} variants={wordVariant} initial="hidden" animate="visible">
        {w}
      </motion.span>
    ))}
  </span>
  <span className="not-italic font-bold tracking-[-0.04em] text-primary block">
    {words2.map((w, i) => (
      <motion.span key={w} className="inline-block mr-[0.2em]" custom={i + 3} variants={wordVariant} initial="hidden" animate="visible">
        {w}
      </motion.span>
    ))}
  </span>
</h1>
```

### 4.6 Scanline Effect on Fund Card

A subtle animated scanline sweeps down the fund card on hover, like a CRT monitor refreshing:

```tsx
// Inside the fund card motion.div, add this overlay:
<div className="absolute inset-0 overflow-hidden pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
  <motion.div
    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
    animate={{ top: ['-2%', '102%'] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
  />
</div>
```

Add `group` class to the fund card's outer `motion.div`.

---

## 5. Navbar — Scroll-Reactive Glass Effect

The navbar currently has `bg-background/80 backdrop-blur-md` regardless of scroll position. Make it react:

```tsx
// components/ui/navbar.tsx
'use client';
import { useScroll, useMotionValueEvent, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20);
    setHidden(latest > lastScrollY && latest > 100); // hide on scroll down
    setLastScrollY(latest);
  });

  return (
    <motion.header
      className="fixed top-0 w-full z-50 transition-all duration-300"
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        backgroundColor: scrolled ? 'rgba(12, 12, 12, 0.92)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
      }}
    >
      {/* ... existing nav content ... */}
      
      {/* Active indicator — animated underline */}
      <nav className="hidden md:flex gap-8 items-center">
        {[
          { href: '/explorer', label: 'Dashboard' },
          { href: '/sip', label: 'SIP Calculator' },
          { href: '/compare', label: 'Compare' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="relative group text-[11px] font-bold tracking-[0.2em] uppercase text-on-surface">
            <span className={pathname === href ? 'text-primary' : 'text-on-surface/40 group-hover:text-on-surface transition-colors'}>
              {label}
            </span>
            {pathname === href && (
              <motion.div
                layoutId="nav-underline"
                className="absolute -bottom-1 left-0 right-0 h-px bg-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </Link>
        ))}
      </nav>
    </motion.header>
  );
}
```

The `layoutId="nav-underline"` creates a smooth sliding underline that glides between nav items as the route changes — a signature touch.

---

## 6. Explorer Page — Stagger Reveal Grid

### 6.1 Fund Cards — Stagger Entrance

Wrap the fund cards grid with `StaggerChildren` and each card with `motion.div` using `itemVariants`:

```tsx
// app/explorer/page.tsx
import { StaggerChildren, itemVariants } from '@/components/ui/motion/StaggerChildren';
import { motion } from 'motion/react';

// Replace the existing grid div:
<StaggerChildren className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {filteredFunds.map((fund) => (
    <motion.div key={fund.code} variants={itemVariants}>
      {/* existing fund card content */}
    </motion.div>
  ))}
</StaggerChildren>
```

### 6.2 Filter Pills — Micro-interaction

The filter pills currently just change opacity. Add a physical feel:

```tsx
<motion.button
  key={filter}
  onClick={() => setActiveFilter(filter)}
  whileHover={{ scale: 1.04 }}
  whileTap={{ scale: 0.96 }}
  className={`px-4 py-2 text-[10px] font-mono tracking-[0.15em] uppercase border transition-all ${
    activeFilter === filter
      ? 'bg-primary text-on-primary border-primary'
      : 'bg-transparent text-on-surface-variant border-white/10 hover:border-white/30'
  }`}
>
  {/* Animated background for active state */}
  {activeFilter === filter && (
    <motion.div
      layoutId="filter-bg"
      className="absolute inset-0 bg-primary -z-10"
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    />
  )}
  {filter}
</motion.button>
```

Add `relative overflow-hidden` to the button and `position: relative` for the layoutId trick to work.

### 6.3 Fund Card — 3D Tilt on Hover

See Section 11 for the full `<TiltCard>` component. Wrap each fund card link with it:

```tsx
<TiltCard className="block h-full" maxTilt={8} glareEnabled>
  <Link href={`/fund/${fund.code}`}>
    {/* existing card content */}
  </Link>
</TiltCard>
```

### 6.4 Search Bar — Animated Focus State

```tsx
<motion.div
  className="relative"
  animate={{ width: searchFocused ? '28rem' : '24rem' }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  <input
    onFocus={() => setSearchFocused(true)}
    onBlur={() => setSearchFocused(false)}
    // ... rest of props
  />
  {/* Animated bottom border */}
  <motion.div
    className="absolute bottom-0 left-0 h-px bg-primary"
    animate={{ scaleX: searchFocused ? 1 : 0 }}
    transition={{ duration: 0.3 }}
    style={{ transformOrigin: 'left' }}
  />
</motion.div>
```

### 6.5 Header — Parallax Section Title

```tsx
// The "Fund Explorer" header scrolls slower than content
<ParallaxLayer speed={0.15}>
  <h1 className="text-5xl md:text-7xl font-serif italic text-on-surface tracking-tighter">
    Fund Explorer
  </h1>
</ParallaxLayer>
```

---

## 7. Fund Detail Page — Immersive Data Theatre

### 7.1 Page Entry — Hero Score Number

When the fund detail page loads, the composite score should count up:

```tsx
// Replace the static score display with:
<CountUp
  to={fund.score}
  decimals={1}
  className="text-7xl font-serif italic text-on-surface"
  duration={1.5}
/>
```

The SVG score ring should also animate its `stroke-dasharray` on entry (already partially done with `scoreDash` keyframe — extend it with Framer Motion for control):

```tsx
<motion.path
  initial={{ pathLength: 0 }}
  animate={{ pathLength: fund.score / 100 }}
  transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
  // ... rest of SVG path props
/>
```

### 7.2 Metric Cards — Sequential Reveal

The metrics (CAGR, Sharpe, Alpha, Volatility, Consistency) should appear one by one as the user scrolls:

```tsx
const metrics = [
  { label: '5Y CAGR', value: fund.cagr_5yr, suffix: '%', icon: TrendingUp, color: 'text-primary' },
  { label: 'Sharpe Ratio', value: fund.sharpe_ratio, decimals: 3, icon: Activity },
  { label: 'Alpha 5Y', value: fund.alpha_5yr, suffix: '%', prefix: fund.alpha_5yr > 0 ? '+' : '' },
  { label: 'Volatility', value: fund.volatility, suffix: '%', icon: AlertTriangle },
  { label: 'Consistency', value: fund.consistency_3yr, suffix: '%', icon: ShieldCheck },
];

<StaggerChildren className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
  {metrics.map((m, i) => (
    <motion.div key={m.label} variants={itemVariants} className="bg-surface-container border border-white/5 p-6">
      <CountUp to={m.value} decimals={m.decimals ?? 2} suffix={m.suffix ?? ''} prefix={m.prefix ?? ''} className="text-3xl font-serif italic" />
      <p className="text-[10px] font-mono tracking-widest uppercase text-on-surface-variant mt-2">{m.label}</p>
    </motion.div>
  ))}
</StaggerChildren>
```

### 7.3 NAV Chart — Animated Draw-on Entry

The area chart should draw itself left-to-right when it enters the viewport. Recharts doesn't support this natively, but you can trigger it with a mounting delay:

```tsx
const [showChart, setShowChart] = useState(false);
const chartRef = useRef(null);
const isInView = useInView(chartRef, { once: true, margin: '-100px 0px' });

useEffect(() => {
  if (isInView) {
    const t = setTimeout(() => setShowChart(true), 200);
    return () => clearTimeout(t);
  }
}, [isInView]);

// Pass to AreaChart:
<AreaChart isAnimationActive={showChart}>
  <Area isAnimationActive={showChart} animationDuration={1500} animationEasing="ease-out" />
</AreaChart>
```

### 7.4 Radar Chart — Rotate-in Animation

The DNA radar chart should spin in from flat:

```tsx
const radarRef = useRef(null);
const isRadarInView = useInView(radarRef, { once: true });

<motion.div
  ref={radarRef}
  initial={{ opacity: 0, scale: 0.7, rotate: -30 }}
  animate={isRadarInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
  transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
>
  <RadarChart /* ... */ />
</motion.div>
```

### 7.5 Sticky Score Sidebar (Desktop)

On wide screens (≥1280px), the score + grade stick in a left sidebar as the user scrolls through the chart and metrics:

```tsx
// app/fund/[id]/FundDetailClient.tsx
<div className="xl:grid xl:grid-cols-[280px_1fr] gap-12">
  {/* Sticky Score Panel */}
  <div className="hidden xl:block">
    <div className="sticky top-28 space-y-6">
      <div className="bg-surface-container border border-white/5 p-8">
        <CountUp to={fund.score} decimals={1} className="text-6xl font-serif italic text-gradient-primary" />
        <p className="text-[10px] font-mono tracking-widest uppercase text-on-surface-variant mt-3">Composite Score</p>
      </div>
      {/* Grade badge, quick links to sections */}
    </div>
  </div>
  {/* Main content */}
  <div>
    {/* charts, metrics, etc. */}
  </div>
</div>
```

---

## 8. Compare Page — Cinematic Split Entry

### 8.1 Split Screen Entry

The two fund selectors should enter from opposite sides:

```tsx
<div className="grid grid-cols-2 gap-8">
  <motion.div
    initial={{ opacity: 0, x: -60 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {/* Fund A selector */}
  </motion.div>
  <motion.div
    initial={{ opacity: 0, x: 60 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.7, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {/* Fund B selector */}
  </motion.div>
</div>
```

### 8.2 VS Divider Animation

The divider between Fund A and Fund B should be alive:

```tsx
<div className="relative flex items-center justify-center">
  {/* Animated centre divider line */}
  <motion.div
    className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"
    initial={{ scaleY: 0 }}
    animate={{ scaleY: 1 }}
    transition={{ duration: 0.8, delay: 0.4 }}
    style={{ transformOrigin: 'top' }}
  />
  
  {/* VS badge */}
  <motion.div
    className="relative z-10 w-12 h-12 rounded-full border border-white/20 bg-surface-container-high flex items-center justify-center"
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: 'spring', delay: 0.5, stiffness: 300, damping: 20 }}
  >
    <span className="text-[10px] font-mono font-bold tracking-widest text-primary">VS</span>
  </motion.div>
</div>
```

### 8.3 Winner Metric Highlight

When a metric winner is determined, animate a highlight:

```tsx
// For each metric row in the comparison table:
<motion.div
  className={`flex justify-between items-center p-4 border-b border-white/5 ${
    winnerA ? 'relative' : ''
  }`}
>
  {winnerA && (
    <motion.div
      className="absolute inset-0 bg-primary/5 border-l-2 border-primary"
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ transformOrigin: 'left' }}
    />
  )}
  {/* metric content */}
</motion.div>
```

---

## 9. SIP Calculator — Number Morphing & Gauge

### 9.1 Wealth Number — Live Morph Animation

When sliders change, the output wealth number morphs smoothly instead of jumping:

```tsx
import { useSpring, animated } from 'motion/react'; // or use Framer's spring

// Replace static wealth display:
const animatedWealth = useSpring(expectedWealth, {
  stiffness: 100,
  damping: 30,
  mass: 0.5,
});

// In JSX:
<motion.span animate={{ scale: [1.02, 1] }} transition={{ duration: 0.2 }}>
  {formatCurrency(Math.round(animatedWealth.get()))}
</motion.span>
```

Or more simply with Framer Motion's `animate` on value change:

```tsx
<motion.p
  key={expectedWealth} // remount on value change triggers animation
  initial={{ y: -10, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  className="text-4xl font-serif italic text-primary"
>
  {formatCurrency(expectedWealth)}
</motion.p>
```

### 9.2 Circular Gauge for Returns

Replace or supplement the area chart with a dramatic circular gauge showing the gain ratio:

```tsx
// Gauge: arc from 0 to (gains / expectedWealth) percentage
const gainRatio = expectedWealth > 0 ? gains / expectedWealth : 0;
const circumference = 2 * Math.PI * 80; // radius 80
const strokeDash = gainRatio * circumference;

<svg viewBox="0 0 200 200" className="w-48 h-48">
  {/* Track */}
  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
  {/* Animated progress arc */}
  <motion.circle
    cx="100" cy="100" r="80"
    fill="none"
    stroke="#F27D26"
    strokeWidth="12"
    strokeLinecap="round"
    strokeDasharray={circumference}
    initial={{ strokeDashoffset: circumference }}
    animate={{ strokeDashoffset: circumference - strokeDash }}
    transition={{ duration: 1.2, ease: 'easeOut' }}
    transform="rotate(-90 100 100)"
  />
  {/* Centre text */}
  <text x="100" y="95" textAnchor="middle" className="font-serif" fill="#f2f2f2" fontSize="22" fontStyle="italic">
    {(gainRatio * 100).toFixed(0)}%
  </text>
  <text x="100" y="115" textAnchor="middle" fill="rgba(242,242,242,0.4)" fontSize="10">
    gains
  </text>
</svg>
```

Wrap this in a `FadeUp` so it reveals on scroll.

### 9.3 Slider — Custom Styled with Thumb Animation

The native range inputs are unstyled. Add CSS that matches the design system:

```css
/* globals.css */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 2px;
  background: rgba(255,255,255,0.1);
  border-radius: 0;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #F27D26;
  cursor: pointer;
  box-shadow: 0 0 0 3px rgba(242, 125, 38, 0.15);
  transition: box-shadow 0.2s, transform 0.15s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 6px rgba(242, 125, 38, 0.25);
  transform: scale(1.15);
}
```

---

## 10. Shared Components — Micro-interactions

### 10.1 CTA Buttons — Magnetic Effect

On desktop, primary CTA buttons should slightly attract to the cursor (magnetic button):

```tsx
// components/ui/MagneticButton.tsx
'use client';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useRef, MouseEvent } from 'react';

export function MagneticButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 25 });
  const springY = useSpring(y, { stiffness: 300, damping: 25 });

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.35);
    y.set((e.clientY - cy) * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.95 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}
```

Apply to the hero CTA buttons. Keep it subtle — `0.35` multiplier means only ~35% of cursor offset.

### 10.2 Link/Card Hover — Arrow Slide-in

The "View Fund →" links already have this partially. Formalise as a component:

```tsx
// components/ui/AnimatedArrowLink.tsx
import { motion } from 'motion/react';
import Link from 'next/link';

export function AnimatedArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-primary">
      <span>{children}</span>
      <motion.span
        className="inline-block"
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        →
      </motion.span>
    </Link>
  );
}
```

### 10.3 Grade Badge — Entry Pop

Any grade badge (`S`, `A`, `B`, etc.) should pop in when visible:

```tsx
// Use on any grade badge
<motion.span
  initial={{ scale: 0, rotate: -10 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.3 }}
  className={`inline-flex items-center px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase rounded-full border ${gradeStyles.text} ${gradeStyles.border} ${gradeStyles.bg}`}
>
  {fund.score_grade}
</motion.span>
```

### 10.4 Tooltip — Smooth Reveal

Replace any plain HTML `title` attributes with a custom animated tooltip:

```tsx
// components/ui/Tooltip.tsx
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface-container-high border border-white/10 px-4 py-3 text-[11px] text-on-surface-variant leading-relaxed z-50 pointer-events-none"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface-container-high" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
```

### 10.5 Page Transitions

Add a subtle page-level fade between routes. In `layout.tsx`:

```tsx
// components/ui/PageTransition.tsx
'use client';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

Wrap `{children}` in `layout.tsx` with `<PageTransition>`.

---

## 11. 3D Card Tilt Effect

The most tactile interaction in the UI. Applied to fund cards on `/explorer`, the shortlist cards, and anywhere else a card is the primary interactive element.

```tsx
// components/ui/TiltCard.tsx
'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { MouseEvent, useRef } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;     // degrees, default 10
  glareEnabled?: boolean;
}

export function TiltCard({ children, className, maxTilt = 10, glareEnabled = false }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 200, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 200, damping: 20, mass: 0.5 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Glare position
  const glareX = useTransform(springX, [-0.5, 0.5], ['-20%', '120%']);
  const glareY = useTransform(springY, [-0.5, 0.5], ['-20%', '120%']);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02, z: 20 }}
      transition={{ scale: { duration: 0.2 } }}
    >
      {children}

      {/* Glare overlay */}
      {glareEnabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-inherit overflow-hidden"
          style={{ opacity: 0.06 }}
        >
          <motion.div
            className="absolute w-40 h-40 rounded-full bg-white blur-2xl"
            style={{ left: glareX, top: glareY, translateX: '-50%', translateY: '-50%' }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
```

**Usage — fund card in explorer:**
```tsx
<TiltCard maxTilt={8} glareEnabled className="h-full">
  <Link href={`/fund/${fund.code}`} className="block h-full bg-surface-container border border-white/5 p-6 ...">
    {/* card content */}
  </Link>
</TiltCard>
```

---

## 12. WebGL Background (Optional Upgrade)

If you want to go further, the hero background can be upgraded from CSS gradients to a WebGL particle field using **three.js** (already a dependency via recharts' internal tree). This creates the most dramatic visual impression.

**Install:** `npm install three @types/three` (three.js is not currently in the project)

### Particle Field Component

```tsx
// components/ui/ParticleField.tsx
'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
  color?: string;
}

export function ParticleField({ count = 2000, color = '#F27D26' }: ParticleFieldProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
      sizes[i] = Math.random() * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 0.02,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    camera.position.z = 5;

    // Scroll-reactive rotation
    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll);

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      particles.rotation.y += 0.0003;
      particles.rotation.x = scrollY * 0.0001;
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, [count, color]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
```

**Use in `layout.tsx`** (so it persists across all pages):
```tsx
// Only render on client, since it uses WebGL
import dynamic from 'next/dynamic';
const ParticleField = dynamic(() => import('@/components/ui/ParticleField').then(m => m.ParticleField), { ssr: false });

// In layout body:
<ParticleField count={1500} color="#F27D26" />
```

> **Note:** If you do not want to add three.js, skip this section. The CSS gradient background in the existing hero is already good. Only add WebGL if the visual ambition justifies the bundle cost.

---

## 13. Performance & Accessibility Checklist

**Critical — must respect these in every animation:**

### Reduced Motion

Every animation must check `prefers-reduced-motion`. Framer Motion handles most of this automatically if you use `useReducedMotion()`:

```tsx
// In any component that has animations:
import { useReducedMotion } from 'motion/react';

export function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={{ opacity: 1, y: shouldReduceMotion ? 0 : 0 }}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 32 }}
      // reduced motion = just fade, no movement
    />
  );
}
```

Or add this to `globals.css` for a blanket fallback:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Performance Rules

| Rule | Reason |
|---|---|
| Only animate `transform` and `opacity` | These are GPU-composited — no layout reflow |
| Never animate `width`, `height`, `top`, `left` | Causes layout reflow on every frame |
| Use `will-change: transform` on parallax layers | Pre-promotes to GPU layer |
| Limit particles to ≤2000 if using WebGL | Mobile GPUs struggle beyond this |
| Use `useInView` with `once: true` | Re-triggering animations on every scroll is expensive |
| Remove heavy animations on mobile | `useMediaQuery('(max-width: 768px)')` to skip tilt/parallax |

```tsx
// Disable tilt on mobile
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
if (isMobile) return <div className={className}>{children}</div>;
```

### Bundle Size

| Addition | Bundle cost |
|---|---|
| Framer Motion primitives (already installed) | 0 extra |
| `useScroll`, `useTransform`, `useInView` | 0 extra (part of motion package) |
| three.js (WebGL) | +165KB gzipped — only add if truly needed |
| Custom CSS keyframes | 0 |

The entire animation upgrade (excluding three.js) adds **zero bytes** to the bundle since `motion` is already a dependency.

---

## 14. Complete File Diff Summary

| File | Changes |
|---|---|
| `app/globals.css` | Add grain overlay, shimmer, glow-pulse, orbit, scanline, text-gradient, custom range styles, `@property --angle`, perspective utilities |
| `app/layout.tsx` | Add `grain-overlay` class to body, wrap children with `<PageTransition>`, optionally add `<ParticleField>` |
| `app/page.tsx` | Phase-based load sequence, word-split H1 animation, parallax background layers, orbiting data points, scroll-down indicator, scanline on fund card, wire to real data |
| `components/ui/navbar.tsx` | `useScroll` reactive glass, hide-on-scroll-down, `layoutId` sliding underline, `usePathname` active state |
| `app/explorer/page.tsx` | `StaggerChildren` on card grid, `layoutId` filter pills, animated search focus, parallax section title, `TiltCard` on each fund card |
| `app/fund/[id]/FundDetailClient.tsx` | `CountUp` on score, animated SVG ring, `StaggerChildren` on metrics, `useInView`-triggered chart animation, radar rotate-in, sticky sidebar |
| `app/compare/page.tsx` | Split entry animation, VS divider animation, winner metric highlight, dual radar overlay |
| `app/sip/page.tsx` | Spring-animated wealth number, circular SVG gauge, styled range inputs |
| `components/ui/motion/FadeUp.tsx` | New file |
| `components/ui/motion/ParallaxLayer.tsx` | New file |
| `components/ui/motion/CountUp.tsx` | New file |
| `components/ui/motion/StaggerChildren.tsx` | New file |
| `components/ui/TiltCard.tsx` | New file |
| `components/ui/MagneticButton.tsx` | New file |
| `components/ui/AnimatedArrowLink.tsx` | New file |
| `components/ui/Tooltip.tsx` | New file |
| `components/ui/PageTransition.tsx` | New file |
| `components/ui/ParticleField.tsx` | New file (optional WebGL, needs three.js install) |

---

*All effects use only `motion/react` (already installed) and native CSS — zero new dependencies except the optional three.js WebGL upgrade.*
