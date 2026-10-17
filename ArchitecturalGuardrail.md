---
name: architectural-guardrail
description: >-
  Teaches AI the complete Architectural Guardrail system for starting and building
  production-grade software projects. Runs in 3 explicit phases: Phase 1 (Planning —
  discussion only, no files), Phase 2 (Documentation — HTML files reviewed one by one),
  Phase 3 (Project Building). Covers mandatory files before any feature code, the layer
  architecture (router → block/procedure → service → DB), TypeScript lock-in, SOT keywords,
  inline injection, and prompting strategies. Activate whenever the user wants to start
  a new software project or set up a codebase structure.
---

# Architectural Guardrail — Project Start Guide

> **Core Philosophy**: You are not here to write code. You are here to **direct** AI.
> Production-grade apps are built by enforcing patterns through echo signals
> (TypeScript errors, ESLint, Zod schemas) — not by relying on context or memory.

---

## How This Skill Works — 3 Phases

Every project runs through exactly 3 phases in order. **Never skip or merge phases.**

| Phase | Name | Goal | Files Created? |
|-------|------|------|----------------|
| 1 | Planning | Clarify everything through discussion | ❌ No |
| 2 | Documentation | Create and review all project docs | ✅ HTML files only |
| 3 | Project Building | Build features using the guardrail | ✅ Code files |

---

## PHASE 1 — Planning (Discussion Only)

> **Rule: Do not create any file — not even a single one — until the plan is finalized
> and the user explicitly says "the plan is finalized" or "move to Phase 2".**

### What to Do in Phase 1

Have a focused conversation to understand the project fully. Ask questions in small,
digestible batches — not all at once. Wait for answers before asking the next batch.

### Required Questions to Cover (in conversation, not all at once)

**Round 1 — The Idea**
- What problem does this software solve, and who is the first user?
- What does the user do inside the app? Walk me through the core user journey.
- What is the smallest useful first release? What is explicitly out of scope?

**Round 2 — Technical Direction**
- Is there an existing repository? If yes, what stack is it using?
- Is there a required stack, hosting environment, or tech you want to use?
- Are there any third-party integrations (payments, auth, email, storage, etc.)?

**Round 3 — Scale & Security**
- Will the app have multiple users per account (multi-tenant / org-based)?
- What sensitive data will the app handle — accounts, payments, PII?
- Are there roles or permissions (e.g., admin vs. member)?

**Round 4 — Design & Quality**
- Any visual direction, brand, or design references?
- What does success look like — how will you measure it?
- Any hard constraints: timeline, budget, accessibility requirements?

### Phase 1 Rules

- Do **not** ask questions already answered.
- Do **not** invent requirements. Label every assumption clearly.
- Do **not** make architecture choices unilaterally — propose and confirm.
- Do **not** touch files, folders, or the repository in any way.
- At the end, summarize the plan in plain language and ask: _"Does this match what you
  have in mind? Should I proceed to Phase 2?"_

---

## PHASE 2 — Documentation (HTML Files, One by One)

> **Rule: All documentation files are HTML — not Markdown. This makes them easy
> for the user to read by simply opening them in a browser.**
>
> Do NOT define an HTML template inside this skill. Write clean, readable HTML
> appropriate for each file's content. Use headings, lists, tables, and code blocks
> as needed. Each file should be self-contained and human-readable.

### Phase 2 Workflow

1. Create **one documentation file at a time**.
2. After creating each file, show the user what was written and say:
   _"Review this file. Let me know if any changes are needed."_
3. Apply all requested changes before moving to the next file.
4. Only move to the next file after the user approves the current one.
5. Phase 2 is complete only after **all files are created and all changes are done**.
6. At the end, say: _"All documentation is ready. Should I proceed to Phase 3?"_

### Documentation Files to Create (in this order)

#### 1. `docs/prd.html` — Product Requirements

Content to include:
- Problem statement and target user
- Core user journeys (step-by-step)
- Functional requirements (written as testable behaviors: "When X, system does Y")
- Non-functional requirements (performance, accessibility, reliability, privacy)
- MVP scope — what is **in** and what is **explicitly out**
- Observable success measures
- Acceptance criteria for the first end-to-end outcome
- Open decisions and assumptions (labeled clearly)

---

#### 2. `docs/architecture.html` — System Architecture

