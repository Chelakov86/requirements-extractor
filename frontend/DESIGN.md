# Design System: ReqExtractor UI
**Project ID:** `11076043060961283687`
**Stitch Project:** ReqExtractor UI — Desktop, Light mode, Manrope font, ROUND_FOUR roundness

---

## 1. Visual Theme & Atmosphere

The interface strikes a tone of **editorial utility** — dense without being cluttered, authoritative without being corporate. It draws from the visual grammar of professional tools like Linear and GitHub Issues: strong horizontal navigation, left-anchored content hierarchy, and an information-first card grid.

The palette is built around a **deep forest teal** that reads as serious and confident rather than playful. The off-white canvas has a warm paper-like quality, softened further by a barely perceptible graph-paper grid texture that references technical documentation. Shadows are essentially absent — depth is communicated through color contrast, left-accent borders, and the weight of the navigation bar rather than elevation.

This is a tool for focus. Animations should be minimal, whitespace purposeful, and hierarchy enforced through typographic weight rather than decorative flourishes.

---

## 2. Color Palette & Roles

### Core Palette

| Name | Hex | Role |
|------|-----|------|
| **Primary Forest Teal** | `#0f756d` | Primary buttons, active tab underlines, focus rings, key accent elements |
| **Interactive Light Teal** | `#52b7ae` | Hover states, project card left-accent borders, drag-drop zone outlines — never for primary buttons |
| **Deep Slate Navy** | `#1a2332` | Top navigation bar background, login branding panel, primary text headings |
| **Forest Dark** | `#112120` | Dark background areas, overlays, login left panel grid texture base |
| **Warm Canvas** | `#f7f6f3` | Primary page background — warm off-white, never cold white |
| **Pure White** | `#ffffff` | Card surfaces, form containers, modal interiors |
| **Smoke Gray** | `#f9fafb` | Source snippet inset backgrounds, subtle recessed areas |

### Text Colors

| Name | Hex | Role |
|------|-----|------|
| **Ink Navy** | `#1a2332` | Primary headings, card titles (same as slate nav — dual purpose) |
| **Muted Slate** | `#5f6b7a` | Secondary text, metadata labels, inactive tab labels |
| **Stone Gray** | `#9ca3af` | Placeholder text, disabled states, captions, low-priority label |

### Semantic / Priority Colors

| Name | Hex | Role |
|------|-----|------|
| **Critical Red** | `#dc2626` | Critical priority — left border + badge fill |
| **High Orange** | `#ea580c` | High priority — left border + badge fill |
| **Medium Amber** | `#d97706` | Medium priority — left border + badge fill |
| **Low Gray** | `#9ca3af` | Low priority — left border + badge fill |

### Border Colors

| Name | Hex | Role |
|------|-----|------|
| **Default Border** | `#d1d5db` | Input borders, card borders, source snippet left-border |
| **Focus Border** | `#0f756d` | Active input/focus ring (same as Primary Forest Teal) |

---

## 3. Typography Rules

**Font Family:** Manrope (Google Fonts) — loaded exclusively. No fallback to system-ui, Inter, or Roboto.

```css
font-family: 'Manrope', sans-serif;
```

**Weight Usage:**
- `700` Bold — Page titles, navigation logo, session headings, login headline
- `600` SemiBold — Card titles, button labels, active navigation items, tab labels
- `400` Regular — Body text, form labels, metadata, structured content (Als/möchte ich/damit lines)

**Sizing Guidance:**
- Page title: 24–28px Bold
- Section heading: 18–20px SemiBold
- Card title: 15–16px SemiBold
- Body / structured content: 14–15px Regular
- Metadata / caption: 12–13px Regular, `#5f6b7a`
- Source snippet text: 12px italic, `#5f6b7a`

**Character:** Manrope has a slightly condensed, geometric feel that reinforces the technical-editorial aesthetic. Letter-spacing should remain at default or slightly tighter (`-0.01em`) for headings.

---

## 4. Component Stylings

### Buttons

- **Primary:** Solid `#0f756d` background, white `#ffffff` text, Manrope SemiBold, 4px radius. Full-width on forms, auto-width on action bars. Hover: darken slightly toward `#0d635c`.
- **Ghost / Outlined:** Transparent background, `#0f756d` 1px border, `#0f756d` text. Same radius and weight as primary. Used for secondary actions (e.g., "Exportieren").
- **Destructive:** Solid `#dc2626` background, white text — reserved for delete confirmations.
- **Text/Link:** No border or background, `#0f756d` text, underline on hover.

### Cards / Containers

**Item Cards (User Stories, NFRs, Open Questions):**
- White `#ffffff` background
- **4px left accent border** — color determined by priority (critical/high/medium/low)
- `4px` corner radius
- Whisper-soft shadow: `0 1px 2px rgba(0,0,0,0.05)` — nearly flat
- Structured 3-line body for User Stories: "Als [Role] / möchte ich [Goal] / damit [Benefit]"
- Label chips: pill-shaped `9999px`, 1px outlined border, 12px Manrope Regular
- Collapsible "Quellentext ▸" section reveals an inset block: `#f9fafb` background, `3px` solid `#d1d5db` left border, 12px italic `#5f6b7a` text

**Project Cards (Dashboard Grid):**
- White `#ffffff` background
- `4px` left accent border in **Interactive Light Teal `#52b7ae`** (not primary teal)
- `4px` corner radius
- Session count: pill badge, `#f7f6f3` background, `#0f756d` text
- Bottom row: muted date and session count in `#9ca3af`

