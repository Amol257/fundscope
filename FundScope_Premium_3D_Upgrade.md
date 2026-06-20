# FundScope Premium 3D Design Upgrade (Revised)

This replaces the first version of this document, which was written before the actual repository was reviewed and guessed at things that turned out to already exist or be different in practice. This version is checked directly against `github.com/Amol257/fundscope`, branch `main`, `UI/` folder. Everything below either references a real file and line, or is confirmed genuinely missing.

---

## What was wrong in the first draft, corrected here

| First draft claimed | What the source actually shows |
|---|---|
| Hero headline has no spaces ("Isyourfundactuallyworking?") | False alarm. `app/page.tsx` splits the headline into separate `motion.span` elements each with `mr-4 lg:mr-6` margin. It renders correctly; the bug was an artifact of how a webpage text-extraction tool stripped CSS spacing. |
| Brand color is green, needs a new palette | Wrong. `DESIGN.md` already defines a deliberate single-accent system: Solar Flame orange (`#F27D26`) on an obsidian base, with the accent capped under 10 percent of any viewport by an explicit project rule. This is already a refined system, not a slop pattern. |
| Site uses one font everywhere, needs a display/mono pairing | Already done. `app/layout.tsx` loads Playfair Display (serif display), Inter (body), and JetBrains Mono (data/numbers) via `next/font/google`. |
| Add tilt-responsive cards | Already exists: `components/ui/TiltCard.tsx`, spring-physics, optional glare, already used on the homepage, explorer, methodology, portfolio, and fund detail pages. |
| Add button press feedback | Already exists: `components/ui/MagneticButton.tsx` has `whileTap={{ scale: 0.95 }}` plus cursor-following magnetism, used on the homepage CTA and in the navbar. |
| Add origin-aware nav dropdowns | Already exists: `components/ui/navbar.tsx` dropdowns use `transformOrigin: 'top center'`, spring transition, rotating chevron, and a glass panel. |
| Add a particle depth field behind the hero | Already exists, and more advanced: `components/ui/HeroCanvas.tsx` runs a custom GLSL Perlin-noise fluid shader behind the hero. Adding a second background layer would visually compete with this, not improve it. |
| The "Observatory Core Intelligence" section is an identical four-card grid (slop pattern) | False. It is already an asymmetric bento grid (`grid-auto-flow-dense`, `md:col-span-2 md:row-span-2` for the globe panel, `md:col-span-3` for the density panel). Card sizes are intentionally varied. |
| Need new dependencies for 3D (Three.js, react-three-fiber) | None needed. `@react-three/fiber`, `@react-three/drei`, `three`, `motion` (the package import path is `motion/react`, not `framer-motion`), `gsap`, and `lenis` are all already in `package.json`. |

Everything in this corrected version below is either a genuinely confirmed gap or a real new addition, checked against the stack that is actually installed.

---

## 01. Confirmed Real Issues (cross-referenced with the main audit)

These were verified directly in source and are also listed in the main audit report. Fixing them is independent of any 3D work.

- `components/ui/footer.tsx` hardcodes New York coordinates and the "Live Interface Alpha" label.
- `components/GradeTag.tsx` uses em dashes in grade labels (`'S — Excellent'`).
- `components/ui/FundGlobe.tsx` uses `OrbitControls` without `enableDamping`, which is why dragging the globe stops dead instead of coasting.

```tsx
// components/ui/FundGlobe.tsx
// One-line fix: add damping so the drag interaction has real momentum
<OrbitControls
  makeDefault
  enableZoom={true}
  enablePan={false}
  autoRotate
  autoRotateSpeed={0.5}
  enableDamping={true}
  dampingFactor={0.08}
  minDistance={3}
  maxDistance={10}
/>
```

---

## 02. Screener Table: Missing Stagger and Prefetch

`app/screener/page.tsx` renders fund results as a plain HTML `<table>` with `<tr>` rows (confirmed, around line 320). Unlike the rest of the site, this view has no entrance animation and no hover prefetch. Given how much motion infrastructure already exists elsewhere (`GsapReveal`, `motion/react`, `ParallaxLayer`), the screener currently feels static by comparison. This is the single best remaining opportunity, not a 3D effect, but the highest-leverage motion gap left in the codebase.