Content to include:
- Full tech stack (frontend, backend, database, auth, deployment)
- System boundaries and data flow: Client → Router → Protected Procedure → Service → DB
- External services and their API contracts
- Trust boundaries and where authorization checks happen
- Error handling and logging strategy (what gets logged; what must NOT — secrets, PII)
- Persistence and migration strategy (how DB schema changes are managed)
- Deployment shape: environments (dev / staging / prod), CI/CD pipeline
- Test strategy: unit, integration, e2e — tools and coverage expectations
- Consequential decisions and trade-offs (presented as a table: Decision | Choice | Reason | Trade-off)

---

#### 3. `docs/design.html` — UI/UX Design Constraints

Create only if the product has a user interface. Content to include:
- Visual direction and brand (style, tone, dark/light mode)
- Accessibility requirements (e.g., WCAG 2.1 AA — keyboard navigation, screen reader labels)
- Component philosophy:
  - Global/shared components → `/components/global/`
  - Route-specific components → `/app/<route>/_components/`
  - Never hardcode colors — use design tokens (Tailwind CSS variables only)
- Interaction patterns: optimistic UI, loading skeletons, error toasts, empty states
- shadcn/ui components in use (list them with their purpose)
- Reusable component specs (name, props, usage context)

---

#### 4. `docs/security.html` — Security Checklist

Create whenever the app handles accounts, payments, roles, or sensitive data.
Content to include (as a reviewable checklist):

**Data Sensitivity**
- PII identified and minimized
- Sensitive fields encrypted at rest where required

**Authentication & Authorization**
- Auth checks on ALL protected routes (not just UI guards)
- Authorization checked server-side — never trust client-supplied roles or IDs
- Org scoping always from `ctx` session — never from request body or URL params

**Input Validation & Output Encoding**
- All inputs validated with Zod before entering business logic
- Output encoding to prevent XSS

**Secrets & Injection**
- No secrets in source code or chat — environment variables only
- Secrets excluded from version control (`.gitignore` verified)
- Parameterized queries only (Prisma handles this — no raw SQL without care)

**Transport & Storage**
- HTTPS enforced in all non-local environments
- Sensitive data not retained beyond its necessary lifetime

**Rate Limiting & Error Messages**
- Rate limiting on public and authenticated endpoints
- Error messages do not leak internal structure or stack traces
- Logs do not contain secrets, passwords, or unnecessary PII

> Note: This checklist identifies items to address — it is not a security audit.

---

#### 5. `docs/tasks.html` — Task Plan

Content to include:
- Milestones (named groups of tasks, e.g., "Milestone 1: Auth + Core Data Model")
- Each task must have:
  - Name and description
  - Files to create or modify
  - Depends on (prior task or "none")
  - Acceptance criteria (testable — e.g., "tsc passes, user can log in")
  - Validation command (e.g., `pnpm test`, `tsc --noEmit`)
  - Status: todo / in progress / done

Start Milestone 1 with one end-to-end vertical slice that proves the core product path.
Include tests and security tasks within milestones — never postpone them to "later."

---

#### 6. `docs/memory.html` — Project Memory (Session Continuity)

This file is updated at every meaningful milestone. Content to include:
- Current goal and agreed scope
- Architecture and security decisions (as a table: Decision | Reason | Date)
- Verified repository facts (file path → what it does, confirmed by inspection)
- Completed tasks and actual results (task | result | test output)
- Known risks and blockers
- Open questions
- One precise next action (the exact next step)

**Rule:** At a context or session boundary, produce a short handoff from this file.
On resumption, reread source-of-truth files and inspect relevant repository state
before doing anything. **Never invent prior decisions or report unverified progress.**

---

#### 7. `claude/claude.md` — The AI Orchestrator File

This is the most important file. It is the single file AI reads to understand how to
behave in this project. Keep it under 120 lines. It is the only file written in Markdown
(not HTML) because AI reads it directly.

**Required sections:**

