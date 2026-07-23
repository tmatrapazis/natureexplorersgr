# Nature Explorers v2 — Development & Restructure Plan
### Direct build instructions for Web + iOS + Android

**Audience:** the developer(s) rebuilding natureexplorers.gr from scratch.
**Companion to:** `NatureExplorers_v2_Master_Plan.md` (product/strategy) and `NatureExplorers_v2_SWOT_Analysis.md`.
**Mandate:** the current app may be **deleted and fully restructured** on the latest technology. Reuse the **data** and the **business rules**, rebuild the **frontend**.

> **TL;DR decision.** Build a **Turborepo monorepo**: `apps/web` on **Next.js 15 (App Router, React 19, SSG/ISR)** for best-in-class SEO, `apps/mobile` on **Expo (React Native, Expo Router)** for real native iOS/Android with offline-first, and shared **`packages/`** for the Supabase data layer, types, business logic, i18n and design tokens. Keep **Supabase** as the backend. Payments on **Stripe Connect**. This replaces the current Vite SPA, which cannot deliver the SSR-grade SEO the strategy depends on.

---

## 0. Current state (what exists today)

- **Stack:** React 18 + **Vite 6** SPA, React Router v7, TanStack Query v5, Supabase JS, Tailwind + shadcn/Radix, react-leaflet + markercluster, Recharts, Framer Motion, react-hook-form + Zod, react-quill.
- **Scale:** 28 pages, 134 components. Data layer in `src/api/db.js` (313 lines). One Edge Function (`send-booking-email`).
- **Entities (from `migration/data` exports):** `HikingTrip`, `Organizer`, `MountainGuide`, `Refuge`, plus `Booking` and user `Profile`.
- **Origin:** migrated off **Base44** (see `base44/`, `migration/`, `scripts/migrate-from-base44.mjs`). The sitemap script still fetches from the Base44 API and hardcodes organizer slugs — **tech debt to remove**.
- **Brand tokens already defined** in `tailwind.config.js`: `brand.dark #0c281c`, `brand.gold #f0e3c7`, `brand.gold-accent #8B6914`, heading font "Century Gothic". **Carry these forward.**

**Why not just patch the SPA:** the strategy is SEO-led. A client-rendered Vite SPA ships an empty shell to crawlers; retrofitting SSR onto it is harder than starting on Next.js. And Capacitor-wrapping the SPA gives weaker native/offline than React Native. A greenfield monorepo is the correct call for "best in Europe."

---

## 1. Target architecture

```
natureexplorers/                      (Turborepo monorepo, pnpm workspaces)
├── apps/
│   ├── web/            Next.js 15 (App Router, RSC, SSG/ISR) — website + web app + SEO
│   └── mobile/         Expo SDK 52+ (React Native, Expo Router) — iOS + Android
├── packages/
│   ├── core/           domain logic: Zod schemas, pricing, booking/cancellation rules, constants, enums
│   ├── api/            Supabase client + generated DB types + typed data-access ("db" layer)
│   ├── i18n/           EN/EL message catalogs + typed t()
│   ├── ui/             design tokens, theme, shared primitives (web: Tailwind; native: NativeWind)
│   └── config/         shared tsconfig, eslint, prettier, tailwind preset
├── supabase/           migrations (SQL), Edge Functions, seed, config
└── turbo.json, pnpm-workspace.yaml, package.json
```

- **Language:** **TypeScript everywhere, `strict: true`.** (Current app is JS/JSX — do not port `.jsx`; rewrite as `.tsx`.)
- **Package manager:** **pnpm** + Turborepo for caching and task orchestration.
- **Backend:** **Supabase** — Postgres + Auth + RLS + Storage + Realtime + Edge Functions (unchanged choice; new schema).
- **Payments:** **Stripe Connect** (Express accounts). Apple Pay, Google Pay, Revolut Pay, cards, SEPA.
- **Web hosting:** **Vercel** (native Next.js SSR/ISR, edge, image optimization, preview deploys).
- **Mobile builds:** **EAS Build + EAS Submit** (Expo Application Services).
- **What is shared vs rebuilt:** `packages/*` (data, types, logic, i18n, tokens) is shared → ~40–60% of code. **UI is built twice** — Next.js web components vs React Native screens — because the rendering models differ. This is the deliberate cost of getting both top SEO and top native.

> **Alternative (faster, weaker) path — only if the team is web-only and time-boxed:** keep a single React codebase on **Vite + Capacitor** and add a prerender/SSR layer (e.g. `vite-react-ssg`). Ships faster with existing skills but yields weaker SEO and weaker native offline. **Not recommended given the "best in Europe / SEO-first" mandate.** The rest of this document assumes the Next.js + Expo architecture.

