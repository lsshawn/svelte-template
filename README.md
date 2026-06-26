# sk-template

An opinionated **SvelteKit 5** scaffolder for spinning up new projects fast — built for an AI agent on a VPS to clone, code against, and ship to Vercel.

```
Google Stitch (mockup)  →  sk-template (scaffold)  →  Claude Code (build)  →  Vercel (deploy)
```

## Stack

- **SvelteKit 5** (Svelte 5 runes) + **Vite**
- **Tailwind CSS 4** + **DaisyUI** (light/dim themes, `@iconify/svelte` icons)
- **Drizzle ORM** — Turso (libSQL), Neon (Postgres), or local SQLite
- **Session auth** — email one-time codes (OTP), optional Google/GitHub OAuth
- **adapter-vercel** — deploys to Vercel out of the box

## Quick start

```bash
# Interactive
node /mnt/storage/projects/sk-template/bin/create.mjs

# Non-interactive (AI / scripted)
node /mnt/storage/projects/sk-template/bin/create.mjs \
  --name acme-dash --dir ../acme-dash \
  --archetype dashboard --db turso \
  --title "Acme" --description "Acme admin console" \
  --install --git --yes
```

## Archetypes

| Archetype   | What you get                                                            | DB / Auth |
| ----------- | ---------------------------------------------------------------------- | --------- |
| `landing`   | Marketing page only (hero, features, footer). No server code.          | none      |
| `dashboard` | Sidebar + topbar shell, KPI cards, table, settings. Login required.    | yes       |
| `webapp`    | Marketing landing **+** auth-gated dashboard. Full app.                | yes       |

## Databases

Picked at init with `--db`. The scaffolder writes the right Drizzle connection,
schema (SQLite vs Postgres column types), `drizzle.config.ts`, `.env`, and deps.

| `--db`   | Client                      | `DATABASE_URL` example                       |
| -------- | --------------------------- | -------------------------------------------- |
| `turso`  | `@libsql/client`            | `libsql://db.turso.io` (+ `DATABASE_AUTH_TOKEN`) |
| `sqlite` | `@libsql/client` (file)     | `file:local.db`                              |
| `neon`   | `@neondatabase/serverless`  | `postgres://…neon.tech/db?sslmode=require`   |

## CLI flags

| Flag | Values | Notes |
| --- | --- | --- |
| `--name` | kebab-case | npm package name (required) |
| `--dir` | path | target dir (default `./<name>`) |
| `--archetype` | `landing` `dashboard` `webapp` | |
| `--db` | `turso` `neon` `sqlite` | ignored for `landing` |
| `--title` | string | UI display name |
| `--description` | string | meta / hero copy |
| `--pm` | `pnpm` `npm` `bun` | default `pnpm` |
| `--install` / `--no-install` | | run package install |
| `--git` / `--no-git` | | git init + first commit |
| `--yes`, `-y` | | accept defaults, no prompts |
| `--force` | | allow non-empty target dir |

## After scaffolding

```bash
cd <project>
pnpm install
# For DB archetypes: set .env, then create tables.
pnpm run db:push:force      # non-interactive (AI-friendly)
pnpm run dev
```

Auth in dev needs **no email provider** — OTP codes print to the server console.
Set `EMAIL_PROVIDER=mailgun` (+ `MAILGUN_*`) for real email; set the
`GOOGLE_*` / `GITHUB_*` client vars to light up OAuth buttons automatically.

## Deploy

```bash
vercel          # preview
vercel --prod   # production
```

Set the same env vars in the Vercel project settings. The Vercel function
runtime is pinned to `nodejs22.x` in `svelte.config.js`.

## Repo layout

```
sk-template/
├── bin/create.mjs     # the scaffolder (zero deps, Node ≥20)
└── template/          # the canonical app; dialect & archetype variants live here
    ├── src/lib/server/db/dialects/   # per-DB connection + schema (selected at init)
    ├── env/                          # per-DB .env.example (selected at init)
    └── drizzle.config.{turso,neon,sqlite}.ts
```

## How it works

`create.mjs` copies `template/`, then:

1. **DB wiring** — copies the chosen dialect's `index.ts` + `schema.ts` into
   `src/lib/server/db/`, the matching `drizzle.config.ts`, and `.env`.
2. **Archetype pruning** — deletes the route groups you don't need
   (`(marketing)`, `(app)`, `(public)`) and adds a root redirect for `dashboard`.
3. **package.json** — injects DB deps, drops unused ones for `landing`.
4. **Tokens** — replaces `__APP_NAME__` / `__APP_TITLE__` / `__APP_DESCRIPTION__`.
5. Renames `_gitignore` → `.gitignore`, writes a tailored README, installs, git inits.
```
