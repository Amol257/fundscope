# FundScope Master UI Improvement Guide

A single reference that applies all three design skill frameworks, taste-skill, impeccable, and Emil Kowalski's design-eng skill, directly against the verified FundScope codebase (`github.com/Amol257/fundscope`, `UI/` folder). Where earlier reports already covered something correctly, it is cross-referenced rather than repeated. This document's new contribution is a full typography and font audit, since that was requested specifically and had not been checked against source until now.

---

## 01. Taste-Skill: Structural Rules

taste-skill defines three numeric dials for any interface: `DESIGN_VARIANCE` (1 = perfect symmetry, 10 = artsy chaos), `MOTION_INTENSITY` (1 = static, 10 = cinematic), and `VISUAL_DENSITY` (1 = airy gallery, 10 = packed cockpit). Its default baseline is 8, 6, 4, a fairly bold, motion-rich, moderately spacious interface. FundScope's existing Observatory bento grid, asymmetric panel sizes, and shader-driven hero already sit close to this baseline, no structural change needed there.

Two of taste-skill's hard rules, checked against source:

**Zero em dashes.** taste-skill calls this binary, not "use sparingly." Confirmed violation: `components/GradeTag.tsx` uses em dashes in grade labels (`'S — Excellent'`). Already documented with an exact fix in the main audit report, Section 3.5. No new finding, just confirming it against this specific rule's source.

**H1 line limit, 2 to 3 lines maximum, container must be wide enough to let words breathe.** Confirmed compliant: `app/page.tsx`'s hero, "Is your fund actually working?", renders across roughly 2 lines at the relevant breakpoints inside a wide flex container. No action needed.

---

## 02. Impeccable: Typography and Font System Audit

This is the section directly answering the font request. The good news first: **FundScope is not using any of impeccable's banned fonts.** The blocklist is Inter, Roboto, Arial, Open Sans, DM Sans, and system defaults, none of these appear anywhere in `app/layout.tsx`. The actual stack is more distinctive than that already:

| Variable | Font | Role |
|---|---|---|
| `--font-sans` | Outfit (Google) | body and UI text |
| `--font-mono-data` | JetBrains Mono (Google) | NAVs, percentages, tabular data |
| `--font-serif-google` | Playfair Display (Google) | one of three switchable display fonts |
| `--font-number-family` | Sora (Google) | numeric display, used at large sizes |
| `--font-medio-family` | Medio (local, custom) | default active display font |
| `--font-museum-family` | LT Museum (local, custom, 3 weights) | one of three switchable display fonts |

The site even ships a `FontSwitcher.tsx` component letting the visitor toggle the headline font between Playfair Display, Medio, and LT Museum, with the choice persisted in `localStorage`. Custom local display faces (Medio, LT Museum) are exactly the kind of distinctive, non-templated choice impeccable pushes toward, this is a genuine strength, not something to fix.

### What is actually wrong, found by checking the numbers impeccable specifies

**Hero heading exceeds the size ceiling.** Confirmed in `app/page.tsx` line 150:

```tsx
<h1 className="text-4xl sm:text-6xl lg:text-[100px] leading-[0.85] font-light tracking-tighter italic font-serif mb-8 text-on-surface">
```

`text-[100px]` is 100px, roughly 6.25rem. impeccable's display heading ceiling is `clamp()` max ≤ 6rem (96px). Above that, a headline reads as shouting rather than designed. This also is not currently a `clamp()` at all, it is a fixed `lg:` breakpoint value, so it cannot fluidly shrink between breakpoints.

**Tracking is at or past the cramped floor.** Tailwind's `tracking-tighter` utility is `-0.05em`. impeccable's floor is `-0.04em`, anything tighter and letters start touching at large sizes, which is more noticeable the bigger the type gets, and this heading is the single largest text on the entire site.

```tsx
// Before (app/page.tsx, confirmed)
<h1 className="text-4xl sm:text-6xl lg:text-[100px] leading-[0.85] font-light tracking-tighter italic font-serif mb-8 text-on-surface">

// After: fluid clamp ceiling at 6rem, tracking pulled back to the floor, text-balance added
<h1
  className="leading-[0.85] font-light italic font-serif mb-8 text-on-surface text-balance"
  style={{ fontSize: 'clamp(2.25rem, 6vw, 6rem)', letterSpacing: '-0.03em' }}
>
```

`-0.03em` is used rather than the exact `-0.04em` floor, since impeccable notes `-0.02` to `-0.03em` is "plenty for tight grotesque display," and Medio or LT Museum at full tightness may read differently than Playfair, worth a visual check after the change rather than trusting the number blind.

**No `text-balance` or `text-pretty` anywhere in the codebase.** Confirmed by search, neither utility appears in `app/` or `components/`. impeccable recommends `text-wrap: balance` on h1 through h3 so multi-line headlines break evenly rather than leaving a short orphan word on the last line, and `text-wrap: pretty` on longer prose blocks for the same reason. Apply `text-balance` to the hero h1 above, and to any other multi-line heading site-wide, this is a one-class addition with no layout risk.

