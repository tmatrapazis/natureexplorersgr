# Nature Explorers

Nature Explorers is a React + Vite web application for discovering and booking hiking trips in Greece. It serves three distinct user personas:

- **Visitors** (anonymous): browse trips, organizer profiles, guides, and refuges.
- **Hikers** (authenticated): submit booking requests, track their bookings, and follow organizers.
- **Organizers** (authenticated): create and publish trips, manage participant bookings, and view revenue analytics.

Backend is powered by Supabase (PostgreSQL + Auth + RLS). Server state is managed with TanStack Query v5.

---

## User Journeys

### 1. Anonymous Visitor

```
Home (featured trips, SEO landing)
  └─ Calendar (filter by date / difficulty / tag)
       └─ TripDetails (full trip info, pricing, map)
            └─ OrganizerProfile (organizer bio, all trips, follow)
                 └─ Login / Register (redirect after intent)
```

Key behaviors:
- All public pages are fully rendered without authentication.
- TripDetails shows a booking button if the organizer is active premium, or an external link for free-tier organizers.
- Attempting to book or follow redirects to login with a `?redirect=` param so the user lands back on the same page after auth.

---

### 2. New User Registration

```
Register (Supabase Auth)
  └─ RoleSelection (hiker or organizer intent)
       ├─ [hiker] → EditProfile (complete profile) → Home
       └─ [organizer] → EditOrganizerProfile (complete organizer profile) → MyTrips
```

- Role selection runs once; after the profile has an `organizer_code` the user is treated as an organizer app-wide.
- Organizers start on the Free plan automatically. No manual DB setup is needed.

---

### 3. Hiker Journey

```
Browse (Home / Calendar)
  └─ TripDetails
       ├─ [premium organizer] Book Now → BookingForm modal
       │    └─ Submit request → status: pending
       │         └─ Organizer confirms → Notification → status: confirmed
       │              └─ Pay organizer (offline) → status: paid
       └─ [free organizer]  External booking link (Google Forms, Eventbrite, etc.)

MyBookings
  └─ View all booking statuses (pending / confirmed / paid / declined / cancelled)
```

- Hikers cannot see other hikers' bookings (RLS-enforced).
- Cancellation by the organizer triggers a notification and frees the slot.

---

### 4. Organizer Journey — Free Plan

```
TripForm → create trip (external booking link field visible)
MyTrips → list own trips, view draft / upcoming / past
  └─ [trip card] Edit / Cancel / Duplicate trip
EditOrganizerProfile → set bio, payment instructions, social links
RequestVerification → submit documents to become a verified organizer
OrganizerPlans → view Free vs Premium features → request upgrade
```

Free plan features:
- Unlimited trip creation and publication.
- Public organizer profile with follower count.
- External booking link per trip (Google Forms, Eventbrite, etc.).
- Trip analytics (view count) — read only.

Premium-locked features show an `UpgradePrompt` card with a link to `OrganizerPlans`.

---

### 5. Organizer Journey — Premium Plan

Everything in the Free plan, plus:

```
TripForm → external booking link hidden; in-app booking is automatic
MyTrips → Bookings tab → BookingList per active trip
ManageBookings → full cross-trip booking dashboard
  └─ BookingCard (per booking)
       ├─ Approve → status: confirmed → notify hiker (with payment instructions)
       ├─ Decline → status: declined → notify hiker (with optional reason)
       └─ Mark as Paid → status: paid → notify hiker

TripDetails (as a hiker) → "Book Now" button active
OrganizerAnalytics → revenue KPIs, monthly bar chart, status pie chart, top trips
```

Per-tier slot tracking:
- Each pricing tier can have a `slots` limit set in TripForm.
- `pricing_options[].remaining` is decremented on confirm, restored on decline/cancel.
- `BookingForm` and `TripDetails` read `remaining` directly — no extra query, no RLS issues.

---

### 6. Plan Expiry Journey

When `plan_expires_at` passes (organizer stays on `plan = 'premium'` in DB):

```
TripDetails (hiker view)
  └─ "Book Now" button hidden
       ├─ [has event_url] → external link shown instead
       └─ [no event_url] → "Booking temporarily unavailable"

ManageBookings / MyTrips Bookings tab
  └─ Amber banner: "Your Premium plan has expired"
       └─ [Renew] → OrganizerPlans
  └─ Existing bookings fully accessible (confirm / decline / mark paid all work)

OrganizerAnalytics → UpgradePrompt (access gated)
```

Key distinction: `isExpired` (was premium, now lapsed) vs `!isPremium` (never had premium). Only the latter shows `UpgradePrompt`; the former preserves access to existing booking data.

---

## Tech Stack

