# Developer Kickoff Prompt — Nature Explorers v2

> **How to use:** open Claude Code (or your AI coding assistant) with the **`v2/` folder** as the working directory, then paste everything below the line into the chat. It also reads as a plain brief for a human developer.

---

You are building **Nature Explorers v2**. Your job is to rebuild natureexplorers.gr as a cross-platform nature & hiking marketplace — a **web app (Next.js)**, an **iOS + Android app (Expo)**, on a **Supabase** backend with **Stripe Connect** payments — exactly as specified in the plan documents in this repository. SEO is the product's primary growth channel; treat it as a first-class requirement, not an afterthought.

## Read these first (source of truth, in this order)

1. `../NatureExplorers_v2_Master_Plan.md` — product, monetization (free organizers can take bookings up to **3 active events**; **5% buyer-side service fee**; organizer **Pro** subscription), payments, deposit/balance model, cancellation engine, and Greek/EU compliance.
2. `../NatureExplorers_v2_Development_Plan.md` — **the architecture and build instructions. Follow it precisely.** Pay special attention to §4 (schema/RLS), §6–§7 (web + SEO), §8 (mobile), §9 (payments), §13 (compliance), §17 (build sequence), §18 (Definition of Done), §19 (subagents).
3. `../NatureExplorers_v2_SWOT_Analysis.md` — strategic context.
4. This folder: `README.md`, `supabase/migrations/*`, and `packages/core/*` — the scaffold is already in place; build on it.

## Architecture (already decided — do not relitigate)

Turborepo monorepo · `apps/web` = **Next.js 15 App Router (SSG/ISR)** for best-in-class SEO · `apps/mobile` = **Expo (React Native, offline-first)** · shared **`packages/`** (`core`, `api`, `i18n`, `ui`, `config`) · **Supabase** backend · **Stripe Connect** payments.

## Non-negotiable rules

- **TypeScript strict** everywhere. Rewrite legacy `.jsx` as `.tsx` — do **not** copy old SPA code; reuse only the data, business rules, translations, and brand tokens.
- **RLS is the security boundary.** The service-role key is server/Edge-only, never in a client or app bundle.
- **No hardcoded UI strings** — everything through `@nature/i18n` (el/en). Locale lives in the URL with `hreflang`.
- **Webhooks are the source of truth** for booking/payment status. Never trust the client.
- **Money is integer cents.** Use `@nature/core` (`computePlatformFee`, `computeRefund`) — never reimplement fee or refund math in the UI.
- **Every public page ships crawlable HTML** with correct title/description/canonical/hreflang and valid JSON-LD. Kill the old Base44 boilerplate meta.
- Bookings are **real-world services** → no Apple/Google commission. The **Pro subscription is sold web-first** (no iOS IAP).

## Use the subagents (`.claude/agents/`, see Development Plan §19)

For **every feature**, run this loop:
1. **Build** with the domain agent: `supabase-schema` (DB/RLS/Edge), `web-builder` (Next.js), `mobile-builder` (Expo), `payments-engineer` (Stripe), `seo-engineer` (metadata/JSON-LD/sitemaps).
2. **Review** with `compliance-reviewer` if it touches bookings, payments, onboarding, or personal/health data.
3. **Verify** with `qa-verifier` against the Definition of Done (§18). Never mark done with failing checks.

Only `supabase-schema` writes SQL migrations or changes RLS — other agents request schema changes from it.

## Your first tasks (Milestone 0 → 1, in order)

1. `pnpm install`. Scaffold `apps/web` (`pnpm create next-app@latest .`) and `apps/mobile` (`pnpm create expo-app@latest . -e with-router`); wire both to the shared packages and the `@nature/config` Tailwind preset (brand `#0c281c` / `#f0e3c7`, Century Gothic).
2. Using **`supabase-schema`**: create a Supabase project, apply `supabase/migrations/0001–0003`, run `pnpm db:types`, then port the legacy data from `../migration/data/*.csv` into the new schema.
3. Copy `.env.example` → `.env` and fill Supabase + Stripe + Resend keys.
4. Using **`web-builder`** + **`seo-engineer`**: build the public routes from Development Plan §6.1, starting with **Home**, **`/[locale]/trips`**, and **`/[locale]/trips/[trip-slug]`** — SSG/ISR, bilingual metadata, `TouristTrip` + `Offer` JSON-LD, dynamic `sitemap.ts`, `hreflang`, and 301s from the old query-string URLs.
5. Using **`qa-verifier`**: unit-test the `@nature/core` math and confirm Lighthouse SEO ≥ 95 / Performance ≥ 90 on the trip page.

## Before you mass-edit

Confirm you have read the plan docs, then reply with a **short step-by-step plan for Milestones 0–1** and flag anything ambiguous. When a product or legal decision is unclear, **ask** rather than guess. Meet the **Definition of Done (§18)** for each milestone before moving to the next.