```tsx
// Any other major heading, same pattern:
<h2 className="text-3xl md:text-5xl font-serif italic text-white mb-4 text-balance">
  Observatory Core Intelligence
</h2>
```

### Font pairing, checked against the contrast-axis rule

impeccable's pairing rule: don't pair two fonts that are similar but not identical, two geometric sans, two humanist sans. Pair on a contrast axis, serif against sans, or geometric against humanist, or use one family across weights. FundScope's actual pairing, Outfit (geometric sans, body) against Playfair Display or Medio (serif/display, headlines), with JetBrains Mono reserved purely for numeric data, already sits on a correct contrast axis. No change needed here, this is confirmation, not a fix.

One thing worth a second look: `Sora` is loaded as `--font-number-family` specifically for large numeric display, but JetBrains Mono already exists for data. If both are used for numbers in different places (e.g. Sora for the giant AUM hero stat, JetBrains Mono for the screener table), that is a deliberate scale distinction and fine. If they overlap on the same kind of element in different components, that is two similar-but-not-identical choices doing the same job, worth a quick grep to confirm which numbers use which family before adding anything new.

### If a genuinely new, modern font is still wanted

Given the current stack already avoids every banned font, this is optional rather than a fix. If a refresh is wanted for the body/sans role specifically (Outfit), impeccable's own recommended alternatives to overused fonts are Instrument Sans, Plus Jakarta Sans, Onest, and Figtree, all distinctive, modern, and not yet over-saturated the way Inter and DM Sans are. Outfit itself is already on this same tier, so this would be a lateral move for variety rather than a correction.

```tsx
// Optional: swap Outfit for Instrument Sans, same role, comparable geometric warmth
import { Instrument_Sans, JetBrains_Mono, Playfair_Display, Sora } from 'next/font/google'

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})
```

---

## 03. Impeccable: Color, Glass, and Motion (cross-referenced)

These were already corrected in the main audit report and the 3D upgrade document, restated briefly here so this document is a complete single reference:

- **Color:** brand accent is Solar Flame orange (`#F27D26`) on an obsidian base, capped under 10 percent of viewport per the project's own `DESIGN.md`. OKLCH-tinted neutral tokens are recommended over flat hex, see main audit Section 3.1.
- **Glass:** backdrop blur belongs only on genuinely floating layers, the nav dropdown is a correct use, a static feature card sitting on a flat background would not be, see 3D upgrade document Section 6 in the original draft (superseded, but the rule itself still applies).
- **Motion easing:** the codebase currently has five different easing systems with no shared source of truth, addressed with a proposed `lib/motion.ts` constants file in the 3D upgrade document, Section 04.

---

## 04. Emil Kowalski: Animation and Interaction Principles

Three principles from this framework, checked against what's confirmed to exist or be missing:

**Respect physical expectations.** Things that can be dragged should have momentum and friction, not stop dead. Confirmed gap: `FundGlobe.tsx`'s `OrbitControls` has no `enableDamping`, fixed with a one-line change, already documented in the 3D upgrade doc Section 01.

**Spring over duration for anything physically manipulated.** `TiltCard.tsx` and `MagneticButton.tsx` already use spring physics (`stiffness`/`damping`/`mass`) rather than fixed-duration easing, this is correct and matches the principle exactly, no change needed.

**Stagger reflects real hierarchy, not decoration.** The screener table currently has zero entrance animation on its rows, confirmed gap, fix proposed in the 3D upgrade doc Section 02, using `EASE_ENTRANCE` from the new shared motion constants once built.

---

## 05. Consolidated Action List

**Typography, this week**
Convert the hero `text-[100px]` to a `clamp()`-based fluid size with a 6rem ceiling. Loosen `tracking-tighter` to `-0.03em`. Add `text-balance` to the hero h1 and any other multi-line heading.

**Cross-referenced fixes, this week**
Em dashes in `GradeTag.tsx`. NYC coordinates and "Live Interface Alpha" label in `footer.tsx`. `enableDamping` on `FundGlobe.tsx`. Create `lib/motion.ts`.

**Next sprint**
Stagger and hover-prefetch on the screener table, using the new motion constants.

**Optional, not a fix**
Consider swapping `Outfit` for `Instrument Sans` or `Plus Jakarta Sans` purely for variety. The current font system already passes every impeccable rule it was checked against, this is a taste choice, not a correction.

---

*This report was generated for Amol Singhal | FundScope | github.com/Amol257/fundscope*
*Verified directly against repository source on June 20, 2026. Frameworks referenced: tasteskill.dev (Leonxlnx), impeccable.style (pbakaus), emilkowal.ski/skill (Emil Kowalski).*