```markdown
# Project Overview
[One paragraph: what this app is and who it's for.]

# Documentation Files
All project documentation lives in /docs/ as HTML files. Before making any decision,
check the relevant doc file first.

docs/prd.html        - Product requirements, user journeys, MVP scope, acceptance criteria
docs/architecture.html - Stack, data flow, trust boundaries, deployment, test strategy
docs/design.html     - Theme config, shadcn components, reusable component specs
docs/security.html   - Security checklist: auth, input validation, secrets, rate limiting
docs/tasks.html      - Ordered task plan with milestones, files, acceptance criteria
docs/memory.html     - Session memory: decisions, completed tasks, risks, next action

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
- Router layer    → Business logic, validation (Zod), orchestration. Uses protectedProcedure.
- Block/Procedure → Security middleware. All authenticated traffic passes through this.
- Service layer   → The ONLY layer that touches the database (Prisma). Has `import "server-only"`.
- Never call the database from routers, pages, or components directly.

# TypeScript Rules
- NEVER use `any` or `unknown` types.
- NEVER hardcode types — derive them dynamically from Prisma or existing SOT files.
- Use Prisma-generated types as the primary source. Extend them; never duplicate them.
- Validate ALL inputs with Zod schemas.
- Run `tsc --noEmit` before handing over every completed feature.

# Component Rules
- Check if a reusable component exists before creating a new one.
- Global components → /components/global/
- Route-specific  → /app/<route>/_components/
- Never hardcode color values — use Tailwind CSS variables / design tokens only.

# Security Rules
- Every API endpoint / router MUST use protectedProcedure.
- `import "server-only"` at the top of EVERY service file — enforced by ESLint.
- Org scoping ALWAYS from ctx session — never from request body or user input.
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
- eslint passes (server-only and protected-procedure rules)
- All new files have SOT keywords
- Feature is complete end-to-end (no stubs unless using Gap Method intentionally)
- New git branch created for this feature
- No duplicate types, components, or functions (grep-verified)
- All inputs validated with Zod
- protectedProcedure used in all authenticated routers
```

---

## PHASE 3 — Project Building

> **Rule: Phase 3 only begins after the user approves the end of Phase 2.**
> Do not start building until all documentation files are finalized.

### Before Writing Any Code

1. **Inspect the repository** (if it exists):
   - Check actual files, `package.json`, scripts, tests, conventions.
   - Summarize what is **present** and what is **unknown** separately.
   - Preserve established conventions unless there is a specific reason to change them.
   - Never claim a file exists until verified.

2. **Create mandatory code scaffolding files** (in this order):

### Mandatory Scaffolding Files (create before any feature)

#### A. `prisma/schema.prisma` — Source of All TypeScript Types

Design thinking into the future. Ask AI:

> "Design a Prisma schema for [app]. Think about future features: affiliates, roles,
> multi-tenancy, usage tracking, audit logs. Include fields I may not use now but
> might need later. Scope all data to an `orgId`."

The Prisma schema becomes the **source of all truth for TypeScript types**.
Never manually create a User, Org, or entity type — derive it from Prisma.

---

#### B. `src/lib/resources.ts` — Global Feature Gate Registry

Single source of truth for plans, permissions, feature gates, and limits.

```typescript
// SOT:resources SOT:feature-gates SOT:permissions SOT:plan-limits
// WHAT: Central registry of all app resources, plan limits, and permissions.
// WHY:  One place to change plan limits and feature access app-wide.
// HOW:  Consumed by protectedProcedure (server) and client-helpers (client).
// WHERE: Used in /src/trpc/procedures/protected.ts and /src/lib/client-helpers.ts

export const PLAN_KEYS = ['free', 'starter', 'pro', 'enterprise'] as const;
export type PlanKey = typeof PLAN_KEYS[number];

export const resources = {
  members: {
    name: 'Team Members',
    description: 'Invite and manage team members',
    upgradeMessage: (plan: string) => `Upgrade from ${plan} to add more members`,
    limits: { free: 1, starter: 5, pro: 20, enterprise: Infinity },
    permissions: ['create', 'read', 'update', 'delete'] as const,
  },
  // Add one object per app feature/resource
} as const;

export type ResourceKey = keyof typeof resources;
export type Permission = typeof resources[ResourceKey]['permissions'][number];
```

---

#### C. `src/lib/permissions.ts` — Dynamically Generated Permission Constants

```typescript
// SOT:permissions SOT:permission-constants
// WHAT: Typed permission constants built from the resources registry.
// WHY:  Wrong permission keys cause TypeScript compile errors — enforced, not documented.
// HOW:  Derived from resources.ts — one change propagates everywhere.

import { resources, type ResourceKey } from './resources';

type Operation = 'create' | 'read' | 'update' | 'delete';
type PermissionKey = `${ResourceKey}_${Operation}`;

export function buildPermissionConstants() {
  const result = {} as Record<PermissionKey, PermissionKey>;
  for (const [resource, config] of Object.entries(resources)) {
    for (const perm of config.permissions) {
      const key = `${resource}_${perm}` as PermissionKey;
      result[key] = key;
    }
  }
  return result;
}

export const PERMISSIONS = buildPermissionConstants();
```