| Layer | Library |
|---|---|
| Runtime | React 18, React Router v7, Vite 6 |
| Backend / Auth | Supabase (PostgreSQL + Auth + RLS) |
| Server state | TanStack Query v5 |
| UI primitives | Tailwind CSS, shadcn/ui (Radix UI) |
| Charts | Recharts 2 |
| Maps | react-leaflet, leaflet.markercluster |
| Rich text editor | react-quill (lazy-loaded) |
| Drawer/mobile UI | Vaul |
| Animations | Framer Motion |
| Date utilities | date-fns, date-fns-tz |
| Notifications (toast) | sonner |
| SEO / analytics | custom `useSEO`, GA4 (`G-JZQZ0VT8XK`) |

---

## Project Structure

```
src/
  api/
    supabaseClient.js         # Supabase client singleton
    db.js                     # Data access layer (replaces base44.entities.*)
  components/
    analytics/                # Google Analytics loader + event tracker
    bookings/                 # BookingForm, BookingCard, BookingList
    calendar/                 # TripsList, TripFilters, TripsMap, PromotedTrip
    contexts/                 # LanguageContext (canonical import here)
    cookie/                   # Cookie consent banner + preferences
    guides/                   # Guide cards + share
    helpers/                  # Domain helpers:
                              #   tripHelpers    — computed trip status
                              #   bookingHelpers — booking stats
                              #   pricingHelpers — multi-tier pricing
                              #   dateHelpers    — Athens timezone formatting
                              #   timezoneHelpers
    layout/                   # Header, footer, nav, NotificationsBell, PageWrapper
    organizers/               # FollowButton, OrganizerTripCard
    seo/                      # useSEO hook + StructuredData component
    translations/             # en.jsx, el.jsx, useTranslations.jsx
    trips/                    # TripForm, TripCard, TripLocationMap
    ui/                       # shadcn/ui components + MobileSelect, PullToRefresh
    upgrade/                  # UpgradePrompt component
  lib/
    AuthContext.jsx            # Auth state + boot flow
    useOrganizerPlan.js        # isPremium / isExpired hook
    TabNavigationContext.jsx   # Tab-aware navigation stacks (canonical)
    NavigationTracker.jsx      # URL sync
    query-client.js            # React Query client config
    optimistic-mutations.js    # Shared optimistic update helpers
  pages/                      # Route pages (one file per route)
  pages.lazy.js               # React.lazy() registry — used by App.jsx
  pages.config.js             # Auto-generated eager registry (not used at runtime)
  App.jsx                     # Router + Suspense wrapper
  Layout.jsx                  # Layout router shim
```

---

## Routing

The app uses `pages.lazy.js` exclusively at runtime (code-split chunks via `React.lazy`). `pages.config.js` is auto-generated but not loaded.

| Path | Page | Auth required |
|---|---|---|
| `/` | Home | No |
| `/calendar` | Calendar | No |
| `/tripdetails?id=` | TripDetails | No (booking requires auth) |
| `/organizerprofile?code=` | OrganizerProfile | No |
| `/organizerslist` | OrganizersList | No |
| `/guides` | Guides | No |
| `/guideprofile?id=` | GuideProfile | No |
| `/greekrefuges` | GreekRefuges | No |
| `/termsofuse` | TermsOfUse | No |
| `/privacypolicy` | PrivacyPolicy | No |
| `/cookiepolicy` | CookiePolicy | No |
| `/about` | About | No |
| `/roleselection` | RoleSelection | Yes |
| `/editprofile` | EditProfile | Yes |
| `/mybookings` | MyBookings | Yes (hiker) |
| `/hikerprofile?id=` | HikerProfile | Yes |
| `/mytrips` | MyTrips | Yes (organizer) |
| `/tripform` | TripForm | Yes (organizer) |
| `/edittrip?id=` | EditTrip | Yes (organizer) |
| `/managebookings` | ManageBookings | Yes (organizer, premium) |
| `/organizeranalytics` | OrganizerAnalytics | Yes (organizer, premium) |
| `/organizerplans` | OrganizerPlans | Yes (organizer) |
| `/editorganizerprofile` | EditOrganizerProfile | Yes (organizer) |
| `/requestverification` | RequestVerification | Yes (organizer) |
| `/createguideprofile` | CreateGuideProfile | Yes |
| `/editguideprofile?id=` | EditGuideProfile | Yes |

---

## Data Layer (`src/api/db.js`)

All database access goes through plain async functions that throw on error. No direct Supabase calls outside this file (except Realtime subscriptions in MyTrips).