---

## 2. What to keep, migrate, and delete

**Keep / migrate (reuse the value):**
- The **Supabase Postgres data** and entity model (trips, organizers, guides, refuges, bookings). Re-model into the schema in §4 and migrate rows.
- The **translation content** in `src/components/translations/{en,el}.jsx` → port into `packages/i18n` (typed JSON/TS).
- The **business rules** encoded in `src/api/db.js` (slot availability RPC, batch booking queries, promoted-calendar logic, booking status lifecycle) → reimplement in `packages/core` + `packages/api`.
- The **brand tokens** from `tailwind.config.js` → `packages/ui`.
- Domain knowledge in `README.md`, `OPTIMIZATION_REPORT.md`, and the QA bug reports (fix those bugs by design in the rewrite).

**Delete (do not carry forward):**
- The entire **Vite SPA shell**: `index.html`, `vite.config.js`, `src/pages.lazy.js`, `pages.config.js`, `src/App.jsx`, React Router setup.
- All **Base44 coupling**: `base44/`, `scripts/migrate-from-base44.mjs` (after final data export), and the Base44-fetching **sitemap script** (replace with dynamic sitemaps in Next.js, §7).
- **react-quill / react-quill-new** (unmaintained, heavy) → use a modern editor (Tiptap) or Markdown.
- `react-hot-toast` **or** `sonner` — pick one (sonner) not both.
- jsPDF/html2canvas client PDF hacks → server-side generation if needed.

---

## 3. Repository & tooling setup (do this first)

1. `pnpm dlx create-turbo@latest` → scaffold monorepo; set up `pnpm-workspace.yaml` for `apps/*` and `packages/*`.
2. Add `apps/web`: `pnpm create next-app@latest` (App Router, TypeScript, Tailwind, ESLint).
3. Add `apps/mobile`: `pnpm create expo-app` with **Expo Router** + TypeScript + **NativeWind** (Tailwind for RN).
4. `packages/config`: shared `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`), ESLint flat config, Prettier, a **Tailwind preset** exporting the brand tokens.
5. Tooling: **Prettier**, **ESLint**, **Husky + lint-staged** (pre-commit typecheck+lint), **commitlint** (conventional commits), **Changesets** (optional).
6. **Generate DB types**: `supabase gen types typescript` → `packages/api/src/database.types.ts` (regenerate on every migration).
7. Env management: `.env` per app (never commit); document all keys in §16.
8. **Open Claude Code with `v2/` as the working directory** so the developer subagents in `.claude/agents/` are available — see §19 for which agent to use where.

---

## 4. Backend — Supabase schema, RLS, storage, functions

Author everything as **SQL migrations** in `supabase/migrations` (version-controlled). Enable **Row Level Security on every table**. Use `snake_case`, `uuid` PKs (`gen_random_uuid()`), `created_at`/`updated_at timestamptz`.

### 4.1 Core tables (rebuild + extend)

- **`profiles`** (1:1 with `auth.users`): `id`, `role` enum (`visitor`,`hiker`,`organizer`), `full_name`, `avatar_url`, `locale`, `explorer_rank`, `created_at`. Roles gate RLS.
- **`organizers`**: `id`, `owner_id`→profiles, `slug` (unique, for SEO URLs), `name`, `bio`, `logo_url`, `mite_number` (ΜΗ.Τ.Ε.), `gemi_number`, `verification_status` enum (`pending`,`verified`,`rejected`), `plan` enum (`free`,`pro`), `plan_expires_at`, `stripe_account_id`, `insurance_verified` bool, **DAC7 fields** (`tax_id`/VAT, `legal_address`, `country`), `payout_enabled` bool.
- **`mountain_guides`**: `id`, `organizer_id`, `slug`, `name`, `certifications`, `bio`, `photo_url`.
- **`regions`** (NEW, SEO backbone): `id`, `slug`, `name_en`, `name_el`, `intro_en`, `intro_el`, `geojson`/`center`, `hero_image`. Powers programmatic region pages.
- **`hiking_trips`** → **`trips`**: `id`, `organizer_id`, `slug` (unique), `title_en/el`, `description_en/el`, `region_id`, `meeting_point` (geography), `route_gpx_url`, `difficulty` enum, `distance_km`, `elevation_m`, `duration`, `trip_type` enum (`day`,`multi_day`), `start_at`, `end_at`, `status` enum (`draft`,`published`,`cancelled`,`completed`), `cover_image`, `gallery`, `gear_list`, `is_promoted_calendar` bool, `promoted_calendar_until`, `cancellation_policy_id`, `deposit_enabled` bool, `deposit_amount`/`deposit_pct`, `balance_due_days_before`.
- **`pricing_tiers`**: `id`, `trip_id`, `label`, `price`, `currency` default `EUR`, `slots` (total), `remaining`. Keep the **`SECURITY DEFINER` RPC** `get_tier_availability(trip_id)` for RLS-safe slot counts.
- **`refuges`**: `id`, `slug`, `name_en/el`, `region_id`, `elevation_m`, `capacity`, `contact`, `access_notes_en/el`, `coords`, `photos`. (Unique high-intent SEO asset — model richly.)
- **`bookings`**: `id`, `trip_id`, `hiker_id`, `pricing_tier_id`, `party_size`, `status` enum (`pending`,`confirmed`,`paid`,`cancelled`,`declined`), `total_amount`, `platform_fee_amount`, `currency`, `stripe_payment_intent_id`, `created_at`. Preserve the lifecycle: `pending→confirmed→paid`, `pending→cancelled`, `pending/confirmed→declined` (restore slot on decline/cancel).