---

#### D. `src/trpc/procedures/protected.ts` — The BLOCK (Heart of the Guardrail)

All authenticated traffic passes through this. Implement in this exact order:

1. Session validation — confirm user is authenticated
2. Org scoping — inject `orgId` from session into `ctx` (NEVER from user input)
3. Membership check — user belongs to this org
4. Role gate — user has the required role
5. Permission gate — user has the required permission (from `resources.ts`)
6. Plan limit gate — check against `resources.ts` limits
7. Feature flag gate
8. Rate limiting
9. Audit log — record the action
10. Usage counter — increment/decrement resource usage
11. Structured error/exception handling

```typescript
// SOT:protected-procedure SOT:block SOT:middleware
// WHAT: The central security block. All authenticated API calls pass through this.
// WHY:  Auth, org-scoping, permissions, and rate-limiting enforced once — not repeated per router.
// HOW:  Chained tRPC middleware (steps 1–11 above).
// WHERE: Used in ALL routers under /src/trpc/routers/

export const protectedProcedure = t.procedure
  .use(sessionMiddleware)    // Steps 1–2: auth + org scoping
  .use(membershipMiddleware) // Step 3: membership check
  .use(rateLimitMiddleware)  // Step 8: rate limiting
  .use(auditMiddleware);     // Step 9: audit logging
```

---

#### E. `src/trpc/routers/index.ts` — Router Registry

```typescript
// SOT:router-registry
// WHAT: Central registry of all app routers.
// WHY:  Plug-in architecture — adding a feature = adding one line here.

import { memberRouter } from './member.router';

export const appRouter = createTRPCRouter({
  member: memberRouter,
  // <feature>: <feature>Router,
});
```

---

#### F. `src/services/<feature>.service.ts` — Service Layer Template

Every service file must follow this template:

```typescript
import 'server-only'; // Enforced by ESLint — this must be the first line

// SOT:<feature>-service
// WHAT: Database access layer for <feature>. Only this file touches the DB for this resource.
// WHY:  DB isolation — swapping providers only requires changes here.
// HOW:  Called from <feature>.router.ts only. Never from components or pages.
// WHERE: /src/trpc/routers/<feature>.router.ts

import { prisma } from '@/lib/prisma';

export async function list<Feature>(orgId: string) {
  return prisma.<feature>.findMany({ where: { orgId } });
}
```

---

#### G. `eslint.config.js` — ESLint as Guardrail Enforcer

```javascript
module.exports = {
  overrides: [
    {
      files: ['src/services/**/*.ts'],
      rules: {
        'import/first': 'error',
        // Custom rule: first import in service files must be 'server-only'
      },
    },
  ],
};
```

---

#### H. `src/lib/types/index.ts` — Barrel Type Exports

```typescript
// SOT:types SOT:global-types
// WHAT: Barrel export of all shared app types.
// WHY:  AI finds all types from one index — reduces hallucinated duplicate types.
// HOW:  All types derived from Prisma or dynamically generated (never hardcoded).

export type { ResourceKey, PlanKey, Permission } from '../resources';
export type { AppRouter } from '../../trpc';
export type { User, Organization, Member } from '@prisma/client';
```

---

#### I. `src/lib/client-helpers.ts` — Shared Server + Client Feature Gate

```typescript
// SOT:client-helpers SOT:feature-gate-helper SOT:plan-check
// WHAT: Reusable helpers for checking feature access on client AND server.
// WHY:  One function — no duplicated plan-checking logic across components.
// HOW:  Consumes resources.ts. Works on both client and server (no server-only import).

import { resources, type ResourceKey, type PlanKey } from './resources';

export function canAccessResource(
  resourceKey: ResourceKey,
  plan: PlanKey,
  currentUsage: number
): { allowed: boolean; upgradeMessage?: string } {
  const resource = resources[resourceKey];
  const limit = resource.limits[plan];
  if (currentUsage >= limit) {
    return { allowed: false, upgradeMessage: resource.upgradeMessage(plan) };
  }
  return { allowed: true };
}
```

---

### Branch Strategy (Every Feature Gets Its Own Branch)

```bash
# Never work on main/master
git checkout -b feature/<feature-name>

# Iterating on a complex feature:
git checkout -b feature/<feature-name>-v2
```

