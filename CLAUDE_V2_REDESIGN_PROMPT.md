# Nature Explorers v2 — Claude Code Redesign Prompt

You are redesigning the **Nature Explorers** app (a Greek hiking & nature events marketplace) from its generic v1 shadcn/Tailwind scaffold into a premium **"National Geographic meets Modern Tech"** product.

Work through each phase below in order. Do not skip steps. Commit after each phase with a descriptive message.

---

## Codebase Context

- **Stack:** React 18 + Vite + Tailwind CSS v3 + shadcn/ui (Radix UI) + React Router v7 + Supabase
- **Entry point:** `src/App.jsx`
- **Layout system:** `src/components/layout/Layout.jsx` — two layouts:
  - `PublicLayout` → wraps `Home` and `RoleSelection` pages, uses `PublicHeader` + `PublicFooter`
  - `AppLayout` → wraps all authenticated pages, uses a left `Sidebar` (desktop) + top mobile header + `BottomNav`
- **Tailwind config:** `tailwind.config.js` — all colors are CSS variable references (`hsl(var(--*))`)
- **CSS variables:** defined in `src/index.css` (or equivalent global CSS file — locate it first with `find src -name "*.css"`)
- **Current active color:** `emerald-600` / `emerald-50` — Tailwind built-in, used throughout. In v2, all emerald references must be replaced with brand tokens.
- **Typography:** No custom font currently loaded. Century Gothic must be added.
- **Pages:** `src/pages/` — 28 pages total. Key ones: `Home.jsx`, `Calendar.jsx`, `TripDetails.jsx`, `OrganizersList.jsx`, `Guides.jsx`, `GreekRefuges.jsx`
- **Components:** `src/components/layout/`, `src/components/calendar/`, `src/components/trips/`, `src/components/bookings/`

---

## Brand Specification (Do Not Deviate)

```
Primary:     #0c281c   (Deep Forest Green)
Background:  #f0e3c7   (Parchment / Sand)
Accent:      #8B6914   (Pine Gold)
Text/Dark:   #0c281c   (same as primary, full opacity on parchment)
Muted text:  rgba(12, 40, 28, 0.60)  (60% opacity forest green)

Font:        "Century Gothic", "Century Gothic Pro", Futura, "Trebuchet MS", sans-serif
             — for: all headings (h1–h3), nav labels, badge text, CTA buttons
Body font:   system-ui, -apple-system, Inter, sans-serif
             — for: paragraphs, form labels, small print
```

**Contrast targets:**
- Parchment bg + Forest text: ~9:1 ✅ (WCAG AAA)
- Forest bg + Parchment text: ~9:1 ✅ (WCAG AAA)
- Gold accent on Forest bg: ensure minimum 4.5:1 for interactive elements

---

## Phase 1 — Design Token Layer (CSS Variables)

**Goal:** Replace all generic shadcn color tokens with brand values. Every component inherits the new palette automatically.

### Step 1.1 — Load Century Gothic

In `index.html`, add to `<head>`:

```html
<!-- Century Gothic via Google Fonts approximation (Nunito is fallback; we self-host or use system) -->
<style>
  @font-face {
    font-family: 'Century Gothic';
    src: local('Century Gothic'), local('CenturyGothic');
    font-weight: 400 700;
    font-style: normal;
  }
</style>
```

Then in the global CSS file, set:

```css
:root {
  --font-heading: "Century Gothic", "Century Gothic Pro", Futura, "Trebuchet MS", sans-serif;
  --font-body: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
}

h1, h2, h3, h4 {
  font-family: var(--font-heading);
  letter-spacing: -0.01em;
}
```

### Step 1.2 — Override CSS Variables (Light Mode)

Locate the `:root` block in the global CSS. Replace the entire color token set with:

```css
:root {
  /* ── Brand Tokens ── */
  --brand-forest:     12 40 28;      /* #0c281c in RGB */
  --brand-parchment:  240 227 199;   /* #f0e3c7 in RGB */
  --brand-gold:       139 105 20;    /* #8B6914 in RGB */

  /* ── shadcn/Radix token mappings ── */
  --background:        240 227 199;  /* Parchment */
  --foreground:        12 40 28;     /* Forest */

  --card:              240 227 199;
  --card-foreground:   12 40 28;

  --popover:           240 227 199;
  --popover-foreground: 12 40 28;

  --primary:           12 40 28;     /* Forest — main CTAs */
  --primary-foreground: 240 227 199; /* Parchment text on Forest */

  --secondary:         222 209 183;  /* Slightly darker parchment */
  --secondary-foreground: 12 40 28;

  --muted:             228 217 194;
  --muted-foreground:  12 40 28 / 0.55;

  --accent:            139 105 20;   /* Pine Gold */
  --accent-foreground: 240 227 199;

  --destructive:       153 27 27;
  --destructive-foreground: 240 227 199;

  --border:            12 40 28 / 0.15;
  --input:             12 40 28 / 0.12;
  --ring:              139 105 20;

  /* Sidebar — Deep Forest surface */
  --sidebar-background:         12 40 28;
  --sidebar-foreground:         240 227 199;
  --sidebar-primary:            139 105 20;
  --sidebar-primary-foreground: 12 40 28;
  --sidebar-accent:             240 227 199 / 0.10;
  --sidebar-accent-foreground:  240 227 199;
  --sidebar-border:             240 227 199 / 0.12;
  --sidebar-ring:               139 105 20;

  --radius: 0.625rem;
}
```

