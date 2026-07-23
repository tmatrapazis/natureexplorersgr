# Nature Explorers v2 — Master Plan
### The blueprint to become Europe's #1 nature & hiking platform

**Prepared for:** Tasos / Nature Explorers (natureexplorers.gr)
**Date:** 22 July 2026
**Scope:** Competitive research · Product & UX · SEO · iOS/Android development · Freemium + Premium monetization · Payment integration

**Brand system used throughout:** Deep Forest Green `#0c281c` (primary) · Parchment/Sand `#f0e3c7` (background/accent) · Century Gothic typography · high-contrast "Organic-Modern" design legible in outdoor glare.

---

## 1. Executive Summary

Nature Explorers is a bilingual (EN/EL) marketplace connecting three audiences — **visitors, hikers, and organizers/guides** — for discovering and booking hiking trips across Greece. The v1 prototype (built on Base44, now migrating to a React + Vite + Supabase stack) already has the right structural bones: trips, a calendar, guide and organizer profiles, a Greek refuges directory, and a booking lifecycle.

The opportunity is large and under-served. The two named competitors reveal a clear gap:

- **Xtreme Greece** is a broad *adventure-activities directory* (land/water/air/snow/off-road) — licensed by the Greek Ministry of Tourism, with map view, reviews, favorites, and a cart. It is wide but shallow on hiking, and its UX is dated (a legacy CMS).
- **Pame Vouno** is a *WordPress/WooCommerce* hiking-trips shop bolted onto a merch store and blog. Simple booking, decent SEO content, but no real platform, no app, no community, no offline capability.

**Neither competitor owns the three things that win this category: (1) a genuinely mobile, offline-first field experience, (2) a two-sided marketplace that makes organizers successful, and (3) a content/SEO engine that captures every "hiking + place" search in Greece.** That is exactly where Nature Explorers should plant its flag.

This plan lays out how to get there: a redesigned Organic-Modern product, an offline-first Capacitor app for iOS and Android that shares one codebase with the web, a programmatic-SEO content engine, a low-friction business model where hikers book for free (paying only a small 5% service fee) while organizers list free and upgrade to Premium to scale, and a payment stack built on **Stripe Connect** (with **Viva.com** as an optional low-cost Greek acquirer) supporting **Apple Pay and Revolut Pay** on desktop and mobile at the lowest realistic fees.

**North-star goal:** By end of 2027, be the default app a Greek hiker opens to find, book, and navigate a trip — and the platform every Greek nature organizer builds their business on — then replicate the model market-by-market across Southern Europe.

---

## 2. Competitive Landscape

### 2.1 The two named competitors

| Dimension | **Xtreme Greece** | **Pame Vouno** | **Nature Explorers (target)** |
|---|---|---|---|
| Core model | Adventure-activity directory + booking cart | WooCommerce trip shop + merch + blog | Two-sided hiking marketplace + field app |
| Category focus | Very broad (30+ activity types) | Hiking day/multi-day trips | Hiking & nature, deep not wide |
| Tech | Legacy CMS (NetPlanet iCMS) | WordPress + Elementor + WooCommerce | React + Vite + Supabase (modern SPA → native) |
| Mobile app | None (responsive web only) | None (responsive web only) | **iOS + Android, offline-first** |
| Booking | Cart, request-to-book | WooCommerce checkout | Tiered slots, real-time availability, instant confirm |
| Community / UGC | Reviews only | Blog + newsletter | Feed, sightings, badges, reviews, guide profiles |
| Offline use | No | No | **Yes — maps + submissions cached** |
| Trust signals | Ministry of Tourism licence (MH.T.E.) | Refund/cancellation policies | Verified organizers + licence display + reviews |
| Monetization | Commission + business listings + events | Trip sales + merch | **5% booking service fee + organizer Premium + merch** |
| SEO strength | Broad activity/location URLs, EOT authority | Good keyword-rich blog, WP SEO | **Programmatic trip/place/refuge pages + content engine** |
| Languages | EL / EN | EL only | **EL / EN (then IT, ES, DE)** |

**Read-through:**
- Xtreme Greece's advantage is *breadth + official licence authority*. Its weakness is an aging UX, thin hiking depth, and zero mobile/offline. We beat it by being the specialist that hikers actually prefer, with a real app.
- Pame Vouno's advantage is *content/SEO discipline and a warm brand*. Its weakness is that it's a single operator's shop, not a platform — it cannot scale supply or offer discovery across many organizers. We beat it by being the platform *many* Pame-Vouno-style organizers list on.

### 2.2 The wider field (who we're really up against)

To be "the best in Europe" we benchmark beyond Greece:

- **AllTrails** — the global gorilla for trail discovery + navigation (freemium: AllTrails+ ~€36/yr). Strengths: trail database, offline maps, GPS. Weakness: it is *not* a booking marketplace for guided trips and has weak local-organizer economics.
- **Komoot** — route planning + offline nav, region-pack monetization. Same gap: not a guided-trip marketplace.
- **Explore-Share / Manawa / Bókun / RegioDo** — guided-adventure marketplaces / booking engines. Strong on booking, weak on the *field/offline/community* layer and weak on Greek hyper-local supply.
- **Wikiloc / Outdooractive** — UGC trail + POI databases with strong SEO.

**Strategic wedge:** No single player combines **(a) AllTrails-grade offline field navigation**, **(b) a Manawa-grade guided-trip marketplace**, and **(c) a hyper-local Greek supply base with programmatic SEO**. Nature Explorers can be the first to fuse all three — starting in Greece, where it can win supply density fast, then export the playbook.

### 2.3 Positioning statement

> **Nature Explorers is the offline-first platform where you discover, book, and safely navigate guided nature experiences across Greece — and where local guides build real businesses.** For explorers, it replaces five apps (discovery, booking, maps, logbook, community) with one. For organizers, it replaces spreadsheets, DMs, and payment chasing with a professional back office.

