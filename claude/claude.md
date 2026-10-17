# Project Overview
Single-user bike-purchase leads manager for F3 Motor. Daily CSV import from
BikeBecho.com, Bike4Sale, Facebook; Dashboard, All Leads, Pipeline pages;
card view with status flow New Lead to Closed Won/Lost, notes, history.

# Documentation Files
All project documentation lives in /docs/ as HTML files. Before making any decision,
check the relevant doc file first.

docs/prd.html          - Product requirements, user journeys, MVP scope, acceptance criteria
docs/architecture.html - Stack, data flow, trust boundaries, deployment, test strategy
docs/design.html       - Theme, status tokens, component specs, interaction patterns
docs/security.html     - Security checklist: auth, input validation, secrets, rate limiting
docs/tasks.html        - Ordered task plan with milestones, files, acceptance criteria
docs/memory.html       - Session memory: decisions, completed tasks, risks, next action

# Pattern Recognition
- Everything in this app is built from a pattern recognition model.
- NEVER invent your own architecture. Verify the pattern already exists in the codebase.
- Your job: build INTO the established system. Never create patterns without confirmation.
- Globalize what you write — future features should be plug-in, not rewrites.

# Source-of-Truth (SOT) Keyword System
- Every file has SOT keywords in its header comment (e.g., // SOT:resources).
- Before creating any type, function, constant, or component: grep for it first.
  Command: grep -r "SOT:<keyword>" --include="*.ts" -l
- After creating something new, add its SOT keyword to the top of the file.
- NEVER create duplicate functions, types, or components. Search first.

# Layered Architecture (follow strictly)
- Server Action / Route Handler → validation (Zod), calls requireSession(), orchestration.
- Auth guard → requireSession() rejects unauthenticated requests before any logic.
- Service layer → the ONLY layer importing the DB client. Has `import "server-only"`.
- Never query the database from actions, pages, or components directly.

# TypeScript Rules
- NEVER use `any` or `unknown` types.
- NEVER hardcode entity types — derive from the Drizzle schema; extend, never duplicate.
- Validate ALL inputs with Zod schemas.
- Run `npx tsc --noEmit` before handing over every completed feature.

# Component Rules
- shadcn/ui primitives first: `npx shadcn@latest search` / `add` before custom markup. Icons: lucide-react only.
- Check if a reusable component exists before creating a new one.
- Global components → /components/global/
- Route-specific  → /app/<route>/_components/
- Never hardcode color values — use Tailwind CSS variables / design tokens only.

# Security Rules
- Every Server Action / Route Handler MUST call requireSession() first.
- `import "server-only"` at the top of EVERY service file — enforced by ESLint.
- Secrets (DB URL, Frappe token, session secret, credentials) from env vars only.
- Never use git without explicit user instruction.

# Inline Context Injection
Add this comment block at the top of every non-trivial file or function:
// SOT:<keyword>
// WHAT: [what this does]
// WHY:  [why it exists]
// HOW:  [how it connects to the rest of the system]
// WHERE: [where its consumers live]

# Delivery Checklist (before every handover)
- tsc --noEmit passes with zero errors
- eslint passes (server-only rule)
- All new files have SOT keywords
- Feature is complete end-to-end (no stubs unless using Gap Method intentionally)
- New git branch created for this feature
- No duplicate types, components, or functions (grep-verified)
- All inputs validated with Zod
- requireSession() used in all protected actions/routes
- docs/memory.html updated with decisions, results, and next action