> **Note:** shadcn uses `hsl(var(--token))` syntax. If the existing CSS uses raw `hsl()` wrappers, keep that pattern — just replace the channel values. If it uses the newer slash syntax, adjust accordingly.

### Step 1.3 — Remove Dark Mode Overrides (Optional in Phase 1)

Comment out or delete the `.dark` block for now. Nature Explorers v2 Phase 1 ships light-mode only. A "Field View" high-contrast mode will be added in Phase 3.

### Step 1.4 — Replace All `emerald-*` Tailwind Classes

Run a project-wide search-and-replace for these patterns. Apply them across all files in `src/`:

| Find | Replace with |
|---|---|
| `text-emerald-600` | `text-[#0c281c]` |
| `text-emerald-700` | `text-[#0c281c]` |
| `text-emerald-400` | `text-[#f0e3c7]` |
| `bg-emerald-600` | `bg-[#0c281c]` |
| `bg-emerald-700` | `bg-[#0c281c]` |
| `bg-emerald-50` | `bg-[#f0e3c7]/40` |
| `bg-emerald-950` | `bg-[#0c281c]/90` |
| `hover:bg-emerald-700` | `hover:bg-[#0c281c]/90` |
| `hover:text-emerald-700` | `hover:text-[#0c281c]` |
| `hover:text-emerald-600` | `hover:text-[#0c281c]` |
| `border-emerald-200` | `border-[#0c281c]/20` |
| `border-t-emerald-600` | `border-t-[#0c281c]` |
| `from-emerald-400` | `from-[#0c281c]` |
| `to-teal-500` | `to-[#0c281c]/80` |

After replacements, run `npm run build` to confirm no broken references.

---

## Phase 2 — Navigation Overhaul

### Step 2.1 — Desktop: Replace Sidebar with Top Header

**File:** `src/components/layout/Layout.jsx`

The current `AppLayout` uses a shadcn `<Sidebar>` on desktop. In v2, desktop users see a **slim top header** instead. The sidebar becomes mobile-only (drawer pattern).

Changes to `AppLayoutInner`:

1. Wrap the current `<Sidebar>` in `className="hidden"` — do not delete it, it powers the mobile drawer.

2. Add a new `<DesktopHeader>` component (create `src/components/layout/DesktopHeader.jsx`) rendered above `<main>` and visible only on `md:` and above:

```jsx
// src/components/layout/DesktopHeader.jsx
// Slim, full-width top bar in Deep Forest Green for desktop (md+)
// Structure:
//   [Logo + Brand Name]   [Nav Links: Calendar | Organizers | Guides | Refuges | About]   [Lang | Bell | Avatar | "Book a Trip" CTA]
//
// Styling:
//   - bg: #0c281c (use bg-[#0c281c])
//   - text/icons: #f0e3c7 (use text-[#f0e3c7])
//   - active nav link: gold underline (border-b-2 border-[#8B6914])
//   - height: h-16 (64px)
//   - sticky top-0 z-50
//   - "Book a Trip" button: bg-[#8B6914] text-[#0c281c] font-heading rounded-full px-5 py-2
//
// Reuse existing logic from PublicHeader.jsx for:
//   - language switcher (useLanguage hook)
//   - login/logout/user state (useAuth hook)
//   - active route detection (useLocation hook)
//   - navigation links (same 4 public routes + About)
//
// For authenticated organizers, add a 5th link: "Dashboard" → createPageUrl("MyTrips")
```

3. In `Layout.jsx`, in the `AppLayout` render, add:
```jsx
<main className="flex-1 flex flex-col">
  <DesktopHeader />  {/* NEW — md+ only */}
  <header className="... md:hidden ...">  {/* existing mobile header unchanged */}
```