---

## 3. Product & UX Strategy (v2 redesign)

Design language: **Organic-Modern** — deep forest green `#0c281c` as the anchor, parchment `#f0e3c7` as canvas, generous whitespace, large legible Century Gothic type, and high-contrast controls that survive direct sunlight. Every UX decision below is justified by *how outdoor users actually behave*.

### 3.1 Navigation

- **Mobile:** a five-item **bottom-tab bar** — `Discover · Map · (＋ Log a Sighting) · Trips · Profile`. UX logic: outdoor users operate one-handed, often with gloves or cold fingers; thumb-reachable tabs and a prominent center action beat buried menus. Tabs persist offline.
- **Web:** a **persistent slim header** (logo left, primary nav center, language + auth right) with a sticky sub-filter bar on discovery pages. UX logic: desktop users are in *planning* mode — they want filters, comparison, and map side-by-side, not a hamburger.

### 3.2 Offline-first mechanics (the killer feature)

Explorers lose signal exactly when they need the product most. Offline-first is not a nice-to-have; it is the moat.

- **Map tiles cached** for the booked trip's region (vector tiles via MapLibre; pre-download on booking confirmation over Wi-Fi).
- **Trip dossier cached**: route GPX, meeting point, gear list, guide contact, emergency numbers, weather snapshot.
- **Sighting & booking submissions queue locally** (SQLite on device) and **sync when connectivity returns** — the user never loses a photo or a booking action in a canyon.
- **"Download for offline" toggle** on every trip and refuge page, with a clear storage indicator.
- UX logic: parity with AllTrails+/Komoot offline — table stakes for credibility with serious hikers.

### 3.3 Gamification (retention engine)

Outdoor motivation is intrinsic; good gamification *amplifies* it without cheapening it.

- **Explorer Ranks** — Seedling → Wanderer → Trailblazer → Summiteer → Guardian, earned by verified completed hikes, distance, and elevation. Ranks unlock perks (early access to popular trips, profile flair).
- **Biodiversity Badges** — earned by logging verified sightings (species, refuges visited, peaks bagged, regions explored). Ties directly to the "explorer" identity and feeds the community feed.
- **Streak counter** — consecutive weeks/months with at least one nature outing; gentle, health-positive framing (never guilt-based).
- **Leaderboards, opt-in and local** — "Top explorers in Epirus this month," which also drives regional SEO landing pages.
- UX logic: badges and ranks create *sunk-identity* — users stay because their history and status live here.

### 3.4 Community feed (network effect)

- High-performance, **image-heavy feed** of local discoveries (sightings, trip photos, mini trip reports), infinite-scroll, aggressively lazy-loaded and CDN-served (Supabase Storage + image transforms).
- Follow guides, regions, and species. Every feed post is **SEO-indexable** as a lightweight UGC page → compounding content.
- Post-hike prompt: "Share your discovery" → one-tap from the cached trip dossier. UX logic: the moment after a hike is peak motivation; capture it.

### 3.5 Trust & safety (marketplace credibility)

- **Verified organizer** badges (display Ministry of Tourism / MH.T.E. licence like Xtreme Greece does — critical trust parity).
- Transparent reviews tied to *completed, paid bookings only* (no fake reviews).
- Difficulty ratings, required-fitness, gear lists, and a clear cancellation policy on every trip (Pame Vouno does this well; match and exceed).
- In-app emergency card (nearest refuge, EU emergency 112, guide phone) available offline.

### 3.6 In-app messaging (hiker ↔ organizer)

Keep pre-trip and post-booking communication on-platform — it drives conversion (answering "is this beginner-friendly?", "what gear?") and reduces off-platform disintermediation. Built on Supabase Realtime with push + email notifications; message threads scoped per booking/inquiry with RLS. Tiered by plan (see §7.2): **basic 1:1 threads are free for all** (and always free for hikers — messaging about a booking is never paywalled and is safety-relevant), while **advanced tools are Premium** (broadcast to all participants of a trip, saved templates/canned replies, automated messages, a unified cross-trip inbox, and team seats). Includes abuse-reporting/moderation for Trust & Safety.

---

## 4. SEO Strategy — capture every "hiking + place" search in Greece

SEO is the single highest-ROI growth channel for this category, and it is where Nature Explorers can systematically out-build both competitors. There is one urgent problem to fix first.

### 4.1 Fix the critical issue immediately

The live site currently serves a **generic auto-generated meta description**: *"NatureExplorers manages 5 data types including hiking trips. Helps you organize, track, and share your work in 1 place…"* — a Base44 boilerplate string that describes a productivity tool, not a hiking marketplace. This actively repels clicks and confuses Google about what the site is.

**Action (week 1):** replace every title/description with intent-matched, bilingual copy, e.g.
`title:` **"Οργανωμένες Πεζοπορίες & Εκδρομές στη Φύση | Nature Explorers"**
`description:` **"Ανακάλυψε και κλείσε οργανωμένες πεζοπορίες σε όλη την Ελλάδα με πιστοποιημένους οδηγούς. Χάρτες, καταφύγια, κριτικές — και offline πλοήγηση."**

### 4.2 Technical SEO (SPA is the risk — fix the rendering)

A client-rendered React SPA is an SEO liability if Google gets an empty shell. Non-negotiables:

