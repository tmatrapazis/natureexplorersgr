# Claude Code Reference — Nature Explorers

This file is loaded automatically by Claude Code. Use it as the primary reference before making any changes to this project.

---

## What This App Is

A bilingual (English / Greek) React + Vite SPA for discovering and booking hiking trips in Greece. Three user types: **visitors** (anonymous), **hikers** (authenticated), **organizers** (authenticated). Backend is Supabase (PostgreSQL + Auth + RLS). See `README.md` for full architecture and user journeys.

---

## Tech Stack at a Glance

| Concern | Library |
|---|---|
| UI framework | React 18 + Vite 6 |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Database / Auth | Supabase (`@supabase/supabase-js`) |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| Charts | Recharts 2 |
| Maps | react-leaflet + leaflet.markercluster |
| Toasts | sonner |
| Animations | Framer Motion |
| Dates | date-fns, date-fns-tz |

---

## Critical File Locations

```
src/
  api/
    supabaseClient.js         # Supabase singleton — import { supabase } from here
    db.js                     # ALL database access goes through here
    emailNotifications.js     # Email helpers (fire-and-forget via Edge Function)
  components/
    bookings/
      BookingForm.jsx          # Hiker-facing booking modal
      BookingCard.jsx          # Organizer-facing single booking row
      BookingList.jsx          # Organizer-facing list of bookings per trip
    contexts/
      LanguageContext.jsx      # CANONICAL language context — always import from here
    translations/
      en.jsx                   # English strings
      el.jsx                   # Greek strings
      useTranslations.jsx      # useTranslation(language) → { t }
    layout/
      Layout.jsx               # App shell, nav, bottom bar
    upgrade/
      UpgradePrompt.jsx        # Premium gate component
    seo/
      useSEO.jsx               # <head> meta management
  lib/
    AuthContext.jsx            # Auth state — import { useAuth } from here
    useOrganizerPlan.js        # isPremium / isExpired hook
    TabNavigationContext.jsx   # CANONICAL tab nav — never import the one in contexts/
  pages/
    Home.jsx
    Calendar.jsx
    TripDetails.jsx
    MyBookings.jsx             # Hiker: view own bookings
    MyTrips.jsx                # Organizer: manage own trips
    ManageBookings.jsx         # Organizer: cross-trip booking dashboard (premium)
    OrganizerAnalytics.jsx     # Organizer: revenue KPIs + charts (premium)
  App.jsx
  pages.lazy.js               # RUNTIME route registry (lazy chunks) — edit this to add routes
  pages.config.js             # Auto-generated, NOT used at runtime — do not touch

supabase/
  functions/
    send-booking-email/
      index.ts                # Resend-backed email Edge Function
```

---

## Translation System — How It Works

Every user-visible string must go through `t()`. **No hardcoded English or Greek in JSX.**

```jsx
import { useLanguage } from '@/components/contexts/LanguageContext';
import { useTranslation } from '@/components/translations/useTranslations';

const { language } = useLanguage();
const { t } = useTranslation(language);

// Usage
<p>{t('booking.cancel_booking')}</p>
```

### Adding new strings

1. Add the key to **both** `src/components/translations/en.jsx` and `el.jsx`.
2. Use it via `t('section.key')`.
3. Never use `language === 'el' ? ... : ...` for UI strings — that pattern has been fully replaced.

`language === 'el' ? ... : ...` is only acceptable for:
- SEO meta strings inside `useSEO()` calls
- JSON-LD structured data objects
- Image `alt` attributes on the Home page

### Existing translation sections

`common`, `header`, `navigation`, `roles`, `home`, `calendar`, `trip`, `trip_form`, `booking`, `organizer`, `profile`, `role_selection`, `filters`, `notifications`, `errors`, `manage_bookings`, `social`, `guides`, `refuges`, `organizer_plans`, `request_verification`, `layout`, `analytics`

---

## Data Layer Rules

- **All DB calls go through `src/api/db.js`.** No raw Supabase queries outside that file — exceptions: auth calls, profile lookups, Realtime subscriptions (MyTrips only).
- Methods throw on error. Wrap in try/catch only when you need to handle the failure gracefully.
- `HikingTrip.update` uses `.maybeSingle()` intentionally — hikers trigger best-effort view-count increments that RLS blocks (returns 0 rows, not an error).
- `Booking.filterByTripIds(ids)` is the batch query for organizer dashboards — do not replace with N individual `filter()` calls.
- `Booking.getTierAvailability(tripId)` calls a `SECURITY DEFINER` RPC to bypass RLS for slot counts — do not change.