### 4.2 New tables for v2 features

- **`cancellation_policies`**: `id`, `organizer_id`, `name`, `preset` enum (`day_standard`,`multiday_standard`,`graduated`,`flexible`,`custom`), `tiers` jsonb (array of `{days_before, refund_pct}`), `fee_follows_refund` bool default true. Defaults per §8.6 of the master plan.
- **`payment_schedules`** (deposit + balance): `id`, `booking_id`, `deposit_amount`, `deposit_paid_at`, `balance_amount`, `balance_due_at`, `balance_charged_at`, `balance_status` enum (`scheduled`,`charged`,`failed`,`cancelled`), `stripe_payment_method_id` (saved mandate).
- **`refunds`**: `id`, `booking_id`, `amount`, `platform_fee_refunded`, `reason`, `initiated_by` enum (`hiker`,`organizer`,`system`), `stripe_refund_id`, `status`.
- **`reviews`**: `id`, `booking_id` (unique — only paid bookings), `trip_id`, `organizer_id`, `rating`, `body`, `photos`, `created_at`. RLS: insert only if the booking is `paid` and belongs to the hiker.
- **`conversations`** + **`messages`** (in-app messaging): conversation scoped to `booking_id` or `inquiry`; `messages`(`id`,`conversation_id`,`sender_id`,`body`,`attachments`,`read_at`). **Realtime** subscription. Advanced (broadcast/templates/automation/team-inbox) gated by organizer `plan=pro`.
- **`sightings`** (community feed): `id`, `hiker_id`, `trip_id?`, `species?`, `caption`, `photos`, `location`, `created_at`. Append-only; feeds programmatic species pages.
- **`badges`**, **`user_badges`**, **`ranks`**: gamification. Compute ranks from verified completed bookings + distance + elevation via a scheduled function.
- **`subscriptions`**: `id`, `organizer_id`, `stripe_subscription_id`, `status`, `current_period_end`. Drives `organizers.plan`.
- **`dac7_reports`** / reporting view: aggregates organizer income per year for AADE export.
- **`audit_log`**: sensitive actions (refunds, verification, plan changes).

### 4.3 RLS policy rules (enforce)

- **Hikers** read published trips/organizers/reviews; read/write **only their own** bookings, sightings, messages, reviews.
- **Organizers** read/write **only their own** trips, bookings for their trips (batch query `bookings.filterByTripIds`), messages, cancellation policies. Never other organizers' data.
- **Public/anon** read only `status='published'` trips, verified organizers, refuges, regions, reviews.
- **Health/special-category data** on bookings visible only to the specific trip's organizer — never in feeds or analytics (§13 GDPR).
- Slot counts and any RLS-bypassing counts go through **`SECURITY DEFINER` RPCs** only.

### 4.4 Storage buckets

`avatars`, `trip-media`, `sighting-photos`, `refuge-photos`, `gpx`. Public-read for media that appears on SEO pages; signed URLs for private. Use Supabase image transforms (WebP/AVIF, resize) — never serve originals.

### 4.5 Edge Functions (Deno)