- **Server-side rendering or pre-rendering** for all public pages (trips, guides, organizers, refuges, regions, blog). Options: migrate discovery routes to a framework with SSR/SSG (Next.js/Astro) *or* add a pre-render/edge-SSR layer in front of the Vite SPA. This is the biggest technical SEO decision — do it early.
- **Clean, human, keyword-rich URLs** — `/pezoporia/olympos-mytikas` not `/tripdetails?id=…`. (Both competitors already do readable URLs; the current app uses `/tripdetails` query-style routes — fix in the routing migration.)
- **`hreflang`** on every page for `el` / `en` (and future locales) to avoid duplicate-content dilution across languages.
- **Core Web Vitals** budget: LCP < 2.5s on 4G, image lazy-loading, responsive `srcset`, AVIF/WebP via Supabase transforms, route-level code-splitting (already using `pages.lazy.js`).
- **XML sitemaps** auto-generated per entity type (trips, guides, refuges, regions) + submitted to Google/Bing. Dynamic `lastmod`.
- **robots + canonical** discipline (the site already sets canonicals — extend to every entity).

### 4.3 Structured data (rich results = higher CTR)

Add JSON-LD to every entity type:

- `Event` / `TouristTrip` + `Offer` (price, availability, dates) on trip pages → eligible for rich pricing snippets.
- `Product` + `AggregateRating` (reviews) → star ratings in SERPs.
- `LocalBusiness` / `Organization` on organizer profiles.
- `BreadcrumbList`, `FAQPage` (reuse Pame-Vouno-style FAQs — they already rank), `ImageObject`.
- `TouristAttraction` on refuge and region pages.

### 4.4 Programmatic SEO — the scalable moat

This is how we out-scale both competitors. Generate high-quality, indexable landing pages from structured data:

- **Region pages** — `/regions/zagori`, `/regions/olympos`, `/regions/parnitha`… each with trips, refuges, guides, best-season, difficulty spread, a map, and unique editorial intro. (Captures "πεζοπορία Ζαγόρι", "hiking Olympus".)
- **Trip-type × place matrices** — "day hikes near Athens", "multi-day treks in Epirus", "family-friendly trails in Halkidiki."
- **Refuge pages** — you already have a Greek refuges directory; each refuge is a *unique, link-worthy, high-intent* page (few competitors have this — a genuine content edge). Add elevation, access trails, contact, nearby trips.
- **Guide/organizer profile pages** — indexable, rich, review-bearing (builds branded + long-tail queries).
- **Species/sighting pages** from the community feed — long-tail "where to see [species] in Greece."

Each page must have *genuine unique value* (real data, real photos, real reviews) — never thin templated spam, which Google now penalizes hard.

### 4.5 Content engine (topical authority)

- **Bilingual blog / guides hub** targeting the full funnel: "τι να πάρω μαζί μου για πεζοπορία" (gear), "καλύτερες πεζοπορίες φθινόπωρο", "Οδηγός για αρχάριους". Pame Vouno already ranks with exactly this — we out-produce and out-structure them.
- **Interlink** every blog post to relevant trips/regions/refuges (internal link equity to money pages).
- **Seasonal calendars** ("best hikes in Greece in October") refreshed yearly — evergreen traffic.
- **Optimize for AI/LLM answer engines** (AEO): clear headings, FAQ schema, concise factual answers — increasingly a discovery surface.

### 4.6 Local & off-site SEO

- **Google Business Profile** for the brand; encourage verified organizers to link their profiles.
- **Backlinks** from Greek outdoor clubs, EOS (Greek Alpine Club) chapters, tourism boards, refuge operators, and local municipality tourism pages.
- **Reviews velocity** — reviews are both a ranking and a conversion signal; the post-hike prompt (3.4) feeds this.

---

## 5. Mobile Development Plan (iOS + Android)

### 5.1 Recommended approach: **Capacitor** (one codebase, web + iOS + Android)

Given the existing React + Vite + Tailwind + shadcn stack, **Capacitor** is the highest-leverage choice:

- **Reuses the existing web codebase** — the React app becomes the app; business logic, API client, TanStack Query, Supabase client, translations, and design system transfer directly. One team, one codebase powers **web + PWA + iOS + Android**.
- **Native access where it matters** via Capacitor plugins: Geolocation/GPS, Camera (sighting photos), Filesystem + SQLite (offline cache), Push Notifications, Background Geolocation, Apple/Google sign-in, and native payment sheets (Apple Pay / Google Pay).
- **Trade-off acknowledged:** for extremely map/GPU-heavy, continuous-tracking navigation, React Native renders natively and can squeeze more performance. Mitigation: use **MapLibre Native** via a Capacitor plugin for the map/navigation surface so the heaviest component is native even inside Capacitor. If, post-launch, live turn-by-turn tracking proves too heavy, isolate *only* the navigation screen as a native module — not the whole app.

**Why not React Native:** it would force a UI rewrite and a second codebase, roughly doubling build and maintenance cost for a small team, with benefits that only materialize for hardcore continuous-nav workloads we can address with MapLibre Native.

**Why not PWA-only:** no App Store / Play Store presence (a major trust + discovery + payments channel), weaker background location and push, and no Apple Pay native sheet. We ship a PWA *too* (free, SEO-friendly, instant), but the store apps are essential.

> **Note (v2 build decision):** for a full greenfield restructure prioritizing *both* best-in-class SEO and best native, the Development Plan supersedes this with a **Next.js (web) + Expo/React Native (mobile) monorepo**. Capacitor remains the faster single-codebase alternative. See `NatureExplorers_v2_Development_Plan.md` §1.

### 5.2 Offline-first architecture

```
Device (Capacitor)
├── UI: React + Tailwind (shared with web)
├── State/cache: TanStack Query + persisted cache
├── Local DB: SQLite (bookings queue, trip dossiers, sightings queue)
├── Map: MapLibre + pre-downloaded vector tiles (per booked region)
├── Media: Filesystem (cached trip images, user sighting photos)
└── Sync engine: on reconnect → flush queues to Supabase, resolve conflicts
        │
        ▼
Supabase (Postgres + Auth + Storage + Edge Functions + Realtime)
```

