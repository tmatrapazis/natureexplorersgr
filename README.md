# Nature Explorers

Nature Explorers is a React + Vite web application for discovering and managing hiking trips in Greece.  
It supports two primary personas:

- Hikers (`user`): browse trips, view details, and manage bookings.
- Organizers (`admin`): create/manage trips, maintain organizer profiles, and handle participant communication.

The app is built on top of the Base44 SDK for authentication, entity CRUD, file uploads, and integrations.

## What This App Does

- Public trip discovery:
  - Home landing page with featured trips and SEO content
  - Calendar view with filtering and monthly browsing
  - Trip details pages and organizer profile pages
  - Organizer and mountain guide directories
  - Greek mountain refuges map + list
- Authenticated user workflows:
  - Role selection for new users (hiker vs organizer intent)
  - Profile completion/editing
  - Hiker booking tracking (`MyBookings`, `MyProfile`)
  - Organizer trip management (`CreateTrip`, `EditTrip`, `MyTrips`)
  - Organizer verification request flow
- Platform capabilities:
  - Bilingual UI (`en`, `el`)
  - GA4 tracking hooks
  - Cookie consent management
  - Structured data (schema.org) on major SEO pages

## Tech Stack

- Runtime: React 18, React Router, Vite 6
- Data/Auth: `@base44/sdk`
- Server state: `@tanstack/react-query`
- UI: Tailwind CSS + shadcn/ui (Radix primitives)
- Forms/validation: react-hook-form, zod (available in deps)
- Maps: `react-leaflet`
- SEO/analytics: custom `useSEO`, GA4 helper
- Date/time: `date-fns`, `date-fns-tz`, `moment-timezone`

## Project Structure

```text
src/
  api/                    # Base44 client + entity/integration exports
  components/
    analytics/            # Google Analytics integration
    calendar/             # Calendar subcomponents
    contexts/             # Language context
    cookie/               # Cookie consent banner/preferences
    guides/               # Guide cards/share
    helpers/              # Domain helpers (trip, booking, pricing, timezone)
    layout/               # Header/footer/nav/notifications
    seo/                  # SEO hooks + structured data component
    translations/         # en/el dictionaries + translator helper
    ui/                   # shadcn/ui components
  lib/
    AuthContext.jsx       # Auth + app public settings flow
    NavigationTracker.jsx # URL sync + app log tracking
    query-client.js       # React Query client config
    app-params.js         # Runtime app params from URL/env/localStorage
  pages/                  # Route pages
  Layout.jsx              # Active app layout wrapper from pages.config
  pages.config.js         # Auto-generated page registry + main page
```

## Routing

Routes are auto-registered in `src/pages.config.js`, then mounted in `src/App.jsx`.

- Root route: `/` -> `Home`
- Named routes use page keys (case-insensitive in practice):
  - `/calendar`
  - `/createtrip`
  - `/edittrip` (expects `?id=<tripId>`)
  - `/tripdetails` (expects `?id=<tripId>`)
  - `/organizerprofile` (expects `?code=<organizerCode>`)
  - `/guides`
  - `/guideprofile` (expects `?id=<guideId>`)
  - `/createguideprofile`
  - `/editguideprofile` (expects `?id=<guideId>`)
  - `/mytrips`
  - `/mybookings`
  - `/myprofile`
  - `/editprofile`
  - `/editorganizerprofile`
  - `/hikerprofile` (expects `?id=<userId>` and optionally `tripId`)
  - `/organizerslist`
  - `/requestverification`
  - `/roleselection`
  - `/greekrefuges`
  - `/termsofuse`
  - `/tempimageuploader`

## Auth and App Boot Flow

Authentication and app readiness are controlled by:

- `src/lib/AuthContext.jsx`
- `src/lib/app-params.js`

At startup, the app:

1. Reads runtime params from URL/query/localStorage/env.
2. Fetches app public settings from Base44 public endpoint.
3. If token exists, validates current user via `base44.auth.me()`.
4. Handles auth errors (`auth_required`, `user_not_registered`) and redirects/logical guards.

### Runtime Parameters

The app can be configured either by URL params or Vite env vars:

- URL params:
  - `app_id`
  - `server_url`
  - `access_token` (removed from URL after capture)
  - `from_url`
  - `functions_version`
- Environment fallback:
  - `VITE_BASE44_APP_ID`
  - `VITE_BASE44_BACKEND_URL`

Values are persisted in localStorage under `base44_<snake_case_param>`.

## Data Model (Observed via Usage)

Entities used via `base44.entities.*`:

- `User` (read/delete in selected flows)
- `Organizer`
- `HikingTrip`
- `Booking`
- `Notification`
- `MountainGuide`
- `Refuge`
- `Query` (exported, not central in current pages)

Core integrations used via `base44.integrations.Core.*`:

- `UploadFile` (image/profile/certification uploads)
- `GenerateImage` (AI image generation for trips)
- `SendEmail` (booking/organizer notifications)
- `InvokeLLM`, `SendSMS`, `ExtractDataFromUploadedFile` (exported, available)

## Domain Rules and Helpers

Important business logic lives in:

- `src/components/helpers/tripHelpers.jsx`
  - computes trip lifecycle status (`upcoming`, `happening now`, `completed`, `cancelled`)
- `src/components/helpers/bookingHelpers.jsx`
  - booking statistics and organizer trip insights
- `src/components/helpers/pricingHelpers.jsx`
  - multi-price support and legacy single-price fallback
- `src/components/helpers/dateHelpers.jsx`
  - Athens timezone date range formatting
- `src/components/helpers/timezoneHelpers.jsx`
  - explicit timezone utilities for `Europe/Athens`

## Localization

Language support is implemented via:

- `src/components/contexts/LanguageContext.jsx`
- `src/components/translations/en.jsx`
- `src/components/translations/el.jsx`
- `src/components/translations/useTranslations.jsx`

Language preference is stored in localStorage (`app_language`), defaulting to `en`.

## Analytics and Cookies

- GA4 loader/tracker: `src/components/analytics/GoogleAnalytics.jsx`
  - Current measurement ID is hardcoded: `G-JZQZ0VT8XK`
- Cookie consent: `src/components/cookie/CookieConsent.jsx`
  - preferences stored under `cookie_consent_preferences`

## Scripts

From `package.json`:

- `npm run dev` -> start Vite dev server
- `npm run build` -> production build
- `npm run preview` -> preview production build
- `npm run lint` -> ESLint over selected app files
- `npm run typecheck` -> `tsc` against `jsconfig.json` scope

## Local Development

### Prerequisites

- Node.js 18+ (recommended modern LTS)
- npm

### Install

```bash
npm install
```

### Configure

Create `.env.local` (or `.env`) with:

```bash
VITE_BASE44_APP_ID=<your_app_id>
VITE_BASE44_BACKEND_URL=<your_base44_backend_url>
```

Optional:

- `BASE44_LEGACY_SDK_IMPORTS=true` for legacy SDK import compatibility in Vite plugin.

### Run

```bash
npm run dev
```

## Notable Implementation Notes

- `src/Layout.jsx` is the active layout configured in `src/pages.config.js`.
- `src/components/layout/Layout.jsx` exists but is not wired by current page config.
- `pages/TripDetails` (without extension) appears to be a legacy duplicate not used by Vite routing.
- Some pages include diagnostics/logging intended for troubleshooting (for example `MyBookings`).

## Deployment Notes

- This is a client-rendered SPA; deploy the `dist/` output from `npm run build`.
- Ensure host rewrites all unmatched routes to `index.html` so client-side routing works.
- Runtime auth/app params can be injected through URL query parameters if needed by embed/runtime environments.