| Object | Table | Key methods |
|---|---|---|
| `HikingTrip` | `hiking_trips` | `list`, `filter`, `get`, `create`, `update`, `delete` |
| `Organizer` | `organizers` | `list`, `filter`, `create`, `update`, `updatePlan` |
| `Booking` | `bookings` | `list`, `filter`, `filterByTripIds`, `create`, `update`, `delete`, `getTierAvailability` |
| `Notification` | `notifications` | `filter`, `create`, `bulkCreate`, `update` |
| `OrganizerFollow` | `organizer_follows` | `filter`, `create`, `deleteMany` |
| `MountainGuide` | `mountain_guides` | `list`, `filter`, `create`, `update`, `delete` |
| `Refuge` | `refuges` | `list` |
| `Profile` | `profiles` | `get`, `update`, `delete` |
| `Promotion` | `promotions` | `getActive`, `filterByOrganizer`, `create`, `cancel` |

### RLS Notes

- Hikers can only read their own bookings (RLS policy). `Booking.filterByTripIds` is available to organizers who have a matching `organizer_code` policy.
- `Booking.getTierAvailability(tripId)` calls a `SECURITY DEFINER` RPC (`get_trip_tier_availability`) that bypasses RLS to return aggregate slot counts — no personal data exposed.
- `HikingTrip.update` uses `.maybeSingle()` to avoid PGRST116 errors when hikers (blocked by RLS) trigger best-effort updates (e.g. view count increment).

---

## Premium Plan System

Managed via the `plan` and `plan_expires_at` columns on the `organizers` table.

| Value | Meaning |
|---|---|
| `plan = 'free'` | Free tier (default) |
| `plan = 'premium'` + `plan_expires_at = null` | Premium, no expiry |
| `plan = 'premium'` + `plan_expires_at > now()` | Premium, active |
| `plan = 'premium'` + `plan_expires_at <= now()` | Expired premium |

The `useOrganizerPlan` hook (`src/lib/useOrganizerPlan.js`) computes:
- `isPremium` — active premium right now
- `isExpired` — was premium, expiry date has passed
- `plan`, `organizer`, `isLoading`

Admin upgrade: call `Organizer.updatePlan(organizerCode, 'premium', expiresAt)` directly in Supabase or via a server function.

Self-service upgrade: organizer clicks "Upgrade" / "Renew" → `OrganizerPlans` page → pre-filled email to `hello@natureexplorers.gr`.

---

## Auth and Boot Flow

Controlled by `src/lib/AuthContext.jsx`.

1. App mounts → `supabase.auth.getSession()` called.
2. If session exists, user object is stored in context; `organizer_code` is read from `profiles` table.
3. `onAuthStateChange` listener keeps the session live across tab focus.
4. Routes requiring auth check `user` from context; unauthenticated users are redirected to `/login?redirect=`.

---

## Localization

Bilingual (English / Greek). Language preference stored in localStorage under `app_language`, defaults to `en`.

- Context: `src/components/contexts/LanguageContext.jsx`
- Dictionaries: `src/components/translations/en.jsx`, `el.jsx`
- Hook: `src/components/translations/useTranslations.jsx` → `t('key')`

---

## Realtime

`MyTrips.jsx` subscribes to Supabase Realtime on the `bookings` table filtered by the organizer's trip IDs. On any `INSERT/UPDATE/DELETE` event the `['all-bookings']` and `['tier-availability']` query keys are invalidated, keeping slot counts live without polling.

---

## Analytics and Cookies

- GA4 loader: `src/components/analytics/GoogleAnalytics.jsx` — measurement ID `G-JZQZ0VT8XK`
- Cookie consent: `src/components/cookie/CookieConsent.jsx` — stored under `cookie_consent_preferences`

---

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint
npm run typecheck  # tsc
```

---

## Local Development

### Prerequisites

- Node.js 18+ LTS
- npm

### Install

```bash
npm install
```

### Configure

Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### Run

```bash
npm run dev
```

---

## Deployment

Client-rendered SPA. Deploy `dist/` from `npm run build`. The host must rewrite all unmatched routes to `index.html` for client-side routing to work.

---

## Notable Implementation Notes

- `src/pages.lazy.js` is the runtime page registry (lazy chunks). `src/pages.config.js` is auto-generated but unused at runtime — do not add manual imports to it.
- **Two `TabNavigationContext` files exist.** The canonical provider is `src/lib/TabNavigationContext.jsx`. `src/components/contexts/TabNavigationContext.jsx` is a legacy no-op duplicate — never import from there.
- `BookingForm.jsx` reads slot availability directly from `trip.pricing_options[].remaining` (set/maintained by `BookingCard`). This avoids a cross-user RLS issue that would occur if hikers queried confirmed bookings directly.
- `HikingTrip.update` uses `.maybeSingle()` (not `.single()`) to handle the case where a hiker's best-effort view-count update is blocked by RLS (returns 0 rows instead of throwing PGRST116).
- The `isExpired` flag in `useOrganizerPlan` distinguishes between a lapsed premium organizer (still has booking history — full access preserved) and a pure free-tier organizer (has never had premium — `UpgradePrompt` shown instead).
