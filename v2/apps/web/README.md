# apps/web — Next.js 15 (App Router)

Scaffold here, then wire to the shared packages:

    pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"

Then:
- add deps on `@nature/core`, `@nature/api`, `@nature/i18n`, `@nature/config`
- extend `tailwind.config` with `presets: [require('@nature/config/tailwind-preset')]`
- implement routes + SEO exactly as in `NatureExplorers_v2_Development_Plan.md` §6–§7.