- **`stripe-webhook`** — verify signature; on `payment_intent.succeeded`/`charge.refunded`/`account.updated`/`invoice.paid` update bookings, payment_schedules, subscriptions, `organizers.plan`; fire emails; sync slot counts.
- **`create-booking-payment`** — build the Connect direct charge (deposit or full) + 5% `application_fee` + save payment method for balance.
- **`charge-balance`** (scheduled, hourly cron) — find `payment_schedules` where `balance_due_at<=now()` & `scheduled`; charge off-session; on failure retry + notify + release slot per policy.
- **`process-cancellation`** — compute refund from policy × days-to-departure; issue Stripe refund (proportional application-fee refund); restore slot; log.
- **`send-email`** — port existing `send-booking-email`; extend to all lifecycle emails (Resend).
- **`generate-sitemaps`** (scheduled) — regenerate/ping (replaces Base44 sitemap script). Or do sitemaps natively in Next.js (§7) and drop this.
- **`compute-ranks`** (scheduled nightly) — recompute explorer ranks/badges.
- **`dac7-export`** (annual) — build the AADE report.

---

## 5. Shared packages

- **`packages/core`** — pure TS, no I/O. Zod schemas for every entity + form; pricing math; **platform-fee calc** (5% with `min €1.50` and high-value cap/taper); **cancellation-refund calculator** (policy tiers × days-to-departure); booking-status state machine; enums/constants; date helpers (date-fns, Europe/Athens tz). Unit-tested with Vitest.
- **`packages/api`** — Supabase client factory (web: cookie-based SSR client via `@supabase/ssr`; native: AsyncStorage/SecureStore client); generated `database.types.ts`; typed data-access functions replacing `db.js` (e.g. `trips.listPublished`, `bookings.filterByTripIds`, `bookings.getTierAvailability` RPC). Every function typed end-to-end.
- **`packages/i18n`** — port EN/EL catalogs; typed `t()` keys; helpers for `hreflang` and locale routing. Keep the master-plan rule: **no hardcoded strings in UI**.
- **`packages/ui`** — design tokens (§12), theme provider, and shared primitives where feasible (NativeWind lets some class-based components be shared web↔native).

---

## 6. Web app — Next.js 15 (App Router)

### 6.1 URL & routing map (SEO-first, human slugs)

Localized routing with `[locale]` = `el` (default) or `en`. Kill all query-string routes (`/tripdetails?id=`).

```
/[locale]                                  Home (ISR)
/[locale]/trips                            Discovery + filters + map (ISR + client filter)
/[locale]/trips/[trip-slug]                Trip detail (SSG/ISR) ← booking, JSON-LD Event/Offer
/[locale]/regions/[region-slug]            Programmatic region page (SSG/ISR)
/[locale]/refuges                          Refuges index (ISR)
/[locale]/refuges/[refuge-slug]            Refuge page (SSG) ← TouristAttraction JSON-LD
/[locale]/guides & /guides/[slug]          Guide profiles (ISR)
/[locale]/organizers & /organizers/[slug]  Organizer profiles (ISR) ← LocalBusiness JSON-LD
/[locale]/calendar                         Calendar (ISR)
/[locale]/blog & /blog/[slug]              Content engine (SSG)
/[locale]/sightings/[species-slug]         Long-tail UGC pages (ISR)
/[locale]/(auth)/…                         login/register/reset (CSR)
/[locale]/(app)/…                          dashboards: my-bookings, my-trips, manage-bookings,
                                           analytics, messages, edit-* (SSR/CSR, auth-gated)
```

### 6.2 Rendering strategy per route type

- **Marketing/content/entity pages** (trips, regions, refuges, guides, organizers, blog): **SSG with ISR** (`revalidate` 1h; on-demand `revalidatePath` from the Stripe/CMS webhooks when a trip changes). Fully crawlable HTML.
- **Discovery/calendar:** ISR shell + client-side filtering via TanStack Query.
- **Authenticated dashboards:** SSR or CSR behind auth; **`noindex`**.
- Use **React Server Components** by default; client components only where interactivity is needed.

### 6.3 Data & auth

- Server components read via `packages/api` server client (`@supabase/ssr`, cookie session). Mutations via **Server Actions** or Route Handlers → Supabase (RLS enforced).
- Auth: Supabase Auth (email + Google/Apple OAuth). Middleware refreshes session; protects `(app)` routes.

---

## 7. SEO implementation — latest best practices (mandatory)

This is the growth engine. Implement all of it.

