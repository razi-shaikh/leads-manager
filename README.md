# Leads Manager — F3 Motor

Single-user bike-purchase leads management: daily CSV import, dashboard,
card-based All Leads and Pipeline, status workflow (New → Qualified →
Follow-up → Negotiation → Closed Won/Lost), notes, history, edit/delete,
and bike photos (CSV URLs + Frappe uploads).

Stack: Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui ·
Drizzle ORM · Neon Postgres · Vercel. See `docs/*.html` for PRD,
architecture, design, security, tasks, and memory.

## Local setup

Prerequisites: Node 20+, a Neon Postgres database.

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` (all values; never commit this file):

| Variable | Where from |
|---|---|
| `DATABASE_URL` | Neon dashboard or `npx neon env pull` (pooled URL) |
| `APP_USERNAME` | Your login name, e.g. `f3motors` |
| `APP_PASSWORD_HASH` | bcrypt hash of the password (see below) |
| `SESSION_SECRET` | Random 32+ byte hex string |
| `FRAPPE_UPLOAD_URL` | `https://<host>/api/method/upload_file` |
| `FRAPPE_API_KEY` / `FRAPPE_API_SECRET` | Frappe API token pair |

NOTE: in local `.env` files, escape every `$` in the bcrypt hash as `\$`
(Next.js expands `$VAR` otherwise, silently emptying the value).
Vercel dashboard values are literal — no escaping needed there.

Generate the password hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))"
```

Then migrate, seed sample data, and run:

```bash
npm run db:migrate
npm run db:seed        # optional: 3 sample leads
npm run dev            # http://localhost:3000
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Develop, production build, serve build |
| `npm run db:migrate` | Apply committed `./drizzle` migrations |
| `npm run db:seed` | Insert 3 sample leads |
| `npm test` | Unit tests (CSV parsing) |
| `npm run lint` | ESLint (includes service-layer DB rule) |

Gates before any handover: `npx tsc --noEmit`, `npm run lint`, `npm test`.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the same 7 env vars in the Vercel dashboard (production scope).
   Use the **production** Neon branch URL and **unescaped** hash values.
3. Run migrations against production once:
   `DATABASE_URL="<prod-url>" npm run db:migrate`
4. Deploy. The build runs typecheck, lint, and tests via `next build`.

## Docs

Open in a browser: `docs/prd.html`, `docs/architecture.html`,
`docs/design.html`, `docs/security.html`, `docs/tasks.html`,
`docs/memory.html`. Agent rules: `AGENTS.md`, `claude/claude.md`.
