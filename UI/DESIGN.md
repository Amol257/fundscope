---
name: FundScope
description: Precision Mutual Fund Analytics
colors:
  primary: "#F27D26"
  primary-container: "#d96d1f"
  inverse-primary: "#f2a672"
  background: "#0c0c0c"
  surface: "#0c0c0c"
  surface-dim: "#080808"
  surface-bright: "#1a1a1a"
  surface-container-low: "#111111"
  surface-container: "#151515"
  surface-container-high: "#1a1a1a"
  surface-container-highest: "#222222"
  text-on-background: "#f2f2f2"
  success-teal: "#1D9E75"
  info-blue: "#378ADD"
  warning-amber: "#EF9F27"
  danger-red: "#E24B4A"
  accent-purple: "#7F77DD"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.15em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  xl: "24px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-container}"
  card-glass:
    backgroundColor: "rgba(26, 26, 26, 0.6)"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Design System: FundScope

## 1. Overview

**Creative North Star: "The Financial Observatory"**

FundScope is a premium, data-driven analytics platform built for investors seeking pure mutual fund performance intelligence. Its interface is designed to evoke a scientific and modern astronomical control deck: a deep obsidian core canvas, high-contrast solar accents, and layout micro-animations that feel physical and organic.

The design is engineered to disappear into the data task. It rejects the generic SaaS style guide containing rounded white panels, colored card side-borders, and gradient accents. Every line, spacer, and panel carries purpose. Visual hierarchy is established through clean boundaries, variable spacing, and precise high-contrast typography.

**Key Characteristics:**
- Deep obsidian and charcoal dark modes avoiding pure black colors.
- Precise, tactile layout borders representing glass pane refractions.
- Heavy use of fluid spring physics for all hover and click states.
- High-contrast, desaturated accents to ensure optimal readability.
- Strict avoidance of emojis in all text copy and codebase comments.

## 2. Colors

The color palette is strictly restrained to obsidian backgrounds, stardust gray typography, and a single solar flame orange accent.

### Primary
- **Solar Flame** (#F27D26): Used strictly for primary calls-to-action, current active navigation elements, selection states, and core interactive indicators.

### Neutral
- **Obsidian Core** (#0c0c0c): The foundational background tone. Tinted with radial gradients of `#F27D26` and `#378ADD` at minimal opacities (3%) to represent cosmic depth.
- **Stardust Gray** (#f2f2f2): Main typography color providing a crisp contrast against the background.
- **Muted Dust** (rgba(242, 242, 242, 0.6)): Standard body and description text color.
- **Ethereal Divider** (rgba(255, 255, 255, 0.1)): Subtle 1px boundaries separating UI sections.

### Named Rules
**The Solar Flame Focus Rule.** The primary orange accent color must cover less than 10% of any viewport's total area. Its impact comes from its rarity.

**The Semantic State Consistency Rule.** Green (#1D9E75), blue (#378ADD), amber (#EF9F27), and red (#E24B4A) are reserved exclusively for quantitative data direction (returns, risk levels, alerts). They are never used decoratively.

## 3. Typography

**Display Font:** Playfair Display (Serif)
**Body Font:** Inter (Sans-Serif)
**Label Font:** Inter (Sans-Serif)
**Number Font:** Sora (Sans-Serif Display)
**Data Font:** JetBrains Mono (Monospace)

### Hierarchy
- **Display** (Bold, clamp(2.5rem, 5vw, 4.5rem), 1.1): Used for main marketing headings and splash screens.
- **Headline** (Semi-Bold, 2rem, 1.25): Used for page section titles.
- **Title** (Medium, 1.25rem, 1.3): Used for card titles and category headers.
- **Body** (Regular, 1rem, 1.6): Main text copy. Line lengths capped at 75ch.
- **Label** (Semi-Bold, 0.75rem, tracking-widest, uppercase): Used for navigation items, tags, and small descriptors.

### Named Rules
**The Sora Metrics Rule.** All numeric data, including returns percentages, CAGR figures, asset volumes, NAV values, and ratios, must use the `font-number` (Sora) typeface to ensure numbers look distinct and premium.

**The JetBrains Mono Data Rule.** Tabular historical rows, sync logs, and JSON code blocks must use JetBrains Mono for exact vertical alignment.

## 4. Elevation

FundScope rejects decorative box shadows. The visual layers are represented through a hybrid of glass panels and structural 1px borders.

### Shadow Vocabulary
- **Interactive Ambient Glow** (0 8px 32px 0 rgba(0, 0, 0, 0.37)): Applied to active glass panels to separate them from the foundational background canvas.

### Named Rules
**The Refraction Edge Rule.** Elevated panels do not float with dark shadows. Instead, they use a `1px` translucent white border (`rgba(255, 255, 255, 0.08)`) and a background blur (`12px`) to simulate a frosted glass refraction.

## 5. Components

### Buttons
- **Shape:** Softly curved corners (8px radius).
- **Primary:** Solar Flame background, black text, and uppercase text styling.
- **Hover / Focus:** Scale up slightly on hover and scale down to `0.95` on tap using spring physics.

### Cards / Containers
- **Corner Style:** Medium radius (8px).
- **Background:** Glass panel gradients (135deg gradient from `rgba(26, 26, 26, 0.6)` to `rgba(8, 8, 8, 0.8)`).
- **Border:** Subtle white outline (`rgba(255, 255, 255, 0.08)`).
- **Padding:** Desktop: `24px` (p-6), Mobile: `16px` (p-4).

### Inputs / Fields
- **Style:** Obsidian container, 1px subtle white border, 8px border-radius.
- **Focus:** 1px Solar Flame border with a slight orange glow animation.

### Navigation
- **Style:** Glassmorphic top bar (`h-20`, backdrop-blur). Hover dropdowns animate down using spring physics. Mobile menus expand vertically using accordions.

## 6. Do's and Don'ts

### Do:
- **Do** wrap all interactive transitions in spring physics (`stiffness: 300, damping: 25` for buttons).
- **Do** display dynamic skeleton load states matching the components' dimensions.
- **Do** align columns cleanly, wrapping tables in horizontal scroll containers on small viewports.
- **Do** restrict line lengths of prose to a maximum of 75 characters.

### Don't:
- **Don't** use emojis anywhere in the user interface or code comments.
- **Don't** use side-stripe borders greater than 1px as a card accent or alert badge.
- **Don't** use gradient text decorations on standard headings or labels.
- **Don't** use generic SaaS names like "AcmeVenture" or "Jane Doe" for mock accounts.
- **Don't** use fluid typography clamp values on sidebar headers or inner dashboard tables.
