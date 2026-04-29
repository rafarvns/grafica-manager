# Arte Papel — Design System

**Arte Papel** é uma gráfica que oferece um sistema desktop completo para gerenciamento de operações de impressão, integração com e-commerces (Shopee, Mercado Livre) e automação de fluxos de produção.

---

## Sources

| Resource | Details |
|---|---|
| Logo (color) | `assets/logo-color.png` — uploaded by user |
| Logo (B&W) | `assets/logo-bw.png`, `assets/logo-bw.svg` |
| Codebase | `rafarvns/grafica-manager @ main` — `packages/frontend/` subtree |
| Design system tokens | `packages/frontend/src/index.css` |
| Pages | DashboardPage, OrdersPage, OrderDetailPage, CustomersPage, PrintHistoryPage, ReportsPage, SettingsPage, ShopeeIntegrationPage |
| UI Components | Button, Badge, Card, Input, Select, Textarea, Modal, Toast, Tabs, Table, Checkbox, Spinner, Tooltip, Breadcrumb, NotificationPanel |

---

## Products

### Gráfica Manager (Desktop Electron App)

A single-window Electron application that is the operational hub for print shop workflows:

- **Dashboard** — KPIs, charts (Chart.js), period selector, top customers table
- **Pedidos** — order list with filters, kanban view, order detail with tabs (details, files, print jobs)
- **Clientes** — customer profiles, history, revenue tracking
- **Impressões** — full print history log per printer, material, cost
- **Relatórios** — revenue, cost, margin analytics
- **Shopee/ML** — webhook-based automatic order intake
- **Configurações** — printers, color profiles, materials

**Stack:** React (no UI libs), CSS Modules, Electron, Context API, lazy-loaded pages, own list virtualization.

---

## Content Fundamentals

- **Language:** Portuguese (Brazilian) — `pt-BR` throughout
- **Tone:** Professional, concise, functional. Zero marketing fluff. Direct and operational — this is back-office software.
- **Casing:** Sentence case for UI labels; Title Case for page names; ALL CAPS for table headers (uppercase CSS transform)
- **Copy style:** Imperative verbs for CTAs (`Atualizar`, `Exportar PDF`, `Novo Pedido`, `Salvar`). State labels are nominal (`Em Produção`, `Aguardando`, `Concluído`)
- **Numbers:** Brazilian locale — `1.432` (dot thousands), `R$ 12.480,00` (comma decimal), `28/04/2026`
- **Emoji:** Not used in the UI. Zero emoji in application copy.
- **Error messages:** Direct, in Portuguese. Never use technical jargon exposed to user.
- **Placeholders:** Descriptive, lowercase (`Ex: Maria Souza`, `Notas internas...`)

---

## Visual Foundations

### Brand Colors (from logo)
The Arte Papel logo uses a warm, playful multi-color palette on a cream background. These are **brand** colors — not used directly in the app UI, but inform marketing assets and brand identity:

| Name | Hex | Usage |
|---|---|---|
| Rose | `#d97b8a` | Logo "papel" text; primary brand identity |
| Lavender | `#9b7ec8` | Logo "ar" |
| Amber | `#e8a84a` | Logo "t" |
| Sage | `#7ab5a0` | Logo "e" |
| Cream | `#faf3ec` | Logo badge background |

### App UI Colors
The application uses a **clean, functional blue-gray palette** — distinct from the playful logo. The app skews professional/SaaS over artisanal.

- **Primary:** `#1a56db` — used for CTAs, active nav, focus rings, data highlights
- **Sidebar:** Dark navy `#1e2433` — creates clear spatial hierarchy between nav and content
- **BG:** `#f3f4f6` (gray-100) — page canvas
- **Surface:** `#ffffff` — cards, inputs, header
- **Border:** `#e5e7eb` — subtle dividers, inputs, card outlines

### Typography
- **Font:** `system-ui` in codebase; **DM Sans** substituted here (warm geometric sans, excellent at small sizes)
- **Scale:** 12px (xs/table headers) → 14px (body/labels) → 16px (base) → 18px → 20px → 24px (2xl page titles) → 30px (3xl)
- **Weight:** 400 body, 500 medium/labels, 600 semibold headings, 700 bold titles and values
- **Table headers:** `font-size: 11px`, uppercase, `letter-spacing: 0.05em`, `color: muted`
- **Mono font:** Used for print job IDs, file sizes — `JetBrains Mono / Fira Code`