```tsx
// app/screener/page.tsx
import { motion } from 'motion/react'

const tableContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.025 } },
}

const tableRow = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}

// Wrap the existing <tbody> content:
<motion.tbody
  variants={tableContainer}
  initial="hidden"
  animate="visible"
  className="divide-y divide-white/5"
>
  {paginatedFunds.map((fund, i) => (
    <motion.tr
      key={fund.code || i}
      variants={tableRow}
      className="hover:bg-white/5 transition-colors group"
      onMouseEnter={() => router.prefetch(`/fund/${fund.code}`)}
    >
      {/* existing cells unchanged */}
    </motion.tr>
  ))}
</motion.tbody>
```

Re-run `staggerChildren` only on the current page of results (`paginatedFunds`), not the full dataset, so pagination clicks re-trigger the stagger cleanly instead of animating all 5,800 rows at once.

---

## 03. The Grade Cube: A Genuinely New 3D Addition

`components/GradeTag.tsx` currently renders the S/A/B/C/D grade as a flat colored badge. There is no 3D grade visualization anywhere in the codebase yet, this is the one piece from the earlier draft that holds up as a real addition. Built using the exact stack already installed (`@react-three/fiber`, `@react-three/drei`), following the project's existing conventions: `'use client'`, the `motion/react` import path used elsewhere, and the same color tokens defined in `DESIGN.md` rather than new hardcoded hex values.

Place it only on `app/fund/[id]/FundDetailClient.tsx`, where `TiltCard` is already used for the surrounding layout, and lazy-load it so it never affects the rest of the site's bundle size.

```tsx
// components/ui/GradeCube.tsx
'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';

// Reuses the project's existing semantic colors from DESIGN.md
const GRADE_COLOR: Record<string, string> = {
  S: '#F27D26',       // primary / solar flame, reserved for the top grade
  A: '#1D9E75',        // success-teal
  B: '#378ADD',        // info-blue
  C: '#EF9F27',         // warning-amber
  D: '#E24B4A',          // danger-red
};

function Cube({ grade }: { grade: string }) {
  const mesh = useRef<any>(null);
  const color = GRADE_COLOR[grade] || '#6c757d';

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.25; // idle drift only
  });

  return (
    <RoundedBox ref={mesh} args={[1.1, 1.1, 1.1]} radius={0.08} smoothness={4}>
      <meshStandardMaterial color="#0c0c0c" attach="material-0" />
      <meshStandardMaterial color="#0c0c0c" attach="material-1" />
      <meshStandardMaterial color={color} attach="material-2" />
      <meshStandardMaterial color="#0c0c0c" attach="material-3" />
      <meshStandardMaterial color="#0c0c0c" attach="material-4" />
      <meshStandardMaterial color="#0c0c0c" attach="material-5" />
    </RoundedBox>
  );
}

export function GradeCube({ grade }: { grade: string }) {
  return (
    <Canvas camera={{ position: [2, 2, 2], fov: 35 }} style={{ width: 72, height: 72 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1.1} />
      <Cube grade={grade} />
    </Canvas>
  );
}
```

```tsx
// app/fund/[id]/FundDetailClient.tsx
import dynamic from 'next/dynamic'

const GradeCube = dynamic(
  () => import('@/components/ui/GradeCube').then(mod => mod.GradeCube),
  { ssr: false, loading: () => <div className="w-[72px] h-[72px]" /> }
)

// Use alongside the existing flat GradeTag, not instead of it,
// e.g. GradeCube as the visual anchor, GradeTag as the accessible text label beneath it
```

Keep the flat `GradeTag` badge everywhere else (screener rows, comparison tables). The cube is a single moment of delight on the fund detail page, not a replacement for the readable badge used at scale.

---

## 04. Motion Curves: Standardize What's Already Inconsistent

The codebase has no shared easing module. Easing is currently set per component, and the values do not agree with each other:

