# Findings — Phase 2

## Phase 1 outcomes (from discussion, 2026-10-14..17)
- Product: Bike Purchase Leads Management System for F3 Motor. Single user (f3motors).
- Sources: BikeBecho, Bike4Sale, Facebook; extensible.
- Statuses: New Lead, Qualified, Follow-up, Negotiation, Closed Won, Closed Lost.
- Pages: Dashboard (counts by status, new-today, source filter), All Leads
  (cards, search name/phone/reg, status+source filters, 50/page), Pipeline
  (status tabs excluding New Lead, Qualified default, same search/filter/pagination).
- Card: photo carousel, bike details, customer contact, status tag; actions =
  status dropdown, notes, history, edit-all, delete.
- CSV import, 14 columns; duplicates (Phone+Reg) created but tagged.
- Notes = text + timestamp. History = timeline of status changes + notes.
- Photos: CSV URLs and/or user uploads via Frappe upload API (photos only, not lead data).
- Data store: Neon DB (PostgreSQL). Hosting: Vercel. Secrets in env vars only.
- Out of MVP: table view, multi-user/roles (very low future chance).

## Verified repo facts
- Next.js 16.4.0, React 19, Tailwind v4 (@import "tailwindcss"), TS, ESLint.
- src/app/: layout.tsx, page.tsx (minimal), globals.css (directives only), favicon.ico.
- public/ empty. No page.module.css. No CSV/XLSX in workspace (checked root, public, src).

## Installed skills (2026-10-17, ~/.agents/skills/)
- planning-with-files, find-skills, frontend-design, design-taste-frontend,
  neon, impeccable (stood in for colorize — not found in repo), responsive-design.
- shadcn (installed 2026-10-17 per user change request). Key rules: existing
  components first, compose don't reinvent, built-in variants, semantic colors
  only (never raw bg-blue-500), lucide via data-icon, FieldGroup+Field forms,
  Badge/Skeleton/Empty/AlertDialog instead of custom markup.
