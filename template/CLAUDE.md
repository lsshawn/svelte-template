# CLAUDE.md

Guidance for Claude Code working in **__APP_TITLE__**, scaffolded from `sk-template`.

## Stack

- SvelteKit 5 (Svelte 5 **runes** — `$state`, `$derived`, `$props`, `$effect`)
- Tailwind CSS 4 + DaisyUI (use semantic classes: `bg-base-100`, `text-base-content`, `border-base-300`, `btn`, `card`, `badge`)
- Icons via `@iconify/svelte` (`<Icon icon="material-symbols:..." />`)
- Drizzle ORM + (this project's DB — see `drizzle.config.ts` dialect)
- Session auth (OTP) — see `src/lib/server/auth.ts`

## Conventions

- **Runes only.** Never use `export let`; use `let { foo } = $props()`. No legacy stores for local state.
- **Server code** lives in `src/lib/server/` — never import it into client components.
- **DB access**: import `db` and the schema from `$lib/server/db`. Use Drizzle's
  `$inferSelect` / `$inferInsert` for types.
- **Auth state**: `event.locals.user` / `event.locals.session` are populated in
  `src/hooks.server.ts`. Guard routes by checking `locals.session` in a
  `+layout.server.ts` / `+page.server.ts` `load`.
- **Theme colors**: prefer DaisyUI semantic tokens so light/dim themes both work.
  The brand accent is `--color-brand` (in `src/app.css`).
- **Forms**: use SvelteKit form actions (`?/actionName`) + `use:enhance`.

## Commands

```bash
pnpm dev                # dev server (OTP codes print to this console)
pnpm check              # type-check
pnpm lint / pnpm format # prettier + eslint
pnpm run db:push:force  # apply schema to the DB (non-interactive)
pnpm run db:studio      # browse data
```

## Adding a feature

1. Add tables to `src/lib/server/db/schema.ts`, run `pnpm run db:push:force`.
2. Add a route under `src/routes/(app)/...` (auth-gated) or `(public)/...`.
3. Load data in `+page.server.ts`; render with runes in `+page.svelte`.
4. Reuse the dashboard shell — it's `src/routes/(app)/+layout.svelte`; edit its
   `navItems` to add sidebar links.

## Deploy

`vercel --prod`. Set env vars (`DATABASE_URL`, etc.) in the Vercel dashboard.