4. Remove `<SidebarTrigger>` from the desktop view (it's already `md:hidden` in the mobile header — verify and keep it that way).

### Step 2.2 — Mobile: Redesign Bottom Tab Bar

**File:** `src/components/layout/Layout.jsx` — the `BottomNav` component

Redesign the bottom nav with the brand palette and a new 5-tab structure:

```
Tab 1: Explore   → /calendar         icon: Compass
Tab 2: Map       → /greekrefuges     icon: Map
Tab 3: [FAB +]   → context-aware     (center raised gold button)
Tab 4: Discover  → /organizerslist   icon: Users
Tab 5: My Pack   → /mybookings (hiker) or /mytrips (organizer)   icon: Backpack
```

**Styling rules:**
- Nav bar background: `bg-[#0c281c]`
- Icon + label color (inactive): `text-[#f0e3c7]/70`
- Icon + label color (active): `text-[#f0e3c7]` with a `bg-[#f0e3c7]/10` rounded pill behind it
- Active indicator: a small `w-1 h-1 rounded-full bg-[#8B6914]` dot above the active icon
- Center FAB: `w-14 h-14 rounded-full bg-[#8B6914] text-[#0c281c] shadow-lg` — raised `−mt-6` above the bar, contains `<PlusCircle>` icon
- FAB action: navigates to `createPageUrl("TripForm")` for organizers, or `createPageUrl("Calendar")` for hikers (with a filter pre-applied)
- Tab bar height: `h-16` + safe area inset
- Font: apply `font-[family-name:var(--font-heading)]` to tab labels

### Step 2.3 — Unify PublicLayout Header

**File:** `src/components/layout/PublicHeader.jsx`

Replace the current generic header with the same `DesktopHeader` component on desktop (md+). On mobile, keep the existing hamburger sheet — but restyle it:
- Sheet background: `bg-[#0c281c]`
- Link text: `text-[#f0e3c7]`
- Login button: `bg-[#8B6914] text-[#0c281c]`
- Language buttons: outlined in `border-[#f0e3c7]/40 text-[#f0e3c7]`

---

## Phase 3 — Trip Card Redesign

**Goal:** Full-bleed photo-first cards with Deep Forest gradient overlay.

### Step 3.1 — Locate All Trip Card Components

Check these files and apply the card pattern to each:
- `src/components/calendar/TripsList.jsx` (main event list cards)
- `src/components/calendar/PromotedTrip.jsx` (featured/promoted card)
- `src/components/trips/OrganizerTripCard.jsx`
- `src/pages/Home.jsx` (featured expeditions section)

### Step 3.2 — New Card Pattern

Replace current `<Card>` white-border pattern with this structure:

```jsx
<div className="relative rounded-xl overflow-hidden group cursor-pointer
                aspect-[4/3] md:aspect-[16/9]
                shadow-md hover:shadow-xl transition-shadow duration-300">

  {/* Full-bleed photo */}
  <OptimizedImage
    src={tripImage}
    alt={trip.title}
    className="absolute inset-0 w-full h-full object-cover
               group-hover:scale-105 transition-transform duration-500"
  />

  {/* Deep Forest gradient overlay — rises from bottom */}
  <div className="absolute inset-0 bg-gradient-to-t
                  from-[#0c281c] via-[#0c281c]/50 to-transparent" />

  {/* Content anchored to bottom */}
  <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">

    {/* Difficulty + Status badges */}
    <div className="flex items-center gap-2">
      <span className="text-xs font-[family-name:var(--font-heading)] font-bold
                       bg-[#8B6914] text-[#f0e3c7] px-2.5 py-0.5 rounded-full uppercase tracking-wide">
        {trip.difficulty}
      </span>
      {/* Status badge if almost sold out */}
    </div>

    {/* Trip title */}
    <h3 className="font-[family-name:var(--font-heading)] font-bold text-[#f0e3c7]
                   text-lg leading-tight line-clamp-2">
      {trip.title}
    </h3>

    {/* Meta row: date + price + organizer */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-[#f0e3c7]/80 text-sm">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formattedDate}</span>
      </div>
      <span className="font-[family-name:var(--font-heading)] font-bold
                       text-[#8B6914] text-base">
        {price}
      </span>
    </div>

  </div>
</div>
```

### Step 3.3 — Grid Layout

In `TripsList.jsx`, update the grid from the current list/card layout to:
```
Mobile:  1 column, full-width cards
Tablet:  2 columns
Desktop: 3 columns
```
Use: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`

---

## Phase 4 — Global Typography Pass

Apply Century Gothic to all headings and key labels across the app:

1. In `tailwind.config.js`, extend `fontFamily`:
```js
fontFamily: {
  heading: ["Century Gothic", "Century Gothic Pro", "Futura", "Trebuchet MS", "sans-serif"],
  body: ["system-ui", "-apple-system", "Inter", "sans-serif"],
},
```

2. In the global CSS, add:
```css
body {
  font-family: var(--font-body);
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

3. Do a targeted pass on these components, adding `font-heading` (Tailwind class) or `font-[family-name:var(--font-heading)]`:
   - All `<h1>` `<h2>` `<h3>` tags across pages
   - `<Button>` components that are primary CTAs
   - All `<Badge>` components
   - Page titles in `Calendar.jsx`, `TripDetails.jsx`, `OrganizersList.jsx`
   - Sidebar brand name (`Nature Explorers` text in `Layout.jsx`)
   - Bottom nav tab labels

---

## Phase 5 — Page-Level Polish

### Home.jsx
- Hero section: full-viewport-height (`min-h-screen`) image with Deep Forest gradient overlay from bottom 50%. Parchment headline in Century Gothic. Gold CTA button.
- Featured trips: use the new card grid (Phase 3).
- Replace any `text-gray-*` or `text-slate-*` with `text-[#0c281c]/70`.

### Calendar.jsx
- Replace the calendar grid header (month name + nav arrows) with Forest Green background and Parchment text.
- Day cells with trips: add a `w-1.5 h-1.5 rounded-full bg-[#8B6914]` dot indicator.
- Selected day: `bg-[#0c281c] text-[#f0e3c7]` instead of emerald.
- Filter bar: pill-style filters with `border-[#0c281c]/20` border, `bg-[#0c281c]` when active.

### TripDetails.jsx
- Hero image: full-width, aspect-[16/9], with Forest gradient overlay.
- Title: Century Gothic, large (text-3xl md:text-4xl), `text-[#0c281c]`.
- "Book Now" CTA: `bg-[#0c281c] text-[#f0e3c7] font-heading` — sticky on mobile (fixed bottom bar above the tab nav).
- Info chips (date, difficulty, price, location): pill style with `bg-[#0c281c]/8 text-[#0c281c]` and gold icon.

### Login.jsx
- Background: `bg-[#0c281c]` full screen.
- Card: `bg-[#f0e3c7]` centered, rounded-2xl, shadow-2xl.
- Title: Century Gothic, `text-[#0c281c]`.
- Submit button: `bg-[#0c281c] text-[#f0e3c7]`.

---

## Phase 6 — Quality Gate

Before marking any phase complete:

1. **Run the dev server** (`npm run dev`) and visually check each changed page in a browser.
2. **Run the linter** (`npm run lint`) — fix all errors, warnings are acceptable.
3. **Run the build** (`npm run build`) — must complete with zero errors.
4. **Contrast check:** For any new color combination, verify it meets WCAG AA (4.5:1 for text).
5. **Mobile check:** Resize browser to 390px width. Confirm:
   - Bottom nav is visible and properly colored
   - Cards fill width correctly
   - No text overflow or clipping
   - Touch targets ≥ 44px (check existing `min-h-[44px]` classes are preserved)
6. **Desktop check:** At 1280px width, confirm:
   - Sidebar is hidden
   - New DesktopHeader is visible
   - Card grid shows 3 columns
   - No layout breaks

---

## Implementation Order

```
Phase 1 → CSS tokens + font → Commit: "feat: apply brand token layer (#0c281c / #f0e3c7)"
Phase 2 → Navigation       → Commit: "feat: desktop top header + mobile bottom nav rebrand"
Phase 3 → Trip cards       → Commit: "feat: full-bleed photo card design"
Phase 4 → Typography       → Commit: "feat: Century Gothic heading font applied globally"
Phase 5 → Page polish      → Commit: "feat: page-level v2 polish (Home, Calendar, TripDetails, Login)"
Phase 6 → QA pass          → Commit: "chore: v2 phase 1 QA pass — lint, build, contrast verified"
```

Do not combine phases into a single commit. Each phase should be independently reviewable.

---

## What NOT to Change in Phase 1

- Do **not** modify any Supabase queries, API calls, or data models.
- Do **not** change routing logic or URL structures.
- Do **not** modify `src/api/`, `src/lib/`, or any auth logic.
- Do **not** touch the `migration/` or `scripts/` directories.
- Do **not** add new npm packages unless strictly necessary (prefer Tailwind utilities and CSS).
- Do **not** change the `framer-motion` animation logic in `src/Layout.jsx`.
- Preserve all existing ARIA labels, `aria-current`, `role` attributes — accessibility must not regress.
- Preserve all existing `min-h-[44px]` and `min-w-[44px]` touch target classes.

---

## Reference Files (Read These First)

Before writing any code, read the following files to understand the existing structure:

```
src/App.jsx
src/components/layout/Layout.jsx
src/components/layout/PublicHeader.jsx
src/components/layout/PublicFooter.jsx
src/components/calendar/TripsList.jsx
src/components/calendar/PromotedTrip.jsx
src/pages/Home.jsx
src/pages/Calendar.jsx
src/pages/TripDetails.jsx
tailwind.config.js
index.html
```

Find the global CSS file with: `find src -name "*.css" | head -20`

---

*End of redesign prompt. Begin with Phase 1, Step 1.1.*
