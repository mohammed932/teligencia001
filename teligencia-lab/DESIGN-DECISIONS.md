# DESIGN-DECISIONS — Teligencia Lab Portal

This document is the rationale layer behind every visible choice in the UI. It exists so that any future contributor can answer two questions without guessing:

1. **Why does this look the way it does?**
2. **What may I not change without re-running the design system?**

The system was generated under the **UI/UX Pro Max** methodology, full-intensity, before any code was written.

---

## 1. Product context

| Field | Value |
|-------|-------|
| Product | Teligencia — Lab Portal dashboard |
| Industry | B2B SaaS · regulated cybersecurity testing (ISO/IEC 17025) |
| Primary users | Lab staff (6 roles): lab_admin, pm, test_engineer, reviewer, signatory, quality_manager |
| Primary device | Desktop, 1440 px |
| Tone | Lab-grade. Precise. Evidentiary. Never friendly. Never playful. |

Banking-grade authority. Audit-grade neutrality. The product signs legally binding test reports — the UI must look like it could.

---

## 2. Style selection

**Chosen style:** *Institutional Cybersecurity Console*.

| Keyword | Meaning |
|---------|---------|
| Navy | Trust, regulation, authority |
| Precise | Numeric, tabular, evidentiary |
| Lab-grade | Calm, not animated, not playful |
| Dense | High data-to-pixel ratio, no waste |
| Calm | Saturation reserved for status/severity tints only |
| Evidentiary | Activity log feels like a court record |

Rejected styles considered and why:

- *Bento dashboard* — too modern-startup, undermines authority.
- *Soft UI Evolution / glassmorphism / neumorphism* — banned by constitution and category anti-patterns.
- *Brutalist* — actively misreads "lab" as "experimental".
- *Cyber-neon / hacker dark mode* — visually exciting, but conveys offensive-security vibe, not defensive accreditation.

---

## 3. Color system — locked

```
--brand-navy   #0A2540   constitution-locked
--brand-cyan   #00D4FF   constitution-locked
```

Every other color descends from these or from the muted scale. Specifically:

- **Backgrounds** — `--bg-app` (`#F7F9FC` Lab Mist), `--bg-surface` (`#FFFFFF` Bench White), `--bg-sidebar` (`#0A2540`).
- **Text** — `--text` (`#1A1F2E` Ink), `--text-muted` (`#5B6573` Slate), `--text-faint` (`#8A93A2`).
- **Borders** — `--border` (`#E5EAF0` Frost), `--border-strong` (`#CDD5DF`), `--border-on-navy` (`#1F3A5E`).
- **Semantic** — Success `#16A34A`, Warning `#D97706`, Danger `#DC2626`, Critical `#B91C1C`, Info `#2563EB`, Indigo `#6B5BD2`. Each has a `*-bg` companion at low opacity.

### Status enum → color map

```
NEW                 → slate
QUOTE_SENT          → indigo
PO_RECEIVED         → indigo
INTAKE_IN_PROGRESS  → warning amber
CONTRACT_REVIEW     → warning amber
READY_FOR_TESTING   → brand cyan (highlight — the gate clears here)
IN_TESTING          → info blue
FINDINGS_REVIEW     → info blue
RETEST              → warning amber
REPORT_DRAFT        → indigo
UNDER_REVIEW        → indigo
AWAITING_SIGNATORY  → warning amber
ISSUED              → success green
CLOSED              → success green
ARCHIVED            → slate
```

Cyan is the **only** color used to point the eye at "this just changed / this needs you". Used sparingly on purpose.

### Severity enum → color map

```
CRITICAL       → critical red (#B91C1C)
HIGH           → danger red   (#DC2626)
MEDIUM         → warning amber
LOW            → info blue
INFORMATIONAL  → slate
```

---

## 4. Typography

- **Family** — Inter, single weight family across the product. Constitution-locked. Imported via Google Fonts in `index.html`.
- **Scale** — Display 32 (clamp 28–36) · H1 24 · H2 18 · Body 14 · Small 12 · Caption 11 · Number-XL 32.
- **Letter-spacing** — Display + headings use −0.02em / −0.01em (tightens the feel, adds authority). Captions use +0.05em uppercase (audit-trail flavor).
- **Tabular nums** — every numeric cell uses `font-variant-numeric: tabular-nums`. Required for the "lab-grade" feel — numbers must align like a balance sheet.
- **Selection** — `::selection` uses cyan-on-navy. Reinforces the brand on copy.

Why Inter and only Inter: a serif/display secondary font would soften the institutional tone. The product needs the visual equivalent of a calibrated instrument, not a magazine.

---

## 5. Spacing

A pure 4-pt scale: `--s-1` (4) → `--s-8` (64). Components compose from this ladder. No raw pixel values in component SCSS.

Rationale:
- A predictable rhythm lets the dashboard feel calm even at high information density.
- 4 px is dense enough for tabular layouts; 8 / 16 / 24 anchor card padding and section gutters.

---

## 6. Radius

- `--radius-sm` (4) — chips, pills inside chips, narrow controls.
- `--radius-md` (8) — buttons, inputs, dropdown menus.
- `--radius-lg` (12) — cards, modals.
- `--radius-pill` (999) — status badges, role-switcher trigger, SLA chip.

**No** higher-radius "bubbly" components. The dashboard should not look toy-like.

---

## 7. Shadows

Three steps only. Every shadow is navy-tinted (`rgba(10,37,64,…)`), not gray — that subtle hue keeps shadows feeling like part of the brand rather than a default Material shadow.

```
--shadow-sm  0 1px 2px  rgba(10,37,64,0.06)  default resting card
--shadow-md  0 4px 12px rgba(10,37,64,0.08)  hovered card / KPI tile
--shadow-lg  0 12px 32px rgba(10,37,64,0.12)  dropdown / modal
```