- **Metadata API:** per-route `generateMetadata()` → intent-matched bilingual `title`/`description` (kill the Base44 boilerplate), canonical, Open Graph, Twitter cards, per-entity OG images (Next.js `opengraph-image` dynamic generation).
- **hreflang:** emit `el` + `en` (+ `x-default`) alternates on every page via `alternates.languages`.
- **Structured data (JSON-LD)** per type: `TouristTrip`/`Event` + `Offer` (price, availability, dates) on trips; `Product` + `AggregateRating` for reviews (star snippets); `LocalBusiness`/`Organization` on organizers; `TouristAttraction` on refuges/regions; `BreadcrumbList` sitewide; `FAQPage` where FAQs exist (reuse the competitor FAQ pattern that already ranks).
- **Sitemaps:** dynamic `sitemap.ts` (Next.js) split by entity type (trips, regions, refuges, guides, organizers, blog) with real `lastModified`; a sitemap index; auto-submit + **IndexNow** ping on publish. Delete the old Base44 sitemap script.
- **robots.ts:** allow public, disallow `(app)`/auth; reference sitemap index.
- **Canonical + pagination** discipline on every entity and list.
- **Core Web Vitals budget:** LCP < 2.5s on 4G, CLS < 0.1, INP < 200ms. Use `next/image` (AVIF/WebP, responsive `sizes`, priority for LCP image), font `display: swap`, route-level code-splitting, streaming RSC, minimal client JS.
- **Programmatic SEO:** generate region / trip-type×place / refuge / guide / species pages from data — each with **unique real content** (data, photos, reviews), never thin templates.
- **Internal linking:** every blog post links to relevant trips/regions/refuges; breadcrumbs everywhere.
- **Semantic HTML + accessibility** (also EAA law, §13): correct headings, landmarks, alt text, focus order — this is a ranking *and* legal requirement.
- **AEO / LLM answer engines:** clear H-structure, concise factual intros, FAQ schema so answer engines can quote you.
- **301 redirects:** map every old route (`/tripdetails?…`, `/greekrefuges`, etc.) to the new slugged URLs to preserve any equity.

---

## 8. Mobile app — Expo (React Native)

### 8.1 Navigation & structure

- **Expo Router** file-based routing. **Bottom-tab bar:** `Discover · Map · (＋ Log Sighting) · Trips · Profile` (per master plan §3.1). Thumb-reachable, offline-persistent.
- **NativeWind** for Tailwind-style styling using the shared tokens.

### 8.2 Offline-first architecture (the moat)

- **Local DB:** **WatermelonDB** (SQLite) or `expo-sqlite` for the bookings queue, cached trip dossiers, and sightings queue.
- **Maps:** **MapLibre Native** (`@maplibre/maplibre-react-native`) with **pre-downloaded vector tiles** for a booked trip's region (download on booking confirmation over Wi-Fi).
- **Sync engine:** on reconnect, flush queued sightings (append-only) and booking actions; bookings are **server-authoritative** (slot RPC); profile edits last-write-wins with `synced_at`.
- **Cached dossier:** route GPX, meeting point, gear list, guide contact, emergency numbers, weather snapshot — all readable offline. Offline **emergency card** (nearest refuge, 112, guide phone).

### 8.3 Native modules

`expo-location` (+ background for live nav), `expo-camera`/`image-picker` (sightings), `expo-notifications` (push via FCM/APNs), `expo-secure-store` (tokens), `expo-file-system`, Supabase RN client, **`@stripe/stripe-react-native`** (Payment Sheet with Apple Pay + Google Pay).

### 8.4 Payments on mobile

