---
name: slopFinance
description: A personal-finance console that reads like a station departure board, not a SaaS dashboard.
colors:
  signal-blue: "#3D7DFA"
  due-amber: "#FFB400"
  paid-green: "#3DBF80"
  overdue-red: "#D93A3A"
  neutral-lamp: "#6E727A"
  flap-black: "#0D0D0F"
  flap-shadow: "#1B1B1E"
  flap-white: "#F2F2F2"
  steel-muted: "#94989E"
  hairline-dark: "#2D2D32"
  aluminum-ground: "#E7E8EA"
  aluminum-face: "#F7F7F8"
  ink-primary: "#17181A"
  steel-muted-light: "#5B5F66"
  hairline-light: "#C7C9CD"
typography:
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    letterSpacing: "0.05em"
  data:
    fontFamily: "Manrope, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    fontFeature: "tabular-nums"
rounded:
  sm: "9999px"
  md: "12px"
spacing:
  tight: "1rem"
  normal: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.flap-black}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "#FFC433"
  button-danger:
    backgroundColor: "{colors.overdue-red}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.steel-muted}"
    rounded: "{rounded.md}"
---

# Design System: slopFinance

## Overview

**Creative North Star: "The Departure Board"**

slopFinance is built for one person closing out a credit-card invoice and asking, in one glance: what's due, what's overdue, what's already paid. The system borrows its grammar from a station split-flap board — the mechanical departure display where every row is a live entity ranked by time, and color is reserved entirely for state (delayed, cancelled, on time), never decoration. It explicitly refuses the category default this product could have shipped: warm gradient cards, glassmorphic stat tiles, a soft rounded consumer-fintech look. Nothing here is glassy, gradient, or softly shadowed.

The system was fused, at the user's request, with a second, more familiar world: the ordinary SaaS dashboard (card grid, bar/pie charts, sidebar nav). The board supplies the palette, the material, the typography, and — most importantly — the state-color vocabulary. The dashboard supplies the composition: cards, charts, and a grouped sidebar rather than a literal airport-board staging. Every screen still reads as a precise, mechanical instrument, not a decorated one.

**Key Characteristics:**
- Flat, matte, hairline-bordered panels — never a floating card with a soft shadow.
- One warm rounded sans (Manrope) throughout; money and dates keep tabular-figure alignment without switching typeface.
- Amber, red, and green are reserved for meaning (due / overdue / paid) and are never used decoratively.
- Two committed themes, not a palette-picker: Noite (night board, dark, the anchor) and Dia (daylight concourse, light).
- Generously rounded corners and pill controls — revised after the first pass read as "too square" and mechanical; the board's palette and state vocabulary carry the identity now, not sharp edges.

## Colors

Restrained by default: neutrals carry every surface, and the amber/red/green trio appears only to report a state or mark the one primary action on a screen.

### Primary
- **Amber Signal** (`#FFB400` dark theme / `#C48200` light theme): the board's one accent. Used for the primary button, the active nav item, "vencendo" (due soon) state, and chart's first data series. Never used as background decoration.

### Secondary (state colors — as load-bearing as Primary, not decorative)
- **Paid Green** (`#3DBF80` dark / `#158049` light): a settled lançamento, positive balance, "receita" figures.
- **Overdue Red** (`#D93A3A` dark / `#B91C1C` light): an overdue or cancelled item, negative balance, destructive actions.
- **Neutral Lamp** (`#6E727A` dark / `#82868C` light): an unlit/pending state — the "not yet due, not yet acted on" row.

### Neutral
- **Flap Black** (`#0D0D0F`): body background, dark theme. The matte board face at night.
- **Flap Shadow** (`#1B1B1E`): card/panel background, dark theme.
- **Flap White** (`#F2F2F2`): primary text, dark theme.
- **Steel Muted** (`#94989E`): secondary text, dark theme.
- **Hairline Dark** (`#2D2D32`): borders and dividers, dark theme.
- **Aluminum Ground** (`#E7E8EA`): body background, light theme — brushed aluminum under daylight, never pure white.
- **Aluminum Face** (`#F7F7F8`): card/panel background, light theme.
- **Ink Primary** (`#17181A`): primary text, light theme.

