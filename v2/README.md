# Nature Explorers — v2 Monorepo

Cross-platform nature & hiking marketplace: **Web (Next.js)**, **iOS + Android (Expo)**, backed by **Supabase** with **Stripe Connect** payments. Built to the specs in:

- `../NatureExplorers_v2_Master_Plan.md` — product & strategy
- `../NatureExplorers_v2_Development_Plan.md` — architecture & build instructions
- `../NatureExplorers_v2_SWOT_Analysis.md` — positioning & risks

## Structure

```
apps/
  web/       Next.js 15 (App Router, SSG/ISR) — website + web app + SEO
  mobile/    Expo (React Native, Expo Router) — iOS + Android, offline-first
packages/
  core/      domain logic — fees, cancellation engine, Zod schemas (framework-agnostic TS)
  api/       Supabase client factories + generated DB types + data-access
  i18n/      EN/EL catalogs
  ui/        design tokens (brand: #0c281c / #f0e3c7, Century Gothic)
  config/    shared tailwind preset, tsconfig, lint
supabase/
  migrations/  0001 schema · 0002 functions/triggers · 0003 RLS
```

## Getting started

```bash
# 0. prerequisites: Node 20+, pnpm 9+, Supabase CLI, EAS CLI, a Stripe account
pnpm install

# 1. scaffold the two apps (once), then wire them to the shared packages
cd apps/web    && pnpm create next-app@latest .           # see apps/web/README.md
cd apps/mobile && pnpm create expo-app@latest . -e with-router  # see apps/mobile/README.md

# 2. database: link a Supabase project and apply migrations
supabase link --project-ref <ref>
supabase db push
pnpm db:types            # regenerate packages/api/src/database.types.ts

# 3. env
cp .env.example .env     # fill in Supabase + Stripe + Resend keys

# 4. run everything
pnpm dev
```

## What's already in this scaffold

- **SQL migrations** for the full schema + `SECURITY DEFINER` slot RPC + RLS policies.
- **`packages/core`** — production-ready fee math (`computePlatformFee`, 5% / €1.50 min / cap) and the cancellation/refund engine (`computeRefund`, presets modelled on real Greek organizers).
- **`packages/api`** — Supabase browser/server/service client factories.
- Brand **Tailwind preset** and workspace tooling (Turborepo + pnpm).

## Conventions

- **TypeScript strict** everywhere; no `.jsx` ports from the legacy app — rewrite as `.tsx`.
- **No hardcoded UI strings** — everything through `@nature/i18n`.
- **RLS is the security boundary**; the service-role key is server/Edge only.
- **Webhooks are the source of truth** for booking/payment status — never trust the client.
- Money is handled in **integer cents** in `packages/core`.

## Developer subagents

`.claude/agents/` contains specialized Claude Code subagents (schema, SEO, payments, web, mobile, compliance, QA) that assist during development — see `.claude/agents/README.md` and Development Plan §19. Open Claude Code in this `v2/` folder and paste `DEVELOPER_KICKOFF_PROMPT.md` to begin.