- **Bookings are real-world services → 0% Apple/Google commission.** Use Stripe Payment Sheet (Apple Pay / Google Pay / Revolut Pay / card) freely.
- **Premium subscription is digital** → sell **web-first** (don't put IAP in the app for it); the app reads entitlement. Use EU external-link entitlement where needed.

### 8.5 Store & release

- **EAS Build** (iOS + Android) + **EAS Submit**. TestFlight + Play internal testing → closed beta with real organizers → public.
- **Universal/App Links** matching web slugs (a trip URL opens the app if installed) — share the routing scheme with `apps/web`.
- Bilingual store listings (EL/EN), ASO keywords ("hiking Greece", "πεζοπορία", "trails", "refuges"), in-brand screenshots.
- Privacy nutrition labels: location "app functionality", photos — declare accurately.

---

## 9. Payments — Stripe Connect implementation

- **Onboarding:** Stripe **Connect Express** for organizers (fast KYC); store `stripe_account_id`; gate `payout_enabled` on `charges_enabled`.
- **Booking charge:** **direct charge on the organizer's connected account** with **`application_fee_amount` = 5%** (`min €1.50`, high-value cap). Organizer = merchant of record. **Processing fee charged to the connected account** (keeps platform 5% clean).
- **Methods:** cards, **Apple Pay**, **Google Pay**, **Revolut Pay**, SEPA (subscriptions). SCA/3DS enforced.
- **Deposit + balance:** at booking, charge deposit + save payment method (SetupIntent/mandate). `charge-balance` cron charges the balance off-session on `balance_due_at`; split the 5% proportionally across deposit and balance.
- **Cancellations/refunds:** `process-cancellation` computes refund from policy; issues Stripe refund with proportional application-fee refund; restores slot. (Stripe keeps its processing fee on refunds — cover via the optional non-refundable booking fee.)
- **Subscriptions:** **Stripe Billing** for organizer Pro (web-first checkout), webhook → `organizers.plan`.
- **Webhooks** are the source of truth for status transitions — never trust the client.

---

## 10. Auth, roles & security

- Supabase Auth (email/password + Google + Apple). Role stored on `profiles.role`; role-selection flow after first login (visitor→hiker/organizer).
- **RLS is the security boundary** (§4.3) — the frontend never bypasses it. Service-role key only in Edge Functions/server, never shipped to client or app.
- Secrets in Vercel/EAS/Supabase env stores. Use `@supabase/ssr` cookie sessions on web.
- Security tasks: RLS test suite, dependency scanning, `dompurify`/sanitized rich text, rate-limit Edge Functions, pen-test before launch.

---

## 11. Internationalization

- `packages/i18n` catalogs (EN/EL), typed keys, **no hardcoded UI strings** (enforce via lint rule). Locale in the URL (`/el`, `/en`) with `hreflang`. Format dates/numbers per locale (`Europe/Athens`). Design the schema with `_en/_el` columns (or a translations table) so content is localizable and indexable in both languages.

---

## 12. Design system (Organic-Modern)

- **Tokens (carry from current `tailwind.config.js`):** `--brand-dark: #0c281c`, `--brand-sand: #f0e3c7`, `--brand-gold-accent: #8B6914`. Define full semantic scale (background, foreground, primary, muted, destructive, ring) as CSS vars; expose the same tokens to NativeWind for the app.
- **Typography:** Century Gothic (with Futura/Trebuchet fallbacks) for headings; a clean system/body font. Self-host the heading font (`display: swap`) for CWV.
- **Principles:** high-contrast for outdoor glare, large tap targets (gloves), generous whitespace, WCAG 2.1 AA contrast. Shared component library where NativeWind allows; otherwise parallel web/native primitives with identical tokens.
- Rebuild shadcn/Radix components fresh in `apps/web`; use RN equivalents (Tamagui or RN primitives + NativeWind) in `apps/mobile`.

---

## 13. Compliance implementation (build these in, per master plan §8.7)

- **ΜΗ.Τ.Ε. verification** at organizer onboarding (store `mite_number`/`gemi_number`, admin verify → `verification_status`, show verified badge). Block publishing trips until verified.
- **Insurance verification** field + gate (SWOT/Trust & Safety).
- **DAC7:** capture organizer tax ID/VAT/legal address/country at onboarding; build the annual AADE income report (`dac7-export`).
- **myDATA e-invoicing:** issue compliant e-invoices for the 5% commission + Pro subscriptions; integrate a Greek myDATA provider; VAT 24% (reverse-charge for EU-based organizers).
- **GDPR / special-category health data:** minimize, restrict medical disclosures to the specific organizer, exclude from feed/analytics/logs; consent + retention policy; DSAR tooling.
- **EAA accessibility (legally required since 28 June 2025):** meet **WCAG 2.1 AA** on web *and* app — semantic markup, keyboard/screen-reader support, contrast, captions. Add automated a11y checks (axe) to CI.
- **Cookie consent** (reuse/rebuild the `cookie` component) + pre-contract price/fee/cancellation disclosure before payment.
- Keep the platform positioned as an **intermediary** in T&Cs (avoid Package-Travel "organizer" liability).

---

## 14. Analytics, monitoring, testing

- **GA4** (`G-JZQZ0VT8XK`) — keep the **prod-only guard** (`process.env.NODE_ENV==='production'`); GA4 rejects localhost.
- **Product analytics** (PostHog or similar) for funnels: view→book, deposit→balance, free→pro.
- **Error/perf monitoring:** **Sentry** (web + RN). Web Vitals reporting to analytics.
- **Testing:** Vitest (unit — `packages/core` fee/cancellation math), **Playwright** (web e2e: booking, cancellation, SEO metadata assertions), **Detox/Maestro** (mobile e2e: offline sync, payment sheet). Lighthouse CI budget in the pipeline.

---

## 15. CI/CD & hosting

- **GitHub Actions + Turborepo remote cache:** on PR → typecheck, lint, unit, a11y, build; Playwright e2e on preview.
- **Web:** Vercel — production on `main`, **preview deploy per PR**; ISR + on-demand revalidation from webhooks; edge middleware for locale/auth.
- **Mobile:** EAS Build profiles (dev/preview/prod) + EAS Submit; OTA updates via `expo-updates` for JS-only fixes.
- **Supabase:** migrations applied via CI (`supabase db push`), separate staging vs prod projects. Never edit prod schema by hand.
- **Environments:** local → staging (`staging.natureexplorers.gr`) → prod (`www.natureexplorers.gr`).

---

## 16. Environment variables

```
# Web (Vercel) & shared
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # server/Edge only — never client
NEXT_PUBLIC_SITE_URL=https://www.natureexplorers.gr
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=
RESEND_API_KEY=
FROM_EMAIL=Nature Explorers <noreply@natureexplorers.gr>
NEXT_PUBLIC_GA4_ID=G-JZQZ0VT8XK
NEXT_PUBLIC_MAPTILER_KEY=            # or self-hosted tiles
INDEXNOW_KEY=
MYDATA_API_KEY=                      # Greek e-invoicing provider
SENTRY_DSN=

# Mobile (EAS secrets)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_SITE_URL=
```

---

## 17. Build sequence (mapped to master-plan phases)

Each milestone names the **subagents** to drive it (roster + workflow in §19). Pattern for every feature: a domain agent builds → `compliance-reviewer` checks anything touching bookings/payments/data → `qa-verifier` signs it off against §18.

**Milestone 0 — Foundation (Weeks 1–3)**
- Monorepo, TypeScript strict, tooling, CI. New Supabase project + full schema + RLS (§4). Generate DB types. Migrate data from current DB/CSV exports. `packages/core` + `packages/api` + `packages/i18n` + tokens.
- **Agents:** `supabase-schema` (schema, RLS, RPCs, types) · `qa-verifier` (unit tests for `@nature/core` fee/cancellation math).

**Milestone 1 — Web app + SEO (Weeks 3–8)**
- `apps/web` Next.js: all public routes (§6.1) with SSG/ISR, metadata, JSON-LD, dynamic sitemaps, hreflang, 301s from old URLs, image optimization, CWV budget. Auth + role flow. Discovery, trip, region, refuge, guide, organizer pages. Programmatic region/refuge pages live. **Fix the Base44 meta immediately.**
- **Agents:** `web-builder` (routes, auth, components, i18n) · `seo-engineer` (metadata, JSON-LD, sitemaps, hreflang, CWV) · `qa-verifier` (Lighthouse + rendered-metadata e2e).

**Milestone 2 — Marketplace + Payments (Weeks 6–12)**
- Stripe Connect onboarding; booking flow (Apple Pay + Revolut Pay); 5% application fee; deposit + scheduled balance; cancellation/refund engine; webhooks; reviews on paid bookings; basic in-app messaging; compliance foundation (ΜΗ.Τ.Ε./DAC7/myDATA/consent).
- **Agents:** `payments-engineer` (Connect, fee, deposit/balance, refunds, webhooks) · `supabase-schema` (payment/webhook/cron Edge Functions) · `web-builder` (booking + messaging UI) · `compliance-reviewer` (pre-contract disclosure, ΜΗ.Τ.Ε., DAC7, myDATA) · `qa-verifier` (payment + refund e2e, RLS suite).

**Milestone 3 — Mobile apps + Offline (Weeks 10–18)**
- `apps/mobile` Expo: navigation, offline SQLite queue + MapLibre offline tiles, native GPS/camera/push, Stripe Payment Sheet, deep links. EAS builds; TestFlight + Play beta with real organizers; store listings.
- **Agents:** `mobile-builder` (Expo, offline, maps, native, Payment Sheet) · `payments-engineer` (mobile payment glue) · `qa-verifier` (offline-sync + payment e2e).

**Milestone 4 — Engagement + Premium (Weeks 16–24)**
- Gamification (ranks/badges/streaks), community feed at scale, advanced organizer messaging (Pro), Organizer Pro subscription (web-first), content-engine cadence.
- **Agents:** `web-builder` + `mobile-builder` (feed, gamification, advanced messaging) · `payments-engineer` (Pro subscription via Billing) · `seo-engineer` (species/UGC pages) · `compliance-reviewer` (GDPR on feed + health data).

**Milestone 5 — Scale (Months 6–12+)**
- Viva.com secondary acquirer for Greek card volume; merch; promoted placement; additional locales (IT/ES/DE) + programmatic SEO in a second country.
- **Agents:** `payments-engineer` (Viva.com acquirer) · `seo-engineer` + `web-builder` (new locales + programmatic SEO) · `compliance-reviewer` (new-market law).

---

## 18. Definition of Done (acceptance criteria)

- **SEO:** every public page ships fully-rendered HTML with correct title/description/canonical/hreflang + valid JSON-LD (test via Rich Results); sitemaps auto-generate; Lighthouse SEO ≥ 95, Performance ≥ 90 mobile; no Base44 boilerplate anywhere.
- **Payments:** booking end-to-end with Apple Pay + Revolut Pay; 5% fee lands in the platform account; deposit + scheduled balance works; cancellation issues correct proportional refund + restores slot; all driven by verified webhooks.
- **Mobile:** offline download of a booked trip → view dossier + map with airplane mode on; queued sighting syncs on reconnect; push received; crash-free ≥ 99.5%.
- **Compliance:** unverified organizers cannot publish; DAC7 fields captured; e-invoices issued; WCAG 2.1 AA (axe clean); health data never leaves the organizer scope.
- **Quality:** TypeScript strict passes; unit tests on fee/cancellation math; e2e green on web + mobile; RLS test suite passes.

---

## 19. Developer subagents — how & where to use them

Seven specialized **Claude Code subagents** live in `v2/.claude/agents/`. **Open Claude Code with the `v2/` folder as the working directory** — the agents are auto-discovered. You can either call one explicitly ("use the `payments-engineer` to…") or let Claude auto-delegate based on each agent's `description`. Every agent's instructions cite the exact sections of this plan, so their output stays on-spec.

### The roster

| Agent | Owns | Reach for it when… |
|---|---|---|
| `supabase-schema` | DB migrations, RLS, `SECURITY DEFINER` RPCs, Edge Functions, DB types | adding/altering a table or column, changing access rules, wiring a webhook/cron function |
| `seo-engineer` | metadata, JSON-LD, sitemaps, hreflang, canonical, Core Web Vitals | a public route is added or SEO needs auditing |
| `payments-engineer` | Stripe Connect: charges, 5% fee, deposit/balance, refunds, subscriptions, webhooks | any money / payout / refund logic |
| `web-builder` | Next.js App Router routes, components, forms, auth, i18n | general web feature work that isn't primarily SEO or payments |
| `mobile-builder` | Expo screens, offline-first, maps, native modules, Payment Sheet | any iOS/Android app work |
| `compliance-reviewer` *(read-only)* | Greek/EU law checks | after building booking, payment, onboarding, or data flows — before shipping |
| `qa-verifier` | unit / e2e / RLS tests, Lighthouse & axe budgets | before marking any milestone or feature done |

### The standard loop (use for every feature)

1. **Build** with the relevant domain agent (`supabase-schema` / `web-builder` / `mobile-builder` / `payments-engineer` / `seo-engineer`).
2. **Review** with `compliance-reviewer` whenever the feature touches bookings, payments, onboarding, personal/health data, or accessibility. It reports blockers/warnings by file and **does not edit code** — hand fixes back to the domain agent.
3. **Verify** with `qa-verifier` against the Definition of Done (§18). Never mark done with failing checks.

### Rules of engagement (avoid overlap)

- **Only `supabase-schema` writes SQL migrations or changes RLS.** Other agents *request* schema changes from it rather than editing SQL themselves.
- **Anything a crawler sees:** `seo-engineer` pairs with `web-builder` on every public route.
- **Anything involving cents:** `payments-engineer`; UI consumes `@nature/core` math and never reimplements it.
- **`compliance-reviewer` and `qa-verifier` are gates, not builders** — invoke them at the *end* of a feature, not the start.

### Good invocation examples

- "Use `supabase-schema` to add a `waitlists` table with RLS so only the trip's organizer can read it, then regenerate types."
- "Use `payments-engineer` to implement the scheduled balance-charge Edge Function with its failure/retry path."
- "Use `web-builder` to build `/[locale]/trips/[trip-slug]`, then `seo-engineer` to add the TouristTrip + Offer JSON-LD and metadata."
- "Use `mobile-builder` to implement offline tile download on booking confirmation."
- "Run `compliance-reviewer` over the checkout flow, then `qa-verifier` for the payment + refund e2e."

### Extending the roster

Add agents as `v2/.claude/agents/<name>.md` with `name` / `description` / `tools` / `model` frontmatter (copy an existing file). Good candidates: `data-migrator` (legacy Supabase/CSV → new schema), `design-system` (tokens/components), `content-seo` (bilingual blog + programmatic copy).

---

### Reference
- Product/strategy: `NatureExplorers_v2_Master_Plan.md`
- Risks/positioning: `NatureExplorers_v2_SWOT_Analysis.md`
- Current data model: `migration/data/*.csv`, `src/api/db.js`
- Current brand tokens: `tailwind.config.js`