### Spacing
4px base unit. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px. Consistent with Tailwind-style 4px grid.

### Layout
- Fixed sidebar: `240px` wide
- Fixed header: `56px` tall
- Content scrolls independently within `<main>`
- Max-width `1400px` on dashboard content
- Responsive grid for KPI cards (`repeat(auto-fill, minmax(200px, 1fr))`)

### Cards
- `background: #fff`, `border: 1px solid #e5e7eb`, `border-radius: 12px`, `box-shadow: var(--shadow-sm)`
- Header inside card: `border-bottom: 1px solid #e5e7eb`, `padding: 14px 16px`
- Footer: `background: #f9fafb`, `border-top: 1px solid #e5e7eb`

### Borders & Radius
- Inputs, buttons: `8px` (`--radius-md`)
- Badges: `4px` (`--radius-sm`)
- Cards: `12px` (`--radius-lg`)
- Pills/full: `9999px`

### Shadows
Subtle, functional — `shadow-sm` on cards (1–3px blur), no heavy drop shadows. No colored shadows.

### Hover / Press States
- Rows: `background: #f9fafb` on hover
- Nav links: `background: var(--color-bg)` on hover, `color: text`
- Buttons: darken by ~5% on hover (`#1648c2` for primary)
- No scale/bounce animations on hover

### Active / Focus
- Nav active: `border-left: 3px solid primary`, `background: primary-light`, `color: primary`
- Input focus: `border-color: primary` + `box-shadow: 0 0 0 3px rgba(26,86,219,0.15)`

### Animations
- `--transition-fast: 150ms ease` — buttons, badges, nav hover
- `--transition-base: 250ms ease` — modals, drawers
- No bounces. No spring physics. Lightweight — targets 4GB RAM / dual-core PCs

### Backgrounds
- Flat solid colors only. No gradients in the app UI.
- No full-bleed images in app. No patterns or textures.

### Charts
Chart.js used. Colors: orange `#f97316`, blue `#3b82f6`, green `#22c55e`, purple `#a855f7`. Line charts with subtle fill gradient (opacity 0.1).

### Imagery
No photography in the desktop app. Icons are text-only in current codebase (no icon font, no SVG icons imported).

---

## Iconography

**Current state:** The codebase contains **no icon font, no SVG sprite, and no imported icon library**. Nav items are text-only. Buttons and badges are text-only. This is intentional — the app is optimized for low-resource PCs and avoids unnecessary asset loading.

**Recommendation:** If icons are needed, **Lucide React** (tree-shakeable, MIT, consistent 2px stroke) is the closest match to the app's aesthetic. Do not use emoji or unicode symbols as icons.

**Logo:** Sticker-style badge — round shape, peel-corner detail, scissors icon, multi-color wordmark. Warm and artisanal brand feel vs. the utilitarian app UI.

---

## File Index

```
README.md                        — This file
SKILL.md                         — Agent skill definition
colors_and_type.css              — All design tokens as CSS custom properties
assets/
  logo-color.png                 — Full color logo (transparent bg)
  logo-bw.png                    — Black & white logo
  logo-bw.svg                    — Black & white logo (vector)
preview/
  brand-logo.html                — Logo variants on different backgrounds
  colors-brand.html              — Brand palette (logo colors)
  colors-primary.html            — Primary blue scale
  colors-semantic.html           — Success / warning / danger
  colors-neutrals.html           — Neutrals, surface, bg, border
  colors-sidebar.html            — Sidebar dark palette
  type-scale.html                — Typography scale specimen
  spacing-tokens.html            — Spacing scale (4px base)
  spacing-radius-shadows.html    — Border radius + shadow system
  components-buttons.html        — Button variants
  components-badges.html         — Badge variants
  components-cards.html          — Card + KpiCard
  components-inputs.html         — Input, Select, Textarea
  components-table.html          — Table with badges
  components-tabs.html           — Tabs + period selector
ui_kits/
  grafica-manager/
    index.html                   — Interactive desktop app prototype
    Shared.jsx                   — All shared components (Button, Badge, Card, Input, Sidebar, Header, Modal, Toast)
    Dashboard.jsx                — Dashboard page with KPIs, charts, top customers
    Orders.jsx                   — Orders list, filters, new order modal
    PrintHistory.jsx             — Print job history with KPIs
    App.jsx                      — App shell + routing + order detail view
```
