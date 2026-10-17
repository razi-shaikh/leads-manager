<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Leads Manager (F3 Motor) — Agent Guide

Single-user bike-purchase leads manager. Next.js 16 App Router + Tailwind v4
on Vercel; Neon Postgres via Drizzle; photos via Frappe upload API (server-only).

## Docs first
`docs/prd.html` (requirements) · `docs/architecture.html` (stack, decisions) ·
`docs/design.html` (tokens, components) · `docs/security.html` (checklist) ·
`docs/tasks.html` (milestones T1–T4) · `docs/memory.html` (decisions, next action).
Read the relevant doc before deciding. `claude/claude.md` is the full orchestrator file.

## Layers (strict)
UI → Server Action / Route Handler (Zod + `requireSession()`) → service
(`server-only`, only DB importer) → Neon Postgres. Never query the DB from
actions, pages, or components. Middleware + `requireSession()` on every
protected surface; UI hiding is not enforcement.

## SOT keywords
Header comment on every non-trivial file: `SOT:<keyword>` + WHAT/WHY/HOW/WHERE.
Before creating anything: `grep -r "SOT:<keyword>" --include="*.ts" -l`.
Never duplicate a type, function, or component — search first.

## Rules
- No `any`/`unknown`. Derive entity types from the Drizzle schema.
- Zod-validate every server input (forms, CSV rows, params, uploads).
- No hardcoded colors — Tailwind CSS variables / tokens only.
- UI: shadcn/ui primitives (`/components/ui/`, semantic tokens) + lucide-react icons first.
- Components: shared custom → `/components/global/`, route-local → `/app/<route>/_components/`.
- Secrets only from env (`DATABASE_URL`, `APP_USERNAME`, `APP_PASSWORD_HASH`,
  `SESSION_SECRET`, `FRAPPE_*`). Never log secrets or customer PII.
- Neon: pooled `DATABASE_URL`; dev against a branch DB, never prod from local.
- Never run git without explicit user instruction.

## Gates (every handover)
`npx tsc --noEmit` clean · `npx eslint .` clean · SOT headers present ·
Zod on inputs · `requireSession()` everywhere protected · feature end-to-end
complete · `docs/memory.html` updated. Build: `npm run build`. Tests: `npx vitest run`.