| File | Curve used | Type |
|---|---|---|
| `app/page.tsx` (hero word entrance) | `[0.21, 0.47, 0.32, 0.98]` | custom cubic-bezier, close to ease-out |
| `components/ui/motion/GsapReveal.tsx` | `'power3.out'` | GSAP named ease |
| `components/ui/motion/CountUp.tsx` | `'easeOut'` | Framer Motion named ease |
| `app/page.tsx` (ambient background loops) | `'easeInOut'` | Framer Motion named ease |
| `components/ui/TiltCard.tsx` | spring `{ stiffness: 200, damping: 20, mass: 0.5 }` | physics, not eased |
| `components/ui/MagneticButton.tsx` | spring `{ stiffness: 300, damping: 25 }` | physics, not eased |

None of these are wrong individually, GSAP's `power3.out` and the hero's custom bezier are both reasonable ease-out curves, but five different easing systems across one site means new components (the screener stagger, the grade cube) have nothing consistent to match. Centralizing this now, while adding the new 3D pieces, is the right moment to fix it.

### 4.1 A Single Motion Constants File

```ts
// lib/motion.ts
// Single source of truth for every easing curve and spring config in the project.
// Import this everywhere instead of inlining ease strings or bezier arrays.

// Entrances: content appearing on scroll or mount (cards, rows, sections)
export const EASE_ENTRANCE: [number, number, number, number] = [0.16, 1, 0.3, 1]; // ease-out-expo

// Exits: content leaving (dropdown close, modal dismiss, tooltip hide)
export const EASE_EXIT: [number, number, number, number] = [0.7, 0, 0.84, 0]; // ease-in-quart

// Ambient loops: background shapes, idle drift, anything with repeat: Infinity
export const EASE_AMBIENT = 'easeInOut' as const;

// Micro-interactions: button press, icon swap, anything under 200ms
export const EASE_MICRO: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Springs: anything that should feel physically dragged or magnetized (tilt, magnetic buttons, the globe)
export const SPRING_TACTILE = { stiffness: 220, damping: 22, mass: 0.5 };   // cards, buttons
export const SPRING_HEAVY   = { stiffness: 120, damping: 18, mass: 0.9 };   // larger elements, the grade cube idle settle
```

GSAP's `power3.out` in `GsapReveal.tsx` does not need to change, it is functionally close enough to `EASE_ENTRANCE` above that converting it would be cosmetic. The goal is to stop new code from introducing a sixth different curve, not to rewrite working GSAP calls.

### 4.2 Applying This to the New Additions

**Screener stagger** (from Section 02), updated to use the shared constant instead of an inline array:

```tsx
import { EASE_ENTRANCE } from '@/lib/motion'

const tableRow = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_ENTRANCE } },
}
```

**Grade cube** (from Section 03), idle rotation should ease into its drift rather than starting at a constant linear speed, and settle with the heavier spring when a grade prop changes:

```tsx
import { useSpring } from '@react-three/drei' // or animate rotation via useFrame with a lerp toward target
import { SPRING_HEAVY } from '@/lib/motion'

// On grade change, animate rotation.y toward a new resting angle using SPRING_HEAVY-equivalent
// damping rather than snapping instantly, so the cube settles rather than jumping
```

**Globe damping** (from Section 01), `dampingFactor: 0.08` on `OrbitControls` is already in the right range for `SPRING_HEAVY`-equivalent feel, no change needed there, it is listed here only so the globe's physical feel and the grade cube's physical feel read as the same hand having tuned both.

---

## 05. Implementation Order

**This week**
Fix `FundGlobe.tsx` damping (one line). Fix em dashes in `GradeTag.tsx`. Fix the footer coordinates and "Alpha" label. Create `lib/motion.ts` with the shared easing and spring constants. All five are confirmed, fast, independent of each other.

**Next sprint**
Add stagger and hover-prefetch to the screener table rows, using `EASE_ENTRANCE` from `lib/motion.ts`.

**Following sprint**
Build and lazy-load `GradeCube` on the fund detail page only, using `SPRING_HEAVY` for its settle animation.

No new npm packages are required for any of the above. Everything uses what is already installed in `UI/package.json`.

---

*This report was generated for Amol Singhal | FundScope | github.com/Amol257/fundscope*
*Verified directly against repository source on June 20, 2026. Frameworks referenced: tasteskill.dev (Leonxlnx), impeccable.style (pbakaus), emilkowal.ski/skill (Emil Kowalski).*
