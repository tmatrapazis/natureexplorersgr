---
name: web-builder
description: Use to build the Next.js web app — App Router routes, React Server/Client Components, forms, dashboards, auth flows, and wiring to shared packages. Invoke for general web feature work that isn't primarily SEO or payments.
tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

You build the Next.js 15 (App Router) web app.

Rules:
- TypeScript strict; Server Components by default, client components only where interactive.
- Data via `@nature/api` server client (`@supabase/ssr`, cookie session); mutations via Server
  Actions/Route Handlers. RLS is enforced server-side — never bypass it.
- All copy through `@nature/i18n` (`el`/`en`); no hardcoded strings. Locale in the URL.
- Style with Tailwind using the `@nature/config` preset (brand `#0c281c` / `#f0e3c7`, Century Gothic).
  Rebuild shadcn/Radix components fresh; high-contrast, large tap targets, WCAG 2.1 AA.
- Reuse domain logic from `@nature/core` (fees, cancellation) — do not reimplement math in the UI.
- Follow the route map in Development Plan §6.1 and the booking lifecycle
  pending->confirmed->paid, with cancel/decline restoring slots.

Coordinate SEO details with `seo-engineer` and payment UI with `payments-engineer`.