- **Conflict policy:** bookings are server-authoritative (slot counts via the existing `SECURITY DEFINER` RPC); sightings are append-only (no conflicts); profile edits use last-write-wins with a synced-at timestamp.
- **Pre-download trigger:** on booking confirmation over Wi-Fi, silently cache the region's tiles + dossier.

### 5.3 App Store & Play Store execution

- **Bilingual store listings** (EL/EN) with ASO-optimized titles/keywords ("hiking Greece", "πεζοπορία", "trails", "refuges", "nature").
- **Screenshots** in-brand (`#0c281c`/`#f0e3c7`), showing map, trip, badges, offline.
- **Privacy nutrition labels** (location, photos) — declare accurately; location is "used for app functionality," not tracking.
- **Deep links / universal links** so SEO web pages open in-app when installed (share the URL scheme with the web routes).
- **Phased rollout:** TestFlight + Play Internal Testing → closed beta with real organizers/hikers → public.

### 5.4 Payment implications on mobile (see §7)

- **Trip bookings = real-world services → Apple/Google take 0%.** Use Stripe's in-app payment sheet with **Apple Pay** and **Google Pay** freely. This is confirmed by Apple's guidelines: physical goods and real-world services must *not* use IAP.
- **Digital subscriptions (Premium) on iOS** are the one place Apple's commission (15% Small Business / 30% standard) *can* apply. Strategy in §7.5.

---

## 6. Technical Architecture & Migration

- **Backend:** Supabase — Postgres (RLS-enforced), Auth, Storage (feed images + trip media with on-the-fly transforms), Edge Functions (email via Resend, payment webhooks, sitemap generation), Realtime (organizer booking dashboards).
- **Frontend:** React 18 + Vite 6, TanStack Query v5, React Router v7, Tailwind + shadcn/ui, react-leaflet/MapLibre, Framer Motion. Wrap with **Capacitor** for native.
- **Rendering:** introduce SSR/SSG (or edge pre-render) for public/SEO routes — the most important architectural addition for §4.
- **Migration off Base44:** move from the Base44-hosted prototype to the owned Supabase + Vite stack (already underway per repo). Preserve entity model (trips, guides, organizers, refuges, bookings), re-slug URLs, and 301-redirect old paths to new SEO URLs.
- **Environments:** `localhost` → staging → `www.natureexplorers.gr` (host must rewrite unmatched routes to `index.html` for the SPA, and serve pre-rendered HTML to crawlers).
- **Analytics:** GA4 (`G-JZQZ0VT8XK`, prod-only guard already in place) + privacy-respecting product analytics for funnels.

---

## 7. Monetization — free to join, pay only when it pays off

The platform makes money **three ways**: (1) a flat **5% platform service fee** on every booking (paid by the hiker, buyer-side), (2) an **organizer Premium subscription** for scale + professional tools, and (3) ancillary (merch, promoted placement, affiliate gear). Hikers never choose a plan — they simply book, with a small, transparent service fee at checkout. Organizers list for free and keep effectively **100% of their listed price**. Revenue grows with booking volume *and* with organizer success.

### 7.1 Hikers — no plan, no friction

Hikers are **always free**. There is no subscription and no plan to choose — a deliberate decision to strip every gram of friction from the booking funnel. Discovery, community feed, sightings, ranks/badges, maps, **in-app messaging with organizers about a booking**, and **offline trip dossiers + navigation are free for all hikers** (this is core value that drives installs and word-of-mouth; we never paywall safety-relevant features).

The only charge a hiker ever sees is a **5% service fee** added transparently at checkout (see §7.3). A hiker Premium tier (e.g. advanced trip-planning tools) remains a *future* lever once the base is large — intentionally out of scope for launch.

### 7.2 Organizers — free to start, Premium to scale

Every organizer lists for free and **can take real bookings from day one** — the booking/reservation system is available on **both** tiers. The free tier is capped at **3 active events** (published + future-dated); Premium unlocks unlimited events plus the full professional back office.

| | **Guide (Free)** | **Pro (Premium)** |
|---|---|---|
| List events | ✅ up to **3 active** (published + future) | ✅ **Unlimited** |
| Take bookings & reservations | ✅ | ✅ |
| Keep 100% of listed price* | ✅ | ✅ |
| Basic booking management | ✅ | ✅ |
| **In-app messaging** with hikers | ✅ Basic (reply to booking/inquiry threads) | ✅ Advanced (broadcast, templates, automations, unified cross-trip inbox, team seats) |
| **Full reservation-management dashboard** (cross-trip) | — | ✅ (already built: `ManageBookings`) |
| Waitlists & capacity tools | — | ✅ |
| Revenue analytics + KPIs | — | ✅ (already built: `OrganizerAnalytics`) |
| Verified badge + priority placement | Verified badge | ✅ + priority placement |
| Promoted trips (calendar/feed) | — | ✅ (already have `is_promoted_calendar`) |
| Automated email notifications | Basic | ✅ Full suite (already built) |
| Price | €0 | **€19.99/mo or €179/yr** |