**Rule:** If a feature fails, branch from the last good checkpoint. Never corrupt main.

---

### SOT Keyword & Grep-First Workflow

Before creating ANY new function, type, component, or constant:

```bash
grep -r "SOT:<keyword>" --include="*.ts" -l
```

Only create something new if the grep returns nothing. This prevents duplicate types,
functions, and components — the most common AI failure mode.

---

### Prompting Strategies for Features

**Simple feature — one-shot:**
```
Build a [feature name].
It should: [list small details].
Use the existing architecture. Do not create new patterns.
```

**Complex feature — break into prerequisites first:**

Number sub-tasks by dependency order. Build each prerequisite before the feature itself.
Example (website builder with calendar embed):
1. Build the booking calendar page feature (standalone)
2. Design the state store structure for the website builder
3. Build the canvas renderer
4. Build drag-and-drop + frame system
5. Wire the calendar as a pre-built component into the canvas

**Gap Method — stub intentionally to prevent tight coupling:**
```
Build the invite creation feature.
Do NOT wire up email sending yet.
Create a single SOT service function where email logic will go.
Use console.warn("TODO: wire email sending") as a placeholder.
```

**White Lie Method — force AI to search before creating:**
```
We already have a source-of-truth for payments somewhere in this app.
Find it, then wire invoice creation into it.
```

**Revealing hidden bugs:**
```
I believe there are two conflicting implementations of [X] in this codebase.
Verify this claim. Strip all references to the old one, keeping only the correct one.
```

---

## Layer Map (Quick Reference)

```
User / Client Request
        │
        ▼
  [Router Layer]              ← Business logic, Zod validation, orchestration
        │                       Must use: protectedProcedure
        ▼
  [Block / Protected          ← Auth, org-scope, permissions, rate-limit,
   Procedure]                   audit, plan gates, usage counting
        │                       Source: /src/trpc/procedures/protected.ts
        ▼
  [Service Layer]             ← Database access ONLY. No business logic.
        │                       Requires: import "server-only" at top
        ▼
  [Prisma / Database]         ← Schema = source of all TypeScript types
```

---

## Anti-Patterns to Always Avoid

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Create types manually for User, Org, etc. | Derive from Prisma-generated types |
| Use `any` or `unknown` | Use dynamically generated types from resources or Prisma |
| Call the database from a router or component | Use the service layer |
| Trust a docs folder to enforce architecture | Use TypeScript + ESLint + Zod as echo signals |
| Put org ID in request body | Always inject from `ctx` session |
| Build a full complex feature in one prompt | Break into prerequisite-ordered sub-tasks |
| Use `git` without explicit user instruction | Never. It's in `claude.md` as a hard rule |
| Hardcode Tailwind color classes | Use design tokens / CSS variables |
| Create a component without searching first | `grep -r "SOT:<keyword>"` before creating |
| Store secrets or API keys in code or chat | Use environment variables only |
| Create a doc file in Markdown | All documentation files are HTML |

---

## Phase Transition Checkpoints

### Phase 1 → Phase 2 (Planning → Documentation)

Do not proceed until:
- [ ] Problem and target user clearly stated
- [ ] Core user journeys described
- [ ] MVP scope defined with explicit non-goals
- [ ] Stack confirmed or proposed and acknowledged
- [ ] Security-sensitive decisions identified (auth, payments, PII)
- [ ] User says: _"Plan is finalized"_ or _"Move to Phase 2"_

### Phase 2 → Phase 3 (Documentation → Building)

Do not proceed until:
- [ ] All documentation HTML files created
- [ ] User has reviewed and approved each file individually
- [ ] All requested changes applied
- [ ] `claude/claude.md` created with correct docs file index
- [ ] User says: _"Move to Phase 3"_ or _"Start building"_

### During Phase 3 — Before Every Handover

- [ ] `tsc --noEmit` passes with zero errors
- [ ] `eslint` passes (server-only and protected-procedure rules)
- [ ] All new files have SOT keywords in their header comment
- [ ] Feature is complete end-to-end (no stubs unless Gap Method)
- [ ] New git branch created for this feature
- [ ] No duplicate types, components, or functions (grep-verified)
- [ ] All inputs validated with Zod schemas
- [ ] `protectedProcedure` used in all authenticated routers
- [ ] `docs/memory.html` updated with decisions, results, and next action