### Named Rules
**The Meaning-Only Rule.** Amber, red, and green never appear as decoration — a color on screen always reports a state (due / overdue / paid) or marks the single primary action. A screen with no state to report is neutral gray, full stop.

**The Two-Theme Rule.** There are exactly two themes — Noite and Dia — not a palette picker. Adding a third "just for variety" breaks the state-color vocabulary, since amber/red/green must mean the same thing on every install.

## Typography

**Body Font:** Manrope (with system sans-serif fallback)

**Character:** One rounded, warm geometric sans carries everything — headings, labels, body copy, and data. There is no separate monospace face; numeric alignment comes from the `tabular-nums` CSS feature on the same typeface, not from switching to a different font family. This replaced an earlier IBM Plex Sans/Mono pairing that read as too cold and technical.

### Hierarchy
- **Title** (600 weight, 21px, uppercase, 0.05em tracking): page titles (`PageHeader`), sidebar section labels.
- **Body** (400 weight, 17px, 1.6 line-height): paragraph copy, descriptions.
- **Label** (600 weight, 13px, uppercase, 0.05em tracking): field labels, stat-tile captions, nav group headers.
- **Data** (700 weight, 17–25px, `tabular-nums`): every money value, date, and percentage — same Manrope face as everything else, right-reading and column-aligned via the numeric feature, not a monospace font swap.

### Named Rules
**The Tabular-Nums Rule.** Any element rendering a currency value, a date, or a count sets `tabular-nums`. This is non-negotiable — it is the one typographic signature that makes the board metaphor legible instead of decorative, but it no longer requires a monospace typeface to work.

## Layout

Sidebar-left, content-right shell (`AppShell`): a 256px fixed sidebar (`w-64`) on desktop, collapsing to an off-canvas drawer under `md`. Main content is a single scrolling column capped at `max-w-7xl`, `p-6` padding. Page-level grids favor 2–4 column stat rows (`grid-cols-2 sm:grid-cols-4`) that collapse gracefully — stat values switch to a smaller responsive size (`text-lg sm:text-2xl`) with `truncate` so a wide currency figure never breaks a narrow mobile card.

Sidebar navigation is grouped, not flat: routes are clustered under uppercase section labels (Painel / Fatura / Planejamento), mirroring how a real departure board clusters rows under a platform or gate heading rather than listing every destination in one undifferentiated list.

## Elevation & Depth

Flat by design — no box-shadow anywhere in the system. Depth is conveyed entirely through a second, slightly lighter neutral layer (`bg-elevated`) and 1px hairline borders (`border-c-border`), the way a physical instrument panel separates surfaces with material and seams, not by lifting elements toward the viewer.

### Named Rules
**The No-Shadow Rule.** Every panel sits flush with its background; separation comes from a hairline border and a tonal step, never a drop shadow. A shadow appearing anywhere in this system is a regression to the SaaS-glass default the system exists to refuse.

## Shapes

Corners are generous and soft: `rounded-xl` (12px) on cards, buttons, inputs, and icon tiles; `rounded-full` on badges, progress bars, avatars, color dots, and the sidebar's brand mark — anything small enough to read as a pill or a circle becomes one. This replaced an earlier sharp/mechanical corner language (`rounded-md`/`rounded-sm`, 6px/2px) that read as cold and "too square." The sidebar's active-route indicator stays a 2px solid left border in amber — a line, not a shape, so it doesn't compete with the rounding elsewhere.

## Components