\* Organizers keep 100% of their listed price; the 5% fee is paid *on top* by the hiker. (Payment processing is passed to the organizer's connected account — see §8.)

*Logic:* letting **free organizers take bookings too** means the platform earns its 5% on booking volume from **day one**, not only from paying subscribers — this maximizes GMV and solves the marketplace cold-start problem. The **3-active-event cap** is the natural upgrade pressure: a serious, growing organizer hits it fast and upgrades for unlimited events plus the management tools they now need. Two revenue lines, both fed by the same growing supply base.

### 7.3 The 5% platform service fee (buyer-side, founding rate)

- A **flat 5% service fee** is added to the hiker's total at checkout — clearly labelled "Service fee." The organizer's advertised price is exactly what they receive.
- **Founding rate strategy:** 5% launches as a *founding rate*, held through the growth phase to stay maximally attractive while building liquidity. It is deliberately kept low because at startup stage the goal is bookings, reviews, and habit — not fee revenue. Once supply density and network effects exist, **new** organizer cohorts move to **8–10%**, with **early adopters grandfathered at 5%** — turning the low fee into a supply-acquisition and retention weapon. (For reference, tour OTAs like Viator/GetYourGuide take **20–30% out of the operator's pocket**; our organizers keep ~100%.)
- **Guardrails:** a **minimum fee** ("5% or €1.50, whichever is higher") protects margin on cheap day-hikes; a **cap/taper on high-value multi-day trips** keeps the fee from becoming a jarring line on a €500 trek (mirroring Airbnb's declining-% guest fee).
- Collected automatically via **Stripe Connect** as an `application_fee` on a **single split payment** — no invoicing, no chasing (mechanics in §8).

### 7.4 Ancillary revenue

- **Merch** (Pame Vouno proves demand — t-shirts, fleece, thermos, keychains) via the same Stripe checkout.
- **Promoted placement** for organizers (already have the promoted-calendar mechanic).
- **Affiliate gear** links in blog/gear guides (Decathlon/local shops).
- **Regional tourism partnerships** (municipalities paying to feature their region pages).

### 7.5 App Store commission strategy (protect the margins)

- **Bookings & merch = real-world/physical → 0% to Apple/Google.** All booking revenue flows through Stripe untouched. This is the bulk of GMV and is fully protected.
- **Premium subscriptions on iOS** are the exception. Options, in priority order:
  1. **Sell Premium on the web** (and via email/PWA), then unlock it in the app on login — the app simply reflects entitlement. Fully avoids Apple's cut; permitted as long as the app doesn't *link out to* purchase from within iOS UI in a non-compliant way.
  2. **Use the EU external-purchase / link-out entitlement** (available under the Digital Markets Act) to direct EU users to web checkout.
  3. Where IAP is unavoidable, enroll in the **App Store Small Business Program (15%)** while under $1M/yr proceeds.
- Net effect: keep effectively ~0% platform-store tax on the vast majority of revenue.

---

## 8. Payments, Deposits, Cancellations & Legal Compliance

### 8.1 Requirements recap

Lowest realistic fees · **Apple Pay** · **Revolut Pay** · works on **web + iOS + Android** · supports a **marketplace** (pay organizers, take commission) · available in **Greece/EEA**.

### 8.2 Recommendation: **Stripe (with Stripe Connect) as primary**, **Viva.com as optional low-cost Greek acquirer**

**Why Stripe is the primary choice:**

- **Only processor confirmed to natively support BOTH Apple Pay AND Revolut Pay** across web and mobile SDKs — the exact combination requested. Revolut Pay is live for UK/EEA (incl. Greece); Apple Pay carries **no extra fee** beyond normal card pricing.
- **Stripe Connect** is purpose-built for marketplaces: automatic split payments, `application_fee` for commission, and payouts to organizers in 35+ countries — this powers §7.3 with zero manual reconciliation.
- **Best-in-class SDKs** for React (web), and native iOS/Android payment sheets via Capacitor — one integration, all surfaces.
- Strong SCA/3-D Secure, fraud (Radar), tax, and subscription (Billing) tooling for Premium.

**Indicative Stripe pricing (EEA cards):** ~**1.5% + €0.25** for standard EEA consumer cards; UK/international and commercial cards higher. Apple Pay = same as card (no surcharge). Revolut Pay billed as its own method (typically competitive with cards). Connect adds a small payout/account fee.

**Why Viva.com as an optional secondary acquirer:**

- **Greek-founded, EU-licensed**, with **interchange++ pricing that can beat Stripe on domestic Greek card volume** (interchange as low as ~0.2–0.3% + small fixed fee), Apple Pay supported, plus **Tap to Pay on iPhone** (useful if guides ever take in-person payment at a trailhead).
- **Caveat:** Revolut Pay support and Connect-style marketplace splitting are less clear-cut than Stripe's. So the pragmatic architecture is **Stripe as the marketplace/rails + Apple Pay + Revolut Pay engine**, with **Viva.com evaluated as a lower-cost card acquirer** once Greek volume is high enough that fee savings justify a second integration.

### 8.3 Processor comparison

| | **Stripe (+ Connect)** | **Viva.com** | **Mollie** | **Adyen** |
|---|---|---|---|---|
| Apple Pay | ✅ (no surcharge) | ✅ | ✅ | ✅ |
| **Revolut Pay** | ✅ **native** | ⚠️ unclear | ✅ | ⚠️ |
| Marketplace split payouts | ✅ Connect (best-in-class) | ⚠️ limited | ✅ Connect | ✅ (enterprise) |
| EEA card fee (indicative) | ~1.5% + €0.25 | **interchange++ (~0.2–0.9%)** lowest domestic | ~1.8% + €0.25 blended | interchange++ + ~€0.10 |
| Web + iOS + Android SDKs | ✅ excellent | ✅ good | ✅ good | ✅ enterprise |
| Greek entity / local support | ✅ | ✅ **local** | ✅ | ✅ |
| Best for | **All-round marketplace + the exact Apple Pay + Revolut Pay combo** | Cheapest Greek card volume | Good EU alternative | High-volume enterprise |

**Verdict:** Launch on **Stripe Connect** (fastest path to the required Apple Pay + Revolut Pay + marketplace combo across all platforms). Layer in **Viva.com** as a cost-optimization for domestic Greek card traffic once monthly volume makes the fee delta material. Keep **Mollie** as the fallback if a second Revolut-Pay-capable Connect provider is ever needed.

### 8.4 Integration checklist

- Stripe Connect (Express accounts for organizers → fast KYC onboarding).
- **Charge type: direct charge on the organizer's connected account** with a **5% `application_fee`** to the platform — a *single* card charge that Connect auto-splits (money settles to the organizer, platform keeps 5%). Organizer is merchant of record (cleaner liability + VAT position for the platform), which matches the intent of "money goes directly to the organizer." Avoids two literal charges and their doubled fixed fees.
- **Stripe processing (~1.5% + €0.25) is charged to the organizer's connected account**, so the platform's 5% stays clean margin. Organizers still net ~98% — far above the ~70–80% they'd keep on an OTA.
- Enforce the **minimum fee** ("5% or €1.50") and **high-value cap/taper** from §7.3 in the checkout fee calculation.
- Payment methods enabled: cards, **Apple Pay**, **Google Pay**, **Revolut Pay**, SEPA (for subscriptions).
- **Webhooks** (Supabase Edge Function) → update booking status `pending → confirmed → paid`, trigger existing emails, sync slot counts.
- **Refund policy:** encoded by the cancellation engine in §8.6 (fee follows the refund proportionally).
- **Stripe Billing** for the organizer Premium subscription (web-first per §7.5), with entitlement synced to `organizers.plan`. (Hikers have no plan.)
- PCI: use Stripe Elements / native Payment Sheet — no raw card data touches our servers.
- Full **SCA / 3-D Secure** compliance for EU.

### 8.5 Deposit + balance model (how Greek organizers actually operate)

Real Greek organizers (Trekkers, YouthTrekkin, and most others) **do not take one upfront charge** — they reserve with a **deposit (προκαταβολή)** and collect the **balance by a deadline before departure**, today via manual bank transfer. The platform should support and *automate* this. Per trip, the organizer chooses:

- **Pay in full at booking** — simple day hikes.
- **Deposit now + balance auto-charged X days before departure** — the multi-day norm.

**Mechanism (Stripe):** at booking, charge the deposit **and** save the card with a mandate (SetupIntent); on the settlement date the platform **auto-charges the balance off-session**. This is the correct design because Stripe's authorize-and-hold window is only ~7 days — you cannot "hold" a card for the weeks these trips need, so a *scheduled second charge* is required. This automates the single most painful manual task organizers have today (chasing balances) — a headline Premium selling point.

- The **5% platform fee is split proportionally** across the deposit and balance charges (`application_fee_amount` on each) so refunds stay clean.
- **Failed balance charge** → auto-retry, notify the hiker (SCA step-up if the bank requires re-authentication), and after a grace window release the slot per the organizer's rule.

### 8.6 Cancellation & refund engine (organizer-configurable, law-aligned)

**Legal basis (see §8.7):** dated leisure/tourism services are **exempt from the EU 14-day right of withdrawal** (Consumer Rights Directive 2011/83/EU, Art. 16(l), transposed in Greek Law 2251/1994). This means **time-tiered, non-refundable-after-cutoff policies are lawful and enforceable** — provided the terms are disclosed clearly *before* payment. The engine encodes this.

Each organizer selects a policy per trip from presets modelled on real market norms (or sets custom cutoffs). Defaults: **Day-trip standard** and **Multi-day standard**.

| Preset | Refund tiers (before departure) | Modelled on |
|---|---|---|
| **Day-trip standard** (default, day hikes) | ≥7 days → 100% · <7 days / no-show → 0% | Trekkers |
| **Multi-day standard** (default, multi-day) | ≥15 days → 100% · <15 days / no-show → 0% | Trekkers |
| **Graduated** | >15 days → 100% · 8–14 days → 50% · ≤7 days → 0% | YouthTrekkin |
| **Flexible** (drives bookings) | full refund up to 48h before | — |

- **The deposit is the at-risk amount.** If a hiker cancels before the balance is charged, they only ever risk the deposit — the balance was never taken. Payment schedule and refund tiers are the *same* mechanism, exactly how these organizers already think.
- **Execution — automated self-service by default:** the hiker taps "Cancel," the app shows the exact refund per policy + days-to-departure, confirms, and the **platform executes the refund via Stripe automatically** and restores the slot. No off-platform messaging; the hiker never touches money.
- **Exception path — request → organizer approval:** for out-of-policy cases (illness, injury, emergency) the hiker submits a request with a reason; the organizer approves/declines; approval triggers the platform-executed refund.
- **Substitution / name change:** offer "transfer my spot to someone else" as an alternative to cancelling (Trekkers already allows this with ≥2 business days' notice) — no refund, organizer keeps revenue, platform keeps its fee.
- **Organizer-initiated cancellation** (weather, too few participants, force majeure) → **full refund incl. the 5% fee**, or a free reschedule/transfer. For multi-day packages, documented non-recoverable costs (pre-paid lodging/transport) may be deducted where the law allows.
- **Fee-follows-refund (proportional):** 100% refund → full 5% returned; 50% → half returned; 0% (late cancel) → retained. Note: **Stripe keeps its processing fee on refunds**, so every refund has a small real cost — covered by an optional small non-refundable booking fee, which also discourages abuse.

### 8.7 Legal & regulatory compliance (Greece / EU)

> **Not legal advice.** This section flags the obligations to design for; before launch, engage a Greek lawyer and a Greek accountant/tax advisor to validate the T&Cs, invoicing, and licensing setup.

- **(a) Consumer withdrawal exemption — validates the refund model.** Because dated leisure services are exempt from the 14-day cooling-off (CRD Art. 16(l) / Law 2251/1994), the tiered policies above are enforceable. *Condition:* pre-contractual transparency — the **total price including the 5% service fee and the full cancellation terms must be shown before the hiker pays** (Greek consumer law / CRD information duties).
- **(b) Package Travel (Directive (EU) 2015/2302, transposed by Greek Presidential Decree 7/2018).** A multi-day trip combining **≥2 travel services** (e.g. transport + accommodation) at an inclusive price is legally a **"package,"** which triggers mandatory organizer duties: **insolvency/bond protection, organizer liability for the whole package, and statutory refund timelines** (e.g. refund within 14 days if the organizer cancels; free termination for "unavoidable and extraordinary circumstances"). **The platform must remain a technology + payment *intermediary* and must not become the "organizer/retailer"** (which would import that liability) — enforced through clear T&Cs. Organizers offering packages must hold the required insolvency protection.
- **(c) Greek tourism licensing (ΜΗ.Τ.Ε.).** Selling organized excursions requires being a **licensed tourism enterprise / travel office** registered in the ΜΗ.Τ.Ε. (with the state guarantee/security deposit), and guiding is a regulated activity. The platform must **verify each organizer's ΜΗ.Τ.Ε. / Γ.Ε.ΜΗ. registration at onboarding** (this is the legal backbone of the "verified organizer" badge) and require organizers to **warrant** they hold all licenses and qualified guides. It doubles as a trust/SEO asset — display the ΜΗ.Τ.Ε. number like Trekkers and Xtreme Greece do.
- **(d) Payments licensing (PSD2 → PSD3).** By routing **all** funds through **Stripe Connect** (Stripe Technology Europe Ltd is an EMI licensed by the Central Bank of Ireland), the platform **never possesses or controls user funds** and therefore **does not need its own payment-institution / EMI licence**. Rule to hold firm: money must never rest in a platform-controlled account — especially as **PSD3 is tightening the commercial-agent exemption**. **Strong Customer Authentication (SCA / 3-D Secure)** is mandatory on payments. Note: **surcharging consumer cards is prohibited in the EU** — the 5% is presented as a **service/booking fee for the platform's service, not a card fee**, and disclosed upfront, which keeps it compliant.
- **(e) DAC7 (Directive (EU) 2021/514).** As a platform facilitating paid services, Nature Explorers is a **"Reporting Platform Operator"**: it must perform **due-diligence / KYC on organizers** (collect name, TIN/VAT, address, ID) and **report each organizer's income annually to AADE by 31 January** (a nil report is required even if there are no reportable sellers). Build this data collection into organizer onboarding from day one.
- **(f) Greek tax & e-invoicing (myDATA).** Greece's **mandatory B2B e-invoicing via myDATA** rolls out in 2026 (large taxpayers from 2 March 2026; all VAT-registered businesses from 1 October 2026), with steep penalties (up to 50% of the transaction VAT). The platform must issue **myDATA-compliant e-invoices for its 5% commission and Premium subscriptions**; **VAT (standard 24%)** applies to the platform's service, with **B2B reverse-charge** for organizers in other EU states. Organizers issue their own receipts/invoices to hikers for the trip itself.
- **(g) GDPR / health data.** These trips routinely collect **health/fitness disclosures** (allergies, cardiac issues, etc. — see the Trekkers/YouthTrekkin terms), which are **special-category data**. Minimize collection, set a clear lawful basis and retention limits, and keep medical disclosures accessible only to the specific organizer — never surface them in the community feed or analytics.
- **(h) Accessibility — European Accessibility Act (EAA).** Enforceable since **28 June 2025**; websites, mobile apps, and checkout serving EU consumers must meet **WCAG 2.1 AA** (only micro-enterprises <10 staff & <€2M turnover are exempt). Build accessibility in from day one — it is both a legal duty and aligned with the outdoor-legibility brand goal.

---

## 9. Phased Roadmap

### Phase 0 — Foundation & quick SEO wins (Weeks 1–4)
- Fix all meta titles/descriptions and structured data (kill the Base44 boilerplate).
- Finish migration to owned Supabase + Vite stack; readable SEO URLs + 301s.
- Stand up SSR/pre-render for public routes; generate sitemaps + `hreflang`.
- Ship the Organic-Modern design refresh on web (brand tokens, header, discovery).

### Phase 1 — Marketplace + Payments (Weeks 4–10)
- Stripe Connect: organizer onboarding, booking payments with Apple Pay + Revolut Pay, **5% platform service fee via Connect `application_fee`** (live from this phase), webhooks.
- **Deposit + scheduled-balance** payments; **cancellation/refund engine** with preset policies (§8.5–8.6).
- **Compliance foundation (§8.7):** ΜΗ.Τ.Ε. verification at onboarding, DAC7 seller data capture, myDATA-compliant invoicing, lawyer-reviewed T&Cs positioning the platform as intermediary.
- **Basic in-app messaging** (per-booking hiker↔organizer threads via Supabase Realtime) — supports pre-trip Q&A and booking conversion.
- Verified-organizer flow + licence display; reviews tied to paid bookings.
- Programmatic region + refuge pages live.

### Phase 2 — Mobile apps + Offline (Weeks 8–16)
- Wrap app in Capacitor; SQLite offline queue + MapLibre offline tiles.
- Native GPS, camera sightings, push. TestFlight + Play internal beta with real organizers.
- Store listings (EL/EN), ASO, deep links.

### Phase 3 — Engagement + Premium (Weeks 14–22)
- Gamification (ranks, badges, streaks), community feed at scale.
- Launch Organizer Pro subscription (web-first billing) + entitlements. (Hikers stay free; the 5% fee has been live since Phase 1.)
- **Advanced organizer messaging** (broadcast, templates, automations, unified inbox, team seats) as a Pro feature.
- Content engine cadence (2–4 SEO articles/week, seasonal hubs).

### Phase 4 — Scale & expand (Months 6–12+)
- Viva.com cost-optimization for Greek card volume.
- Merch store; promoted placement; tourism-board partnerships.
- Add locales (IT, ES, DE) and replicate programmatic SEO in a second country.

---

## 10. Success Metrics (KPIs)

- **Supply:** # verified organizers, # active trips, region coverage.
- **Demand:** MAU/WAU, bookings/month, GMV, take-rate revenue.
- **SEO:** organic sessions, indexed programmatic pages, keyword rankings for "πεζοπορία + [region]", rich-result impressions, organic → booking conversion.
- **Mobile:** installs, offline-download rate, D1/D7/D30 retention, crash-free rate.
- **Monetization:** organizer Free→Pro conversion (target 20–30% of active organizers), 5% service-fee revenue as % of GMV, % of organizers hitting the 3-event cap, ARPU, churn, blended payment-fee %.
- **Engagement:** sightings/user, feed DAU, badge unlocks, streak retention.

---

## 11. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| SPA renders as empty shell to Google | SSR/pre-render public routes **before** scaling SEO (Phase 0). |
| Cold-start supply (too few organizers) | Free organizer tier + white-glove onboarding of existing operators (incl. Pame-Vouno-style guides). |
| Apple commission on Premium | Web-first subscription sales + DMA link-out + Small Business Program (§7.5). |
| Offline complexity / battery drain | MapLibre Native for maps; background-location budgeting; download-on-Wi-Fi only. |
| Payment fees eroding margin | Stripe for the required feature combo now; add Viva.com for cheaper Greek volume later. |
| Content thinness penalty | Programmatic pages must carry real data/photos/reviews — never templated filler. |
| Incumbent authority (Xtreme Greece EOT licence) | Display organizer ΜΗ.Τ.Ε. licences prominently for trust parity. |
| **Platform treated as travel "organizer" (Package Travel liability)** | Clear intermediary T&Cs; organizers hold their own licences + insolvency protection (§8.7b). |
| **Unlicensed organizers listing trips** | Mandatory ΜΗ.Τ.Ε./Γ.Ε.ΜΗ. verification at onboarding; warranty clause; remove on lapse (§8.7c). |
| **Needing a payment licence (PSD2/PSD3)** | Route 100% of funds through Stripe Connect; platform never holds funds (§8.7d). |
| **Tax/reporting non-compliance (DAC7, myDATA, VAT)** | Capture seller data at onboarding; myDATA e-invoicing; Greek accountant engaged pre-launch (§8.7e–f). |
| **Mishandling health/special-category data** | Minimize, restrict medical data to the specific organizer, never in feed/analytics (§8.7g). |

---

## 12. The One-Sentence Strategy

**Win Greek hiking supply with a free, professional organizer back office; win hikers with the only app that lets them discover, book, and navigate offline in one place; compound it all with a programmatic-SEO content engine — then export the playbook across Southern Europe.**

---

### Sources
- Xtreme Greece — https://www.xtremegreece.gr/el/activities/
- Pame Vouno — https://pamevouno.com/
- Nature Explorers (current) — https://natureexplorers.gr/
- Stripe — Revolut Pay — https://stripe.com/payment-method/revolut-pay ; Apple Pay — https://docs.stripe.com/apple-pay ; Greece pricing — https://stripe.com/en-gr/pricing
- Viva.com pricing — https://www.viva.com/en-gr/pricing ; Apple Pay — https://developer.viva.com/payment-methods/digital-wallets/apple-pay/
- Mollie — Connect for marketplaces — https://docs.mollie.com/docs/connect-marketplaces-processing-payments ; Apple Pay — https://www.mollie.com/payments/apple-pay
- Stripe vs Adyen vs Mollie fees 2026 — https://www.codelevate.com/blog/mollie-vs-stripe-vs-adyen-psp-comparison-2025
- Apple App Store commission (physical/real-world services 0%) — https://www.forasoft.com/blog/article/how-to-avoid-apple-pay-commission-204 ; Small Business Program 15% — https://www.revenuecat.com/blog/engineering/small-business-program
- Capacitor vs React Native 2026 — https://www.bacancytechnology.com/blog/capacitor-vs-react-native
- Tour OTA commission rates 2026 — https://www.sambahq.com/ota-supplier-guide/ota-commission-rates ; https://www.strathcode.com/blog/ota-commission-costs-tour-operators-2026/

**Competitor & organizer cancellation policies**
- Trekkers — Όροι & Πολιτική Ακυρώσεων — https://trekkers.gr/oroi-proypotheseis/
- YouthTrekkin — Όροι Συμμετοχής & Πολιτική Ακυρώσεων — https://youthtrekkin.gr/terms-participate/

**Legal & regulatory (Greece / EU)**
- Consumer Rights Directive 2011/83/EU — withdrawal-right exemption for dated leisure services (Art. 16(l)) — https://eur-lex.europa.eu/EN/legal-content/summary/consumer-information-right-of-withdrawal-and-other-consumer-rights.html
- Greek Consumer Protection Law 2251/1994 — https://www.synigoroskatanaloti.gr/en/legislation
- Package Travel Directive (EU) 2015/2302 (Greek transposition PD 7/2018) — https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32015L2302 ; https://pavlakis-partners.gr/package-travel/
- Greek tourism-office licensing / ΜΗ.Τ.Ε. — https://eugo.gov.gr/en/services/337579
- DAC7 (Directive (EU) 2021/514) platform reporting — Greece guidance — https://www.vatupdate.com/2024/02/13/guidance-on-reporting-obligations-for-digital-platform-operators-in-greece-dac7/
- PSD2 / Stripe Connect marketplace licensing — https://stripe.com/guides/how-psd2-impacts-marketplaces-and-platforms
- Greece myDATA B2B e-invoicing 2026 — https://www.vatcalc.com/greece/greece-mydata-e-book-and-e-invoices-update/
- European Accessibility Act (28 June 2025, WCAG 2.1 AA) — https://www.twobirds.com/en/insights/2025/a-guide-to-navigating-the-european-accessibility-act-for-online-retailers-service-providers-and-plat