---

## Booking Status Lifecycle

```
pending → confirmed → paid        (happy path)
pending → cancelled               (hiker self-cancels via MyBookings)
pending → declined                (organizer declines, optional reason)
confirmed → declined              (organizer reverses; slot restored)
```

Status badge styles are in `STATUS_STYLES` constants inside `BookingCard.jsx` and `MyBookings.jsx`. Status labels use `t('booking.status_label_${status}')`.

### Slot tracking

Each pricing tier has `slots` (total) and `remaining` (current). `BookingCard.jsx` decrements `remaining` on confirm, restores it on decline/cancel. `BookingForm.jsx` reads `remaining` directly from the trip object — no extra query needed.

---

## Premium Plan System

Controlled by `plan` + `plan_expires_at` on the `organizers` table.

```
plan = 'free'                                → free tier
plan = 'premium' + plan_expires_at = null    → premium, no expiry
plan = 'premium' + plan_expires_at > now()   → premium, active
plan = 'premium' + plan_expires_at <= now()  → EXPIRED premium
```

Use `useOrganizerPlan()` hook — never read `plan` directly:

```js
const { isPremium, isExpired, organizer, isLoading } = useOrganizerPlan();
```

- `isExpired` (lapsed premium) → show amber banner, preserve full booking data access
- `!isPremium && !isExpired` (never had premium) → show `<UpgradePrompt />`

---

## Email Notifications

Handled by `src/api/emailNotifications.js` → calls `supabase/functions/send-booking-email/`.

| Function | When | To |
|---|---|---|
| `sendBookingConfirmedEmail` | Organizer confirms | Hiker |
| `sendBookingDeclinedEmail` | Organizer declines | Hiker |
| `sendBookingPaidEmail` | Organizer marks paid | Hiker |
| `sendBookingCancelledByHikerEmail` | Hiker cancels | Organizer |

All calls are **fire-and-forget** — never `await` them, never let failures block the booking flow.

**To activate:** set `RESEND_API_KEY` and `FROM_EMAIL` in Supabase Dashboard → Project Settings → Edge Functions → Secrets, then:
```bash
supabase functions deploy send-booking-email
```

---

## Google Analytics

`src/components/analytics/GoogleAnalytics.jsx` — measurement ID `G-JZQZ0VT8XK`.

**GA4 is production-only.** All tracking calls are guarded with `import.meta.env.PROD`. Do not remove this guard — GA4 servers return 503 for localhost origins.

---

## Calendar / Promoted Trip

The `hiking_trips` table uses `is_promoted_calendar` (boolean) and `promoted_calendar_until` (timestamp) — **not** `is_promoted`. Both `Calendar.jsx` and `PromotedTrip.jsx` check:

```js
trip.is_promoted_calendar === true &&
(!trip.promoted_calendar_until || new Date(trip.promoted_calendar_until) > new Date())
```

---

## Routing

Routes are registered in **`src/pages.lazy.js`** (runtime lazy-loaded chunks). `src/pages.config.js` is auto-generated and **not used at runtime** — do not add routes there.

The host must rewrite all unmatched routes to `index.html` (SPA routing).

---

## Common Gotchas

| Situation | Rule |
|---|---|
| Adding a new page | Register it in `pages.lazy.js`, not `pages.config.js` |
| Importing language context | Always use `src/components/contexts/LanguageContext.jsx` |
| Importing tab navigation | Always use `src/lib/TabNavigationContext.jsx` (the one in `contexts/` is a legacy no-op) |
| Showing booking data to organizer | Use `Booking.filterByTripIds()`, not per-trip `filter()` loops |
| Trip slot availability for hikers | Read `trip.pricing_options[].remaining` directly — no extra query, avoids RLS issues |
| String in JSX | Must use `t()` — never hardcode English or Greek |
| GA4 events | Wrap with `if (import.meta.env.PROD)` |
| Email send | Fire-and-forget — never block UX on email result |
| `useMemo` that calls `t()` | Include `t` in the dependency array so labels update on language change |

---

## Environment Variables

```bash
# .env.local (frontend)
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

# Supabase Edge Function secrets (set in dashboard)
RESEND_API_KEY=<resend-api-key>
FROM_EMAIL=Nature Explorers <noreply@yourdomain.gr>
```

---

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint
```
