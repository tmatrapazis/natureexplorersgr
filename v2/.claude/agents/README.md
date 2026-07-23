# Developer subagents

Specialized Claude Code subagents that help build Nature Explorers v2 to spec.
Open Claude Code in the `v2/` folder; these are auto-discovered and can be invoked
by name or auto-delegated based on their descriptions.

Canonical specs live in the parent folder:
`NatureExplorers_v2_Master_Plan.md`, `NatureExplorers_v2_Development_Plan.md`, `NatureExplorers_v2_SWOT_Analysis.md`.

| Agent | Use it for |
|---|---|
| `supabase-schema` | SQL migrations, RLS policies, DB types, Edge Functions |
| `seo-engineer` | metadata, JSON-LD, sitemaps, hreflang, Core Web Vitals |
| `payments-engineer` | Stripe Connect: charges, 5% fee, deposit/balance, refunds, webhooks |
| `web-builder` | Next.js App Router routes, components, i18n |
| `mobile-builder` | Expo screens, offline-first, maps, native modules |
| `compliance-reviewer` | Greek/EU law checks (read-only) |
| `qa-verifier` | tests + Definition-of-Done verification |

Workflow: build with the domain agent → `compliance-reviewer` and `qa-verifier` check the result.