### Buttons
- **Shape:** `rounded-xl` (12px), `px-4 py-2`.
- **Primary:** amber fill (`bg-accent-500`), dark text, uppercase 12px label with `tracking-wider` — the one filled, attention-grabbing control per screen.
- **Danger:** overdue-red fill, white text — destructive actions only (delete, limpar dados).
- **Ghost:** transparent, hairline border, muted text that promotes to primary-text + amber border on hover.
- All three variants share the same uppercase-label treatment; a button that isn't uppercase/tracked is off-system.

### Cards / Panels
- **Corner Style:** `rounded-xl` (12px).
- **Background:** `bg-bg-card` (Flap Shadow / Aluminum Face).
- **Shadow Strategy:** none — see Elevation & Depth.
- **Border:** 1px hairline, `border-c-border`.
- **Internal Padding:** `p-6` normal, `p-4` tight (stat tiles, compact rows), via the `Card` component's `padding` prop.

### Badges (`Badge`)
- **Style:** 10%-opacity state-color background, full-opacity state-color text and border, `rounded-full` pill, uppercase 11px label.
- **State:** four colors — accent (paid/green), rose (overdue/red), amber (due), slate (neutral) — mapped onto the same paid/overdue/due/neutral vocabulary as everywhere else in the system.

### Inputs / Fields (`Input`)
- **Style:** `bg-bg-elevated`, hairline border, `rounded-xl`.
- **Focus:** 1px amber ring + amber border, no glow/blur effect.
- **Error:** border and helper text switch to overdue-red.
- Number and date inputs automatically render with `tabular-nums` for column alignment; every input uses the same Manrope face.

### Navigation (`Sidebar`)
- Grouped list under uppercase section labels; each item is icon + label + optional right-aligned pill count badge.
- **Default:** muted text, transparent left border.
- **Active:** amber text, amber 2px left border, elevated background tint.
- **Mobile:** off-canvas drawer sliding from the left, same visual treatment as desktop, closes on route change.
- Icon tiles, the avatar, and the brand mark are all circular (`rounded-full`).

### Signature component: `Lamp`
A small state-indicator icon (`CheckCircle2` / `AlertCircle` / `Circle`) that stands in for a physical board lamp: green and lit for paid, amber or red and lit for due/overdue, dim steel-gray for neutral/pending. Used anywhere a row needs a state read before its label — recorrentes checklist, fatura line items, parcela lists.

### Signature component: `StatTile` / `MonthNav` / `ProgressBar`
- `StatTile`: uppercase label + large tabular-nums value, optionally state-toned. The system's stand-in for a flap-counter readout.
- `MonthNav`: `‹ AGOSTO DE 2026 ›` — centered uppercase month label between two chevron buttons; the one recurring month-switcher used across Fatura, Orçamentos, Recorrentes, and the consolidated view.
- `ProgressBar`: 1.5px flat bar, `rounded-full`, fill color drawn from the same paid/due/overdue vocabulary — never a generic brand-color gradient.

## Do's and Don'ts

### Do:
- **Do** render every money value, date, and percentage with `tabular-nums`.
- **Do** reserve amber/red/green exclusively for due/overdue/paid state and the single primary action per screen.
- **Do** use a hairline border + tonal layer for separation; never a box-shadow.
- **Do** round generously — `rounded-xl` on panels/controls, `rounded-full` on anything small enough to read as a pill, dot, or circle.
- **Do** keep the sidebar grouped under uppercase section labels rather than one flat list.

### Don't:
- **Don't** introduce a third theme or a decorative color picker — the system commits to exactly two (Noite/Dia).
- **Don't** use amber/red/green decoratively (e.g., a random accent chip) outside the due/overdue/paid vocabulary.
- **Don't** add drop shadows, glassmorphism, or gradient card fills — that is the category default this system was built to refuse.
- **Don't** introduce a second (monospace) font family for data — tabular alignment comes from `tabular-nums` on Manrope, not a typeface switch.
- **Don't** reintroduce sharp/mechanical corners (`rounded-md`/`rounded-sm` or smaller) — the system committed to generous rounding after user feedback.