**Page Containers / Form Cards:**
- Max-width centered card (e.g., New Analysis form: ~760px)
- `12px` corner radius (xl)
- White background, optional `1px` border in `#d1d5db`
- No heavy shadow — rely on canvas background contrast

### Inputs / Forms

- **Default state:** White background, `1px` solid `#d1d5db` border, `4px` radius
- **Focus state:** `2px` solid `#0f756d` border ring (no colored background)
- **Label:** 14px Manrope Regular, `#1a2332` or `#5f6b7a`
- **Placeholder:** `#9ca3af`
- **Textarea:** Same border treatment; min-height ~220px for main text input; character counter below right-aligned: `"1.247 / 500.000 Zeichen"` in `#9ca3af` 12px

### Tabs

- **Style:** Underline tabs — NOT pill/card tabs
- **Tab row height:** 44px
- **Active tab:** `#1a2332` text, `2px` solid border-bottom in `#0f756d`, Manrope SemiBold
- **Inactive tab:** `#5f6b7a` text, no border, Manrope Regular
- **Count suffix:** shown in parentheses — `"User Stories (12)"` — no separate badge
- **Separator:** single `1px` `#d1d5db` bottom border across the full tab row width

### Navigation Bar

- **Background:** Deep Slate Navy `#1a2332`
- **Logo / App name:** Manrope Bold, white `#ffffff`
- **Nav items:** Manrope SemiBold, `#9ca3af` default, `#ffffff` on hover/active
- **Active indicator:** subtle `#0f756d` underline or left-border depending on orientation
- **User menu:** right-aligned, avatar or initials circle

### Status Badges

Pill-shaped (`9999px` radius), small (6px vertical padding), Manrope SemiBold 12px:

| Status | Background | Text |
|--------|-----------|------|
| Abgeschlossen (Completed) | `rgba(15,117,109,0.12)` | `#0f756d` |
| Verarbeitung (Processing) | `rgba(217,119,6,0.12)` | `#d97706` |
| Ausstehend (Pending) | `rgba(156,163,175,0.2)` | `#5f6b7a` |
| Fehlgeschlagen (Failed) | `rgba(220,38,38,0.12)` | `#dc2626` |

### Drag-Drop Zone

- Dashed `2px` border in `#52b7ae` (Interactive Light Teal)
- `8px` corner radius
- Center-aligned upload icon + German instruction text in `#5f6b7a`
- File chips on drop: outlined, pill-shaped, file type icon + filename, 4px radius

---

## 5. Layout Principles

**Platform:** Desktop-first, 1280px canvas width (2560px at 2x for Stitch generation)

**Navigation:** Horizontal top bar (`#1a2332`), full-width, ~56–64px height. Content area below.

**Page width:** Content max-width ~1100–1200px, centered with symmetric horizontal padding.

**Content alignment:** Left-aligned. No centered hero layouts except the Login screen's form panel.

**Login exception:** Split-panel layout — 40% left `#1a2332` branding panel, 60% right `#f7f6f3` form panel.

**Dashboard grid:** 3-column card grid with consistent gutter. Cards left-aligned within their column.

**Form layout:** Single centered card (~760px wide), full-height whitespace around it on `#f7f6f3` canvas.

**Whitespace:** Generous between sections (32–48px), tighter within cards (16–20px internal padding). Information-dense at the card level, airy at the page level.

**Grid texture (background):** Subtle engineering-notebook graph paper on page background — two perpendicular 1px linear gradients in `rgba(15,117,109,0.05)` at `40px × 40px` intervals. Applied to `#f7f6f3` canvas only, not to cards or nav.

```css
background-image:
  linear-gradient(rgba(15,117,109,0.05) 1px, transparent 1px),
  linear-gradient(90deg, rgba(15,117,109,0.05) 1px, transparent 1px);
background-size: 40px 40px;
background-color: #f7f6f3;
```

**Shadows:** Nearly flat. Maximum elevation: `0 1px 2px rgba(0,0,0,0.05)`. No `shadow-md` or higher. Depth is communicated through color contrast and borders, not shadows.

**Border radius scale:**
- `4px` — Default (buttons, inputs, item cards, most UI elements)
- `8px` — Large (dropdown menus, modal dialogs)
- `12px` — XL (main page containers, centered form cards)
- `9999px` — Full/Pill (status badges, label chips, session count pills)

---

## 6. Screen Inventory

| Screen | Title | Stitch Screen ID |
|--------|-------|-----------------|
| Login | Requirements Extractor Editorial Login | `0f82682475604be1a51fac1ea0dcd90a` |
| Dashboard | Requirements Extractor Projects Dashboard | `39f7e5bb21c443478b9f09d4ae0bfcc7` |
| New Analysis | Standardized New Analysis Input Form | `0043f5778b294c28920d85d85d60a3bb` |
| Session Results | Standardized Session Results Workspace | `c32b2aaeaa2b46f499716764792db4b8` |

---

## 7. Known Token Deviations

These minor drifts exist in the generated HTML and should be corrected in future regenerations:

| Screen | Token | Actual Value | Canonical Value |
|--------|-------|-------------|----------------|
| Projects Dashboard | Dark background | `#151d1c` | `#112120` |
| Session Results | Primary config | `#0d776e` | `#0f756d` |
| Login | Page background | `#f6f8f8` | `#f7f6f3` |

When prompting Stitch for new screens, always specify canonical values explicitly and include the prohibition: *"DO NOT use `#52b7ae` as a primary button color — it is for hover and accent-border states only."*