No "ambient + key" stack, no colored shadow tricks. Stay restrained.

---

## 8. Motion

- **Hover transitions** — 150 ms `cubic-bezier(0.4, 0, 0.2, 1)`. Snappy but not instant.
- **Route changes** — 240 ms.
- **Skeleton-to-content swap** — fixed 600 ms first paint on the dashboard. Long enough to feel like a real fetch, short enough to not annoy power users.
- `prefers-reduced-motion: reduce` zeroes all durations.

No parallax. No magnetic cursor. No tilt on hover. No spring animations.

---

## 9. Components

### Why custom KpiCard (not `nz-statistic`)

The default `nz-statistic` exposes too little control over number alignment, delta visuals, top-band accents, hover states, and accent border. Building a 50-line custom component is the right trade for the dashboard's hero numerals.

### Why custom badges (not `nz-tag`)

`nz-tag` ships Ant defaults that ignore both the status/severity semantics and the brand palette. Each badge here owns its color map and its layout (dot + label for status; bar + text for severity; pill for finding-status).

### Why custom timeline (not `nz-timeline`)

`nz-timeline` is vertically rigid and doesn't day-group. The Activity Feed needs Today/Yesterday/weekday grouping, role-aware icons, gate badges, and contextual tinting — easier built from scratch with a 90-line component.

### Why no `nz-table`

The recent-projects grid uses CSS Grid with `grid-template-columns`. Why: precise typographic control over the project code/title stack inside one column, plus easier responsive column-dropping (Type + Team disappear at 1279 px, the table becomes a card list at 767 px).

### Empty-state illustrations

Five custom inline SVGs:

| Illustration | Used by |
|--------------|---------|
| `scope`        | Coming-soon page (generic placeholder) |
| `shield-clear` | Activity feed when zero events |
| `inbox-quiet`  | Needs-your-attention when zero priorities |
| `spool`        | Recent projects when zero rows |
| `target` (🎯 emoji exception) | Critical findings — zero open |

Every illustration is built from token colors. None are downloaded.

---

## 10. Layout

- **Sidebar** — 240 px fixed. Navy. Three sections (brand · nav · foot). Active nav item gets a 3 px cyan accent on the inside-left edge.
- **Topbar** — 64 px white, 1 px bottom border. Search input (40 px tall, max 480 px), notification + help icon buttons, role-switcher.
- **Content** — Centered, max 1440 px, 32 px horizontal padding. 32 px vertical padding top, 64 px bottom.
- **Dashboard sections** — 24 px vertical rhythm between sections (`--s-5`).

---

## 11. Accessibility

- **Contrast** — Body text ≥ 4.5:1. Muted text ≥ 4.5:1 against `--bg-app`. Status badge text against badge background ≥ 4.5:1.
- **Focus** — Every interactive element shows a 2 px cyan outline (offset 2 px) on `:focus-visible`. Topbar icon buttons, role-switcher trigger, nav links, all CTA buttons.
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` clamps every animation/transition to 0.001 ms.
- **Keyboard nav** — Role-switcher menu items are reachable by Tab + Enter. Search input is reachable on first Tab.
- **Screen-reader hints** — Greeting strip uses `aria-labelledby`. SLA strip uses `role="list"`/`role="listitem"`. Badges use `role="status"` with `aria-label`.

---

## 12. Anti-patterns explicitly avoided

- AI-generated purple/pink gradient hero — banned.
- Glassmorphism / frosted blur / neumorphism — banned.
- Lottie animations / particle backgrounds / video heroes — banned.
- Stock illustrations or smiling vector people — banned. All empty states are inline SVG.
- Default Ant Design blue — overridden everywhere in `ng-zorro-theme.scss`.
- Emoji as functional icons — banned. Single intentional 🎯 in the no-findings empty state, as specified.
- Friendly fluff copy — replaced with lab-grade neutral statements.
- Lorem ipsum — replaced with realistic project codes, finding titles, manufacturer names from the spec.
- `*ngIf` / `*ngFor` / `NgModule` — replaced with `@if` / `@for` / standalone components.
- BehaviorSubjects for UI state — replaced with signals.
- Hardcoded hex outside `tokens.scss` — single source-of-truth invariant.

---

## 13. What is intentional, even if it looks light

- The dashboard has **no breadcrumbs**. The top-left "Teligencia dashboard" wordmark is the home affordance. Adding breadcrumbs would feel like a CMS and undermine the calm of the layout.
- The sidebar does **not** show counts next to nav links. Counts that change without warning train users to ignore them; the dashboard owns the priorities (see "Needs your attention").
- The "Needs your attention" card uses a **left** accent, not a top accent. Top accents read as section dividers and weaken the personal-priority feel.
- KPI cards show a delta line, but the delta is **never** colored alone — it always has an icon (rise / fall / minus). Color-only signals fail under colorblindness.

---

## 14. Definition of done

- `npm install && npm start` — clean, zero warnings beyond budget hint (within budget at production).
- `/lab/dashboard` renders all 6 sections with full mock data.
- Role switcher visibly changes "Needs your attention" and toggles the SLA strip.
- Every `ProjectStatus` value appears at least once across the mock projects.
- Every `Severity` value appears at least once across the mock findings.
- Zero `*ngIf`, `*ngFor`, `NgModule` in source.
- Zero raw hex outside `tokens.scss`.
- Zero Material / Heroicons / Lucide / Font Awesome imports.
- All empty states designed with custom inline SVG.
- `README.md` + `DESIGN-DECISIONS.md` (this file) present at root.

---

© 2026 Teligencia Labs · Teligencia UI · design system frozen at v1.0
